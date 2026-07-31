# Hospital UI — Sprint 5: Billing & Insurance

**Status:** ⏳ Planned
**Depends on:** `hospital-api` Sprint 5
**Goal:** Visit checkout screen, insurance eligibility check UI.

## Pages / Components

- `/[orgSlug]/billing/checkout/[visitId]` — itemized charges (consultation/lab/drugs), payment
  method selection (cash/M-Pesa/card/insurance), eTIMS opt-in indicator (off by default, per the
  platform's corrected billing stance).
- `/[orgSlug]/billing/insurance/[visitId]` — eligibility check result + claim submission action.

## Definition of Done

- [ ] Full checkout flow (aggregate charges → select payment method → complete) works end to end.
- [ ] Insurance eligibility check displays a clear pass/fail/pending state, never silently blocks
      checkout if the insurance check is unavailable (manual/CSV fallback per `hospital-api`
      `docs/integrations.md` § 2.4).
- [ ] `pnpm build`/`type-check` clean.

## Next Sprint

Sprint 6 — Inpatient (ward/bed occupancy board).
