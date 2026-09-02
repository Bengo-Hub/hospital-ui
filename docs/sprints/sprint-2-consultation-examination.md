# Hospital UI — Sprint 2: Consultation & Examination

**Status:** ✅ Shipped 2026-08-29 (`hospital-ui@bfe7576`) — `/consultation/queue` (doctor's
examination queue, diagnosis picker via the real `SearchableCombobox`). Deviated from an earlier
`/consultation` path to match this doc's own reserved route.
**Depends on:** `hospital-api` Sprint 2
**Goal:** Doctor consultation queue + examination/diagnosis form.

## Pages / Components

- `/[orgSlug]/consultation/queue` — per-queue-type worklist (doctor/dental/MCH/specialist).
- `/[orgSlug]/consultation/[visitId]` — examination form (notes, diagnosis picker sourced from
  the merged global+tenant-custom catalogue, referral-to-lab/pharmacy actions). **Note (2026-09-02,
  planned, not this sprint's scope):** the referral action should eventually branch into two shapes
  once hospital-api's richer schema exists — an internal referral (lab/pharmacy/specialist) keeps
  today's simple picker, while "refer to another facility" opens a separate form (receiving facility
  name/MFL code, a referral-letter/summary text area, a pre-referral-contact-confirmed checkbox, and
  an optional "book ambulance" action linking to Sprint 9). This sprint ships only the simple picker
  against the shipped `Referral` shape.

## Definition of Done

- [ ] Consultation → diagnosis → referral happy path works end to end.
- [ ] Diagnosis picker is a searchable combobox (reuse the shared `SearchableCombobox` pattern
      already established fleet-wide, per `inventory-category-global-leak-and-shared-combobox.md`),
      not a plain `<select>`.
- [ ] `pnpm build`/`type-check` clean.

## Next Sprint

Sprint 3 — Laboratory.

## Gap audit and MVP backlog candidates (2026-09-02)

UI-side mirror of the completeness audit in `hospital-api/docs/sprints/
sprint-2-consultation-examination.md`'s own "Gap audit" section, read that first for the full
backend detail and research citations. All items below are **proposed, not yet built**.

- **Recheck-vitals action**: `/consultation/[visitId]`'s examination form should gain a "Recheck
  vitals" button that opens the existing `TriageModal` (already built for Sprint 1) inline, rather
  than requiring the clinician to navigate away to `/triage`. No new component needed, just a new
  entry point into an existing one. The backend already supports re-triage on any pre-terminal
  visit.
- **Structured review-of-systems / physical exam fields**: once `ExaminationRecord` gains the
  proposed `review_of_systems`/`physical_exam_findings` JSON fields, the examination form needs a
  genuinely new structured section (a per-body-system findings grid), not just a bigger textarea.
  This is the larger half of that backend proposal, flagged here so it isn't underestimated as a
  simple form-field add.
- **Diagnosis history**: if `diagnosis_history` ships, the examination form's diagnosis picker
  should show a small "previously: X, changed to Y" trail rather than silently overwriting, so a
  clinician reopening a case after lab results return can see what the original working diagnosis
  was.
- **Treatment plan field**: a plain textarea for the proposed `treatment_plan` field, distinct from
  the existing free-text `notes` field, for the common "advice given, no referral" outcome that
  currently has nowhere to go except an undifferentiated note.

See `hospital-api/docs/mvp-gap-backlog-2026-09-02.md` for this item's place in the full
sprint-by-sprint backlog.
