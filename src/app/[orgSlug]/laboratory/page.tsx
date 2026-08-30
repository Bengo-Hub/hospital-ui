'use client';

import { useEffect, useMemo, useState } from 'react';
import { FlaskConical, Loader2, Plus, ShieldCheck, Zap, X } from 'lucide-react';
import { toast } from 'sonner';
import { Card, Button, Badge, Input } from '@/components/ui/base';
import { PageHeader, EmptyState, Skeleton } from '@/components/ui/page';
import { Can } from '@/components/auth/can';
import { useAppPermissions } from '@/hooks/use-app-permissions';
import { apiErrorMessage } from '@/lib/api/error-message';
import {
  useLabWorklist,
  useLabOrder,
  useLabTestCatalog,
  useCreateLabOrder,
  useActivateLabOrder,
  useEnterLabResult,
  useSubmitLabInsuranceClaim,
} from '@/hooks/useLab';
import { useVisits } from '@/hooks/useClinical';
import { InsuranceClaimModal } from '@/components/billing/insurance-claim-modal';
import type { LabOrder, LabOrderStatus, ResultFlag } from '@/lib/api/lab';

const STATUS_OPTIONS: { value: LabOrderStatus | ''; label: string }[] = [
  { value: '', label: 'All Statuses' },
  { value: 'requested', label: 'Requested' },
  { value: 'awaiting_payment', label: 'Awaiting Payment' },
  { value: 'resulted', label: 'Resulted' },
  { value: 'cancelled', label: 'Cancelled' },
];

const STATUS_BADGE: Record<LabOrderStatus, { variant: 'default' | 'success' | 'warning' | 'error' | 'outline'; label: string }> = {
  requested: { variant: 'outline', label: 'Requested' },
  awaiting_payment: { variant: 'warning', label: 'Awaiting Payment' },
  resulted: { variant: 'success', label: 'Resulted' },
  cancelled: { variant: 'outline', label: 'Cancelled' },
};

function LabStatusBadge({ status }: { status: LabOrderStatus }) {
  const cfg = STATUS_BADGE[status];
  return <Badge variant={cfg.variant}>{cfg.label}</Badge>;
}

const FLAGS: { value: ResultFlag; label: string; cls: string }[] = [
  { value: 'normal', label: 'Normal', cls: 'text-green-600' },
  { value: 'abnormal', label: 'Abnormal', cls: 'text-orange-600' },
  { value: 'critical', label: 'Critical', cls: 'text-red-600' },
];

const inputCls = 'w-full bg-background border border-border rounded-lg py-1.5 px-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-primary/40';

// ─── New Order modal ────────────────────────────────────────────────────────

function NewOrderModal({ onClose }: { onClose: () => void }) {
  const { data: visits, isLoading: visitsLoading } = useVisits();
  const { data: catalog, isLoading: catalogLoading } = useLabTestCatalog();
  const createOrder = useCreateLabOrder();

  const [visitId, setVisitId] = useState('');
  const [selectedCodes, setSelectedCodes] = useState<Set<string>>(new Set());
  const [testSearch, setTestSearch] = useState('');
  const [notes, setNotes] = useState('');

  const filteredCatalog = useMemo(() => {
    const rows = catalog ?? [];
    const q = testSearch.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((t) => t.name.toLowerCase().includes(q) || t.code.toLowerCase().includes(q));
  }, [catalog, testSearch]);

  const toggleCode = (code: string) => {
    setSelectedCodes((prev) => {
      const next = new Set(prev);
      if (next.has(code)) next.delete(code);
      else next.add(code);
      return next;
    });
  };

  const handleSubmit = async () => {
    if (!visitId) {
      toast.error('Select a visit');
      return;
    }
    if (selectedCodes.size === 0) {
      toast.error('Select at least one test');
      return;
    }
    try {
      await createOrder.mutateAsync({
        visit_id: visitId,
        test_codes: Array.from(selectedCodes),
        notes: notes.trim() || undefined,
      });
      toast.success('Lab order created');
      onClose();
    } catch (e) {
      toast.error(await apiErrorMessage(e, 'Failed to create lab order'));
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-card rounded-2xl border border-border w-full max-w-xl shadow-2xl flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center">
              <FlaskConical className="h-4.5 w-4.5 text-primary" />
            </div>
            <div>
              <h3 className="font-bold text-base">New Lab Order</h3>
              <p className="text-xs text-muted-foreground">Select a visit and the tests to order</p>
            </div>
          </div>
          <button onClick={onClose} className="h-9 w-9 rounded-xl flex items-center justify-center hover:bg-accent">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-6 space-y-4 overflow-y-auto">
          <div>
            <label className="text-xs font-semibold text-muted-foreground mb-1 block">
              Visit <span className="text-destructive">*</span>
            </label>
            {visitsLoading ? (
              <Skeleton className="h-9 w-full" />
            ) : (
              <select
                value={visitId}
                onChange={(e) => setVisitId(e.target.value)}
                className="w-full bg-background border border-border rounded-xl py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
              >
                <option value="">Select visit…</option>
                {(visits ?? []).map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.visit_number} — {v.status.replace('_', ' ')}
                  </option>
                ))}
              </select>
            )}
          </div>

          <div>
            <label className="text-xs font-semibold text-muted-foreground mb-1 block">
              Tests <span className="text-destructive">*</span>
            </label>
            <Input
              placeholder="Search tests by name or code…"
              value={testSearch}
              onChange={(e) => setTestSearch(e.target.value)}
              className="mb-2"
            />
            {catalogLoading ? (
              <Skeleton className="h-32 w-full" />
            ) : filteredCatalog.length === 0 ? (
              <p className="text-xs text-muted-foreground py-4 text-center">No tests found</p>
            ) : (
              <div className="max-h-56 overflow-y-auto rounded-xl border border-border divide-y divide-border">
                {filteredCatalog.map((t) => (
                  <label
                    key={t.code}
                    className="flex items-center gap-3 px-3 py-2 text-sm cursor-pointer hover:bg-accent/40 transition-colors"
                  >
                    <input
                      type="checkbox"
                      checked={selectedCodes.has(t.code)}
                      onChange={() => toggleCode(t.code)}
                      className="h-4 w-4 rounded border-border"
                    />
                    <span className="flex-1 min-w-0">
                      <span className="font-medium">{t.name}</span>
                      <span className="text-muted-foreground ml-2 text-xs font-mono">{t.code}</span>
                    </span>
                    <span className="text-xs text-muted-foreground shrink-0">{t.price.toFixed(2)}</span>
                  </label>
                ))}
              </div>
            )}
            {selectedCodes.size > 0 && (
              <p className="text-xs text-muted-foreground mt-1.5">{selectedCodes.size} test(s) selected</p>
            )}
          </div>

          <div>
            <label className="text-xs font-semibold text-muted-foreground mb-1 block">Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              placeholder="Any additional notes…"
              className="w-full bg-background border border-border rounded-xl py-2 px-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>
        </div>

        <div className="flex gap-3 px-6 pb-6 pt-2 border-t border-border shrink-0">
          <Button variant="outline" className="flex-1" onClick={onClose} disabled={createOrder.isPending}>
            Cancel
          </Button>
          <Button className="flex-1 gap-2" onClick={handleSubmit} disabled={createOrder.isPending}>
            {createOrder.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            Create Order
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── Results entry modal ────────────────────────────────────────────────────

interface ResultDraft {
  result_value: string;
  unit: string;
  reference_range: string;
  flag: ResultFlag;
  notes: string;
}

function ResultsModal({ order, onClose }: { order: LabOrder; onClose: () => void }) {
  const { data, isLoading } = useLabOrder(order.id);
  const enterResult = useEnterLabResult();
  const [values, setValues] = useState<Record<string, ResultDraft>>({});

  useEffect(() => {
    if (!data?.lines) return;
    setValues((prev) => {
      const next = { ...prev };
      data.lines.forEach((l) => {
        if (!next[l.id]) {
          next[l.id] = {
            result_value: l.result_value ?? '',
            unit: l.unit ?? '',
            reference_range: l.reference_range ?? '',
            flag: l.flag === 'pending' ? 'normal' : l.flag,
            notes: l.notes ?? '',
          };
        }
      });
      return next;
    });
  }, [data]);

  const setField = (lineId: string, field: keyof ResultDraft, value: string) => {
    setValues((prev) => ({ ...prev, [lineId]: { ...prev[lineId], [field]: value } as ResultDraft }));
  };

  const handleSubmit = async () => {
    const lines = data?.lines ?? [];
    const toSubmit = lines.filter((l) => values[l.id]?.result_value?.trim());
    if (toSubmit.length === 0) {
      toast.error('Enter at least one result');
      return;
    }
    try {
      await Promise.all(
        toSubmit.map((l) =>
          enterResult.mutateAsync({
            lineId: l.id,
            data: {
              result_value: values[l.id].result_value.trim(),
              unit: values[l.id].unit.trim() || undefined,
              reference_range: values[l.id].reference_range.trim() || undefined,
              flag: values[l.id].flag,
              notes: values[l.id].notes.trim() || undefined,
            },
          }),
        ),
      );
      toast.success('Results submitted');
      onClose();
    } catch (e) {
      toast.error(await apiErrorMessage(e, 'Failed to submit results'));
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-card rounded-2xl border border-border w-full max-w-xl shadow-2xl flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
          <div>
            <h3 className="font-bold text-base">Lab Results</h3>
            <p className="text-xs text-muted-foreground">Visit {data?.order.visit_id ?? order.visit_id}</p>
          </div>
          <button onClick={onClose} className="h-9 w-9 rounded-xl flex items-center justify-center hover:bg-accent">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="p-6 space-y-4 overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center h-24 gap-3">
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
              <span className="text-sm text-muted-foreground">Loading lines…</span>
            </div>
          ) : (data?.lines ?? []).length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">No test lines on this order</p>
          ) : (
            (data?.lines ?? []).map((l) => (
              <div key={l.id} className="rounded-xl border border-border bg-background/50 p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-bold">
                    {l.test_name} <span className="text-xs text-muted-foreground font-normal font-mono">{l.test_code}</span>
                  </p>
                  {l.flag !== 'pending' && <LabFlagBadge flag={l.flag} />}
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <input
                    placeholder="Result"
                    value={values[l.id]?.result_value ?? ''}
                    onChange={(e) => setField(l.id, 'result_value', e.target.value)}
                    className={inputCls}
                  />
                  <input
                    placeholder="Unit"
                    value={values[l.id]?.unit ?? ''}
                    onChange={(e) => setField(l.id, 'unit', e.target.value)}
                    className={inputCls}
                  />
                  <input
                    placeholder="Reference range"
                    value={values[l.id]?.reference_range ?? ''}
                    onChange={(e) => setField(l.id, 'reference_range', e.target.value)}
                    className={inputCls}
                  />
                </div>
                <div className="flex gap-3">
                  {FLAGS.map((f) => (
                    <label key={f.value} className={`text-xs font-medium flex items-center gap-1 ${f.cls}`}>
                      <input
                        type="radio"
                        name={`flag-${l.id}`}
                        checked={values[l.id]?.flag === f.value}
                        onChange={() => setField(l.id, 'flag', f.value)}
                      />
                      {f.label}
                    </label>
                  ))}
                </div>
                <input
                  placeholder="Notes (optional)"
                  value={values[l.id]?.notes ?? ''}
                  onChange={(e) => setField(l.id, 'notes', e.target.value)}
                  className={inputCls}
                />
              </div>
            ))
          )}
        </div>
        <div className="flex gap-3 px-6 pb-6 pt-2 border-t border-border shrink-0">
          <Button variant="outline" className="flex-1" onClick={onClose}>
            Cancel
          </Button>
          <Button className="flex-1 gap-2" onClick={handleSubmit} disabled={enterResult.isPending}>
            {enterResult.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            Submit Results
          </Button>
        </div>
      </div>
    </div>
  );
}

function LabFlagBadge({ flag }: { flag: ResultFlag }) {
  const variant = flag === 'critical' ? 'error' : flag === 'abnormal' ? 'warning' : flag === 'normal' ? 'success' : 'outline';
  return <Badge variant={variant}>{flag}</Badge>;
}

// ─── Page ───────────────────────────────────────────────────────────────────

export default function LaboratoryPage() {
  const [statusFilter, setStatusFilter] = useState<LabOrderStatus | ''>('');
  const [createOpen, setCreateOpen] = useState(false);
  const [resultsOrder, setResultsOrder] = useState<LabOrder | null>(null);
  const [insuranceOrder, setInsuranceOrder] = useState<LabOrder | null>(null);
  const { data: orders, isLoading } = useLabWorklist(statusFilter || undefined);
  const activate = useActivateLabOrder();
  const submitInsuranceClaim = useSubmitLabInsuranceClaim();
  const { can } = useAppPermissions();

  const handleActivate = async (order: LabOrder) => {
    try {
      await activate.mutateAsync(order.id);
      toast.success('Lab order activated');
    } catch (e) {
      toast.error(await apiErrorMessage(e, 'Failed to activate lab order — confirm the linked charge has been paid'));
    }
  };

  const rows = orders ?? [];

  return (
    <div className="max-w-7xl mx-auto">
      <PageHeader
        title="Laboratory"
        subtitle="Lab order worklist, activation and result entry"
        icon={<FlaskConical className="h-5 w-5" />}
        actions={
          <Can permission="hospital.lab.add">
            <Button className="gap-2" onClick={() => setCreateOpen(true)}>
              <Plus className="h-4 w-4" />
              New Order
            </Button>
          </Can>
        }
      />

      <div className="flex flex-wrap gap-3 mb-5">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as LabOrderStatus | '')}
          className="bg-background border border-border rounded-xl py-2 px-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 min-w-[180px]"
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
            icon={<FlaskConical className="h-10 w-10" />}
            title="No lab orders found"
            description="Orders created from a visit will appear here."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-accent/30">
                  <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Visit</th>
                  <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Status</th>
                  <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Notes</th>
                  <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Ordered</th>
                  <th className="text-right px-4 py-3 font-semibold text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {rows.map((o) => (
                  <tr key={o.id} className="hover:bg-accent/20 transition-colors">
                    <td className="px-4 py-3.5 font-mono text-xs">{o.visit_id}</td>
                    <td className="px-4 py-3.5">
                      <LabStatusBadge status={o.status} />
                    </td>
                    <td className="px-4 py-3.5 text-muted-foreground text-xs max-w-[240px] truncate">{o.notes || '—'}</td>
                    <td className="px-4 py-3.5 text-muted-foreground text-xs whitespace-nowrap">
                      {new Date(o.ordered_at).toLocaleString()}
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center justify-end gap-2">
                        {o.status === 'awaiting_payment' && (
                          <>
                            <Can permission="hospital.lab.change">
                              <Button
                                size="sm"
                                variant="secondary"
                                className="gap-1.5"
                                onClick={() => handleActivate(o)}
                                disabled={activate.isPending}
                              >
                                {activate.isPending ? (
                                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                ) : (
                                  <Zap className="h-3.5 w-3.5" />
                                )}
                                Activate
                              </Button>
                            </Can>
                            <Can permission={['hospital.lab.add', 'hospital.billing.collect_own', 'hospital.billing.collect_any']}>
                              <Button size="sm" variant="outline" className="gap-1.5" onClick={() => setInsuranceOrder(o)}>
                                <ShieldCheck className="h-3.5 w-3.5" />
                                Bill to Insurance
                              </Button>
                            </Can>
                          </>
                        )}
                        {(o.status === 'requested' || o.status === 'resulted') && can('hospital.lab.change') && (
                          <Button size="sm" className="gap-1.5" onClick={() => setResultsOrder(o)}>
                            <FlaskConical className="h-3.5 w-3.5" />
                            {o.status === 'resulted' ? 'Edit Results' : 'Enter Results'}
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {createOpen && <NewOrderModal onClose={() => setCreateOpen(false)} />}
      {resultsOrder && <ResultsModal order={resultsOrder} onClose={() => setResultsOrder(null)} />}
      {insuranceOrder && (
        <InsuranceClaimModal
          title={`Lab order — ${insuranceOrder.visit_id}`}
          onSubmit={async (input) => {
            const res = await submitInsuranceClaim.mutateAsync({ orderId: insuranceOrder.id, data: input });
            return res.claim;
          }}
          onClose={() => setInsuranceOrder(null)}
        />
      )}
    </div>
  );
}
