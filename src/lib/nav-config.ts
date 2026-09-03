// Single source of truth for the hospital-ui sidebar navigation.
//
// Mirrors pos-ui's `lib/pos/nav-config.ts` config/render split (see
// pos-service/pos-ui/src/lib/pos/nav-config.ts): the config here only describes WHAT the sidebar
// can show; components/sidebar.tsx renders it (flat links + collapsible groups) and applies BOTH
// facility-type gating (facility-nomenclature.ts's facilityModulesFor()) and RBAC permission
// gating (each item's optional `permission`, checked via useAppPermissions().canAny()).
//
// Permission gating was added 2026-08-30 to fix a real reported bug: every role at a given
// facility tier saw the identical sidebar (module/facility-type was the ONLY gating axis), so a
// Chemist-tier user saw the same nav regardless of whether they were a Pharmacist, Doctor, or
// Admin persona. An item with no `permission` is visible to anyone whose facility type allows its
// module (Dashboard, and the still-unbuilt Appointments/Admissions placeholders).

import {
  Activity,
  Banknote,
  Bed,
  ClipboardList,
  FileText,
  FlaskConical,
  HeartPulse,
  History,
  LayoutDashboard,
  Pill,
  Scissors,
  Settings,
  Shield,
  ShieldAlert,
  Stethoscope,
  UserPlus,
  Users,
} from 'lucide-react';
import type { NavModuleKey } from '@/lib/facility-nomenclature';
import { P, type Permission } from '@/lib/rbac/permissions';

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
  /**
   * RBAC gate for this specific link, checked with canAny() against the logged-in user's
   * effective permissions (src/hooks/use-app-permissions.ts). Omit for an item any authenticated,
   * facility-eligible user may see (e.g. Dashboard). A NavGroup with zero visible items (every
   * child filtered out) renders nothing at all — see components/sidebar.tsx.
   */
  permission?: Permission | Permission[];
}

/** A top-level flat nav entry: a single link, gated as a whole by `module`. */
export type NavLinkEntry = NavItem & { module: NavModuleKey };

/**
 * A chained/collapsible sub-module dropdown: one parent module (e.g. "Patients") that expands into
 * several real pages that all belong to the same clinical workflow. The GROUP is gated by facility
 * type via a single `module` key (facilityModulesFor is a per-module, not per-page, decision); each
 * individual `item` inside it carries its OWN `permission` since a group can span more than one
 * hospital-api permission module (e.g. Patients spans records/triage/consultation) and different
 * roles should see different subsets of the same group.
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

  // OPD (Outpatient Department): registration/search, triage vitals capture, and the doctor's
  // consultation queue are three distinct real pages that all belong to the same reception →
  // clinician workflow — chained under one dropdown labeled with the real hospital term this
  // codebase's own schema already uses (PatientVisit.visit_type: "OPD"|"IPD") rather than the
  // generic "Patients", which a clinical user couldn't actually locate the OPD workflow under
  // (real user-reported gap, 2026-09-02 — the terminology existed in the data model and every
  // doc, but never surfaced in the sidebar itself).
  {
    label: 'OPD',
    icon: Users,
    module: 'patients',
    items: [
      { label: 'Patient Registration', icon: UserPlus, href: '/patients', permission: P.RECORDS_VIEW },
      { label: 'Triage', icon: HeartPulse, href: '/triage', permission: P.TRIAGE_VIEW },
      { label: 'Consultation Queue', icon: Stethoscope, href: '/consultation/queue', permission: P.CONSULTATION_VIEW },
      // Visits (2026-09-03 completeness-audit gap-fill): the cross-patient, cross-status visit
      // list — closes the gap where 5 of 10 VisitStatus values were never shown anywhere outside
      // a single patient's chart. Also the list Billing's per-visit account page was missing
      // (see that page's own note below) — its rows deep-link into visits/[visitId]/account.
      { label: 'Visits', icon: ClipboardList, href: '/visits', permission: P.RECORDS_VIEW },
      // Diagnosis Catalog (2026-09-03 completeness-audit gap-fill): previously only reachable via
      // the "+ Catalog" button buried inside Consultation's examination form. Catalog requires
      // the stricter MANAGE permission, matching Laboratory's Worklist/Catalog split above and
      // this page's own in-page create gate.
      { label: 'Diagnosis Catalog', icon: Settings, href: '/consultation/diagnosis-catalog', permission: P.CONSULTATION_MANAGE },
    ],
  },

  // Laboratory: the order worklist and the tenant test-catalog admin page (2026-08-30) are two
  // distinct real pages under the same module — chained under one dropdown. Catalog requires the
  // stricter MANAGE permission, matching that page's own in-page gate.
  {
    label: 'Laboratory',
    icon: FlaskConical,
    module: 'laboratory',
    items: [
      { label: 'Worklist', icon: FlaskConical, href: '/laboratory', permission: P.LAB_VIEW },
      { label: 'Test Catalog', icon: Settings, href: '/laboratory/catalog', permission: P.LAB_MANAGE },
    ],
  },

  // Pharmacy: the prescription list and the controlled-substance audit log are two distinct real
  // pages (Phase 7) under the same dispensing module — chained under one dropdown. Controlled
  // Substances requires the stricter MANAGE permission, matching that page's own in-page gate
  // (pharmacy/controlled-substances/page.tsx) — showing the link to someone the page then blocks
  // would be worse than just hiding it.
  {
    label: 'Pharmacy',
    icon: Pill,
    module: 'pharmacy',
    defaultCollapsed: true,
    items: [
      { label: 'Prescriptions', icon: FileText, href: '/pharmacy', permission: P.PHARMACY_VIEW },
      { label: 'Controlled Substances', icon: ShieldAlert, href: '/pharmacy/controlled-substances', permission: P.PHARMACY_MANAGE },
    ],
  },

  // Billing: the cashier "collect any department's charge" queue, plus the item-catalog admin
  // page (2026-08-30). The patient-account-ledger page (/visits/[visitId]/account) is still not
  // a sidebar entry of its own — it's visit-scoped, not something to browse independently — but
  // as of the OPD group's Visits page above (2026-09-03) it's no longer an orphaned route: every
  // visit row there, and every row in a patient's Visit History, deep-links into it. Collect
  // Charges is gated on COLLECT_ANY (not the broader BILLING_VIEW) since that's the one thing
  // that page is for — a department that only collects its OWN charges (collect_own) reaches
  // billing through its own module's pages, not this queue.
  {
    label: 'Billing',
    icon: Banknote,
    module: 'billing',
    items: [
      { label: 'Collect Charges', icon: Banknote, href: '/billing/queue', permission: P.BILLING_COLLECT_ANY },
      { label: 'Item Catalog', icon: Settings, href: '/billing/settings', permission: P.BILLING_MANAGE_CATALOG },
    ],
  },

  // Neither backend nor frontend exist yet — stays flat, locked, ungated (always visible per
  // facility-nomenclature.ts's ALWAYS_VISIBLE).
  { label: 'Appointments', icon: ClipboardList, href: '/appointments', module: 'appointments', comingSoon: true },

  // IPD (Inpatient Department, Sprint 6, shipped 2026-09-02): the occupancy board and the
  // admissions worklist are two distinct real pages under the same module, mirroring Laboratory's
  // Worklist/Catalog split. Labeled with the real hospital term (matches OPD's own naming fix
  // above and PatientVisit.visit_type: "OPD"|"IPD") rather than the generic "Inpatient". Admitting
  // requires INPATIENT_ADD (a doctor/nurse/manager action); the occupancy board is read-only for
  // anyone holding INPATIENT_VIEW.
  {
    label: 'IPD',
    icon: Bed,
    module: 'inpatient',
    items: [
      { label: 'Ward Occupancy', icon: Bed, href: '/wards', permission: P.INPATIENT_VIEW },
      { label: 'Admissions', icon: ClipboardList, href: '/admissions', permission: P.INPATIENT_VIEW },
    ],
  },

  // Theatre/OT scheduling (Sprint 7, shipped 2026-09-02) — Hospital tier only. Booking requires
  // THEATRE_ADD (a doctor/surgeon action); the schedule view is read-only for THEATRE_VIEW.
  {
    label: 'Theatre',
    icon: Scissors,
    href: '/theatre/schedule',
    module: 'theatre',
    permission: P.THEATRE_VIEW,
  },

  // ICU critical-care monitoring (Sprint 7, shipped 2026-09-02) — Hospital tier only, shares
  // Theatre's subscription feature but is a distinct nursing-team-run workflow with its own RBAC.
  {
    label: 'ICU',
    icon: Activity,
    href: '/icu',
    module: 'icu',
    permission: P.ICU_VIEW,
  },

  // Biomedical Equipment (2026-09-02, gap-fill — brought forward from Sprint 9): a read-only
  // proxy over inventory-api's fixed-asset register, linkable to beds/theatre bookings/ICU
  // episodes. Visible wherever Inpatient is (Clinic tier and up), not gated to Hospital tier like
  // Theatre/ICU above. Gated on ANY of the three modules that would plausibly link equipment,
  // matching the backend route's own OR-permission shape.
  {
    label: 'Biomedical Equipment',
    icon: Stethoscope,
    href: '/assets',
    module: 'assets',
    permission: [P.INPATIENT_VIEW, P.THEATRE_VIEW, P.ICU_VIEW],
  },

  // Baseline tenant administration (2026-08-30, expanded same day with role customization/audit
  // log) — available at every facility tier, gated purely by RBAC permission (module is in
  // ALWAYS_VISIBLE, so facilityModulesFor never hides these). Roles requires only USERS_VIEW
  // (read-only for a viewer, matching the page's own in-page edit gate); Audit Log requires the
  // stricter USERS_MANAGE, matching its backend route's gate.
  {
    label: 'Staff & Roles',
    icon: Users,
    module: 'users',
    items: [
      { label: 'Staff', icon: Users, href: '/users', permission: P.USERS_VIEW },
      { label: 'Roles & Permissions', icon: Shield, href: '/roles', permission: P.USERS_VIEW },
      { label: 'Audit Log', icon: History, href: '/audit-log', permission: P.USERS_MANAGE },
    ],
  },
  { label: 'Config', icon: Settings, href: '/config', module: 'config', permission: P.CONFIG_VIEW },
];
