'use client';

// Sprint 1 — Triage queue: visits with status=registered waiting for vitals capture. Ports the
// UX/interaction pattern of pos-ui's `[orgSlug]/triage/page.tsx` (queue table + vitals-capture
// modal, toast-on-success/error) onto hospital-ui's own stack. Reachable via the sidebar's "OPD"
// group (nav-config.ts — reception/triage/consultation are chained under that one dropdown,
// labeled with the real hospital term per the 2026-09-02 sidebar-naming fix) and via the banner
// link on `/[orgSlug]/patients`.

import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useState } from 'react';
import { HeartPulse } from 'lucide-react';
import { PageHeader, EmptyState, Skeleton } from '@/components/ui/page';
import { Card } from '@/components/ui/base';
import { Can } from '@/components/auth/can';
import { VisitStatusBadge } from '@/components/clinical/visit-status-badge';
import { TriageModal } from '@/components/clinical/triage-modal';
import { useVisits, usePatient } from '@/hooks/useClinical';
import type { PatientVisit } from '@/lib/api/clinical';

function VisitRow({ visit, onTriage }: { visit: PatientVisit; onTriage: () => void }) {
  const { data: patient } = usePatient(visit.patient_id);
  return (
    <tr className="hover:bg-accent/20 transition-colors">
      <td className="px-4 py-3.5 font-mono text-xs">{visit.visit_number}</td>
      <td className="px-4 py-3.5 font-medium">{patient?.full_name ?? '…'}</td>
      <td className="px-4 py-3.5 text-muted-foreground">{visit.chief_complaint || '—'}</td>
      <td className="px-4 py-3.5"><VisitStatusBadge status={visit.status} /></td>
      <td className="px-4 py-3.5 text-right">
        <Can permission="hospital.triage.add">
          <button
            onClick={onTriage}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 transition-colors"
          >
            <HeartPulse className="h-3.5 w-3.5" />
            Take Vitals
          </button>
        </Can>
      </td>
    </tr>
  );
}

function TriagePage() {
  const params = useParams();
  const orgSlug = (params?.orgSlug as string) ?? '';
  const { data: visits, isLoading } = useVisits('registered');
  const [active, setActive] = useState<PatientVisit | null>(null);

  return (
    <div className="max-w-7xl mx-auto">
      <PageHeader
        title="Triage"
        subtitle="Record vitals for patients waiting to be seen"
        icon={<HeartPulse className="h-5 w-5" />}
      />

      {isLoading ? (
        <div className="space-y-2">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      ) : (visits ?? []).length === 0 ? (
        <EmptyState
          icon={<HeartPulse className="h-10 w-10" />}
          title="No patients waiting for triage"
          description="Visits appear here as soon as they are checked in from Patients."
          action={
            <Link href={`/${orgSlug}/patients`} className="text-sm text-primary underline underline-offset-2">
              Go to Patients →
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
              {(visits ?? []).map((v) => (
                <VisitRow key={v.id} visit={v} onTriage={() => setActive(v)} />
              ))}
            </tbody>
          </table>
        </Card>
      )}

      {active && <TriageModal visit={active} onClose={() => setActive(null)} />}
    </div>
  );
}

export default function TriagePageRoute() {
  return <TriagePage />;
}
