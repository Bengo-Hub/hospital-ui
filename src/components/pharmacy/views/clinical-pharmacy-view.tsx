'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Eye, Pill, Plus, ShieldAlert } from 'lucide-react';
import { Card, Button, Badge } from '@/components/ui/base';
import { PageHeader, EmptyState, Skeleton } from '@/components/ui/page';
import { Can } from '@/components/auth/can';
import { usePrescriptions } from '@/hooks/usePharmacy';
import { NewPrescriptionModal } from '@/components/pharmacy/new-prescription-modal';
import type { PrescriptionStatus } from '@/lib/api/pharmacy';

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

/** Clinic/Facility/Hospital tiers' Pharmacy view — the full prescription lifecycle (create,
 * approve, lock, dispense), one row per prescription. Selected by pharmacy/page.tsx's shell for
 * every facility type except chemist (see ChemistPharmacyView, the sibling view for that tier). */
export function ClinicalPharmacyView({ orgSlug }: { orgSlug: string }) {
  const [statusFilter, setStatusFilter] = useState<PrescriptionStatus | ''>('');
  const [createOpen, setCreateOpen] = useState(false);
  const { data: prescriptions, isLoading } = usePrescriptions(statusFilter || undefined);

  const rows = prescriptions ?? [];

  return (
    <div className="max-w-7xl mx-auto">
      <PageHeader
        title="Pharmacy"
        subtitle="Prescriptions, approvals and dispensing"
        icon={<Pill className="h-5 w-5" />}
        actions={
          <>
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
                New Prescription
              </Button>
            </Can>
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
    </div>
  );
}
