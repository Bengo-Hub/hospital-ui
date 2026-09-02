'use client';

import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import {
  CalendarClock,
  CheckCircle2,
  ClipboardCheck,
  Loader2,
  Play,
  Plus,
  Scissors,
  Stethoscope,
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
import { useVisits } from '@/hooks/useClinical';
import { useSetBookingEquipment } from '@/hooks/useAssets';
import { EquipmentPickerModal } from '@/components/assets/equipment-picker-modal';
import {
  useTheatreSchedule,
  useCreateBooking,
  useActivateBooking,
  useUpdateChecklist,
  useStartSurgery,
  useCompleteSurgery,
  useCancelBooking,
} from '@/hooks/useTheatre';
import type { TheatreBooking, TheatreBookingStatus } from '@/lib/api/theatre';

const STATUS_BADGE: Record<TheatreBookingStatus, { variant: 'default' | 'success' | 'warning' | 'error' | 'outline'; label: string }> = {
  awaiting_payment: { variant: 'warning', label: 'Awaiting Payment' },
  scheduled: { variant: 'outline', label: 'Scheduled' },
  in_progress: { variant: 'default', label: 'In Progress' },
  completed: { variant: 'success', label: 'Completed' },
  cancelled: { variant: 'error', label: 'Cancelled' },
};

const CHECKLIST_ITEMS = [
  { key: 'consent_signed', label: 'Consent signed' },
  { key: 'site_marked', label: 'Surgical site marked' },
  { key: 'anaesthesia_reviewed', label: 'Anaesthesia plan reviewed' },
  { key: 'blood_available', label: 'Blood availability confirmed (if required)' },
  { key: 'equipment_ready', label: 'Equipment/instruments ready' },
];

function NewBookingModal({ onClose }: { onClose: () => void }) {
  const { data: visits, isLoading: visitsLoading } = useVisits();
  const createBooking = useCreateBooking();
  const [visitId, setVisitId] = useState('');
  const [room, setRoom] = useState('');
  const [surgeryType, setSurgeryType] = useState('');
  const [scheduledAt, setScheduledAt] = useState('');
  const [duration, setDuration] = useState('60');
  const [fee, setFee] = useState('');

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
        <div className="p-6 space-y-2">
          {CHECKLIST_ITEMS.map((item) => (
            <label key={item.key} className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm cursor-pointer hover:bg-accent/40">
              <input
                type="checkbox"
                checked={!!checklist[item.key]}
                onChange={(e) => setChecklist((prev) => ({ ...prev, [item.key]: e.target.checked }))}
                className="h-4 w-4 rounded border-border"
              />
              {item.label}
            </label>
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

export default function TheatreSchedulePage() {
  const [date, setDate] = useState('');
  const { data: bookings, isLoading } = useTheatreSchedule(date || undefined);
  const [newOpen, setNewOpen] = useState(false);
  const [checklistBooking, setChecklistBooking] = useState<TheatreBooking | null>(null);
  const [equipmentBooking, setEquipmentBooking] = useState<TheatreBooking | null>(null);
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
