# Hospital UI — Sprint 5: Billing & Patient Accounts (Insurance)

**Status:** ✅ Core ledger UI shipped 2026-08-29 (`hospital-ui@e6a4216`) — `/billing/queue`
(cashier desk, department filter, `collect_any`-gated Collect) and `/visits/[visitId]/account`
(facility-type-branched: chemist tier gets a flat `ChemistCheckout`, clinic+ get the full
`PatientAccountLedger` with StatCards + per-charge Collect Now; Settle/Override-Settlement gated to
facility+hospital tiers). The account page currently has no inbound link from a patients/visits
list (direct-URL only) — flagged as a forward-looking gap in the migration plan, not fixed here.
**Insurance eligibility/claim-submit UI is still not built** — the backend endpoints themselves are
being wired now (Phase 5 remainder, see the migration plan) but no hospital-ui page calls them yet;
the design below remains the target once that backend work lands.
**Depends on:** `hospital-api` Sprint 5
**Goal:** A distributed billing ledger UI — every department's own "collect payment for what I
charged" surface, a Billing-desk fallback queue, a patient account/ledger view any department can
read, and insurance eligibility/claim UI. See `hospital-api/docs/architecture.md`'s "Distributed
Billing & Patient Accounts" section for the design rationale.

## Pages / Components

- `/[orgSlug]/patients/[id]/account` — the patient account ledger: every `BillableCharge` with its
  status (pending/paid/**exempted**/waived), running balance, settlement history. **This is the
  "receipt every department can see"** — records/triage/lab/pharmacy all link here from the
  patient's chart instead of asking the patient for a physical slip. `exempted` (insurance covered
  the charge in full) is shown distinctly from `waived` (the facility chose not to charge) — added
  2026-08-29 after a KenyaEMR technical audit found its own billing module makes this exact
  distinction, see `hospital-api/docs/sprints/sprint-5-billing-insurance.md`.
- `CollectPaymentDialog` (shared component, embedded wherever a department creates a billable
  charge — registration form, consultation form, lab order screen, pharmacy dispense screen):
  shows the charge, and if the user holds `hospital.billing.collect_own` (or `collect_any`) for
  that charge, a "Collect Now" action right there. If the tenant/item's `collection_mode` is
  `billing_queue`, shows "Sent to Billing" instead, with a link to the account page to check status
  later — never a dead end.
- `/[orgSlug]/billing/queue` — Billing desk's Pending Charges queue (mirrors pos-ui's Bills page
  pattern), gated on `hospital.billing.collect_any`. Filter by department/patient/date.
- `/[orgSlug]/billing/settings` — per-tenant `BillableItemCatalog` CRUD (price, department,
  `collection_mode`, `requires_prepayment`) — reuses `hospital-api`'s facility-tier seed as the
  starting point, tenant can override.
- `/[orgSlug]/billing/insurance/[visitId]` — eligibility check result + claim submission action.
- Discharge/mortuary release flow (Sprint 6/10) surfaces the outstanding-balance block inline —
  Record Payment / Apply Insurance / Write-Off / "next of kin settling" options right on the
  discharge screen, not a separate detour.
- **Facility-type adaptive surface** (ties into the sidebar work — `facility-nomenclature.ts`): a
  Chemist-configured tenant sees only a Walk-in Sale screen under Billing — no account/ledger/queue
  UI at all, matching pos-api's pharmacy "direct" checkout today.

## Definition of Done

- [ ] A charge created in any department's form (registration/consultation/lab/pharmacy) shows up
      on `/patients/[id]/account` immediately.
- [ ] `CollectPaymentDialog` correctly shows "Collect Now" vs "Sent to Billing" based on the
      resolved `collection_mode` + the current user's `collect_own`/`collect_any` permissions —
      verified for both a Clinic-tier (billing_queue-default) and Facility-tier (direct-default)
      demo tenant.
- [ ] Billing queue lists charges from every department, not just one; settling one removes it
      from the queue without a page reload.
- [ ] Insurance eligibility check displays a clear pass/fail/pending state, never silently blocks
      checkout if the insurance check is unavailable (manual/CSV fallback per `hospital-api`
      `docs/integrations.md` § 2.4).
- [ ] A chemist-configured demo tenant's Billing nav shows only Walk-in Sale.
- [ ] `pnpm build`/`type-check` clean.

## Next Sprint

Sprint 6 — Inpatient (ward/bed occupancy board; discharge flow gains the balance-settlement block).
