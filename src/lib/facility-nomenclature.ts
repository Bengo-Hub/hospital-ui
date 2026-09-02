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
import { useOutletStore } from '@/store/outlet';

export type FacilityType = 'chemist' | 'clinic' | 'facility' | 'hospital';

const FACILITY_TYPES: readonly FacilityType[] = ['chemist', 'clinic', 'facility', 'hospital'];

function isFacilityType(value: unknown): value is FacilityType {
  return typeof value === 'string' && (FACILITY_TYPES as readonly string[]).includes(value);
}

// ── Sidebar module keys ──────────────────────────────────────────────────────────
//
// One key per entry in sidebar.tsx's NAV_ITEMS. 'dashboard' and 'appointments' are NOT
// facility-type-gated (see ALWAYS_VISIBLE below) — they're still listed here so the sidebar can
// do a single `visible.has(item.module)` filter instead of special-casing ungated items.
// 'inpatient' (Sprint 6, shipped 2026-09-02) IS gated — hidden for Chemist (no Patient/Visit to
// admit at all), visible Clinic and up. 'theatre'/'icu' (Sprint 7, shipped 2026-09-02) are gated
// Hospital-tier ONLY (subscriptions-api's plans_hospital.go grants `theatre_module` — which both
// share, see FeatureTheatreModule's own comment in hospital-api — exclusively at that tier) — the
// first modules that need a facility-tier distinction narrower than "Clinic and above".
export type NavModuleKey =
  | 'dashboard'
  | 'patients'
  | 'appointments'
  | 'inpatient'
  | 'laboratory'
  | 'pharmacy'
  | 'billing'
  | 'theatre'
  | 'icu'
  | 'assets'
  | 'users'
  | 'config';

// 'appointments' has NEITHER a backend handler NOR a frontend page yet (Sprint 10-ish) — stays
// visible-but-comingSoon at EVERY facility type, not gated by facilityModulesFor. 'users'/
// 'config' (2026-08-30) are baseline tenant administration, not a clinical workflow — every
// facility tier needs staff role management and a config view regardless of size, so they're
// ungated by facility type too (RBAC permission alone decides visibility for these).
const ALWAYS_VISIBLE: NavModuleKey[] = ['dashboard', 'appointments', 'users', 'config'];

// Chemist/dispensary: walk-in OTC sale + dispense-against-external-prescription only — no
// OPD reception/triage/consultation/lab/inpatient workflow at all (hospClinicalCore vs
// hospChemistCore in subscriptions-api's plans_hospital.go: a chemist never gets
// patient_records/triage/consultation/lab_requests_basic/inpatient_module features, only
// pharmacy_dispensing + billing) — a chemist has no Patient/Visit to admit in the first place.
const CHEMIST_MODULES: NavModuleKey[] = [...ALWAYS_VISIBLE, 'pharmacy', 'billing'];

// Clinic and above: full OPD workflow (registration/reception/triage/consultation, unified
// under the "Patients" nav item) plus lab requests (referred-out at Clinic tier, in-house from
// Facility tier via the in_house_lab/diagnosis_lab_catalogues features) plus pharmacy/billing,
// plus inpatient (Sprint 6, shipped 2026-09-02 — Clinic tier only has it via the paid Inpatient
// add-on, gated by subscriptions-api's inpatient_module feature at the ROUTE level regardless of
// this nav entry showing; a Clinic tenant without the add-on sees the nav item and gets a real
// "feature not available" response from the backend, same as every other tier-gated module on
// this platform — see docs/ux-ui.md, nav visibility is a presentation concern, licensing is a
// separate gate).
//
// Facility and Hospital tiers add real capabilities on top (in-house lab processing,
// controlled-substance register, multi-cashier billing queue, and — Hospital only —
// theatre/maternity/multi-branch/etc.) but most of them have no dedicated sidebar entry yet:
// controlled-substance register / multi-cashier are behavior inside the existing Pharmacy /
// Billing pages, not separate nav items. So Clinic, Facility and Hospital currently resolve to
// the SAME visible nav set — this is intentional, not a bug: extend this list (not collapse it)
// the day a Facility+-only nav entry actually ships.
// 'assets' (2026-09-02, Biomedical Equipment integration brought forward from Sprint 9): visible
// alongside 'inpatient' since equipment linkage (a bed-mounted monitor, etc.) is relevant from the
// same tier inpatient beds exist at, not gated Hospital-only like Theatre/ICU below.
const CLINIC_AND_ABOVE_MODULES: NavModuleKey[] = [...ALWAYS_VISIBLE, 'patients', 'laboratory', 'pharmacy', 'billing', 'inpatient', 'assets'];

// Hospital tier only (Sprint 7, shipped 2026-09-02): Theatre/OT scheduling + ICU critical-care
// monitoring, gated by subscriptions-api's real plan matrix (`theatre_module` is granted
// exclusively at the Hospital tier — see plans_hospital.go). The first module set narrower than
// "Clinic and above" — extend this list (not collapse it) the day another Hospital-only nav entry
// ships (Blood Bank, Ambulance, Specialized Programmes, per the roadmap).
const HOSPITAL_ONLY_MODULES: NavModuleKey[] = [...CLINIC_AND_ABOVE_MODULES, 'theatre', 'icu'];

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
      return CLINIC_AND_ABOVE_MODULES;
    case 'hospital':
      return HOSPITAL_ONLY_MODULES;
    default:
      // Fail open to the full superset — matches useFacilityType()'s own "never wrongly COLLAPSE
      // a real hospital tenant's sidebar" fallback for an unresolved facility type.
      return HOSPITAL_ONLY_MODULES;
  }
}

/**
 * Resolves the CURRENTLY SELECTED OUTLET's facility type first (matches pos-ui/inventory-ui's
 * own convention exactly — `use-module-access.ts`/`sidebar.tsx` there resolve nav from
 * `outlet?.use_case`, never a subscription lookup) — this is what makes a chemist outlet and a
 * hospital outlet under the SAME tenant show genuinely different nav, and what lets a demo/
 * exempt tenant preview a real tier with zero subscription-plan involvement at all (2026-09-02,
 * see `hospital-chemist-pharmacy-remediation-2026-09-02.md`'s Phase L — this replaced an
 * earlier, tenant-wide subscription-derived resolution that couldn't do either of those
 * things). Falls back to the subscription's own `facilityType` (a real paying single-outlet
 * tenant may only have set it at the plan level, never the outlet level) and finally to
 * 'hospital' (the full superset of built modules) — consistent with the fleet's "fail open"
 * philosophy: a slow/failed/unresolved lookup must never wrongly COLLAPSE a real hospital
 * tenant's sidebar.
 *
 * Deliberately does NOT special-case `isPlatformOwner`/`isExempt` — those bypass FEATURE/
 * LICENSING gating only (`hasFeature`/`needsSubscription`/`isActive` in useSubscription), a
 * presentation concern like "which facility tier's nav to show" is not the same thing.
 * Matches pos-ui/inventory-ui's own convention: platform-owner status bypasses per-module
 * visibility toggles, never which outlet/tenant's real data is shown.
 */
export function useFacilityType(): FacilityType {
  const { info } = useSubscription();
  const selectedOutlet = useOutletStore((s) => s.selectedOutlet);
  if (isFacilityType(selectedOutlet?.facility_type)) return selectedOutlet.facility_type;
  return isFacilityType(info?.facilityType) ? info.facilityType : 'hospital';
}
