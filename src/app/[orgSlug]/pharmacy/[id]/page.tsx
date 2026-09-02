'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  AlertTriangle,
  ArrowLeft,
  Ban,
  CheckCircle2,
  Loader2,
  Lock,
  Pill,
  Printer,
  RefreshCw,
  ShieldAlert,
  ShieldCheck,
  X,
  XCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import { PdfPreview, useDocumentPreview } from '@bengo-hub/shared-ui-lib/documents';
import { cn } from '@/lib/utils';
import { Card, Button, Badge, Input } from '@/components/ui/base';
import { EmptyState, Skeleton } from '@/components/ui/page';
import { Can } from '@/components/auth/can';
import { apiErrorMessage } from '@/lib/api/error-message';
import {
  usePrescription,
  useApprovePrescription,
  useLockPrescription,
  useRejectPrescription,
  useCancelPrescription,
  useDispensePrescription,
  useSubmitPharmacyInsuranceClaim,
  useRecheckInteractions,
} from '@/hooks/usePharmacy';
import { InsuranceClaimModal } from '@/components/billing/insurance-claim-modal';
import { VisitChargesPanel } from '@/components/billing/visit-charges-panel';
import { WalkInSalePanel } from '@/components/pharmacy/walk-in-sale-panel';
import { WitnessConfirmForm, type ConfirmedWitness } from '@/components/pharmacy/witness-confirm-form';
import { pharmacyApi } from '@/lib/api/pharmacy';
import type { DispenseLineInput, PrescriptionStatus, InteractionCheck } from '@/lib/api/pharmacy';

const STATUS_LABELS: Record<PrescriptionStatus, string> = {
  pending: 'Pending',
  pharmacist_review: 'Pharmacist Review',
  flagged: 'Flagged — Review Required',
  approved: 'Approved',
  locked: 'Locked for Dispense',
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

function StatusBadge({ status }: { status: PrescriptionStatus }) {
  return <Badge variant={STATUS_BADGE_VARIANT[status]}>{STATUS_LABELS[status]}</Badge>;
}

const TERMINAL_STATUSES: PrescriptionStatus[] = ['dispensed', 'rejected', 'cancelled'];

interface DispenseDraft {
  quantity: string;
  requiresWitness: boolean;
}

function RecheckModal({ prescriptionId, onClose }: { prescriptionId: string; onClose: () => void }) {
  const recheck = useRecheckInteractions();
  const [allergyInput, setAllergyInput] = useState('');
  const [result, setResult] = useState<InteractionCheck | null>(null);

  const handleRun = async () => {
    try {
      const allergyFlags = allergyInput.split(',').map((a) => a.trim()).filter(Boolean);
      const res = await recheck.mutateAsync({ id: prescriptionId, allergyFlags: allergyFlags.length ? allergyFlags : undefined });
      setResult(res.check);
      if (res.check.result === 'clear') toast.success('No interactions found');
      else toast.warning('New findings — review before dispensing');
    } catch (e) {
      toast.error(await apiErrorMessage(e, 'Failed to re-check interactions'));
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-card rounded-2xl border border-border w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h3 className="font-bold text-base">Re-check Interactions</h3>
          <button onClick={onClose} className="h-9 w-9 rounded-xl flex items-center justify-center hover:bg-accent">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="p-6 space-y-4">
          {result ? (
            <div className={`rounded-xl border px-4 py-3 text-sm ${result.result === 'clear' ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-600' : 'border-amber-500/30 bg-amber-500/10 text-amber-600'}`}>
              {result.result === 'clear'
                ? 'No interactions or allergy matches found against the current lines.'
                : `${result.result === 'allergy_match' ? 'Allergy match' : 'Interaction'} found — the prescription has been re-flagged for review if it was still pre-dispense.`}
            </div>
          ) : (
            <div>
              <label className="text-xs font-semibold text-muted-foreground mb-1 block">
                Newly-disclosed allergies (comma-separated, optional)
              </label>
              <Input value={allergyInput} onChange={(e) => setAllergyInput(e.target.value)} placeholder="e.g. penicillin, sulfa" />
              <p className="text-[11px] text-muted-foreground mt-1.5">
                Re-checks the prescription's current lines against inventory's interaction engine. Merged with any allergies already on file.
              </p>
            </div>
          )}
        </div>
        <div className="flex gap-3 px-6 pb-6">
          <Button variant="outline" className="flex-1" onClick={onClose} disabled={recheck.isPending}>
            {result ? 'Close' : 'Cancel'}
          </Button>
          {!result && (
            <Button className="flex-1 gap-2" onClick={handleRun} disabled={recheck.isPending}>
              {recheck.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Run Check
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

export default function PrescriptionDetailPage() {
  const params = useParams();
  const orgSlug = params?.orgSlug as string;
  const id = params?.id as string;

  const { data: rx, isLoading } = usePrescription(id);
  const approve = useApprovePrescription();
  const lock = useLockPrescription();
  const reject = useRejectPrescription();
  const cancelRx = useCancelPrescription();
  const dispense = useDispensePrescription();
  const submitInsuranceClaim = useSubmitPharmacyInsuranceClaim();
  const { openPreview, previewProps } = useDocumentPreview({ onError: (m) => toast.error(m) });
  const printLabel = (lineId: string, fileName: string) => {
    openPreview(() => pharmacyApi.downloadLabel(orgSlug, id, lineId), { fileName: `${fileName}.pdf`, title: 'Dispensing Label' });
  };

  const [overrideReason, setOverrideReason] = useState('');
  const [showInsurance, setShowInsurance] = useState(false);
  const [showRecheck, setShowRecheck] = useState(false);
  const [showReject, setShowReject] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [showCancel, setShowCancel] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [showDispense, setShowDispense] = useState(false);
  const [dispenseDraft, setDispenseDraft] = useState<Record<string, DispenseDraft>>({});
  // One witness confirmation covers every witness-requiring line in this dispense action (see
  // witness-confirm-form.tsx's doc comment on ConfirmedWitness for why) — never persisted, held
  // only for the lifetime of this open modal.
  const [confirmedWitness, setConfirmedWitness] = useState<ConfirmedWitness | null>(null);
  const [witnessNotice, setWitnessNotice] = useState<string | null>(null);

  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto space-y-4">
        <Skeleton className="h-9 w-64" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!rx) {
    return (
      <div className="max-w-3xl mx-auto">
        <EmptyState
          icon={<Pill className="h-10 w-10" />}
          title="Prescription not found"
          action={
            <Link href={`/${orgSlug}/pharmacy`} className="text-sm text-primary underline">
              Back to Pharmacy
            </Link>
          }
        />
      </div>
    );
  }

  const lines = rx.edges?.lines ?? [];

  const openDispense = () => {
    const initial: Record<string, DispenseDraft> = {};
    lines.forEach((l) => {
      const remaining = l.quantity_prescribed - l.quantity_dispensed;
      if (remaining > 0) {
        initial[l.id] = { quantity: String(remaining), requiresWitness: false };
      }
    });
    setDispenseDraft(initial);
    setConfirmedWitness(null);
    setWitnessNotice(null);
    setShowDispense(true);
  };

  const handleApprove = async (reason?: string) => {
    try {
      await approve.mutateAsync({ id: rx.id, arg: reason });
      toast.success('Prescription approved');
      setOverrideReason('');
    } catch (e) {
      toast.error(await apiErrorMessage(e, 'Failed to approve prescription'));
    }
  };

  const handleLock = async () => {
    try {
      await lock.mutateAsync({ id: rx.id });
      toast.success('Prescription locked for dispensing');
    } catch (e) {
      toast.error(await apiErrorMessage(e, 'Failed to lock prescription'));
    }
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) return;
    try {
      await reject.mutateAsync({ id: rx.id, arg: rejectReason.trim() });
      toast.success('Prescription rejected');
      setShowReject(false);
      setRejectReason('');
    } catch (e) {
      toast.error(await apiErrorMessage(e, 'Failed to reject prescription'));
    }
  };

  const handleCancel = async () => {
    if (!cancelReason.trim()) return;
    try {
      await cancelRx.mutateAsync({ id: rx.id, arg: cancelReason.trim() });
      toast.success('Prescription cancelled');
      setShowCancel(false);
      setCancelReason('');
    } catch (e) {
      toast.error(await apiErrorMessage(e, 'Failed to cancel prescription'));
    }
  };

  const anyLineRequiresWitness = Object.values(dispenseDraft).some((d) => d.requiresWitness);

  const handleDispense = async () => {
    if (anyLineRequiresWitness && !confirmedWitness) {
      toast.error('Confirm a witness before dispensing a controlled/scheduled substance line');
      return;
    }
    const dispenseLines: DispenseLineInput[] = [];
    for (const [lineId, draft] of Object.entries(dispenseDraft)) {
      const qty = Number(draft.quantity);
      if (!qty || qty <= 0) continue;
      dispenseLines.push({
        line_id: lineId,
        quantity_to_dispense: qty,
        requires_witness: draft.requiresWitness || undefined,
        // The SAME confirmed witness token is sent for every witnessed line — see
        // witness-confirm-form.tsx's ConfirmedWitness doc comment for why one confirmation
        // covers the whole dispense action.
        witness_token: draft.requiresWitness ? confirmedWitness?.token : undefined,
      });
    }
    if (dispenseLines.length === 0) {
      toast.error('Enter a quantity to dispense for at least one drug line');
      return;
    }
    try {
      const updated = await dispense.mutateAsync({
        id: rx.id,
        data: { patient_name: rx.patient_name, lines: dispenseLines },
      });
      setShowDispense(false);
      toast.success(updated.status === 'partially_dispensed' ? 'Partial dispense recorded' : 'Prescription dispensed');
    } catch (e) {
      const message = await apiErrorMessage(e, 'Failed to dispense prescription');
      // The witness token is only valid for 120s (see VerifyWitness's expires_in) — if the
      // pharmacist took longer than that to submit, hospital-api rejects it at dispense time
      // rather than a generic failure. Surface that as a clear, actionable prompt to re-confirm
      // instead of a generic error toast, and drop back to the credentials form.
      if (/witness/i.test(message)) {
        setConfirmedWitness(null);
        setWitnessNotice('Witness confirmation expired, please confirm again');
        toast.error('Witness confirmation expired, please confirm again');
        return;
      }
      toast.error(message);
    }
  };

  const canApprove = rx.status === 'pending' || rx.status === 'flagged' || rx.status === 'pharmacist_review';
  const canLock = rx.status === 'approved';
  const canDispense = rx.status === 'approved' || rx.status === 'locked' || rx.status === 'partially_dispensed';
  const canRejectOrCancel = !TERMINAL_STATUSES.includes(rx.status) && rx.status !== 'partially_dispensed';
  // Insurance settles a dispensed line's charge instead of cash — only makes sense once at
  // least one line has actually been dispensed (mirrors pharmacy.Service.SubmitInsuranceClaim's
  // own precondition on the server side). Also requires a real patient/visit account to claim
  // against — a Chemist walk-in has neither (it bills via WalkInSale instead, not insurance),
  // and SubmitInsuranceClaim hard-errors "prescription has no linked patient/visit account to
  // claim against" for one; this guard keeps the button from being shown where it can only fail.
  const canBillInsurance =
    (rx.status === 'dispensed' || rx.status === 'partially_dispensed') && !!rx.patient_id && !!rx.visit_id;
  // Mirrors hospital-api's RecheckInteractions's own canReflag condition — re-checking a
  // dispensed/rejected/cancelled prescription still records the check for audit but can't
  // change a status that's already terminal, so the action is hidden there.
  const canRecheck = ['pending', 'flagged', 'pharmacist_review', 'approved', 'locked'].includes(rx.status);
  // Per hospital-api's contract, an override_reason is required for BOTH the 'flagged' status (a
  // minor/moderate drug-interaction/allergy finding) and the stricter 'pharmacist_review' status
  // (a major/contraindicated interaction) — pharmacist_review is the more serious of the two, so
  // it must never require less friction to approve than flagged does. See
  // pharmacy.Service.ApprovePrescription's own override-reason gate in hospital-api, which checks
  // both statuses identically.
  const needsOverrideReason = rx.status === 'flagged' || rx.status === 'pharmacist_review';

  const fieldCls = 'text-sm text-foreground font-medium';
  const labelCls = 'text-xs text-muted-foreground mb-0.5';

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-start justify-between mb-6 gap-4 flex-wrap">
        <div className="flex items-start gap-3">
          <Link
            href={`/${orgSlug}/pharmacy`}
            className="h-9 w-9 rounded-xl border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent transition-colors mt-0.5 shrink-0"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-xl font-bold font-mono">{rx.prescription_number}</h1>
              <StatusBadge status={rx.status} />
            </div>
            <p className="text-sm text-muted-foreground mt-0.5">Created {new Date(rx.created_at).toLocaleString()}</p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {canApprove && !needsOverrideReason && (
            <Can permission="hospital.pharmacy.manage">
              <Button className="gap-2" onClick={() => handleApprove()} disabled={approve.isPending}>
                {approve.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                Approve
              </Button>
            </Can>
          )}
          {canLock && (
            <Can permission="hospital.pharmacy.manage">
              <Button variant="secondary" className="gap-2" onClick={handleLock} disabled={lock.isPending}>
                {lock.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Lock className="h-4 w-4" />}
                Lock for Dispense
              </Button>
            </Can>
          )}
          {canDispense && (
            <Can permission="hospital.pharmacy.dispense">
              <Button variant="secondary" className="gap-2" onClick={openDispense}>
                <Pill className="h-4 w-4" />
                Dispense
              </Button>
            </Can>
          )}
          {canRejectOrCancel && (
            <Can permission="hospital.pharmacy.manage">
              <Button variant="outline" className="gap-2 text-destructive border-destructive/30 hover:bg-destructive/10" onClick={() => setShowReject((v) => !v)}>
                <Ban className="h-4 w-4" />
                Reject
              </Button>
            </Can>
          )}
          {canRejectOrCancel && (
            <Can permission="hospital.pharmacy.manage">
              <Button variant="outline" className="gap-2" onClick={() => setShowCancel((v) => !v)}>
                <XCircle className="h-4 w-4" />
                Cancel Rx
              </Button>
            </Can>
          )}
          {canBillInsurance && (
            <Can permission={['hospital.billing.collect_own', 'hospital.billing.collect_any']}>
              <Button variant="outline" className="gap-2" onClick={() => setShowInsurance(true)}>
                <ShieldCheck className="h-4 w-4" />
                Bill to Insurance
              </Button>
            </Can>
          )}
          {canRecheck && (
            <Can permission="hospital.pharmacy.manage">
              <Button variant="outline" className="gap-2" onClick={() => setShowRecheck(true)}>
                <RefreshCw className="h-4 w-4" />
                Re-check Interactions
              </Button>
            </Can>
          )}
        </div>
      </div>

      {showReject && (
        <Card className="p-5 mb-5 border-destructive/20 bg-destructive/5">
          <h2 className="text-sm font-bold text-destructive mb-2">Reject Prescription</h2>
          <p className="text-sm text-muted-foreground mb-3">This cannot be undone.</p>
          <textarea
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            placeholder="Reason for rejection (required)…"
            rows={2}
            className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-destructive/40"
          />
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setShowReject(false)}>
              Cancel
            </Button>
            <Button variant="destructive" className="gap-2" onClick={handleReject} disabled={reject.isPending || !rejectReason.trim()}>
              {reject.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Confirm Rejection
            </Button>
          </div>
        </Card>
      )}

      {showCancel && (
        <Card className="p-5 mb-5">
          <h2 className="text-sm font-bold mb-2">Cancel Prescription</h2>
          <p className="text-sm text-muted-foreground mb-3">This cannot be undone.</p>
          <textarea
            value={cancelReason}
            onChange={(e) => setCancelReason(e.target.value)}
            placeholder="Reason for cancellation (required)…"
            rows={2}
            className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setShowCancel(false)}>
              Back
            </Button>
            <Button className="gap-2" onClick={handleCancel} disabled={cancelRx.isPending || !cancelReason.trim()}>
              {cancelRx.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Confirm Cancellation
            </Button>
          </div>
        </Card>
      )}

      {showDispense && (
        <div className="fixed inset-0 z-[55] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setShowDispense(false)}>
          <div className="bg-card rounded-2xl border border-border shadow-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-4">
              <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <Pill className="h-5 w-5 text-primary" />
              </div>
              <div className="min-w-0">
                <h2 className="font-bold text-base leading-tight">Dispense Prescription</h2>
                <p className="text-xs text-muted-foreground">
                  Reduce a quantity below the remaining amount for a partial dispense. Check &quot;Requires
                  witness&quot; for any controlled/scheduled drug, then have a different staff member confirm
                  as witness below.
                </p>
              </div>
            </div>
            <div className="space-y-3 mb-5">
              {Object.keys(dispenseDraft).length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6">Nothing left to dispense on this prescription</p>
              ) : (
                lines
                  .filter((l) => dispenseDraft[l.id])
                  .map((line) => {
                    const remaining = line.quantity_prescribed - line.quantity_dispensed;
                    const draft = dispenseDraft[line.id];
                    return (
                      <div key={line.id} className="rounded-xl border border-border p-3 space-y-2.5">
                        <div className="flex items-center justify-between gap-3">
                          <div className="min-w-0">
                            <p className="text-sm font-medium truncate">{line.drug_name}</p>
                            <p className="text-xs text-muted-foreground">
                              {[line.dosage, line.form].filter(Boolean).join(' · ')} — {remaining} remaining of {line.quantity_prescribed}
                            </p>
                          </div>
                          <input
                            type="number"
                            min={0}
                            max={remaining}
                            value={draft.quantity}
                            onChange={(e) => {
                              const n = Math.min(Math.max(0, Number(e.target.value) || 0), remaining);
                              setDispenseDraft((prev) => ({ ...prev, [line.id]: { ...prev[line.id], quantity: String(n) } }));
                            }}
                            className="w-20 shrink-0 rounded-lg border border-border bg-background px-2 py-1.5 text-sm text-center focus:outline-none focus:ring-2 focus:ring-primary/40"
                          />
                        </div>
                        <label className="flex items-center gap-2 text-xs font-medium cursor-pointer">
                          <input
                            type="checkbox"
                            checked={draft.requiresWitness}
                            onChange={(e) =>
                              setDispenseDraft((prev) => ({ ...prev, [line.id]: { ...prev[line.id], requiresWitness: e.target.checked } }))
                            }
                            className="h-4 w-4 rounded border-border"
                          />
                          <ShieldAlert className="h-3.5 w-3.5 text-amber-600" />
                          Requires witness (controlled/scheduled substance)
                        </label>
                      </div>
                    );
                  })
              )}
              {anyLineRequiresWitness && (
                <WitnessConfirmForm
                  confirmedWitness={confirmedWitness}
                  onConfirmed={(w) => {
                    setConfirmedWitness(w);
                    setWitnessNotice(null);
                  }}
                  noticeMessage={witnessNotice}
                />
              )}
            </div>
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => setShowDispense(false)}>
                Cancel
              </Button>
              <Button
                className="flex-1 gap-2"
                onClick={handleDispense}
                disabled={
                  dispense.isPending ||
                  Object.keys(dispenseDraft).length === 0 ||
                  (anyLineRequiresWitness && !confirmedWitness)
                }
              >
                {dispense.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Pill className="h-4 w-4" />}
                Confirm Dispense
              </Button>
            </div>
          </div>
        </div>
      )}

      {needsOverrideReason && (
        <Card className="p-5 mb-5 border-red-400/30 bg-red-500/5">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
            <div className="flex-1">
              <h2 className="text-sm font-bold text-red-700 dark:text-red-400 mb-1">
                {rx.status === 'pharmacist_review' ? 'Contraindicated drug interaction / allergy detected' : 'Drug interaction / allergy flag detected'}
              </h2>
              <p className="text-sm text-muted-foreground mb-4">
                A pharmacist must document a clinical justification before this prescription can be approved.
              </p>
              <textarea
                value={overrideReason}
                onChange={(e) => setOverrideReason(e.target.value)}
                placeholder="Override reason (required to approve)…"
                rows={2}
                className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-red-400/40"
              />
              <Can permission="hospital.pharmacy.manage">
                <Button
                  variant="destructive"
                  className="gap-2"
                  onClick={() => handleApprove(overrideReason)}
                  disabled={approve.isPending || !overrideReason.trim()}
                >
                  {approve.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldAlert className="h-4 w-4" />}
                  Approve with Override
                </Button>
              </Can>
            </div>
          </div>
        </Card>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-5">
        <Card className="p-5">
          <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-4">Prescriber</h2>
          <div className="space-y-3">
            <div>
              <p className={labelCls}>Name</p>
              <p className={fieldCls}>{rx.prescriber_name || '—'}</p>
            </div>
            <div>
              <p className={labelCls}>License #</p>
              <p className={fieldCls}>{rx.prescriber_license || '—'}</p>
            </div>
            {rx.external_facility_name && (
              <div>
                <p className={labelCls}>Originating Facility</p>
                <p className={fieldCls}>{rx.external_facility_name}</p>
              </div>
            )}
          </div>
        </Card>

        <Card className="p-5">
          <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-4">Patient</h2>
          <div className="space-y-3">
            <div>
              <p className={labelCls}>Name</p>
              <p className={fieldCls}>{rx.patient_name || '—'}</p>
            </div>
            {rx.patient_dob && (
              <div>
                <p className={labelCls}>Date of Birth</p>
                <p className={fieldCls}>{new Date(rx.patient_dob).toLocaleDateString()}</p>
              </div>
            )}
            {rx.patient_id_number && (
              <div>
                <p className={labelCls}>ID Number</p>
                <p className={fieldCls}>{rx.patient_id_number}</p>
              </div>
            )}
          </div>
        </Card>
      </div>

      {rx.notes && (
        <Card className="p-5 mb-5">
          <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">Notes</h2>
          <p className="text-sm text-muted-foreground">{rx.notes}</p>
        </Card>
      )}

      <Card>
        <div className="px-5 py-4 border-b border-border">
          <h2 className="text-sm font-bold">Drug Lines</h2>
        </div>
        {lines.length === 0 ? (
          <div className="flex items-center justify-center h-24 text-sm text-muted-foreground">No drug lines</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-accent/30">
                  <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Drug</th>
                  <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Dosage</th>
                  <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Form</th>
                  <th className="text-left px-4 py-3 font-semibold text-muted-foreground hidden sm:table-cell">Instructions</th>
                  <th className="text-center px-4 py-3 font-semibold text-muted-foreground">Prescribed</th>
                  <th className="text-center px-4 py-3 font-semibold text-muted-foreground">Dispensed</th>
                  <th className="text-right px-4 py-3 font-semibold text-muted-foreground">Label</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {lines.map((line) => (
                  <tr key={line.id} className="hover:bg-accent/20 transition-colors">
                    <td className="px-4 py-3.5 font-medium">{line.drug_name}</td>
                    <td className="px-4 py-3.5 text-muted-foreground">{line.dosage || '—'}</td>
                    <td className="px-4 py-3.5 text-muted-foreground">{line.form || '—'}</td>
                    <td className="px-4 py-3.5 text-muted-foreground text-xs hidden sm:table-cell max-w-[200px] truncate">
                      {line.instructions || '—'}
                    </td>
                    <td className="px-4 py-3.5 text-center font-mono">{line.quantity_prescribed}</td>
                    <td className="px-4 py-3.5 text-center font-mono">
                      <span
                        className={cn(
                          'font-semibold',
                          line.quantity_dispensed === 0 && 'text-muted-foreground',
                          line.quantity_dispensed > 0 && line.quantity_dispensed < line.quantity_prescribed && 'text-orange-600',
                          line.quantity_dispensed >= line.quantity_prescribed && 'text-green-600',
                        )}
                      >
                        {line.quantity_dispensed}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      {line.quantity_dispensed > 0 && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="gap-1.5"
                          onClick={() => printLabel(line.id, `${line.drug_name}-label`)}
                        >
                          <Printer className="h-3.5 w-3.5" />
                          Print
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {rx.visit_id && <VisitChargesPanel visitId={rx.visit_id} className="mt-5" />}
      {!rx.visit_id && (rx.edges?.walk_in_sales?.length ?? 0) > 0 && (
        <WalkInSalePanel sales={rx.edges!.walk_in_sales!} className="mt-5" />
      )}

      {showInsurance && rx && (
        <InsuranceClaimModal
          title={`Prescription ${rx.prescription_number}`}
          visitId={rx.visit_id}
          onSubmit={async (input) => {
            const res = await submitInsuranceClaim.mutateAsync({ id: rx.id, data: input });
            return res.claim;
          }}
          onClose={() => setShowInsurance(false)}
        />
      )}
      {showRecheck && <RecheckModal prescriptionId={rx.id} onClose={() => setShowRecheck(false)} />}
      <PdfPreview {...previewProps} />
    </div>
  );
}
