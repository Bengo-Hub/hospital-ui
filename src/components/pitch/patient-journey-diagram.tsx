export function PatientJourneyDiagram() {
  return (
    <section className="py-16 sm:py-24 px-4 sm:px-6 lg:px-8 bg-background">
      <div className="max-w-7xl mx-auto">
        <div className="max-w-2xl mb-10 sm:mb-14">
          <p className="text-xs font-bold uppercase tracking-widest text-brand-primary mb-3">How it works</p>
          <h2 className="text-3xl sm:text-4xl font-black text-foreground tracking-tight leading-tight">
            Six stops, one record, start to finish.
          </h2>
          <p className="mt-3 text-muted-foreground text-base leading-relaxed">
            This is the same patient, the same visit, moving through reception, triage and
            consultation on to pharmacy and billing. Every stage reads and writes the same chart,
            so nobody re-types what the last person already recorded.
          </p>
        </div>

        <figure className="rounded-2xl border border-border bg-card shadow-sm p-4 sm:p-8 overflow-x-auto">
          <svg
            viewBox="0 0 1020 220"
            role="img"
            aria-label="A patient moves from Reception at check-in, to Triage for vitals and acuity, to a Doctor for consultation, optionally to a Lab Technician if a test is ordered, then to a Pharmacist for dispensing, and finally to a Cashier for payment and discharge. Every stage reads and writes one shared patient record."
            className="w-full min-w-200 text-foreground"
          >
            <defs>
              <marker id="pj-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
                <polygon points="0,0 10,5 0,10" className="fill-brand-emphasis" />
              </marker>
              <marker id="pj-arrow-soft" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                <polygon points="0,0 10,5 0,10" className="fill-muted-foreground" />
              </marker>
              <marker id="pj-arrow-done" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
                <polygon points="0,0 10,5 0,10" className="fill-emerald-600" />
              </marker>
            </defs>

            {/* main path, left to right at y=140 */}
            <line x1="165" y1="140" x2="183" y2="140" strokeWidth="2.5" className="stroke-brand-emphasis" markerEnd="url(#pj-arrow)" />
            <line x1="325" y1="140" x2="343" y2="140" strokeWidth="2.5" className="stroke-brand-emphasis" markerEnd="url(#pj-arrow)" />
            <line x1="485" y1="140" x2="658" y2="140" strokeWidth="2.5" className="stroke-brand-emphasis" markerEnd="url(#pj-arrow)" />
            <line x1="800" y1="140" x2="818" y2="140" strokeWidth="2.5" className="stroke-emerald-600" markerEnd="url(#pj-arrow-done)" />

            {/* optional lab branch, above the main line */}
            <path d="M425,112 Q470,60 512,52" fill="none" strokeWidth="2" strokeDasharray="5 4" className="stroke-muted-foreground" markerEnd="url(#pj-arrow-soft)" />
            <path d="M628,52 Q668,60 683,112" fill="none" strokeWidth="2" strokeDasharray="5 4" className="stroke-muted-foreground" markerEnd="url(#pj-arrow-soft)" />
            <text x="570" y="16" textAnchor="middle" fontSize="11" fontStyle="italic" className="fill-muted-foreground">if a test is ordered</text>

            {/* step boxes */}
            <g>
              <rect x="25" y="112" width="140" height="56" rx="10" className="fill-brand-primary/10 stroke-brand-primary" strokeWidth="1.5" />
              <text x="95" y="136" textAnchor="middle" fontSize="13" fontWeight="700" className="fill-foreground">Reception</text>
              <text x="95" y="154" textAnchor="middle" fontSize="11.5" className="fill-muted-foreground">Check-in</text>
            </g>
            <g>
              <rect x="185" y="112" width="140" height="56" rx="10" className="fill-brand-primary/10 stroke-brand-primary" strokeWidth="1.5" />
              <text x="255" y="136" textAnchor="middle" fontSize="13" fontWeight="700" className="fill-foreground">Triage</text>
              <text x="255" y="154" textAnchor="middle" fontSize="11.5" className="fill-muted-foreground">Vitals &amp; acuity</text>
            </g>
            <g>
              <rect x="345" y="112" width="140" height="56" rx="10" className="fill-brand-primary/10 stroke-brand-primary" strokeWidth="1.5" />
              <text x="415" y="136" textAnchor="middle" fontSize="13" fontWeight="700" className="fill-foreground">Doctor</text>
              <text x="415" y="154" textAnchor="middle" fontSize="11.5" className="fill-muted-foreground">Consultation</text>
            </g>
            <g>
              <rect x="495" y="24" width="150" height="56" rx="10" strokeDasharray="4 3" className="fill-background stroke-muted-foreground" strokeWidth="1.5" />
              <text x="570" y="48" textAnchor="middle" fontSize="13" fontWeight="700" className="fill-foreground">Lab Technician</text>
              <text x="570" y="66" textAnchor="middle" fontSize="11.5" className="fill-muted-foreground">Results</text>
            </g>
            <g>
              <rect x="660" y="112" width="140" height="56" rx="10" className="fill-brand-primary/10 stroke-brand-primary" strokeWidth="1.5" />
              <text x="730" y="136" textAnchor="middle" fontSize="13" fontWeight="700" className="fill-foreground">Pharmacist</text>
              <text x="730" y="154" textAnchor="middle" fontSize="11.5" className="fill-muted-foreground">Dispense</text>
            </g>
            <g>
              <rect x="820" y="112" width="150" height="56" rx="10" className="fill-emerald-500/10 stroke-emerald-600" strokeWidth="1.5" />
              <text x="895" y="136" textAnchor="middle" fontSize="13" fontWeight="700" className="fill-foreground">Cashier</text>
              <text x="895" y="154" textAnchor="middle" fontSize="11.5" className="fill-muted-foreground">Pay &amp; discharge</text>
            </g>

            {/* shared record spine */}
            <rect x="20" y="196" width="980" height="14" rx="7" className="fill-brand-muted" />
            <text x="510" y="206" textAnchor="middle" fontSize="9.5" fontWeight="700" letterSpacing="0.04em" className="fill-brand-emphasis">
              ONE SHARED PATIENT RECORD, EVERY STEP
            </text>
          </svg>
        </figure>
        <p className="mt-3 text-sm text-muted-foreground text-center">
          Triage vitals are captured once and travel with the visit, so the doctor never has to
          re-ask what a nurse already recorded. The solid line is the common path; the dashed line
          is what happens when a test is ordered first.
        </p>
      </div>
    </section>
  );
}
