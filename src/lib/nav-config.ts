// Single source of truth for the hospital-ui sidebar navigation.
//
// Mirrors pos-ui's `lib/pos/nav-config.ts` config/render split (see
// pos-service/pos-ui/src/lib/pos/nav-config.ts): the config here only describes WHAT the sidebar
// can show; components/sidebar.tsx renders it (flat links + collapsible groups) and applies
// facility-type gating via facility-nomenclature.ts's facilityModulesFor().
//
// Unlike pos-ui, hospital-ui has no per-tenant "hide this item" admin UI and no RBAC permission
// gating on individual nav entries yet — the only gating axis today is facility type (module) plus
// the `comingSoon` locked state for modules with no frontend/backend yet. Keep it that simple until
// a real second gating axis (role, subscription feature, etc.) actually shows up here.

import {
  Banknote,
  Bed,
  ClipboardList,
  FileText,
  FlaskConical,
  HeartPulse,
  LayoutDashboard,
  Pill,
  ShieldAlert,
  Stethoscope,
  UserPlus,
  Users,
} from 'lucide-react';
import type { NavModuleKey } from '@/lib/facility-nomenclature';

/** A single link — either a top-level flat entry or one row inside a NavGroup's dropdown. */
export interface NavItem {
  label: string;
  icon: React.ElementType;
  href: string;
  /**
   * Sprint 1-5 built the hospital-api backend for this module but hospital-ui has no frontend page
   * behind it yet. 'appointments'/'admissions' have no backend either (Sprint 6-10) and stay locked
   * at every facility type regardless — see the ALWAYS_VISIBLE comment in facility-nomenclature.ts.
   */
  comingSoon?: boolean;
}

/** A top-level flat nav entry: a single link, gated as a whole by `module`. */
export type NavLinkEntry = NavItem & { module: NavModuleKey };

/**
 * A chained/collapsible sub-module dropdown: one parent module (e.g. "Patients") that expands into
 * several real pages that all belong to the same clinical workflow. The whole group is gated by a
 * single `module` key — none of its `items` need their own separate gating, they all belong to the
 * parent module (facilityModulesFor is a per-module, not per-page, decision).
 */
export interface NavGroup {
  label: string;
  icon: React.ElementType;
  module: NavModuleKey;
  /** If true, this group starts collapsed unless it contains the current route. */
  defaultCollapsed?: boolean;
  items: NavItem[];
}

export type NavEntry = NavLinkEntry | NavGroup;

export function isNavGroup(entry: NavEntry): entry is NavGroup {
  return 'items' in entry;
}

// Every entry hospital-ui could ever show. Which ones actually render for the current tenant is
// decided by facilityModulesFor(useFacilityType()) in components/sidebar.tsx — an entry whose
// `module` is outside that set is hidden entirely (not rendered, not shown locked), per
// docs/ux-ui.md's "hiding beats disabling" rule.
export const NAV_ENTRIES: NavEntry[] = [
  { label: 'Dashboard', icon: LayoutDashboard, href: '/dashboard', module: 'dashboard' },

  // Patients: registration/search, triage vitals capture, and the doctor's consultation queue are
  // three distinct real pages (Phase 7) that all belong to the same OPD reception → clinician
  // workflow — chained under one dropdown instead of three separate top-level items.
  {
    label: 'Patients',
    icon: Users,
    module: 'patients',
    items: [
      { label: 'Register / Search', icon: UserPlus, href: '/patients' },
      { label: 'Triage', icon: HeartPulse, href: '/triage' },
      { label: 'Consultation Queue', icon: Stethoscope, href: '/consultation/queue' },
    ],
  },

  // Only one real page exists behind Laboratory today — a dropdown would be pointless, stays flat.
  { label: 'Laboratory', icon: FlaskConical, href: '/laboratory', module: 'laboratory' },

  // Pharmacy: the prescription list and the controlled-substance audit log are two distinct real
  // pages (Phase 7) under the same dispensing module — chained under one dropdown.
  {
    label: 'Pharmacy',
    icon: Pill,
    module: 'pharmacy',
    defaultCollapsed: true,
    items: [
      { label: 'Prescriptions', icon: FileText, href: '/pharmacy' },
      { label: 'Controlled Substances', icon: ShieldAlert, href: '/pharmacy/controlled-substances' },
    ],
  },

  // Only one real nav destination exists behind Billing today (the cashier queue) — the
  // patient-account-ledger page (/visits/[visitId]/account) has no list to link from yet, so it
  // stays unlinked from the sidebar until a Patients/Visits list can deep-link into it.
  { label: 'Billing', icon: Banknote, href: '/billing/queue', module: 'billing' },

  // Neither backend nor frontend exist yet (Sprint 6-10) — stay flat, locked, ungated (always
  // visible per facility-nomenclature.ts's ALWAYS_VISIBLE).
  { label: 'Appointments', icon: ClipboardList, href: '/appointments', module: 'appointments', comingSoon: true },
  { label: 'Admissions & Beds', icon: Bed, href: '/admissions', module: 'admissions', comingSoon: true },
];
