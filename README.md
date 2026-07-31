# Hospital UI (Codevertex Afya)

Frontend scaffold for `hospital-api` — the Codevertex Afya hospital/clinic management system.
Next.js 16 (App Router) + React 19, multi-tenant via `[orgSlug]`, SSO/PKCE auth.

**Status:** Sprint-0 scaffold. Auth, tenant branding, and the app shell (sidebar/header) are wired
up; there are no domain pages yet — `hospital-api` has no business endpoints beyond `/ping` at
this stage. The dashboard shows placeholder stat cards only, with zero data wiring.

## Stack

- Next.js 16.2.3, React 19.2.4, TypeScript 5 (strict), Tailwind CSS 4.
- Zustand 5 (auth store), TanStack Query 5 (server state), Axios (`apiClient`).
- SSO/PKCE against auth-api; `@bengo-hub/shared-ui-lib` pinned to `v0.1.47` — the same tag used by
  `library-ui`/`pos-ui` — for cross-frontend compatibility.
- `next-themes` (light-first default, manual toggle), `sonner` (toasts), `lucide-react` (icons).

No PWA / service-worker (unlike `library-ui`/`pos-ui`) — out of scope for this scaffold.

## Dev

```bash
pnpm install
pnpm dev          # next dev --port 3010
pnpm build        # next build
pnpm start        # next start --port 3010
pnpm lint
pnpm type-check
```

Dev server runs on **http://localhost:3010** — kept distinct from the other Codevertex frontends
(hospital-api itself listens on `:4200`; see `hospital-api/.env.example`).

**Known gap:** `pnpm lint` currently fails with an upstream `@eslint/eslintrc` FlatCompat
"Converting circular structure to JSON" error while validating `next/core-web-vitals` — this
reproduces on the exact same `eslint`/`eslint-config-next` versions used elsewhere in the fleet
(`library-ui` doesn't even ship a working `eslint.config.mjs`), so it's a pre-existing
ESLint-9-vs-Next-16 interop issue, not something introduced by this scaffold. `pnpm build` and
`pnpm type-check` both pass clean and are the gates that matter for now.

### Environment

Copy `.env.example` to `.env.local` and adjust as needed:

| Var | Purpose | Default |
|-----|---------|---------|
| `NEXT_PUBLIC_API_URL` | hospital-api base | `http://localhost:4200` (dev) / `https://hospitalapi.codevertexafrica.com` (prod) |
| `NEXT_PUBLIC_AUTH_URL` | auth-api / SSO base (also used for tenant branding lookups) | `https://sso.codevertexafrica.com` |
| `NEXT_PUBLIC_SSO_CLIENT_ID` | OIDC client id registered with auth-api | `hospital-ui` |
| `NEXT_PUBLIC_TENANT_SLUG` | optional default tenant used by the `/` redirect | `codevertex-demo` |

> Never commit secrets — use env / deploy secrets and placeholders in tracked files.

## Auth flow

PKCE against auth-api, mirroring the pattern used by `library-ui`/`pos-ui`:

1. `/{orgSlug}/login` — a plain "Sign in with SSO" button. No PIN backend exists yet on
   hospital-api, so this scaffold skips the PIN/kiosk login pattern used by the retail/library
   frontends and goes straight to SSO.
2. `/{orgSlug}/auth/callback` — exchanges the authorization code for tokens, then calls
   `GET /api/v1/{tenant}/hospital/auth/me` to sync local RBAC. That endpoint doesn't exist on
   hospital-api yet (Sprint-0) — a 404 there falls back gracefully to auth-api's own `/auth/me`
   so the app still authenticates instead of crashing. See `src/lib/auth/api.ts`.
3. `/{orgSlug}/dashboard` — the authenticated app shell (sidebar + header) with placeholder stat
   cards (Patients Today, Beds Occupied, Pending Lab Results, Today's Revenue). No data wiring —
   hospital-api has no domain endpoints yet.

## Project layout

```
src/app/[orgSlug]/…      login, auth/callback, unauthorized, dashboard
src/lib/api/client.ts    shared apiClient (axios + tenant headers + 401/403/402/5xx handling)
src/lib/api/tenant.ts    tenant branding lookup (auth-api)
src/lib/auth/*           PKCE helpers, SSO token exchange, token refresh
src/store/auth.ts        Zustand auth store (persisted session)
src/providers/           AuthProvider, BrandingProvider
src/components/          sidebar, header, theme toggle, ui/* (Card, Button, Badge, ConfirmDialog…)
```

## Deploy

`Dockerfile` mirrors the other Codevertex frontends (multi-stage, Next standalone output,
`NEXT_PUBLIC_*` build args). Intended deploy target: `https://hospital.codevertexafrica.com`
talking to `https://hospitalapi.codevertexafrica.com`.
