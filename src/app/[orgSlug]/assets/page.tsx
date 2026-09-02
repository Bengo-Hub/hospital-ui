'use client';

import { useState } from 'react';
import { AlertTriangle, CheckCircle2, Stethoscope, Wrench } from 'lucide-react';
import { Card, Badge, Input } from '@/components/ui/base';
import { PageHeader, EmptyState, Skeleton } from '@/components/ui/page';
import { useAssets } from '@/hooks/useAssets';
import type { Asset } from '@/lib/api/assets';

const STATUS_BADGE: Record<Asset['status'], { variant: 'default' | 'success' | 'warning' | 'error' | 'outline'; icon: typeof CheckCircle2 }> = {
  active: { variant: 'success', icon: CheckCircle2 },
  inactive: { variant: 'outline', icon: CheckCircle2 },
  maintenance: { variant: 'warning', icon: Wrench },
  disposed: { variant: 'outline', icon: AlertTriangle },
  lost: { variant: 'error', icon: AlertTriangle },
  damaged: { variant: 'error', icon: AlertTriangle },
  retired: { variant: 'outline', icon: AlertTriangle },
};

export default function BiomedicalEquipmentPage() {
  const [search, setSearch] = useState('');
  const { data: assets, isLoading } = useAssets(search || undefined);
  const rows = assets ?? [];

  return (
    <div className="max-w-7xl mx-auto">
      <PageHeader
        title="Biomedical Equipment"
        subtitle="Read-only view of the facility's fixed-asset register (managed in Inventory) — linkable to beds, theatre bookings, and ICU episodes"
        icon={<Stethoscope className="h-5 w-5" />}
      />

      <div className="flex flex-wrap gap-3 mb-5">
        <Input placeholder="Search by name, tag, or serial number…" value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-sm" />
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
            icon={<Stethoscope className="h-10 w-10" />}
            title="No biomedical equipment found"
            description="Register ventilators, monitors, and other equipment as assets in Inventory — they'll appear here automatically."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-accent/30">
                  <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Tag</th>
                  <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Name</th>
                  <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Location</th>
                  <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Status</th>
                  <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Next Maintenance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {rows.map((a) => {
                  const cfg = STATUS_BADGE[a.status];
                  const Icon = cfg.icon;
                  return (
                    <tr key={a.id} className="hover:bg-accent/20 transition-colors">
                      <td className="px-4 py-3.5 font-mono text-xs">{a.asset_tag}</td>
                      <td className="px-4 py-3.5">
                        <p className="font-medium">{a.name}</p>
                        {(a.manufacturer || a.model) && (
                          <p className="text-xs text-muted-foreground">
                            {[a.manufacturer, a.model].filter(Boolean).join(' · ')}
                          </p>
                        )}
                      </td>
                      <td className="px-4 py-3.5 text-muted-foreground text-xs">{a.location || '—'}</td>
                      <td className="px-4 py-3.5">
                        <Badge variant={cfg.variant} className="gap-1.5">
                          <Icon className="h-3 w-3" />
                          {a.status}
                        </Badge>
                      </td>
                      <td className="px-4 py-3.5 text-muted-foreground text-xs whitespace-nowrap">
                        {a.next_maintenance ? new Date(a.next_maintenance).toLocaleDateString() : '—'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
