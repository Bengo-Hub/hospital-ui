'use client';

import { useState } from 'react';
import { Banknote, CreditCard } from 'lucide-react';
import { Card, Button } from '@/components/ui/base';
import { Can } from '@/components/auth/can';
import { cn } from '@/lib/utils';
import { P } from '@/lib/rbac/permissions';
import { useAccountByVisit, useCollectCharge } from '@/hooks/useBilling';
import { CollectPaymentDialog } from '@/components/billing/collect-payment-dialog';
import type { BillableCharge } from '@/lib/api/billing';

/** Compact "pending charges for this visit" widget — the point-of-charge inline collect-payment
 * surface (backlog item C7). Drop this into Triage/Consultation/Lab/Pharmacy/Patients wherever a
 * visitId is already on screen so staff can settle that visit's outstanding charges right there,
 * instead of navigating away to the standalone Billing queue or /visits/[visitId]/account.
 *
 * 'pending' and 'invoiced' are the two ChargeStatus values that mean "awaiting payment" — same
 * filter the Billing queue page and the visit account ledger both use for their own Collect
 * action. Gated on BILLING_COLLECT_OWN (not COLLECT_ANY): this widget lives inside the very
 * department pages whose own charges it lists, which is exactly what "collect a charge YOUR
 * department created" (COLLECT_OWN's own doc comment) describes — mirrors the per-charge
 * "Collect Now" action on the visit account ledger, not the cashier-only Billing queue.
 *
 * Renders nothing while loading, on error, or once there's nothing pending — stays invisible on
 * the common case where nothing is owed yet. */
export function VisitChargesPanel({ visitId, className }: { visitId: string; className?: string }) {
  const { data, isLoading, isError } = useAccountByVisit(visitId);
  const collect = useCollectCharge();
  const [collectCharge, setCollectCharge] = useState<BillableCharge | null>(null);

  if (isLoading || isError) return null;

  const pending = (data?.charges ?? []).filter((c) => c.status === 'pending' || c.status === 'invoiced');
  if (pending.length === 0) return null;

  const total = pending.reduce((sum, c) => sum + c.amount, 0);

  return (
    <Card className={cn('border-amber-400/30 bg-amber-500/5', className)}>
      <div className="px-4 py-3 border-b border-amber-400/20 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <Banknote className="h-4 w-4 text-amber-600 shrink-0" />
          <h3 className="text-xs font-bold uppercase tracking-wide text-amber-700 dark:text-amber-400 truncate">
            Pending Charges for This Visit
          </h3>
        </div>
        <span className="text-xs font-semibold text-muted-foreground shrink-0">{total.toFixed(2)} due</span>
      </div>
      <div className="divide-y divide-border">
        {pending.map((c) => (
          <div key={c.id} className="flex items-center justify-between gap-3 px-4 py-2.5">
            <div className="min-w-0">
              <p className="text-sm font-medium truncate">{c.description}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{c.amount.toFixed(2)}</p>
            </div>
            <Can permission={P.BILLING_COLLECT_OWN}>
              <Button size="sm" className="gap-1.5 shrink-0" onClick={() => setCollectCharge(c)}>
                <CreditCard className="h-3.5 w-3.5" />
                Collect
              </Button>
            </Can>
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
