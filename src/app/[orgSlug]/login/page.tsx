'use client';

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Loader2, ShieldCheck } from 'lucide-react';
import { useAuthStore } from '@/store/auth';
import { useBranding } from '@/providers/branding-provider';

/**
 * Plain SSO-redirect login page. hospital-api has no PIN/kiosk backend yet (unlike
 * library-ui/pos-ui's desk-terminal PIN login), so this scaffold goes straight to
 * "Sign in with SSO" — the simplest correct auth entry point for Sprint-0.
 */
export default function LoginPage() {
  const orgSlug = useParams()?.orgSlug as string;
  const router = useRouter();
  const { tenant } = useBranding();
  const status = useAuthStore((s) => s.status);
  const redirectToSSO = useAuthStore((s) => s.redirectToSSO);

  useEffect(() => {
    if (status === 'authenticated') {
      router.replace(`/${orgSlug}/dashboard`);
    }
  }, [status, orgSlug, router]);

  const tenantName = tenant?.orgName ?? tenant?.name ?? 'Codevertex Afya';

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-sm rounded-2xl border border-border bg-card shadow-sm p-8 text-center space-y-6">
        <div className="mx-auto h-14 w-14 rounded-2xl bg-primary/15 text-primary flex items-center justify-center">
          <ShieldCheck className="h-7 w-7" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-foreground">{tenantName}</h1>
          <p className="mt-1 text-sm text-muted-foreground">Sign in with your company account to continue.</p>
        </div>
        <button
          type="button"
          onClick={() => void redirectToSSO(orgSlug, `/${orgSlug}/dashboard`)}
          disabled={status === 'loading'}
          className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-primary text-primary-foreground px-4 py-3 text-sm font-semibold hover:bg-primary/90 transition-colors disabled:opacity-60"
        >
          {status === 'loading' ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
          Sign in with SSO
        </button>
        <p className="text-xs text-muted-foreground">Powered by Codevertex single sign-on.</p>
      </div>
    </div>
  );
}
