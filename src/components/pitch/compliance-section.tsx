const REGULATORS = [
  { x: 30, name: 'SHA', line1: 'Can you bill SHIF', line2: 'Taifa Care HMIS integration' },
  { x: 320, name: 'DHA', line1: 'Is the software certified', line2: 'Digital Health Act 2023' },
  { x: 610, name: 'ODPC', line1: 'Is the facility registered', line2: 'Data Protection Act' },
];

export function ComplianceSection() {
  return (
    <section id="trust" className="py-16 sm:py-24 px-4 sm:px-6 lg:px-8 bg-background">
      <div className="max-w-7xl mx-auto">
        <div className="max-w-2xl mb-10 sm:mb-14">
          <p className="text-xs font-bold uppercase tracking-widest text-brand-primary mb-3">
            The part most vendors gloss over
          </p>
          <h2 className="text-3xl sm:text-4xl font-black text-foreground tracking-tight leading-tight">
            Three regulators, three clocks.
          </h2>
          <p className="mt-3 text-muted-foreground text-base leading-relaxed">
            It is easy to lump &quot;Kenya health compliance&quot; into one bucket. It is not one
            thing. Getting a facility fully live means clearing three separate obligations, from
            three separate bodies, each with its own paperwork and its own deadline.
          </p>
        </div>

        <figure className="rounded-2xl border border-border bg-card shadow-sm p-4 sm:p-8 overflow-x-auto">
          <svg
            viewBox="0 0 900 300"
            role="img"
            aria-label="Diagram of three separate Kenyan health-data regulators: SHA governs whether a facility can bill the national insurance scheme, DHA governs whether the software itself is legally certified to exchange health data, and ODPC governs whether the facility is registered to handle sensitive personal data. Codevertex Afya is built to track all three."
            className="w-full min-w-175 text-foreground"
          >
            <defs>
              <marker id="cr-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
                <polygon points="0,0 10,5 0,10" className="fill-brand-emphasis" />
              </marker>
            </defs>

            {REGULATORS.map((r) => (
              <g key={r.name}>
                <rect x={r.x} y="20" width="260" height="110" rx="12" className="fill-background stroke-border" strokeWidth="1.5" />
                <text x={r.x + 20} y="48" fontWeight="800" fontSize="15" className="fill-brand-emphasis">{r.name}</text>
                <text x={r.x + 20} y="68" fontSize="12.5" className="fill-muted-foreground">{r.line1}</text>
                <text x={r.x + 20} y="86" fontSize="12.5" className="fill-muted-foreground">{r.line2}</text>
              </g>
            ))}

            <path d="M150,130 Q150,170 380,198" fill="none" strokeWidth="2" className="stroke-brand-emphasis" markerEnd="url(#cr-arrow)" />
            <path d="M450,130 L450,198" fill="none" strokeWidth="2" className="stroke-brand-emphasis" markerEnd="url(#cr-arrow)" />
            <path d="M740,130 Q740,170 520,198" fill="none" strokeWidth="2" className="stroke-brand-emphasis" markerEnd="url(#cr-arrow)" />

            <rect x="120" y="200" width="660" height="70" rx="12" className="fill-brand-emphasis" />
            <text x="450" y="230" textAnchor="middle" fontWeight="800" fontSize="14" className="fill-brand-contrast">
              Codevertex Afya
            </text>
            <text x="450" y="250" textAnchor="middle" fontSize="12.5" className="fill-brand-contrast/80">
              One architecture, built for all three
            </text>
          </svg>
        </figure>

        <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-6">
          <p className="text-sm text-muted-foreground leading-relaxed">
            <span className="font-bold text-foreground">What is already true, honestly stated:</span>{' '}
            Codevertex Afya is designed around a single audit trail, consent capture at
            registration, and Kenya-based cloud hosting, the same posture both regulators ask for.
            We will not tell you we hold a certification that does not exist yet. No HMIS vendor we
            could verify publicly holds one at the time of writing.
          </p>
          <p className="text-sm text-muted-foreground leading-relaxed">
            <span className="font-bold text-foreground">What that means for your timeline:</span>{' '}
            we phase a facility&apos;s go-live deliberately rather than rushing a single big-bang
            cutover. Kenya&apos;s own large digital-health rollouts this year are a visible reminder
            of what a rushed launch costs a facility in downtime and trust.
          </p>
        </div>
      </div>
    </section>
  );
}
