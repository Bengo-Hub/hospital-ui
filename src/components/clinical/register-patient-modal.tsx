'use client';

// Extracted from `[orgSlug]/patients/page.tsx` (2026-09-03) so it can be reused as the
// shared-ui-lib "+ Add new patient" footer dialog anywhere a patient picker appears (e.g.
// pharmacy's NewPrescriptionModal), not just the Patients page's own "Register Patient" action —
// mirrors the fleet's existing pattern (inventory-ui's `BrandCombobox`'s sibling `AddBrandDialog`)
// of a picker + create-dialog pair sharing one `onCreated`/`onRegistered` contract.

import { useState, type ChangeEvent } from 'react';
import { toast } from 'sonner';
import { Camera, Loader2, UserPlus, X } from 'lucide-react';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { useRegisterPatient } from '@/hooks/useClinical';
import { apiErrorMessage } from '@/lib/api/error-message';
import { mediaApi, patientsApi } from '@/lib/api/clinical';
import type { IdentificationType, Patient, PatientDuplicateSummary } from '@/lib/api/clinical';

const IDENTIFICATION_TYPES: { value: IdentificationType; label: string }[] = [
  { value: 'national_id', label: 'National ID' },
  { value: 'passport', label: 'Passport' },
  { value: 'birth_certificate', label: 'Birth Certificate' },
  { value: 'maisha_number', label: 'Maisha Number' },
  { value: 'alien_id', label: 'Alien ID' },
];

const inputCls = 'w-full bg-background border border-border rounded-xl py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40';
const labelCls = 'text-xs font-semibold text-muted-foreground mb-1 block';

export function RegisterPatientModal({
  orgSlug,
  onClose,
  onRegistered,
}: {
  orgSlug: string;
  onClose: () => void;
  onRegistered: (p: Patient) => void;
}) {
  const registerPatient = useRegisterPatient();
  const [fullName, setFullName] = useState('');
  const [dob, setDob] = useState('');
  const [sex, setSex] = useState('');
  const [phone, setPhone] = useState('');
  const [idNumber, setIdNumber] = useState('');
  const [identificationType, setIdentificationType] = useState<IdentificationType | ''>('');
  const [shaBeneficiaryNumber, setShaBeneficiaryNumber] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');
  const [photoUploading, setPhotoUploading] = useState(false);
  const [address, setAddress] = useState('');
  const [nextOfKin, setNextOfKin] = useState('');
  const [allergies, setAllergies] = useState('');
  const [checkingDuplicates, setCheckingDuplicates] = useState(false);
  const [duplicateMatches, setDuplicateMatches] = useState<PatientDuplicateSummary[] | null>(null);

  const handlePhotoChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setPhotoUploading(true);
    try {
      const { url } = await mediaApi.upload(orgSlug, file);
      setPhotoUrl(url);
    } catch (err) {
      toast.error(await apiErrorMessage(err, 'Failed to upload photo'));
    } finally {
      setPhotoUploading(false);
    }
  };

  const doRegister = async () => {
    try {
      const patient = await registerPatient.mutateAsync({
        full_name: fullName.trim(),
        dob: dob || undefined,
        sex: sex || undefined,
        phone: phone || undefined,
        id_number: idNumber || undefined,
        identification_type: identificationType || undefined,
        sha_beneficiary_number: shaBeneficiaryNumber || undefined,
        photo_url: photoUrl || undefined,
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

  const handleSubmit = async () => {
    if (!fullName.trim()) {
      toast.error('Full name is required');
      return;
    }
    // Non-blocking duplicate check — a match surfaces a warning, never a hard stop.
    setCheckingDuplicates(true);
    try {
      const matches = await patientsApi.checkDuplicates(orgSlug, {
        full_name: fullName.trim(),
        phone: phone || undefined,
        id_number: idNumber || undefined,
      });
      if (matches.length > 0) {
        setDuplicateMatches(matches);
        return;
      }
    } catch {
      // Lookup failure must never block registration — proceed as if no match was found.
    } finally {
      setCheckingDuplicates(false);
    }
    await doRegister();
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-card rounded-2xl border border-border w-full max-w-xl shadow-2xl max-h-[90vh] overflow-y-auto">
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
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>ID Type</label>
              <select
                value={identificationType}
                onChange={(e) => setIdentificationType(e.target.value as IdentificationType | '')}
                className={inputCls}
              >
                <option value="">—</option>
                {IDENTIFICATION_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelCls}>SHA/SHIF Beneficiary #</label>
              <input
                value={shaBeneficiaryNumber}
                onChange={(e) => setShaBeneficiaryNumber(e.target.value)}
                className={inputCls}
                placeholder="Captured once, reused at claims"
              />
            </div>
          </div>
          <div>
            <label className={labelCls}>Photo</label>
            <div className="flex items-center gap-3">
              {photoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={photoUrl} alt="Patient" className="h-12 w-12 rounded-lg object-cover border border-border" />
              ) : (
                <div className="h-12 w-12 rounded-lg border border-dashed border-border flex items-center justify-center text-muted-foreground">
                  <Camera className="h-4.5 w-4.5" />
                </div>
              )}
              <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-xs font-medium hover:bg-accent transition-colors cursor-pointer">
                {photoUploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Camera className="h-3.5 w-3.5" />}
                {photoUrl ? 'Replace photo' : 'Add photo'}
                <input type="file" accept="image/jpeg,image/png" className="hidden" onChange={handlePhotoChange} disabled={photoUploading} />
              </label>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
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
            disabled={registerPatient.isPending || checkingDuplicates}
            className="flex-1 min-h-11 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {(registerPatient.isPending || checkingDuplicates) && <Loader2 className="h-4 w-4 animate-spin" />}
            Register
          </button>
        </div>
      </div>
      <ConfirmDialog
        open={duplicateMatches !== null}
        variant="warning"
        title="Possible duplicate patient"
        description={
          duplicateMatches
            ? `${duplicateMatches.length === 1 ? 'A patient' : `${duplicateMatches.length} patients`} matching this name, phone, or ID already exists: ${duplicateMatches
                .map((m) => `${m.full_name} (MRN ${m.mrn})`)
                .join(', ')}. Register a new record anyway?`
            : ''
        }
        confirmLabel="Register anyway"
        onCancel={() => setDuplicateMatches(null)}
        onConfirm={() => {
          setDuplicateMatches(null);
          void doRegister();
        }}
      />
    </div>
  );
}
