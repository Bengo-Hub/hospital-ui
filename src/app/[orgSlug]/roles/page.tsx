'use client';

import { useEffect, useMemo, useState } from 'react';
import { Loader2, Lock, Plus, Save, Search, Shield, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { Badge, Button, Card, CardContent, CardHeader } from '@/components/ui/base';
import { PageHeader } from '@/components/ui/page';
import { Can } from '@/components/auth/can';
import { useAppPermissions } from '@/hooks/use-app-permissions';
import {
  useHospitalRoles, useHospitalPermissions, useRolePermissions, useUpdateRolePermissions, useCreateRole,
} from '@/hooks/useUsers';
import { apiErrorMessage } from '@/lib/api/error-message';
import { P } from '@/lib/rbac/permissions';
import type { HospitalPermissionOption, HospitalRoleOption } from '@/lib/api/users';

const inputCls = 'w-full bg-background border border-border rounded-lg py-1.5 px-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40';

export default function RolesPage() {
  const { can } = useAppPermissions();
  const canManage = can(P.USERS_MANAGE);
  const { data: roles = [], isLoading: rolesLoading } = useHospitalRoles();
  const [selectedCode, setSelectedCode] = useState<string | null>(null);
  const [showNew, setShowNew] = useState(false);

  useEffect(() => {
    if (!selectedCode && roles.length) setSelectedCode(roles[0].code);
  }, [roles, selectedCode]);

  const selectedRole = roles.find((r) => r.code === selectedCode) ?? null;

  return (
    <div className="max-w-6xl mx-auto">
      <PageHeader
        title="Roles & Permissions"
        subtitle="Global roles plus any roles customized or created for this tenant"
        icon={<Shield className="h-5 w-5" />}
      />

      <div className="grid gap-4 md:grid-cols-[280px_1fr]">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <span className="font-bold text-sm">Roles</span>
              <Can permission={P.USERS_MANAGE}>
                <Button size="sm" className="h-7 px-2" onClick={() => setShowNew((s) => !s)} title="Create a custom role">
                  <Plus className="h-3.5 w-3.5" />
                </Button>
              </Can>
            </div>
          </CardHeader>
          <CardContent className="p-2 space-y-1">
            {showNew && (
              <NewRoleForm onDone={(code) => { setShowNew(false); setSelectedCode(code); }} />
            )}
            {rolesLoading ? (
              <div className="flex justify-center py-6"><Loader2 className="h-4 w-4 animate-spin text-primary" /></div>
            ) : (
              roles.map((r) => (
                <button
                  key={r.code}
                  onClick={() => setSelectedCode(r.code)}
                  className={`w-full flex items-center justify-between gap-2 p-2 rounded-lg text-sm text-left ${selectedCode === r.code ? 'bg-primary/10 text-primary font-semibold' : 'hover:bg-accent/10'}`}
                >
                  <span className="truncate">{r.name}</span>
                  {r.is_system_role ? (
                    <span className="text-[10px] text-muted-foreground flex items-center gap-0.5 shrink-0"><Lock className="h-2.5 w-2.5" /> global</span>
                  ) : (
                    <span className="text-[10px] text-primary/70 flex items-center gap-0.5 shrink-0"><Sparkles className="h-2.5 w-2.5" /> {r.cloned_from_role_id ? 'customized' : 'custom'}</span>
                  )}
                </button>
              ))
            )}
            {!rolesLoading && roles.length === 0 && <p className="text-xs text-muted-foreground p-2">No roles found.</p>}
          </CardContent>
        </Card>

        {selectedRole && <PermissionMatrix key={selectedRole.id} role={selectedRole} canManage={canManage} onCustomized={setSelectedCode} />}
      </div>
    </div>
  );
}

function NewRoleForm({ onDone }: { onDone: (code: string) => void }) {
  const createRole = useCreateRole();
  const [code, setCode] = useState('');
  const [name, setName] = useState('');

  const handleCreate = async () => {
    try {
      const role = await createRole.mutateAsync({ role_code: code, name, permission_codes: [] });
      toast.success('Custom role created — pick it below to grant permissions.');
      onDone(role.code);
    } catch (e) {
      toast.error(await apiErrorMessage(e, 'Failed to create role'));
    }
  };

  return (
    <div className="p-2 space-y-2 bg-accent/5 rounded-lg mb-2">
      <input
        className={inputCls}
        placeholder="Code (e.g. ward_clerk)"
        value={code}
        onChange={(e) => setCode(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '_'))}
      />
      <input className={inputCls} placeholder="Display name" value={name} onChange={(e) => setName(e.target.value)} />
      <Button size="sm" className="w-full" disabled={!code || !name || createRole.isPending} onClick={handleCreate}>
        {createRole.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Create role'}
      </Button>
    </div>
  );
}

const ACTION_LABELS: Record<string, string> = {
  view: 'View', add: 'Add', change: 'Edit', manage: 'Manage',
  prescribe: 'Prescribe', dispense: 'Dispense',
  collect_own: 'Collect own', collect_any: 'Collect any', override_settlement: 'Override settlement', manage_catalog: 'Manage catalog',
};
const actionLabel = (a: string) => ACTION_LABELS[a] ?? a.replace(/_/g, ' ');

function PermissionMatrix({
  role, canManage, onCustomized,
}: { role: HospitalRoleOption; canManage: boolean; onCustomized: (code: string) => void }) {
  const { data: allPerms = [], isLoading } = useHospitalPermissions();
  const { data: currentPerms = [], isLoading: currentLoading } = useRolePermissions(role.id);
  const updatePerms = useUpdateRolePermissions();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [query, setQuery] = useState('');

  // Pre-populate from the role's ACTUAL current grants whenever the selected role changes (or
  // its permissions finish loading) — without this, opening a role and hitting Save with no
  // changes would silently wipe its permissions to nothing.
  useEffect(() => {
    setSelected(new Set(currentPerms.map((p) => p.code)));
  }, [role.id, currentPerms]);

  const grouped = useMemo(() => {
    const q = query.trim().toLowerCase();
    const g: Record<string, HospitalPermissionOption[]> = {};
    for (const p of allPerms) {
      if (q && !`${p.module} ${p.action} ${p.name} ${p.code}`.toLowerCase().includes(q)) continue;
      (g[p.module] ??= []).push(p);
    }
    return g;
  }, [allPerms, query]);

  if (isLoading || currentLoading) {
    return <Card><CardContent className="p-6 flex justify-center"><Loader2 className="h-5 w-5 animate-spin text-primary" /></CardContent></Card>;
  }

  const toggle = (code: string) => {
    if (!canManage) return;
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(code) ? next.delete(code) : next.add(code);
      return next;
    });
  };

  const moduleAllOn = (mod: string) => grouped[mod].every((p) => selected.has(p.code));
  const toggleModule = (mod: string) => {
    if (!canManage) return;
    setSelected((prev) => {
      const next = new Set(prev);
      const allOn = grouped[mod].every((p) => next.has(p.code));
      for (const p of grouped[mod]) (allOn ? next.delete(p.code) : next.add(p.code));
      return next;
    });
  };

  const handleSave = async () => {
    try {
      const effective = await updatePerms.mutateAsync({ role, permissionCodes: Array.from(selected) });
      if (effective.code !== role.code || effective.id !== role.id) onCustomized(effective.code);
      toast.success(
        role.is_system_role
          ? 'Permissions saved for this tenant — the global role and other tenants are unaffected.'
          : 'Permissions updated.',
      );
    } catch (e) {
      toast.error(await apiErrorMessage(e, 'Failed to update permissions'));
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0">
            <span className="font-bold text-sm">Permission matrix</span>
            <span className="ml-2 text-xs text-muted-foreground">· {role.name} ({selected.size} granted)</span>
            {role.is_system_role && (
              <p className="text-[11px] text-amber-600 flex items-center gap-1 mt-0.5">
                <Lock className="h-3 w-3" /> Global role — saving customizes it for THIS tenant only, other tenants are unaffected.
              </p>
            )}
          </div>
          {canManage && (
            <Button size="sm" disabled={updatePerms.isPending} onClick={handleSave}>
              {updatePerms.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Save className="h-3.5 w-3.5 mr-1" /> Save</>}
            </Button>
          )}
        </div>
        <div className="relative mt-2">
          <Search className="h-3.5 w-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input className={`${inputCls} pl-8`} placeholder="Search permissions…" value={query} onChange={(e) => setQuery(e.target.value)} />
        </div>
      </CardHeader>
      <CardContent className="space-y-4 max-h-[55vh] overflow-y-auto">
        {Object.keys(grouped).sort().map((mod) => (
          <div key={mod}>
            <div className="flex items-center justify-between mb-1.5">
              <p className="text-xs font-bold uppercase tracking-wider text-primary">{mod.replace(/_/g, ' ')}</p>
              {canManage && (
                <button type="button" onClick={() => toggleModule(mod)} className="text-[10px] text-muted-foreground hover:text-primary">
                  {moduleAllOn(mod) ? 'Clear all' : 'Select all'}
                </button>
              )}
            </div>
            <div className="grid sm:grid-cols-2 gap-1.5">
              {grouped[mod].map((p) => {
                const on = selected.has(p.code);
                return (
                  <button
                    key={p.code} type="button" disabled={!canManage} onClick={() => toggle(p.code)}
                    className={`flex items-center justify-between gap-2 p-2 rounded-lg border text-left text-sm ${on ? 'border-primary/40 bg-primary/5' : 'border-border bg-card'} ${canManage ? '' : 'opacity-60 cursor-not-allowed'}`}
                    title={p.code}
                  >
                    <span className="truncate">{p.name || actionLabel(p.action)}</span>
                    <span className={`h-4 w-4 rounded-full shrink-0 ${on ? 'bg-primary' : 'bg-muted'}`} />
                  </button>
                );
              })}
            </div>
          </div>
        ))}
        {Object.keys(grouped).length === 0 && <p className="text-sm text-muted-foreground">No permissions match your search.</p>}
      </CardContent>
    </Card>
  );
}
