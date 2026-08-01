import { Cloud, CreditCard, Headset, Lock, Receipt, ShieldCheck, type LucideIcon } from 'lucide-react';

interface TrustBadge {
  icon: LucideIcon;
  title: string;
  description: string;
}

const BADGES: TrustBadge[] = [
  {
    icon: ShieldCheck,
    title: 'SHA/SHIF, NHIF & Taifa Care HMIS',
    description: 'Claims-ready and eligibility-checking out of the box — built for the mandatory 2026 transition.',
  },
  {
    icon: Receipt,
    title: 'KRA eTIMS/ETR',
    description: 'Available as an opt-in for facilities that are VAT/ToT-registered, switched on only where it applies.',
  },
  {
    icon: CreditCard,
    title: 'M-Pesa & card',
    description: 'Daraja-integrated payments on the billing side, set up for you from day one.',
  },
  {
    icon: Lock,
    title: 'Kenya DPA-aligned audit trails',
    description: 'Consent capture, retention policy and full audit trails built in for sensitive health data.',
  },
  {
    icon: Cloud,
    title: 'Cloud hosting & backups',
    description: 'Hosted and supported in Kenya, 24/7, with automatic backups.',
  },
  {
    icon: Headset,
    title: 'Free updates & local support',
    description: 'Friendly support from a team that picks up the phone — no offshore ticket queue.',
  },
];

export function TrustBadges() {
  return (
    <section id="trust" className="py-16 sm:py-24 px-4 sm:px-6 lg:px-8 bg-brand-surface">
      <div className="max-w-7xl mx-auto">
        <div className="max-w-2xl mb-10 sm:mb-14">
          <p className="text-xs font-bold uppercase tracking-widest text-brand-primary mb-3">In every plan</p>
          <h2 className="text-3xl sm:text-4xl font-black text-foreground tracking-tight leading-tight">
            Covered on compliance, from the smallest clinic up.
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {BADGES.map((b) => {
            const Icon = b.icon;
            return (
              <div
                key={b.title}
                className="flex items-start gap-4 rounded-2xl border border-border bg-card p-5 shadow-sm"
              >
                <div className="h-10 w-10 shrink-0 rounded-xl bg-brand-primary/10 text-brand-primary flex items-center justify-center">
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-black text-foreground leading-snug">{b.title}</p>
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{b.description}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
