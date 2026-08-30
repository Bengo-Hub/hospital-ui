'use client';

import { Settings } from 'lucide-react';
import { Card, Badge } from '@/components/ui/base';
import { PageHeader, Skeleton } from '@/components/ui/page';
import { useHospitalConfig } from '@/hooks/useUsers';

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between px-5 py-4 border-b border-border last:border-0">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-semibold">{value}</span>
    </div>
  );
}

export default function ConfigPage() {
  const { data: config, isLoading } = useHospitalConfig();

  return (
    <div className="max-w-2xl mx-auto">
      <PageHeader
        title="Config"
        subtitle="Read-only — resolved from your subscription plan (Settings & Subscriptions manages the plan itself)"
        icon={<Settings className="h-5 w-5" />}
      />

      <Card>
        {isLoading || !config ? (
          <div className="p-6 space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-8 w-full" />
            ))}
          </div>
        ) : (
          <div>
            <Row label="Tenant" value={config.tenant_name} />
            <Row label="Slug" value={<span className="font-mono text-xs">{config.tenant_slug}</span>} />
            <Row label="Status" value={<Badge variant={config.status === 'active' ? 'success' : 'outline'}>{config.status}</Badge>} />
            <Row label="Facility Type" value={<span className="capitalize">{config.facility_type || '—'}</span>} />
            <Row
              label="Enabled Modules"
              value={
                config.enabled_modules.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5 justify-end max-w-xs">
                    {config.enabled_modules.map((m) => (
                      <Badge key={m} variant="outline">{m}</Badge>
                    ))}
                  </div>
                ) : (
                  '—'
                )
              }
            />
            <Row
              label="Last Synced"
              value={config.synced_at ? new Date(config.synced_at).toLocaleString() : '—'}
            />
          </div>
        )}
      </Card>
    </div>
  );
}
