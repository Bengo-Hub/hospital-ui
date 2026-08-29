# Hospital UI — Sprint 4: Pharmacy & Dispensing Terminal

**Status:** ✅ Shipped 2026-08-29 (`hospital-ui@e6a4216`) — `/pharmacy` (prescription list),
`/pharmacy/[id]` (detail: approve/lock/reject/cancel/dispense, per-line controlled-substance
witness capture with client-side validation mirroring the backend's dual-witness rejection),
`/pharmacy/controlled-substances` (permission-gated audit log). Standalone-chemist mode is handled
on the billing side (`/visits/[visitId]/account`'s `ChemistCheckout` branch, Sprint 5), not a
separate pharmacy-page variant.
**Depends on:** `hospital-api` Sprint 4
**Goal:** Prescription review/dispense terminal, including the standalone-chemist mode UI.

## Pages / Components

- `/[orgSlug]/pharmacy/queue` — pending prescriptions worklist.
- `/[orgSlug]/pharmacy/[prescriptionId]` — dispense screen: drug-interaction warnings surfaced
  prominently (not buried), controlled-substance dual-witness confirmation flow, dispensing-label
  print action.
- **Standalone-chemist mode**: when the tenant's `sub_features` claim shows only the pharmacy
  module, the sidebar collapses to just Pharmacy + Billing — reuse the existing
  `SubscriptionGate`/`useSubscription` pattern from sibling frontends, do not hand-roll a new
  gating mechanism.

## Definition of Done

- [ ] Full dispense flow (approve → interaction-check display → controlled-substance witness →
      dispense → label print) works end to end.
- [ ] Standalone-chemist tenant sees only Pharmacy + Billing in navigation — verified with a demo
      tenant configured that way.
- [ ] `pnpm build`/`type-check` clean.

## Next Sprint

Sprint 5 — Billing & Insurance.
