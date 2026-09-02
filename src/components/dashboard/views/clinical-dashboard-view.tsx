'use client';

import { Activity, BedDouble, FlaskConical, LayoutDashboard, Wallet } from 'lucide-react';
import { PageHeader, StatCard } from '@/components/ui/page';
import { Card } from '@/components/ui/base';

const STAT_CARDS = [
  {
    label: 'Patients Today',
    value: '0',
    icon: <Activity className="h-5 w-5" />,
    accent: 'bg-blue-500/15 text-blue-500',
  },
  {
    label: 'Beds Occupied',
    value: '0 / 0',
    icon: <BedDouble className="h-5 w-5" />,
    accent: 'bg-emerald-500/15 text-emerald-500',
  },
  {
    label: 'Pending Lab Results',
    value: '0',
    icon: <FlaskConical className="h-5 w-5" />,
    accent: 'bg-amber-500/15 text-amber-500',
  },
  {
    label: "Today's Revenue",
    value: 'KES 0',
    icon: <Wallet className="h-5 w-5" />,
    accent: 'bg-violet-500/15 text-violet-500',
  },
];

/**
 * Clinic/Facility/Hospital tiers' dashboard — still a placeholder (hospital-api has no
 * dashboard/summary aggregate endpoint yet, so these stat cards can't be wired to real data
 * without a new backend route, out of scope here). Patients/Consultation/Lab/Pharmacy/Billing
 * are themselves fully built and live (see their own pages) — only THIS aggregate landing view
 * is unbuilt, corrected 2026-09-02 from an earlier version of this banner that wrongly implied
 * those modules didn't exist yet.
 */
export function ClinicalDashboardView() {
  return (
    <div className="max-w-7xl mx-auto">
      <PageHeader
        title="Dashboard"
        subtitle="Hospital operations at a glance"
        icon={<LayoutDashboard className="h-5 w-5" />}
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {STAT_CARDS.map((c) => (
          <StatCard key={c.label} label={c.label} value={c.value} icon={c.icon} accent={c.accent} />
        ))}
      </div>

      <Card className="mt-6 p-8 text-center">
        <p className="text-sm text-muted-foreground">
          This summary view is still a placeholder — hospital-api has no dashboard-aggregate
          endpoint yet. Patients, Consultation, Laboratory, Pharmacy and Billing are fully built;
          use the sidebar to reach them directly.
        </p>
      </Card>
    </div>
  );
}
