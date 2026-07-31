# Hospital UI — Sprint 0: Foundations

**Status:** ✅ Shipped (2026-07-31)
**Goal:** Next.js scaffold, SSO/PKCE auth, tenant branding, app shell — no domain pages.

## What Shipped

- Next.js 16.2.3 / React 19.2.4 / TypeScript (strict) / Tailwind 4, `@bengo-hub/shared-ui-lib@v0.1.47`.
- `src/lib/auth/{pkce,api,token-refresh}.ts` + `src/store/auth.ts` — full SSO/PKCE flow against auth-api.
- `src/providers/{auth-provider,branding-provider}.tsx` — tenant-branding CSS custom properties.
- `src/app/[orgSlug]/{login,auth/callback,dashboard,unauthorized}/page.tsx` + `org-shell.tsx` layout.
- `src/components/{sidebar,header,theme-toggle}.tsx` + `src/components/ui/{base,confirm-dialog,page}.tsx` (shadcn via `@base-ui`).
- `/healthz` route, `Dockerfile`, `.env.example`.

## Verification (done)

- `pnpm build` — clean, zero errors, 8 routes compiled.
- `pnpm type-check` (`tsc --noEmit`) — clean.
- `pnpm lint` — fails on a pre-existing ESLint-9/`eslint-config-next` FlatCompat interop bug shared
  with sibling repos (see root `README.md` "Known gap") — not a scaffold defect.

## Explicitly NOT in this sprint

No domain pages (Patients, Consultation, Lab, Pharmacy, etc.) — `hospital-api` has no domain
endpoints yet either. The dashboard's stat cards are static placeholders.

## Next Sprint

Sprint 1 — Reception/OPD queue, Patient registry, Triage UI (once `hospital-api` Sprint 1 ships).
