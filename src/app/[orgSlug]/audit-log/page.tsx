'use client';

import { useState } from 'react';
import { History } from 'lucide-react';
import { Badge } from '@/components/ui/base';
import { PageHeader } from '@/components/ui/page';
import { useAuditLog } from '@/hooks/useAuditLog';
import { auditActionLabel } from '@/lib/api/audit-log';
import { DataTable, type DataTableColumn } from '@bengo-hub/shared-ui-lib/data-table';
import type { AuditLogEntry } from '@/lib/api/audit-log';

function ChangeSummary({ entry }: { entry: AuditLogEntry }) {
  const parts: string[] = [];
  if (entry.after && Object.keys(entry.after).length) {
    parts.push(Object.entries(entry.after).map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(', ') : String(v)}`).join(' · '));
  }
  if (!parts.length && entry.before && Object.keys(entry.before).length) {
    parts.push(Object.entries(entry.before).map(([k, v]) => `was ${k}: ${Array.isArray(v) ? v.join(', ') : String(v)}`).join(' · '));
  }
  return <span className="text-xs text-muted-foreground truncate block max-w-md">{parts.join(' ') || '—'}</span>;
}

export default function AuditLogPage() {
  const [page, setPage] = useState(1);
  const limit = 20;
  const { data, isLoading } = useAuditLog(page, limit);
  const rows = data?.data ?? [];

  const columns: DataTableColumn<AuditLogEntry>[] = [
    {
      key: 'created_at', header: 'When', sortable: true, primary: true,
      render: (e) => <span className="text-sm">{new Date(e.created_at).toLocaleString()}</span>,
    },
    {
      key: 'action', header: 'Action', sortable: true,
      render: (e) => <Badge variant="outline">{auditActionLabel(e.action)}</Badge>,
    },
    {
      key: 'target_type', header: 'Target',
      render: (e) => <span className="text-xs capitalize">{e.target_type}</span>,
    },
    {
      key: 'actor', header: 'Actor',
      render: (e) => <span className="text-xs font-mono">{e.actor_email || e.actor_user_id.slice(0, 8)}</span>,
    },
    {
      key: 'change', header: 'Detail',
      render: (e) => <ChangeSummary entry={e} />,
    },
  ];

  return (
    <div className="max-w-7xl mx-auto">
      <PageHeader
        title="Audit Log"
        subtitle="Role assignments, role/permission changes, and staff status changes for this tenant"
        icon={<History className="h-5 w-5" />}
      />

      <DataTable
        columns={columns}
        rows={rows}
        rowKey={(e) => e.id}
        loading={isLoading}
        loadingRows={6}
        emptyText="No RBAC activity recorded yet."
        page={data?.page ?? page}
        totalPages={data && data.limit > 0 ? Math.max(1, Math.ceil(data.total / data.limit)) : 1}
        onPageChange={setPage}
        total={data?.total}
      />
    </div>
  );
}
