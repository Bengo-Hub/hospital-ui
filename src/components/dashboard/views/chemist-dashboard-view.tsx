'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { Clock, LayoutDashboard, Receipt, ShoppingCart, Wallet } from 'lucide-react';
import { Card, Button, Badge } from '@/components/ui/base';
import { PageHeader, StatCard, EmptyState, Skeleton } from '@/components/ui/page';
import { useWalkInSales } from '@/hooks/usePharmacy';
import { NewSaleModal } from '@/components/pharmacy/new-sale-modal';
import type { WalkInSaleStatus } from '@/lib/api/pharmacy';

const STATUS_BADGE_VARIANT: Record<WalkInSaleStatus, 'default' | 'success' | 'warning' | 'error' | 'outline'> = {
  pending: 'warning',
  paid: 'success',
  waived: 'outline',
};

function isToday(iso: string): boolean {
  const d = new Date(iso);
  const now = new Date();
  return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth() && d.getDate() === now.getDate();
}

/** Chemist tier's dashboard — a walk-in-sale shift summary instead of the clinical
 * patients/beds/lab stat cards, which don't apply at this tier (see facility-nomenclature.ts).
 * Sourced from the same useWalkInSales() data Pharmacy's "Recent Sales" panel already fetches,
 * filtered to today client-side — no new backend endpoint, hospital-api has no dashboard/summary
 * route at all yet (see ClinicalDashboardView's own note). "New Sale" is reachable directly from
 * here, not just from Pharmacy, since a 1-2-person shop's whole day is walk-in sales. */
export function ChemistDashboardView({ orgSlug }: { orgSlug: string }) {
  const [newSaleOpen, setNewSaleOpen] = useState(false);
  const { data: sales, isLoading } = useWalkInSales();

  const { todaySales, todayRevenue, pendingCount } = useMemo(() => {
    const all = sales ?? [];
    const today = all.filter((s) => isToday(s.created_at));
    const revenue = today.filter((s) => s.status === 'paid').reduce((sum, s) => sum + s.amount, 0);
    const pending = all.filter((s) => s.status === 'pending').length;
    return { todaySales: today, todayRevenue: revenue, pendingCount: pending };
  }, [sales]);

  const recent = (sales ?? []).slice(0, 5);

  return (
    <div className="max-w-5xl mx-auto">
      <PageHeader
        title="Dashboard"
        subtitle="Today's walk-in sales at a glance"
        icon={<LayoutDashboard className="h-5 w-5" />}
        actions={
          <Button className="gap-2" onClick={() => setNewSaleOpen(true)}>
            <ShoppingCart className="h-4 w-4" />
            New Sale
          </Button>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          label="Sales Today"
          value={isLoading ? '—' : String(todaySales.length)}
          icon={<ShoppingCart className="h-5 w-5" />}
          accent="bg-violet-500/15 text-violet-500"
        />
        <StatCard
          label="Today's Revenue"
          value={isLoading ? '—' : `KES ${todayRevenue.toFixed(2)}`}
          icon={<Wallet className="h-5 w-5" />}
          accent="bg-emerald-500/15 text-emerald-500"
        />
        <StatCard
          label="Awaiting Collection"
          value={isLoading ? '—' : String(pendingCount)}
          icon={<Clock className="h-5 w-5" />}
          accent="bg-amber-500/15 text-amber-500"
          sub={pendingCount > 0 ? 'Needs payment collected' : undefined}
        />
      </div>

      <div className="flex items-center justify-between mt-6 mb-3">
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
    </div>
  );
}
