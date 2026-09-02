'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { AlertOctagon, Banknote, CreditCard, Loader2, Receipt, ShieldAlert, ShieldCheck, Wallet, X } from 'lucide-react';
import { toast } from 'sonner';
import { Card, Button, Badge, Input } from '@/components/ui/base';
import { PageHeader, StatCard, EmptyState, Skeleton } from '@/components/ui/page';
import { Can } from '@/components/auth/can';
import { apiErrorMessage } from '@/lib/api/error-message';
import { useFacilityType } from '@/lib/facility-nomenclature';
import {
  useAccountByVisit,
  useCollectCharge,
  useSettleAccount,
  useOverrideSettlement,
  useSubmitVisitInsuranceClaim,
  useNextOfKin,
  useCreateNextOfKin,
} from '@/hooks/useBilling';
import { InsuranceClaimModal } from '@/components/billing/insurance-claim-modal';
import { CollectPaymentDialog } from '@/components/billing/collect-payment-dialog';
import type { BillableCharge, ChargeStatus, PatientAccount, PaymentMethod } from '@/lib/api/billing';

// This page is deliberately visit-scoped (matches useAccountByVisit's contract, which takes a
// VISIT id, not a patient id — a patient's OPD account resets per visit while an admission's
// spans the whole stay). hospital-ui has no Patients/Visits list UI yet (Phase 6, still
// comingSoon in the sidebar), so for now this route is reached by direct URL / a future link
// from a visit detail page rather than site navigation — see the migration report for the full
// route-choice rationale.

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

const ACCOUNT_STATUS_BADGE: Record<PatientAccount['status'], 'default' | 'success' | 'warning' | 'error' | 'outline'> = {
  open: 'warning',
  settled: 'success',
  written_off: 'outline',
};

const PAYMENT_METHODS: { value: PaymentMethod; label: string }[] = [
  { value: 'mpesa', label: 'M-Pesa' },
  { value: 'card', label: 'Card' },
  { value: 'cash', label: 'Cash' },
  { value: 'bank_transfer', label: 'Bank Transfer' },
  { value: 'paystack', label: 'Paystack' },
];

// ─── Settle-account modal (facility/hospital tier only) ─────────────────────

function SettleModal({ account, onClose }: { account: PatientAccount; onClose: () => void }) {
  const settle = useSettleAccount();
  const { data: kin = [], isLoading: kinLoading } = useNextOfKin(account.patient_id);
  const createKin = useCreateNextOfKin();
  const [method, setMethod] = useState<PaymentMethod>('mpesa');
  const [phone, setPhone] = useState('');
  const [nextOfKinId, setNextOfKinId] = useState('');
  const [addingKin, setAddingKin] = useState(false);
  const [kinName, setKinName] = useState('');
  const [kinPhone, setKinPhone] = useState('');
  const [kinRelationship, setKinRelationship] = useState('');

  const handleAddKin = async () => {
    if (!kinName.trim()) {
      toast.error('Enter the next-of-kin name');
      return;
    }
    try {
      const created = await createKin.mutateAsync({
        patientId: account.patient_id,
        data: { name: kinName.trim(), phone: kinPhone.trim() || undefined, relationship: kinRelationship.trim() || undefined },
      });
      setNextOfKinId(created.id);
      setAddingKin(false);
      setKinName(''); setKinPhone(''); setKinRelationship('');
      toast.success('Next-of-kin added');
    } catch (e) {
      toast.error(await apiErrorMessage(e, 'Failed to add next-of-kin'));
    }
  };

  const handleSubmit = async () => {
    if (method === 'mpesa' && !phone.trim()) {
      toast.error('Enter the M-Pesa phone number');
      return;
    }
    try {
      await settle.mutateAsync({
        accountId: account.id,
        data: {
          payment_method: method,
          phone_number: method === 'mpesa' ? phone.trim() : undefined,
          next_of_kin_id: nextOfKinId || undefined,
        },
      });
      toast.success('Account settled');
      onClose();
    } catch (e) {
      toast.error(await apiErrorMessage(e, 'Failed to settle account'));
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-card rounded-2xl border border-border w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center">
              <Wallet className="h-4.5 w-4.5 text-primary" />
            </div>
            <div>
              <h3 className="font-bold text-base">Settle Account</h3>
              <p className="text-xs text-muted-foreground">Outstanding balance {account.balance.toFixed(2)}</p>
            </div>
          </div>
          <button onClick={onClose} className="h-9 w-9 rounded-xl flex items-center justify-center hover:bg-accent">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="p-6 space-y-4">
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
          <div>
            <label className="text-xs font-semibold text-muted-foreground mb-1 block">Next of Kin (if they are settling)</label>
            {!addingKin ? (
              <div className="flex items-center gap-2">
                <select
                  value={nextOfKinId}
                  disabled={kinLoading}
                  onChange={(e) => setNextOfKinId(e.target.value)}
                  className="flex-1 bg-background border border-border rounded-xl py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 disabled:opacity-60"
                >
                  <option value="">{kinLoading ? 'Loading…' : 'None recorded'}</option>
                  {kin.map((k) => (
                    <option key={k.id} value={k.id}>{k.name}{k.relationship ? ` (${k.relationship})` : ''}</option>
                  ))}
                </select>
                <Button type="button" variant="outline" size="sm" onClick={() => setAddingKin(true)}>Add New</Button>
              </div>
            ) : (
              <div className="space-y-2 rounded-xl border border-border p-3">
                <Input value={kinName} onChange={(e) => setKinName(e.target.value)} placeholder="Full name *" />
                <Input value={kinPhone} onChange={(e) => setKinPhone(e.target.value)} placeholder="Phone (optional)" />
                <Input value={kinRelationship} onChange={(e) => setKinRelationship(e.target.value)} placeholder="Relationship (optional)" />
                <div className="flex gap-2">
                  <Button type="button" variant="outline" size="sm" className="flex-1" onClick={() => setAddingKin(false)} disabled={createKin.isPending}>
                    Cancel
                  </Button>
                  <Button type="button" size="sm" className="flex-1 gap-1.5" onClick={handleAddKin} disabled={createKin.isPending}>
                    {createKin.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                    Save
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
        <div className="flex gap-3 px-6 pb-6">
          <Button variant="outline" className="flex-1" onClick={onClose} disabled={settle.isPending}>
            Cancel
          </Button>
          <Button className="flex-1 gap-2" onClick={handleSubmit} disabled={settle.isPending}>
            {settle.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            Confirm Settlement
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── Override-settlement modal (escape hatch, mandatory reason) ─────────────

function OverrideModal({ account, onClose }: { account: PatientAccount; onClose: () => void }) {
  const override = useOverrideSettlement();
  const [reason, setReason] = useState('');

  const handleSubmit = async () => {
    if (!reason.trim()) {
      toast.error('A reason is required to override settlement');
      return;
    }
    try {
      await override.mutateAsync({ accountId: account.id, reason: reason.trim() });
      toast.success('Settlement requirement overridden');
      onClose();
    } catch (e) {
      toast.error(await apiErrorMessage(e, 'Failed to override settlement'));
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-card rounded-2xl border border-border w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-red-500/10 flex items-center justify-center">
              <AlertOctagon className="h-4.5 w-4.5 text-red-600" />
            </div>
            <div>
              <h3 className="font-bold text-base">Override Settlement</h3>
              <p className="text-xs text-muted-foreground">Release with balance {account.balance.toFixed(2)} outstanding</p>
            </div>
          </div>
          <button onClick={onClose} className="h-9 w-9 rounded-xl flex items-center justify-center hover:bg-accent">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="p-6 space-y-4">
          <p className="text-sm text-muted-foreground">
            Use only for emergencies or charity cases. This action is audited against your user account.
          </p>
          <div>
            <label className="text-xs font-semibold text-muted-foreground mb-1 block">
              Reason <span className="text-destructive">*</span>
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              placeholder="Why is this account being released without full settlement?"
              className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-400/40"
            />
          </div>
        </div>
        <div className="flex gap-3 px-6 pb-6">
          <Button variant="outline" className="flex-1" onClick={onClose} disabled={override.isPending}>
            Cancel
          </Button>
          <Button variant="destructive" className="flex-1 gap-2" onClick={handleSubmit} disabled={override.isPending || !reason.trim()}>
            {override.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            Confirm Override
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── Chemist tier: minimal walk-in-sale-style checkout ──────────────────────
//
// Per hospital-api's docs/architecture.md "Distributed Billing & Patient Accounts": a Chemist-
// tier tenant has no PatientAccount/ledger concept at all (same as pos-api's original pharmacy
// "direct" checkout) — there is no OPD visit to scope this page to, and creating an ad-hoc charge
// is out of scope here (no such endpoint exists yet). So this view ignores the :visitId route
// param entirely and just lists whatever pending charges already exist for the tenant, with a
// direct Collect action — the smallest-scope facility type gets the smallest-scope page.

// A Chemist tenant never has a Patient/Visit at all (feature-gated off both), so this
// visit-scoped route is structurally unreachable for one in normal navigation — there is no
// visitId to link here with. This branch exists only as a defensive landing for a stale/typed
// URL, pointing to the real Chemist checkout surface instead. A previous version of this file
// rendered a "ChemistCheckout" component backed by the BillableCharge queue (usePendingCharges) —
// that queue can never contain a chemist walk-in sale's charge (see billing.Service.
// CreateWalkInSale's doc comment in hospital-api), so it always rendered "Nothing pending" for a
// real chemist tenant. Removed as dead code now that WalkInSale/the Today's Sales page (2026-09-02)
// is the real fix.
function ChemistCheckoutRedirect({ orgSlug }: { orgSlug: string }) {
  return (
    <div className="max-w-3xl mx-auto">
      <EmptyState
        icon={<Receipt className="h-10 w-10" />}
        title="Chemist checkout has moved"
        description="Walk-in sale payment collection now lives on the Today's Sales page."
        action={
          <Link href={`/${orgSlug}/pharmacy/walk-in-sales`} className="text-sm text-primary underline">
            Go to Today&apos;s Sales
          </Link>
        }
      />
    </div>
  );
}

// ─── Clinic/Facility/Hospital tier: full patient-account ledger ─────────────

function PatientAccountLedger({ visitId, showSettlementActions }: { visitId: string; showSettlementActions: boolean }) {
  const { data, isLoading } = useAccountByVisit(visitId);
  const collect = useCollectCharge();
  const [collectCharge, setCollectCharge] = useState<BillableCharge | null>(null);
  const [insuranceCharge, setInsuranceCharge] = useState<BillableCharge | null>(null);
  const [settleOpen, setSettleOpen] = useState(false);
  const [overrideOpen, setOverrideOpen] = useState(false);
  const submitInsuranceClaim = useSubmitVisitInsuranceClaim();

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto space-y-4">
        <Skeleton className="h-9 w-64" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  const account = data?.account;
  const charges = data?.charges ?? [];

  if (!account) {
    return (
      <div className="max-w-4xl mx-auto">
        <EmptyState icon={<Wallet className="h-10 w-10" />} title="No patient account found for this visit" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <PageHeader
        title="Patient Account"
        subtitle={`Visit ${visitId}`}
        icon={<Wallet className="h-5 w-5" />}
        actions={
          showSettlementActions ? (
            <>
              <Can permission={['hospital.billing.collect_own', 'hospital.billing.collect_any']}>
                <Button variant="secondary" className="gap-2" onClick={() => setSettleOpen(true)} disabled={account.status !== 'open'}>
                  <Wallet className="h-4 w-4" />
                  Settle Account
                </Button>
              </Can>
              <Can permission="hospital.billing.override_settlement">
                <Button
                  variant="outline"
                  className="gap-2 text-destructive border-destructive/30 hover:bg-destructive/10"
                  onClick={() => setOverrideOpen(true)}
                  disabled={account.status !== 'open'}
                >
                  <ShieldAlert className="h-4 w-4" />
                  Override Settlement
                </Button>
              </Can>
            </>
          ) : undefined
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard label="Status" value={<Badge variant={ACCOUNT_STATUS_BADGE[account.status]}>{account.status.replace('_', ' ')}</Badge>} />
        <StatCard label="Total Charged" value={account.total_charged.toFixed(2)} />
        <StatCard label="Total Paid" value={account.total_paid.toFixed(2)} />
        <StatCard
          label="Balance"
          value={account.balance.toFixed(2)}
          sub={account.settlement_required_before !== 'nothing' ? `Must settle before ${account.settlement_required_before.replace('_', ' ')}` : undefined}
        />
      </div>

      <Card>
        <div className="px-5 py-4 border-b border-border">
          <h2 className="text-sm font-bold">Charges</h2>
        </div>
        {charges.length === 0 ? (
          <EmptyState icon={<Banknote className="h-10 w-10" />} title="No charges on this account yet" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-accent/30">
                  <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Description</th>
                  <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Source</th>
                  <th className="text-right px-4 py-3 font-semibold text-muted-foreground">Amount</th>
                  <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Status</th>
                  <th className="text-right px-4 py-3 font-semibold text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {charges.map((c) => (
                  <tr key={c.id} className="hover:bg-accent/20 transition-colors">
                    <td className="px-4 py-3.5 font-medium">{c.description}</td>
                    <td className="px-4 py-3.5 text-muted-foreground text-xs uppercase">{c.source_module}</td>
                    <td className="px-4 py-3.5 text-right font-mono">{c.amount.toFixed(2)}</td>
                    <td className="px-4 py-3.5">
                      <ChargeStatusBadge status={c.status} />
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      {(c.status === 'pending' || c.status === 'invoiced') && (
                        <div className="flex items-center justify-end gap-2">
                          <Can permission="hospital.billing.collect_own">
                            <Button size="sm" className="gap-1.5" onClick={() => setCollectCharge(c)}>
                              <CreditCard className="h-3.5 w-3.5" />
                              Collect Now
                            </Button>
                          </Can>
                          <Can permission={['hospital.billing.collect_own', 'hospital.billing.collect_any']}>
                            <Button size="sm" variant="outline" className="gap-1.5" onClick={() => setInsuranceCharge(c)}>
                              <ShieldCheck className="h-3.5 w-3.5" />
                              Insurance
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

      {collectCharge && (
        <CollectPaymentDialog
          description={collectCharge.description}
          amount={collectCharge.amount}
          onCollect={(data) => collect.mutateAsync({ chargeId: collectCharge.id, data })}
          onClose={() => setCollectCharge(null)}
        />
      )}
      {settleOpen && <SettleModal account={account} onClose={() => setSettleOpen(false)} />}
      {overrideOpen && <OverrideModal account={account} onClose={() => setOverrideOpen(false)} />}
      {insuranceCharge && (
        <InsuranceClaimModal
          title={insuranceCharge.description}
          amountLabel={insuranceCharge.amount.toFixed(2)}
          onSubmit={(input) =>
            submitInsuranceClaim.mutateAsync({ visitId, data: { ...input, charge_ids: [insuranceCharge.id] } })
          }
          onClose={() => setInsuranceCharge(null)}
        />
      )}
    </div>
  );
}

// ─── Page ───────────────────────────────────────────────────────────────────

export default function PatientAccountPage() {
  const params = useParams();
  const orgSlug = params?.orgSlug as string;
  const visitId = params?.visitId as string;
  const facilityType = useFacilityType();

  if (facilityType === 'chemist') {
    return <ChemistCheckoutRedirect orgSlug={orgSlug} />;
  }

  return <PatientAccountLedger visitId={visitId} showSettlementActions={facilityType === 'facility' || facilityType === 'hospital'} />;
}
