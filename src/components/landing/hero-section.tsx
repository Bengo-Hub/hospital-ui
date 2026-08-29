import { Button } from '@/components/ui/base';
import { ArrowRight, CheckCircle2 } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

const TRUST_STRIP = [
  'SHA/SHIF & NHIF claims-ready',
  'M-Pesa & card built in',
  'KRA eTIMS opt-in',
];

export function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-brand-surface">
      {/* Soft brand-tinted glow — calm, not a nightclub glow-orb hero; low opacity, large blur. */}
      <div className="absolute -top-24 -right-24 w-125 h-125 rounded-full bg-brand-primary/10 blur-[120px] pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 sm:py-20 lg:py-24">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left: copy */}
          <div className="flex flex-col gap-6">
            <span className="inline-flex w-fit items-center gap-2 px-3.5 py-1.5 rounded-full bg-brand-primary/10 border border-brand-primary/20 text-xs font-bold text-brand-emphasis">
              <span className="w-1.5 h-1.5 rounded-full bg-brand-primary" />
              Hospital &amp; clinic management for Kenya
            </span>

            <h1 className="text-4xl sm:text-5xl lg:text-[3.25rem] font-black tracking-tight leading-[1.08] text-foreground">
              Built around how Kenyan healthcare actually runs.
            </h1>

            <p className="text-base sm:text-lg text-muted-foreground leading-relaxed max-w-xl">
              Your patients pay by M-Pesa, SHA now requires every claim to move through Taifa Care
              HMIS, and the same nurse who takes vitals is often the one who dispenses the drugs.
              Codevertex Afya is built around that — one record for the patient from reception to
              discharge, instead of a paper file and three disconnected registers.
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-1">
              <Link href="/">
                <Button size="lg" className="bg-brand-primary text-brand-contrast hover:bg-brand-emphasis gap-2">
                  Try the Demo <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link href="/">
                <Button size="lg" variant="outline" className="border-brand-primary/30 text-brand-emphasis hover:bg-brand-primary/5">
                  Sign In
                </Button>
              </Link>
            </div>

            <ul className="flex flex-wrap gap-x-6 gap-y-2 pt-2">
              {TRUST_STRIP.map((t) => (
                <li key={t} className="flex items-center gap-2 text-xs sm:text-sm font-semibold text-foreground/70">
                  <CheckCircle2 className="h-4 w-4 text-brand-primary shrink-0" />
                  {t}
                </li>
              ))}
            </ul>
          </div>

          {/* Right: hero photo */}
          <div className="relative">
            <div className="relative aspect-[4/5] sm:aspect-[3/4] lg:aspect-[4/5] rounded-3xl overflow-hidden border border-border/60 shadow-xl shadow-brand-dark/10 bg-card">
              <Image
                src="/images/landing/hero-doctor.jpg"
                alt="A Kenyan clinician in a white coat with a stethoscope, smiling in a clinic setting"
                fill
                priority
                sizes="(max-width: 1024px) 90vw, 45vw"
                className="object-cover"
              />
            </div>
            {/* Floating stat card — restrained, not decorative animation per docs/ux-ui.md */}
            <div className="hidden sm:flex absolute -bottom-6 -left-6 items-center gap-3 rounded-2xl border border-border bg-card px-5 py-4 shadow-lg">
              <div className="h-10 w-10 rounded-xl bg-brand-primary/10 text-brand-primary flex items-center justify-center font-black text-sm">
                1
              </div>
              <div>
                <p className="text-sm font-black text-foreground leading-none">One patient record</p>
                <p className="text-xs text-muted-foreground mt-1">Reception → discharge, every department</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
