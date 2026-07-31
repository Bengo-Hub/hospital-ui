# Hospital UI — Sprint 6: Inpatient

**Status:** ⏳ Planned
**Depends on:** `hospital-api` Sprint 6
**Goal:** Ward/bed occupancy board, admission and discharge flows.

## Pages / Components

- `/[orgSlug]/wards` — occupancy board (grid of beds by ward, color-coded status — paired with an
  icon/text label per `docs/ux-ui.md`'s "never color alone" rule, not just colored tiles).
- `/[orgSlug]/admissions/new` — admit-to-bed form.
- `/[orgSlug]/admissions/[id]/discharge` — discharge summary form, triggers Sprint 5's checkout.

## Definition of Done

- [ ] Admit → occupancy board updates in real time (or on refresh, if websockets are out of scope
      for v1) → discharge → checkout triggered, happy path verified.
- [ ] `pnpm build`/`type-check` clean.

## Next Sprint

Sprint 7 — Theatre/OT scheduling + ICU monitoring board.
