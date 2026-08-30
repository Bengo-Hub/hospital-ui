'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowLeft, Lock, ShieldAlert } from 'lucide-react';
import { Card } from '@/components/ui/base';
import { PageHeader, EmptyState, Skeleton } from '@/components/ui/page';
import { useAppPermissions } from '@/hooks/use-app-permissions';
import { useControlledSubstanceLogs } from '@/hooks/usePharmacy';

const REGISTER_PERMISSION = 'hospital.pharmacy.manage';

export default function ControlledSubstancesPage() {
  const params = useParams();
  const orgSlug = params?.orgSlug as string;
  const { can } = useAppPermissions();
  const allowed = can(REGISTER_PERMISSION);
  const { data: logs, isLoading } = useControlledSubstanceLogs(allowed);

  const rows = logs ?? [];

  return (
    <div className="max-w-6xl mx-auto">
      <PageHeader
        title="Controlled Substances Register"
        subtitle="Dual-witness dispensing audit log — populated automatically by the Pharmacy dispense flow"
        icon={<ShieldAlert className="h-5 w-5" />}
        actions={
          <Link
            href={`/${orgSlug}/pharmacy`}
            className="inline-flex items-center gap-2 border border-border bg-background text-foreground px-4 py-2.5 rounded-lg text-sm font-semibold hover:bg-accent transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Pharmacy
          </Link>
        }
      />

      {!allowed ? (
        <Card className="p-10 text-center">
          <Lock className="h-8 w-8 text-muted-foreground/40 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-foreground">Access restricted</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Viewing the controlled-substance register requires the <code className="font-mono text-xs">hospital.pharmacy.manage</code> permission.
          </p>
        </Card>
      ) : (
        <Card>
          {isLoading ? (
            <div className="p-6 space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : rows.length === 0 ? (
            <EmptyState
              icon={<ShieldAlert className="h-10 w-10" />}
              title="No controlled-substance dispenses logged yet"
              description="A log entry is created automatically whenever a dispense line is marked as requiring a witness."
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-accent/30">
                    <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Date</th>
                    <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Item</th>
                    <th className="text-center px-4 py-3 font-semibold text-muted-foreground">Qty</th>
                    <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Dispensed By</th>
                    <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Witness</th>
                    <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Patient</th>
                    <th className="text-left px-4 py-3 font-semibold text-muted-foreground hidden md:table-cell">Lot / Expiry</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {rows.map((log) => (
                    <tr key={log.id} className="hover:bg-accent/20 transition-colors">
                      <td className="px-4 py-3.5 text-muted-foreground whitespace-nowrap">
                        {new Date(log.dispensed_at).toLocaleString()}
                      </td>
                      <td className="px-4 py-3.5 font-medium">
                        {log.item_name}
                        <span className="text-xs text-muted-foreground ml-1.5 font-mono">{log.item_sku}</span>
                      </td>
                      <td className="px-4 py-3.5 text-center font-mono">{log.quantity_dispensed}</td>
                      <td className="px-4 py-3.5 text-muted-foreground font-mono text-xs">{log.dispensed_by}</td>
                      <td className="px-4 py-3.5 text-muted-foreground font-mono text-xs">{log.witness_staff_id || '—'}</td>
                      <td className="px-4 py-3.5">
                        {log.patient_name || '—'}
                        {log.patient_id_number && <span className="text-xs text-muted-foreground ml-1.5">{log.patient_id_number}</span>}
                      </td>
                      <td className="px-4 py-3.5 text-muted-foreground text-xs hidden md:table-cell">
                        {log.lot_number || '—'}
                        {log.lot_expiry_date && ` · exp ${new Date(log.lot_expiry_date).toLocaleDateString()}`}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
