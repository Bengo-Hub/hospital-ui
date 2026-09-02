# Hospital UI — Sprint 9: Ambulance Dispatch + Biomedical Equipment Views

**Status:** ⏳ Planned
**Depends on:** `hospital-api` Sprint 9
**Goal:** Ambulance booking UI (thin proxy to logistics-api status) and a read-only Biomedical
Equipment view (proxy to inventory-api's Asset/AssetMaintenance).

## Pages / Components

- `/[orgSlug]/ambulance` — book a dispatch, live status (assigned/en-route/arrived/completed),
  fare display once completed. **Added to the plan 2026-09-02** (see `hospital-api/docs/architecture.md`'s "Referral, Transfer & Ambulance Billing" section and `hospital-api/docs/integrations.md` §2A.1): once a fare is known, the page should show whether it posted onto the patient's own billing account (a `BillableCharge` reference and link into that account) or stayed a standalone charge with no patient account attached, rather than only a flat fare number. A booking arising from an inter-facility referral or transfer (Sprints 2/6, once built) should be reachable from a "Book Ambulance" action on that referral/transfer record, pre-filling pickup location, not only from a fresh form on this page.
- `/[orgSlug]/assets` — "Biomedical Equipment" list (asset tag, category, status, next-maintenance
  date) — read-only, since inventory-api owns the register.

## Definition of Done

- [ ] Ambulance booking creates a real dispatch and reflects status updates.
- [ ] Equipment list renders inventory-api's live asset data with zero local caching beyond the
      standard TanStack Query cache.
- [ ] `pnpm build`/`type-check` clean.

## Next Sprint

Sprint 10 — Specialized programmes + reporting/KHIS export.
