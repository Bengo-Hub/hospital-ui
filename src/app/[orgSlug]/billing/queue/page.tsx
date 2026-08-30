'use client';

import { useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Banknote, CreditCard, Loader2, X } from 'lucide-react';
import { toast } from 'sonner';
import { Card, Button, Badge, Input } from '@/components/ui/base';
import { PageHeader, EmptyState, Skeleton } from '@/components/ui/page';
import { Can } from '@/components/auth/can';
import { apiErrorMessage } from '@/lib/api/error-message';
import { usePendingCharges, useCollectCharge } from '@/hooks/useBilling';
import type { BillableCharge, ChargeStatus, PaymentMethod } from '@/lib/api/billing';

const DEPARTMENT_OPTIONS = [
  { value: '', label: 'All Departments' },
  { value: 'records', label: 'Records / Registration' },
  { value: 'triage', label: 'Triage' },
  { value: 'consultation', label: 'Consultation' },
  { value: 'lab', label: 'Laboratory' },
  { value: 'pharmacy', label: 'Pharmacy' },
  { value: 'theatre', label: 'Theatre' },
  { value: 'inpatient', label: 'Inpatient' },
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

const PAYMENT_METHODS: { value: PaymentMethod; label: string }[] = [
  { value: 'mpesa', label: 'M-Pesa' },
  { value: 'card', label: 'Card' },
  { value: 'cash', label: 'Cash' },
  { value: 'bank_transfer', label: 'Bank Transfer' },
  { value: 'paystack', label: 'Paystack' },
];

function CollectModal({ charge, onClose }: { charge: BillableCharge; onClose: () => void }) {
  const collect = useCollectCharge();
  const [method, setMethod] = useState<PaymentMethod>('mpesa');
  const [phone, setPhone] = useState('');

  const handleSubmit = async () => {
    if (method === 'mpesa' && !phone.trim()) {
      toast.error('Enter the M-Pesa phone number');
      return;
    }
    try {
      await collect.mutateAsync({
        chargeId: charge.id,
        data: { payment_method: method, phone_number: method === 'mpesa' ? phone.trim() : undefined },
      });
      toast.success('Payment collected');
      onClose();
    } catch (e) {
      toast.error(await apiErrorMessage(e, 'Failed to collect payment'));
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-card rounded-2xl border border-border w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center">
              <CreditCard className="h-4.5 w-4.5 text-primary" />
            </div>
            <div>
              <h3 className="font-bold text-base">Collect Payment</h3>
              <p className="text-xs text-muted-foreground">{charge.description}</p>
            </div>
          </div>
          <button onClick={onClose} className="h-9 w-9 rounded-xl flex items-center justify-center hover:bg-accent">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="p-6 space-y-4">
          <div className="rounded-xl border border-border bg-background/50 px-4 py-3 flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Amount Due</span>
            <span className="text-lg font-bold">{charge.amount.toFixed(2)}</span>
          </div>
          <div>
            <label className="text-xs font-semibold text-muted-foreground mb-1 block">Payment Method</label>
            <select
              value={method}
              onChange={(e) => setMethod(e.target.value as PaymentMethod)}
              className="w-full bg-background border border-border rounded-xl py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
            >
              {PAYMENT_METHODS.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </select>
          </div>
          {method === 'mpesa' && (
            <div>
              <label className="text-xs font-semibold text-muted-foreground mb-1 block">
                Phone Number <span className="text-destructive">*</span>
              </label>
              <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="e.g. 254712345678" />
            </div>
          )}
        </div>
        <div className="flex gap-3 px-6 pb-6">
          <Button variant="outline" className="flex-1" onClick={onClose} disabled={collect.isPending}>
            Cancel
          </Button>
          <Button className="flex-1 gap-2" onClick={handleSubmit} disabled={collect.isPending}>
            {collect.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            Confirm Payment
          </Button>
        </div>
      </div>
    </div>
  );
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

      {collectCharge && <CollectModal charge={collectCharge} onClose={() => setCollectCharge(null)} />}
    </div>
  );
}
