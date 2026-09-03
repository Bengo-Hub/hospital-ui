'use client';

// Nursing vitals chart for an inpatient stay — a repeated time series (multiple readings per
// shift), distinct from Sprint 2's one-shot-per-visit TriageRecord. See mvp-gap-backlog-2026-09-02
// Sprint 6.1.

import { useState } from 'react';
import { toast } from 'sonner';
import { Activity, Loader2, Plus } from 'lucide-react';
import { Card, Button } from '@/components/ui/base';
import { Can } from '@/components/auth/can';
import { P } from '@/lib/rbac/permissions';
import { apiErrorMessage } from '@/lib/api/error-message';
import { useVitalsChart, useRecordVitalsChart } from '@/hooks/useInpatient';

const inputCls = 'w-full bg-background border border-border rounded-lg py-1.5 px-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-primary/40';

function RecordVitalsForm({ admissionId, onClose }: { admissionId: string; onClose: () => void }) {
  const record = useRecordVitalsChart();
  const [bpSystolic, setBpSystolic] = useState('');
  const [bpDiastolic, setBpDiastolic] = useState('');
  const [temp, setTemp] = useState('');
  const [pulse, setPulse] = useState('');
  const [resp, setResp] = useState('');
  const [spo2, setSpo2] = useState('');
  const [pain, setPain] = useState('');
  const [notes, setNotes] = useState('');

  const num = (v: string) => (v.trim() === '' ? undefined : Number(v));

  const handleSubmit = async () => {
    try {
      await record.mutateAsync({
        admissionId,
        data: {
          bp_systolic: num(bpSystolic), bp_diastolic: num(bpDiastolic), temperature_celsius: num(temp),
          pulse_bpm: num(pulse), respiration_rate: num(resp), spo2_percent: num(spo2),
          pain_score: num(pain), notes: notes.trim() || undefined,
        },
      });
      toast.success('Vitals charted');
      onClose();
    } catch (e) {
      toast.error(await apiErrorMessage(e, 'Failed to chart vitals'));
    }
  };

  return (
    <div className="rounded-xl border border-border bg-background/50 p-3 space-y-2.5 mb-3">
      <div className="grid grid-cols-3 gap-2">
        <input placeholder="BP Sys" type="number" value={bpSystolic} onChange={(e) => setBpSystolic(e.target.value)} className={inputCls} />
        <input placeholder="BP Dia" type="number" value={bpDiastolic} onChange={(e) => setBpDiastolic(e.target.value)} className={inputCls} />
        <input placeholder="Temp °C" type="number" step="0.1" value={temp} onChange={(e) => setTemp(e.target.value)} className={inputCls} />
        <input placeholder="Pulse" type="number" value={pulse} onChange={(e) => setPulse(e.target.value)} className={inputCls} />
        <input placeholder="Resp Rate" type="number" value={resp} onChange={(e) => setResp(e.target.value)} className={inputCls} />
        <input placeholder="SpO2 %" type="number" step="0.1" value={spo2} onChange={(e) => setSpo2(e.target.value)} className={inputCls} />
        <input placeholder="Pain (0-10)" type="number" min={0} max={10} value={pain} onChange={(e) => setPain(e.target.value)} className={inputCls} />
      </div>
      <input placeholder="Notes (optional)" value={notes} onChange={(e) => setNotes(e.target.value)} className={inputCls} />
      <div className="flex gap-2 justify-end">
        <Button size="sm" variant="outline" onClick={onClose}>Cancel</Button>
        <Button size="sm" className="gap-1.5" onClick={handleSubmit} disabled={record.isPending}>
          {record.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
          Save Vitals
        </Button>
      </div>
    </div>
  );
}

export function VitalsChartPanel({ admissionId }: { admissionId: string }) {
  const { data: entries, isLoading } = useVitalsChart(admissionId);
  const [showForm, setShowForm] = useState(false);

  return (
    <Card>
      <div className="p-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold flex items-center gap-2">
            <Activity className="h-4 w-4 text-muted-foreground" />
            Nursing Vitals Chart
          </h3>
          <Can permission={P.INPATIENT_ADD}>
            <Button size="sm" variant="outline" className="gap-1.5" onClick={() => setShowForm((v) => !v)}>
              <Plus className="h-3.5 w-3.5" />
              Chart Vitals
            </Button>
          </Can>
        </div>

        {showForm && <RecordVitalsForm admissionId={admissionId} onClose={() => setShowForm(false)} />}

        {isLoading ? (
          <p className="text-xs text-muted-foreground">Loading…</p>
        ) : (entries ?? []).length === 0 ? (
          <p className="text-xs text-muted-foreground">No vitals charted yet for this admission.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-muted-foreground border-b border-border">
                  <th className="text-left py-1.5 pr-3">Time</th>
                  <th className="text-left py-1.5 pr-3">BP</th>
                  <th className="text-left py-1.5 pr-3">Temp</th>
                  <th className="text-left py-1.5 pr-3">Pulse</th>
                  <th className="text-left py-1.5 pr-3">RR</th>
                  <th className="text-left py-1.5 pr-3">SpO2</th>
                  <th className="text-left py-1.5 pr-3">Pain</th>
                  <th className="text-left py-1.5">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {(entries ?? []).map((e) => (
                  <tr key={e.id}>
                    <td className="py-1.5 pr-3 whitespace-nowrap">{new Date(e.recorded_at).toLocaleString()}</td>
                    <td className="py-1.5 pr-3">{e.bp_systolic && e.bp_diastolic ? `${e.bp_systolic}/${e.bp_diastolic}` : '—'}</td>
                    <td className="py-1.5 pr-3">{e.temperature_celsius ?? '—'}</td>
                    <td className="py-1.5 pr-3">{e.pulse_bpm ?? '—'}</td>
                    <td className="py-1.5 pr-3">{e.respiration_rate ?? '—'}</td>
                    <td className="py-1.5 pr-3">{e.spo2_percent ?? '—'}</td>
                    <td className="py-1.5 pr-3">{e.pain_score ?? '—'}</td>
                    <td className="py-1.5 text-muted-foreground">{e.notes || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </Card>
  );
}
