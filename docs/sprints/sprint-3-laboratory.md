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

## Gap audit and MVP backlog candidates (2026-09-02)

**Shipped 2026-09-03**: the results-entry modal (`laboratory/page.tsx`'s `ResultsModal`) gained a
per-line "Mark collected" action, a "Specimen collected …" note once done, and result/unit/
reference-range/flag/notes inputs now stay locked until collection — matching the backend's own
hard gate. A critical result gets a persistent destructive-bordered banner plus a per-line "⚠
CRITICAL" pill (not color/badge alone, per `docs/ux-ui.md`'s `color-not-only` rule) rather than
blending in with the routine `LabFlagBadge`.

UI-side mirror of the completeness audit in `hospital-api/docs/sprints/sprint-3-laboratory.md`'s
own "Gap audit" section, read that first for the full backend detail and research citations. Both
items below are **proposed, not yet built**.

- **Specimen collection step**: `/lab/orders/[id]` (or the worklist itself) should gain a "Mark
  specimen collected" action, capturing who collected it and (ideally) a scanned/typed specimen ID,
  once the backend's proposed `specimen_collected_at`/`specimen_collected_by`/`specimen_id` fields
  ship. Result entry should visually distinguish "not yet collected" from "collected, awaiting
  result" rather than the current single `requested`→`resulted` jump.
- **Critical-result visual escalation**: today a `critical`-flagged result shows the same as any
  other flag on the worklist (a badge, per this doc's own screen). Once the backend publishes a
  distinct `hospital.lab_order.critical_result` event, the worklist/result-entry UI should surface
  a genuinely different visual treatment for a critical result (not color alone, per `docs/
  ux-ui.md`'s own rule), e.g. a persistent banner rather than a quiet badge, since the whole point
  of the backend change is that a critical result must not blend in with routine ones.

See `hospital-api/docs/mvp-gap-backlog-2026-09-02.md` for this item's place in the full
sprint-by-sprint backlog.
