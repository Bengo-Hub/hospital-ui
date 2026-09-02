# Hospital UI — Sprint 7: Theatre/OT Scheduling + ICU Monitoring Board

**Status:** ✅ Shipped 2026-09-02 (`hospital-ui@c0ba527`). `pnpm type-check`/`pnpm build` both clean; dev server boot-checked (no SSR crash on `/theatre/schedule`/`/icu`) — a full authenticated browser click-through was NOT done this pass, same acknowledged gap as Sprint 6.
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

## Gap audit — UI implications (2026-09-02, later the same day)

`hospital-api/docs/sprints/sprint-7-theatre-icu.md` gained a matching "Gap audit and Sprint 7.1
candidates" section after a client review flagged missing Theatre sub-modules. **Everything below is
a UI-side implication of that backend proposal — none of it is built, and it depends on the
corresponding backend fields shipping first.**

- **WHO-checklist-shaped pre-op checklist.** The pre-op checklist modal's current flat list (consent
  signed, site marked, anaesthesia reviewed, blood availability, equipment ready) is replaced by the
  real WHO Surgical Safety Checklist's three phases — **Sign In** (before induction of anaesthesia),
  **Time Out** (before skin incision), **Sign Out** (before the patient leaves the operating room) —
  each rendered as its own sub-section matching the real point in the case where it's actually run,
  not one flat checklist filled in all at once. Verbatim item text and sourcing:
  `hospital-api/docs/sprints/sprint-7-theatre-icu.md`'s gap audit. The schema stays a free-form JSON
  map (per `docs/ux-ui.md`'s existing conventions and this backend's own "additive metadata"
  preference), so a tenant can still add/remove items — this is a default content change, not a
  rigid new form.
- **Team-assignment picker.** If `theatre_staff_assignment` ships, the "Schedule Surgery" modal's
  single surgeon field is joined by a multi-role team picker (assistant surgeon(s), anaesthetist,
  scrub nurse, circulating nurse), each a staff-user select scoped to a sensible role
  (doctor-role users for surgeon/assistant/anaesthetist, nurse-role users for scrub/circulating).
  The existing surgeon field stays as the "primary surgeon" the schedule list already displays.
- **PACU board.** If `pacu_stay` ships, a new `/theatre/pacu` (or similar) card-grid page — the same
  visual pattern as `/icu`'s severity board — tracks patients currently in recovery, with a
  disposition action (to ward / to ICU / home) that, for "to ICU," opens the existing "Start ICU
  Episode" flow rather than duplicating it.
- **Operative-notes form.** If `operative_note` ships, a "Complete" action on a booking (currently a
  single status transition) gains a follow-on structured form (procedure performed, findings,
  complications, estimated blood loss, implants used, specimens sent, post-op diagnosis) — authored
  after the fact, not blocking the `in_progress → completed` transition itself.
- **Equipment-linkage picker — shipped 2026-09-02, same day.** The shared `EquipmentPickerModal`
  is reused as an "Equipment" row action on `/theatre/schedule`'s bookings table and as an
  "Equipment" button on each `/icu` episode card — not folded into the Schedule Surgery modal
  itself, since equipment is typically confirmed closer to the actual case than at initial
  scheduling. Backed by `theatre_booking.equipment_asset_ids`/`icu_episode.equipment_asset_ids`
  (JSON arrays, not single fields).

## Next Sprint

Sprint 8 — Blood Bank & Transfusion.
