'use client';

import { Building2, Pill, ShieldCheck, Stethoscope } from 'lucide-react';
import { cn } from '@/lib/utils';
import { DEMO_PERSONA_GROUPS, type DemoAccount } from '@/lib/auth/demo-personas';

const GROUP_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  chemist: Pill,
  clinic: Stethoscope,
  admin: ShieldCheck,
};

/** Login-time tier picker for the demo tenant — mirrors pos-ui's PIN-login outlet-grid step
 * (see pos-ui's [orgSlug]/pin-login/page.tsx), adapted for email+password: picking a card
 * PRE-FILLS the credentials step with that persona's first account (still fully editable), so
 * "which experience do you want to see" is a single click instead of a manual credential
 * lookup. Uses the SAME DEMO_PERSONA_GROUPS list DemoCredentials (the copy-to-clipboard
 * reference panel) reads, so the two can never drift apart. */
export function PersonaPicker({ onSelect }: { onSelect: (account: DemoAccount) => void }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
      {DEMO_PERSONA_GROUPS.map((group, idx) => {
        const Icon = GROUP_ICONS[group.key] ?? Building2;
        const primary = group.accounts[0];
        return (
          <button
            key={group.key}
            type="button"
            onClick={() => onSelect(primary)}
            className={cn(
              'group text-left rounded-2xl border border-border bg-card/80 backdrop-blur-sm p-4',
              'hover:border-brand-primary/60 hover:bg-card transition-all',
              'animate-in fade-in slide-in-from-bottom-2'
            )}
            style={{ animationDelay: `${idx * 60}ms`, animationFillMode: 'backwards' }}
          >
            <div className="h-10 w-10 rounded-xl bg-brand-primary/10 flex items-center justify-center mb-3 group-hover:bg-brand-primary/20 transition-colors">
              <Icon className="h-5 w-5 text-brand-primary" />
            </div>
            <p className="font-bold text-sm text-foreground">{group.title}</p>
            <p className="mt-1 text-xs text-muted-foreground leading-snug">{group.description}</p>
            {group.accounts.length > 1 && (
              <p className="mt-2 text-[11px] font-medium text-brand-primary">Starts as {primary.label} — switch role after signing in</p>
            )}
          </button>
        );
      })}
    </div>
  );
}
