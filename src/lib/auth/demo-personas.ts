/** Single source of truth for the demo tenant's per-facility-tier login personas — used by both
 * the login-time tier picker (which PRE-FILLS these into the credentials form) and
 * DemoCredentials (the copy-to-clipboard reference panel). codevertex-demo is ONE shared tenant
 * (per this platform's own convention — every use case is an outlet under the same tenant,
 * never a separate demo tenant per facility size); which REAL facility tier's nav/layout a demo
 * login actually lands on is resolved from the account's own outlet (see
 * lib/facility-nomenclature.ts's useFacilityType, outlet-scoped as of 2026-09-02) — this list
 * exists purely to pick a working starting persona, not to force a tier itself.
 *
 * Seeded in auth-api's cmd/seed/seed_users.go (demoStaff) / seed_tenants.go (outletsByTenant).
 * pharmacist.chemist@ is scoped to the demo-chemist outlet (facility_type=chemist in its
 * metadata) — this is deliberately NOT pharmacist.afya@, which is scoped to demo-hospital (left
 * unclassified on purpose, so it keeps showing the full tier for sales demos). */

export interface DemoAccount {
  label: string;
  email: string;
  password: string;
}

export interface DemoPersonaGroup {
  key: string;
  title: string;
  description: string;
  accounts: DemoAccount[];
}

export const DEMO_PERSONA_GROUPS: DemoPersonaGroup[] = [
  {
    key: 'chemist',
    title: 'Afya Chemist',
    description: 'Standalone walk-in sale + dispensing, no clinical workflow — a 1-2-person shop.',
    accounts: [{ label: 'Pharmacist', email: 'pharmacist.chemist@demo.codevertexafrica.com', password: 'DemoStaff2024!' }],
  },
  {
    key: 'clinic',
    title: 'Afya Clinic / Facility / Hospital',
    description: 'Full clinical team — reception, triage, consultation, lab, pharmacy and billing.',
    accounts: [
      { label: 'Doctor', email: 'doctor@demo.codevertexafrica.com', password: 'DemoStaff2024!' },
      { label: 'Nurse', email: 'nurse@demo.codevertexafrica.com', password: 'DemoStaff2024!' },
      { label: 'Records clerk', email: 'records@demo.codevertexafrica.com', password: 'DemoStaff2024!' },
      { label: 'Clinic manager', email: 'mgr.hospital@demo.codevertexafrica.com', password: 'DemoStaff2024!' },
    ],
  },
  {
    key: 'admin',
    title: 'Tenant administrator',
    description: 'Full access across every module and facility tier.',
    accounts: [{ label: 'Admin', email: 'admin@demo.codevertexafrica.com', password: 'DemoAdmin2024!' }],
  },
];
