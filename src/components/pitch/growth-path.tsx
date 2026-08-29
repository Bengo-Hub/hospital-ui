import { ArrowRight } from 'lucide-react';

const TIERS = [
  { tag: 'Today', name: 'Afya Clinic + Inpatient', detail: 'Reception, Consultation, referred-out Lab, Pharmacy, Billing, plus ward/bed tracking for short-stay admissions.' },
  { tag: 'When you scale', name: 'Afya Facility', detail: 'Adds an in-house lab with a full test catalogue, full inpatient wards, SHA/SHIF claims automation, and multiple cashiers.' },
  { tag: 'Long-term', name: 'Afya Hospital', detail: 'Adds theatre, ICU, blood bank, ambulance dispatch, specialised programmes, and multi-branch reporting.' },
];

export function GrowthPath() {
  return (
    <section className="py-16 sm:py-24 px-4 sm:px-6 lg:px-8 bg-brand-surface">
      <div className="max-w-7xl mx-auto">
        <div className="max-w-2xl mb-10 sm:mb-14">
          <p className="text-xs font-bold uppercase tracking-widest text-brand-primary mb-3">Room to grow</p>
          <h2 className="text-3xl sm:text-4xl font-black text-foreground tracking-tight leading-tight">
            Upgrade when you&apos;re ready. Nothing gets re-entered.
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-stretch">
          {TIERS.map((t, i) => (
            <div key={t.name} className="relative">
              <div
                className={`h-full rounded-2xl border bg-card p-6 shadow-sm ${i === 0 ? 'border-brand-primary ring-1 ring-brand-primary/20' : 'border-border'}`}
              >
                <p className="text-xs font-bold uppercase tracking-widest text-brand-primary mb-2">{t.tag}</p>
                <h3 className="text-lg font-black text-foreground mb-2">{t.name}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{t.detail}</p>
              </div>
              {i < TIERS.length - 1 && (
                <ArrowRight className="hidden md:block absolute top-1/2 -right-3 -translate-y-1/2 h-6 w-6 text-brand-primary bg-brand-surface rounded-full p-0.5" />
              )}
            </div>
          ))}
        </div>
        <p className="mt-6 text-center text-sm text-muted-foreground">
          The same patient record carries forward at every step. Nothing gets re-entered.
        </p>
      </div>
    </section>
  );
}
