/** Shared API envelope + helpers for hospital-api domain modules. Mirrors library-ui's
 * lib/api/types.ts pattern (libBase/normalizePage) — the platform's established convention for
 * a tenant-scoped-path backend, adapted to hospital-api's `{data: T[]}` list envelope. */

export interface Paginated<T> {
  data: T[];
}

/** Build the tenant-scoped hospital base path: /api/v1/{tenant}/hospital. */
export function hospitalBase(orgSlug: string): string {
  return `/api/v1/${orgSlug}/hospital`;
}

/** hospital-api list endpoints always return `{ data: T[] }` (never a bare array). */
export function unwrapList<T>(res: Paginated<T> | T[]): T[] {
  if (Array.isArray(res)) return res;
  return res?.data ?? [];
}
