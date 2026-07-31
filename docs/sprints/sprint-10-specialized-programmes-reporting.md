# Hospital UI — Sprint 10: Specialized Programmes + Reporting Dashboards

**Status:** ⏳ Planned
**Depends on:** `hospital-api` Sprint 10/11
**Goal:** ANC/PNC/ART/TB/Immunization/Morgue module UIs, occupancy/revenue/throughput dashboards, KHIS export screen.

## Pages / Components

- `/[orgSlug]/programmes/{anc,pnc,art,tb,immunization,morgue}` — one CRUD surface per programme.
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
