# Hospital UI — Sprint 10: Specialized Programmes + Reporting Dashboards

**Status:** ⏳ Planned
**Depends on:** `hospital-api` Sprint 10/11
**Goal:** ANC/PNC/ART/TB/Immunization/VMMC/PMTCT-EID/cancer-screening/Morgue module UIs,
occupancy/revenue/throughput dashboards, KHIS export screen. Programme list expanded 2026-08-29 to
match `hospital-api`'s own Sprint 10 update — see `hospital-api/docs/kenyaemr-technical-reference.md` §4.

## Pages / Components

- `/[orgSlug]/programmes/{anc,pnc,art,tb,immunization,vmmc,hei,cancer-screening,morgue}` — one CRUD surface per programme. The ART programme's form includes an OTZ (Operation Triple Zero) adolescent-cohort toggle rather than a separate page.
- `/[orgSlug]/reports` — dashboards per `docs/ux-ui.md`'s Charts & Data guidance (legend, tooltip,
  table alternative, meaningful empty states). Revenue chart data comes from hospital-api, which
  itself delegates to treasury-api — the UI never computes financial aggregates client-side.
- `/[orgSlug]/reports/khis` — indicator preview + export/download action.

## Definition of Done

- [ ] Each programme's CRUD works and is patient-linked.
- [ ] Dashboards render real data, with correct empty states for a fresh demo tenant.
- [ ] KHIS export screen produces a downloadable ADX file.
- [ ] `pnpm build`/`type-check` clean.

## Beyond Sprint 10

Further UI polish (compliance/consent capture screens, mobile responsiveness pass, launch-readiness
QA) tracks alongside `hospital-api`'s Sprint 12-13 — add new sprint docs as that work is scoped.
