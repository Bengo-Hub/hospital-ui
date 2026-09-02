'use client';

import { useRef, useState } from 'react';
import { Building2, ClipboardCheck, LogIn, Stethoscope } from 'lucide-react';
import {
  PinLoginLayout, PinLoginHeader, PinLoginBrandPanel, type WorkflowStep,
} from '@bengo-hub/shared-ui-lib/pin-login';
import { useBranding } from '@/providers/branding-provider';
import { LoginForm } from '@/components/auth/login-form';
import { PersonaPicker } from '@/components/auth/persona-picker';
import { DemoCredentials } from '@/components/auth/demo-credentials';
import type { DemoAccount } from '@/lib/auth/demo-personas';

const DEMO_SLUG = process.env.NEXT_PUBLIC_TENANT_SLUG || 'codevertex-demo';

const WORKFLOW_STEPS: WorkflowStep[] = [
  { icon: Building2, label: 'Choose facility' },
  { icon: LogIn, label: 'Sign in' },
  { icon: Stethoscope, label: 'Start care' },
];

type Step = 'tier' | 'credentials';

/** The platform-standard PIN-login SHELL (PinLoginLayout/Header/BrandPanel — the same
 * @bengo-hub/shared-ui-lib/pin-login components pos-ui's outlet+PIN flow uses), adapted for
 * hospital-ui's email+password login: the PIN keypad step is replaced with LoginForm, and the
 * outlet-grid step is replaced with PersonaPicker (demo tenant only) — picking a persona
 * pre-fills the credentials step instead of switching outlets, since which real facility
 * tier/nav a login lands on is resolved from the account's own outlet, not chosen here (see
 * lib/facility-nomenclature.ts's useFacilityType).
 *
 * Shared between root `/` and `/[orgSlug]/login` so both stay visually identical — see each
 * page's own file for the thin wrapper (metadata/redirect-if-authenticated) around this. */
export function TenantSignIn({ orgSlug }: { orgSlug?: string }) {
  const effectiveOrgSlug = orgSlug || DEMO_SLUG;
  const isDemoTenant = effectiveOrgSlug.toLowerCase() === DEMO_SLUG.toLowerCase();
  const { tenant } = useBranding();
  const tenantName = tenant?.orgName ?? tenant?.name ?? 'Codevertex Afya';

  const [step, setStep] = useState<Step>(isDemoTenant ? 'tier' : 'credentials');
  const [picked, setPicked] = useState<DemoAccount | null>(null);
  const cardScrollRef = useRef<HTMLDivElement>(null);

  // DemoCredentials sits BELOW the sign-in form, so picking a non-primary persona from it (the
  // tier picker only one-click-fills each group's FIRST account) would silently fill the email
  // field off-screen above the fold — real reported confusion 2026-09-02 ("the login form does
  // not show the email field"). Scroll back to the top of the card on every pick so the filled
  // form is immediately visible.
  function handleDemoSelect(account: DemoAccount) {
    setPicked(account);
    cardScrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  }

  const header = (
    <PinLoginHeader
      serviceName="Codevertex Afya"
      tenantName={tenantName}
      outletName={
        step === 'tier'
          ? 'Choose what to explore'
          : picked
            ? `Demo — ${picked.label}`
            : undefined
      }
      showSwitchOutlet={isDemoTenant && step === 'credentials'}
      onSwitchOutlet={() => setStep('tier')}
    />
  );

  const brandPanel = (
    <PinLoginBrandPanel tenantName={tenantName} tenantLogoUrl={tenant?.logoUrl} workflowSteps={WORKFLOW_STEPS} />
  );

  if (step === 'tier') {
    return (
      <PinLoginLayout
        backdropUrl="/illustrations/login-hero.svg"
        header={header}
        brandPanel={brandPanel}
        card={
          <div className="flex-1 min-h-0 flex flex-col p-4 sm:p-8 overflow-y-auto justify-center">
            <div className="max-w-2xl w-full mx-auto space-y-5">
              <div className="text-center space-y-1">
                <ClipboardCheck className="h-8 w-8 text-brand-primary mx-auto" />
                <h2 className="text-lg font-bold text-foreground">Pick a facility to explore</h2>
                <p className="text-sm text-muted-foreground">Each one is a real, fully working demo — the layout and workflow adapt to it.</p>
              </div>
              <PersonaPicker
                onSelect={(account) => {
                  setPicked(account);
                  setStep('credentials');
                }}
              />
              <button
                type="button"
                onClick={() => setStep('credentials')}
                className="w-full text-center text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                Or sign in with your own account
              </button>
            </div>
          </div>
        }
      />
    );
  }

  return (
    <PinLoginLayout
      backdropUrl="/illustrations/login-hero.svg"
      header={header}
      brandPanel={brandPanel}
      card={
        <div ref={cardScrollRef} className="flex-1 min-h-0 flex flex-col gap-5 p-4 sm:p-8 overflow-y-auto justify-center">
          <div className="w-full max-w-sm mx-auto space-y-5">
            <div>
              <h1 className="text-xl font-black tracking-tight text-foreground">Sign in to {tenantName}</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                {picked ? `Demo credentials for ${picked.label} are pre-filled — edit if you'd rather use your own.` : 'Enter your account credentials to continue.'}
              </p>
            </div>
            <LoginForm
              key={picked?.email ?? 'blank'}
              orgSlug={effectiveOrgSlug}
              defaultEmail={picked?.email}
              defaultPassword={picked?.password}
            />
            {isDemoTenant && <DemoCredentials onSelect={handleDemoSelect} />}
          </div>
        </div>
      }
    />
  );
}
