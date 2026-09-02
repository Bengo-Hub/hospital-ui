'use client';

import { useMemo, useState } from 'react';
import { useQueries } from '@tanstack/react-query';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeftRight, Bed as BedIcon, ClipboardList, LogOut, Loader2, X } from 'lucide-react';
import { toast } from 'sonner';
import { Card, Button, Badge } from '@/components/ui/base';
import { PageHeader, Skeleton } from '@/components/ui/page';
import { Can } from '@/components/auth/can';
import { useAppPermissions } from '@/hooks/use-app-permissions';
import { P } from '@/lib/rbac/permissions';
import { apiErrorMessage } from '@/lib/api/error-message';
import { useAdmission, useWards, useTransfer, useDischarge } from '@/hooks/useInpatient';
import { useAccountByAdmission } from '@/hooks/useBilling';
import { usePatient, useVisit } from '@/hooks/useClinical';
import { AdmissionChargesPanel } from '@/components/billing/admission-charges-panel';
import { MarPanel } from '@/components/clinical/mar-panel';
import { inpatientApi } from '@/lib/api/inpatient';
import type { TransferType } from '@/lib/api/inpatient';

function TransferModal({ admissionId, currentBedId, onClose }: { admissionId: string; currentBedId: string; onClose: () => void }) {
  const params = useParams();
  const orgSlug = params?.orgSlug as string;
  const { data: wards, isLoading: wardsLoading } = useWards();
  const transfer = useTransfer();
  const [mode, setMode] = useState<TransferType>('intra_facility');
  const [toBedId, setToBedId] = useState('');
  const [receivingFacility, setReceivingFacility] = useState('');
  const [reason, setReason] = useState('');

  const occupancyQueries = useQueries({
    queries: (wards ?? []).map((w) => ({
      queryKey: ['hospital', 'ward-occupancy', orgSlug, w.id],
      queryFn: () => inpatientApi.getWardOccupancy(orgSlug, w.id),
      enabled: !!orgSlug && !!wards,
    })),
  });

  const availableBedsByWard = useMemo(() => {
    return (wards ?? []).map((w, i) => ({
      ward: w,
      beds: (occupancyQueries[i]?.data?.beds ?? []).filter((b) => b.bed.status === 'available' && b.bed.id !== currentBedId),
    }));
  }, [wards, occupancyQueries, currentBedId]);

  const handleSubmit = async () => {
    if (mode === 'intra_facility' && !toBedId) {
      toast.error('Select a destination bed');
      return;
    }
    if (mode === 'inter_facility' && !receivingFacility.trim()) {
      toast.error('Enter the receiving facility name');
      return;
    }
    try {
      await transfer.mutateAsync({
        admissionId,
        data: {
          transfer_type: mode,
          to_bed_id: mode === 'intra_facility' ? toBedId : undefined,
          receiving_facility_name: mode === 'inter_facility' ? receivingFacility.trim() : undefined,
          reason: reason.trim() || undefined,
        },
      });
      toast.success(mode === 'intra_facility' ? 'Patient transferred' : 'Patient transferred out');
      onClose();
    } catch (e) {
      toast.error(await apiErrorMessage(e, 'Failed to transfer patient'));
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-card rounded-2xl border border-border w-full max-w-lg shadow-2xl flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
          <h3 className="font-bold text-base">Transfer Patient</h3>
          <button onClick={onClose} className="h-9 w-9 rounded-xl flex items-center justify-center hover:bg-accent">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="p-6 space-y-4 overflow-y-auto">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setMode('intra_facility')}
              className={`flex-1 rounded-xl border px-3 py-2 text-sm font-medium ${mode === 'intra_facility' ? 'border-primary bg-primary/10 text-primary' : 'border-border'}`}
            >
              Same facility (ward/bed)
            </button>
            <button
              type="button"
              onClick={() => setMode('inter_facility')}
              className={`flex-1 rounded-xl border px-3 py-2 text-sm font-medium ${mode === 'inter_facility' ? 'border-primary bg-primary/10 text-primary' : 'border-border'}`}
            >
              Another facility
            </button>
          </div>

          {mode === 'intra_facility' ? (
            <div>
              <label className="text-xs font-semibold text-muted-foreground mb-1 block">
                Destination Bed <span className="text-destructive">*</span>
              </label>
              {wardsLoading ? (
                <Skeleton className="h-32 w-full" />
              ) : availableBedsByWard.every((g) => g.beds.length === 0) ? (
                <p className="text-xs text-muted-foreground py-4 text-center">No other available beds.</p>
              ) : (
                <div className="max-h-56 overflow-y-auto rounded-xl border border-border divide-y divide-border">
                  {availableBedsByWard.map(
                    (g) =>
                      g.beds.length > 0 && (
                        <div key={g.ward.id}>
                          <p className="px-3 py-1.5 text-xs font-bold bg-accent/30 text-muted-foreground">{g.ward.name}</p>
                          {g.beds.map((b) => (
                            <label key={b.bed.id} className="flex items-center gap-3 px-3 py-2 text-sm cursor-pointer hover:bg-accent/40">
                              <input type="radio" name="to-bed" checked={toBedId === b.bed.id} onChange={() => setToBedId(b.bed.id)} />
                              <span>{b.bed.bed_number}</span>
                            </label>
                          ))}
                        </div>
                      ),
                  )}
                </div>
              )}
            </div>
          ) : (
            <div>
              <label className="text-xs font-semibold text-muted-foreground mb-1 block">
                Receiving Facility <span className="text-destructive">*</span>
              </label>
              <input
                value={receivingFacility}
                onChange={(e) => setReceivingFacility(e.target.value)}
                placeholder="e.g. Kenyatta National Hospital"
                className="w-full bg-background border border-border rounded-xl py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
              <p className="text-xs text-muted-foreground mt-1">
                This closes the admission here — the account must be settled first, same as a discharge.
              </p>
            </div>
          )}

          <div>
            <label className="text-xs font-semibold text-muted-foreground mb-1 block">Reason (optional)</label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={2}
              className="w-full bg-background border border-border rounded-xl py-2 px-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>
        </div>
        <div className="flex gap-3 px-6 pb-6 pt-2 border-t border-border shrink-0">
          <Button variant="outline" className="flex-1" onClick={onClose} disabled={transfer.isPending}>
            Cancel
          </Button>
          <Button className="flex-1 gap-2" onClick={handleSubmit} disabled={transfer.isPending}>
            {transfer.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            Transfer
          </Button>
        </div>
      </div>
    </div>
  );
}

function DischargeModal({
  admissionId,
  outstandingBalance,
  onClose,
}: {
  admissionId: string;
  outstandingBalance: number | null;
  onClose: () => void;
}) {
  const { can } = useAppPermissions();
  const discharge = useDischarge();
  const [summary, setSummary] = useState('');
  const [overrideReason, setOverrideReason] = useState('');
  const canOverride = can(P.BILLING_OVERRIDE_SETTLEMENT);

  const handleSubmit = async () => {
    try {
      await discharge.mutateAsync({ admissionId, data: { summary: summary.trim() || undefined, override_reason: overrideReason.trim() || undefined } });
      toast.success('Patient discharged');
      onClose();
    } catch (e) {
      toast.error(await apiErrorMessage(e, 'Failed to discharge patient'));
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-card rounded-2xl border border-border w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h3 className="font-bold text-base">Discharge Patient</h3>
          <button onClick={onClose} className="h-9 w-9 rounded-xl flex items-center justify-center hover:bg-accent">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="p-6 space-y-4">
          {outstandingBalance !== null && outstandingBalance > 0 && (
            <div className="rounded-xl border border-amber-400/40 bg-amber-500/10 px-4 py-3 text-sm">
              <p className="font-semibold text-amber-700 dark:text-amber-400">Outstanding balance: {outstandingBalance.toFixed(2)}</p>
              <p className="text-xs text-muted-foreground mt-1">
                Collect payment via the Admission Account panel below, or apply insurance, before discharging. {canOverride && 'You may also override with a reason.'}
              </p>
            </div>
          )}
          <div>
            <label className="text-xs font-semibold text-muted-foreground mb-1 block">Discharge Summary</label>
            <textarea
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              rows={3}
              placeholder="Condition at discharge, follow-up instructions…"
              className="w-full bg-background border border-border rounded-xl py-2 px-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>
          {canOverride && outstandingBalance !== null && outstandingBalance > 0 && (
            <div>
              <label className="text-xs font-semibold text-muted-foreground mb-1 block">Override Reason (releases despite balance)</label>
              <input
                value={overrideReason}
                onChange={(e) => setOverrideReason(e.target.value)}
                placeholder="Required to discharge with an outstanding balance"
                className="w-full bg-background border border-border rounded-xl py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
            </div>
          )}
        </div>
        <div className="flex gap-3 px-6 pb-6">
          <Button variant="outline" className="flex-1" onClick={onClose} disabled={discharge.isPending}>
            Cancel
          </Button>
          <Button className="flex-1 gap-2" onClick={handleSubmit} disabled={discharge.isPending}>
            {discharge.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            Discharge
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function AdmissionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const orgSlug = params?.orgSlug as string;
  const admissionId = params?.admissionId as string;
  const { data: admission, isLoading } = useAdmission(admissionId);
  const { data: wards } = useWards();
  const { data: patient } = usePatient(admission?.patient_id);
  const { data: visit } = useVisit(admission?.patient_visit_id);
  const { data: accountData } = useAccountByAdmission(admissionId);
  const [transferOpen, setTransferOpen] = useState(false);
  const [dischargeOpen, setDischargeOpen] = useState(false);
  const outstandingBalance = accountData?.account.balance ?? null;

  const wardName = useMemo(() => (wards ?? []).find((w) => w.id === admission?.ward_id)?.name, [wards, admission]);

  if (isLoading) {
    return (
      <div className="max-w-5xl mx-auto space-y-4">
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  if (!admission) {
    return <div className="max-w-5xl mx-auto text-sm text-muted-foreground">Admission not found.</div>;
  }

  return (
    <div className="max-w-5xl mx-auto space-y-5">
      <PageHeader
        title={patient?.full_name ?? admission.admission_number}
        subtitle={`Admission ${admission.admission_number} · ${wardName ?? 'Ward'} · ${visit?.visit_number ?? ''}`}
        icon={<ClipboardList className="h-5 w-5" />}
        actions={
          admission.status === 'active' ? (
            <>
              <Can permission={P.INPATIENT_CHANGE}>
                <Button variant="outline" className="gap-2" onClick={() => setTransferOpen(true)}>
                  <ArrowLeftRight className="h-4 w-4" />
                  Transfer
                </Button>
              </Can>
              <Can permission={P.INPATIENT_MANAGE}>
                <Button className="gap-2" onClick={() => setDischargeOpen(true)}>
                  <LogOut className="h-4 w-4" />
                  Discharge
                </Button>
              </Can>
            </>
          ) : (
            <Badge variant="outline">Discharged</Badge>
          )
        }
      />

      <Card>
        <div className="p-5 grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
          <div>
            <p className="text-xs text-muted-foreground">Status</p>
            <Badge variant={admission.status === 'active' ? 'success' : 'outline'} className="mt-1">
              {admission.status}
            </Badge>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Ward</p>
            <p className="font-medium mt-1 flex items-center gap-1.5">
              <BedIcon className="h-3.5 w-3.5 text-muted-foreground" />
              {wardName ?? '—'}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Admitted</p>
            <p className="font-medium mt-1">{new Date(admission.admitted_at).toLocaleString()}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Discharged</p>
            <p className="font-medium mt-1">{admission.discharged_at ? new Date(admission.discharged_at).toLocaleString() : '—'}</p>
          </div>
        </div>
        {admission.discharge_summary && (
          <div className="px-5 pb-5">
            <p className="text-xs text-muted-foreground mb-1">Discharge Summary</p>
            <p className="text-sm">{admission.discharge_summary}</p>
          </div>
        )}
      </Card>

      <AdmissionChargesPanel admissionId={admission.id} />

      <MarPanel admissionId={admission.id} />

      {transferOpen && <TransferModal admissionId={admission.id} currentBedId={admission.bed_id} onClose={() => setTransferOpen(false)} />}
      {dischargeOpen && <DischargeModal admissionId={admission.id} outstandingBalance={outstandingBalance} onClose={() => setDischargeOpen(false)} />}
    </div>
  );
}
