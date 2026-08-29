const MODULES = [
  { name: 'Reception & queuing', detail: 'Registration, check-in, appointment booking, one patient record shared by every department.' },
  { name: 'Triage', detail: 'Vitals (BP, temperature, pulse, respiration, weight) and acuity captured before the doctor queue, so nothing gets asked twice.' },
  { name: 'Consultation', detail: 'Doctor queue, examination notes, diagnosis capture, referral to lab or pharmacy.' },
  { name: 'Laboratory, referred-out', detail: 'Test requests, result capture, delivery back to the requesting doctor.' },
  { name: 'Pharmacy & dispensing', detail: 'Prescription dispensing, OTC sale, batch and expiry tracking, drug-interaction checks.' },
  { name: 'Billing & finance', detail: 'Cashier till, patient invoicing, M-Pesa and card collection, KRA eTIMS opt-in.' },
  { name: 'Inpatient add-on', detail: 'Basic ward and bed tracking for short-stay observation, admission through discharge.' },
];

export function ModulesIncluded() {
  return (
    <section id="pitch-modules" className="py-16 sm:py-24 px-4 sm:px-6 lg:px-8 bg-background">
      <div className="max-w-7xl mx-auto">
        <div className="max-w-2xl mb-10 sm:mb-14">
          <p className="text-xs font-bold uppercase tracking-widest text-brand-primary mb-3">What you&apos;re buying</p>
          <h2 className="text-3xl sm:text-4xl font-black text-foreground tracking-tight leading-tight">
            The Afya Clinic + Inpatient package, module by module.
          </h2>
          <p className="mt-3 text-muted-foreground text-base leading-relaxed">
            This is the Afya Clinic + Inpatient package, the tier most dispensaries and health
            centres start on. Nothing here is aspirational, this is the scope that ships.
          </p>
        </div>

        <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-brand-emphasis text-brand-contrast">
                <th className="text-left font-bold px-5 py-3 w-1/3">Module</th>
                <th className="text-left font-bold px-5 py-3">What it does</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {MODULES.map((m, i) => (
                <tr key={m.name} className={i % 2 === 1 ? 'bg-accent/5' : ''}>
                  <td className="px-5 py-3.5 font-bold text-brand-emphasis align-top">{m.name}</td>
                  <td className="px-5 py-3.5 text-foreground/80 align-top">{m.detail}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p className="mt-5 text-sm text-muted-foreground leading-relaxed">
          <span className="font-bold text-foreground">Built into every tier, not sold separately:</span>{' '}
          SHA/SHIF and NHIF eligibility &amp; claims, cloud hosting with automatic backups, Kenya
          DPA-aligned audit trails and consent capture, and free updates with local support.
        </p>
      </div>
    </section>
  );
}
