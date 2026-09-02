'use client';

import { useRef, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Eye, Loader2, Pill, Plus, Receipt, ShieldAlert, ShoppingCart, Trash2, X } from 'lucide-react';
import { toast } from 'sonner';
import { SearchableCombobox, type ComboboxOption } from '@bengo-hub/shared-ui-lib/combobox';
import { Card, Button, Badge, Input } from '@/components/ui/base';
import { PageHeader, EmptyState, Skeleton } from '@/components/ui/page';
import { Can } from '@/components/auth/can';
import { apiErrorMessage } from '@/lib/api/error-message';
import { usePrescriptions, useCreatePrescription } from '@/hooks/usePharmacy';
import { usePatients, useVisits } from '@/hooks/useClinical';
import { useFacilityType } from '@/lib/facility-nomenclature';
import { NewSaleModal } from '@/components/pharmacy/new-sale-modal';
import { pharmacyApi } from '@/lib/api/pharmacy';
import type { CreatePrescriptionInput, DrugSearchItem, PrescriptionLineInput, PrescriptionStatus } from '@/lib/api/pharmacy';

const STATUS_LABELS: Record<PrescriptionStatus, string> = {
  pending: 'Pending',
  pharmacist_review: 'Pharmacist Review',
  flagged: 'Flagged',
  approved: 'Approved',
  locked: 'Locked',
  partially_dispensed: 'Partially Dispensed',
  dispensed: 'Dispensed',
  rejected: 'Rejected',
  cancelled: 'Cancelled',
};

const STATUS_BADGE_VARIANT: Record<PrescriptionStatus, 'default' | 'success' | 'warning' | 'error' | 'outline'> = {
  pending: 'warning',
  pharmacist_review: 'warning',
  flagged: 'error',
  approved: 'default',
  locked: 'default',
  partially_dispensed: 'warning',
  dispensed: 'success',
  rejected: 'error',
  cancelled: 'outline',
};

function PrescriptionStatusBadge({ status }: { status: PrescriptionStatus }) {
  return <Badge variant={STATUS_BADGE_VARIANT[status]}>{STATUS_LABELS[status]}</Badge>;
}

const STATUS_OPTIONS: { value: PrescriptionStatus | ''; label: string }[] = [
  { value: '', label: 'All Statuses' },
  ...(Object.keys(STATUS_LABELS) as PrescriptionStatus[]).map((s) => ({ value: s, label: STATUS_LABELS[s] })),
];

const inputCls = 'w-full bg-background border border-border rounded-xl py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40';
const labelCls = 'text-xs font-semibold text-muted-foreground mb-1 block';

interface DraftLine {
  inventory_item_sku: string;
  drug_name: string;
  dosage: string;
  form: string;
  instructions: string;
  quantity_prescribed: string;
  unit_price: string;
}

function emptyLine(): DraftLine {
  return { inventory_item_sku: '', drug_name: '', dosage: '', form: '', instructions: '', quantity_prescribed: '1', unit_price: '' };
}

// ─── New Prescription modal ─────────────────────────────────────────────────

function drugToOption(item: DrugSearchItem): ComboboxOption {
  const hintParts = [item.sku, item.strength].filter(Boolean);
  return { value: item.sku, label: item.name, hint: hintParts.join(' · ') };
}

function NewPrescriptionModal({ orgSlug, onClose }: { orgSlug: string; onClose: () => void }) {
  const createPrescription = useCreatePrescription();
  const { data: patients, isLoading: patientsLoading } = usePatients();
  const { data: visits, isLoading: visitsLoading } = useVisits();

  const [patientId, setPatientId] = useState('');
  const [visitId, setVisitId] = useState('');
  const [walkInName, setWalkInName] = useState('');
  const [patientIdNumber, setPatientIdNumber] = useState('');
  const [externalFacilityName, setExternalFacilityName] = useState('');
  const [prescriberName, setPrescriberName] = useState('');
  const [prescriberLicense, setPrescriberLicense] = useState('');
  const [allergyFlags, setAllergyFlags] = useState('');
  const [lines, setLines] = useState<DraftLine[]>([emptyLine()]);
  // Populated as SearchableCombobox's onRemoteSearch runs, so onChange (which only receives the
  // trimmed ComboboxOption) can look back up the full DrugSearchItem to auto-fill dosage/price.
  const drugCacheRef = useRef<Map<string, DrugSearchItem>>(new Map());

  const updateLine = (idx: number, field: keyof DraftLine, value: string) => {
    setLines((prev) => prev.map((l, i) => (i === idx ? { ...l, [field]: value } : l)));
  };
  const addLine = () => setLines((prev) => [...prev, emptyLine()]);
  const removeLine = (idx: number) => setLines((prev) => prev.filter((_, i) => i !== idx));
  const searchDrugs = async (q: string): Promise<ComboboxOption[]> => {
    const items = await pharmacyApi.searchDrugs(orgSlug, q);
    items.forEach((item) => drugCacheRef.current.set(item.sku, item));
    return items.map(drugToOption);
  };
  // Selecting a real catalog item auto-fills dosage/unit price — still fully editable afterward,
  // so a genuinely uncataloged item can still be entered by hand as before.
  const handleSelectDrug = (idx: number, sku: string) => {
    const item = drugCacheRef.current.get(sku);
    setLines((prev) =>
      prev.map((l, i) => {
        if (i !== idx) return l;
        if (!item) return { ...l, inventory_item_sku: sku };
        return {
          ...l,
          inventory_item_sku: item.sku,
          drug_name: item.name,
          dosage: [item.strength, item.dosage_form].filter(Boolean).join(' '),
          form: item.dosage_form ?? l.form,
          unit_price: item.selling_price != null ? String(item.selling_price) : l.unit_price,
        };
      })
    );
  };

  const handleSubmit = async () => {
    if (!prescriberName.trim()) {
      toast.error('Enter the prescriber name');
      return;
    }
    if (!patientId && !walkInName.trim()) {
      toast.error('Select a patient or enter a walk-in patient name');
      return;
    }
    const cleanedLines: PrescriptionLineInput[] = [];
    for (const l of lines) {
      if (!l.drug_name.trim()) continue;
      const qty = Number(l.quantity_prescribed);
      if (!qty || qty <= 0) {
        toast.error(`Enter a valid quantity for ${l.drug_name}`);
        return;
      }
      cleanedLines.push({
        inventory_item_sku: l.inventory_item_sku.trim() || undefined,
        drug_name: l.drug_name.trim(),
        dosage: l.dosage.trim() || undefined,
        form: l.form.trim() || undefined,
        instructions: l.instructions.trim() || undefined,
        quantity_prescribed: qty,
        unit_price: l.unit_price.trim() ? Number(l.unit_price) : undefined,
      });
    }
    if (cleanedLines.length === 0) {
      toast.error('Add at least one drug line');
      return;
    }

    const data: CreatePrescriptionInput = {
      patient_id: patientId || undefined,
      visit_id: visitId || undefined,
      external_facility_name: externalFacilityName.trim() || undefined,
      prescriber_name: prescriberName.trim(),
      prescriber_license: prescriberLicense.trim() || undefined,
      patient_name: !patientId ? walkInName.trim() : undefined,
      patient_id_number: patientIdNumber.trim() || undefined,
      allergy_flags: allergyFlags.trim()
        ? allergyFlags.split(',').map((s) => s.trim()).filter(Boolean)
        : undefined,
      lines: cleanedLines,
    };

    try {
      await createPrescription.mutateAsync(data);
      toast.success('Prescription created');
      onClose();
    } catch (e) {
      toast.error(await apiErrorMessage(e, 'Failed to create prescription'));
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-card rounded-2xl border border-border w-full max-w-2xl shadow-2xl flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center">
              <Pill className="h-4.5 w-4.5 text-primary" />
            </div>
            <div>
              <h3 className="font-bold text-base">New Prescription</h3>
              <p className="text-xs text-muted-foreground">Patient/visit are optional — leave blank for a walk-in script</p>
            </div>
          </div>
          <button onClick={onClose} className="h-9 w-9 rounded-xl flex items-center justify-center hover:bg-accent">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-6 space-y-5 overflow-y-auto">
          <div className="rounded-xl border border-border bg-background/50 p-4 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Patient</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>Registered Patient</label>
                {patientsLoading ? (
                  <Skeleton className="h-9 w-full" />
                ) : (
                  <select
                    value={patientId}
                    onChange={(e) => setPatientId(e.target.value)}
                    className={inputCls}
                  >
                    <option value="">— Walk-in (no patient record) —</option>
                    {(patients ?? []).map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.full_name} · {p.mrn}
                      </option>
                    ))}
                  </select>
                )}
              </div>
              <div>
                <label className={labelCls}>Visit (optional)</label>
                {visitsLoading ? (
                  <Skeleton className="h-9 w-full" />
                ) : (
                  <select value={visitId} onChange={(e) => setVisitId(e.target.value)} className={inputCls}>
                    <option value="">— None —</option>
                    {(visits ?? []).map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.visit_number} — {v.status.replace('_', ' ')}
                      </option>
                    ))}
                  </select>
                )}
              </div>
              {!patientId && (
                <div className="sm:col-span-2">
                  <label className={labelCls}>
                    Walk-in Patient Name <span className="text-destructive">*</span>
                  </label>
                  <Input value={walkInName} onChange={(e) => setWalkInName(e.target.value)} placeholder="Full name" />
                </div>
              )}
              <div>
                <label className={labelCls}>Patient ID Number</label>
                <Input value={patientIdNumber} onChange={(e) => setPatientIdNumber(e.target.value)} placeholder="National ID / Passport" />
              </div>
              <div>
                <label className={labelCls}>Allergy Flags</label>
                <Input value={allergyFlags} onChange={(e) => setAllergyFlags(e.target.value)} placeholder="Comma-separated, e.g. Penicillin, Sulfa" />
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-border bg-background/50 p-4 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Prescriber</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>
                  Prescriber Name <span className="text-destructive">*</span>
                </label>
                <Input value={prescriberName} onChange={(e) => setPrescriberName(e.target.value)} placeholder="Dr. Jane Doe" />
              </div>
              <div>
                <label className={labelCls}>License #</label>
                <Input value={prescriberLicense} onChange={(e) => setPrescriberLicense(e.target.value)} placeholder="LIC-12345" />
              </div>
              <div className="sm:col-span-2">
                <label className={labelCls}>Originating Facility (if external)</label>
                <Input value={externalFacilityName} onChange={(e) => setExternalFacilityName(e.target.value)} placeholder="e.g. Nairobi Hospital" />
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Drug Lines</h4>
              <Button size="sm" variant="outline" className="gap-1.5" onClick={addLine}>
                <Plus className="h-3.5 w-3.5" />
                Add Drug
              </Button>
            </div>
            {lines.map((line, idx) => (
              <div key={idx} className="rounded-xl border border-border bg-background/50 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-muted-foreground">Drug {idx + 1}</span>
                  {lines.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeLine(idx)}
                      className="h-7 w-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
                <div>
                  <label className={labelCls}>Search Catalog</label>
                  <SearchableCombobox
                    options={[]}
                    value={line.inventory_item_sku}
                    valueLabel={line.drug_name || undefined}
                    onChange={(value) => handleSelectDrug(idx, value)}
                    onRemoteSearch={searchDrugs}
                    remoteThreshold={5}
                    placeholder="Search drugs by name…"
                    searchPlaceholder="Type at least 2 characters…"
                    emptyText="No match — enter the drug manually below"
                    clearable
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className={labelCls}>
                      Drug Name <span className="text-destructive">*</span>
                    </label>
                    <Input value={line.drug_name} onChange={(e) => updateLine(idx, 'drug_name', e.target.value)} placeholder="e.g. Amoxicillin" />
                  </div>
                  <div>
                    <label className={labelCls}>Inventory SKU</label>
                    <Input value={line.inventory_item_sku} onChange={(e) => updateLine(idx, 'inventory_item_sku', e.target.value)} placeholder="Optional — auto-filled by catalog search" />
                  </div>
                  <div>
                    <label className={labelCls}>Dosage</label>
                    <Input value={line.dosage} onChange={(e) => updateLine(idx, 'dosage', e.target.value)} placeholder="e.g. 500mg" />
                  </div>
                  <div>
                    <label className={labelCls}>Form</label>
                    <Input value={line.form} onChange={(e) => updateLine(idx, 'form', e.target.value)} placeholder="e.g. Tablet" />
                  </div>
                  <div>
                    <label className={labelCls}>
                      Quantity <span className="text-destructive">*</span>
                    </label>
                    <Input
                      type="number"
                      min={1}
                      value={line.quantity_prescribed}
                      onChange={(e) => updateLine(idx, 'quantity_prescribed', e.target.value)}
                    />
                  </div>
                  <div>
                    <label className={labelCls}>Unit Price</label>
                    <Input type="number" min={0} step="0.01" value={line.unit_price} onChange={(e) => updateLine(idx, 'unit_price', e.target.value)} placeholder="0.00" />
                  </div>
                  <div className="sm:col-span-2">
                    <label className={labelCls}>Instructions</label>
                    <Input value={line.instructions} onChange={(e) => updateLine(idx, 'instructions', e.target.value)} placeholder="e.g. Take 1 tablet twice daily" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex gap-3 px-6 pb-6 pt-2 border-t border-border shrink-0">
          <Button variant="outline" className="flex-1" onClick={onClose} disabled={createPrescription.isPending}>
            Cancel
          </Button>
          <Button className="flex-1 gap-2" onClick={handleSubmit} disabled={createPrescription.isPending}>
            {createPrescription.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            Create Prescription
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── Page ───────────────────────────────────────────────────────────────────

export default function PharmacyPage() {
  const params = useParams();
  const orgSlug = params?.orgSlug as string;
  const [statusFilter, setStatusFilter] = useState<PrescriptionStatus | ''>('');
  const [createOpen, setCreateOpen] = useState(false);
  const [newSaleOpen, setNewSaleOpen] = useState(false);
  const { data: prescriptions, isLoading } = usePrescriptions(statusFilter || undefined);
  const facilityType = useFacilityType();

  const rows = prescriptions ?? [];

  return (
    <div className="max-w-7xl mx-auto">
      <PageHeader
        title="Pharmacy"
        subtitle="Prescriptions, approvals and dispensing"
        icon={<Pill className="h-5 w-5" />}
        actions={
          <>
            {facilityType === 'chemist' && (
              <Link
                href={`/${orgSlug}/pharmacy/walk-in-sales`}
                className="inline-flex items-center gap-2 border border-border bg-background text-foreground px-4 py-2.5 rounded-lg text-sm font-semibold hover:bg-accent transition-colors"
              >
                <Receipt className="h-4 w-4" />
                Today&apos;s Sales
              </Link>
            )}
            <Link
              href={`/${orgSlug}/pharmacy/controlled-substances`}
              className="inline-flex items-center gap-2 border border-border bg-background text-foreground px-4 py-2.5 rounded-lg text-sm font-semibold hover:bg-accent transition-colors"
            >
              <ShieldAlert className="h-4 w-4" />
              Controlled Substances
            </Link>
            <Can permission="hospital.pharmacy.prescribe">
              <Button className="gap-2" onClick={() => setCreateOpen(true)}>
                <Plus className="h-4 w-4" />
                {facilityType === 'chemist' ? 'Dispense External Rx' : 'New Prescription'}
              </Button>
            </Can>
            {facilityType === 'chemist' && (
              <Can permission="hospital.pharmacy.prescribe">
                <Button className="gap-2" onClick={() => setNewSaleOpen(true)}>
                  <ShoppingCart className="h-4 w-4" />
                  New Sale
                </Button>
              </Can>
            )}
          </>
        }
      />

      <div className="flex flex-wrap gap-3 mb-5">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as PrescriptionStatus | '')}
          className="bg-background border border-border rounded-xl py-2 px-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 min-w-[190px]"
        >
          {STATUS_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>

      <Card>
        {isLoading ? (
          <div className="p-6 space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        ) : rows.length === 0 ? (
          <EmptyState
            icon={<Pill className="h-10 w-10" />}
            title="No prescriptions found"
            description="Create a new prescription to get started."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-accent/30">
                  <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Rx #</th>
                  <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Patient</th>
                  <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Prescriber</th>
                  <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Status</th>
                  <th className="text-center px-4 py-3 font-semibold text-muted-foreground">Lines</th>
                  <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Date</th>
                  <th className="text-right px-4 py-3 font-semibold text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {rows.map((rx) => (
                  <tr key={rx.id} className="hover:bg-accent/20 transition-colors">
                    <td className="px-4 py-3.5 font-mono font-medium text-xs">{rx.prescription_number}</td>
                    <td className="px-4 py-3.5 font-medium">{rx.patient_name || '—'}</td>
                    <td className="px-4 py-3.5 text-muted-foreground">{rx.prescriber_name || '—'}</td>
                    <td className="px-4 py-3.5">
                      <PrescriptionStatusBadge status={rx.status} />
                    </td>
                    <td className="px-4 py-3.5 text-center text-muted-foreground">{rx.edges?.lines?.length ?? 0}</td>
                    <td className="px-4 py-3.5 text-muted-foreground">{new Date(rx.created_at).toLocaleDateString()}</td>
                    <td className="px-4 py-3.5 text-right">
                      <Link
                        href={`/${orgSlug}/pharmacy/${rx.id}`}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-xs font-medium hover:bg-accent transition-colors"
                      >
                        <Eye className="h-3.5 w-3.5" />
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {createOpen && <NewPrescriptionModal orgSlug={orgSlug} onClose={() => setCreateOpen(false)} />}
      {newSaleOpen && <NewSaleModal orgSlug={orgSlug} onClose={() => setNewSaleOpen(false)} />}
    </div>
  );
}
