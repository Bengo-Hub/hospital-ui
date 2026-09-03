'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useParams } from 'next/navigation';
import { usersApi, configApi, outletsApi, userOutletsApi, type InviteMemberInput, type HospitalConfigSettings } from '@/lib/api/users';

function useOrgSlug(): string {
  const params = useParams();
  return (params?.orgSlug as string) ?? '';
}

function useInvalidateUsers() {
  const orgSlug = useOrgSlug();
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: ['hospital', 'users', orgSlug] });
}

function useInvalidateRoles() {
  const orgSlug = useOrgSlug();
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: ['hospital', 'roles', orgSlug] });
}

export function useHospitalUsers() {
  const orgSlug = useOrgSlug();
  return useQuery({
    queryKey: ['hospital', 'users', orgSlug],
    queryFn: () => usersApi.list(orgSlug),
    enabled: !!orgSlug,
  });
}

export function useHospitalRoles() {
  const orgSlug = useOrgSlug();
  return useQuery({
    queryKey: ['hospital', 'roles', orgSlug],
    queryFn: () => usersApi.listRoles(orgSlug),
    enabled: !!orgSlug,
  });
}

export function useHospitalPermissions() {
  const orgSlug = useOrgSlug();
  return useQuery({
    queryKey: ['hospital', 'permissions', orgSlug],
    queryFn: () => usersApi.listPermissions(orgSlug),
    enabled: !!orgSlug,
    staleTime: 5 * 60_000,
  });
}

export function useRolePermissions(roleId: string | undefined) {
  const orgSlug = useOrgSlug();
  return useQuery({
    queryKey: ['hospital', 'role-permissions', orgSlug, roleId],
    queryFn: () => usersApi.getRolePermissions(orgSlug, roleId as string),
    enabled: !!orgSlug && !!roleId,
  });
}

export function useSetUserRole() {
  const orgSlug = useOrgSlug();
  const invalidateUsers = useInvalidateUsers();
  return useMutation({
    mutationFn: ({ userId, roleCode }: { userId: string; roleCode: string }) =>
      usersApi.setRole(orgSlug, userId, roleCode),
    onSuccess: invalidateUsers,
  });
}

export function useSetUserStatus() {
  const orgSlug = useOrgSlug();
  const invalidateUsers = useInvalidateUsers();
  return useMutation({
    mutationFn: ({ userId, status }: { userId: string; status: string }) =>
      usersApi.setStatus(orgSlug, userId, status),
    onSuccess: invalidateUsers,
  });
}

export function useUpdateProfessionalRegistration() {
  const orgSlug = useOrgSlug();
  const invalidateUsers = useInvalidateUsers();
  return useMutation({
    mutationFn: ({ userId, data }: { userId: string; data: { professional_registration_number?: string; professional_registration_body?: string } }) =>
      usersApi.updateProfessionalRegistration(orgSlug, userId, data),
    onSuccess: invalidateUsers,
  });
}

export function useInviteMember() {
  const orgSlug = useOrgSlug();
  const invalidateUsers = useInvalidateUsers();
  return useMutation({
    mutationFn: (input: InviteMemberInput) => usersApi.invite(orgSlug, input),
    onSuccess: invalidateUsers,
  });
}

export function useAssignExtraRole() {
  const orgSlug = useOrgSlug();
  const invalidateUsers = useInvalidateUsers();
  return useMutation({
    mutationFn: ({ userId, roleCode }: { userId: string; roleCode: string }) =>
      usersApi.assignExtraRole(orgSlug, userId, roleCode),
    onSuccess: invalidateUsers,
  });
}

export function useRevokeExtraRole() {
  const orgSlug = useOrgSlug();
  const invalidateUsers = useInvalidateUsers();
  return useMutation({
    mutationFn: ({ userId, roleCode }: { userId: string; roleCode: string }) =>
      usersApi.revokeExtraRole(orgSlug, userId, roleCode),
    onSuccess: invalidateUsers,
  });
}

/** Edits a role's permission matrix. If the role is still global (not yet customized for this
 *  tenant), transparently clones it first (rbac.Service.CustomizeRole is idempotent) so the
 *  caller gets a single-click "Save" the same way pos-ui's RolesPanel does — the frontend never
 *  needs a separate explicit "customize" step. Returns the effective role (the clone, if one was
 *  created) so the caller can re-point its selection at it. */
export function useUpdateRolePermissions() {
  const orgSlug = useOrgSlug();
  const invalidateRoles = useInvalidateRoles();
  return useMutation({
    mutationFn: async ({
      role, permissionCodes,
    }: { role: { id: string; code: string; is_custom: boolean }; permissionCodes: string[] }) => {
      const target = role.is_custom ? role : await usersApi.customizeRole(orgSlug, role.code);
      await usersApi.updateRolePermissions(orgSlug, target.id, permissionCodes);
      return target;
    },
    onSuccess: invalidateRoles,
  });
}

export function useCreateRole() {
  const orgSlug = useOrgSlug();
  const invalidateRoles = useInvalidateRoles();
  return useMutation({
    mutationFn: (input: { role_code: string; name: string; description?: string; permission_codes: string[] }) =>
      usersApi.createRole(orgSlug, input),
    onSuccess: invalidateRoles,
  });
}

export function useDeleteRole() {
  const orgSlug = useOrgSlug();
  const invalidateRoles = useInvalidateRoles();
  return useMutation({
    mutationFn: (roleId: string) => usersApi.deleteRole(orgSlug, roleId),
    onSuccess: invalidateRoles,
  });
}

export function useUserOutlets(userId: string) {
  const orgSlug = useOrgSlug();
  return useQuery({
    queryKey: ['hospital', 'user-outlets', orgSlug, userId],
    queryFn: () => userOutletsApi.list(orgSlug, userId),
    enabled: !!orgSlug && !!userId,
  });
}

export function useAssignUserOutlet() {
  const orgSlug = useOrgSlug();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, outletId, isHomeOutlet }: { userId: string; outletId: string; isHomeOutlet: boolean }) =>
      userOutletsApi.assign(orgSlug, userId, outletId, isHomeOutlet),
    onSuccess: (_data, vars) => queryClient.invalidateQueries({ queryKey: ['hospital', 'user-outlets', orgSlug, vars.userId] }),
  });
}

export function useRemoveUserOutlet() {
  const orgSlug = useOrgSlug();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, outletId }: { userId: string; outletId: string }) =>
      userOutletsApi.remove(orgSlug, userId, outletId),
    onSuccess: (_data, vars) => queryClient.invalidateQueries({ queryKey: ['hospital', 'user-outlets', orgSlug, vars.userId] }),
  });
}

export function useHospitalConfig() {
  const orgSlug = useOrgSlug();
  return useQuery({
    queryKey: ['hospital', 'config', orgSlug],
    queryFn: () => configApi.get(orgSlug),
    enabled: !!orgSlug,
    staleTime: 5 * 60_000,
  });
}

export function useUpdateConfig() {
  const orgSlug = useOrgSlug();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (updates: HospitalConfigSettings) => configApi.update(orgSlug, updates),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['hospital', 'config', orgSlug] }),
  });
}

export function useHospitalOutlets() {
  const orgSlug = useOrgSlug();
  return useQuery({
    queryKey: ['hospital', 'outlets', orgSlug],
    queryFn: () => outletsApi.list(orgSlug),
    enabled: !!orgSlug,
    staleTime: 5 * 60_000,
  });
}
