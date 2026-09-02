'use client';

import { useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Banknote, CreditCard } from 'lucide-react';
import { Card, Button, Badge } from '@/components/ui/base';
import { PageHeader, EmptyState, Skeleton } from '@/components/ui/page';
import { Can } from '@/components/auth/can';
import { usePendingCharges, useCollectCharge } from '@/hooks/useBilling';
import { CollectPaymentDialog } from '@/components/billing/collect-payment-dialog';
import type { BillableCharge, ChargeStatus } from '@/lib/api/billing';

const DEPARTMENT_OPTIONS = [
  { value: '', label: 'All Departments' },
  { value: 'records', label: 'Records / Registration' },
  { value: 'triage', label: 'Triage' },
  { value: 'consultation', label: 'Consultation' },
  { value: 'lab', label: 'Laboratory' },
  { value: 'pharmacy', label: 'Pharmacy' },
  { value: 'theatre', label: 'Theatre' },
  { value: 'inpatient', label: 'IPD (Inpatient)' },
  { value: 'mortuary', label: 'Mortuary' },
];

const CHARGE_STATUS_BADGE: Record<ChargeStatus, 'default' | 'success' | 'warning' | 'error' | 'outline'> = {
  pending: 'warning',
  invoiced: 'default',
  paid: 'success',
  exempted: 'success',
  waived: 'outline',
  written_off: 'outline',
};

function ChargeStatusBadge({ status }: { status: ChargeStatus }) {
  return <Badge variant={CHARGE_STATUS_BADGE[status]}>{status.replace('_', ' ')}</Badge>;
}

// Which worklist a charge's source_module cross-links to — coarse (the module's queue, not the
// exact order/prescription: a charge only carries a per-LINE source_reference_id, not the
// parent order's id, so resolving the exact record would need an extra lookup per row).
const SOURCE_MODULE_LINK: Record<string, string> = {
  lab: '/laboratory',
  pharmacy: '/pharmacy',
  triage: '/triage',
  consultation: '/consultation/queue',
  records: '/patients',
};

export default function BillingQueuePage() {
  const params = useParams();
  const orgSlug = params?.orgSlug as string;
  const searchParams = useSearchParams();
  // Pre-filter when arriving via a cross-link (e.g. "View Charges" on a lab order row) —
  // department stays local state after that so the user can freely change the filter.
  const [department, setDepartment] = useState(() => searchParams?.get('department') ?? '');
  const { data: charges, isLoading } = usePendingCharges(department || undefined);
  const collect = useCollectCharge();
  const [collectCharge, setCollectCharge] = useState<BillableCharge | null>(null);

  const rows = charges ?? [];

  return (
    <div className="max-w-6xl mx-auto">
      <PageHeader
        title="Billing Queue"
        subtitle="Pending charges across every department, ready for the cashier to collect"
        icon={<Banknote className="h-5 w-5" />}
      />

      <div className="flex flex-wrap gap-3 mb-5">
        <select
          value={department}
          onChange={(e) => setDepartment(e.target.value)}
          className="bg-background border border-border rounded-xl py-2 px-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 min-w-[200px]"
        >
          {DEPARTMENT_OPTIONS.map((o) => (
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
            icon={<Banknote className="h-10 w-10" />}
            title="No pending charges"
            description="Charges created by any department appear here until they're collected."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-accent/30">
                  <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Description</th>
                  <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Source</th>
                  <th className="text-right px-4 py-3 font-semibold text-muted-foreground">Amount</th>
                  <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Status</th>
                  <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Created</th>
                  <th className="text-right px-4 py-3 font-semibold text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {rows.map((c) => (
                  <tr key={c.id} className="hover:bg-accent/20 transition-colors">
                    <td className="px-4 py-3.5 font-medium">{c.description}</td>
                    <td className="px-4 py-3.5 text-xs uppercase">
                      {SOURCE_MODULE_LINK[c.source_module] ? (
                        <Link href={`/${orgSlug}${SOURCE_MODULE_LINK[c.source_module]}`} className="text-primary hover:underline">
                          {c.source_module}
                        </Link>
                      ) : (
                        <span className="text-muted-foreground">{c.source_module}</span>
                      )}
                    </td>
                    <td className="px-4 py-3.5 text-right font-mono">{c.amount.toFixed(2)}</td>
                    <td className="px-4 py-3.5">
                      <ChargeStatusBadge status={c.status} />
                    </td>
                    <td className="px-4 py-3.5 text-muted-foreground text-xs whitespace-nowrap">
                      {new Date(c.created_at).toLocaleString()}
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      {(c.status === 'pending' || c.status === 'invoiced') && (
                        <Can permission="hospital.billing.collect_any">
                          <Button size="sm" className="gap-1.5" onClick={() => setCollectCharge(c)}>
                            <CreditCard className="h-3.5 w-3.5" />
                            Collect
                          </Button>
                        </Can>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {collectCharge && (
        <CollectPaymentDialog
          description={collectCharge.description}
          amount={collectCharge.amount}
          onCollect={(data) => collect.mutateAsync({ chargeId: collectCharge.id, data })}
          onClose={() => setCollectCharge(null)}
        />
      )}
    </div>
  );
}
