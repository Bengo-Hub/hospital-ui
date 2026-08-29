import Link from 'next/link';
import type { Metadata } from 'next';
import { LandingFooter } from '@/components/landing/landing-footer';
import { LandingNav } from '@/components/landing/landing-nav';
import { LoginForm } from '@/components/auth/login-form';
import { LoginLayout } from '@/components/auth/login-layout';
import { DemoCredentials } from '@/components/auth/demo-credentials';

const DEMO_SLUG = process.env.NEXT_PUBLIC_TENANT_SLUG || 'codevertex-demo';

export const metadata: Metadata = {
  title: 'Sign in — Codevertex Afya',
  description: 'Sign in to Codevertex Afya, hospital & clinic management software for Kenyan health facilities.',
};

/**
 * Root "/" is the sign-in page — the actual default landing page for returning users (every
 * deep link elsewhere in the app already carries an org slug via /[orgSlug], so this doesn't
 * collide with any tenant traffic). The marketing pitch moved to /about, reachable via
 * LandingNav's own logo/nav links and the "Learn more" link below. Defaults to the shared
 * codevertex-demo tenant — see DemoCredentials for real, working demo accounts.
 */
export default function RootLoginPage() {
  return (
    <div className="min-h-dvh flex flex-col bg-background">
      <LandingNav />
      <LoginLayout
        title="Sign in to Codevertex Afya"
        subtitle="Hospital & clinic management for Kenyan health facilities."
        footerSlot={
          <div className="space-y-6">
            <DemoCredentials />
            <p className="text-center text-xs text-muted-foreground">
              Not signing in to the demo?{' '}
              <Link href="/about" className="font-medium text-brand-primary hover:underline">
                Learn more about Codevertex Afya
              </Link>
            </p>
          </div>
        }
      >
        <LoginForm orgSlug={DEMO_SLUG} />
      </LoginLayout>
      <LandingFooter />
    </div>
  );
}
