'use client';

// Sprint 1 — Patient directory: search, registration, and opening an OPD visit. Ports the
// UX/interaction pattern of pos-ui's `[orgSlug]/patients/page.tsx` (register modal shape, table
// layout, toast-on-success/error) onto hospital-ui's own stack (`useClinical.ts` hooks,
// `@/components/ui/{base,page}` primitives, `Can` for action-level gating). See docs/sprints/
// sprint-1-reception-opd-triage.md. The ID-type selector, SHA/SHIF beneficiary number, photo
// capture, and non-blocking duplicate-patient warning (2026-09-03 MVP gap backlog) are all now
// wired here.

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'sonner';
import { ClipboardPlus, Search, UserPlus, UserSquare } from 'lucide-react';
import { PageHeader, EmptyState, Skeleton } from '@/components/ui/page';
import { Card, Button, Input } from '@/components/ui/base';
import { Can } from '@/components/auth/can';
import { RegisterPatientModal } from '@/components/clinical/register-patient-modal';
import { usePatients, useCheckInVisit, useVisits } from '@/hooks/useClinical';
import { apiErrorMessage } from '@/lib/api/error-message';
import type { Patient } from '@/lib/api/clinical';

function PatientRow({ patient, orgSlug, onOpenVisit, pending }: { patient: Patient; orgSlug: string; onOpenVisit: (id: string) => void; pending: boolean }) {
  return (
    <tr className="hover:bg-accent/20 transition-colors">
      <td className="px-4 py-3.5 font-mono text-xs">{patient.mrn}</td>
      <td className="px-4 py-3.5 font-medium">
        <Link href={`/${orgSlug}/patients/${patient.id}`} className="hover:text-primary hover:underline">
          {patient.full_name}
        </Link>
      </td>
      <td className="px-4 py-3.5 text-muted-foreground">{patient.phone || '—'}</td>
      <td className="px-4 py-3.5 text-muted-foreground">{patient.id_number || '—'}</td>
      <td className="px-4 py-3.5 text-right">
        <div className="flex items-center justify-end gap-2">
          <Link
            href={`/${orgSlug}/patients/${patient.id}`}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-xs font-medium hover:bg-accent transition-colors"
          >
            View
          </Link>
          <Can permission="hospital.reception.add">
            <button
              onClick={() => onOpenVisit(patient.id)}
              disabled={pending}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              <ClipboardPlus className="h-3.5 w-3.5" />
              Open Visit
            </button>
          </Can>
        </div>
      </td>
    </tr>
  );
}

function PatientsPage() {
  const params = useParams();
  const orgSlug = (params?.orgSlug as string) ?? '';
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [registerOpen, setRegisterOpen] = useState(false);
  const [openingId, setOpeningId] = useState<string | null>(null);

  // Debounce the search box so every keystroke doesn't fire a request.
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search.trim()), 300);
    return () => clearTimeout(t);
  }, [search]);

  const { data: patients, isLoading } = usePatients(debouncedSearch || undefined);
  const { data: registeredVisits } = useVisits('registered');
  const checkIn = useCheckInVisit();

  const handleOpenVisit = async (patientId: string) => {
    setOpeningId(patientId);
    try {
      const visit = await checkIn.mutateAsync({ patient_id: patientId });
      toast.success(`Visit ${visit.visit_number} opened — proceed to Triage`);
    } catch (e) {
      toast.error(await apiErrorMessage(e, 'Failed to open visit'));
    } finally {
      setOpeningId(null);
    }
  };

  return (
    <div className="max-w-7xl mx-auto">
      <PageHeader
        title="Patients"
        subtitle="Patient directory — register patients and open OPD visits"
        icon={<UserSquare className="h-5 w-5" />}
        actions={
          <Can permission="hospital.records.add">
            <Button onClick={() => setRegisterOpen(true)}>
              <UserPlus className="h-4 w-4 mr-2" />
              Register Patient
            </Button>
          </Can>
        }
      />

      {registeredVisits && registeredVisits.length > 0 && (
        <Card className="mb-5 border-amber-400/30 bg-amber-500/5">
          <div className="p-4 flex items-center justify-between flex-wrap gap-2">
            <p className="text-xs font-bold uppercase tracking-wide text-amber-700 dark:text-amber-400">
              {registeredVisits.length} visit(s) waiting for triage
            </p>
            <Link href={`/${orgSlug}/triage`} className="text-sm text-primary underline underline-offset-2">
              Go to Triage queue →
            </Link>
          </div>
        </Card>
      )}

      <div className="relative mb-5 max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name, phone, MRN, ID…"
          className="pl-10"
        />
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      ) : (patients ?? []).length === 0 ? (
        <EmptyState
          icon={<UserSquare className="h-10 w-10" />}
          title="No patients found"
          description={
            debouncedSearch
              ? 'No patient matches that search.'
              : 'Register a patient to open their first visit.'
          }
          action={
            !debouncedSearch ? (
              <Can permission="hospital.records.add">
                <Button onClick={() => setRegisterOpen(true)}>
                  <UserPlus className="h-4 w-4 mr-2" />
                  Register Patient
                </Button>
              </Can>
            ) : undefined
          }
        />
      ) : (
        <Card>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-accent/30">
                <th className="text-left px-4 py-3 font-semibold text-muted-foreground">MRN</th>
                <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Name</th>
                <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Phone</th>
                <th className="text-left px-4 py-3 font-semibold text-muted-foreground">ID Number</th>
                <th className="text-right px-4 py-3 font-semibold text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {(patients ?? []).map((p) => (
                <PatientRow key={p.id} patient={p} orgSlug={orgSlug} onOpenVisit={handleOpenVisit} pending={openingId === p.id} />
              ))}
            </tbody>
          </table>
        </Card>
      )}

      {registerOpen && (
        <RegisterPatientModal
          orgSlug={orgSlug}
          onClose={() => setRegisterOpen(false)}
          onRegistered={(p) => {
            setRegisterOpen(false);
            void handleOpenVisit(p.id);
          }}
        />
      )}
    </div>
  );
}

export default function PatientsPageRoute() {
  return <PatientsPage />;
}
