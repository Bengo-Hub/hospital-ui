'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowLeft, Loader2, Pencil, UserSquare, Wallet, X } from 'lucide-react';
import { toast } from 'sonner';
import { Card, Button, Badge, Input } from '@/components/ui/base';
import { PageHeader, EmptyState, Skeleton } from '@/components/ui/page';
import { Can } from '@/components/auth/can';
import { VisitStatusBadge } from '@/components/clinical/visit-status-badge';
import { apiErrorMessage } from '@/lib/api/error-message';
import { usePatient, useUpdatePatient, useVisitsByPatient } from '@/hooks/useClinical';
import type { Patient } from '@/lib/api/clinical';

function EditPatientModal({ patient, onClose }: { patient: Patient; onClose: () => void }) {
  const update = useUpdatePatient();
  const [fullName, setFullName] = useState(patient.full_name);
  const [phone, setPhone] = useState(patient.phone ?? '');
  const [sex, setSex] = useState(patient.sex ?? '');
  const [dob, setDob] = useState(patient.dob ? patient.dob.slice(0, 10) : '');
  const [idNumber, setIdNumber] = useState(patient.id_number ?? '');
  const [address, setAddress] = useState(patient.address ?? '');
  const [nextOfKin, setNextOfKin] = useState(patient.next_of_kin ?? '');

  const handleSave = async () => {
    if (!fullName.trim()) {
      toast.error('Full name is required');
      return;
    }
    try {
      await update.mutateAsync({
        patientId: patient.id,
        data: {
          full_name: fullName.trim(),
          phone: phone.trim() || undefined,
          sex: sex || undefined,
          dob: dob ? new Date(dob).toISOString() : undefined,
          id_number: idNumber.trim() || undefined,
          address: address.trim() || undefined,
          next_of_kin: nextOfKin.trim() || undefined,
        },
      });
      toast.success('Patient updated');
      onClose();
    } catch (e) {
      toast.error(await apiErrorMessage(e, 'Failed to update patient'));
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-card rounded-2xl border border-border w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h3 className="font-bold text-base">Edit Patient</h3>
          <button onClick={onClose} className="h-9 w-9 rounded-xl flex items-center justify-center hover:bg-accent">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
          <div>
            <label className="text-xs font-semibold text-muted-foreground mb-1 block">Full Name</label>
            <Input value={fullName} onChange={(e) => setFullName(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-muted-foreground mb-1 block">Phone</label>
              <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground mb-1 block">Sex</label>
              <select value={sex} onChange={(e) => setSex(e.target.value)} className="w-full bg-background border border-border rounded-xl py-2 px-3 text-sm">
                <option value="">—</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-muted-foreground mb-1 block">Date of Birth</label>
              <Input type="date" value={dob} onChange={(e) => setDob(e.target.value)} />
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground mb-1 block">ID Number</label>
              <Input value={idNumber} onChange={(e) => setIdNumber(e.target.value)} />
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold text-muted-foreground mb-1 block">Address</label>
            <Input value={address} onChange={(e) => setAddress(e.target.value)} />
          </div>
          <div>
            <label className="text-xs font-semibold text-muted-foreground mb-1 block">Next of Kin (chart note)</label>
            <Input value={nextOfKin} onChange={(e) => setNextOfKin(e.target.value)} placeholder="Free-text — for the settlement contact, use Settle Account instead" />
          </div>
        </div>
        <div className="flex gap-3 px-6 pb-6">
          <Button variant="outline" className="flex-1" onClick={onClose} disabled={update.isPending}>Cancel</Button>
          <Button className="flex-1 gap-2" onClick={handleSave} disabled={update.isPending}>
            {update.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            Save Changes
          </Button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="text-sm font-medium mt-0.5">{value || '—'}</p>
    </div>
  );
}

export default function PatientDetailPage() {
  const params = useParams();
  const orgSlug = params?.orgSlug as string;
  const patientId = params?.id as string;

  const { data: patient, isLoading } = usePatient(patientId);
  const { data: visits, isLoading: visitsLoading } = useVisitsByPatient(patientId);
  const [editOpen, setEditOpen] = useState(false);

  if (isLoading || !patient) {
    return (
      <div className="max-w-5xl mx-auto space-y-4">
        <Skeleton className="h-9 w-64" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex items-start gap-3 mb-6">
        <Link
          href={`/${orgSlug}/patients`}
          className="h-9 w-9 rounded-xl border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent transition-colors mt-0.5 shrink-0"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <PageHeader
          title={patient.full_name}
          subtitle={`MRN ${patient.mrn}`}
          icon={<UserSquare className="h-5 w-5" />}
          actions={
            <Can permission="hospital.records.change">
              <Button variant="outline" className="gap-2" onClick={() => setEditOpen(true)}>
                <Pencil className="h-4 w-4" />
                Edit
              </Button>
            </Can>
          }
        />
      </div>

      <Card className="mb-6">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-5 p-6">
          <Field label="Phone" value={patient.phone} />
          <Field label="Sex" value={patient.sex} />
          <Field label="Date of Birth" value={patient.dob ? new Date(patient.dob).toLocaleDateString() : undefined} />
          <Field label="ID Number" value={patient.id_number} />
          <Field label="Address" value={patient.address} />
          <Field label="Next of Kin (chart)" value={patient.next_of_kin} />
          <Field
            label="Allergies"
            value={
              patient.allergy_flags && patient.allergy_flags.length > 0 ? (
                <div className="flex flex-wrap gap-1 mt-1">
                  {patient.allergy_flags.map((a) => <Badge key={a} variant="error">{a}</Badge>)}
                </div>
              ) : undefined
            }
          />
          <Field label="Status" value={<Badge variant={patient.status === 'active' ? 'success' : 'outline'}>{patient.status}</Badge>} />
        </div>
      </Card>

      <Card>
        <div className="px-5 py-4 border-b border-border">
          <h2 className="text-sm font-bold">Visit History</h2>
        </div>
        {visitsLoading ? (
          <div className="p-6 space-y-3">
            {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
          </div>
        ) : !visits || visits.length === 0 ? (
          <EmptyState icon={<UserSquare className="h-10 w-10" />} title="No visits recorded yet" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-accent/30">
                  <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Visit #</th>
                  <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Type</th>
                  <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Status</th>
                  <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Checked In</th>
                  <th className="text-right px-4 py-3 font-semibold text-muted-foreground">Account</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {visits.map((v) => (
                  <tr key={v.id} className="hover:bg-accent/20 transition-colors">
                    <td className="px-4 py-3.5 font-mono text-xs">{v.visit_number}</td>
                    <td className="px-4 py-3.5 text-muted-foreground text-xs">{v.visit_type}</td>
                    <td className="px-4 py-3.5"><VisitStatusBadge status={v.status} /></td>
                    <td className="px-4 py-3.5 text-muted-foreground text-xs whitespace-nowrap">
                      {new Date(v.checked_in_at).toLocaleString()}
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <Link
                        href={`/${orgSlug}/visits/${v.id}/account`}
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline"
                      >
                        <Wallet className="h-3.5 w-3.5" />
                        View Account
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {editOpen && <EditPatientModal patient={patient} onClose={() => setEditOpen(false)} />}
    </div>
  );
}
