import { Card } from '@/components/ui/base';
import {
  BarChart3,
  Banknote,
  BedDouble,
  ClipboardList,
  FlaskConical,
  HeartPulse,
  Pill,
  ShieldPlus,
  Stethoscope,
  type LucideIcon,
} from 'lucide-react';
import Image from 'next/image';

interface Feature {
  icon: LucideIcon;
  title: string;
  description: string;
}

const FEATURES: Feature[] = [
  {
    icon: ClipboardList,
    title: 'Reception & queuing',
    description: 'Register and queue patients in seconds — no re-keying the same details at every stop.',
  },
  {
    icon: Stethoscope,
    title: 'Consultation & triage',
    description: 'Vitals, history and diagnosis captured once, visible to every department that treats the patient next.',
  },
  {
    icon: Pill,
    title: 'Pharmacy dispensing + OTC sale',
    description: 'Prescription dispensing and walk-in over-the-counter sales from the same stock ledger.',
  },
  {
    icon: Banknote,
    title: 'Billing & cashier',
    description: 'Consultation, lab and pharmacy charges consolidate into one bill, split across M-Pesa, card and cash.',
  },
  {
    icon: FlaskConical,
    title: 'In-house Laboratory',
    description: 'Full test catalogue, sample tracking and results delivered straight back to the clinician.',
  },
  {
    icon: BedDouble,
    title: 'Inpatient management',
    description: 'Ward and bed tracking from admission to discharge, with a live occupancy view.',
  },
  {
    icon: HeartPulse,
    title: 'Theatre, Maternity & Morgue',
    description: 'Purpose-built registers for surgical, maternity and mortuary operations at larger facilities.',
  },
  {
    icon: ShieldPlus,
    title: 'Specialized care programmes',
    description: 'ANC, PNC, ART, TB and Immunization tracking, aligned to MOH reporting requirements.',
  },
  {
    icon: BarChart3,
    title: 'Multi-branch reporting',
    description: 'Consolidated, real-time reporting across every branch for county referral and multi-site groups.',
  },
];

const SHOWCASE = [
  {
    src: '/images/landing/feature-consultation.jpg',
    alt: 'A clinician consulting with a young patient in an exam room',
    title: 'Consultation & triage',
    caption: 'Vitals and diagnosis captured at the point of care, not re-entered later.',
  },
  {
    src: '/images/landing/feature-pharmacy.jpg',
    alt: 'A pharmacy professional in a clinical dispensing setting',
    title: 'Pharmacy dispensing',
    caption: 'Prescriptions dispense straight off the same stock ledger billing reads from.',
  },
  {
    src: '/images/landing/feature-maternity.jpg',
    alt: 'A nurse attending to a patient in a maternity ward setting',
    title: 'Specialized care programmes',
    caption: 'ANC, PNC and inpatient care recorded against the same patient chart.',
  },
];

export function FeatureGrid() {
  return (
    <section id="features" className="py-16 sm:py-24 px-4 sm:px-6 lg:px-8 bg-background">
      <div className="max-w-7xl mx-auto">
        <div className="max-w-2xl mb-10 sm:mb-14">
          <p className="text-xs font-bold uppercase tracking-widest text-brand-primary mb-3">What&apos;s included</p>
          <h2 className="text-3xl sm:text-4xl font-black text-foreground tracking-tight leading-tight">
            Every department, one patient record.
          </h2>
          <p className="mt-3 text-muted-foreground text-base leading-relaxed">
            Move up from a dispensary to a multi-branch hospital group and nothing gets re-entered —
            every module reads and writes the same chart.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {FEATURES.map((f) => {
            const Icon = f.icon;
            return (
              <Card key={f.title} className="p-6 hover:border-brand-primary/30 transition-colors">
                <div className="h-11 w-11 rounded-xl bg-brand-primary/10 text-brand-primary flex items-center justify-center mb-4">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="text-sm font-black text-foreground mb-1.5">{f.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{f.description}</p>
              </Card>
            );
          })}
        </div>

        {/* Photo showcase — real clinical settings backing three of the modules above. */}
        <div className="mt-14 sm:mt-20 grid grid-cols-1 sm:grid-cols-3 gap-4">
          {SHOWCASE.map((s) => (
            <div key={s.title} className="group relative rounded-2xl overflow-hidden border border-border shadow-sm">
              <div className="relative aspect-[4/3]">
                <Image
                  src={s.src}
                  alt={s.alt}
                  fill
                  sizes="(max-width: 768px) 100vw, 33vw"
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-linear-to-t from-black/70 via-black/10 to-transparent" />
              </div>
              <div className="absolute bottom-0 left-0 right-0 p-4">
                <p className="text-white text-sm font-black">{s.title}</p>
                <p className="text-white/75 text-xs mt-1 leading-snug">{s.caption}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
