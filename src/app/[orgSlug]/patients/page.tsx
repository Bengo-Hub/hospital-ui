'use client';

// Sprint 1 — Patient directory: search, registration, and opening an OPD visit. Ports the
// UX/interaction pattern of pos-ui's `[orgSlug]/patients/page.tsx` (register modal shape, table
// layout, toast-on-success/error) onto hospital-ui's own stack (`useClinical.ts` hooks,
// `@/components/ui/{base,page}` primitives, `Can` for action-level gating). See docs/sprints/
// sprint-1-reception-opd-triage.md — that doc additionally describes a Kenya ID-type selector and
// a separate `/patients/[id]` detail page; neither exists in `RegisterPatientInput`/`Patient`
// (lib/api/clinical.ts) yet, so this page sticks to the fields the backend actually accepts.

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'sonner';
import { ClipboardPlus, Loader2, Search, UserPlus, UserSquare, X } from 'lucide-react';
import { PageHeader, EmptyState, Skeleton } from '@/components/ui/page';
import { Card, Button, Input } from '@/components/ui/base';
import { Can } from '@/components/auth/can';
import { usePatients, useRegisterPatient, useCheckInVisit, useVisits } from '@/hooks/useClinical';
import { apiErrorMessage } from '@/lib/api/error-message';
import type { Patient } from '@/lib/api/clinical';

const inputCls = 'w-full bg-background border border-border rounded-xl py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40';
const labelCls = 'text-xs font-semibold text-muted-foreground mb-1 block';

function RegisterPatientModal({ onClose, onRegistered }: { onClose: () => void; onRegistered: (p: Patient) => void }) {
  const registerPatient = useRegisterPatient();
  const [fullName, setFullName] = useState('');
  const [dob, setDob] = useState('');
  const [sex, setSex] = useState('');
  const [phone, setPhone] = useState('');
  const [idNumber, setIdNumber] = useState('');
  const [address, setAddress] = useState('');
  const [nextOfKin, setNextOfKin] = useState('');
  const [allergies, setAllergies] = useState('');

  const handleSubmit = async () => {
    if (!fullName.trim()) {
      toast.error('Full name is required');
      return;
    }
    try {
      const patient = await registerPatient.mutateAsync({
        full_name: fullName.trim(),
        dob: dob || undefined,
        sex: sex || undefined,
        phone: phone || undefined,
        id_number: idNumber || undefined,
        address: address || undefined,
        next_of_kin: nextOfKin || undefined,
        allergy_flags: allergies.trim()
          ? allergies.split(',').map((a) => a.trim()).filter(Boolean)
          : undefined,
      });
      toast.success(`${patient.full_name} registered — MRN ${patient.mrn}`);
      onRegistered(patient);
    } catch (e) {
      toast.error(await apiErrorMessage(e, 'Failed to register patient'));
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-card rounded-2xl border border-border w-full max-w-md shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border sticky top-0 bg-card">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center">
              <UserPlus className="h-4.5 w-4.5 text-primary" />
            </div>
            <div>
              <h3 className="font-bold text-base">Register Patient</h3>
              <p className="text-xs text-muted-foreground">Create a new patient record</p>
            </div>
          </div>
          <button onClick={onClose} className="h-9 w-9 rounded-xl flex items-center justify-center hover:bg-accent">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="p-6 space-y-3">
          <div>
            <label className={labelCls}>Full Name *</label>
            <input value={fullName} onChange={(e) => setFullName(e.target.value)} className={inputCls} placeholder="Full name" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Date of Birth</label>
              <input type="date" value={dob} onChange={(e) => setDob(e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Sex</label>
              <select value={sex} onChange={(e) => setSex(e.target.value)} className={inputCls}>
                <option value="">—</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Phone</label>
              <input value={phone} onChange={(e) => setPhone(e.target.value)} className={inputCls} placeholder="0712 345 678" />
            </div>
            <div>
              <label className={labelCls}>ID / Passport #</label>
              <input value={idNumber} onChange={(e) => setIdNumber(e.target.value)} className={inputCls} />
            </div>
          </div>
          <div>
            <label className={labelCls}>Address</label>
            <input value={address} onChange={(e) => setAddress(e.target.value)} className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Next of Kin</label>
            <input
              value={nextOfKin}
              onChange={(e) => setNextOfKin(e.target.value)}
              className={inputCls}
              placeholder="Name and phone number"
            />
          </div>
          <div>
            <label className={labelCls}>Known Allergies</label>
            <input
              value={allergies}
              onChange={(e) => setAllergies(e.target.value)}
              className={inputCls}
              placeholder="Penicillin, Latex, Peanuts… (comma-separated)"
            />
          </div>
        </div>
        <div className="flex gap-3 px-6 pb-6">
          <button onClick={onClose} className="flex-1 min-h-11 rounded-xl border border-border text-sm font-semibold hover:bg-accent transition-colors">
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={registerPatient.isPending}
            className="flex-1 min-h-11 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {registerPatient.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            Register
          </button>
        </div>
      </div>
    </div>
  );
}

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
          <Can permission="hospital.records.add">
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
