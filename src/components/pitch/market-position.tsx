const LEVELS = [
  { level: 'Level 2 to 3', type: 'Dispensary, health centre', tier: 'Afya Clinic' },
  { level: 'Level 4', type: 'Sub-county hospital', tier: 'Afya Facility' },
  { level: 'Level 5 to 6', type: 'County or national referral', tier: 'Afya Hospital' },
];

export function MarketPosition() {
  return (
    <section className="py-16 sm:py-24 px-4 sm:px-6 lg:px-8 bg-background">
      <div className="max-w-7xl mx-auto">
        <div className="max-w-2xl mb-10 sm:mb-14">
          <p className="text-xs font-bold uppercase tracking-widest text-brand-primary mb-3">Where this fits in the market</p>
          <h2 className="text-3xl sm:text-4xl font-black text-foreground tracking-tight leading-tight">
            Built for your facility&apos;s size, with room to grow into the next one.
          </h2>
          <p className="mt-3 text-muted-foreground text-base leading-relaxed">
            Kenya&apos;s HMIS market roughly splits into three groups: donor-funded clinical systems
            built for HIV and TB reporting rather than commercial billing, enterprise
            claims-processing and custom builds aimed at large referral hospitals, and a crowded
            field of small-clinic vendors where most now offer M-Pesa but far fewer handle KRA
            eTIMS well. Several of the more visible names in that last group, and nearly all of the
            enterprise players, explicitly target Level 4 hospitals and above. That is not where you
            are today.
          </p>
        </div>

        <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden mb-6">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-brand-emphasis text-brand-contrast">
                <th className="text-left font-bold px-5 py-3">Facility level</th>
                <th className="text-left font-bold px-5 py-3">Type</th>
                <th className="text-left font-bold px-5 py-3">Codevertex Afya tier</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {LEVELS.map((l, i) => (
                <tr key={l.level} className={i % 2 === 1 ? 'bg-accent/5' : ''}>
                  <td className="px-5 py-3.5 font-bold text-brand-emphasis">{l.level}</td>
                  <td className="px-5 py-3.5 text-foreground/80">{l.type}</td>
                  <td className="px-5 py-3.5 text-foreground/80">{l.tier}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
            <p className="text-sm font-bold text-foreground mb-1.5">M-Pesa is table stakes now, not a differentiator</p>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Most Kenya-built competitors at your tier already offer it. Where we&apos;d actually
              win a side-by-side comparison is depth: one invoice that reconciles cash, M-Pesa and
              insurance against the same chart, not three tools bolted together.
            </p>
          </div>
          <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
            <p className="text-sm font-bold text-foreground mb-1.5">KRA eTIMS is a genuine gap in the market</p>
            <p className="text-sm text-muted-foreground leading-relaxed">
              KRA issued over 140,000 compliance notices by early 2026, and from January 2026 it
              validates income and expense declarations against eTIMS data directly. Several
              small-clinic HMIS vendors still have no fiscal-invoicing feature at all. Ours is
              opt-in, switched on exactly where you need it.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
