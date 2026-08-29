'use client';

// Sprint 2 — Consultation & Examination queue + examination/diagnosis form.
//
// Route note: the task scope for this sprint asked for a single `/consultation` page (queue +
// modal, mirroring how Triage is built), but docs/sprints/sprint-2-consultation-examination.md
// already reserves `/[orgSlug]/consultation/queue` for exactly this worklist (with a separate
// `/[orgSlug]/consultation/[visitId]` page for the examination form itself) — per that doc's own
// Definition of Done, the diagnosis picker must be "a searchable combobox … not a plain <select>".
// This page follows the doc's path for the worklist (`consultation/queue`) while keeping the
// examination form as an in-page modal (matching Patients/Triage's pattern and this sprint's
// literal task spec) rather than splitting it into its own `[visitId]` route — no such route is
// built here since nothing in the task spec calls for one.
//
// Ports the UX/interaction pattern of pos-ui's `[orgSlug]/examination/page.tsx` (queue table +
// examination modal, toast-on-success/error) onto hospital-ui's own stack. hospital-api's
// ExaminationRecord (unlike pos-ui's) carries a single diagnosis_code/diagnosis_name pair, not a
// diagnosis_codes[] array, so the picker here is a single-select SearchableCombobox (the
// platform's shared `@bengo-hub/shared-ui-lib/combobox` primitive — already wired into this repo's
// globals.css `@source`) with a free-text fallback input, not pos-ui's MultiSelect.

import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useState } from 'react';
import { toast } from 'sonner';
import { FlaskConical, Loader2, Pill, Stethoscope, X } from 'lucide-react';
import { SearchableCombobox, type ComboboxOption } from '@bengo-hub/shared-ui-lib/combobox';
import { PageHeader, EmptyState, Skeleton } from '@/components/ui/page';
import { Card } from '@/components/ui/base';
import { Can } from '@/components/auth/can';
import { VisitStatusBadge } from '@/components/clinical/visit-status-badge';
import {
  useVisits, usePatient, useRecordExamination, useDiagnosisCatalog, useCreateReferral,
} from '@/hooks/useClinical';
import { apiErrorMessage } from '@/lib/api/error-message';
import type { PatientVisit, QueueType, ReferredTo } from '@/lib/api/clinical';

const inputCls = 'w-full bg-background border border-border rounded-xl py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40';
const labelCls = 'text-xs font-semibold text-muted-foreground mb-1 block';

const QUEUE_TYPES: { value: QueueType; label: string }[] = [
  { value: 'doctor', label: 'Doctor' },
  { value: 'dental', label: 'Dental' },
  { value: 'mch', label: 'MCH' },
  { value: 'specialist', label: 'Specialist' },
];

function ExaminationModal({ visit, onClose }: { visit: PatientVisit; onClose: () => void }) {
  const { data: patient } = usePatient(visit.patient_id);
  const { data: catalog } = useDiagnosisCatalog();
  const recordExamination = useRecordExamination();
  const createReferral = useCreateReferral();

  const [queueType, setQueueType] = useState<QueueType>('doctor');
  const [chiefComplaint, setChiefComplaint] = useState(visit.chief_complaint ?? '');
  const [diagnosisCode, setDiagnosisCode] = useState('');
  const [diagnosisName, setDiagnosisName] = useState('');
  const [manualDiagnosis, setManualDiagnosis] = useState('');
  const [notes, setNotes] = useState('');
  const [referralReason, setReferralReason] = useState('');

  // Set once a save actually persisted a diagnosis — reveals the referral actions without
  // closing the modal, per "Refer to Lab/Pharmacy … available once a diagnosis is recorded".
  const [recordedDiagnosis, setRecordedDiagnosis] = useState<string | null>(null);

  const diagnosisOptions: ComboboxOption[] = (catalog ?? []).map((d) => ({
    value: d.code,
    label: d.name,
    hint: d.category,
  }));

  const handleSubmit = async (complete: boolean) => {
    const finalDiagnosisName = manualDiagnosis.trim() || diagnosisName || undefined;
    const finalDiagnosisCode = manualDiagnosis.trim() ? undefined : (diagnosisCode || undefined);

    if (complete && !finalDiagnosisName) {
      toast.error('Enter or select a diagnosis before marking as diagnosed');
      return;
    }

    try {
      await recordExamination.mutateAsync({
        visitId: visit.id,
        data: {
          queue_type: queueType,
          chief_complaint: chiefComplaint || undefined,
          diagnosis_code: finalDiagnosisCode,
          diagnosis_name: finalDiagnosisName,
          notes: notes || undefined,
          complete,
        },
      });
      if (finalDiagnosisName) {
        setRecordedDiagnosis(finalDiagnosisName);
        toast.success(complete ? 'Examination completed — diagnosis recorded' : 'Examination saved with diagnosis');
      } else {
        toast.success('Examination saved — still in progress');
        onClose();
      }
    } catch (e) {
      toast.error(await apiErrorMessage(e, 'Failed to save examination'));
    }
  };

  const handleRefer = async (referredTo: ReferredTo) => {
    try {
      await createReferral.mutateAsync({ visitId: visit.id, referredTo, reason: referralReason || undefined });
      toast.success(`Referred to ${referredTo === 'lab' ? 'Lab' : 'Pharmacy'}`);
      onClose();
    } catch (e) {
      toast.error(await apiErrorMessage(e, 'Failed to create referral'));
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-card rounded-2xl border border-border w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border sticky top-0 bg-card">
          <div>
            <h3 className="font-bold text-base">Consultation</h3>
            <p className="text-xs text-muted-foreground">{patient?.full_name ?? '…'} · {visit.visit_number}</p>
          </div>
          <button onClick={onClose} className="h-9 w-9 rounded-xl flex items-center justify-center hover:bg-accent">
            <X className="h-4 w-4" />
          </button>
        </div>

        {recordedDiagnosis ? (
          <div className="p-6 space-y-4">
            <div className="rounded-xl border border-emerald-400/30 bg-emerald-500/5 p-4 text-sm">
              <p className="font-semibold text-emerald-700 dark:text-emerald-400">Diagnosis recorded</p>
              <p className="text-muted-foreground mt-0.5">{recordedDiagnosis}</p>
            </div>
            <div>
              <label className={labelCls}>Referral reason (optional)</label>
              <input
                value={referralReason}
                onChange={(e) => setReferralReason(e.target.value)}
                className={inputCls}
                placeholder="e.g. Rule out malaria, dispense as prescribed…"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => handleRefer('lab')}
                disabled={createReferral.isPending}
                className="min-h-11 rounded-xl border border-border text-sm font-semibold hover:bg-accent transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <FlaskConical className="h-4 w-4" />
                Refer to Lab
              </button>
              <button
                onClick={() => handleRefer('pharmacy')}
                disabled={createReferral.isPending}
                className="min-h-11 rounded-xl border border-border text-sm font-semibold hover:bg-accent transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <Pill className="h-4 w-4" />
                Refer to Pharmacy
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="p-6 space-y-3">
              <div>
                <label className={labelCls}>Queue</label>
                <select value={queueType} onChange={(e) => setQueueType(e.target.value as QueueType)} className={inputCls}>
                  {QUEUE_TYPES.map((q) => (
                    <option key={q.value} value={q.value}>{q.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelCls}>Chief Complaint</label>
                <input value={chiefComplaint} onChange={(e) => setChiefComplaint(e.target.value)} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Diagnosis</label>
                <SearchableCombobox
                  options={diagnosisOptions}
                  value={diagnosisCode}
                  onChange={(value, option) => {
                    setDiagnosisCode(value);
                    setDiagnosisName(option?.label ?? value);
                  }}
                  placeholder="Search diagnosis catalogue…"
                  searchPlaceholder="Search by name or code…"
                  emptyText="No matching diagnosis — enter one manually below"
                  clearable
                />
              </div>
              <div>
                <label className={labelCls}>Or enter diagnosis manually</label>
                <input
                  value={manualDiagnosis}
                  onChange={(e) => setManualDiagnosis(e.target.value)}
                  className={inputCls}
                  placeholder="Free-text diagnosis if not in the catalogue…"
                />
                <p className="text-[11px] text-muted-foreground mt-1">
                  If filled in, this overrides the catalogue selection above.
                </p>
              </div>
              <div>
                <label className={labelCls}>Clinical Notes</label>
                <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} className={`${inputCls} resize-none`} />
              </div>
            </div>
            <div className="flex flex-col gap-2 px-6 pb-6">
              <div className="flex gap-3">
                <button onClick={onClose} className="flex-1 min-h-11 rounded-xl border border-border text-sm font-semibold hover:bg-accent transition-colors">
                  Cancel
                </button>
                <button
                  onClick={() => handleSubmit(false)}
                  disabled={recordExamination.isPending}
                  className="flex-1 min-h-11 rounded-xl border border-border text-sm font-semibold hover:bg-accent transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {recordExamination.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                  Save (still in progress)
                </button>
              </div>
              <button
                onClick={() => handleSubmit(true)}
                disabled={recordExamination.isPending}
                className="min-h-11 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {recordExamination.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                Complete & Mark Diagnosed
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function VisitRow({ visit, onExamine }: { visit: PatientVisit; onExamine: () => void }) {
  const { data: patient } = usePatient(visit.patient_id);
  return (
    <tr className="hover:bg-accent/20 transition-colors">
      <td className="px-4 py-3.5 font-mono text-xs">{visit.visit_number}</td>
      <td className="px-4 py-3.5 font-medium">{patient?.full_name ?? '…'}</td>
      <td className="px-4 py-3.5 text-muted-foreground">{visit.chief_complaint || '—'}</td>
      <td className="px-4 py-3.5"><VisitStatusBadge status={visit.status} /></td>
      <td className="px-4 py-3.5 text-right">
        <Can permission="hospital.consultation.add">
          <button
            onClick={onExamine}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 transition-colors"
          >
            <Stethoscope className="h-3.5 w-3.5" />
            Examine
          </button>
        </Can>
      </td>
    </tr>
  );
}

function ConsultationQueuePage() {
  const params = useParams();
  const orgSlug = (params?.orgSlug as string) ?? '';
  const { data: triaged, isLoading: l1 } = useVisits('triaged');
  const { data: inExamination, isLoading: l2 } = useVisits('in_examination');
  const [active, setActive] = useState<PatientVisit | null>(null);

  const isLoading = l1 || l2;
  const visits = [...(triaged ?? []), ...(inExamination ?? [])];

  return (
    <div className="max-w-7xl mx-auto">
      <PageHeader
        title="Consultation"
        subtitle="Diagnose and refer patients ready for examination"
        icon={<Stethoscope className="h-5 w-5" />}
      />

      {isLoading ? (
        <div className="space-y-2">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      ) : visits.length === 0 ? (
        <EmptyState
          icon={<Stethoscope className="h-10 w-10" />}
          title="No patients waiting for consultation"
          description="Visits appear here once vitals are recorded in Triage."
          action={
            <Link href={`/${orgSlug}/triage`} className="text-sm text-primary underline underline-offset-2">
              Go to Triage →
            </Link>
          }
        />
      ) : (
        <Card>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-accent/30">
                <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Visit #</th>
                <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Patient</th>
                <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Chief Complaint</th>
                <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Status</th>
                <th className="text-right px-4 py-3 font-semibold text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {visits.map((v) => (
                <VisitRow key={v.id} visit={v} onExamine={() => setActive(v)} />
              ))}
            </tbody>
          </table>
        </Card>
      )}

      {active && <ExaminationModal visit={active} onClose={() => setActive(null)} />}
    </div>
  );
}

export default function ConsultationQueuePageRoute() {
  return <ConsultationQueuePage />;
}
