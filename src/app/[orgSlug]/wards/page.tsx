'use client';

import { useMemo, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Bed as BedIcon, Building2, CheckCircle2, Loader2, Plus, Sparkles, User, Wrench, X } from 'lucide-react';
import { toast } from 'sonner';
import { Card, Button, Input } from '@/components/ui/base';
import { PageHeader, EmptyState, Skeleton } from '@/components/ui/page';
import { Can } from '@/components/auth/can';
import { P } from '@/lib/rbac/permissions';
import { apiErrorMessage } from '@/lib/api/error-message';
import { useWards, useWardOccupancy, useCreateWard, useCreateBed, useSetBedStatus } from '@/hooks/useInpatient';
import type { BedOccupancy, BedStatus } from '@/lib/api/inpatient';

const BED_STATUS_CONFIG: Record<BedStatus, { label: string; icon: typeof CheckCircle2; cls: string }> = {
  available: { label: 'Available', icon: CheckCircle2, cls: 'border-green-500/40 bg-green-500/10 text-green-700 dark:text-green-400' },
  occupied: { label: 'Occupied', icon: User, cls: 'border-red-500/40 bg-red-500/10 text-red-700 dark:text-red-400' },
  cleaning: { label: 'Cleaning', icon: Sparkles, cls: 'border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-400' },
  out_of_service: { label: 'Out of Service', icon: Wrench, cls: 'border-gray-500/40 bg-gray-500/10 text-gray-600 dark:text-gray-400' },
};

function BedTile({ row }: { row: BedOccupancy }) {
  const router = useRouter();
  const params = useParams();
  const orgSlug = params?.orgSlug as string;
  const cfg = BED_STATUS_CONFIG[row.bed.status];
  const Icon = cfg.icon;
  const setStatus = useSetBedStatus();

  const handleCycle = async () => {
    // Housekeeping cycle only — occupied beds are never touched here (Admit/Discharge own that).
    if (row.bed.status === 'occupied') {
      if (row.admission) router.push(`/${orgSlug}/admissions/${row.admission.id}`);
      return;
    }
    const next: BedStatus = row.bed.status === 'cleaning' ? 'available' : 'cleaning';
    try {
      await setStatus.mutateAsync({ bedId: row.bed.id, status: next });
    } catch (e) {
      toast.error(await apiErrorMessage(e, 'Failed to update bed status'));
    }
  };

  return (
    <button
      type="button"
      onClick={handleCycle}
      disabled={row.bed.status === 'out_of_service' || setStatus.isPending}
      className={`rounded-xl border p-3 text-left transition-colors hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-70 ${cfg.cls}`}
      title={row.bed.status === 'occupied' ? 'View admission' : 'Click to cycle housekeeping status'}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="font-bold text-sm">{row.bed.bed_number}</span>
        <Icon className="h-4 w-4 shrink-0" />
      </div>
      <p className="text-xs font-medium mt-1">{cfg.label}</p>
      {row.admission && (
        <p className="text-xs mt-1 truncate opacity-90">
          {row.patient_name ?? 'Patient'} {row.patient_mrn ? `· ${row.patient_mrn}` : ''}
        </p>
      )}
    </button>
  );
}

function NewWardModal({ onClose }: { onClose: () => void }) {
  const createWard = useCreateWard();
  const [name, setName] = useState('');
  const [capacity, setCapacity] = useState('');

  const handleSubmit = async () => {
    if (!name.trim()) {
      toast.error('Ward name is required');
      return;
    }
    try {
      await createWard.mutateAsync({ name: name.trim(), capacity: capacity ? Number(capacity) : undefined });
      toast.success('Ward created');
      onClose();
    } catch (e) {
      toast.error(await apiErrorMessage(e, 'Failed to create ward'));
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-card rounded-2xl border border-border w-full max-w-sm shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h3 className="font-bold text-base">New Ward</h3>
          <button onClick={onClose} className="h-9 w-9 rounded-xl flex items-center justify-center hover:bg-accent">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="text-xs font-semibold text-muted-foreground mb-1 block">
              Ward Name <span className="text-destructive">*</span>
            </label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. General Ward" />
          </div>
          <div>
            <label className="text-xs font-semibold text-muted-foreground mb-1 block">Capacity (informational)</label>
            <Input type="number" min={0} value={capacity} onChange={(e) => setCapacity(e.target.value)} placeholder="e.g. 10" />
          </div>
        </div>
        <div className="flex gap-3 px-6 pb-6">
          <Button variant="outline" className="flex-1" onClick={onClose} disabled={createWard.isPending}>
            Cancel
          </Button>
          <Button className="flex-1 gap-2" onClick={handleSubmit} disabled={createWard.isPending}>
            {createWard.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            Create Ward
          </Button>
        </div>
      </div>
    </div>
  );
}

function NewBedModal({ wardId, onClose }: { wardId: string; onClose: () => void }) {
  const createBed = useCreateBed();
  const [bedNumber, setBedNumber] = useState('');

  const handleSubmit = async () => {
    if (!bedNumber.trim()) {
      toast.error('Bed number is required');
      return;
    }
    try {
      await createBed.mutateAsync({ wardId, data: { bed_number: bedNumber.trim() } });
      toast.success('Bed added');
      onClose();
    } catch (e) {
      toast.error(await apiErrorMessage(e, 'Failed to add bed'));
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-card rounded-2xl border border-border w-full max-w-sm shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h3 className="font-bold text-base">New Bed</h3>
          <button onClick={onClose} className="h-9 w-9 rounded-xl flex items-center justify-center hover:bg-accent">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="text-xs font-semibold text-muted-foreground mb-1 block">
              Bed Number <span className="text-destructive">*</span>
            </label>
            <Input value={bedNumber} onChange={(e) => setBedNumber(e.target.value)} placeholder="e.g. GW-03" />
          </div>
        </div>
        <div className="flex gap-3 px-6 pb-6">
          <Button variant="outline" className="flex-1" onClick={onClose} disabled={createBed.isPending}>
            Cancel
          </Button>
          <Button className="flex-1 gap-2" onClick={handleSubmit} disabled={createBed.isPending}>
            {createBed.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            Add Bed
          </Button>
        </div>
      </div>
    </div>
  );
}

function WardCard({ wardId, name }: { wardId: string; name: string }) {
  const { data, isLoading } = useWardOccupancy(wardId);
  const [addBedOpen, setAddBedOpen] = useState(false);
  const beds = data?.beds ?? [];
  const occupied = beds.filter((b) => b.bed.status === 'occupied').length;

  return (
    <Card>
      <div className="px-4 py-3 border-b border-border flex items-center justify-between">
        <div>
          <h3 className="font-bold text-sm">{name}</h3>
          <p className="text-xs text-muted-foreground">
            {occupied}/{beds.length} beds occupied
          </p>
        </div>
        <Can permission={P.INPATIENT_MANAGE}>
          <Button size="sm" variant="outline" className="gap-1.5" onClick={() => setAddBedOpen(true)}>
            <Plus className="h-3.5 w-3.5" />
            Bed
          </Button>
        </Can>
      </div>
      <div className="p-4">
        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        ) : beds.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-4">No beds in this ward yet</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {beds.map((row) => (
              <BedTile key={row.bed.id} row={row} />
            ))}
          </div>
        )}
      </div>
      {addBedOpen && <NewBedModal wardId={wardId} onClose={() => setAddBedOpen(false)} />}
    </Card>
  );
}

export default function WardsPage() {
  const { data: wards, isLoading } = useWards();
  const [newWardOpen, setNewWardOpen] = useState(false);

  const rows = useMemo(() => wards ?? [], [wards]);

  return (
    <div className="max-w-7xl mx-auto">
      <PageHeader
        title="Ward Occupancy"
        subtitle="Live bed status by ward. Click an available/cleaning bed to cycle housekeeping status, or an occupied bed to view its admission."
        icon={<Building2 className="h-5 w-5" />}
        actions={
          <Can permission={P.INPATIENT_MANAGE}>
            <Button className="gap-2" onClick={() => setNewWardOpen(true)}>
              <Plus className="h-4 w-4" />
              New Ward
            </Button>
          </Can>
        }
      />

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {Array.from({ length: 2 }).map((_, i) => (
            <Skeleton key={i} className="h-48 w-full" />
          ))}
        </div>
      ) : rows.length === 0 ? (
        <Card>
          <EmptyState
            icon={<BedIcon className="h-10 w-10" />}
            title="No wards configured"
            description="Create a ward and add beds before admitting patients."
            action={
              <Can permission={P.INPATIENT_MANAGE}>
                <Button className="gap-2" onClick={() => setNewWardOpen(true)}>
                  <Plus className="h-4 w-4" />
                  New Ward
                </Button>
              </Can>
            }
          />
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {rows.map((w) => (
            <WardCard key={w.id} wardId={w.id} name={w.name} />
          ))}
        </div>
      )}

      {newWardOpen && <NewWardModal onClose={() => setNewWardOpen(false)} />}
    </div>
  );
}
