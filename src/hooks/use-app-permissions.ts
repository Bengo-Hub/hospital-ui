'use client';

/**
 * useAppPermissions — single source of truth for permission checks in hospital-ui.
 *
 * NOTE on provenance: this hook is modeled on pos-ui's `usePermissions` (src/hooks/usePermissions.ts),
 * not on treasury-ui's `use-app-permissions.ts` (which — despite the matching filename — is an
 * unrelated browser-API-permissions helper for Notification/persistent-storage prompts, not RBAC).
 * pos-ui's resolver is the one that actually reads merged roles/permissions the way this hook needs to.
 *
 * Permission resolution order:
 *   1. If hospital-api's /auth/me `permissions[]` (merged RBAC, or the SSO-fallback profile while
 *      hospital-api's local RBAC sync hasn't shipped yet — see src/lib/auth/api.ts) is a NON-EMPTY
 *      array → trust it as-is (server-authoritative).
 *   2. Otherwise (empty or absent — including the pre-first-fetch bootstrap window, a provisioning
 *      race, or an SSO role the JIT mapper doesn't recognise) → derive a default set from role via
 *      the client-side ROLE_PERMISSIONS map (src/lib/rbac/permissions.ts), mirroring hospital-api's
 *      own rbac/seed.go. Same trade-off pos-ui's usePermissions.ts documents and was burned into by
 *      a real 2026-07-19 P0 (waiters locked out fleet-wide when an empty array was treated as
 *      authoritative instead of falling back): a role revoked down to a genuinely empty grant set
 *      won't be reflected until re-auth, but nobody is silently blanked by a transient/unmapped gap.
 *   3. superuser / hospital_admin / platform-owner roles always pass every check.
 *
 * Usage:
 *   const { can, canAny, canAll, isSuperuser } = useAppPermissions();
 *   if (can('hospital.billing.manage')) { ... }
 */

import { useMemo } from 'react';
import { useAuthStore } from '@/store/auth';
import { ROLE_PERMISSIONS, SUPERUSER_ROLES } from '@/lib/rbac/permissions';

export function useAppPermissions() {
  const user = useAuthStore((s) => s.user);

  const effectivePermissions = useMemo<Set<string>>(() => {
    if (!user) return new Set();

    const roles = user.roles ?? [];

    // isSuperUser/isPlatformOwner are checked first because they're the authoritative signal
    // from hospital-api's /auth/me (or the SSO fallback) — they don't depend on exact role-string
    // casing, or on this tenant having locally assigned the caller a matching role.
    if (
      user.isSuperUser === true ||
      user.isPlatformOwner === true ||
      roles.some((r) => SUPERUSER_ROLES.includes(String(r).toLowerCase()))
    ) {
      return new Set(['*']);
    }

    const serverPerms = user.permissions as string[] | undefined;
    if (serverPerms && serverPerms.length > 0) {
      return new Set(serverPerms);
    }

    // Fall back to the client-side role→permission map (see the doc comment above).
    const derived = new Set<string>();
    for (const role of roles) {
      const rolePerms = ROLE_PERMISSIONS[role] ?? [];
      for (const p of rolePerms) derived.add(p);
    }
    return derived;
  }, [user]);

  const isSuperuser = effectivePermissions.has('*');

  /** Check a single permission */
  function can(permission: string): boolean {
    if (isSuperuser) return true;
    return effectivePermissions.has(permission);
  }

  /** True if the user has ANY of the given permissions */
  function canAny(permissions: string[]): boolean {
    if (isSuperuser) return true;
    return permissions.some((p) => effectivePermissions.has(p));
  }

  /** True if the user has ALL of the given permissions */
  function canAll(permissions: string[]): boolean {
    if (isSuperuser) return true;
    return permissions.every((p) => effectivePermissions.has(p));
  }

  return {
    can,
    canAny,
    canAll,
    isSuperuser,
    permissions: effectivePermissions,
    roles: user?.roles ?? [],
  };
}
