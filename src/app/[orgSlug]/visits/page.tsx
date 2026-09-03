'use client';

// Completeness-audit gap-fill (2026-09-03): visit visibility used to be either per-patient
// (patients/[id]'s "Visit History" table) or per fixed-status worklist (Triage, Consultation
// Queue, Admissions) — 5 of 10 VisitStatus values (awaiting_lab, prescribed, dispensed,
// completed, cancelled) were never shown in any cross-patient list. This is that list. Slots in
// as the index of the visits/ segment, sibling to the existing visits/[visitId]/account route
// (see nav-config.ts's OPD group note — that account page had "no list to link from yet" until
// now). Mirrors patients/page.tsx's shape (debounced search, table, PageHeader/EmptyState/
// Skeleton) since visits and patients are structurally similar list domains here.
//
// hospital-api's GET /visits accepts `status` and `patient_id` but no free-text query
// (internal/http/handlers/patients.go ListVisits) — text search below resolves matching patients
// via the existing patients search endpoint and intersects client-side rather than inventing a
// new backend contract. More subtly, an EMPTY status filter doesn't mean "every visit": per
// patients.Service.ListVisits, status="" (and no patient_id) defaults to "all OPEN visits" and
// explicitly excludes completed/cancelled — so the "All Statuses" option here merges that default
// page with explicit completed/cancelled fetches, otherwise "All" would silently keep hiding two
// of exactly the statuses this page exists to surface.

import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ClipboardList, Search, Wallet } from 'lucide-react';
import { PageHeader, EmptyState, Skeleton } from '@/components/ui/page';
import { Card, Input } from '@/components/ui/base';
import { VisitStatusBadge } from '@/components/clinical/visit-status-badge';
import { AcuityBadge, latestTriageRecord } from '@/components/clinical/acuity-badge';
import { useVisits, usePatients, usePatient } from '@/hooks/useClinical';
import type { PatientVisit, VisitStatus } from '@/lib/api/clinical';

const STATUS_OPTIONS: { value: VisitStatus | 'all'; label: string }[] = [
  { value: 'all', label: 'All Statuses' },
  { value: 'registered', label: 'Registered' },
  { value: 'triaged', label: 'Triaged' },
  { value: 'in_examination', label: 'In Examination' },
  { value: 'awaiting_lab', label: 'Awaiting Lab' },
  { value: 'lab_complete', label: 'Lab Complete' },
  { value: 'prescribed', label: 'Prescribed' },
  { value: 'dispensed', label: 'Dispensed' },
  { value: 'admitted', label: 'Admitted' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
];

const selectCls =
  'rounded-lg border border-input bg-transparent px-4 py-2 text-sm focus:ring-1 focus:ring-ring focus:outline-none sm:w-56';

function VisitRow({ visit, orgSlug }: { visit: PatientVisit; orgSlug: string }) {
  // Per-row resolution, same established pattern as consultation/queue/page.tsx's VisitRow — no
  // batch patient-lookup endpoint exists, and react-query dedupes identical patient_id queries
  // across rows so a repeat patient only costs one request.
  const { data: patient } = usePatient(visit.patient_id);
  return (
    <tr className="hover:bg-accent/20 transition-colors">
      <td className="px-4 py-3.5 font-mono text-xs">{visit.visit_number}</td>
      <td className="px-4 py-3.5 font-medium">
        <Link href={`/${orgSlug}/patients/${visit.patient_id}`} className="hover:text-primary hover:underline">
          {patient?.full_name ?? '…'}
        </Link>
      </td>
      <td className="px-4 py-3.5 text-muted-foreground">{visit.chief_complaint || '—'}</td>
      <td className="px-4 py-3.5"><AcuityBadge priority={latestTriageRecord(visit)?.priority} /></td>
      <td className="px-4 py-3.5"><VisitStatusBadge status={visit.status} /></td>
      <td className="px-4 py-3.5 text-muted-foreground text-xs whitespace-nowrap">
        {new Date(visit.checked_in_at).toLocaleString()}
      </td>
      <td className="px-4 py-3.5 text-right">
        <Link
          href={`/${orgSlug}/visits/${visit.id}/account`}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline"
        >
          <Wallet className="h-3.5 w-3.5" />
          Account
        </Link>
      </td>
    </tr>
  );
}

function VisitsPage() {
  const params = useParams();
  const orgSlug = (params?.orgSlug as string) ?? '';
  const [statusFilter, setStatusFilter] = useState<VisitStatus | 'all'>('all');
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search.trim()), 300);
    return () => clearTimeout(t);
  }, [search]);

  const { data: openVisits, isLoading: l1 } = useVisits(statusFilter === 'all' ? undefined : statusFilter);
  const { data: completedVisits, isLoading: l2 } = useVisits('completed');
  const { data: cancelledVisits, isLoading: l3 } = useVisits('cancelled');

  const isLoading = statusFilter === 'all' ? l1 || l2 || l3 : l1;

  const visits = useMemo(() => {
    const merged =
      statusFilter === 'all'
        ? Array.from(
            new Map(
              [...(openVisits ?? []), ...(completedVisits ?? []), ...(cancelledVisits ?? [])].map((v) => [v.id, v]),
            ).values(),
          )
        : (openVisits ?? []);
    // The backend orders FIFO (oldest first, for queue consumption) — an index/browse page reads
    // better newest-first, so re-sort here rather than changing the shared queue ordering.
    return [...merged].sort((a, b) => new Date(b.checked_in_at).getTime() - new Date(a.checked_in_at).getTime());
  }, [statusFilter, openVisits, completedVisits, cancelledVisits]);

  // No free-text search on GET /visits — resolve matching patients via the existing patients
  // search endpoint (patientsApi.list's `q` param) and intersect client-side by patient_id.
  const { data: matchedPatients } = usePatients(debouncedSearch || undefined);
  const matchedPatientIds = useMemo(() => new Set((matchedPatients ?? []).map((p) => p.id)), [matchedPatients]);

  const filteredVisits = useMemo(() => {
    if (!debouncedSearch) return visits;
    const q = debouncedSearch.toLowerCase();
    return visits.filter((v) => v.visit_number.toLowerCase().includes(q) || matchedPatientIds.has(v.patient_id));
  }, [visits, debouncedSearch, matchedPatientIds]);

  return (
    <div className="max-w-7xl mx-auto">
      <PageHeader
        title="Visits"
        subtitle="Every OPD/IPD visit across every stage — registration through discharge"
        icon={<ClipboardList className="h-5 w-5" />}
      />

      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by patient name or visit number…"
            className="pl-10"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as VisitStatus | 'all')}
          className={selectCls}
        >
          {STATUS_OPTIONS.map((s) => (
            <option key={s.value} value={s.value}>{s.label}</option>
          ))}
        </select>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-12 w-full" />)}
        </div>
      ) : filteredVisits.length === 0 ? (
        <EmptyState
          icon={<ClipboardList className="h-10 w-10" />}
          title="No visits found"
          description={
            debouncedSearch || statusFilter !== 'all'
              ? 'No visit matches these filters.'
              : 'Visits appear here once a patient is checked in from the Patients page.'
          }
        />
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-accent/30">
                  <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Visit #</th>
                  <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Patient</th>
                  <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Chief Complaint</th>
                  <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Priority</th>
                  <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Status</th>
                  <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Checked In</th>
                  <th className="text-right px-4 py-3 font-semibold text-muted-foreground">Account</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredVisits.map((v) => (
                  <VisitRow key={v.id} visit={v} orgSlug={orgSlug} />
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}

export default function VisitsPageRoute() {
  return <VisitsPage />;
}
