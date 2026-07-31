# Hospital UI — Sprint 7: Theatre/OT Scheduling + ICU Monitoring Board

**Status:** ⏳ Planned
**Depends on:** `hospital-api` Sprint 7
**Goal:** Surgery scheduling calendar with conflict detection, ICU severity-flag board.

## Pages / Components

- `/[orgSlug]/theatre/schedule` — calendar/timeline view of theatre-room bookings, pre-op checklist modal.
- `/[orgSlug]/icu` — bed-level board showing severity flags + monitoring notes (icon+text for
  severity, never color-only).

## Definition of Done

- [ ] Theatre booking with visible double-booking prevention.
- [ ] ICU board reflects live episode state.
- [ ] `pnpm build`/`type-check` clean.

## Next Sprint

Sprint 8 — Blood Bank & Transfusion.
