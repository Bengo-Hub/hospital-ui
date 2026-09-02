/**
 * Codevertex Afya (hospital-service) permission constants.
 * Format: hospital.{module}.{action}
 * Mirrors hospital-api's rbac package: internal/modules/rbac/{permissions.go,seed.go}
 */

// Full module list — kept in sync with hospital-api's rbac/permissions.go.
export const MODULES = [
  'consultation', 'triage', 'lab', 'pharmacy', 'billing', 'inpatient',
  'records', 'reception', 'theatre', 'users', 'config',
] as const;

export const P = {
  // Consultation
  CONSULTATION_VIEW: 'hospital.consultation.view',
  CONSULTATION_ADD: 'hospital.consultation.add',
  CONSULTATION_CHANGE: 'hospital.consultation.change',
  CONSULTATION_MANAGE: 'hospital.consultation.manage',

  // Triage
  TRIAGE_VIEW: 'hospital.triage.view',
  TRIAGE_ADD: 'hospital.triage.add',
  TRIAGE_CHANGE: 'hospital.triage.change',
  TRIAGE_MANAGE: 'hospital.triage.manage',

  // Lab (lab requests + results)
  LAB_VIEW: 'hospital.lab.view',
  LAB_ADD: 'hospital.lab.add',
  LAB_CHANGE: 'hospital.lab.change',
  LAB_MANAGE: 'hospital.lab.manage',

  // Pharmacy (prescriptions + dispensing)
  PHARMACY_VIEW: 'hospital.pharmacy.view',
  PHARMACY_PRESCRIBE: 'hospital.pharmacy.prescribe',
  PHARMACY_DISPENSE: 'hospital.pharmacy.dispense',
  PHARMACY_MANAGE: 'hospital.pharmacy.manage',

  // Billing
  BILLING_VIEW: 'hospital.billing.view',
  BILLING_ADD: 'hospital.billing.add',
  BILLING_CHANGE: 'hospital.billing.change',
  BILLING_MANAGE: 'hospital.billing.manage',
  /** A department may collect payment for a charge IT created (see docs/architecture.md
   *  "Distributed Billing & Patient Accounts"). */
  BILLING_COLLECT_OWN: 'hospital.billing.collect_own',
  /** The Billing desk's universal fallback across every department/patient. */
  BILLING_COLLECT_ANY: 'hospital.billing.collect_any',
  /** Release a patient/body with an outstanding balance — audited escape hatch, requires a reason. */
  BILLING_OVERRIDE_SETTLEMENT: 'hospital.billing.override_settlement',
  /** Create/edit/deactivate BillableItemCatalog rows (the tenant price list). */
  BILLING_MANAGE_CATALOG: 'hospital.billing.manage_catalog',

  // Inpatient (admissions, wards, discharge)
  INPATIENT_VIEW: 'hospital.inpatient.view',
  INPATIENT_ADD: 'hospital.inpatient.add',
  INPATIENT_CHANGE: 'hospital.inpatient.change',
  INPATIENT_MANAGE: 'hospital.inpatient.manage',

  // Records (patient records + reception/registration)
  RECORDS_VIEW: 'hospital.records.view',
  RECORDS_ADD: 'hospital.records.add',
  RECORDS_CHANGE: 'hospital.records.change',
  RECORDS_MANAGE: 'hospital.records.manage',

  // Reception (front-desk queuing/scheduling)
  RECEPTION_VIEW: 'hospital.reception.view',
  RECEPTION_ADD: 'hospital.reception.add',
  RECEPTION_CHANGE: 'hospital.reception.change',
  RECEPTION_MANAGE: 'hospital.reception.manage',

  // Theatre (surgical scheduling)
  THEATRE_VIEW: 'hospital.theatre.view',
  THEATRE_ADD: 'hospital.theatre.add',
  THEATRE_CHANGE: 'hospital.theatre.change',
  THEATRE_MANAGE: 'hospital.theatre.manage',

  // Users (tenant staff/role management)
  USERS_VIEW: 'hospital.users.view',
  USERS_MANAGE: 'hospital.users.manage',

  // Config (tenant hospital settings)
  CONFIG_VIEW: 'hospital.config.view',
  CONFIG_MANAGE: 'hospital.config.manage',
} as const;

export type Permission = (typeof P)[keyof typeof P];

/**
 * Roles treated as tenant/platform superuser — bypass every permission check. Single source
 * of truth for both `useAppPermissions` and `lib/auth/api.ts`'s `isSuperUser` derivation;
 * those two used to maintain independent copies of this list and drifted (the auth/api.ts
 * copy was missing 'admin', hospital-api's actual RoleAdmin wildcard role) — the same class
 * of bug the backend's mapSSORoleToHospital/MapGlobalRolesToServiceRole duplication had.
 * 'manager' is deliberately excluded: hospital-api's RoleManager has broad-but-scoped grants
 * (see ROLE_PERMISSIONS.manager above), not the wildcard `"*"` only RoleAdmin holds.
 */
export const SUPERUSER_ROLES = ['superuser', 'admin', 'hospital_admin', 'super_admin'];

/**
 * Client-side role→permission fallback, keyed by hospital-api role code (`user.roles`).
 * Mirrors pos-ui's `ROLE_PERMISSIONS` map in `src/lib/rbac/permissions.ts` — used ONLY when
 * `/auth/me` returns an empty `permissions[]` for an otherwise-authenticated user
 * (provisioning race, an unmapped SSO role that JIT-assignment missed, etc.). Without this,
 * that situation silently blanks every `Can`-gated control with no visible symptom — the
 * exact class of outage pos-ui's own `usePermissions.ts` documents hitting in production on
 * 2026-07-19 before this fallback existed there.
 *
 * Keep hand-in-sync with hospital-api's `internal/modules/rbac/seed.go` `defaultRoles` —
 * same maintenance burden pos-ui's own map already carries and documents. Wildcard patterns
 * there (e.g. `"hospital.pharmacy.*"`) are expanded here into their literal permission list.
 */
export const ROLE_PERMISSIONS: Record<string, Permission[]> = {
  admin: Object.values(P),
  doctor: [
    P.CONSULTATION_VIEW, P.CONSULTATION_ADD, P.CONSULTATION_CHANGE, P.CONSULTATION_MANAGE,
    P.TRIAGE_VIEW,
    P.LAB_VIEW, P.LAB_ADD,
    P.PHARMACY_VIEW, P.PHARMACY_PRESCRIBE,
    P.RECORDS_VIEW,
    P.INPATIENT_VIEW, P.INPATIENT_CHANGE,
    P.BILLING_COLLECT_OWN,
  ],
  nurse: [
    P.TRIAGE_VIEW, P.TRIAGE_ADD, P.TRIAGE_CHANGE, P.TRIAGE_MANAGE,
    P.INPATIENT_VIEW, P.INPATIENT_CHANGE,
    P.CONSULTATION_VIEW,
    P.RECORDS_VIEW,
    P.BILLING_COLLECT_OWN,
  ],
  pharmacist: [
    P.PHARMACY_VIEW, P.PHARMACY_PRESCRIBE, P.PHARMACY_DISPENSE, P.PHARMACY_MANAGE,
    P.BILLING_VIEW,
    P.BILLING_COLLECT_OWN,
  ],
  lab_technician: [
    P.LAB_VIEW, P.LAB_ADD, P.LAB_CHANGE,
  ],
  records_clerk: [
    P.RECORDS_VIEW, P.RECORDS_ADD, P.RECORDS_CHANGE, P.RECORDS_MANAGE,
    P.RECEPTION_VIEW, P.RECEPTION_ADD, P.RECEPTION_CHANGE, P.RECEPTION_MANAGE,
    P.BILLING_VIEW, P.BILLING_ADD,
    P.BILLING_COLLECT_OWN,
  ],
  cashier: [
    P.BILLING_VIEW, P.BILLING_ADD, P.BILLING_CHANGE,
    P.BILLING_COLLECT_ANY,
    P.BILLING_OVERRIDE_SETTLEMENT,
    P.RECORDS_VIEW,
  ],
  manager: [
    P.CONSULTATION_VIEW,
    P.TRIAGE_VIEW,
    P.LAB_VIEW,
    P.PHARMACY_VIEW,
    P.BILLING_VIEW, P.BILLING_ADD, P.BILLING_CHANGE, P.BILLING_MANAGE,
    P.BILLING_COLLECT_OWN, P.BILLING_COLLECT_ANY, P.BILLING_OVERRIDE_SETTLEMENT, P.BILLING_MANAGE_CATALOG,
    P.RECEPTION_VIEW, P.RECEPTION_ADD, P.RECEPTION_CHANGE, P.RECEPTION_MANAGE,
    P.RECORDS_VIEW, P.RECORDS_CHANGE,
    P.INPATIENT_VIEW, P.INPATIENT_CHANGE,
    P.THEATRE_VIEW,
    P.USERS_VIEW,
    P.CONFIG_VIEW,
  ],
};
