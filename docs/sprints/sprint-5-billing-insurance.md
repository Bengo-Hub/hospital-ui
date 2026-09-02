# Hospital UI — Sprint 5: Billing & Patient Accounts (Insurance)

**Status:** ✅ Core ledger UI shipped 2026-08-29 (`hospital-ui@e6a4216`) — `/billing/queue`
(cashier desk, department filter, `collect_any`-gated Collect) and `/visits/[visitId]/account`
(facility-type-branched: clinic+ get the full `PatientAccountLedger` with StatCards + per-charge
Collect Now, Settle/Override-Settlement gated to facility+hospital tiers). **Correction
2026-09-02**: the chemist-tier branch (`ChemistCheckout`, listed as shipped below) was a real
bug, not a working feature — it read `usePendingCharges()` (the `BillableCharge` queue), which
structurally can never contain a chemist walk-in dispense's charge (hospital-api's
`PostCharge`/`PatientAccount` requires a real patient/visit, which a chemist can never have), so
it always rendered "Nothing pending" for a real chemist tenant. Removed; superseded by a real
`WalkInSale`-backed `/pharmacy/walk-in-sales` "Today's Sales" page (hospital-api's matching fix
shipped the same day) — this route now points there instead. ✅ Insurance eligibility/claim-submit UI shipped 2026-08-30
(`hospital-ui@d81188c`) — a shared `InsuranceClaimModal` component reused across Lab, Pharmacy and
this visit-level route, with a real provider picker (closed a previously-undiscovered gap:
treasury-api's provider list was admin-JWT-only, fixed via a new S2S route, `treasury-api@e67ef9d`).
✅ Billing Item Catalog admin (`/billing/settings`) shipped same commit. ✅ `PatientNextOfKin`
closed end-to-end same commit — was a dead feature on both sides; Settle Account now has a real
picker + inline add-new form instead of a raw UUID box. **Still not built**: the shared
`CollectPaymentDialog` embedded at the point of charge (registration/consultation/lab/pharmacy
forms) — those flows still only reach billing via `/billing/queue` or the account page, never
inline. The account page still has no inbound link from a patients/visits list (direct-URL only).
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
- `/[orgSlug]/billing/settings` — ✅ shipped 2026-08-30. Per-tenant `BillableItemCatalog` CRUD
  (price, department, `collection_mode`, `requires_prepayment`, `applies_to`).
- Insurance claim action — ✅ shipped 2026-08-30, but as a shared modal invoked from each existing
  page (`visits/[visitId]/account`'s per-charge row, `laboratory/page.tsx`'s worklist row,
  `pharmacy/[id]/page.tsx`'s prescription actions) rather than the separate
  `/[orgSlug]/billing/insurance/[visitId]` route originally spec'd here — the per-page action was
  a better fit than a dedicated route once it became clear Lab/Pharmacy needed the exact same
  capability on THEIR OWN charges, not just visit-level ones.
- Discharge/mortuary release flow (Sprint 6/10) surfaces the outstanding-balance block inline —
  Record Payment / Apply Insurance / Write-Off / "next of kin settling" options right on the
  discharge screen, not a separate detour.
- **Facility-type adaptive surface** (ties into the sidebar work — `facility-nomenclature.ts`): a
  Chemist-configured tenant sees only a Walk-in Sale screen (`/pharmacy/walk-in-sales`, "Today's
  Sales", linked from the Pharmacy page header) — no `PatientAccount` ledger/queue UI at all,
  matching pos-api's pharmacy "direct" checkout, and backed by a real `WalkInSale` entity
  (2026-09-02) rather than the broken `BillableCharge`-queue read the original `ChemistCheckout`
  page used.

## Definition of Done

- [ ] A charge created in any department's form (registration/consultation/lab/pharmacy) shows up
      on the account ledger immediately. (Ledger itself works; there's still no inline
      `CollectPaymentDialog` at the point of charge — see "Still not built" above.)
- [ ] `CollectPaymentDialog` correctly shows "Collect Now" vs "Sent to Billing" based on the
      resolved `collection_mode` + the current user's `collect_own`/`collect_any` permissions —
      not built (see above); the account/queue pages cover this today, just not inline.
- [x] Billing queue lists charges from every department, not just one; settling one removes it
      from the queue without a page reload.
- [x] Insurance claim submission has a real provider picker and reports accepted vs.
      pending-adjudication clearly; never silently blocks checkout if unavailable (a transport
      error surfaces via toast, the charge stays untouched for cash collection instead).
- [x] A chemist-configured demo tenant's Billing nav shows only Walk-in Sale. **Corrected
      2026-09-02** — this checkbox previously verified only that the nav pointed somewhere, not
      that the destination worked; the actual `ChemistCheckout` page was broken (see Status
      above). Now backed by a real `WalkInSale`-driven "Today's Sales" page at
      `/pharmacy/walk-in-sales`.
- [x] `pnpm build`/`type-check` clean (verified 2026-08-30, re-verified 2026-09-02).

## Next Sprint

Sprint 6 — Inpatient (ward/bed occupancy board; discharge flow gains the balance-settlement block).
