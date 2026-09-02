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
