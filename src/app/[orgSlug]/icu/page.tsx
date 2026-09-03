'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'sonner';
import { Activity, AlertTriangle, CheckCircle2, Loader2, LogOut, Plus, ShieldAlert, Stethoscope, X } from 'lucide-react';
import { Card, Button, Badge } from '@/components/ui/base';
import { PageHeader, EmptyState, Skeleton } from '@/components/ui/page';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Can } from '@/components/auth/can';
import { P } from '@/lib/rbac/permissions';
import { apiErrorMessage } from '@/lib/api/error-message';
import { useAdmissions, useAdmission } from '@/hooks/useInpatient';
import { CreatableSelect } from '@/components/ui/creatable-select';
import { usePatient } from '@/hooks/useClinical';
import { useICUEpisodes, useStartICUEpisode, useUpdateICUEpisode, useEndICUEpisode } from '@/hooks/useICU';
import { useSetEpisodeEquipment } from '@/hooks/useAssets';
import { EquipmentPickerModal } from '@/components/assets/equipment-picker-modal';
import type { ICUEpisode, SeverityFlag } from '@/lib/api/icu';

const SEVERITY_CONFIG: Record<SeverityFlag, { label: string; icon: typeof CheckCircle2; cls: string }> = {
  stable: { label: 'Stable', icon: CheckCircle2, cls: 'border-green-500/40 bg-green-500/10 text-green-700 dark:text-green-400' },
  guarded: { label: 'Guarded', icon: AlertTriangle, cls: 'border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-400' },
  critical: { label: 'Critical', icon: ShieldAlert, cls: 'border-red-500/40 bg-red-500/10 text-red-700 dark:text-red-400' },
};

function PatientLabel({ admissionId }: { admissionId: string }) {
  const { data: admission } = useAdmission(admissionId);
  const { data: patient } = usePatient(admission?.patient_id);
  return <>{patient?.full_name ?? admission?.admission_number ?? admissionId}</>;
}

function StartEpisodeModal({ onClose }: { onClose: () => void }) {
  const params = useParams();
  const orgSlug = params?.orgSlug as string;
  const { data: admissions, isLoading } = useAdmissions('active');
  const startEpisode = useStartICUEpisode();
  const [admissionId, setAdmissionId] = useState('');
  const [severity, setSeverity] = useState<SeverityFlag>('stable');
  const [notes, setNotes] = useState('');

  const handleSubmit = async () => {
    if (!admissionId) {
      toast.error('Select an admission');
      return;
    }
    try {
      await startEpisode.mutateAsync({ admission_id: admissionId, severity_flag: severity, monitoring_notes: notes.trim() || undefined });
      toast.success('ICU episode started');
      onClose();
    } catch (e) {
      toast.error(await apiErrorMessage(e, 'Failed to start ICU episode'));
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-card rounded-2xl border border-border w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h3 className="font-bold text-base">Start ICU Episode</h3>
          <button onClick={onClose} className="h-9 w-9 rounded-xl flex items-center justify-center hover:bg-accent">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="text-xs font-semibold text-muted-foreground mb-1 block">
              Admission <span className="text-destructive">*</span>
            </label>
            {isLoading ? (
              <Skeleton className="h-9 w-full" />
            ) : (
              <CreatableSelect
                value={admissionId}
                onChange={(id) => setAdmissionId(id)}
                options={(admissions ?? []).map((a) => ({ id: a.id, name: a.admission_number }))}
                placeholder="Select active admission…"
              />
            )}
            {!isLoading && (admissions ?? []).length === 0 && (
              <p className="text-[11px] text-muted-foreground mt-1">
                No active admissions —{' '}
                <Link href={`/${orgSlug}/admissions`} className="text-primary hover:underline">
                  admit the patient first, from the Admissions page
                </Link>
                .
              </p>
            )}
          </div>
          <div>
            <label className="text-xs font-semibold text-muted-foreground mb-1 block">Severity</label>
            <div className="flex gap-2">
              {(Object.keys(SEVERITY_CONFIG) as SeverityFlag[]).map((s) => {
                const cfg = SEVERITY_CONFIG[s];
                const Icon = cfg.icon;
                return (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setSeverity(s)}
                    className={`flex-1 flex items-center justify-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-medium ${severity === s ? cfg.cls : 'border-border text-muted-foreground'}`}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    {cfg.label}
                  </button>
                );
              })}
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold text-muted-foreground mb-1 block">Monitoring Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              className="w-full bg-background border border-border rounded-xl py-2 px-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>
        </div>
        <div className="flex gap-3 px-6 pb-6">
          <Button variant="outline" className="flex-1" onClick={onClose} disabled={startEpisode.isPending}>
            Cancel
          </Button>
          <Button className="flex-1 gap-2" onClick={handleSubmit} disabled={startEpisode.isPending}>
            {startEpisode.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            Start Episode
          </Button>
        </div>
      </div>
    </div>
  );
}

function EpisodeCard({ episode }: { episode: ICUEpisode }) {
  const updateEpisode = useUpdateICUEpisode();
  const [endTarget, setEndTarget] = useState<ICUEpisode | null>(null);
  const endEpisode = useEndICUEpisode();
  const setEquipment = useSetEpisodeEquipment();
  const [equipmentOpen, setEquipmentOpen] = useState(false);
  const cfg = SEVERITY_CONFIG[episode.severity_flag];
  const Icon = cfg.icon;

  const handleSeverityChange = async (severity: SeverityFlag) => {
    try {
      await updateEpisode.mutateAsync({ episodeId: episode.id, data: { severity_flag: severity } });
    } catch (e) {
      toast.error(await apiErrorMessage(e, 'Failed to update severity'));
    }
  };

  const confirmEnd = async () => {
    if (!endTarget) return;
    try {
      await endEpisode.mutateAsync(endTarget.id);
      toast.success('ICU episode ended');
    } catch (e) {
      toast.error(await apiErrorMessage(e, 'Failed to end episode'));
    } finally {
      setEndTarget(null);
    }
  };

  return (
    <Card className={cfg.cls}>
      <div className="p-4 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <p className="font-bold text-sm truncate">
            <PatientLabel admissionId={episode.admission_id} />
          </p>
          <Badge variant="outline" className="gap-1.5 shrink-0 border-current">
            <Icon className="h-3 w-3" />
            {cfg.label}
          </Badge>
        </div>
        {episode.monitoring_notes && <p className="text-xs opacity-90">{episode.monitoring_notes}</p>}
        <p className="text-xs opacity-70">Since {new Date(episode.started_at).toLocaleString()}</p>
        <Can permission={P.ICU_CHANGE}>
          <div className="flex gap-1.5">
            {(Object.keys(SEVERITY_CONFIG) as SeverityFlag[]).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => handleSeverityChange(s)}
                disabled={s === episode.severity_flag || updateEpisode.isPending}
                className={`flex-1 rounded-lg border px-2 py-1 text-[11px] font-medium disabled:opacity-40 ${s === episode.severity_flag ? 'border-current' : 'border-border/60 bg-background/40'}`}
              >
                {SEVERITY_CONFIG[s].label}
              </button>
            ))}
          </div>
        </Can>
        <div className="flex gap-1.5">
          <Can permission={P.ICU_CHANGE}>
            <Button size="sm" variant="outline" className="flex-1 gap-1.5" onClick={() => setEquipmentOpen(true)}>
              <Stethoscope className="h-3.5 w-3.5" />
              Equipment{episode.equipment_asset_ids?.length ? ` (${episode.equipment_asset_ids.length})` : ''}
            </Button>
          </Can>
          <Can permission={P.ICU_MANAGE}>
            <Button size="sm" variant="outline" className="flex-1 gap-1.5" onClick={() => setEndTarget(episode)}>
              <LogOut className="h-3.5 w-3.5" />
              End Episode
            </Button>
          </Can>
        </div>
      </div>
      <ConfirmDialog
        open={!!endTarget}
        title="End this ICU episode?"
        description="This closes critical-care monitoring for this admission. It does not discharge the patient."
        confirmLabel="End Episode"
        onConfirm={confirmEnd}
        onCancel={() => setEndTarget(null)}
      />
      {equipmentOpen && (
        <EquipmentPickerModal
          title="ICU episode"
          currentAssetIds={episode.equipment_asset_ids ?? []}
          onSave={(assetIds) => setEquipment.mutateAsync({ episodeId: episode.id, assetIds })}
          onClose={() => setEquipmentOpen(false)}
        />
      )}
    </Card>
  );
}

export default function ICUBoardPage() {
  const { data: episodes, isLoading } = useICUEpisodes('active');
  const [startOpen, setStartOpen] = useState(false);
  const rows = episodes ?? [];

  return (
    <div className="max-w-7xl mx-auto">
      <PageHeader
        title="ICU Board"
        subtitle="Active critical-care episodes — severity flag paired with icon + text, never color alone"
        icon={<Activity className="h-5 w-5" />}
        actions={
          <Can permission={P.ICU_ADD}>
            <Button className="gap-2" onClick={() => setStartOpen(true)}>
              <Plus className="h-4 w-4" />
              Start Episode
            </Button>
          </Can>
        }
      />

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-40 w-full" />
          ))}
        </div>
      ) : rows.length === 0 ? (
        <Card>
          <EmptyState icon={<Activity className="h-10 w-10" />} title="No active ICU episodes" description="Start an episode for an admitted patient requiring critical-care monitoring." />
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {rows.map((e) => (
            <EpisodeCard key={e.id} episode={e} />
          ))}
        </div>
      )}

      {startOpen && <StartEpisodeModal onClose={() => setStartOpen(false)} />}
    </div>
  );
}
