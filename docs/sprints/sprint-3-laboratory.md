# Hospital UI — Sprint 3: Laboratory

**Status:** ⏳ Planned
**Depends on:** `hospital-api` Sprint 3
**Goal:** Lab worklist and result-entry UI.

## Pages / Components

- `/[orgSlug]/lab/worklist` — pending orders table, filterable by status.
- `/[orgSlug]/lab/orders/[id]` — result entry per line item, reference-range display.

**Design note (2026-08-29):** referred-out national testing (viral load, EID, TB) in Kenya commonly
runs as a batch courier-manifest workflow rather than live in-house results (`hospital-api/docs/
integrations.md` §2E). When that workflow is built, worklist status should distinguish it clearly
from in-house results (e.g. a manifest lifecycle badge: Draft/Ready to send/Sending/Submitted)
rather than reusing the in-house `resulted` status for a specimen that has only been dispatched, not
resulted yet.

## Definition of Done

- [ ] Order appears on worklist → result entered → patient auto-notified (via hospital-api's
      outbox → notifications-api, no UI-side SMS logic) happy path verified.
- [ ] `pnpm build`/`type-check` clean.

## Next Sprint

Sprint 4 — Pharmacy & Dispensing terminal.
