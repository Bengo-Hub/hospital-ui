'use client';

// ── Facility-type-adaptive sidebar scoping ──────────────────────────────────────
//
// Codevertex Afya sells hospital-api at four facility tiers (subscriptions-api's
// cmd/seed/plans_hospital.go): a standalone chemist/dispensary, an OPD clinic, a
// multi-department facility, and a full hospital. Each tier's plan carries a
// `facility_type` hint in its Metadata ("chemist" | "clinic" | "facility" | "hospital"),
// now threaded through subscriptions-api's SubscriptionResult → hospital-ui's
// SubscriptionInfo (see lib/auth/subscription.ts) via the SAME `useSubscription`/
// `SubscriptionGate` mechanism every other Codevertex frontend already uses for
// feature-gating — no new fetch, no new JWT claim (see docs/architecture.md's
// "Standalone-Chemist Mode" + docs/sprints/sprint-4-pharmacy-dispensing.md).
//
// This module is the single source of truth for which sidebar modules a facility type
// sees, mirroring inventory-ui's lib/use-case-nomenclature.ts pattern (nomenclatureFor /
// catalogScopeFor) one level further: facilityModulesFor() drives NAV_ITEMS visibility
// in components/sidebar.tsx directly, per docs/ux-ui.md's "hiding beats disabling" rule —
// a module out of scope for the tenant's facility type is not rendered at all, not shown
// locked.

import { useSubscription } from '@/hooks/use-subscription';

export type FacilityType = 'chemist' | 'clinic' | 'facility' | 'hospital';

const FACILITY_TYPES: readonly FacilityType[] = ['chemist', 'clinic', 'facility', 'hospital'];

function isFacilityType(value: unknown): value is FacilityType {
  return typeof value === 'string' && (FACILITY_TYPES as readonly string[]).includes(value);
}

// ── Sidebar module keys ──────────────────────────────────────────────────────────
//
// One key per entry in sidebar.tsx's NAV_ITEMS. 'dashboard', 'appointments' and
// 'admissions' are NOT facility-type-gated (see facilityModulesFor's comment below) —
// they're still listed here so the sidebar can do a single `visible.has(item.module)`
// filter instead of special-casing ungated items.
export type NavModuleKey =
  | 'dashboard'
  | 'patients'
  | 'appointments'
  | 'admissions'
  | 'laboratory'
  | 'pharmacy'
  | 'billing';

// Sprint 1-5 built the backend for these (hospital-api's Patients/Consultation/Lab/
// Pharmacy/Billing handlers — see internal/http/router/router.go) but hospital-ui has no
// frontend pages behind them yet (Phase 7). 'appointments' and 'admissions' have NEITHER a
// backend handler NOR a frontend page (Sprints 6-10) — per this migration's explicit scope,
// they stay visible-but-comingSoon at EVERY facility type, not gated by facilityModulesFor.
const ALWAYS_VISIBLE: NavModuleKey[] = ['dashboard', 'appointments', 'admissions'];

// Chemist/dispensary: walk-in OTC sale + dispense-against-external-prescription only — no
// OPD reception/triage/consultation/lab workflow at all (hospClinicalCore vs hospChemistCore
// in subscriptions-api's plans_hospital.go: a chemist never gets patient_records/triage/
// consultation/lab_requests_basic features, only pharmacy_dispensing + billing).
const CHEMIST_MODULES: NavModuleKey[] = [...ALWAYS_VISIBLE, 'pharmacy', 'billing'];

// Clinic and above: full OPD workflow (registration/reception/triage/consultation, unified
// under the "Patients" nav item) plus lab requests (referred-out at Clinic tier, in-house from
// Facility tier via the in_house_lab/diagnosis_lab_catalogues features) plus pharmacy/billing.
//
// Facility and Hospital tiers add real capabilities on top (in-house lab processing, inpatient/
// admissions, controlled-substance register, multi-cashier billing queue, and — Hospital only —
// theatre/maternity/multi-branch/etc.) but NONE of them have a dedicated sidebar entry yet:
// Admissions & Beds has no backend handler at any tier (Sprint 6-10, see ALWAYS_VISIBLE above),
// and controlled-substance register / multi-cashier are behavior inside the existing Pharmacy /
// Billing pages, not separate nav items. So Clinic, Facility and Hospital currently resolve to
// the SAME visible nav set — this is intentional, not a bug: extend this list (not collapse it)
// the day a Facility+-only nav entry actually ships.
const CLINIC_AND_ABOVE_MODULES: NavModuleKey[] = [...ALWAYS_VISIBLE, 'patients', 'laboratory', 'pharmacy', 'billing'];

/**
 * Which sidebar modules (by NavModuleKey) are visible for a given facility type. A module NOT
 * in the returned list must be hidden entirely (not rendered, not shown locked) per the
 * "hiding beats disabling" rule — see docs/ux-ui.md § Navigation.
 */
export function facilityModulesFor(facilityType: FacilityType): NavModuleKey[] {
  switch (facilityType) {
    case 'chemist':
      return CHEMIST_MODULES;
    case 'clinic':
    case 'facility':
    case 'hospital':
      return CLINIC_AND_ABOVE_MODULES;
    default:
      return CLINIC_AND_ABOVE_MODULES;
  }
}

/**
 * Resolves the tenant's facility type from the same subscription mechanism as
 * `useSubscription`/`SubscriptionGate` — no separate fetch. Defaults to 'hospital' (the full
 * superset of built modules) for: platform owner / exempt tenants (always fully entitled),
 * a non-Afya or not-yet-resolved plan, and while the subscription lookup is still loading —
 * consistent with useSubscription's own "fail open" philosophy (a slow/failed lookup must
 * never wrongly COLLAPSE a real hospital tenant's sidebar; briefly over-showing modules for an
 * still-resolving chemist tenant is the safer direction of error).
 */
export function useFacilityType(): FacilityType {
  const { info, isPlatformOwner, isExempt } = useSubscription();
  if (isPlatformOwner || isExempt) return 'hospital';
  return isFacilityType(info?.facilityType) ? info.facilityType : 'hospital';
}
