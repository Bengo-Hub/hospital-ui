'use client';

import { useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import { toast } from 'sonner';
import {
  CalendarClock,
  CheckCircle2,
  ClipboardCheck,
  Loader2,
  Pencil,
  Play,
  Plus,
  Scissors,
  Stethoscope,
  Trash2,
  Users,
  X,
  XCircle,
  Zap,
} from 'lucide-react';
import { Card, Button, Badge, Input } from '@/components/ui/base';
import { PageHeader, EmptyState, Skeleton } from '@/components/ui/page';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Can } from '@/components/auth/can';
import { P } from '@/lib/rbac/permissions';
import { apiErrorMessage } from '@/lib/api/error-message';
import { useVisits, usePatients, useCheckInVisit } from '@/hooks/useClinical';
import { CreatableSelect } from '@/components/ui/creatable-select';
import { RegisterPatientModal } from '@/components/clinical/register-patient-modal';
import { useSetBookingEquipment } from '@/hooks/useAssets';
import { EquipmentPickerModal } from '@/components/assets/equipment-picker-modal';
import {
  useTheatreSchedule,
  useCreateBooking,
  useUpdateBooking,
  useActivateBooking,
  useUpdateChecklist,
  useStartSurgery,
  useCompleteSurgery,
  useCancelBooking,
  useStaffAssignments,
  useAssignStaff,
  useRemoveStaffAssignment,
  usePacuStays,
  useAdmitToPacu,
  useDischargeFromPacu,
  useOperativeNote,
  useRecordOperativeNote,
} from '@/hooks/useTheatre';
import type { PacuDisposition, TheatreBooking, TheatreBookingStatus, TheatreStaffRole } from '@/lib/api/theatre';
import type { Patient } from '@/lib/api/clinical';

const STATUS_BADGE: Record<TheatreBookingStatus, { variant: 'default' | 'success' | 'warning' | 'error' | 'outline'; label: string }> = {
  awaiting_payment: { variant: 'warning', label: 'Awaiting Payment' },
  scheduled: { variant: 'outline', label: 'Scheduled' },
  in_progress: { variant: 'default', label: 'In Progress' },
  completed: { variant: 'success', label: 'Completed' },
  cancelled: { variant: 'error', label: 'Cancelled' },
};

// The real WHO Surgical Safety Checklist (verbatim, revised 1/2009, ©WHO 2009), replacing the 5
// items this page invented for the original Sprint 7 pass — see sprint-7-theatre-icu.md's own Gap
// audit section, which reproduces the full source text. Stored as a flat map[string]bool (the
// backend field's actual type, unchanged — see hospital-api's TheatreBooking.checklist doc
// comment); phase grouping is a pure UI concern via each item's own `phase` key, not a schema
// change. WHO's own footer: "This checklist is not intended to be comprehensive. Additions and
// modifications to fit local practice are encouraged."
const CHECKLIST_ITEMS: { key: string; phase: 'sign_in' | 'time_out' | 'sign_out'; label: string }[] = [
  // Sign In — before induction of anaesthesia (at least nurse and anaesthetist)
  { key: 'sign_in_identity_site_procedure_consent', phase: 'sign_in', label: 'Patient has confirmed identity, site, procedure, and consent' },
  { key: 'sign_in_site_marked', phase: 'sign_in', label: 'Site is marked (or not applicable)' },
  { key: 'sign_in_anaesthesia_machine_check', phase: 'sign_in', label: 'Anaesthesia machine and medication check complete' },
  { key: 'sign_in_pulse_oximeter_functioning', phase: 'sign_in', label: 'Pulse oximeter on patient and functioning' },
  { key: 'sign_in_known_allergy', phase: 'sign_in', label: 'Does patient have a known allergy?' },
  { key: 'sign_in_difficult_airway_risk', phase: 'sign_in', label: 'Difficult airway/aspiration risk? (equipment/assistance available if yes)' },
  { key: 'sign_in_blood_loss_risk', phase: 'sign_in', label: 'Risk of >500mL blood loss (7mL/kg in children)? (IV access/fluids planned if yes)' },
  // Time Out — before skin incision (nurse, anaesthetist, and surgeon)
  { key: 'time_out_team_introduced', phase: 'time_out', label: 'All team members have introduced themselves by name and role' },
  { key: 'time_out_confirmed_patient_procedure_site', phase: 'time_out', label: "Confirmed patient's name, procedure, and incision site" },
  { key: 'time_out_antibiotic_prophylaxis', phase: 'time_out', label: 'Antibiotic prophylaxis given within the last 60 minutes (or not applicable)' },
  { key: 'time_out_surgeon_critical_steps', phase: 'time_out', label: 'Surgeon has reviewed critical/non-routine steps, case duration, anticipated blood loss' },
  { key: 'time_out_anaesthetist_concerns', phase: 'time_out', label: 'Anaesthetist has reviewed any patient-specific concerns' },
  { key: 'time_out_sterility_confirmed', phase: 'time_out', label: 'Nursing team has confirmed sterility (including indicator results), equipment issues/concerns' },
  { key: 'time_out_imaging_displayed', phase: 'time_out', label: 'Essential imaging is displayed (or not applicable)' },
  // Sign Out — before the patient leaves the operating room (nurse, anaesthetist, and surgeon)
  { key: 'sign_out_nurse_confirms_counts_and_specimens', phase: 'sign_out', label: 'Nurse verbally confirms procedure name, instrument/sponge/needle counts, specimen labelling, equipment problems' },
  { key: 'sign_out_recovery_concerns_discussed', phase: 'sign_out', label: 'Team has discussed key concerns for recovery and management of this patient' },
];

const CHECKLIST_PHASE_LABELS: Record<'sign_in' | 'time_out' | 'sign_out', string> = {
  sign_in: 'Sign In — before induction of anaesthesia',
  time_out: 'Time Out — before skin incision',
  sign_out: 'Sign Out — before leaving the operating room',
};

function NewBookingModal({ onClose }: { onClose: () => void }) {
  const params = useParams();
  const orgSlug = params?.orgSlug as string;
  const { data: patients, isLoading: patientsLoading } = usePatients();
  const { data: visits, isLoading: visitsLoading } = useVisits();
  const createBooking = useCreateBooking();
  const checkInVisit = useCheckInVisit();
  const [patientId, setPatientId] = useState('');
  const [visitId, setVisitId] = useState('');
  const [showRegisterPatient, setShowRegisterPatient] = useState(false);
  const [room, setRoom] = useState('');
  const [surgeryType, setSurgeryType] = useState('');
  const [scheduledAt, setScheduledAt] = useState('');
  const [duration, setDuration] = useState('60');
  const [fee, setFee] = useState('');

  const handlePatientRegistered = (p: Patient) => {
    setShowRegisterPatient(false);
    setPatientId(p.id);
  };
  const handleOpenVisit = async () => {
    if (!patientId) return;
    try {
      const visit = await checkInVisit.mutateAsync({ patient_id: patientId });
      setVisitId(visit.id);
      toast.success(`Visit ${visit.visit_number} opened`);
    } catch (e) {
      toast.error(await apiErrorMessage(e, 'Failed to open visit'));
    }
  };

  const handleSubmit = async () => {
    if (!visitId || !room.trim() || !surgeryType.trim() || !scheduledAt) {
      toast.error('Visit, theatre room, surgery type and scheduled time are required');
      return;
    }
    try {
      await createBooking.mutateAsync({
        visit_id: visitId,
        theatre_room: room.trim(),
        surgery_type: surgeryType.trim(),
        scheduled_at: new Date(scheduledAt).toISOString(),
        duration_minutes: Number(duration) || 60,
        fee_amount: fee ? Number(fee) : undefined,
      });
      toast.success('Surgery scheduled');
      onClose();
    } catch (e) {
      toast.error(await apiErrorMessage(e, 'Failed to schedule surgery'));
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-card rounded-2xl border border-border w-full max-w-lg shadow-2xl flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
          <h3 className="font-bold text-base">Schedule Surgery</h3>
          <button onClick={onClose} className="h-9 w-9 rounded-xl flex items-center justify-center hover:bg-accent">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="p-6 space-y-4 overflow-y-auto">
          <div>
            <label className="text-xs font-semibold text-muted-foreground mb-1 block">Registered Patient</label>
            {patientsLoading ? (
              <Skeleton className="h-9 w-full" />
            ) : (
              <CreatableSelect
                value={patientId}
                onChange={(id) => setPatientId(id)}
                options={(patients ?? []).map((p) => ({ id: p.id, name: p.full_name, hint: p.mrn }))}
                placeholder="Select patient…"
                onAddClick={() => setShowRegisterPatient(true)}
                addLabel="Register new patient…"
              />
            )}
          </div>
          <div>
            <label className="text-xs font-semibold text-muted-foreground mb-1 block">
              Visit <span className="text-destructive">*</span>
            </label>
            {visitsLoading ? (
              <Skeleton className="h-9 w-full" />
            ) : (
              <CreatableSelect
                value={visitId}
                onChange={(id) => setVisitId(id)}
                options={(visits ?? []).map((v) => ({ id: v.id, name: `${v.visit_number} — ${v.chief_complaint || 'no chief complaint recorded'}` }))}
                placeholder="Select visit…"
                onAddClick={patientId ? handleOpenVisit : undefined}
                addLabel={checkInVisit.isPending ? 'Opening visit…' : 'Open new visit for this patient'}
                disabled={checkInVisit.isPending}
              />
            )}
            {!patientId && (
              <p className="text-[11px] text-muted-foreground mt-1">Select a registered patient above to open a new visit.</p>
            )}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-muted-foreground mb-1 block">
                Theatre Room <span className="text-destructive">*</span>
              </label>
              <Input value={room} onChange={(e) => setRoom(e.target.value)} placeholder="e.g. OT-1" />
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground mb-1 block">Duration (minutes)</label>
              <Input type="number" min={15} step={15} value={duration} onChange={(e) => setDuration(e.target.value)} />
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold text-muted-foreground mb-1 block">
              Surgery Type <span className="text-destructive">*</span>
            </label>
            <Input value={surgeryType} onChange={(e) => setSurgeryType(e.target.value)} placeholder="e.g. Appendectomy" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-muted-foreground mb-1 block">
                Scheduled At <span className="text-destructive">*</span>
              </label>
              <input
                type="datetime-local"
                value={scheduledAt}
                onChange={(e) => setScheduledAt(e.target.value)}
                className="w-full bg-background border border-border rounded-xl py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground mb-1 block">Procedure Fee (optional)</label>
              <Input type="number" min={0} value={fee} onChange={(e) => setFee(e.target.value)} placeholder="e.g. 25000" />
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            Leaving the fee blank posts no charge for this booking — a facility that prices theatre entirely through other
            departments can skip it.
          </p>
        </div>
        <div className="flex gap-3 px-6 pb-6 pt-2 border-t border-border shrink-0">
          <Button variant="outline" className="flex-1" onClick={onClose} disabled={createBooking.isPending}>
            Cancel
          </Button>
          <Button className="flex-1 gap-2" onClick={handleSubmit} disabled={createBooking.isPending}>
            {createBooking.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            Schedule
          </Button>
        </div>
      </div>
      {showRegisterPatient && (
        <RegisterPatientModal orgSlug={orgSlug} onClose={() => setShowRegisterPatient(false)} onRegistered={handlePatientRegistered} />
      )}
    </div>
  );
}

// Renders an RFC3339 timestamp as the local-time value a <input type="datetime-local"> expects
// (no timezone, no seconds) — the inverse of NewBookingModal's `new Date(scheduledAt).toISOString()`,
// which parses that same local-time string back via the browser's local timezone.
function toDatetimeLocalValue(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function RescheduleModal({ booking, onClose }: { booking: TheatreBooking; onClose: () => void }) {
  const updateBooking = useUpdateBooking();
  const [room, setRoom] = useState(booking.theatre_room);
  const [surgeryType, setSurgeryType] = useState(booking.surgery_type);
  const [scheduledAt, setScheduledAt] = useState(toDatetimeLocalValue(booking.scheduled_at));
  const [duration, setDuration] = useState(String(booking.duration_minutes));
  // Plain text field, not a picker — mirrors TeamSection's staff_user_id input, since
  // NewBookingModal doesn't actually surface a surgeon_id field of its own to mirror.
  const [surgeonId, setSurgeonId] = useState(booking.surgeon_id ?? '');

  const handleSubmit = async () => {
    if (!room.trim() || !surgeryType.trim() || !scheduledAt) {
      toast.error('Theatre room, surgery type and scheduled time are required');
      return;
    }
    const trimmedSurgeonId = surgeonId.trim();
    try {
      await updateBooking.mutateAsync({
        bookingId: booking.id,
        data: {
          theatre_room: room.trim(),
          surgery_type: surgeryType.trim(),
          scheduled_at: new Date(scheduledAt).toISOString(),
          duration_minutes: Number(duration) || booking.duration_minutes,
          // clear_surgeon_id removes the assignment entirely — only sent when the field was
          // cleared and the booking actually had a surgeon assigned; leaving it untouched sends
          // neither key, so a blank field on a booking with no surgeon is simply a no-op.
          ...(trimmedSurgeonId ? { surgeon_id: trimmedSurgeonId } : booking.surgeon_id ? { clear_surgeon_id: true } : {}),
        },
      });
      toast.success('Booking rescheduled');
      onClose();
    } catch (e) {
      toast.error(await apiErrorMessage(e, 'Failed to reschedule booking'));
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-card rounded-2xl border border-border w-full max-w-lg shadow-2xl flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
          <h3 className="font-bold text-base">Reschedule Surgery</h3>
          <button onClick={onClose} className="h-9 w-9 rounded-xl flex items-center justify-center hover:bg-accent">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="p-6 space-y-4 overflow-y-auto">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-muted-foreground mb-1 block">
                Theatre Room <span className="text-destructive">*</span>
              </label>
              <Input value={room} onChange={(e) => setRoom(e.target.value)} placeholder="e.g. OT-1" />
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground mb-1 block">Duration (minutes)</label>
              <Input type="number" min={15} step={15} value={duration} onChange={(e) => setDuration(e.target.value)} />
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold text-muted-foreground mb-1 block">
              Surgery Type <span className="text-destructive">*</span>
            </label>
            <Input value={surgeryType} onChange={(e) => setSurgeryType(e.target.value)} placeholder="e.g. Appendectomy" />
          </div>
          <div>
            <label className="text-xs font-semibold text-muted-foreground mb-1 block">
              Scheduled At <span className="text-destructive">*</span>
            </label>
            <input
              type="datetime-local"
              value={scheduledAt}
              onChange={(e) => setScheduledAt(e.target.value)}
              className="w-full bg-background border border-border rounded-xl py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-muted-foreground mb-1 block">Surgeon ID (optional)</label>
            <Input value={surgeonId} onChange={(e) => setSurgeonId(e.target.value)} placeholder="Surgeon user ID" />
            <p className="text-xs text-muted-foreground mt-1">Clear this field to remove the surgeon assignment entirely.</p>
          </div>
        </div>
        <div className="flex gap-3 px-6 pb-6 pt-2 border-t border-border shrink-0">
          <Button variant="outline" className="flex-1" onClick={onClose} disabled={updateBooking.isPending}>
            Cancel
          </Button>
          <Button className="flex-1 gap-2" onClick={handleSubmit} disabled={updateBooking.isPending}>
            {updateBooking.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            Save Changes
          </Button>
        </div>
      </div>
    </div>
  );
}

function ChecklistModal({ booking, onClose }: { booking: TheatreBooking; onClose: () => void }) {
  const updateChecklist = useUpdateChecklist();
  const [checklist, setChecklist] = useState<Record<string, boolean>>(booking.checklist ?? {});

  const handleSave = async () => {
    try {
      await updateChecklist.mutateAsync({ bookingId: booking.id, checklist });
      toast.success('Checklist updated');
      onClose();
    } catch (e) {
      toast.error(await apiErrorMessage(e, 'Failed to update checklist'));
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-card rounded-2xl border border-border w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h3 className="font-bold text-base">Pre-op Checklist</h3>
          <button onClick={onClose} className="h-9 w-9 rounded-xl flex items-center justify-center hover:bg-accent">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
          {(['sign_in', 'time_out', 'sign_out'] as const).map((phase) => (
            <div key={phase}>
              <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5">{CHECKLIST_PHASE_LABELS[phase]}</p>
              <div className="space-y-1">
                {CHECKLIST_ITEMS.filter((item) => item.phase === phase).map((item) => (
                  <label key={item.key} className="flex items-start gap-3 px-3 py-2 rounded-xl text-sm cursor-pointer hover:bg-accent/40">
                    <input
                      type="checkbox"
                      checked={!!checklist[item.key]}
                      onChange={(e) => setChecklist((prev) => ({ ...prev, [item.key]: e.target.checked }))}
                      className="h-4 w-4 rounded border-border mt-0.5 shrink-0"
                    />
                    <span>{item.label}</span>
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>
        <div className="flex gap-3 px-6 pb-6">
          <Button variant="outline" className="flex-1" onClick={onClose} disabled={updateChecklist.isPending}>
            Cancel
          </Button>
          <Button className="flex-1 gap-2" onClick={handleSave} disabled={updateChecklist.isPending}>
            {updateChecklist.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            Save Checklist
          </Button>
        </div>
      </div>
    </div>
  );
}

const STAFF_ROLE_OPTIONS: { value: TheatreStaffRole; label: string }[] = [
  { value: 'surgeon', label: 'Surgeon' },
  { value: 'assistant_surgeon', label: 'Assistant Surgeon' },
  { value: 'anaesthetist', label: 'Anaesthetist' },
  { value: 'scrub_nurse', label: 'Scrub Nurse' },
  { value: 'circulating_nurse', label: 'Circulating Nurse' },
  { value: 'other', label: 'Other' },
];

const PACU_DISPOSITION_OPTIONS: { value: PacuDisposition; label: string }[] = [
  { value: 'to_ward', label: 'To Ward' },
  { value: 'to_icu', label: 'To ICU' },
  { value: 'home', label: 'Home' },
  { value: 'deceased', label: 'Deceased' },
];

function TeamSection({ bookingId }: { bookingId: string }) {
  const { data: assignments } = useStaffAssignments(bookingId);
  const assign = useAssignStaff();
  const remove = useRemoveStaffAssignment();
  const [staffUserId, setStaffUserId] = useState('');
  const [role, setRole] = useState<TheatreStaffRole>('assistant_surgeon');

  const handleAssign = async () => {
    if (!staffUserId.trim()) {
      toast.error('Enter the staff member’s user ID');
      return;
    }
    try {
      await assign.mutateAsync({ bookingId, data: { staff_user_id: staffUserId.trim(), role } });
      setStaffUserId('');
      toast.success('Team member assigned');
    } catch (e) {
      toast.error(await apiErrorMessage(e, 'Failed to assign staff — check for a scheduling conflict'));
    }
  };

  return (
    <div className="space-y-2">
      {(assignments ?? []).map((a) => (
        <div key={a.id} className="flex items-center justify-between text-sm border-b border-border/60 pb-1.5">
          <span>{STAFF_ROLE_OPTIONS.find((r) => r.value === a.role)?.label ?? a.role} — <span className="font-mono text-xs text-muted-foreground">{a.staff_user_id}</span></span>
          <button onClick={() => remove.mutateAsync({ bookingId, assignmentId: a.id })} className="text-destructive hover:opacity-70">
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      ))}
      <div className="flex gap-2 pt-1">
        <input
          value={staffUserId}
          onChange={(e) => setStaffUserId(e.target.value)}
          placeholder="Staff user ID"
          className="flex-1 bg-background border border-border rounded-lg py-1.5 px-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-primary/40"
        />
        <select
          value={role}
          onChange={(e) => setRole(e.target.value as TheatreStaffRole)}
          className="bg-background border border-border rounded-lg py-1.5 px-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-primary/40"
        >
          {STAFF_ROLE_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
        <Button size="sm" className="gap-1.5" onClick={handleAssign} disabled={assign.isPending}>
          {assign.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
          Add
        </Button>
      </div>
    </div>
  );
}

function PacuSection({ bookingId }: { bookingId: string }) {
  const { data: stays } = usePacuStays(bookingId);
  const admit = useAdmitToPacu();
  const discharge = useDischargeFromPacu();
  const [bayLabel, setBayLabel] = useState('');
  const [disposition, setDisposition] = useState<PacuDisposition>('to_ward');
  const activeStay = (stays ?? []).find((s) => !s.discharged_at);

  const handleAdmit = async () => {
    try {
      await admit.mutateAsync({ bookingId, data: { bay_label: bayLabel.trim() || undefined } });
      toast.success('Admitted to PACU');
    } catch (e) {
      toast.error(await apiErrorMessage(e, 'Failed to admit to PACU'));
    }
  };

  const handleDischarge = async () => {
    if (!activeStay) return;
    try {
      await discharge.mutateAsync({ pacuStayId: activeStay.id, data: { disposition } });
      toast.success('Discharged from PACU');
    } catch (e) {
      toast.error(await apiErrorMessage(e, 'Failed to discharge from PACU'));
    }
  };

  return (
    <div className="space-y-2">
      {(stays ?? []).map((s) => (
        <div key={s.id} className="text-sm border-b border-border/60 pb-1.5">
          <p>{s.bay_label || 'PACU'} — admitted {new Date(s.admitted_at).toLocaleString()}</p>
          {s.discharged_at ? (
            <p className="text-xs text-muted-foreground">Discharged {new Date(s.discharged_at).toLocaleString()} ({s.discharge_disposition})</p>
          ) : (
            <p className="text-xs text-amber-600 dark:text-amber-400">In PACU</p>
          )}
        </div>
      ))}
      {activeStay ? (
        <div className="flex gap-2 pt-1">
          <select
            value={disposition}
            onChange={(e) => setDisposition(e.target.value as PacuDisposition)}
            className="flex-1 bg-background border border-border rounded-lg py-1.5 px-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-primary/40"
          >
            {PACU_DISPOSITION_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
          <Button size="sm" className="gap-1.5" onClick={handleDischarge} disabled={discharge.isPending}>
            {discharge.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            Discharge from PACU
          </Button>
        </div>
      ) : (
        <div className="flex gap-2 pt-1">
          <input
            value={bayLabel}
            onChange={(e) => setBayLabel(e.target.value)}
            placeholder="Bay label (optional)"
            className="flex-1 bg-background border border-border rounded-lg py-1.5 px-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
          <Button size="sm" className="gap-1.5" onClick={handleAdmit} disabled={admit.isPending}>
            {admit.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            Admit to PACU
          </Button>
        </div>
      )}
    </div>
  );
}

function OperativeNoteSection({ bookingId }: { bookingId: string }) {
  const { data: existing } = useOperativeNote(bookingId);
  const record = useRecordOperativeNote();
  const [procedurePerformed, setProcedurePerformed] = useState(existing?.procedure_performed ?? '');
  const [findings, setFindings] = useState(existing?.findings ?? '');
  const [complications, setComplications] = useState(existing?.complications ?? '');
  const [bloodLoss, setBloodLoss] = useState(existing?.estimated_blood_loss_ml?.toString() ?? '');
  const [implants, setImplants] = useState(existing?.implants_used ?? '');
  const [postOpDiagnosis, setPostOpDiagnosis] = useState(existing?.post_op_diagnosis ?? '');

  const handleSave = async () => {
    if (!procedurePerformed.trim()) {
      toast.error('Procedure performed is required');
      return;
    }
    try {
      await record.mutateAsync({
        bookingId,
        data: {
          procedure_performed: procedurePerformed.trim(),
          findings: findings.trim() || undefined,
          complications: complications.trim() || undefined,
          estimated_blood_loss_ml: bloodLoss.trim() ? Number(bloodLoss) : undefined,
          implants_used: implants.trim() || undefined,
          post_op_diagnosis: postOpDiagnosis.trim() || undefined,
        },
      });
      toast.success('Operative note saved');
    } catch (e) {
      toast.error(await apiErrorMessage(e, 'Failed to save operative note'));
    }
  };

  const inputCls = 'w-full bg-background border border-border rounded-lg py-1.5 px-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-primary/40';

  return (
    <div className="space-y-2">
      <input placeholder="Procedure performed *" value={procedurePerformed} onChange={(e) => setProcedurePerformed(e.target.value)} className={inputCls} />
      <textarea placeholder="Findings" value={findings} onChange={(e) => setFindings(e.target.value)} rows={2} className={`${inputCls} resize-none`} />
      <textarea placeholder="Complications" value={complications} onChange={(e) => setComplications(e.target.value)} rows={2} className={`${inputCls} resize-none`} />
      <div className="grid grid-cols-2 gap-2">
        <input placeholder="Est. blood loss (mL)" type="number" value={bloodLoss} onChange={(e) => setBloodLoss(e.target.value)} className={inputCls} />
        <input placeholder="Implants used" value={implants} onChange={(e) => setImplants(e.target.value)} className={inputCls} />
      </div>
      <input placeholder="Post-op diagnosis" value={postOpDiagnosis} onChange={(e) => setPostOpDiagnosis(e.target.value)} className={inputCls} />
      <Button size="sm" className="gap-1.5" onClick={handleSave} disabled={record.isPending}>
        {record.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
        {existing ? 'Update Operative Note' : 'Save Operative Note'}
      </Button>
    </div>
  );
}

function BookingDetailsModal({ booking, onClose }: { booking: TheatreBooking; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-card rounded-2xl border border-border w-full max-w-3xl shadow-2xl flex flex-col max-h-[85vh]">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
          <h3 className="font-bold text-base">{booking.surgery_type} — {booking.theatre_room}</h3>
          <button onClick={onClose} className="h-9 w-9 rounded-xl flex items-center justify-center hover:bg-accent">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="p-6 space-y-5 overflow-y-auto">
          <div className="grid md:grid-cols-2 gap-5">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-2">Surgical Team</p>
              <TeamSection bookingId={booking.id} />
            </div>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-2">PACU (Recovery)</p>
              <PacuSection bookingId={booking.id} />
            </div>
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-2">Operative Note</p>
            <OperativeNoteSection bookingId={booking.id} />
          </div>
        </div>
        <div className="px-6 pb-6 pt-2 border-t border-border shrink-0">
          <Button variant="outline" className="w-full" onClick={onClose}>Close</Button>
        </div>
      </div>
    </div>
  );
}

export default function TheatreSchedulePage() {
  const [date, setDate] = useState('');
  const { data: bookings, isLoading } = useTheatreSchedule(date || undefined);
  const [newOpen, setNewOpen] = useState(false);
  const [checklistBooking, setChecklistBooking] = useState<TheatreBooking | null>(null);
  const [detailsBooking, setDetailsBooking] = useState<TheatreBooking | null>(null);
  const [equipmentBooking, setEquipmentBooking] = useState<TheatreBooking | null>(null);
  const [rescheduleBooking, setRescheduleBooking] = useState<TheatreBooking | null>(null);
  const [cancelTarget, setCancelTarget] = useState<TheatreBooking | null>(null);

  const activate = useActivateBooking();
  const start = useStartSurgery();
  const complete = useCompleteSurgery();
  const cancel = useCancelBooking();
  const setEquipment = useSetBookingEquipment();

  const rows = useMemo(() => bookings ?? [], [bookings]);

  const handleActivate = async (b: TheatreBooking) => {
    try {
      await activate.mutateAsync(b.id);
      toast.success('Booking confirmed');
    } catch (e) {
      toast.error(await apiErrorMessage(e, 'Failed to activate — confirm the procedure fee has been paid'));
    }
  };
  const handleStart = async (b: TheatreBooking) => {
    try {
      await start.mutateAsync(b.id);
      toast.success('Surgery started');
    } catch (e) {
      toast.error(await apiErrorMessage(e, 'Failed to start surgery'));
    }
  };
  const handleComplete = async (b: TheatreBooking) => {
    try {
      await complete.mutateAsync(b.id);
      toast.success('Surgery completed');
    } catch (e) {
      toast.error(await apiErrorMessage(e, 'Failed to complete surgery'));
    }
  };
  const confirmCancel = async () => {
    if (!cancelTarget) return;
    try {
      await cancel.mutateAsync(cancelTarget.id);
      toast.success('Booking cancelled');
    } catch (e) {
      toast.error(await apiErrorMessage(e, 'Failed to cancel booking'));
    } finally {
      setCancelTarget(null);
    }
  };

  return (
    <div className="max-w-7xl mx-auto">
      <PageHeader
        title="Theatre Schedule"
        subtitle="Surgery bookings by theatre room — conflict-checked at scheduling time"
        icon={<Scissors className="h-5 w-5" />}
        actions={
          <Can permission={P.THEATRE_ADD}>
            <Button className="gap-2" onClick={() => setNewOpen(true)}>
              <Plus className="h-4 w-4" />
              Schedule Surgery
            </Button>
          </Can>
        }
      />

      <div className="flex flex-wrap items-center gap-3 mb-5">
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="bg-background border border-border rounded-xl py-2 px-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
        />
        {date && (
          <Button size="sm" variant="outline" onClick={() => setDate('')}>
            Clear date filter
          </Button>
        )}
      </div>

      <Card>
        {isLoading ? (
          <div className="p-6 space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        ) : rows.length === 0 ? (
          <EmptyState icon={<CalendarClock className="h-10 w-10" />} title="No bookings found" description="Schedule a surgery to get started." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-accent/30">
                  <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Room</th>
                  <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Surgery</th>
                  <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Scheduled</th>
                  <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Status</th>
                  <th className="text-right px-4 py-3 font-semibold text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {rows.map((b) => {
                  const cfg = STATUS_BADGE[b.status];
                  return (
                    <tr key={b.id} className="hover:bg-accent/20 transition-colors">
                      <td className="px-4 py-3.5 font-mono text-xs">{b.theatre_room}</td>
                      <td className="px-4 py-3.5">{b.surgery_type}</td>
                      <td className="px-4 py-3.5 text-muted-foreground text-xs whitespace-nowrap">
                        {new Date(b.scheduled_at).toLocaleString()} · {b.duration_minutes}m
                      </td>
                      <td className="px-4 py-3.5">
                        <Badge variant={cfg.variant}>{cfg.label}</Badge>
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center justify-end gap-2">
                          {b.status === 'awaiting_payment' && (
                            <Can permission={[P.BILLING_COLLECT_OWN, P.BILLING_COLLECT_ANY]}>
                              <Button size="sm" variant="secondary" className="gap-1.5" onClick={() => handleActivate(b)} disabled={activate.isPending}>
                                <Zap className="h-3.5 w-3.5" />
                                Activate
                              </Button>
                            </Can>
                          )}
                          {b.status === 'scheduled' && (
                            <>
                              <Can permission={P.THEATRE_CHANGE}>
                                <Button size="sm" variant="outline" className="gap-1.5" onClick={() => setChecklistBooking(b)}>
                                  <ClipboardCheck className="h-3.5 w-3.5" />
                                  Checklist
                                </Button>
                              </Can>
                              <Can permission={P.THEATRE_CHANGE}>
                                <Button size="sm" className="gap-1.5" onClick={() => handleStart(b)} disabled={start.isPending}>
                                  <Play className="h-3.5 w-3.5" />
                                  Start
                                </Button>
                              </Can>
                            </>
                          )}
                          {b.status === 'in_progress' && (
                            <Can permission={P.THEATRE_CHANGE}>
                              <Button size="sm" className="gap-1.5" onClick={() => handleComplete(b)} disabled={complete.isPending}>
                                <CheckCircle2 className="h-3.5 w-3.5" />
                                Complete
                              </Button>
                            </Can>
                          )}
                          {b.status !== 'cancelled' && (
                            <Can permission={P.THEATRE_CHANGE}>
                              <Button size="sm" variant="outline" className="gap-1.5" onClick={() => setEquipmentBooking(b)}>
                                <Stethoscope className="h-3.5 w-3.5" />
                                Equipment
                              </Button>
                            </Can>
                          )}
                          {b.status !== 'cancelled' && (
                            <Can permission={P.THEATRE_VIEW}>
                              <Button size="sm" variant="outline" className="gap-1.5" onClick={() => setDetailsBooking(b)}>
                                <Users className="h-3.5 w-3.5" />
                                Team / PACU / Op Note
                              </Button>
                            </Can>
                          )}
                          {(b.status === 'scheduled' || b.status === 'awaiting_payment') && (
                            <Can permission={P.THEATRE_CHANGE}>
                              <Button size="sm" variant="outline" className="gap-1.5" onClick={() => setRescheduleBooking(b)}>
                                <Pencil className="h-3.5 w-3.5" />
                                Reschedule
                              </Button>
                            </Can>
                          )}
                          {(b.status === 'scheduled' || b.status === 'awaiting_payment') && (
                            <Can permission={P.THEATRE_MANAGE}>
                              <Button
                                size="sm"
                                variant="outline"
                                className="gap-1.5 text-destructive border-destructive/30 hover:bg-destructive/10"
                                onClick={() => setCancelTarget(b)}
                              >
                                <XCircle className="h-3.5 w-3.5" />
                                Cancel
                              </Button>
                            </Can>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {newOpen && <NewBookingModal onClose={() => setNewOpen(false)} />}
      {checklistBooking && <ChecklistModal booking={checklistBooking} onClose={() => setChecklistBooking(null)} />}
      {rescheduleBooking && <RescheduleModal booking={rescheduleBooking} onClose={() => setRescheduleBooking(null)} />}
      {detailsBooking && <BookingDetailsModal booking={detailsBooking} onClose={() => setDetailsBooking(null)} />}
      {equipmentBooking && (
        <EquipmentPickerModal
          title={`${equipmentBooking.surgery_type} — ${equipmentBooking.theatre_room}`}
          currentAssetIds={equipmentBooking.equipment_asset_ids ?? []}
          onSave={(assetIds) => setEquipment.mutateAsync({ bookingId: equipmentBooking.id, assetIds })}
          onClose={() => setEquipmentBooking(null)}
        />
      )}
      <ConfirmDialog
        open={!!cancelTarget}
        title="Cancel this booking?"
        description="Any pending procedure-fee charge will be waived. This cannot be undone."
        variant="danger"
        confirmLabel="Cancel Booking"
        onConfirm={confirmCancel}
        onCancel={() => setCancelTarget(null)}
      />
    </div>
  );
}
