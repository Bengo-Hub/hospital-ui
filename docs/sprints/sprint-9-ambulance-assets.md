# Hospital UI — Sprint 9: Ambulance Dispatch + Biomedical Equipment Views

**Status:** ⏳ Planned
**Depends on:** `hospital-api` Sprint 9
**Goal:** Ambulance booking UI (thin proxy to logistics-api status) and a read-only Biomedical
Equipment view (proxy to inventory-api's Asset/AssetMaintenance).

## Pages / Components

- `/[orgSlug]/ambulance` — book a dispatch, live status (assigned/en-route/arrived/completed),
  fare display once completed.
- `/[orgSlug]/assets` — "Biomedical Equipment" list (asset tag, category, status, next-maintenance
  date) — read-only, since inventory-api owns the register.

## Definition of Done

- [ ] Ambulance booking creates a real dispatch and reflects status updates.
- [ ] Equipment list renders inventory-api's live asset data with zero local caching beyond the
      standard TanStack Query cache.
- [ ] `pnpm build`/`type-check` clean.

## Next Sprint

Sprint 10 — Specialized programmes + reporting/KHIS export.
