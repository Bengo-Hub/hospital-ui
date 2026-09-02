'use client';

import { useEffect, useRef } from 'react';
import { useAuthStore } from '@/store/auth';
import type { SubscriptionInfo } from '@/lib/auth/subscription';
import { fetchSubscriptionInfo } from '@/lib/auth/subscription';
import { useSubscriptionStore } from '@/store/subscription';

export function useSubscription() {
  const session = useAuthStore((s) => s.session);
  const user = useAuthStore((s) => s.user);
  const status = useAuthStore((s) => s.status);
  const subscriptionInfo = useAuthStore((s) => s.subscriptionInfo);
  const setSubscriptionInfo = useAuthStore((s) => s.setSubscriptionInfo);

  const subStore = useSubscriptionStore();
  // Bounded retry counter for a FAILED subscription lookup (see the fetch effect). Reset per auth.
  const lookupRetries = useRef(0);

  const tenantId = user?.tenant_id ?? null;
  const tenantSlug = user?.tenant_slug ?? null;
  const roles = (user?.roles ?? []).map((r) => String(r).toLowerCase());
  const isSuperuser = roles.includes('superuser') || roles.includes('super_admin') || roles.includes('hospital_admin');
  const isPlatformOwner = !!user?.isPlatformOwner || !!user?.isSuperUser || isSuperuser || tenantSlug === 'codevertex';
  const isServiceCharge = (user as unknown as { billing_mode?: string } | null)?.billing_mode === 'service_charge';
  const isDemo = tenantSlug === 'codevertex-demo';
  const isExempt = isPlatformOwner || isDemo || isServiceCharge;

  // Hydrate store from IDB on auth
  useEffect(() => {
    if (status !== 'authenticated' || !tenantSlug) return;
    useSubscriptionStore.getState().loadFromIDB(tenantSlug);
  }, [status, tenantSlug]);

  // Fetch from API once per session
  useEffect(() => {
    if (status !== 'authenticated' || !session?.accessToken || !user) return;
    if (subscriptionInfo !== undefined) return;
    setSubscriptionInfo(null);

    if (!tenantId) {
      // Genuinely no tenant context (e.g. the public marketing pages) — nothing real to look
      // up, keep the synthetic fully-entitled default.
      const platformRaw = { plan: 'ENTERPRISE', status: 'ACTIVE', features: [], limits: {}, facilityType: 'hospital' };
      setSubscriptionInfo({ status: 'active', planCode: 'enterprise', planName: 'Enterprise', features: [], limits: {}, facilityType: 'hospital' } as unknown as Record<string, unknown>);
      useSubscriptionStore.getState().setFromRaw(platformRaw, tenantSlug ?? '');
      return;
    }
    // Platform owner viewing a real tenant: feature/subscription GATING is already fully
    // bypassed below via the separate `isExempt` boolean (hasFeature/needsSubscription/isActive
    // all read `isExempt` directly, never `info`), so fetching real data here can never re-
    // introduce a restriction. facilityType is a PRESENTATION concern, not a licensing one —
    // hardcoding it to 'hospital' here (the previous behaviour) meant a platform owner could
    // never see a lower-tier tenant's real adaptive nav, which is exactly the class of bug
    // pos-ui/inventory-ui avoid by always resolving nav from the real outlet/tenant regardless
    // of platform-owner status. So platform owners now take the SAME real-lookup path below as
    // everyone else; only the lookup-failure fallback still synthesizes the old enterprise/
    // hospital default, to fail open exactly as before if the API call itself is unreachable.

    // A FAILED lookup (network/5xx/timeout) is NOT the same as "no subscription".
    // fetchSubscriptionInfo returns null ONLY on failure — never collapse that to
    // status:"none", which would trigger the full-page "Subscription Required" lockout for
    // a genuinely-active tenant (e.g. while subscriptions-api is mid-redeploy). Instead FAIL
    // OPEN: keep the last-known-good cached entitlements (so active tenants stay in), else a
    // non-blocking "unknown" status; and retry a few times so it self-heals when the API returns.
    const handleLookupFailure = () => {
      const cached = useSubscriptionStore.getState();
      if (cached.hydrated && cached.status) {
        setSubscriptionInfo({
          status: String(cached.status).toLowerCase(),
          planCode: (cached.plan as string) ?? '',
          planName: '',
          features: cached.features ?? [],
          limits: cached.limits ?? {},
          facilityType: cached.facilityType ?? undefined,
        } as unknown as Record<string, unknown>);
      } else {
        // No cache yet: "unknown" is deliberately NOT "none", so needsSubscription stays false
        // and the tenant is never locked out on a transient lookup failure.
        setSubscriptionInfo({ status: 'unknown', planCode: '', planName: '', features: [], limits: {} } as unknown as Record<string, unknown>);
      }
      if (lookupRetries.current < 4) {
        lookupRetries.current += 1;
        // Re-arm the effect (subscriptionInfo → undefined) after a short delay to re-fetch.
        setTimeout(() => setSubscriptionInfo(undefined as unknown as null), 8000);
      }
    };

    fetchSubscriptionInfo(tenantId, tenantSlug ?? '', session.accessToken)
      .then((info) => {
        if (info === null) {
          handleLookupFailure();
          return;
        }
        lookupRetries.current = 0;
        setSubscriptionInfo(info as unknown as Record<string, unknown>);
        useSubscriptionStore.getState().setFromRaw(
          {
            plan: info.planCode || null,
            status: info.status || null,
            expiresAt: info.currentPeriodEnd ?? info.trialEndsAt ?? null,
            features: info.features,
            limits: info.limits,
            facilityType: info.facilityType ?? null,
          },
          tenantSlug ?? '',
        );
      })
      .catch(() => handleLookupFailure());
  }, [status, session?.accessToken, user, subscriptionInfo, setSubscriptionInfo, tenantId, tenantSlug]);

  // Re-fetch when tab becomes visible (user returned from renewal/billing tab)
  const lastHiddenAt = useRef<number | null>(null);
  useEffect(() => {
    if (typeof document === 'undefined') return;
    const REFRESH_AFTER_MS = 5 * 60 * 1000;
    const onVisibility = () => {
      if (document.visibilityState === 'hidden') { lastHiddenAt.current = Date.now(); return; }
      if (document.visibilityState === 'visible' && lastHiddenAt.current !== null) {
        const awayMs = Date.now() - lastHiddenAt.current;
        lastHiddenAt.current = null;
        if (awayMs >= REFRESH_AFTER_MS && tenantId && tenantSlug && session?.accessToken) {
          fetchSubscriptionInfo(tenantId, tenantSlug, session.accessToken)
            .then((info) => {
              if (!info) return;
              setSubscriptionInfo(info as unknown as Record<string, unknown>);
              useSubscriptionStore.getState().setFromRaw(
                { plan: info.planCode || null, status: info.status || null, expiresAt: info.currentPeriodEnd ?? info.trialEndsAt ?? null, features: info.features, limits: info.limits, facilityType: info.facilityType ?? null },
                tenantSlug,
              );
            })
            .catch(() => {});
        }
      }
    };
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, [tenantId, tenantSlug, session?.accessToken, setSubscriptionInfo]);

  const info = subscriptionInfo as unknown as SubscriptionInfo | null | undefined;
  const subStatus = info?.status ?? null;

  return {
    info,
    status: subStatus,
    plan: info?.planCode ?? null,
    tierOrder: info?.tierOrder ?? null,
    facilityType: info?.facilityType ?? null,
    isActive: subStatus === 'active' || subStatus === 'trial' || isExempt,
    isPastDue: subStatus === 'past_due' || subStatus === 'suspended',
    isExpired: subStatus === 'expired' || subStatus === 'cancelled',
    needsSubscription: subStatus === 'none' && !isExempt,
    isLoading: subscriptionInfo === null || subscriptionInfo === undefined,
    isPlatformOwner,
    isServiceCharge,
    isDemo,
    isExempt,
    hasFeature: (code: string) => isExempt || (info?.features?.includes(code) ?? false),
    getLimit: (key: string) => (isExempt ? Infinity : (info?.limits?.[key] ?? Infinity)),
    store: subStore,
  };
}
