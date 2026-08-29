'use client';

// Small shared presentational helper — mirrors pos-ui's `VisitStatusBadge` (its own clinical
// domain component), reused here across the Triage and Consultation queues so the status→label/
// colour mapping for hospital-api's `VisitStatus` lives in exactly one place.

import { Badge } from '@/components/ui/base';
import type { VisitStatus } from '@/lib/api/clinical';

const STATUS_LABELS: Record<VisitStatus, string> = {
  registered: 'Registered',
  triaged: 'Triaged',
  in_examination: 'In Examination',
  awaiting_lab: 'Awaiting Lab',
  lab_complete: 'Lab Complete',
  prescribed: 'Prescribed',
  dispensed: 'Dispensed',
  admitted: 'Admitted',
  completed: 'Completed',
  cancelled: 'Cancelled',
};

const STATUS_VARIANTS: Record<VisitStatus, 'default' | 'success' | 'warning' | 'error' | 'outline'> = {
  registered: 'outline',
  triaged: 'warning',
  in_examination: 'warning',
  awaiting_lab: 'warning',
  lab_complete: 'default',
  prescribed: 'default',
  dispensed: 'success',
  admitted: 'default',
  completed: 'success',
  cancelled: 'error',
};

export function VisitStatusBadge({ status }: { status: VisitStatus }) {
  return <Badge variant={STATUS_VARIANTS[status] ?? 'outline'}>{STATUS_LABELS[status] ?? status}</Badge>;
}
