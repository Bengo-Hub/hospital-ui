'use client';

import { useState } from 'react';
import { Check, ChevronDown, Copy } from 'lucide-react';
import { cn } from '@/lib/utils';
import { DEMO_PERSONA_GROUPS, type DemoAccount } from '@/lib/auth/demo-personas';

function CopyRow({ value }: { value: string }) {
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
      className="group flex w-full items-center gap-1.5 rounded-md bg-muted px-2 py-1 font-mono text-[11px] text-foreground hover:bg-accent transition-colors"
      title={`Copy ${value}`}
    >
      <span className="truncate text-left">{value}</span>
      {copied ? (
        <Check className="h-3 w-3 text-green-600 shrink-0 ml-auto" />
      ) : (
        <Copy className="h-3 w-3 text-muted-foreground shrink-0 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
      )}
    </button>
  );
}

/** One role's credentials as a single compact, self-contained tile — email and password read as
 *  one linked unit rather than two loose fields. Fixed width so a group's accounts lay out as a
 *  horizontally-scrolling row instead of stacking (and stretching the page) vertically.
 *
 *  Clicking anywhere on the tile fills the sign-in form with this account (same one-click
 *  behavior the tier picker already gives the primary account of each group — every OTHER
 *  account used to be reachable only by copy-pasting each field by hand, real friction reported
 *  live 2026-09-02, worse still when the email field has scrolled out of view above the fold).
 *  The two value rows are real buttons that ALSO copy their own value on click — deliberately NOT
 *  stopPropagation'd, since the two CopyRows visually cover almost the entire tile (the account
 *  label is a thin single line above them) — an earlier version tried to keep "select" and "copy"
 *  as separate, non-overlapping actions via stopPropagation, and that meant nearly every real
 *  click landed on a CopyRow and silently never selected anything. Both firing together (copy +
 *  select) is harmless and matches what someone clicking a value almost certainly wants anyway. */
function AccountCard({ account, onSelect }: { account: DemoAccount; onSelect: (account: DemoAccount) => void }) {
  // A <div role="button"> here, not a real <button> — it wraps two real <button> CopyRows, and
  // <button> cannot nest inside <button> (invalid HTML, breaks hydration). Keyboard-operable via
  // tabIndex + Enter/Space so it's not a click-only interaction.
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onSelect(account)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelect(account);
        }
      }}
      className="w-[168px] shrink-0 rounded-lg border border-border/70 bg-background/60 p-2.5 space-y-1.5 text-left cursor-pointer hover:border-brand-primary/60 hover:bg-background transition-colors"
      title={`Use ${account.label}'s demo credentials`}
    >
      <p className="text-[11px] font-bold text-foreground truncate">{account.label}</p>
      <CopyRow value={account.email} />
      <CopyRow value={account.password} />
    </div>
  );
}

/** Demo-tenant credential reference, grouped by facility-tier persona (see DEMO_PERSONA_GROUPS' own
 *  comment for what "grouped" actually means here). Accounts within a group scroll horizontally
 *  (a fixed max height, never stretches the page) rather than stacking vertically. Collapsed by
 *  default so it doesn't compete with the actual sign-in form for attention.
 *
 *  onSelect fills the sign-in form with the clicked account (see AccountCard) — optional so this
 *  component still renders as a plain copy-reference panel if ever reused somewhere with no form
 *  to fill. */
export function DemoCredentials({ onSelect }: { onSelect?: (account: DemoAccount) => void }) {
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
        {DEMO_PERSONA_GROUPS.map((group) => {
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
                <div className="px-4 pb-3.5">
                  <div className="flex gap-2 overflow-x-auto pb-1 -mx-0.5 px-0.5">
                    {group.accounts.map((acc) => (
                      <AccountCard key={acc.email} account={acc} onSelect={onSelect ?? (() => {})} />
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
