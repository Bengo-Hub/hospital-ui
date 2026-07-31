# Hospital UI — Sprint 3: Laboratory

**Status:** ⏳ Planned
**Depends on:** `hospital-api` Sprint 3
**Goal:** Lab worklist and result-entry UI.

## Pages / Components

- `/[orgSlug]/lab/worklist` — pending orders table, filterable by status.
- `/[orgSlug]/lab/orders/[id]` — result entry per line item, reference-range display.

## Definition of Done

- [ ] Order appears on worklist → result entered → patient auto-notified (via hospital-api's
      outbox → notifications-api, no UI-side SMS logic) happy path verified.
- [ ] `pnpm build`/`type-check` clean.

## Next Sprint

Sprint 4 — Pharmacy & Dispensing terminal.
