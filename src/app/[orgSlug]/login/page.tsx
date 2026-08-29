'use client';

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth';
import { useBranding } from '@/providers/branding-provider';
import { LoginForm } from '@/components/auth/login-form';
import { LoginLayout } from '@/components/auth/login-layout';
import { DemoCredentials } from '@/components/auth/demo-credentials';

const DEMO_SLUG = process.env.NEXT_PUBLIC_TENANT_SLUG || 'codevertex-demo';

/**
 * Tenant-scoped sign-in — email+password by default, with "Sign in with SSO" as the alternate
 * path (see components/auth/login-form.tsx). Root "/" is the general/demo-tenant entry point;
 * this page is for a deep link into a specific org (e.g. a bookmarked/shared URL). Shows the
 * demo-credentials panel too when orgSlug IS the demo tenant — someone landing directly on
 * /codevertex-demo/login needs the same reference the root page gives, not just root visitors.
 */
export default function LoginPage() {
  const orgSlug = useParams()?.orgSlug as string;
  const router = useRouter();
  const { tenant } = useBranding();
  const status = useAuthStore((s) => s.status);
  const isDemoTenant = orgSlug?.toLowerCase() === DEMO_SLUG.toLowerCase();

  useEffect(() => {
    if (status === 'authenticated') {
      router.replace(`/${orgSlug}/dashboard`);
    }
  }, [status, orgSlug, router]);

  const tenantName = tenant?.orgName ?? tenant?.name ?? 'Codevertex Afya';

  return (
    <div className="min-h-dvh flex flex-col bg-background">
      <LoginLayout
        title={`Sign in to ${tenantName}`}
        subtitle="Enter your account credentials to continue."
        footerSlot={isDemoTenant ? <DemoCredentials /> : undefined}
      >
        <LoginForm orgSlug={orgSlug} />
      </LoginLayout>
    </div>
  );
}
