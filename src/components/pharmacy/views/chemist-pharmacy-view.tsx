'use client';

import { useState } from 'react';
import Link from 'next/link';
import { FileText, Receipt, ShieldAlert, ShoppingCart } from 'lucide-react';
import { Card, Button, Badge } from '@/components/ui/base';
import { PageHeader, EmptyState, Skeleton } from '@/components/ui/page';
import { Can } from '@/components/auth/can';
import { useWalkInSales } from '@/hooks/usePharmacy';
import { NewSaleModal } from '@/components/pharmacy/new-sale-modal';
import { NewPrescriptionModal } from '@/components/pharmacy/new-prescription-modal';
import type { WalkInSaleStatus } from '@/lib/api/pharmacy';

const STATUS_BADGE_VARIANT: Record<WalkInSaleStatus, 'default' | 'success' | 'warning' | 'error' | 'outline'> = {
  pending: 'warning',
  paid: 'success',
  waived: 'outline',
};

/** Chemist tier's Pharmacy view — a POS-style "sell a drug to a walk-in customer" screen instead
 * of the clinical prescription list. "New Sale" is the primary action (cart -> complete sale ->
 * collect, all in one flow — see NewSaleModal); recent sales render inline so a shift's activity
 * is visible without navigating to the standalone Today's Sales page. "Dispense External Rx"
 * covers this tier's OTHER real use case (a prescription written elsewhere, per
 * facility-nomenclature.ts) via the same clinical NewPrescriptionModal the other tiers use,
 * reused rather than duplicated. */
export function ChemistPharmacyView({ orgSlug }: { orgSlug: string }) {
  const [newSaleOpen, setNewSaleOpen] = useState(false);
  const [dispenseRxOpen, setDispenseRxOpen] = useState(false);
  const { data: sales, isLoading } = useWalkInSales();

  const recent = (sales ?? []).slice(0, 8);

  return (
    <div className="max-w-5xl mx-auto">
      <PageHeader
        title="Pharmacy"
        subtitle="Sell to walk-in customers and dispense external prescriptions"
        icon={<ShoppingCart className="h-5 w-5" />}
        actions={
          <>
            <Link
              href={`/${orgSlug}/pharmacy/controlled-substances`}
              className="inline-flex items-center gap-2 border border-border bg-background text-foreground px-4 py-2.5 rounded-lg text-sm font-semibold hover:bg-accent transition-colors"
            >
              <ShieldAlert className="h-4 w-4" />
              Controlled Substances
            </Link>
            <Can permission="hospital.pharmacy.prescribe">
              <Button variant="outline" className="gap-2" onClick={() => setDispenseRxOpen(true)}>
                <FileText className="h-4 w-4" />
                Dispense External Rx
              </Button>
            </Can>
            <Can permission="hospital.pharmacy.prescribe">
              <Button className="gap-2" onClick={() => setNewSaleOpen(true)}>
                <ShoppingCart className="h-4 w-4" />
                New Sale
              </Button>
            </Can>
          </>
        }
      />

      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-bold text-muted-foreground">Recent Sales</h2>
        <Link href={`/${orgSlug}/pharmacy/walk-in-sales`} className="text-xs font-semibold text-primary hover:underline flex items-center gap-1.5">
          <Receipt className="h-3.5 w-3.5" />
          View all / collect pending
        </Link>
      </div>

      <Card>
        {isLoading ? (
          <div className="p-6 space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        ) : recent.length === 0 ? (
          <EmptyState
            icon={<ShoppingCart className="h-10 w-10" />}
            title="No sales yet"
            description="Click New Sale to ring up your first walk-in customer."
          />
        ) : (
          <div className="divide-y divide-border">
            {recent.map((s) => (
              <div key={s.id} className="flex items-center justify-between gap-3 px-4 py-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate flex items-center gap-2">
                    <span className="font-mono text-xs text-muted-foreground">{s.sale_number}</span>
                    {s.patient_name && <span className="text-muted-foreground">· {s.patient_name}</span>}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">{new Date(s.created_at).toLocaleString()}</p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-sm font-semibold">{s.amount.toFixed(2)}</span>
                  <Badge variant={STATUS_BADGE_VARIANT[s.status]}>{s.status}</Badge>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {newSaleOpen && <NewSaleModal orgSlug={orgSlug} onClose={() => setNewSaleOpen(false)} />}
      {dispenseRxOpen && (
        <NewPrescriptionModal orgSlug={orgSlug} title="Dispense External Rx" onClose={() => setDispenseRxOpen(false)} />
      )}
    </div>
  );
}
