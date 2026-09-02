/** Tenant staff/role-management admin surface — hospital-api's Users module.
 * Real user identity/creation stays owned by auth-api (see
 * shared-docs/architecture/cross-service-data-ownership.md); "Invite staff" below relays to
 * auth-api's own S2S member endpoint rather than hospital-api inventing its own identity store —
 * this module otherwise stays scoped to hospital-api's OWN service-level role assignment (list
 * users, list/customize/create roles, change a user's role(s), deactivate/reactivate). */

import { apiClient } from './client';
import { hospitalBase, unwrapList } from './types';

export interface HospitalUserRow {
  id: string;
  email: string;
  name: string;
  status: string;
  roles: string[];
  created_at: string;
}

export interface HospitalRoleOption {
  id: string;
  code: string;
  name: string;
  description?: string;
  is_system_role: boolean;
  is_custom: boolean;
  cloned_from_role_id?: string;
}

export interface HospitalPermissionOption {
  code: string;
  name: string;
  module: string;
  action: string;
}

export interface InviteMemberInput {
  email: string;
  name?: string;
  role_code: string;
  outlet_id?: string;
}

export interface InviteMemberResult {
  auth_user_id: string;
  status?: string;
  /** Returned ONCE when this invite created a brand-new auth-api account — show it to the
   *  admin exactly once, never persist or log it. */
  temp_password?: string;
}

export const usersApi = {
  list: (orgSlug: string) =>
    apiClient.get<{ data: HospitalUserRow[] }>(`${hospitalBase(orgSlug)}/users`).then(unwrapList),

  invite: (orgSlug: string, input: InviteMemberInput) =>
    apiClient.post<{ data: InviteMemberResult }>(`${hospitalBase(orgSlug)}/users/invite`, input).then((r) => r.data),

  setRole: (orgSlug: string, userId: string, roleCode: string) =>
    apiClient.put(`${hospitalBase(orgSlug)}/users/${userId}/role`, { role_code: roleCode }),

  setStatus: (orgSlug: string, userId: string, status: string) =>
    apiClient.put(`${hospitalBase(orgSlug)}/users/${userId}/status`, { status }),

  assignExtraRole: (orgSlug: string, userId: string, roleCode: string) =>
    apiClient.post(`${hospitalBase(orgSlug)}/users/${userId}/roles`, { role_code: roleCode }),

  revokeExtraRole: (orgSlug: string, userId: string, roleCode: string) =>
    apiClient.delete(`${hospitalBase(orgSlug)}/users/${userId}/roles/${encodeURIComponent(roleCode)}`),

  listRoles: (orgSlug: string) =>
    apiClient.get<{ data: HospitalRoleOption[] }>(`${hospitalBase(orgSlug)}/roles`).then(unwrapList),

  listPermissions: (orgSlug: string) =>
    apiClient.get<{ data: HospitalPermissionOption[] }>(`${hospitalBase(orgSlug)}/permissions`).then(unwrapList),

  getRolePermissions: (orgSlug: string, roleId: string) =>
    apiClient.get<{ data: HospitalPermissionOption[] }>(`${hospitalBase(orgSlug)}/roles/${roleId}/permissions`).then(unwrapList),

  customizeRole: (orgSlug: string, roleCode: string) =>
    apiClient.post<{ data: HospitalRoleOption }>(`${hospitalBase(orgSlug)}/roles/customize`, { role_code: roleCode }).then((r) => r.data),

  createRole: (orgSlug: string, input: { role_code: string; name: string; description?: string; permission_codes: string[] }) =>
    apiClient.post<{ data: HospitalRoleOption }>(`${hospitalBase(orgSlug)}/roles`, input).then((r) => r.data),

  updateRolePermissions: (orgSlug: string, roleId: string, permissionCodes: string[]) =>
    apiClient.put(`${hospitalBase(orgSlug)}/roles/${roleId}/permissions`, { permission_codes: permissionCodes }),

  deleteRole: (orgSlug: string, roleId: string) =>
    apiClient.delete(`${hospitalBase(orgSlug)}/roles/${roleId}`),
};

export interface UserOutletAssignment {
  id: string;
  outlet_id: string;
  is_home_outlet: boolean;
  assigned_at: string;
}

export const userOutletsApi = {
  list: (orgSlug: string, userId: string) =>
    apiClient.get<{ data: UserOutletAssignment[] }>(`${hospitalBase(orgSlug)}/users/${userId}/outlets`).then(unwrapList),

  assign: (orgSlug: string, userId: string, outletId: string, isHomeOutlet: boolean) =>
    apiClient.post(`${hospitalBase(orgSlug)}/users/${userId}/outlets`, { outlet_id: outletId, is_home_outlet: isHomeOutlet }),

  remove: (orgSlug: string, userId: string, outletId: string) =>
    apiClient.delete(`${hospitalBase(orgSlug)}/users/${userId}/outlets/${outletId}`),
};

export interface OperatingHoursDay {
  open: string;
  close: string;
  closed?: boolean;
}
export type OperatingHours = Partial<Record<'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun', OperatingHoursDay>>;

export interface HospitalConfigSettings {
  auto_logout_minutes?: number;
  default_landing_view?: string;
  operating_hours?: OperatingHours;
}

export interface HospitalConfig {
  tenant_name: string;
  tenant_slug: string;
  status: string;
  facility_type: string;
  enabled_modules: string[];
  synced_at: string | null;
  settings: HospitalConfigSettings;
}

export const configApi = {
  get: (orgSlug: string) => apiClient.get<HospitalConfig>(`${hospitalBase(orgSlug)}/config`),
  update: (orgSlug: string, updates: HospitalConfigSettings) =>
    apiClient.put<{ settings: HospitalConfigSettings }>(`${hospitalBase(orgSlug)}/config`, updates),
};

export interface HospitalOutlet {
  id: string;
  code: string;
  name: string;
  is_hq: boolean;
  status: string;
  /** Afya facility tier for THIS outlet (chemist|clinic|facility|hospital) — presentation-only,
   *  drives useFacilityType(). Absent for a pre-2026-09-02-synced outlet or one with no tier set. */
  facility_type?: string;
}

/** No permission gate (mirrors /auth/me and /ping) — the outlet switcher needs this list
 *  before any module-specific permission is known, and there's nothing sensitive in it. */
export const outletsApi = {
  list: (orgSlug: string) =>
    apiClient.get<{ data: HospitalOutlet[] }>(`${hospitalBase(orgSlug)}/outlets`).then(unwrapList),
};
