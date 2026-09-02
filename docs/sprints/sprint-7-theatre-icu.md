# Hospital UI — Sprint 7: Theatre/OT Scheduling + ICU Monitoring Board

**Status:** ✅ Shipped 2026-09-02 (`hospital-ui@<pending-commit>`). `pnpm type-check`/`pnpm build` both clean; dev server boot-checked (no SSR crash on `/theatre/schedule`/`/icu`) — a full authenticated browser click-through was NOT done this pass, same acknowledged gap as Sprint 6.
**Depends on:** `hospital-api` Sprint 7
**Goal:** Surgery scheduling with visible conflict detection, ICU severity-flag board.

## Pages / Components (as actually shipped)

- `/[orgSlug]/theatre/schedule` — booking list (not a calendar widget — a date-filterable table,
  matching this app's existing list-page pattern) with a "Schedule Surgery" modal (visit picker,
  room, surgery type, scheduled time, optional procedure fee), a pre-op checklist modal (a fixed
  set of common items — consent signed, site marked, anaesthesia reviewed, blood availability,
  equipment ready — backed by the schema's free-form JSON map so a tenant isn't locked to exactly
  these), and Activate/Start/Complete/Cancel actions matching the backend's real status lifecycle
  exactly (`awaiting_payment → scheduled → in_progress → completed`, or `cancelled` from either of
  the first two). Conflict detection itself is backend-enforced (`theatre.Service.hasOverlap`) —
  the UI surfaces the resulting error via a toast on a rejected booking attempt, it does not
  duplicate the overlap check client-side.
- `/[orgSlug]/icu` — a card-grid severity-flag board (not literally "bed-level" — a card per
  active episode, since the episode itself already names its bed via `admission_id`/`bed_id`).
  Severity uses color **+ icon + text** (never color alone, per `docs/ux-ui.md`) and can be
  changed inline from the card; a "Start Episode" modal picks from active admissions; "End
  Episode" is a confirm-gated action.

## Nav / RBAC wiring

- `lib/nav-config.ts`: new flat "Theatre" (`/theatre/schedule`) and "ICU" (`/icu`) entries, each
  gated on its own `_VIEW` permission.
- `lib/facility-nomenclature.ts`: new `HOSPITAL_ONLY_MODULES` set — the first facility-tier
  distinction narrower than "Clinic and above" this app has needed, since Theatre/ICU are
  Hospital-tier-only per subscriptions-api's real plan matrix (`theatre_module`, which both
  share).
- `lib/rbac/permissions.ts`: new `ICU_VIEW/ADD/CHANGE/MANAGE` codes; `ROLE_PERMISSIONS` updated to
  match hospital-api's `rbac/seed.go` (doctor: full theatre + ICU view/change; nurse: full ICU +
  theatre view-only; manager: both broadly).

## Definition of Done

- [x] Theatre booking with visible double-booking prevention — a rejected overlapping booking
      surfaces via `apiErrorMessage`'s toast, sourced from the backend's real conflict check.
- [x] ICU board reflects live episode state (15s poll, matching every other worklist page's
      convention in this app).
- [x] `pnpm build`/`type-check` clean.
- [ ] A real authenticated browser click-through — not done this pass, flagged rather than
      silently skipped (same gap as Sprint 6).

## Next Sprint

Sprint 8 — Blood Bank & Transfusion.
