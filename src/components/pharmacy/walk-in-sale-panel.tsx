'use client';

import { useState } from 'react';
import { Banknote, CreditCard } from 'lucide-react';
import { Card, Button, Badge } from '@/components/ui/base';
import { Can } from '@/components/auth/can';
import { cn } from '@/lib/utils';
import { P } from '@/lib/rbac/permissions';
import { useCollectWalkInSale } from '@/hooks/usePharmacy';
import { CollectPaymentDialog } from '@/components/billing/collect-payment-dialog';
import type { WalkInSale } from '@/lib/api/pharmacy';

/** VisitChargesPanel's Chemist-tier sibling — a nil-patient/nil-visit prescription dispense has
 * no PatientAccount at all, so its charge lives on a WalkInSale row instead of a BillableCharge
 * (see billing.Service.CreateWalkInSale in hospital-api). Renders one row per pending sale on
 * this prescription with a Collect action, same shared CollectPaymentDialog every other
 * point-of-charge surface uses. Renders nothing once there's nothing pending, same as
 * VisitChargesPanel. */
export function WalkInSalePanel({ sales, className }: { sales: WalkInSale[]; className?: string }) {
  const collect = useCollectWalkInSale();
  const [collectSale, setCollectSale] = useState<WalkInSale | null>(null);

  const pending = sales.filter((s) => s.status === 'pending');
  if (pending.length === 0) return null;

  const total = pending.reduce((sum, s) => sum + s.amount, 0);

  return (
    <Card className={cn('border-amber-400/30 bg-amber-500/5', className)}>
      <div className="px-4 py-3 border-b border-amber-400/20 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <Banknote className="h-4 w-4 text-amber-600 shrink-0" />
          <h3 className="text-xs font-bold uppercase tracking-wide text-amber-700 dark:text-amber-400 truncate">
            Walk-in Sale — Payment Due
          </h3>
        </div>
        <span className="text-xs font-semibold text-muted-foreground shrink-0">{total.toFixed(2)} due</span>
      </div>
      <div className="divide-y divide-border">
        {pending.map((s) => (
          <div key={s.id} className="flex items-center justify-between gap-3 px-4 py-2.5">
            <div className="min-w-0">
              <p className="text-sm font-medium truncate flex items-center gap-2">
                <span className="font-mono text-xs text-muted-foreground">{s.sale_number}</span>
                <Badge variant="warning">Pending</Badge>
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">{s.amount.toFixed(2)}</p>
            </div>
            <Can permission={[P.BILLING_COLLECT_OWN, P.BILLING_COLLECT_ANY]}>
              <Button size="sm" className="gap-1.5 shrink-0" onClick={() => setCollectSale(s)}>
                <CreditCard className="h-3.5 w-3.5" />
                Collect
              </Button>
            </Can>
          </div>
        ))}
      </div>
      {collectSale && (
        <CollectPaymentDialog
          description={`Walk-in sale ${collectSale.sale_number}`}
          amount={collectSale.amount}
          onCollect={(data) => collect.mutateAsync({ saleId: collectSale.id, data })}
          onClose={() => setCollectSale(null)}
        />
      )}
    </Card>
  );
}
