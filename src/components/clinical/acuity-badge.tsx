'use client';

// Small shared presentational helper for the OPD/consultation queue's acuity-based reordering
// (mvp-gap-backlog-2026-09-02.md Sprint 1 item 6) — mirrors VisitStatusBadge's own
// status→label/colour-map pattern. TriageRecord.priority is deliberately free-form on the backend
// (numeric ESI "1".."5" or hospital-ui's own triage form word scale routine|urgent|emergency), so
// this renders whatever string it's given rather than assuming one convention, but still colours
// the two most urgent conventions consistently.

import { Badge } from '@/components/ui/base';
import type { PatientVisit, TriageRecord } from '@/lib/api/clinical';

/** Picks the latest (by taken_at) TriageRecord off a visit's eager-loaded edges, or undefined if
 * the visit hasn't been triaged yet. */
export function latestTriageRecord(visit: PatientVisit): TriageRecord | undefined {
  const records = visit.edges?.triage_records;
  if (!records || records.length === 0) return undefined;
  return records.reduce((latest, r) => (r.taken_at > latest.taken_at ? r : latest));
}

const URGENT_VALUES = new Set(['1', 'emergency']);
const HIGH_VALUES = new Set(['2', 'urgent']);

export function AcuityBadge({ priority }: { priority?: string }) {
  if (!priority) return <span className="text-muted-foreground text-xs">—</span>;
  const normalized = priority.trim().toLowerCase();
  const variant = URGENT_VALUES.has(normalized) ? 'error' : HIGH_VALUES.has(normalized) ? 'warning' : 'outline';
  return <Badge variant={variant}>{priority}</Badge>;
}
