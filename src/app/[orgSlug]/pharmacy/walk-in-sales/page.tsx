'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { CreditCard, Receipt, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import { Card, Button, Badge } from '@/components/ui/base';
import { PageHeader, EmptyState, Skeleton } from '@/components/ui/page';
import { Can } from '@/components/auth/can';
import { P } from '@/lib/rbac/permissions';
import { apiErrorMessage } from '@/lib/api/error-message';
import { useWalkInSales, useWaiveWalkInSale, useCollectWalkInSale } from '@/hooks/usePharmacy';
import { CollectPaymentDialog } from '@/components/billing/collect-payment-dialog';
import type { WalkInSale, WalkInSaleStatus } from '@/lib/api/pharmacy';

const STATUS_LABELS: Record<WalkInSaleStatus, string> = {
  pending: 'Pending',
  paid: 'Paid',
  waived: 'Waived',
};

const STATUS_BADGE_VARIANT: Record<WalkInSaleStatus, 'default' | 'success' | 'warning' | 'error' | 'outline'> = {
  pending: 'warning',
  paid: 'success',
  waived: 'outline',
};

const STATUS_OPTIONS: { value: WalkInSaleStatus | ''; label: string }[] = [
  { value: '', label: 'All Statuses' },
  ...(Object.keys(STATUS_LABELS) as WalkInSaleStatus[]).map((s) => ({ value: s, label: STATUS_LABELS[s] })),
];

/** Chemist tier's "Today's Sales" list — the collect queue for WalkInSale rows a nil-patient/
 * nil-visit prescription dispense generates (see pharmacy.Service.Dispense in hospital-api).
 * Distinct from the standalone Billing queue: that page only lists BillableCharge rows and is
 * gated on the cashier-only collect_any permission, while a chemist's own pharmacist typically
 * holds only collect_own and needs to see/collect their own walk-in sales here instead. */
export default function WalkInSalesPage() {
  const params = useParams();
  const orgSlug = params?.orgSlug as string;
  const [statusFilter, setStatusFilter] = useState<WalkInSaleStatus | ''>('pending');
  const { data: sales, isLoading } = useWalkInSales(statusFilter || undefined);
  const collect = useCollectWalkInSale();
  const waive = useWaiveWalkInSale();
  const [collectSale, setCollectSale] = useState<WalkInSale | null>(null);

  const rows = sales ?? [];

  const handleWaive = async (sale: WalkInSale) => {
    if (!confirm(`Waive walk-in sale ${sale.sale_number} (${sale.amount.toFixed(2)})? This cannot be undone.`)) return;
    try {
      await waive.mutateAsync(sale.id);
      toast.success('Walk-in sale waived');
    } catch (e) {
      toast.error(await apiErrorMessage(e, 'Failed to waive walk-in sale'));
    }
  };

  return (
    <div className="max-w-7xl mx-auto">
      <PageHeader
        title="Today's Sales"
        subtitle="Walk-in pharmacy sales — collect or waive"
        icon={<Receipt className="h-5 w-5" />}
      />

      <div className="flex flex-wrap gap-3 mb-5">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as WalkInSaleStatus | '')}
          className="bg-background border border-border rounded-xl py-2 px-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 min-w-[190px]"
        >
          {STATUS_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>

      <Card>
        {isLoading ? (
          <div className="p-6 space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        ) : rows.length === 0 ? (
          <EmptyState
            icon={<Receipt className="h-10 w-10" />}
            title="No walk-in sales found"
            description="Sales appear here when a prescription with no registered patient is dispensed."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-accent/30">
                  <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Sale #</th>
                  <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Rx #</th>
                  <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Patient</th>
                  <th className="text-right px-4 py-3 font-semibold text-muted-foreground">Amount</th>
                  <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Status</th>
                  <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Date</th>
                  <th className="text-right px-4 py-3 font-semibold text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {rows.map((s) => (
                  <tr key={s.id} className="hover:bg-accent/20 transition-colors">
                    <td className="px-4 py-3.5 font-mono font-medium text-xs">{s.sale_number}</td>
                    <td className="px-4 py-3.5 font-mono text-xs text-muted-foreground">
                      <Link href={`/${orgSlug}/pharmacy/${s.prescription_id}`} className="text-primary hover:underline">
                        {s.prescription_number}
                      </Link>
                    </td>
                    <td className="px-4 py-3.5 font-medium">{s.patient_name || '—'}</td>
                    <td className="px-4 py-3.5 text-right font-mono">{s.amount.toFixed(2)}</td>
                    <td className="px-4 py-3.5">
                      <Badge variant={STATUS_BADGE_VARIANT[s.status]}>{STATUS_LABELS[s.status]}</Badge>
                    </td>
                    <td className="px-4 py-3.5 text-muted-foreground">{new Date(s.created_at).toLocaleString()}</td>
                    <td className="px-4 py-3.5 text-right">
                      {s.status === 'pending' && (
                        <div className="flex justify-end gap-2">
                          <Can permission={[P.BILLING_COLLECT_OWN, P.BILLING_COLLECT_ANY]}>
                            <Button size="sm" className="gap-1.5" onClick={() => setCollectSale(s)}>
                              <CreditCard className="h-3.5 w-3.5" />
                              Collect
                            </Button>
                          </Can>
                          <Can permission="hospital.pharmacy.manage">
                            <Button
                              size="sm"
                              variant="outline"
                              className="gap-1.5 text-destructive border-destructive/30 hover:bg-destructive/10"
                              onClick={() => handleWaive(s)}
                              disabled={waive.isPending}
                            >
                              <XCircle className="h-3.5 w-3.5" />
                              Waive
                            </Button>
                          </Can>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {collectSale && (
        <CollectPaymentDialog
          description={`Walk-in sale ${collectSale.sale_number}`}
          amount={collectSale.amount}
          onCollect={(data) => collect.mutateAsync({ saleId: collectSale.id, data })}
          onClose={() => setCollectSale(null)}
        />
      )}
    </div>
  );
}
