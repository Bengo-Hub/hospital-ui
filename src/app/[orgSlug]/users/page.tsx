'use client';

import { useState } from 'react';
import { Users as UsersIcon, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Card, Badge } from '@/components/ui/base';
import { PageHeader, EmptyState, Skeleton } from '@/components/ui/page';
import { Can } from '@/components/auth/can';
import { useAppPermissions } from '@/hooks/use-app-permissions';
import { useHospitalUsers, useHospitalRoles, useSetUserRole } from '@/hooks/useUsers';
import { apiErrorMessage } from '@/lib/api/error-message';
import { P } from '@/lib/rbac/permissions';

function RoleCell({ userId, currentRole }: { userId: string; currentRole: string }) {
  const { data: roles = [] } = useHospitalRoles();
  const setRole = useSetUserRole();
  const [pending, setPending] = useState(false);

  const handleChange = async (roleCode: string) => {
    if (roleCode === currentRole) return;
    setPending(true);
    try {
      await setRole.mutateAsync({ userId, roleCode });
      toast.success('Role updated.');
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Failed to update role'));
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <select
        value={currentRole}
        disabled={pending}
        onChange={(e) => handleChange(e.target.value)}
        className="bg-card border border-border rounded-lg py-1.5 px-2.5 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-primary/40 disabled:opacity-60"
      >
        {!currentRole && <option value="">No role</option>}
        {roles.map((r) => (
          <option key={r.code} value={r.code}>{r.name}</option>
        ))}
      </select>
      {pending && <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />}
    </div>
  );
}

export default function UsersPage() {
  const { data: users, isLoading } = useHospitalUsers();
  const { can } = useAppPermissions();
  const canManage = can(P.USERS_MANAGE);

  const rows = users ?? [];

  return (
    <div className="max-w-7xl mx-auto">
      <PageHeader
        title="Staff & Roles"
        subtitle="Tenant staff provisioned into hospital-api and their assigned role — new staff are added via Sign-In (SSO), not here"
        icon={<UsersIcon className="h-5 w-5" />}
      />

      <Card>
        {isLoading ? (
          <div className="p-6 space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        ) : rows.length === 0 ? (
          <EmptyState
            icon={<UsersIcon className="h-10 w-10" />}
            title="No staff provisioned yet"
            description="Staff appear here automatically the first time they sign in."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-accent/30">
                  <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Name</th>
                  <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Email</th>
                  <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Status</th>
                  <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Role</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {rows.map((u) => (
                  <tr key={u.id} className="hover:bg-accent/20 transition-colors">
                    <td className="px-4 py-3.5 font-medium">{u.name || '—'}</td>
                    <td className="px-4 py-3.5 text-muted-foreground">{u.email}</td>
                    <td className="px-4 py-3.5">
                      <Badge variant={u.status === 'active' ? 'success' : 'outline'}>{u.status}</Badge>
                    </td>
                    <td className="px-4 py-3.5">
                      <Can
                        permission={P.USERS_MANAGE}
                        fallback={
                          <span className="text-xs font-medium text-muted-foreground">
                            {(u.roles ?? [])[0] ?? 'No role'}
                          </span>
                        }
                      >
                        <RoleCell userId={u.id} currentRole={(u.roles ?? [])[0] ?? ''} />
                      </Can>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
      {!canManage && (
        <p className="mt-3 text-xs text-muted-foreground">
          Changing roles requires the <code className="font-mono">hospital.users.manage</code> permission.
        </p>
      )}
    </div>
  );
}
