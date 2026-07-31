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
 * Sprint-0 placeholder dashboard — hospital-api has no domain endpoints yet (only /ping is
 * mounted under /api/v1/{tenant}/hospital), so these stat cards are static zero/placeholder
 * values with no data wiring. Swap in real hooks (src/hooks/use*.ts + src/lib/api/*.ts) once
 * the corresponding backend endpoints ship.
 */
export default function DashboardPage() {
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
          Clinical, admissions, laboratory, pharmacy, and billing modules land in upcoming sprints.
          This dashboard will populate once hospital-api&apos;s domain endpoints are live.
        </p>
      </Card>
    </div>
  );
}
