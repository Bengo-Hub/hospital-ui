'use client';

import { useState } from 'react';
import { Banknote, CreditCard } from 'lucide-react';
import { Card, Button } from '@/components/ui/base';
import { Can } from '@/components/auth/can';
import { cn } from '@/lib/utils';
import { P } from '@/lib/rbac/permissions';
import { useAccountByAdmission, useCollectCharge } from '@/hooks/useBilling';
import { CollectPaymentDialog } from '@/components/billing/collect-payment-dialog';
import type { BillableCharge } from '@/lib/api/billing';

/** Admission's own running-ledger widget — mirrors VisitChargesPanel exactly (same "pending
 * charges" list + inline Collect action), backed by the admission-scoped account (Sprint 6) that
 * every department's charge accrues onto for the length of the stay, instead of the visit's OPD
 * account. See docs/architecture.md "Distributed Billing & Patient Accounts". Renders nothing
 * while loading, on error, or once the account has zero charges. */
export function AdmissionChargesPanel({ admissionId, className }: { admissionId: string; className?: string }) {
  const { data, isLoading, isError } = useAccountByAdmission(admissionId);
  const collect = useCollectCharge();
  const [collectCharge, setCollectCharge] = useState<BillableCharge | null>(null);

  if (isLoading || isError) return null;

  const charges = data?.charges ?? [];
  if (charges.length === 0) return null;

  const pending = charges.filter((c) => c.status === 'pending' || c.status === 'invoiced');
  const total = pending.reduce((sum, c) => sum + c.amount, 0);

  return (
    <Card className={cn(pending.length > 0 ? 'border-amber-400/30 bg-amber-500/5' : undefined, className)}>
      <div className="px-4 py-3 border-b border-border flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <Banknote className="h-4 w-4 text-muted-foreground shrink-0" />
          <h3 className="text-xs font-bold uppercase tracking-wide text-muted-foreground truncate">Admission Account</h3>
        </div>
        {pending.length > 0 && <span className="text-xs font-semibold text-amber-700 dark:text-amber-400 shrink-0">{total.toFixed(2)} due</span>}
      </div>
      <div className="divide-y divide-border">
        {charges.map((c) => (
          <div key={c.id} className="flex items-center justify-between gap-3 px-4 py-2.5">
            <div className="min-w-0">
              <p className="text-sm font-medium truncate">{c.description}</p>
              <p className="text-xs text-muted-foreground mt-0.5 capitalize">
                {c.source_module} · {c.status.replace('_', ' ')}
              </p>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <span className="text-sm font-semibold">{c.amount.toFixed(2)}</span>
              {(c.status === 'pending' || c.status === 'invoiced') && (
                <Can permission={[P.BILLING_COLLECT_OWN, P.BILLING_COLLECT_ANY]}>
                  <Button size="sm" className="gap-1.5" onClick={() => setCollectCharge(c)}>
                    <CreditCard className="h-3.5 w-3.5" />
                    Collect
                  </Button>
                </Can>
              )}
            </div>
          </div>
        ))}
      </div>
      {collectCharge && (
        <CollectPaymentDialog
          description={collectCharge.description}
          amount={collectCharge.amount}
          onCollect={(data) => collect.mutateAsync({ chargeId: collectCharge.id, data })}
          onClose={() => setCollectCharge(null)}
        />
      )}
    </Card>
  );
}
