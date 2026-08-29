'use client';

import { useState } from 'react';
import { Check, ChevronDown, Copy } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DemoAccount {
  label: string;
  email: string;
  password: string;
}

interface DemoGroup {
  key: string;
  title: string;
  description: string;
  accounts: DemoAccount[];
}

// codevertex-demo is ONE shared tenant (per this platform's own convention — every use case is
// an outlet under the same tenant, never a separate demo tenant per facility size), so every
// account below sees the same subscription/facility-tier resolution today. Grouped here by ROLE
// PERSONA — which real-world facility size that role is most representative of — not by an
// actual separate subscription tier. Seeded in auth-api's cmd/seed/seed_users.go (demoStaff);
// verified working (HTTP 200 against /auth/login) 2026-08-29.
const DEMO_GROUPS: DemoGroup[] = [
  {
    key: 'chemist',
    title: 'Afya Chemist — standalone pharmacy',
    description: 'Dispensing + controlled-substance register only, no reception/consultation workflow.',
    accounts: [{ label: 'Pharmacist', email: 'pharmacist.afya@demo.codevertexafrica.com', password: 'DemoStaff2024!' }],
  },
  {
    key: 'clinic',
    title: 'Afya Clinic / Facility / Hospital — full clinical team',
    description: 'Reception, triage, consultation, lab, pharmacy and billing, end to end.',
    accounts: [
      { label: 'Doctor', email: 'doctor@demo.codevertexafrica.com', password: 'DemoStaff2024!' },
      { label: 'Nurse', email: 'nurse@demo.codevertexafrica.com', password: 'DemoStaff2024!' },
      { label: 'Records clerk', email: 'records@demo.codevertexafrica.com', password: 'DemoStaff2024!' },
      { label: 'Clinic manager', email: 'mgr.hospital@demo.codevertexafrica.com', password: 'DemoStaff2024!' },
    ],
  },
  {
    key: 'admin',
    title: 'Tenant administrator',
    description: 'Full access across every module and facility tier.',
    accounts: [{ label: 'Admin', email: 'admin@demo.codevertexafrica.com', password: 'DemoAdmin2024!' }],
  },
];

function CopyField({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(value);
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        } catch {
          /* clipboard unavailable — no-op, the value is still visible/selectable */
        }
      }}
      className="group inline-flex items-center gap-1.5 rounded-md bg-muted px-2 py-1 font-mono text-[11px] text-foreground hover:bg-accent transition-colors"
      title="Copy"
    >
      <span className="truncate max-w-[180px]">{value}</span>
      {copied ? <Check className="h-3 w-3 text-green-600 shrink-0" /> : <Copy className="h-3 w-3 text-muted-foreground shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />}
    </button>
  );
}

/** Demo-tenant credential reference, grouped by facility-tier persona (see DEMO_GROUPS' own
 *  comment for what "grouped" actually means here). Every field is copy-to-clipboard. Collapsed
 *  by default so it doesn't compete with the actual sign-in form for attention. */
export function DemoCredentials() {
  const [openKey, setOpenKey] = useState<string | null>('clinic');

  return (
    <div className="rounded-2xl border border-border bg-card overflow-hidden">
      <div className="px-4 py-3 border-b border-border bg-muted/40">
        <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Try the demo</p>
        <p className="mt-0.5 text-[13px] text-muted-foreground">
          Sign in as any of these roles on the <span className="font-medium text-foreground">codevertex-demo</span> tenant.
        </p>
      </div>
      <div className="divide-y divide-border">
        {DEMO_GROUPS.map((group) => {
          const open = openKey === group.key;
          return (
            <div key={group.key}>
              <button
                type="button"
                onClick={() => setOpenKey(open ? null : group.key)}
                className="w-full flex items-center justify-between gap-3 px-4 py-3 text-left hover:bg-accent/50 transition-colors"
                aria-expanded={open}
              >
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-foreground truncate">{group.title}</p>
                  <p className="text-xs text-muted-foreground truncate">{group.description}</p>
                </div>
                <ChevronDown className={cn('h-4 w-4 shrink-0 text-muted-foreground transition-transform', open && 'rotate-180')} />
              </button>
              {open && (
                <div className="px-4 pb-3.5 space-y-2">
                  {group.accounts.map((acc) => (
                    <div key={acc.email} className="flex flex-wrap items-center gap-1.5 rounded-lg bg-background/60 border border-border/70 px-2.5 py-2">
                      <span className="text-[11px] font-semibold text-muted-foreground w-full sm:w-auto sm:min-w-[92px]">
                        {acc.label}
                      </span>
                      <CopyField value={acc.email} />
                      <CopyField value={acc.password} />
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
