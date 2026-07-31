# Hospital UI — Sprint 8: Blood Bank & Transfusion

**Status:** ⏳ Planned
**Depends on:** `hospital-api` Sprint 8
**Goal:** Donor registry, cross-match request, transfusion recording.

## Pages / Components

- `/[orgSlug]/blood-bank/donors` — donor registry list + registration form.
- `/[orgSlug]/blood-bank/crossmatch` — request list + fulfil-from-lot action (lot picker sourced
  from inventory-api via hospital-api's proxy, same combobox pattern as pharmacy's drug picker).
- `/[orgSlug]/blood-bank/transfusions` — transfusion log.

## Definition of Done

- [ ] Cross-match request → fulfil from a real lot → transfusion recorded, happy path verified.
- [ ] Expiry-nearing blood lots surface a visible warning (reusing the existing low-stock/expiry
      alert UI pattern from inventory-ui/pos-ui, not a new component).
- [ ] `pnpm build`/`type-check` clean.

## Next Sprint

Sprint 9 — Ambulance dispatch + Biomedical Equipment views.
