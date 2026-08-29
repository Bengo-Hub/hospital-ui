import { FeatureGrid } from '@/components/landing/feature-grid';
import { HeroSection } from '@/components/landing/hero-section';
import { LandingFooter } from '@/components/landing/landing-footer';
import { LandingNav } from '@/components/landing/landing-nav';
import { PricingTeaser } from '@/components/landing/pricing-teaser';
import { TrustBadges } from '@/components/landing/trust-badges';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Codevertex Afya — Hospital & Clinic Management for Kenya',
  description:
    'One patient record from reception to discharge. SHA/SHIF, NHIF & Taifa Care HMIS claims-ready, M-Pesa built in, KRA eTIMS opt-in. Built for Kenyan dispensaries, hospitals and clinics.',
};

/**
 * Public marketing page — moved here from "/" so the root route can be the sign-in page instead
 * (every deep link elsewhere in the app already carries an org slug, and returning visitors sign
 * in far more often than they read the pitch). Reached from the login page's "Learn more" link
 * and from LandingNav's own logo/nav, which now point here instead of "/".
 */
export default function AboutPage() {
  return (
    <div className="min-h-dvh flex flex-col bg-background">
      <LandingNav />
      <main className="flex-1">
        <HeroSection />
        <FeatureGrid />
        <TrustBadges />
        <PricingTeaser />
      </main>
      <LandingFooter />
    </div>
  );
}
