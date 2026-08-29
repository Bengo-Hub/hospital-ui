const STATS = [
  { value: '2020', label: 'Codevertex Africa founded, Kisumu HQ' },
  { value: '14+', label: 'SaaS products built and run today' },
  { value: '5+', label: 'years delivering software for African organisations' },
  { value: '1', label: 'connected record, across every module you buy' },
];

export function ProofSection() {
  return (
    <section className="py-16 sm:py-24 px-4 sm:px-6 lg:px-8 bg-brand-surface">
      <div className="max-w-7xl mx-auto">
        <div className="max-w-2xl mb-10 sm:mb-14">
          <p className="text-xs font-bold uppercase tracking-widest text-brand-primary mb-3">Why trust this from us</p>
          <h2 className="text-3xl sm:text-4xl font-black text-foreground tracking-tight leading-tight">
            This is not day-one code.
          </h2>
          <p className="mt-3 text-muted-foreground text-base leading-relaxed">
            The dispensing engine that powers Afya Pharmacy, drug-interaction checks, batch and
            expiry tracking, the controlled-substance dual-witness register, is the same engine
            already dispensing real prescriptions on Codevertex&apos;s platform today.
          </p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 mb-10">
          {STATS.map((s) => (
            <div key={s.label} className="border-l-2 border-brand-primary pl-4">
              <span className="block text-3xl sm:text-4xl font-black text-brand-emphasis tabular-nums">{s.value}</span>
              <span className="block text-xs text-muted-foreground mt-1.5 leading-snug">{s.label}</span>
            </div>
          ))}
        </div>

        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
          <p className="text-sm text-muted-foreground leading-relaxed">
            Codevertex already runs point-of-sale, inventory, accounting, and ERP products in
            production for other Kenyan businesses. Afya is built on the same platform conventions,
            the same authentication, the same audit logging, the same Kenya-hosted infrastructure,
            that those other products already run on. When we say &quot;cloud hosted in Kenya with
            automatic backups&quot;, that is a description of infrastructure we operate today, not
            a promise for later.
          </p>
        </div>
      </div>
    </section>
  );
}
