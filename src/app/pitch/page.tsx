import { LandingFooter } from '@/components/landing/landing-footer';
import { LandingNav } from '@/components/landing/landing-nav';
import { PricingTeaser } from '@/components/landing/pricing-teaser';
import { ComplianceSection } from '@/components/pitch/compliance-section';
import { GrowthPath } from '@/components/pitch/growth-path';
import { MarketPosition } from '@/components/pitch/market-position';
import { ModulesIncluded } from '@/components/pitch/modules-included';
import { PatientJourneyDiagram } from '@/components/pitch/patient-journey-diagram';
import { PitchCta } from '@/components/pitch/pitch-cta';
import { PitchHero } from '@/components/pitch/pitch-hero';
import { ProofSection } from '@/components/pitch/proof-section';
import { UseCaseDiagram } from '@/components/pitch/use-case-diagram';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Codevertex Afya, Hospital Management Pitch',
  description:
    'How Codevertex Afya works, module by module: the patient journey, who uses what, Kenya\'s SHA/DHA/ODPC compliance landscape, competitive positioning, pricing and next steps.',
};

/**
 * General sales pitch page, built to work for any prospective facility, not one specific client.
 * Distinct from the "/" marketing homepage: this page goes deeper on the patient-journey
 * mechanics, the use-case breakdown, and the 2026 Kenyan compliance landscape than the homepage
 * does, so sales can send this URL to any prospective client deciding whether to move forward.
 */
export default function PitchPage() {
  return (
    <div className="min-h-dvh flex flex-col bg-background">
      <LandingNav />
      <main className="flex-1">
        <PitchHero />
        <ModulesIncluded />
        <PatientJourneyDiagram />
        <UseCaseDiagram />
        <ComplianceSection />
        <ProofSection />
        <MarketPosition />
        <GrowthPath />
        <PricingTeaser />
        <PitchCta />
      </main>
      <LandingFooter />
    </div>
  );
}
