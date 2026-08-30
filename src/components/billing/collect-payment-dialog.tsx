'use client';

import { useState } from 'react';
import { CreditCard, Loader2, X } from 'lucide-react';
import { toast } from 'sonner';
import { Button, Input } from '@/components/ui/base';
import { apiErrorMessage } from '@/lib/api/error-message';
import { useCollectCharge } from '@/hooks/useBilling';
import type { BillableCharge, PaymentMethod } from '@/lib/api/billing';

const PAYMENT_METHODS: { value: PaymentMethod; label: string }[] = [
  { value: 'mpesa', label: 'M-Pesa' },
  { value: 'card', label: 'Card' },
  { value: 'cash', label: 'Cash' },
  { value: 'bank_transfer', label: 'Bank Transfer' },
  { value: 'paystack', label: 'Paystack' },
];

/** Shared collect-payment modal — every point-of-charge surface (Billing queue, the visit account
 * ledger, and the point-of-charge widgets embedded in Triage/Consultation/Lab/Pharmacy/Patients)
 * uses this one component instead of near-identical copies. Mirrors InsuranceClaimModal's
 * shared-modal pattern in this same directory. */
export function CollectPaymentDialog({ charge, onClose }: { charge: BillableCharge; onClose: () => void }) {
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
