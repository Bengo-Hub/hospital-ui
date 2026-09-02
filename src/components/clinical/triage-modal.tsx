'use client';

// Extracted from `/[orgSlug]/triage/page.tsx` (2026-09-03, MVP gap backlog Sprint 2 item 1) so the
// Consultation queue's "Recheck vitals" action can open the exact same vitals-capture UI inline,
// instead of sending a clinician away to the separate Triage page. The backend already supports a
// re-triage on any pre-terminal visit (patients.Service.RecordTriage), so this component itself
// needed zero behavioural change — only its export boundary moved.

import { useState } from 'react';
import { toast } from 'sonner';
import { Loader2, X } from 'lucide-react';
import { usePatient, useRecordTriage } from '@/hooks/useClinical';
import { apiErrorMessage } from '@/lib/api/error-message';
import { VisitChargesPanel } from '@/components/billing/visit-charges-panel';
import type { PatientVisit } from '@/lib/api/clinical';

export const inputCls = 'w-full bg-background border border-border rounded-xl py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40';
export const labelCls = 'text-xs font-semibold text-muted-foreground mb-1 block';

export function TriageModal({ visit, onClose }: { visit: PatientVisit; onClose: () => void }) {
  const { data: patient } = usePatient(visit.patient_id);
  const recordTriage = useRecordTriage();
  const [bpSystolic, setBpSystolic] = useState('');
  const [bpDiastolic, setBpDiastolic] = useState('');
  const [temp, setTemp] = useState('');
  const [pulse, setPulse] = useState('');
  const [resp, setResp] = useState('');
  const [spo2, setSpo2] = useState('');
  const [weight, setWeight] = useState('');
  const [height, setHeight] = useState('');
  const [priority, setPriority] = useState('');
  const [notes, setNotes] = useState('');

  const num = (v: string) => (v.trim() === '' ? undefined : Number(v));

  const handleSubmit = async () => {
    try {
      await recordTriage.mutateAsync({
        visitId: visit.id,
        data: {
          bp_systolic: num(bpSystolic),
          bp_diastolic: num(bpDiastolic),
          temperature_celsius: num(temp),
          pulse_bpm: num(pulse),
          respiration_rate: num(resp),
          spo2_percent: num(spo2),
          weight_kg: num(weight),
          height_cm: num(height),
          priority: priority || undefined,
          notes: notes || undefined,
        },
      });
      toast.success('Vitals recorded');
      onClose();
    } catch (e) {
      toast.error(await apiErrorMessage(e, 'Failed to record vitals'));
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-card rounded-2xl border border-border w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border sticky top-0 bg-card">
          <div>
            <h3 className="font-bold text-base">Record Vitals</h3>
            <p className="text-xs text-muted-foreground">{patient?.full_name ?? '…'} · {visit.visit_number}</p>
          </div>
          <button onClick={onClose} className="h-9 w-9 rounded-xl flex items-center justify-center hover:bg-accent">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="p-6 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>BP Systolic (mmHg)</label>
              <input type="number" value={bpSystolic} onChange={(e) => setBpSystolic(e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>BP Diastolic (mmHg)</label>
              <input type="number" value={bpDiastolic} onChange={(e) => setBpDiastolic(e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Temperature (°C)</label>
              <input type="number" step="0.1" value={temp} onChange={(e) => setTemp(e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Pulse (bpm)</label>
              <input type="number" value={pulse} onChange={(e) => setPulse(e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Respiration Rate</label>
              <input type="number" value={resp} onChange={(e) => setResp(e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>SpO2 (%)</label>
              <input type="number" step="0.1" value={spo2} onChange={(e) => setSpo2(e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Weight (kg)</label>
              <input type="number" step="0.1" value={weight} onChange={(e) => setWeight(e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Height (cm)</label>
              <input type="number" step="0.1" value={height} onChange={(e) => setHeight(e.target.value)} className={inputCls} />
            </div>
          </div>
          <div>
            <label className={labelCls}>Priority</label>
            <select value={priority} onChange={(e) => setPriority(e.target.value)} className={inputCls}>
              <option value="">—</option>
              <option value="routine">Routine</option>
              <option value="urgent">Urgent</option>
              <option value="emergency">Emergency</option>
            </select>
          </div>
          <div>
            <label className={labelCls}>Notes</label>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} className={`${inputCls} resize-none`} />
          </div>
          <VisitChargesPanel visitId={visit.id} />
        </div>
        <div className="flex gap-3 px-6 pb-6">
          <button onClick={onClose} className="flex-1 min-h-11 rounded-xl border border-border text-sm font-semibold hover:bg-accent transition-colors">
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={recordTriage.isPending}
            className="flex-1 min-h-11 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {recordTriage.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
