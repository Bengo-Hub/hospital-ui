import type { Metadata } from 'next';
import { LandingFooter } from '@/components/landing/landing-footer';
import { LandingNav } from '@/components/landing/landing-nav';
import { TenantSignIn } from '@/components/auth/tenant-sign-in';

export const metadata: Metadata = {
  title: 'Sign in — Codevertex Afya',
  description: 'Sign in to Codevertex Afya, hospital & clinic management software for Kenyan health facilities.',
};

/**
 * Root "/" is the sign-in page — the actual default landing page for returning users (every
 * deep link elsewhere in the app already carries an org slug via /[orgSlug], so this doesn't
 * collide with any tenant traffic). The marketing pitch moved to /about, reachable via
 * LandingNav's own logo/nav links. Defaults to the shared codevertex-demo tenant (TenantSignIn's
 * own default) — see DemoCredentials for real, working demo accounts.
 */
export default function RootLoginPage() {
  return (
    <div className="min-h-dvh flex flex-col bg-background">
      <LandingNav />
      <TenantSignIn />
      <LandingFooter />
    </div>
  );
}
