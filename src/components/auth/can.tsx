'use client';

import type { ReactNode } from 'react';
import { useAppPermissions } from '@/hooks/use-app-permissions';

interface CanProps {
  /** A single permission code, or an array checked with OR semantics (any match passes). */
  permission: string | string[];
  children: ReactNode;
  fallback?: ReactNode;
}

/** Renders children only if the current user holds the given permission(s). Mirrors pos-ui's
 * `Can` component — the platform's established pattern for gating a single action (a button, a
 * row action) rather than a whole page. Use `useAppPermissions().can()` directly for
 * gates inside event handlers (e.g. disabling a submit action). */
export function Can({ permission, children, fallback = null }: CanProps) {
  const { can, canAny } = useAppPermissions();
  const allowed = Array.isArray(permission) ? canAny(permission) : can(permission);
  return allowed ? <>{children}</> : <>{fallback}</>;
}
