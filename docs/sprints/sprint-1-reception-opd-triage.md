# Hospital UI — Sprint 1: Reception / OPD Queue / Patient Registry / Triage

**Status:** ⏳ Planned
**Depends on:** `hospital-api` Sprint 1
**Goal:** Patient registration form, OPD queue (worklist table), triage vitals-entry form.

## Pages / Components

- `/[orgSlug]/patients` — searchable patient list + registration form (single-column, per `docs/ux-ui.md`'s clinical-form guidance). Identification-type selector offers National ID / Passport / Birth Certificate / **Maisha Number** / Alien ID, matching the ID types Kenya's own national Client Registry accepts (added 2026-08-29, see `hospital-api/docs/compliance-kenya.md` §6) — not a generic "other" text field.
- `/[orgSlug]/patients/[id]` — patient detail (visit history).
- `/[orgSlug]/reception/queue` — live OPD queue table (sortable, priority-highlighted), the primary "get through my worklist" screen for front-desk staff.
- `/[orgSlug]/triage/[visitId]` — vitals-entry form with inline validation on blur, autosave draft.

## Data Layer

- `lib/api/patients.ts`, `lib/api/visits.ts` + matching TanStack Query hooks (`hooks/usePatients.ts`, `hooks/useVisits.ts`) — never inline `fetch`.

## Definition of Done

- [ ] Register → check-in → appear in OPD queue → triage happy path works end to end against a real `hospital-api` Sprint 1 deployment.
- [ ] `pnpm build`/`type-check` clean.
- [ ] Accessibility pass per `docs/ux-ui.md` (labels, contrast, keyboard nav on the queue table).

## Next Sprint

Sprint 2 — Consultation & Examination.
