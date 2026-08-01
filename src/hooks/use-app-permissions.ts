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
 *   2. Otherwise (empty or absent — including the pre-first-fetch bootstrap window) → no permission
 *      catalog is defined for hospital-api's domain yet (Sprint-0), so the effective set is empty
 *      UNLESS the user is a superuser/platform owner (see 3). Once hospital-api ships a permission
 *      catalog + role→permission map, add the same client-side fallback derivation pos-ui/treasury-ui
 *      use — don't invent one here ahead of the backend contract.
 *   3. superuser / hospital_admin / platform-owner roles always pass every check.
 *
 * Usage:
 *   const { can, canAny, canAll, isSuperuser } = useAppPermissions();
 *   if (can('hospital.billing.manage')) { ... }
 */

import { useMemo } from 'react';
import { useAuthStore } from '@/store/auth';

// Roles treated as tenant/platform superuser — bypass every permission check.
const SUPERUSER_ROLES = ['superuser', 'admin', 'hospital_admin', 'super_admin'];

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

    // No client-side role→permission catalog exists for hospital-api's domain yet — an empty
    // server array means "no additional grants", not "derive from role" (unlike pos-ui, which has
    // a mature ROLE_PERMISSIONS map to fall back to). Module visibility should key off subscription
    // (see docs/ux-ui.md § Navigation) until hospital-api ships its own permission catalog.
    return new Set<string>();
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
