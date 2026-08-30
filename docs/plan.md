# Hospital UI (Codevertex Afya) — Plan

**Service:** hospital-ui
**Last updated:** 2026-08-30
**Status:** Sprints 0-5 shipped, live in production, matching hospital-api's own parity. Real domain pages exist for reception/triage, consultation, laboratory, pharmacy/dispensing, and billing/insurance, plus a Staff & Roles / Config admin surface — all gated by a real RBAC system (`Can`, `useAppPermissions`, permission-filtered sidebar). See `docs/sprints/` for what shipped in each sprint.

---

## Product Overview

hospital-ui is the frontend for Codevertex Afya, the platform's hospital/clinic management product.
It talks exclusively to `hospital-api` for domain data and to `auth-api` for SSO — matching every
other Codevertex frontend's architecture (pos-ui, inventory-ui, library-ui). It does not call
inventory-api/treasury-api/logistics-api directly; those integrations are proxied through
hospital-api per the ownership boundaries in `hospital-api/docs/architecture.md`.

## Technology Stack

Mirrors `library-service/library-ui` — the most recently built sibling frontend in this ecosystem
(2026-06-26) — for dependency-version consistency with `@bengo-hub/shared-ui-lib`: Next.js (App
Router), React, TypeScript, Tailwind CSS, shadcn/ui components via `@base-ui` (not Radix, per
`feedback_ui_architecture_uniformity.md`), TanStack Query for server state, Zustand for client
state, axios-based shared API client. Default **light** theme (`frontends-default-light-theme.md`)
— never system/dark by default.

## Conventions (non-negotiable, per project memory)

- Shared `apiClient` + TanStack hooks only — never inline `fetch` calls in components.
- shadcn primitives via `@base-ui`, Tailwind v4 utility classes, semantic design tokens — never
  hardcoded hex colors in component code (tenant branding drives `--primary`/`--brand-*` CSS
  variables, resolved from auth-api's tenant-branding cache, exactly like every sibling UI).
- `sonner` for toasts, a shared `ConfirmDialog` for destructive/sensitive actions.
- `pnpm` only for install/build — never `npm`.

## Roadmap

See `docs/sprints/` for the full sprint-by-sprint plan (mirrors `hospital-api`'s sprint numbering at
UI pace — a UI sprint typically follows the API sprint that unlocks its data, sometimes combining
two lighter API sprints into one UI sprint).

| Sprint | Scope |
|---|---|
| 0 | Foundations: Next.js scaffold, SSO auth flow, branding provider, app shell, placeholder dashboard |
| 1 | Reception/OPD queue, Patient registry, Triage |
| 2 | Consultation & Examination |
| 3 | Laboratory |
| 4 | Pharmacy & Dispensing terminal (incl. standalone-chemist mode) |
| 5 | Billing & Insurance |
| 6 | Inpatient — ward/bed occupancy board, admission/discharge |
| 7 | Theatre/OT scheduling + ICU monitoring board |
| 8 | Blood Bank & Transfusion |
| 9 | Ambulance dispatch + Biomedical Equipment (asset) views |
| 10 | Specialized programmes (ANC/PNC/ART-OTZ/TB/Immunization/VMMC/PMTCT-EID/cancer screening) + reporting/KHIS export |

## References

- [Architecture](architecture.md)
- [UX/UI Design Guidance](ux-ui.md)
- [Sprint Plans](sprints/)
- `hospital-service/hospital-api/docs/` — the backend contract this UI is built against
- `hospital-service/hospital-api/docs/kenyaemr-technical-reference.md` — the KenyaEMR technical
  audit behind this doc's 2026-08-29 programme-list and billing-status updates
