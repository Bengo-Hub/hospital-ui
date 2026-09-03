'use client';

import { useMemo, useState } from 'react';
import { useQueries } from '@tanstack/react-query';
import { useParams, useRouter } from 'next/navigation';
import { ClipboardList, Loader2, LogIn, Plus, X } from 'lucide-react';
import { toast } from 'sonner';
import { Card, Button, Badge } from '@/components/ui/base';
import { PageHeader, EmptyState, Skeleton } from '@/components/ui/page';
import { Can } from '@/components/auth/can';
import { P } from '@/lib/rbac/permissions';
import { apiErrorMessage } from '@/lib/api/error-message';
import { useAdmissions, useAdmit, useWards } from '@/hooks/useInpatient';
import { useVisits, usePatient } from '@/hooks/useClinical';
import { useBillableItemCatalog } from '@/hooks/useBilling';
import { inpatientApi } from '@/lib/api/inpatient';
import type { AdmissionStatus } from '@/lib/api/inpatient';

const STATUS_OPTIONS: { value: AdmissionStatus | ''; label: string }[] = [
  { value: 'active', label: 'Active' },
  { value: 'discharged', label: 'Discharged' },
  { value: '', label: 'All' },
];

function PatientCell({ patientId }: { patientId: string }) {
  const { data: patient, isLoading } = usePatient(patientId);
  if (isLoading) return <span className="text-muted-foreground">Loading…</span>;
  return <span>{patient?.full_name ?? patientId}</span>;
}

function AdmitModal({ onClose }: { onClose: () => void }) {
  const params = useParams();
  const orgSlug = params?.orgSlug as string;
  const { data: visits, isLoading: visitsLoading } = useVisits('registered');
  const { data: wards, isLoading: wardsLoading } = useWards();
  const { data: catalog } = useBillableItemCatalog();
  const admit = useAdmit();
  const [visitId, setVisitId] = useState('');
  const [bedId, setBedId] = useState('');
  const [insured, setInsured] = useState(false);
  const [guaranteeReference, setGuaranteeReference] = useState('');

  const depositItem = useMemo(() => (catalog ?? []).find((c) => c.code === 'ADMISSION_DEPOSIT' && c.is_active), [catalog]);

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
      beds: (occupancyQueries[i]?.data?.beds ?? []).filter((b) => b.bed.status === 'available'),
    }));
  }, [wards, occupancyQueries]);

  const loadingBeds = occupancyQueries.some((q) => q.isLoading);

  const handleSubmit = async () => {
    if (!visitId) {
      toast.error('Select a visit');
      return;
    }
    if (!bedId) {
      toast.error('Select an available bed');
      return;
    }
    if (insured && !guaranteeReference.trim()) {
      toast.error('Enter the letter-of-guarantee/undertaking reference');
      return;
    }
    try {
      const adm = await admit.mutateAsync({
        visit_id: visitId,
        bed_id: bedId,
        insurance_guarantee_reference: insured ? guaranteeReference.trim() : undefined,
      });
      toast.success('Patient admitted');
      onClose();
      window.location.assign(`/${orgSlug}/admissions/${adm.id}`);
    } catch (e) {
      toast.error(await apiErrorMessage(e, 'Failed to admit patient'));
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-card rounded-2xl border border-border w-full max-w-lg shadow-2xl flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
          <div>
            <h3 className="font-bold text-base">Admit Patient</h3>
            <p className="text-xs text-muted-foreground">Select a registered visit and an available bed</p>
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
                    {v.visit_number} — {v.chief_complaint || 'no chief complaint recorded'}
                  </option>
                ))}
              </select>
            )}
            <p className="text-xs text-muted-foreground mt-1">Only visits at "registered" status are shown.</p>
          </div>

          <div>
            <label className="text-xs font-semibold text-muted-foreground mb-1 block">
              Bed <span className="text-destructive">*</span>
            </label>
            {wardsLoading || loadingBeds ? (
              <Skeleton className="h-32 w-full" />
            ) : availableBedsByWard.every((g) => g.beds.length === 0) ? (
              <p className="text-xs text-muted-foreground py-4 text-center">No available beds — create a ward/bed first.</p>
            ) : (
              <div className="max-h-56 overflow-y-auto rounded-xl border border-border divide-y divide-border">
                {availableBedsByWard.map(
                  (g) =>
                    g.beds.length > 0 && (
                      <div key={g.ward.id}>
                        <p className="px-3 py-1.5 text-xs font-bold bg-accent/30 text-muted-foreground">{g.ward.name}</p>
                        {g.beds.map((b) => (
                          <label
                            key={b.bed.id}
                            className="flex items-center gap-3 px-3 py-2 text-sm cursor-pointer hover:bg-accent/40 transition-colors"
                          >
                            <input
                              type="radio"
                              name="bed"
                              checked={bedId === b.bed.id}
                              onChange={() => setBedId(b.bed.id)}
                            />
                            <span>{b.bed.bed_number}</span>
                          </label>
                        ))}
                      </div>
                    ),
                )}
              </div>
            )}
          </div>

          <div className="rounded-xl border border-border p-3 space-y-2.5">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold text-muted-foreground">Payment on Admission</p>
              <label className="text-xs font-medium flex items-center gap-1.5 cursor-pointer">
                <input type="checkbox" checked={insured} onChange={(e) => setInsured(e.target.checked)} />
                Insured (letter of guarantee)
              </label>
            </div>
            {insured ? (
              <div>
                <label className="text-xs font-semibold text-muted-foreground mb-1 block">
                  Guarantee / Undertaking Reference <span className="text-destructive">*</span>
                </label>
                <input
                  value={guaranteeReference}
                  onChange={(e) => setGuaranteeReference(e.target.value)}
                  placeholder="e.g. SHA-LOG-2026-00123"
                  className="w-full bg-background border border-border rounded-xl py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
              </div>
            ) : depositItem?.price ? (
              <p className="text-sm">
                A deposit of <span className="font-bold">{depositItem.price.toFixed(2)}</span> will be charged to the admission account on collection at the Billing desk.
              </p>
            ) : (
              <p className="text-xs text-muted-foreground">No admission deposit configured for this tenant.</p>
            )}
          </div>
        </div>
        <div className="flex gap-3 px-6 pb-6 pt-2 border-t border-border shrink-0">
          <Button variant="outline" className="flex-1" onClick={onClose} disabled={admit.isPending}>
            Cancel
          </Button>
          <Button className="flex-1 gap-2" onClick={handleSubmit} disabled={admit.isPending}>
            {admit.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            Admit
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function AdmissionsPage() {
  const router = useRouter();
  const params = useParams();
  const orgSlug = params?.orgSlug as string;
  const [status, setStatus] = useState<AdmissionStatus | ''>('active');
  const { data: admissions, isLoading } = useAdmissions(status || undefined);
  const { data: wards } = useWards();
  const [admitOpen, setAdmitOpen] = useState(false);

  const wardNameById = useMemo(() => {
    const m = new Map((wards ?? []).map((w) => [w.id, w.name]));
    return (id: string) => m.get(id) ?? '—';
  }, [wards]);

  const rows = admissions ?? [];

  return (
    <div className="max-w-7xl mx-auto">
      <PageHeader
        title="Admissions"
        subtitle="IPD worklist — admit, transfer, and discharge"
        icon={<ClipboardList className="h-5 w-5" />}
        actions={
          <Can permission={P.INPATIENT_ADD}>
            <Button className="gap-2" onClick={() => setAdmitOpen(true)}>
              <Plus className="h-4 w-4" />
              Admit Patient
            </Button>
          </Can>
        }
      />

      <div className="flex flex-wrap gap-3 mb-5">
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value as AdmissionStatus | '')}
          className="bg-background border border-border rounded-xl py-2 px-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 min-w-[160px]"
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
          <EmptyState icon={<ClipboardList className="h-10 w-10" />} title="No admissions found" description="Admit a patient to a bed to get started." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-accent/30">
                  <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Admission #</th>
                  <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Patient</th>
                  <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Ward</th>
                  <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Status</th>
                  <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Admitted</th>
                  <th className="text-right px-4 py-3 font-semibold text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {rows.map((a) => (
                  <tr key={a.id} className="hover:bg-accent/20 transition-colors">
                    <td className="px-4 py-3.5 font-mono text-xs">{a.admission_number}</td>
                    <td className="px-4 py-3.5">
                      <PatientCell patientId={a.patient_id} />
                    </td>
                    <td className="px-4 py-3.5">{wardNameById(a.ward_id)}</td>
                    <td className="px-4 py-3.5">
                      <Badge variant={a.status === 'active' ? 'success' : 'outline'}>{a.status}</Badge>
                    </td>
                    <td className="px-4 py-3.5 text-muted-foreground text-xs whitespace-nowrap">
                      {new Date(a.admitted_at).toLocaleString()}
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <Button size="sm" variant="outline" className="gap-1.5" onClick={() => router.push(`/${orgSlug}/admissions/${a.id}`)}>
                        <LogIn className="h-3.5 w-3.5" />
                        View
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {admitOpen && <AdmitModal onClose={() => setAdmitOpen(false)} />}
    </div>
  );
}
