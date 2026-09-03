'use client';

// Transfer history for an admission — PatientTransfer rows already existed (used for ward-charge
// billing segmentation) but had no UI-visible surface at all. See mvp-gap-backlog-2026-09-02
// Sprint 6.1 candidate ("Transfer history not visible in hospital-ui").

import { ArrowLeftRight } from 'lucide-react';
import { Card, Badge } from '@/components/ui/base';
import { useTransferHistory } from '@/hooks/useInpatient';

export function TransferHistoryPanel({ admissionId }: { admissionId: string }) {
  const { data: transfers, isLoading } = useTransferHistory(admissionId);

  if (isLoading || !transfers || transfers.length === 0) return null;

  return (
    <Card>
      <div className="p-5">
        <h3 className="text-sm font-bold flex items-center gap-2 mb-3">
          <ArrowLeftRight className="h-4 w-4 text-muted-foreground" />
          Transfer History
        </h3>
        <div className="space-y-2.5">
          {transfers.map((t) => (
            <div key={t.id} className="flex items-start justify-between gap-3 text-sm border-b border-border/60 pb-2.5 last:border-0">
              <div>
                <p className="font-medium">
                  {t.transfer_type === 'inter_facility'
                    ? `Transferred out${t.receiving_facility_name ? ` to ${t.receiving_facility_name}` : ''}`
                    : 'Ward/bed transfer'}
                </p>
                {t.reason && <p className="text-xs text-muted-foreground mt-0.5">{t.reason}</p>}
              </div>
              <div className="text-right shrink-0">
                <Badge variant={t.transfer_type === 'inter_facility' ? 'warning' : 'outline'}>
                  {t.transfer_type.replace('_', ' ')}
                </Badge>
                <p className="text-xs text-muted-foreground mt-1">{new Date(t.transferred_at).toLocaleString()}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}
