/** Tenant staff/role-management admin surface — hospital-api's Users module.
 * Real user identity/creation stays owned by auth-api (see
 * shared-docs/architecture/cross-service-data-ownership.md); this is scoped to hospital-api's
 * OWN service-level role assignment only (list users, list the global role catalog, change a
 * user's role). */

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
  code: string;
  name: string;
  description?: string;
}

export const usersApi = {
  list: (orgSlug: string) =>
    apiClient.get<{ data: HospitalUserRow[] }>(`${hospitalBase(orgSlug)}/users`).then(unwrapList),

  listRoles: (orgSlug: string) =>
    apiClient.get<{ data: HospitalRoleOption[] }>(`${hospitalBase(orgSlug)}/roles`).then(unwrapList),

  setRole: (orgSlug: string, userId: string, roleCode: string) =>
    apiClient.put(`${hospitalBase(orgSlug)}/users/${userId}/role`, { role_code: roleCode }),
};

export interface HospitalConfig {
  tenant_name: string;
  tenant_slug: string;
  status: string;
  facility_type: string;
  enabled_modules: string[];
  synced_at: string | null;
}

export const configApi = {
  get: (orgSlug: string) => apiClient.get<HospitalConfig>(`${hospitalBase(orgSlug)}/config`),
};
