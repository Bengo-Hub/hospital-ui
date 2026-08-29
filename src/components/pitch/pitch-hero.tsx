import { Badge } from '@/components/ui/base';
import { Banknote, ClipboardList, Pill, Stethoscope, Users } from 'lucide-react';

const FIT_FOR = [
  { icon: Users, label: 'Six core roles', detail: 'Administrator, nurse, doctor, lab technician, pharmacist, cashier' },
  { icon: ClipboardList, label: 'Outpatient & inpatient', detail: 'Dispensaries and health centres through sub-county hospitals' },
  { icon: Stethoscope, label: 'Triage through billing', detail: 'Reception, triage, consultation, laboratory, pharmacy, one bill' },
  { icon: Pill, label: 'Grows with you', detail: 'Add inpatient wards, an in-house lab, or a second branch later' },
];

export function PitchHero() {
  return (
    <section className="relative overflow-hidden bg-brand-surface">
      <div className="absolute -top-24 -right-24 w-125 h-125 rounded-full bg-brand-primary/10 blur-[120px] pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 sm:py-20 lg:py-24">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-start">
          <div className="flex flex-col gap-6">
            <span className="inline-flex w-fit items-center gap-2 px-3.5 py-1.5 rounded-full bg-brand-primary/10 border border-brand-primary/20 text-xs font-bold text-brand-emphasis">
              <span className="w-1.5 h-1.5 rounded-full bg-brand-primary" />
              Hospital management software &middot; how it works
            </span>

            <h1 className="text-4xl sm:text-5xl lg:text-[3.25rem] font-black tracking-tight leading-[1.08] text-foreground">
              One patient record. Every department. Built for how a Kenyan clinic actually runs.
            </h1>

            <p className="text-base sm:text-lg text-muted-foreground leading-relaxed max-w-xl">
              Most small and mid-size Kenyan facilities ask for the same core system: reception,
              triage, consultation, laboratory, pharmacy and billing, run by a small team from
              check-in through discharge. This page walks through exactly how Codevertex Afya does
              that, what is already proven in production, and how it keeps a facility ahead of
              Kenya&apos;s 2026 compliance deadlines.
            </p>

            <div className="flex flex-wrap gap-2 pt-1">
              <Badge className="bg-emerald-500/10 text-emerald-700 border-emerald-500/20">
                Afya Clinic + Inpatient
              </Badge>
              <Badge>SHA / SHIF ready</Badge>
              <Badge variant="outline">M-Pesa &amp; KRA eTIMS</Badge>
              <Badge variant="outline">Cloud hosted &middot; Kenya</Badge>
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-card shadow-sm p-6 sm:p-7">
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-4">
              Who this is built for
            </p>
            <dl className="flex flex-col divide-y divide-border">
              {FIT_FOR.map((f) => {
                const Icon = f.icon;
                return (
                  <div key={f.label} className="flex items-start gap-3 py-3">
                    <div className="h-9 w-9 shrink-0 rounded-lg bg-brand-primary/10 text-brand-primary flex items-center justify-center">
                      <Icon className="h-4.5 w-4.5" />
                    </div>
                    <div>
                      <dt className="text-sm font-bold text-brand-emphasis">{f.label}</dt>
                      <dd className="text-sm text-foreground/70 mt-0.5">{f.detail}</dd>
                    </div>
                  </div>
                );
              })}
            </dl>
            <p className="mt-4 text-xs text-muted-foreground leading-relaxed">
              <Banknote className="inline h-3.5 w-3.5 mb-0.5 mr-1 text-brand-primary" />
              This maps to the Afya Clinic package with the Inpatient add-on. See pricing below for
              every tier.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
