# Hospital UI — Sprint 1: Reception / OPD Queue / Patient Registry / Triage

**Status:** ✅ Shipped 2026-08-29 (`hospital-ui@bfe7576`) — `/patients` (search/register + visit
check-in) and `/triage` (vitals capture) pages, `visit-status-badge.tsx`. Uses the real
shared-ui-lib `SearchableCombobox` (bumped to v0.1.82 same day for the fixed-position dropdown —
see Sprint 2). OPD queue lives at `/consultation/queue` (Sprint 2 scope, not a separate page here).
**Depends on:** `hospital-api` Sprint 1
**Goal:** Patient registration form, OPD queue (worklist table), triage vitals-entry form.

## Pages / Components

- `/[orgSlug]/patients` — searchable patient list + registration form (single-column, per `docs/ux-ui.md`'s clinical-form guidance). Identification-type selector offers National ID / Passport / Birth Certificate / **Maisha Number** / Alien ID, matching the ID types Kenya's own national Client Registry accepts (added 2026-08-29, see `hospital-api/docs/compliance-kenya.md` §6) — not a generic "other" text field.
- `/[orgSlug]/patients/[id]` — patient detail (visit history). **Note (2026-09-02, planned, not this sprint's scope):** once hospital-api's richer inter-facility `Referral`/new `PatientTransfer` entities exist (see `hospital-api/docs/architecture.md`'s "Referral, Transfer & Ambulance Billing" section), this page should also surface a referral/transfer history section, not just the visit list — noted here so the eventual work has a landing spot, not implemented by this sprint.
- `/[orgSlug]/triage` — flat (not dynamic-route) triage queue page: lists visits with `status=registered` awaiting vitals, opens a `TriageModal` per visit for vitals capture. Reached via a banner link from `/[orgSlug]/patients`, not a dedicated sidebar entry — `facility-nomenclature.ts` unifies reception/triage/consultation under the single "Patients" sidebar item. There is no separate `/reception/queue` page; the OPD worklist itself lives at `/consultation/queue` (Sprint 2 scope).

## Data Layer

- `lib/api/patients.ts`, `lib/api/visits.ts` + matching TanStack Query hooks (`hooks/usePatients.ts`, `hooks/useVisits.ts`) — never inline `fetch`.

## Definition of Done

- [ ] Register → check-in → appear in OPD queue → triage happy path works end to end against a real `hospital-api` Sprint 1 deployment.
- [ ] `pnpm build`/`type-check` clean.
- [ ] Accessibility pass per `docs/ux-ui.md` (labels, contrast, keyboard nav on the queue table).

## Next Sprint

Sprint 2 — Consultation & Examination.

## Gap audit and MVP backlog candidates (2026-09-02)

**Shipped 2026-09-03**: identification-type dropdown, SHA/SHIF beneficiary field, photo upload
(`RegisterPatientModal`), the non-blocking "possible duplicate" `ConfirmDialog` warning, and the
OPD/consultation queue's priority badge (new `AcuityBadge`/`latestTriageRecord`, `src/components/
clinical/acuity-badge.tsx`) reflecting the backend's urgent-first ordering are all live. See
`hospital-api/docs/mvp-gap-backlog-2026-09-02.md` for backend detail. Appointments unchanged
(still `comingSoon`, out of scope).

UI-side mirror of the completeness audit in `hospital-api/docs/sprints/
sprint-1-patient-opd-triage.md`'s own "Gap audit" section, read that first for the full backend
detail and research citations. All items below are **proposed, not yet built**.

**Doc-drift correction, found by this audit**: this doc's own Pages/Components section above
claims the patient registration form has an "Identification-type selector... Maisha Number..."
option. It does not. `patients/page.tsx`'s own `RegisterPatientModal` has one plain text `id_number`
input, and the page's own top-of-file comment already flags this exact drift ("that doc
additionally describes a Kenya ID-type selector and a separate `/patients/[id]` detail page;
neither exists in `RegisterPatientInput`/`Patient`... yet"). Fixing the doc's own claim here: the
selector does not exist today.

- **Identification-type selector**: add once `hospital-api` ships the proposed
  `identification_type` enum field, a dropdown next to the existing ID-number input
  (national_id/passport/birth_certificate/maisha_number/alien_id).
- **SHA/SHIF beneficiary number field**: add to the registration form once the backend field ships,
  so it's captured once instead of retyped at every insurance eligibility check.
- **Patient photo capture**: a simple image-upload step in `RegisterPatientModal`, once
  `Patient.photo_url` ships backend-side. Fingerprint biometric capture is explicitly out of scope
  for hospital-ui (a hardware/SHA-API integration, not a frontend form field). See the api doc's
  own note on this.
- **Possible-duplicate warning**: the registration form should surface a non-blocking "a patient
  matching this name/phone/ID already exists. Continue anyway?" prompt once the backend's
  pre-save duplicate check exists (proposed in the api doc). A pure UX addition, no new UI page.
- **OPD queue acuity ordering**: `/consultation/queue` (Sprint 2's page, this sprint's own worklist
  concept lives there per this doc's own note above) should show a priority badge and reflect
  urgent-first ordering once `patients.Service.ListVisits` returns triage-priority-sorted results.
  Currently the queue is pure FIFO by check-in time, with no visual acuity signal at all even though
  `TriageRecord.priority` is captured.
- **Appointments**: confirmed still `comingSoon: true` in `lib/nav-config.ts` with zero backend.
  No change needed here, already tracked, not re-researched this pass.

See `hospital-api/docs/mvp-gap-backlog-2026-09-02.md` for this item's place in the full
sprint-by-sprint backlog.
