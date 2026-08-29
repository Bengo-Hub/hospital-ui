interface Actor {
  cy: number;
  label: string;
}

const ACTORS: Actor[] = [
  { cy: 85, label: 'Administrator' },
  { cy: 203, label: 'Nurse' },
  { cy: 321, label: 'Doctor' },
  { cy: 439, label: 'Lab Technician' },
  { cy: 557, label: 'Pharmacist' },
  { cy: 675, label: 'Cashier' },
];

interface UseCase {
  cx: number;
  cy: number;
  rx: number;
  label: string;
}

const USE_CASES: UseCase[] = [
  { cx: 400, cy: 85, rx: 95, label: 'Manage users' },
  { cx: 680, cy: 85, rx: 100, label: 'View reports' },
  { cx: 400, cy: 203, rx: 108, label: 'Record vitals (triage)' },
  { cx: 400, cy: 321, rx: 95, label: 'Record consultation' },
  { cx: 680, cy: 321, rx: 100, label: 'Refer onward' },
  { cx: 400, cy: 439, rx: 95, label: 'Capture lab results' },
  { cx: 400, cy: 557, rx: 95, label: 'Dispense prescription' },
  { cx: 680, cy: 557, rx: 100, label: 'Check interactions' },
  { cx: 400, cy: 675, rx: 95, label: 'Collect payment' },
];

const ASSOCIATIONS: { x1: number; y1: number; x2: number; y2: number }[] = [
  { x1: 90, y1: 98, x2: 305, y2: 85 },
  { x1: 90, y1: 98, x2: 580, y2: 85 },
  { x1: 90, y1: 216, x2: 292, y2: 203 },
  { x1: 90, y1: 334, x2: 305, y2: 321 },
  { x1: 90, y1: 334, x2: 580, y2: 321 },
  { x1: 90, y1: 452, x2: 305, y2: 439 },
  { x1: 90, y1: 570, x2: 305, y2: 557 },
  { x1: 90, y1: 570, x2: 580, y2: 557 },
  { x1: 90, y1: 688, x2: 305, y2: 675 },
];

function ActorGlyph({ cy }: { cy: number }) {
  return (
    <g className="stroke-brand-emphasis" strokeWidth="2.2" fill="none">
      <circle cx="70" cy={cy} r="13" />
      <line x1="70" y1={cy + 13} x2="70" y2={cy + 47} />
      <line x1="52" y1={cy + 23} x2="88" y2={cy + 23} />
      <line x1="70" y1={cy + 47} x2="55" y2={cy + 73} />
      <line x1="70" y1={cy + 47} x2="85" y2={cy + 73} />
    </g>
  );
}

export function UseCaseDiagram() {
  return (
    <section className="py-16 sm:py-24 px-4 sm:px-6 lg:px-8 bg-brand-surface">
      <div className="max-w-7xl mx-auto">
        <div className="max-w-2xl mb-10 sm:mb-14">
          <p className="text-xs font-bold uppercase tracking-widest text-brand-primary mb-3">Who does what</p>
          <h2 className="text-3xl sm:text-4xl font-black text-foreground tracking-tight leading-tight">
            Six roles, one system.
          </h2>
        </div>

        <figure className="rounded-2xl border border-border bg-card shadow-sm p-4 sm:p-8 overflow-x-auto">
          <svg
            viewBox="0 0 900 800"
            role="img"
            aria-label="Use case diagram showing six actors, Administrator, Nurse, Doctor, Lab Technician, Pharmacist and Cashier, each connected to the Codevertex Afya use cases they perform. The Nurse records triage vitals before the Doctor's consultation."
            className="w-full min-w-150 max-w-2xl mx-auto block text-foreground"
          >
            <rect x="220" y="20" width="650" height="705" rx="14" className="fill-background stroke-brand-primary" strokeWidth="1.6" />
            <text x="545" y="46" textAnchor="middle" fontWeight="800" fontSize="14" letterSpacing="2" className="fill-brand-emphasis">
              CODEVERTEX AFYA
            </text>

            {ACTORS.map((a) => (
              <ActorGlyph key={a.label} cy={a.cy} />
            ))}
            <g fontWeight="700" fontSize="12.5" textAnchor="middle" className="fill-brand-emphasis">
              {ACTORS.map((a) => (
                <text key={a.label} x="70" y={a.cy + 91}>
                  {a.label}
                </text>
              ))}
            </g>

            <g className="fill-brand-primary/10 stroke-brand-primary" strokeWidth="1.6">
              {USE_CASES.map((u) => (
                <ellipse key={u.label} cx={u.cx} cy={u.cy} rx={u.rx} ry="27" />
              ))}
            </g>
            <g fontSize="12" textAnchor="middle" className="fill-foreground">
              {USE_CASES.map((u) => (
                <text key={u.label} x={u.cx} y={u.cy + 4} fontSize={u.label.length > 18 ? 10.5 : 12}>
                  {u.label}
                </text>
              ))}
            </g>

            <g className="stroke-muted-foreground" strokeWidth="1.4">
              {ASSOCIATIONS.map((l, i) => (
                <line key={i} x1={l.x1} y1={l.y1} x2={l.x2} y2={l.y2} />
              ))}
            </g>
          </svg>
        </figure>
        <p className="mt-3 text-sm text-muted-foreground text-center">
          Vitals and acuity are captured by a nurse before the doctor ever sees the patient, so
          nothing gets asked twice. In a very small team, the same clinician can perform both.
        </p>
      </div>
    </section>
  );
}
