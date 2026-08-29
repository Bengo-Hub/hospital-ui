import { PoweredByBadge } from '@bengo-hub/shared-ui-lib';
import { Mail, Phone } from 'lucide-react';
import Link from 'next/link';

const PRODUCT_LINKS = [
  { label: 'Features', href: '/about#features' },
  { label: 'Trust & compliance', href: '/about#trust' },
  { label: 'Pricing', href: '/about#pricing' },
  { label: 'Try the demo', href: '/' },
];

export function LandingFooter() {
  return (
    <footer className="bg-brand-emphasis text-brand-contrast">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
          <div className="lg:col-span-2">
            <div className="flex items-center gap-2.5 mb-4">
              <span className="h-9 w-9 rounded-xl bg-white/10 flex items-center justify-center font-black text-sm">
                CA
              </span>
              <span className="text-lg font-black tracking-tight">Codevertex Afya</span>
            </div>
            <p className="text-sm text-brand-contrast/70 leading-relaxed max-w-sm">
              Hospital &amp; clinic management software built for Kenyan health facilities — one
              patient record from reception to discharge, SHA/SHIF and M-Pesa ready from day one.
            </p>
            <div className="flex flex-col gap-2.5 mt-5 text-sm">
              <a
                href="mailto:codevertexitsolutions@gmail.com"
                className="flex items-center gap-2.5 text-brand-contrast/70 hover:text-brand-contrast transition-colors w-fit"
              >
                <Mail className="h-4 w-4 shrink-0" />
                codevertexitsolutions@gmail.com
              </a>
              <a
                href="https://codevertexafrica.com"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2.5 text-brand-contrast/70 hover:text-brand-contrast transition-colors w-fit"
              >
                <Phone className="h-4 w-4 shrink-0" />
                codevertexafrica.com
              </a>
            </div>
          </div>

          <div>
            <h4 className="text-xs font-bold uppercase tracking-widest text-brand-contrast/50 mb-4">Product</h4>
            <ul className="space-y-2.5">
              {PRODUCT_LINKS.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="text-sm text-brand-contrast/75 hover:text-brand-contrast transition-colors">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-bold uppercase tracking-widest text-brand-contrast/50 mb-4">Facility tiers</h4>
            <ul className="space-y-2.5 text-sm text-brand-contrast/75">
              <li>Afya Clinic — dispensaries &amp; health centres</li>
              <li>Afya Facility — sub-county hospitals</li>
              <li>Afya Hospital — county referral &amp; large private</li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-brand-contrast/50">
            © {new Date().getFullYear()} Codevertex Africa Limited. All rights reserved.
          </p>
          <PoweredByBadge layout="row" />
        </div>
      </div>
    </footer>
  );
}
