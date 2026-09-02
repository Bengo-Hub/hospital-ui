'use client';

import { useRef, useState } from 'react';
import { AlertTriangle, CheckCircle2, Loader2, Minus, Plus, Receipt, ShoppingCart, Trash2, X } from 'lucide-react';
import { toast } from 'sonner';
import { SearchableCombobox, type ComboboxOption } from '@bengo-hub/shared-ui-lib/combobox';
import { Button, Input } from '@/components/ui/base';
import { apiErrorMessage } from '@/lib/api/error-message';
import { useCreatePrescription, useApprovePrescription, useDispensePrescription, useCollectWalkInSale } from '@/hooks/usePharmacy';
import { CollectPaymentDialog } from '@/components/billing/collect-payment-dialog';
import { WitnessConfirmForm, type ConfirmedWitness } from '@/components/pharmacy/witness-confirm-form';
import { pharmacyApi } from '@/lib/api/pharmacy';
import type { DrugSearchItem, WalkInSale } from '@/lib/api/pharmacy';

interface CartLine {
  key: string;
  sku: string; // empty = manually-entered, uncataloged item
  drug_name: string;
  dosage?: string;
  form?: string;
  quantity: number;
  unit_price: number;
  is_controlled_substance: boolean;
}

function drugToOption(item: DrugSearchItem): ComboboxOption {
  return { value: item.sku, label: item.name, hint: [item.sku, item.strength].filter(Boolean).join(' · ') };
}

type Stage = 'cart' | 'review' | 'witness' | 'collect' | 'done';

/** Chemist tier's primary "sell a drug to a walk-in customer" flow — one screen, one action
 * ("Complete Sale"), instead of the clinical New Prescription -> Approve -> Dispense -> (go
 * elsewhere to) Collect chain the rest of hospital-ui uses for a real OPD prescription. Under the
 * hood this still calls the exact same backend endpoints in the exact same order (no new API
 * surface) — this component is purely a friendlier client-side orchestration over them, with
 * clinical-safety steps (interaction review, controlled-substance witness) surfaced only when
 * the backend actually raises them, never hidden or bypassed. */
export function NewSaleModal({ orgSlug, onClose }: { orgSlug: string; onClose: () => void }) {
  const createPrescription = useCreatePrescription();
  const approvePrescription = useApprovePrescription();
  const dispensePrescription = useDispensePrescription();
  const collectWalkInSale = useCollectWalkInSale();

  const [cart, setCart] = useState<CartLine[]>([]);
  const [customerName, setCustomerName] = useState('');
  const drugCacheRef = useRef<Map<string, DrugSearchItem>>(new Map());
  const justCollectedRef = useRef(false);

  const [stage, setStage] = useState<Stage>('cart');
  const [submitting, setSubmitting] = useState(false);
  const [rxId, setRxId] = useState<string | null>(null);
  const [reviewMessage, setReviewMessage] = useState('');
  const [overrideReason, setOverrideReason] = useState('');
  const [confirmedWitness, setConfirmedWitness] = useState<ConfirmedWitness | null>(null);
  const [witnessNotice, setWitnessNotice] = useState<string | null>(null);
  const [sale, setSale] = useState<WalkInSale | null>(null);

  const total = cart.reduce((sum, l) => sum + l.quantity * l.unit_price, 0);
  const needsWitness = cart.some((l) => l.is_controlled_substance);

  const searchDrugs = async (q: string): Promise<ComboboxOption[]> => {
    const items = await pharmacyApi.searchDrugs(orgSlug, q);
    items.forEach((item) => drugCacheRef.current.set(item.sku, item));
    return items.map(drugToOption);
  };

  const addToCart = (sku: string) => {
    const item = drugCacheRef.current.get(sku);
    if (!item) return;
    setCart((prev) => {
      const existing = prev.find((l) => l.sku === sku);
      if (existing) {
        return prev.map((l) => (l.sku === sku ? { ...l, quantity: l.quantity + 1 } : l));
      }
      return [
        ...prev,
        {
          key: sku,
          sku: item.sku,
          drug_name: item.name,
          dosage: item.strength,
          form: item.dosage_form,
          quantity: 1,
          unit_price: item.selling_price ?? 0,
          is_controlled_substance: item.is_controlled_substance,
        },
      ];
    });
  };

  const addManualLine = () => {
    setCart((prev) => [
      ...prev,
      { key: `manual-${Date.now()}`, sku: '', drug_name: '', quantity: 1, unit_price: 0, is_controlled_substance: false },
    ]);
  };

  const updateLine = (key: string, patch: Partial<CartLine>) => {
    setCart((prev) => prev.map((l) => (l.key === key ? { ...l, ...patch } : l)));
  };
  const removeLine = (key: string) => setCart((prev) => prev.filter((l) => l.key !== key));

  const proceedToDispense = async (id: string, reason: string) => {
    await approvePrescription.mutateAsync({ id, arg: reason || undefined });
    if (needsWitness && !confirmedWitness) {
      setStage('witness');
      return;
    }
    await runDispense(id);
  };

  const runDispense = async (id: string) => {
    try {
      // Re-fetch for real PrescriptionLine IDs (create's own response is enough to decide
      // review/witness, but dispense needs the persisted line_id per cart entry).
      const rx = await pharmacyApi.get(orgSlug, id);
      const rxLines = rx.edges?.lines ?? [];
      const lines = cart.map((cartLine, idx) => ({
        line_id: rxLines[idx]?.id ?? '',
        quantity_to_dispense: cartLine.quantity,
        requires_witness: cartLine.is_controlled_substance || undefined,
        witness_token: cartLine.is_controlled_substance ? confirmedWitness?.token : undefined,
      }));
      await dispensePrescription.mutateAsync({
        id,
        data: { patient_name: customerName.trim() || 'Walk-in Customer', lines },
      });
      const updated = await pharmacyApi.get(orgSlug, id);
      const pendingSale = (updated.edges?.walk_in_sales ?? []).find((s) => s.status === 'pending');
      if (pendingSale) {
        setSale(pendingSale);
        setStage('collect');
      } else {
        setStage('done');
      }
    } catch (e) {
      const message = await apiErrorMessage(e, 'Failed to complete the sale');
      if (/witness/i.test(message)) {
        setConfirmedWitness(null);
        setWitnessNotice('Witness confirmation expired — please confirm again');
        setStage('witness');
        return;
      }
      toast.error(message);
    }
  };

  const startSale = async () => {
    if (cart.length === 0) {
      toast.error('Add at least one drug');
      return;
    }
    if (cart.some((l) => !l.drug_name.trim())) {
      toast.error('Enter a name for every item in the sale');
      return;
    }
    setSubmitting(true);
    try {
      const rx = await createPrescription.mutateAsync({
        patient_name: customerName.trim() || 'Walk-in Customer',
        lines: cart.map((l) => ({
          inventory_item_sku: l.sku || undefined,
          drug_name: l.drug_name.trim(),
          dosage: l.dosage,
          form: l.form,
          quantity_prescribed: l.quantity,
          unit_price: l.unit_price,
        })),
      });
      setRxId(rx.id);
      if (rx.status === 'flagged' || rx.status === 'pharmacist_review') {
        setReviewMessage(
          rx.status === 'pharmacist_review'
            ? 'A serious drug interaction was found in this combination. A pharmacist must confirm it is safe before this sale can continue.'
            : 'A possible drug interaction or allergy was found. Please review before continuing.'
        );
        setStage('review');
        return;
      }
      await proceedToDispense(rx.id, '');
    } catch (e) {
      toast.error(await apiErrorMessage(e, 'Failed to start the sale'));
    } finally {
      setSubmitting(false);
    }
  };

  const confirmReview = async () => {
    if (!overrideReason.trim() || !rxId) {
      toast.error('Enter a reason to continue');
      return;
    }
    setSubmitting(true);
    try {
      await proceedToDispense(rxId, overrideReason.trim());
    } catch (e) {
      toast.error(await apiErrorMessage(e, 'Failed to confirm the sale'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleWitnessConfirmed = async (w: ConfirmedWitness) => {
    setConfirmedWitness(w);
    setWitnessNotice(null);
    if (!rxId) return;
    setSubmitting(true);
    try {
      await runDispense(rxId);
    } finally {
      setSubmitting(false);
    }
  };

  const resetForNextSale = () => {
    setCart([]);
    setCustomerName('');
    setStage('cart');
    setRxId(null);
    setOverrideReason('');
    setReviewMessage('');
    setConfirmedWitness(null);
    setWitnessNotice(null);
    setSale(null);
  };

  // ── Collect stage renders the shared dialog full-screen in place of this modal's own chrome ──
  if (stage === 'collect' && sale) {
    return (
      <CollectPaymentDialog
        description={`Sale ${sale.sale_number}`}
        amount={sale.amount}
        onCollect={async (data) => {
          const result = await collectWalkInSale.mutateAsync({ saleId: sale.id, data });
          justCollectedRef.current = true;
          setStage('done');
          return result;
        }}
        onClose={() => {
          if (justCollectedRef.current) {
            justCollectedRef.current = false;
            return;
          }
          // A genuine cancel — the sale stays dispensed+pending, collectible later from Today's
          // Sales, so closing here loses nothing.
          onClose();
        }}
      />
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-card rounded-2xl border border-border w-full max-w-lg shadow-2xl flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center">
              <ShoppingCart className="h-4.5 w-4.5 text-primary" />
            </div>
            <div>
              <h3 className="font-bold text-base">New Sale</h3>
              <p className="text-xs text-muted-foreground">Search, add to sale, and collect payment</p>
            </div>
          </div>
          <button onClick={onClose} className="h-9 w-9 rounded-xl flex items-center justify-center hover:bg-accent">
            <X className="h-4 w-4" />
          </button>
        </div>

        {stage === 'done' ? (
          <div className="p-6 space-y-4">
            <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-center space-y-1.5">
              <CheckCircle2 className="h-8 w-8 text-emerald-600 mx-auto" />
              <p className="font-bold text-emerald-700 dark:text-emerald-400">Sale complete</p>
              {sale && <p className="text-sm text-muted-foreground">{sale.sale_number} · {sale.amount.toFixed(2)} collected</p>}
            </div>
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={onClose}>Close</Button>
              <Button className="flex-1 gap-2" onClick={resetForNextSale}>
                <Plus className="h-4 w-4" />
                Start Next Sale
              </Button>
            </div>
          </div>
        ) : stage === 'witness' ? (
          <div className="p-6 space-y-4">
            <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-3 text-sm text-amber-700 dark:text-amber-400 flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
              <span>This sale includes a controlled/scheduled item. A different staff member must confirm as witness before it can be completed.</span>
            </div>
            <WitnessConfirmForm confirmedWitness={confirmedWitness} onConfirmed={handleWitnessConfirmed} noticeMessage={witnessNotice} />
            {submitting && (
              <p className="text-xs text-muted-foreground flex items-center gap-2">
                <Loader2 className="h-3.5 w-3.5 animate-spin" /> Completing sale…
              </p>
            )}
          </div>
        ) : stage === 'review' ? (
          <div className="p-6 space-y-4">
            <div className="rounded-xl border border-red-400/30 bg-red-500/5 p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
                <p className="text-sm text-muted-foreground">{reviewMessage}</p>
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground mb-1 block">Reason to continue (required)</label>
              <textarea
                value={overrideReason}
                onChange={(e) => setOverrideReason(e.target.value)}
                rows={2}
                placeholder="e.g. Customer confirmed no known allergy, proceeding as advised…"
                className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-400/40"
              />
            </div>
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={onClose} disabled={submitting}>Cancel Sale</Button>
              <Button variant="destructive" className="flex-1 gap-2" onClick={confirmReview} disabled={submitting || !overrideReason.trim()}>
                {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                Confirm and Continue
              </Button>
            </div>
          </div>
        ) : (
          <>
            <div className="p-6 space-y-4 overflow-y-auto">
              <div>
                <label className="text-xs font-semibold text-muted-foreground mb-1 block">Customer name (optional)</label>
                <Input value={customerName} onChange={(e) => setCustomerName(e.target.value)} placeholder="Walk-in customer" />
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground mb-1 block">Add a drug</label>
                <SearchableCombobox
                  options={[]}
                  value=""
                  onChange={(value) => value && addToCart(value)}
                  onRemoteSearch={searchDrugs}
                  remoteThreshold={5}
                  placeholder="Search drugs by name…"
                  searchPlaceholder="Type at least 2 characters…"
                  emptyText="No match"
                  clearable
                />
                <button type="button" onClick={addManualLine} className="text-xs text-primary hover:underline mt-1.5">
                  + Item not in catalog
                </button>
              </div>

              {cart.length === 0 ? (
                <div className="rounded-xl border border-dashed border-border py-8 text-center text-sm text-muted-foreground">
                  No items added yet
                </div>
              ) : (
                <div className="rounded-xl border border-border divide-y divide-border">
                  {cart.map((line) => (
                    <div key={line.key} className="flex items-center gap-2 px-3 py-2.5">
                      <div className="flex-1 min-w-0">
                        {line.sku ? (
                          <p className="text-sm font-medium truncate">{line.drug_name}</p>
                        ) : (
                          <Input
                            value={line.drug_name}
                            onChange={(e) => updateLine(line.key, { drug_name: e.target.value })}
                            placeholder="Drug name"
                            className="h-8 text-sm"
                          />
                        )}
                        {line.dosage && <p className="text-[11px] text-muted-foreground">{line.dosage}</p>}
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => updateLine(line.key, { quantity: Math.max(1, line.quantity - 1) })}
                          className="h-7 w-7 rounded-lg border border-border flex items-center justify-center hover:bg-accent"
                        >
                          <Minus className="h-3 w-3" />
                        </button>
                        <span className="w-8 text-center text-sm font-mono">{line.quantity}</span>
                        <button
                          type="button"
                          onClick={() => updateLine(line.key, { quantity: line.quantity + 1 })}
                          className="h-7 w-7 rounded-lg border border-border flex items-center justify-center hover:bg-accent"
                        >
                          <Plus className="h-3 w-3" />
                        </button>
                      </div>
                      <Input
                        type="number"
                        min={0}
                        step="0.01"
                        value={line.unit_price}
                        onChange={(e) => updateLine(line.key, { unit_price: Number(e.target.value) || 0 })}
                        className="h-8 w-20 text-sm text-right shrink-0"
                      />
                      <button
                        type="button"
                        onClick={() => removeLine(line.key)}
                        className="h-7 w-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 shrink-0"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div className="rounded-xl border border-border bg-background/50 px-4 py-3 flex items-center justify-between">
                <span className="text-sm font-semibold text-muted-foreground flex items-center gap-1.5">
                  <Receipt className="h-4 w-4" /> Total
                </span>
                <span className="text-lg font-bold">{total.toFixed(2)}</span>
              </div>
            </div>

            <div className="flex gap-3 px-6 pb-6 pt-2 border-t border-border shrink-0">
              <Button variant="outline" className="flex-1" onClick={onClose} disabled={submitting}>Cancel</Button>
              <Button className="flex-1 gap-2" onClick={startSale} disabled={submitting || cart.length === 0}>
                {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                Complete Sale
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
