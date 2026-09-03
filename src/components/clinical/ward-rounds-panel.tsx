'use client';

// Doctor's daily ward-round progress notes for an inpatient stay — different author/cadence/
// content from VitalsChartPanel's nursing readings. See mvp-gap-backlog-2026-09-02 Sprint 6.1.

import { useState } from 'react';
import { toast } from 'sonner';
import { ClipboardEdit, Loader2, Plus } from 'lucide-react';
import { Card, Button } from '@/components/ui/base';
import { Can } from '@/components/auth/can';
import { P } from '@/lib/rbac/permissions';
import { apiErrorMessage } from '@/lib/api/error-message';
import { useWardRounds, useRecordWardRound } from '@/hooks/useInpatient';

const inputCls = 'w-full bg-background border border-border rounded-lg py-1.5 px-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-primary/40';

function RecordWardRoundForm({ admissionId, onClose }: { admissionId: string; onClose: () => void }) {
  const record = useRecordWardRound();
  const [notes, setNotes] = useState('');
  const [diagnosisName, setDiagnosisName] = useState('');

  const handleSubmit = async () => {
    if (!notes.trim()) {
      toast.error('Notes are required');
      return;
    }
    try {
      await record.mutateAsync({ admissionId, data: { notes: notes.trim(), diagnosis_name: diagnosisName.trim() || undefined } });
      toast.success('Ward round recorded');
      onClose();
    } catch (e) {
      toast.error(await apiErrorMessage(e, 'Failed to record ward round'));
    }
  };

  return (
    <div className="rounded-xl border border-border bg-background/50 p-3 space-y-2.5 mb-3">
      <textarea
        placeholder="Progress note…"
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        rows={3}
        className={`${inputCls} resize-none`}
      />
      <input placeholder="Updated diagnosis (optional)" value={diagnosisName} onChange={(e) => setDiagnosisName(e.target.value)} className={inputCls} />
      <div className="flex gap-2 justify-end">
        <Button size="sm" variant="outline" onClick={onClose}>Cancel</Button>
        <Button size="sm" className="gap-1.5" onClick={handleSubmit} disabled={record.isPending}>
          {record.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
          Save Note
        </Button>
      </div>
    </div>
  );
}

export function WardRoundsPanel({ admissionId }: { admissionId: string }) {
  const { data: notes, isLoading } = useWardRounds(admissionId);
  const [showForm, setShowForm] = useState(false);

  return (
    <Card>
      <div className="p-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold flex items-center gap-2">
            <ClipboardEdit className="h-4 w-4 text-muted-foreground" />
            Doctor&apos;s Ward Rounds
          </h3>
          <Can permission={P.INPATIENT_ADD}>
            <Button size="sm" variant="outline" className="gap-1.5" onClick={() => setShowForm((v) => !v)}>
              <Plus className="h-3.5 w-3.5" />
              Add Note
            </Button>
          </Can>
        </div>

        {showForm && <RecordWardRoundForm admissionId={admissionId} onClose={() => setShowForm(false)} />}

        {isLoading ? (
          <p className="text-xs text-muted-foreground">Loading…</p>
        ) : (notes ?? []).length === 0 ? (
          <p className="text-xs text-muted-foreground">No ward-round notes yet for this admission.</p>
        ) : (
          <div className="space-y-3">
            {(notes ?? []).map((n) => (
              <div key={n.id} className="text-sm border-b border-border/60 pb-2.5 last:border-0">
                <p className="text-xs text-muted-foreground mb-1">
                  {new Date(n.recorded_at).toLocaleString()}
                  {n.diagnosis_name && <span> · Diagnosis: {n.diagnosis_name}</span>}
                </p>
                <p>{n.notes}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </Card>
  );
}
