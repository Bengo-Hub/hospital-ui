'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useParams } from 'next/navigation';
import { usersApi, configApi, outletsApi } from '@/lib/api/users';

function useOrgSlug(): string {
  const params = useParams();
  return (params?.orgSlug as string) ?? '';
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

export function useSetUserRole() {
  const orgSlug = useOrgSlug();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, roleCode }: { userId: string; roleCode: string }) =>
      usersApi.setRole(orgSlug, userId, roleCode),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hospital', 'users', orgSlug] });
    },
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

export function useHospitalOutlets() {
  const orgSlug = useOrgSlug();
  return useQuery({
    queryKey: ['hospital', 'outlets', orgSlug],
    queryFn: () => outletsApi.list(orgSlug),
    enabled: !!orgSlug,
    staleTime: 5 * 60_000,
  });
}
