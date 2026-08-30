# Hospital UI — Sprint 3: Laboratory

**Status:** ✅ Shipped 2026-08-29 (`hospital-ui@e6a4216`) — `/laboratory` (worklist + result
entry, per-line `Promise.all` result submission since the backend endpoint is per-line not
batched). Test catalogue browsing lives inside the order-creation flow, not a separate page.
✅ Insurance claim action + tenant Test Catalog admin page (`/laboratory/catalog`) shipped
2026-08-30 (`hospital-api@b85228a`, `hospital-ui@d81188c`) — a facility can now add its own lab
tests beyond the ~20 globally-seeded starter set. **Real bug fixed the same day**: the worklist's
"Enter Results" button was gated on a `LabOrderStatus` value ('collected') the backend never
actually produces — the real lifecycle only ever reaches `requested`→`awaiting_payment`→
`requested`→`resulted`, so entering results was structurally unreachable for a normal
in-progress order. Fixed the gating condition and removed the dead status value.
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
