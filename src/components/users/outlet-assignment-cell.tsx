'use client';

import { useState } from 'react';
import { Loader2, Plus, X } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/base';
import { apiErrorMessage } from '@/lib/api/error-message';
import { useHospitalOutlets, useUserOutlets, useAssignUserOutlet, useRemoveUserOutlet } from '@/hooks/useUsers';

interface OutletAssignmentCellProps {
  userId: string;
  canManage: boolean;
}

/** Per-user outlet/branch assignment — server-enforced (outlet_context.go), not just a UI
 *  convenience. Zero assignments means "unrestricted" on the backend (progressive rollout), so
 *  an empty cell here is a normal, safe starting state, not an error. */
export function OutletAssignmentCell({ userId, canManage }: OutletAssignmentCellProps) {
  const { data: allOutlets = [] } = useHospitalOutlets();
  const { data: assigned = [], isLoading } = useUserOutlets(userId);
  const assign = useAssignUserOutlet();
  const remove = useRemoveUserOutlet();
  const [adding, setAdding] = useState(false);
  const [pickerId, setPickerId] = useState('');

  // Single-outlet tenants have nothing meaningful to assign — hide the whole cell, matching the
  // outlet-switcher's own "outlets.length > 1" gating convention elsewhere in this app.
  if (allOutlets.length <= 1) return null;

  const outletName = (id: string) => allOutlets.find((o) => o.id === id)?.name ?? id.slice(0, 8);
  const available = allOutlets.filter((o) => !assigned.some((a) => a.outlet_id === o.id));

  const handleAdd = async () => {
    if (!pickerId) return;
    try {
      await assign.mutateAsync({ userId, outletId: pickerId, isHomeOutlet: assigned.length === 0 });
      toast.success('Outlet assigned');
      setAdding(false);
      setPickerId('');
    } catch (e) {
      toast.error(await apiErrorMessage(e, 'Failed to assign outlet'));
    }
  };

  const handleRemove = async (outletId: string) => {
    try {
      await remove.mutateAsync({ userId, outletId });
      toast.success('Outlet removed');
    } catch (e) {
      toast.error(await apiErrorMessage(e, 'Failed to remove outlet'));
    }
  };

  if (isLoading) return <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />;

  return (
    <div className="flex flex-wrap items-center gap-1">
      {assigned.length === 0 && !canManage && <span className="text-xs text-muted-foreground">All outlets</span>}
      {assigned.map((a) => (
        <Badge key={a.outlet_id} variant={a.is_home_outlet ? 'default' : 'outline'} className="flex items-center gap-1 text-[10px] py-0">
          {outletName(a.outlet_id)}
          {canManage && (
            <button onClick={() => handleRemove(a.outlet_id)} disabled={remove.isPending} className="hover:text-destructive" title="Remove outlet">
              <X className="h-2.5 w-2.5" />
            </button>
          )}
        </Badge>
      ))}
      {canManage && (
        adding ? (
          <div className="flex items-center gap-1">
            <select
              className="text-[10px] border border-border rounded px-1 py-0.5 bg-background"
              value={pickerId}
              onChange={(e) => setPickerId(e.target.value)}
              autoFocus
            >
              <option value="">+ outlet…</option>
              {available.map((o) => (
                <option key={o.id} value={o.id}>{o.name}</option>
              ))}
            </select>
            <button onClick={handleAdd} disabled={!pickerId || assign.isPending} className="text-primary text-[10px] font-semibold disabled:opacity-50">
              {assign.isPending ? <Loader2 className="h-2.5 w-2.5 animate-spin" /> : 'Add'}
            </button>
            <button onClick={() => { setAdding(false); setPickerId(''); }} className="text-muted-foreground">
              <X className="h-2.5 w-2.5" />
            </button>
          </div>
        ) : (
          available.length > 0 && (
            <button
              onClick={() => setAdding(true)}
              className="h-4 w-4 rounded-full border border-dashed border-border flex items-center justify-center text-muted-foreground hover:text-primary hover:border-primary"
              title="Assign an outlet"
            >
              <Plus className="h-2.5 w-2.5" />
            </button>
          )
        )
      )}
    </div>
  );
}
