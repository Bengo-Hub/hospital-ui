'use client';

// Medication Administration Record (MAR) panel for the admission detail page — nurse charts each
// dose event on-demand against the admission's active prescriptions (see hospital-api's mar.
// Service.ChartDose doc comment: this codebase has no dosing-frequency data model to auto-generate
// a schedule of future dose slots from, so "chart a dose" is the MVP unit of work, not "check off a
// pre-populated slot"). mvp-gap-backlog-2026-09-02.md Sprint 4 item 1.

import { useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import { toast } from 'sonner';
import { Loader2, Pill, Plus, X } from 'lucide-react';
import { Card, Button, Badge } from '@/components/ui/base';
import { Can } from '@/components/auth/can';
import { apiErrorMessage } from '@/lib/api/error-message';
import { useMedicationAdministrations, useActivePrescriptionsForMar, useChartDose } from '@/hooks/useMar';
import { useAdmission } from '@/hooks/useInpatient';
import { NewPrescriptionModal } from '@/components/pharmacy/new-prescription-modal';
import type { MarStatus, ChartDoseInput } from '@/lib/api/mar';

const STATUS_BADGE: Record<MarStatus, { variant: 'default' | 'success' | 'warning' | 'error' | 'outline'; label: string }> = {
  scheduled: { variant: 'outline', label: 'Scheduled' },
  given: { variant: 'success', label: 'Given' },
  refused: { variant: 'warning', label: 'Refused' },
  missed: { variant: 'error', label: 'Missed' },
  held: { variant: 'warning', label: 'Held' },
};

const STATUS_OPTIONS: { value: ChartDoseInput['status']; label: string }[] = [
  { value: 'given', label: 'Given' },
  { value: 'refused', label: 'Refused' },
  { value: 'missed', label: 'Missed' },
  { value: 'held', label: 'Held' },
];

const inputCls = 'w-full bg-background border border-border rounded-lg py-1.5 px-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-primary/40';

function ChartDoseForm({ admissionId, onClose }: { admissionId: string; onClose: () => void }) {
  const params = useParams();
  const orgSlug = params?.orgSlug as string;
  const { data: admission } = useAdmission(admissionId);
  const { data: prescriptions, isLoading } = useActivePrescriptionsForMar(admissionId);
  const chartDose = useChartDose();
  const [lineId, setLineId] = useState('');
  const [status, setStatus] = useState<ChartDoseInput['status']>('given');
  const [notes, setNotes] = useState('');
  const [showPrescriptionModal, setShowPrescriptionModal] = useState(false);

  const lineOptions = useMemo(
    () =>
      (prescriptions ?? []).flatMap((rx) =>
        (rx.edges?.lines ?? []).map((l) => ({ id: l.id, label: `${l.drug_name}${l.dosage ? ` — ${l.dosage}` : ''} (${rx.prescription_number})` })),
      ),
    [prescriptions],
  );

  const handleSubmit = async () => {
    if (!lineId) {
      toast.error('Select a medication line');
      return;
    }
    try {
      await chartDose.mutateAsync({ admissionId, data: { prescription_line_id: lineId, status, notes: notes.trim() || undefined } });
      toast.success('Dose charted');
      onClose();
    } catch (e) {
      toast.error(await apiErrorMessage(e, 'Failed to chart dose'));
    }
  };

  return (
    <div className="rounded-xl border border-border bg-background/50 p-3 space-y-2.5 mb-3">
      <div>
        <label className="text-[11px] font-semibold text-muted-foreground mb-0.5 block">Medication</label>
        {isLoading ? (
          <p className="text-xs text-muted-foreground">Loading…</p>
        ) : lineOptions.length === 0 ? (
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs text-muted-foreground">No active prescriptions for this admission's visit.</p>
            <Button size="sm" variant="outline" className="gap-1.5 shrink-0" onClick={() => setShowPrescriptionModal(true)}>
              <Plus className="h-3.5 w-3.5" />
              Write a prescription
            </Button>
          </div>
        ) : (
          <select value={lineId} onChange={(e) => setLineId(e.target.value)} className={inputCls}>
            <option value="">Select…</option>
            {lineOptions.map((o) => (
              <option key={o.id} value={o.id}>{o.label}</option>
            ))}
          </select>
        )}
      </div>
      <div className="flex gap-3">
        {STATUS_OPTIONS.map((o) => (
          <label key={o.value} className="text-xs font-medium flex items-center gap-1">
            <input type="radio" name="mar-status" checked={status === o.value} onChange={() => setStatus(o.value)} />
            {o.label}
          </label>
        ))}
      </div>
      <input placeholder="Notes (optional)" value={notes} onChange={(e) => setNotes(e.target.value)} className={inputCls} />
      <div className="flex gap-2 justify-end">
        <Button size="sm" variant="outline" onClick={onClose}>Cancel</Button>
        <Button size="sm" className="gap-1.5" onClick={handleSubmit} disabled={chartDose.isPending}>
          {chartDose.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
          Chart Dose
        </Button>
      </div>
      {showPrescriptionModal && admission && (
        <NewPrescriptionModal
          orgSlug={orgSlug}
          initialPatientId={admission.patient_id}
          initialVisitId={admission.patient_visit_id}
          onClose={() => setShowPrescriptionModal(false)}
        />
      )}
    </div>
  );
}

export function MarPanel({ admissionId }: { admissionId: string }) {
  const { data: entries, isLoading } = useMedicationAdministrations(admissionId);
  const [showForm, setShowForm] = useState(false);

  return (
    <Card>
      <div className="p-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold flex items-center gap-2">
            <Pill className="h-4 w-4 text-muted-foreground" />
            Medication Administration Record
          </h3>
          <Can permission="hospital.inpatient.add">
            <Button size="sm" variant="outline" className="gap-1.5" onClick={() => setShowForm((v) => !v)}>
              <Plus className="h-3.5 w-3.5" />
              Chart a dose
            </Button>
          </Can>
        </div>

        {showForm && <ChartDoseForm admissionId={admissionId} onClose={() => setShowForm(false)} />}

        {isLoading ? (
          <p className="text-xs text-muted-foreground">Loading…</p>
        ) : (entries ?? []).length === 0 ? (
          <p className="text-xs text-muted-foreground">No doses charted yet for this admission.</p>
        ) : (
          <div className="space-y-1.5">
            {(entries ?? []).map((e) => (
              <div key={e.id} className="flex items-center justify-between text-xs border-b border-border/60 pb-1.5 last:border-0">
                <div className="flex items-center gap-2">
                  <Badge variant={STATUS_BADGE[e.status].variant}>{STATUS_BADGE[e.status].label}</Badge>
                  {e.notes && <span className="text-muted-foreground">{e.notes}</span>}
                </div>
                <span className="text-muted-foreground">
                  {new Date(e.administered_at ?? e.scheduled_time).toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </Card>
  );
}
