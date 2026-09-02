'use client';

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth';
import { TenantSignIn } from '@/components/auth/tenant-sign-in';

/**
 * Tenant-scoped sign-in — the platform-standard PIN-login shell (TenantSignIn), adapted for
 * email+password. Root "/" is the general/demo-tenant entry point; this page is for a deep link
 * into a specific org (e.g. a bookmarked/shared URL).
 */
export default function LoginPage() {
  const orgSlug = useParams()?.orgSlug as string;
  const router = useRouter();
  const status = useAuthStore((s) => s.status);

  useEffect(() => {
    if (status === 'authenticated') {
      router.replace(`/${orgSlug}/dashboard`);
    }
  }, [status, orgSlug, router]);

  return <TenantSignIn orgSlug={orgSlug} />;
}
