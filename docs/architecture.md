# Hospital UI — Architecture

**Last updated:** 2026-08-30 (status line only — layer/data-flow/branding sections below were
already accurate and remain unchanged). See `docs/plan.md` for current build status.

## Layer Overview

| Layer | Responsibility | Path |
|---|---|---|
| App Router pages | Route-level composition, `/[orgSlug]/...` per-tenant URL scoping (matches every sibling UI) | `app/[orgSlug]/` |
| Components | Reusable UI, shadcn primitives, domain components | `components/` |
| API layer | Typed API client functions per domain, TanStack Query hooks | `lib/api/`, `hooks/` |
| Auth | SSO/PKCE against auth-api, token storage, branding provider | `lib/auth/`, `providers/branding-provider` |
| State | Zustand stores for client-only state (selected outlet, terminal session, etc.) | `store/` |

## Data Flow

hospital-ui **never** calls inventory-api, treasury-api, logistics-api, or notifications-api
directly — it calls `hospital-api`, which proxies/aggregates those services per its own
`docs/architecture.md` Data Authority table. This keeps the ownership boundary enforceable in one
place (the backend) rather than duplicated in frontend fetch logic.

## Multi-Tenant URL Scoping

`/[orgSlug]/...` route structure, tenant resolved from the URL slug, JWT tenant claim used for
authorization — identical pattern to `pos-ui`/`inventory-ui`/`library-ui`.

## Branding

Tenant branding (logo, primary color) is fetched from auth-api's Redis-cached branding endpoint and
applied as CSS custom properties (`--primary`, `--brand-*`), exactly like every sibling frontend —
hospital-ui never stores or hardcodes tenant branding.

## Standalone-Chemist Mode

When a tenant's `hospital-api` subscription has only the Pharmacy module enabled (see
`hospital-api/docs/migration-pos-pharmacy.md` § 6), hospital-ui's sidebar/navigation hides every
other domain's routes — driven by the same JWT `sub_features` claim every other Codevertex frontend
already uses for feature-gating (`SubscriptionGate`/`useSubscription` pattern), not a hospital-ui-specific
mechanism.

## Changelog

- **2026-07-31** — Initial architecture doc written alongside the Sprint-0 scaffold.
