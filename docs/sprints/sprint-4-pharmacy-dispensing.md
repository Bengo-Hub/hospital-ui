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

## Gap audit and MVP backlog candidates (2026-09-02)

**Shipped 2026-09-03**: "Create Refill" action lives on `/pharmacy/[id]/page.tsx` (prescription
detail), navigating to the new refill's own page on success. The MAR screen landed where this
doc's own text said it should — a new `MarPanel` (`src/components/clinical/mar-panel.tsx`) on the
**admission detail page** (`/admissions/[admissionId]`, Sprint 6's page), not the pharmacy UI —
with a "Chart a dose" action against the admission's active prescriptions (see the api doc's own
note on why this is on-demand charting, not a pre-populated schedule). Allergy-recheck wiring is
confirmed backend-only, no hospital-ui change, exactly as this doc's text already said.

UI-side mirror of the completeness audit in `hospital-api/docs/sprints/
sprint-4-pharmacy-dispensing.md`'s own "Gap audit" section, read that first for the full backend
detail and research citations. All items below are **proposed, not yet built**.

- **Medication Administration Record screen**: once the backend's proposed `MedicationAdministration`
  entity ships, this needs a genuinely new nurse-facing page, most naturally hung off the admission
  detail page (`/admissions/[admissionId]`, Sprint 6's own page) rather than anywhere in this
  sprint's own pharmacy UI, since MAR is a nursing-charting concept tied to an admission, not to the
  pharmacist's dispense screen. The backend proposal lives in this sprint's module, but the actual
  UI home is Sprint 6's page, noted so whoever builds it doesn't add a redundant pharmacy-side
  screen.
- **Refill action**: `/pharmacy/[prescriptionId]` (or the prescription list) should gain a "Create
  refill" action once `Prescription.repeat_of_prescription_id` and `CreateRefill` ship, pre-filling
  a new prescription from the original's lines rather than requiring the prescriber to re-type a
  chronic patient's regular regimen.
- **Allergy-recheck wiring is backend-only**: the proposed automatic recheck on `Patient.allergy_
  flags` change requires no hospital-ui change, it is a backend-side wiring fix
  (`patients.Service.UpdatePatient` calling the already-built `pharmacy.Service.
  RecheckInteractions`). Noted here only so this item isn't mistakenly picked up as a frontend task.

See `hospital-api/docs/mvp-gap-backlog-2026-09-02.md` for this item's place in the full
sprint-by-sprint backlog.
