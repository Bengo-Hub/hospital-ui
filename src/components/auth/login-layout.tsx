import type { ReactNode } from 'react';

interface LoginLayoutProps {
  /** Left panel heading, e.g. "Sign in to Codevertex Afya" or a tenant's own name. */
  title: string;
  subtitle?: string;
  children: ReactNode;
  /** Rendered under the form — e.g. the demo-credentials panel. Kept separate from `children`
   *  so callers can control ordering without threading extra props through the form itself. */
  footerSlot?: ReactNode;
}

/**
 * Two-column auth layout: form (+ optional footer slot) on the left, a healthcare illustration
 * on the right (hidden below lg, matching the platform's established login-page convention —
 * see truload-frontend's LoginPageLayout for the reference pattern this mirrors). Responsive:
 * single-column on mobile/tablet, illustration only appears once there's room for it.
 */
export function LoginLayout({ title, subtitle, children, footerSlot }: LoginLayoutProps) {
  return (
    <div className="flex-1 grid lg:grid-cols-2">
      <div className="flex flex-col items-center justify-center px-4 sm:px-8 py-10 sm:py-14">
        <div className="w-full max-w-sm">
          <div className="mb-7">
            <h1 className="text-2xl font-black tracking-tight text-foreground">{title}</h1>
            {subtitle && <p className="mt-1.5 text-sm text-muted-foreground">{subtitle}</p>}
          </div>
          {children}
          {footerSlot && <div className="mt-8">{footerSlot}</div>}
        </div>
      </div>

      <div className="hidden lg:flex relative items-center justify-center overflow-hidden bg-brand-emphasis">
        <img
          src="/illustrations/login-hero.svg"
          alt=""
          aria-hidden
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="relative z-10 max-w-md px-10 text-center text-brand-contrast">
          <p className="text-lg font-bold leading-snug drop-shadow-sm">
            One patient record, every department — reception to discharge.
          </p>
          <p className="mt-2 text-sm text-brand-contrast/80">
            SHA/SHIF &amp; Taifa Care claims-ready · M-Pesa built in · KRA eTIMS opt-in
          </p>
        </div>
      </div>
    </div>
  );
}
