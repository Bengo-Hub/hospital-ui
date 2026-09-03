# Hospital UI — Sprint 6: Inpatient

**Status:** ✅ Shipped 2026-09-02 (`hospital-ui@97a147f`). `pnpm type-check`/`pnpm build` both clean; dev server boot-checked (no SSR crash on `/wards`/`/admissions`) — a full authenticated browser click-through was NOT done this pass (no local multi-service auth stack available), so real backend interaction is unverified beyond the server-layer integration test in `hospital-api`.
**Depends on:** `hospital-api` Sprint 6
**Goal:** Ward/bed occupancy board, admission/transfer/discharge flows.

## Pages / Components (as actually shipped — modals, not separate routes)

Built as modals over two pages rather than the originally-sketched separate `/new`/`/transfer`/
`/discharge` routes — matches this app's own established pattern (e.g. Laboratory's "New Order" is
a modal on `/laboratory`, not a `/laboratory/new` route), not a scope reduction.

- `/[orgSlug]/wards` — occupancy board: one card per ward, bed tiles color **+ icon + text** coded
  (available/occupied/cleaning/out_of_service) per `docs/ux-ui.md`'s "never color alone" rule.
  Clicking an available/cleaning bed cycles its housekeeping status; clicking an occupied bed
  navigates to its admission. "New Ward"/"Bed" actions gated on `INPATIENT_MANAGE`.
- `/[orgSlug]/admissions` — active-admissions worklist (status filter active/discharged/all) +
  an "Admit Patient" modal (visit picker restricted to `registered`-status visits, bed picker
  grouped by ward, only `available` beds shown — fans out `useWardOccupancy` per ward via
  `useQueries` to build the picker without a dedicated backend "list all available beds" endpoint).
  Gated on `INPATIENT_ADD`.
- `/[orgSlug]/admissions/[admissionId]` — detail page: admission summary card, the new
  `AdmissionChargesPanel` (mirrors the existing `VisitChargesPanel` exactly, backed by the
  admission's own ledger via `GET .../admissions/{id}/account`), a "Transfer" action (modal
  covering BOTH intra-facility — destination bed picker excluding the current bed — and
  inter-facility — receiving facility name, closes the admission) gated on `INPATIENT_CHANGE`, and
  a "Discharge" action (modal showing the live outstanding balance from the account query, a
  discharge-summary field, and an override-reason field shown only to a caller holding
  `BILLING_OVERRIDE_SETTLEMENT`) gated on `INPATIENT_MANAGE`. Both mutations invalidate on
  `onSettled` (not just `onSuccess`): a BLOCKED discharge/transfer-out attempt still commits its
  ward-charge posting server-side before the 409, so the account panel must refresh even when the
  action itself fails, or the newly-posted charge would be invisible until an unrelated refetch.
- **Not built this pass**: a visible transfer-history list on the admission detail page (the
  `PatientTransfer` rows exist and are queried server-side for billing, but aren't surfaced in the
  UI yet — a real, acknowledged gap, not forgotten).

## Nav / RBAC wiring

- `lib/nav-config.ts`: the "Admissions & Beds" `comingSoon` placeholder is now a real "Inpatient"
  group (Ward Occupancy + Admissions), each item permission-gated on `INPATIENT_VIEW`.
- `lib/facility-nomenclature.ts`: `inpatient` moved out of `ALWAYS_VISIBLE` into
  `CLINIC_AND_ABOVE_MODULES` — hidden for Chemist tier (no Patient/Visit to admit at all), visible
  Clinic and up. A Clinic tenant without the paid Inpatient add-on still sees the nav item (nav
  visibility is a presentation concern) but gets a real `feature_not_available` response from the
  backend's `RequireFeature(FeatureInpatientModule)` gate if they try to use it — same pattern
  every other tier-gated module on this platform already follows.
- `lib/rbac/permissions.ts`: `ROLE_PERMISSIONS` updated to match hospital-api's `rbac/seed.go` —
  doctor/nurse/manager gain `INPATIENT_ADD`; doctor/manager gain `INPATIENT_MANAGE`.

## Definition of Done

- [x] Admit → occupancy board updates on refetch (15s poll on the worklist/occupancy queries, not
      websockets — v1 scope) → discharge → checkout triggered, happy path built.
- [x] Admit → intra-facility transfer (ward/bed change) → discharge — UI built against the real
      backend contract; day-rate segmentation itself is a backend concern (see hospital-api's own
      Sprint 6 doc) and isn't re-verified in the frontend.
- [x] Admit → inter-facility transfer-out closes the admission and settles the account the same way
      discharge does — the SAME Discharge modal component's outstanding-balance UX applies, since
      the backend shares one `closeAdmission` code path for both.
- [x] `pnpm build`/`type-check` clean.
- [ ] A real authenticated browser click-through (admit → transfer → discharge against live
      demo-tenant data) — not done this pass, flagged rather than silently skipped.

## Gap audit — UI implications (2026-09-02, later the same day)

`hospital-api/docs/sprints/sprint-6-inpatient.md` gained a matching "Gap audit and Sprint 6.1
candidates" section after a client review flagged missing IPD sub-modules.

**Shipped 2026-09-03**: every item below is live — the ward-type picker with `billable_item_code`
suggestion (`NewWardModal`), a bed-tile isolation-precaution select (text + ⚠ icon, not color
alone, per this doc's own rule), the structured discharge-summary form fields on the Discharge
modal, and a nursing-vitals/ward-round section pair (`VitalsChartPanel`/`WardRoundsPanel`) plus a
new `TransferHistoryPanel` on the admission detail page.

- **Ward/bed-type picker.** Once `ward.ward_type` exists, the "New Ward" form gains a type select
  (General/Private/Semi-Private/Isolation/ICU) that suggests a default `billable_item_code`, still
  overridable — same pattern the form already uses for any other tenant-configurable default.
- **Isolation-precaution flag on bed tiles.** Once `bed.isolation_precaution` exists, the `/wards`
  occupancy board's bed tiles gain a 4th visual state (in addition to available/occupied/cleaning/
  out_of_service) — color **+ icon + text**, per `docs/ux-ui.md`'s "never color alone" rule, not an
  overloaded reuse of the existing status coding.
- **Structured discharge-summary form.** The Discharge modal's single free-text `discharge_summary`
  textarea becomes a short structured form (discharge diagnosis, procedures performed, discharge
  medications, follow-up instructions, condition-at-discharge select) with the existing free-text
  field kept as an "additional notes" area — additive to the modal, not a redesign of the
  Transfer/Discharge flow itself.
- **Nursing vitals / ward-round tab.** If `vitals_chart_entry`/`ward_round_note` ship, the admission
  detail page gains a new tab or section (alongside the existing `AdmissionChargesPanel`) showing the
  vitals time series and round notes chronologically — a nurse-facing quick-entry form for vitals,
  a doctor-facing quick-entry form for round notes, gated on their respective permissions.
- **Equipment-linkage picker — shipped 2026-09-02, same day.** A shared `EquipmentPickerModal`
  (`components/assets/equipment-picker-modal.tsx`) is reused on the `/wards` board's bed tiles (a
  small Stethoscope icon-button overlaid on each tile, gated `INPATIENT_MANAGE`), sourced from a
  new read-only `/assets` "Biomedical Equipment" page. See hospital-api's
  `docs/architecture.md`'s Asset Integration section for the backend side
  (`Bed.equipment_asset_ids`, a JSON array, not a single field).

## Next Sprint

Sprint 7 — Theatre/OT scheduling + ICU monitoring board.
