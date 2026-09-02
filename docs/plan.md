# Hospital UI (Codevertex Afya) — Plan

**Service:** hospital-ui
**Last updated:** 2026-09-02
**Status:** Sprints 0-7 shipped, live in production, matching hospital-api's own parity. Real domain pages exist for reception/triage, consultation, laboratory, pharmacy/dispensing, billing/insurance, inpatient (ward occupancy board, admissions worklist, admit/transfer/discharge), and theatre/ICU (Hospital tier only), plus a Staff & Roles / Config admin surface — all gated by a real RBAC system (`Can`, `useAppPermissions`, permission-filtered sidebar). See `docs/sprints/` for what shipped in each sprint. **2026-09-02 — Sprint 7 (Theatre/ICU), same session as Sprint 6:** new `/theatre/schedule` (booking list with a date filter, a "Schedule Surgery" modal, a pre-op checklist modal, Activate/Start/Complete/Cancel actions matching the backend's real lifecycle) and `/icu` (a severity-flag board — icon+text+color per `docs/ux-ui.md`'s "never color alone" rule — with a Start Episode modal and inline severity/End actions). `lib/facility-nomenclature.ts` gained its first facility-tier distinction narrower than "Clinic and above": a new `HOSPITAL_ONLY_MODULES` set (Theatre/ICU are Hospital-tier-only, per subscriptions-api's real plan matrix). `lib/rbac/permissions.ts` gained `ICU_*` permission codes and matching `ROLE_PERMISSIONS` grants. `pnpm type-check`/`pnpm build` both clean. **2026-09-02 — Sprint 6 (Inpatient):** new `/wards` (occupancy board — bed tiles color+icon+text coded per `docs/ux-ui.md`'s "never color alone" rule, click an available/cleaning bed to cycle housekeeping status, click occupied to view its admission) and `/admissions` (worklist + Admit modal) + `/admissions/[admissionId]` (detail — Transfer modal covering both intra- and inter-facility moves, Discharge modal surfacing the outstanding-balance gate, a new `AdmissionChargesPanel` mirroring the existing `VisitChargesPanel` but backed by the admission's own ledger). `lib/nav-config.ts`'s "Admissions & Beds" `comingSoon` placeholder is now a real permission-gated "Inpatient" group; `lib/facility-nomenclature.ts` moved the module out of `ALWAYS_VISIBLE` into the Clinic-and-above tier (hidden for Chemist, which has no Patient/Visit to admit at all). `pnpm type-check`/`pnpm build` both clean. **2026-08-30:** the Staff & Roles admin surface was rebuilt into three pages — `/users` (now on shared-ui-lib's `DataTable`, plus an Invite Staff flow and deactivate/reactivate actions), `/roles` (a new global-role customization + custom-role permission-matrix editor), and `/audit-log` (a new view-only RBAC activity log) — matching hospital-api's own user-management rebuild the same day. This is new capability beyond the original Sprint 0-10 roadmap below, not part of any numbered sprint. **2026-08-30 (later the same day) — follow-up round:** `/users` gained filterable Status/Role columns and a per-user Outlets assignment cell (hidden automatically for single-outlet tenants); `/roles` gained a delete action for non-system roles; `/audit-log` is now gated behind a real permission check (`hospital.users.manage`) with a proper "access required" empty state instead of silently showing "no data" to an unauthorized viewer; `/config` was fixed (a live `null.length` crash) and fully redesigned into a two-column, `max-w-5xl` layout with a real "Facility Operating Settings" form (default landing view, auto-logout timeout, operating hours with a same-every-day toggle) wired to hospital-api's new `PUT /config`, replacing the earlier narrow placeholder page. **2026-09-02 — chemist/pharmacy workflow gap-fix pass:** a real "Today's Sales" page (`/pharmacy/walk-in-sales`) replaces the previously-broken `ChemistCheckout` component (it read a queue that could never hold a chemist's charges — see `docs/sprints/sprint-5-billing-insurance.md`'s correction note); a real drug catalog search replaces free-text-only prescription-line entry; `InsuranceClaimModal` gained an eligibility pre-check and claim-status refresh/resubmit (both backend hooks existed with zero prior UI call sites); the consultation queue now resurfaces `lab_complete` visits; several `<Can>` permission-gate mismatches were fixed against their real backend routes; and Cancel actions were added for referrals and visits. Full detail: `.claude/plans/hospital-chemist-pharmacy-remediation-2026-09-02.md`.

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
| 6 | Inpatient — ward/bed occupancy board, admission/transfer/discharge (✅ shipped 2026-09-02) |
| 7 | Theatre/OT scheduling + ICU monitoring board (✅ shipped 2026-09-02) |
| 8 | Blood Bank & Transfusion |
| 9 | Ambulance dispatch + Biomedical Equipment (asset) views |
| 10 | Specialized programmes (ANC/PNC/ART-OTZ/TB/Immunization/VMMC/PMTCT-EID/cancer screening) + reporting/KHIS export |

## Referral, Transfer & Ambulance UI implications (2026-09-02, planned, no code yet)

A client-facing engineer flagged that referral/transfer/ambulance workflows were underdeveloped
across both repos' docs. hospital-api's side (`hospital-api/docs/architecture.md`'s new "Referral,
Transfer & Ambulance Billing" section, plus `erd.md`/`integrations.md`) designed the richer schema
this round; nothing here has shipped in hospital-api yet, so none of it is buildable in hospital-ui
yet either. Noted here so the UI sprints below (1, 2, 6, 9) carry the forward-reference rather than
being silent about it:

- The examination form's referral action (Sprint 2) will need to branch: an internal referral
  (lab/pharmacy/specialist, today's simple picker) stays as-is, but "refer to another facility" opens
  a richer form (receiving facility name/MFL code, a referral letter/summary text area, a
  pre-referral-contact-confirmed checkbox, and an optional "book ambulance" action).
- The patient detail page (Sprint 1) will eventually need a referral/transfer history section once
  the richer `Referral`/new `PatientTransfer` entities exist, not just the current visit list.
- The ward occupancy board and admission detail page (Sprint 6) will need a "Transfer Patient" action
  (destination ward/bed, or "transfer to another facility") and a transfer-history view on the
  admission.
- The ambulance booking screen (Sprint 9) will need to show whether a booking is attached to a
  patient's billing account or standalone, and surface the posted `BillableCharge` once one exists.

## References

- [Architecture](architecture.md)
- [UX/UI Design Guidance](ux-ui.md)
- [Sprint Plans](sprints/)
- `hospital-service/hospital-api/docs/` — the backend contract this UI is built against
- `hospital-service/hospital-api/docs/kenyaemr-technical-reference.md` — the KenyaEMR technical
  audit behind this doc's 2026-08-29 programme-list and billing-status updates
