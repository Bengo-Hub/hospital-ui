/** RBAC/identity audit trail — hospital-api's GET /audit-log (role assigned/changed,
 * role created/customized/edited, extra role granted/revoked, user status changed, user
 * invited). View-only; no write path exists or should exist from the frontend. */

import { apiClient } from './client';
import { hospitalBase } from './types';

export interface AuditLogEntry {
  id: string;
  actor_user_id: string;
  actor_email?: string;
  action: string;
  target_type: string;
  target_id: string;
  before?: Record<string, unknown>;
  after?: Record<string, unknown>;
  created_at: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  limit: number;
  page: number;
  hasMore: boolean;
}

export const auditLogApi = {
  list: (orgSlug: string, page = 1, limit = 20) =>
    apiClient.get<PaginatedResponse<AuditLogEntry>>(`${hospitalBase(orgSlug)}/audit-log`, { page, limit }),
};

/** Human-readable label for an audit action code — falls back to a title-cased version of the
 *  raw code for any action not explicitly listed here (keeps this list additive-only). */
export const AUDIT_ACTION_LABELS: Record<string, string> = {
  'role.assigned': 'Changed primary role',
  'role.created': 'Created custom role',
  'role.customized': 'Customized role for this tenant',
  'role.permissions_updated': 'Updated role permissions',
  'role.granted_extra': 'Granted extra role',
  'role.revoked_extra': 'Revoked extra role',
  'user.status_changed': 'Changed user status',
  'user.invited': 'Invited staff member',
};

export function auditActionLabel(action: string): string {
  return AUDIT_ACTION_LABELS[action] ?? action.replace(/[._]/g, ' ');
}
