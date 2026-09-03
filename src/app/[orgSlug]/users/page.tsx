'use client';

import { useMemo, useState } from 'react';
import { Users as UsersIcon, Loader2, UserPlus } from 'lucide-react';
import { toast } from 'sonner';
import { Badge, Button } from '@/components/ui/base';
import { PageHeader } from '@/components/ui/page';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Can } from '@/components/auth/can';
import { useAppPermissions } from '@/hooks/use-app-permissions';
import { useHospitalUsers, useHospitalRoles, useHospitalOutlets, useSetUserRole, useSetUserStatus } from '@/hooks/useUsers';
import { ExtraRolesCell } from '@/components/users/extra-roles-cell';
import { OutletAssignmentCell } from '@/components/users/outlet-assignment-cell';
import { ProfessionalRegistrationCell } from '@/components/users/professional-registration-cell';
import { InviteMemberModal } from '@/components/users/invite-member-modal';
import { apiErrorMessage } from '@/lib/api/error-message';
import { P } from '@/lib/rbac/permissions';
import { DataTable, type DataTableColumn } from '@bengo-hub/shared-ui-lib/data-table';
import type { HospitalUserRow } from '@/lib/api/users';

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
      toast.error(await apiErrorMessage(err, 'Failed to update role'));
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

function StatusCell({ user, canManage }: { user: HospitalUserRow; canManage: boolean }) {
  const setStatus = useSetUserStatus();
  const [confirming, setConfirming] = useState<'inactive' | 'active' | null>(null);
  const isActive = user.status === 'active';

  const doChange = async (status: 'inactive' | 'active') => {
    try {
      await setStatus.mutateAsync({ userId: user.id, status });
      toast.success(status === 'active' ? 'User reactivated.' : 'User deactivated.');
    } catch (e) {
      toast.error(await apiErrorMessage(e, 'Failed to update status'));
    } finally {
      setConfirming(null);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <Badge variant={isActive ? 'success' : 'outline'}>{user.status}</Badge>
      {canManage && (
        <button
          className="text-[11px] text-muted-foreground hover:text-primary underline decoration-dotted"
          onClick={() => setConfirming(isActive ? 'inactive' : 'active')}
          disabled={setStatus.isPending}
        >
          {isActive ? 'Deactivate' : 'Reactivate'}
        </button>
      )}
      <ConfirmDialog
        open={!!confirming}
        title={confirming === 'inactive' ? `Deactivate ${user.name || user.email}?` : `Reactivate ${user.name || user.email}?`}
        description={
          confirming === 'inactive'
            ? 'They will immediately lose access to every permission-gated action in hospital-api. Their role assignment is kept, so reactivating restores access with no re-configuration needed.'
            : 'Restores their access using the role(s) already assigned to them.'
        }
        variant={confirming === 'inactive' ? 'danger' : 'info'}
        confirmLabel={confirming === 'inactive' ? 'Deactivate' : 'Reactivate'}
        onConfirm={() => confirming && doChange(confirming)}
        onCancel={() => setConfirming(null)}
      />
    </div>
  );
}

const STATUS_FILTER_OPTIONS = [
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
  { value: 'suspended', label: 'Suspended' },
];

export default function UsersPage() {
  const { data: users, isLoading } = useHospitalUsers();
  const { data: roleOptions = [] } = useHospitalRoles();
  const { data: outletOptions = [] } = useHospitalOutlets();
  const { can } = useAppPermissions();
  const canManage = can(P.USERS_MANAGE);
  const [inviting, setInviting] = useState(false);

  const rows = useMemo(() => users ?? [], [users]);

  const roleFilterOptions = useMemo(
    () => [{ value: '', label: 'No role' }, ...roleOptions.map((r) => ({ value: r.code, label: r.name }))],
    [roleOptions],
  );

  const columns: DataTableColumn<HospitalUserRow>[] = [
    {
      key: 'name', header: 'Name', sortable: true, filterable: true, primary: true,
      accessor: (u) => u.name || u.email,
      render: (u) => <span className="font-medium">{u.name || '—'}</span>,
    },
    {
      key: 'email', header: 'Email', sortable: true, filterable: true,
      render: (u) => <span className="text-muted-foreground">{u.email}</span>,
    },
    {
      key: 'status', header: 'Status', sortable: true, filterable: true, mobileAction: true,
      filterOptions: STATUS_FILTER_OPTIONS,
      render: (u) => <StatusCell user={u} canManage={canManage} />,
    },
    {
      key: 'role', header: 'Role', sortable: true, filterable: true,
      accessor: (u) => u.roles?.[0] ?? '',
      filterOptions: roleFilterOptions,
      render: (u) => (
        <Can permission={P.USERS_MANAGE} fallback={<span className="text-xs font-medium text-muted-foreground">{(u.roles ?? [])[0] ?? 'No role'}</span>}>
          <RoleCell userId={u.id} currentRole={(u.roles ?? [])[0] ?? ''} />
        </Can>
      ),
    },
    {
      key: 'extra_roles', header: 'Extra roles',
      render: (u) => <ExtraRolesCell userId={u.id} primaryRole={(u.roles ?? [])[0] ?? ''} extraRoles={(u.roles ?? []).slice(1)} canManage={canManage} />,
    },
    {
      key: 'professional_registration', header: 'Professional Registration',
      render: (u) => (
        <ProfessionalRegistrationCell
          userId={u.id}
          number={u.professional_registration_number}
          body={u.professional_registration_body}
          canManage={canManage}
        />
      ),
    },
    ...(outletOptions.length > 1
      ? [{
          key: 'outlets', header: 'Outlets',
          render: (u: HospitalUserRow) => <OutletAssignmentCell userId={u.id} canManage={canManage} />,
        } satisfies DataTableColumn<HospitalUserRow>]
      : []),
  ];

  return (
    <div className="max-w-7xl mx-auto">
      <PageHeader
        title="Staff & Roles"
        subtitle="Tenant staff provisioned into hospital-api and their assigned role(s)"
        icon={<UsersIcon className="h-5 w-5" />}
        actions={
          <Can permission={P.USERS_MANAGE}>
            <Button onClick={() => setInviting(true)}>
              <UserPlus className="h-4 w-4 mr-1.5" /> Invite Staff
            </Button>
          </Can>
        }
      />

      <DataTable
        columns={columns}
        rows={rows}
        rowKey={(u) => u.id}
        loading={isLoading}
        loadingRows={4}
        emptyText="No staff provisioned yet — staff appear here automatically the first time they sign in, or use Invite Staff above."
        storageKey="hospital-users-table"
      />

      {!canManage && (
        <p className="mt-3 text-xs text-muted-foreground">
          Managing staff requires the <code className="font-mono">hospital.users.manage</code> permission.
        </p>
      )}

      {inviting && <InviteMemberModal onClose={() => setInviting(false)} />}
    </div>
  );
}
