# Hospital UI — Sprint 1: Reception / OPD Queue / Patient Registry / Triage

**Status:** ✅ Shipped 2026-08-29 (`hospital-ui@bfe7576`) — `/patients` (search/register + visit
check-in) and `/triage` (vitals capture) pages, `visit-status-badge.tsx`. Uses the real
shared-ui-lib `SearchableCombobox` (bumped to v0.1.82 same day for the fixed-position dropdown —
see Sprint 2). OPD queue lives at `/consultation/queue` (Sprint 2 scope, not a separate page here).
**Depends on:** `hospital-api` Sprint 1
**Goal:** Patient registration form, OPD queue (worklist table), triage vitals-entry form.

## Pages / Components

- `/[orgSlug]/patients` — searchable patient list + registration form (single-column, per `docs/ux-ui.md`'s clinical-form guidance). Identification-type selector offers National ID / Passport / Birth Certificate / **Maisha Number** / Alien ID, matching the ID types Kenya's own national Client Registry accepts (added 2026-08-29, see `hospital-api/docs/compliance-kenya.md` §6) — not a generic "other" text field.
- `/[orgSlug]/patients/[id]` — patient detail (visit history).
- `/[orgSlug]/triage` — flat (not dynamic-route) triage queue page: lists visits with `status=registered` awaiting vitals, opens a `TriageModal` per visit for vitals capture. Reached via a banner link from `/[orgSlug]/patients`, not a dedicated sidebar entry — `facility-nomenclature.ts` unifies reception/triage/consultation under the single "Patients" sidebar item. There is no separate `/reception/queue` page; the OPD worklist itself lives at `/consultation/queue` (Sprint 2 scope).

## Data Layer

- `lib/api/patients.ts`, `lib/api/visits.ts` + matching TanStack Query hooks (`hooks/usePatients.ts`, `hooks/useVisits.ts`) — never inline `fetch`.

## Definition of Done

- [ ] Register → check-in → appear in OPD queue → triage happy path works end to end against a real `hospital-api` Sprint 1 deployment.
- [ ] `pnpm build`/`type-check` clean.
- [ ] Accessibility pass per `docs/ux-ui.md` (labels, contrast, keyboard nav on the queue table).

## Next Sprint

Sprint 2 — Consultation & Examination.
