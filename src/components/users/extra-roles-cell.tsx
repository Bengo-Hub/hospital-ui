'use client';

import { useState } from 'react';
import { Loader2, Plus, X } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/base';
import { apiErrorMessage } from '@/lib/api/error-message';
import { useHospitalRoles, useAssignExtraRole, useRevokeExtraRole } from '@/hooks/useUsers';

interface ExtraRolesCellProps {
  userId: string;
  /** The user's primary role (first entry of their `roles` array) — excluded from the picker
   *  and never shown as a chip here (it has its own dropdown in the Role column). */
  primaryRole: string;
  /** Every OTHER role the user currently holds — additive grants beyond the primary one. */
  extraRoles: string[];
  canManage: boolean;
}

/** Additive per-user role grants, modeled on pos-ui's ExtraRolesModal but as an inline cell:
 *  a chip per extra role (revocable) plus a small "+role" picker. Changing the PRIMARY role via
 *  the Role column's dropdown still wipes every extra role too — see rbac.Service.SetUserRole's
 *  unchanged contract — so this stays visually separate to make that distinction legible. */
export function ExtraRolesCell({ userId, primaryRole, extraRoles, canManage }: ExtraRolesCellProps) {
  const { data: roles = [] } = useHospitalRoles();
  const assign = useAssignExtraRole();
  const revoke = useRevokeExtraRole();
  const [adding, setAdding] = useState(false);
  const [pickerCode, setPickerCode] = useState('');

  const roleName = (code: string) => roles.find((r) => r.code === code)?.name ?? code;
  const available = roles.filter((r) => r.code !== primaryRole && !extraRoles.includes(r.code));

  const handleAdd = async () => {
    if (!pickerCode) return;
    try {
      await assign.mutateAsync({ userId, roleCode: pickerCode });
      toast.success('Extra role granted');
      setAdding(false);
      setPickerCode('');
    } catch (e) {
      toast.error(await apiErrorMessage(e, 'Failed to grant role'));
    }
  };

  const handleRevoke = async (code: string) => {
    try {
      await revoke.mutateAsync({ userId, roleCode: code });
      toast.success('Extra role revoked');
    } catch (e) {
      toast.error(await apiErrorMessage(e, 'Failed to revoke role'));
    }
  };

  if (!canManage && extraRoles.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-1">
      {extraRoles.map((code) => (
        <Badge key={code} variant="outline" className="flex items-center gap-1 text-[10px] py-0">
          {roleName(code)}
          {canManage && (
            <button onClick={() => handleRevoke(code)} disabled={revoke.isPending} className="hover:text-destructive" title="Revoke extra role">
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
              value={pickerCode}
              onChange={(e) => setPickerCode(e.target.value)}
              autoFocus
            >
              <option value="">+ role…</option>
              {available.map((r) => (
                <option key={r.code} value={r.code}>{r.name}</option>
              ))}
            </select>
            <button onClick={handleAdd} disabled={!pickerCode || assign.isPending} className="text-primary text-[10px] font-semibold disabled:opacity-50">
              {assign.isPending ? <Loader2 className="h-2.5 w-2.5 animate-spin" /> : 'Add'}
            </button>
            <button onClick={() => { setAdding(false); setPickerCode(''); }} className="text-muted-foreground">
              <X className="h-2.5 w-2.5" />
            </button>
          </div>
        ) : (
          <button
            onClick={() => setAdding(true)}
            className="h-4 w-4 rounded-full border border-dashed border-border flex items-center justify-center text-muted-foreground hover:text-primary hover:border-primary"
            title="Grant an extra role"
          >
            <Plus className="h-2.5 w-2.5" />
          </button>
        )
      )}
    </div>
  );
}
