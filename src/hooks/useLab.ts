'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useParams } from 'next/navigation';
import { labApi, type CreateLabOrderInput, type EnterResultInput } from '@/lib/api/lab';

function useOrgSlug(): string {
  const params = useParams();
  return (params?.orgSlug as string) ?? '';
}

export function useLabWorklist(status?: string) {
  const orgSlug = useOrgSlug();
  return useQuery({
    queryKey: ['hospital', 'lab-orders', orgSlug, status],
    queryFn: () => labApi.listWorklist(orgSlug, status),
    enabled: !!orgSlug,
    refetchInterval: 15000,
  });
}

export function useLabOrder(orderId?: string) {
  const orgSlug = useOrgSlug();
  return useQuery({
    queryKey: ['hospital', 'lab-orders', orgSlug, orderId],
    queryFn: () => labApi.getOrder(orgSlug, orderId as string),
    enabled: !!orgSlug && !!orderId,
  });
}

export function useLabTestCatalog() {
  const orgSlug = useOrgSlug();
  return useQuery({
    queryKey: ['hospital', 'lab-test-catalog', orgSlug],
    queryFn: () => labApi.listCatalog(orgSlug),
    enabled: !!orgSlug,
    staleTime: 5 * 60 * 1000,
  });
}

export function useCreateLabOrder() {
  const orgSlug = useOrgSlug();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateLabOrderInput) => labApi.createOrder(orgSlug, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['hospital', 'lab-orders', orgSlug] }),
  });
}

export function useActivateLabOrder() {
  const orgSlug = useOrgSlug();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (orderId: string) => labApi.activateIfPaid(orgSlug, orderId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['hospital', 'lab-orders', orgSlug] }),
  });
}

export function useEnterLabResult() {
  const orgSlug = useOrgSlug();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ lineId, data }: { lineId: string; data: EnterResultInput }) =>
      labApi.enterResult(orgSlug, lineId, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['hospital', 'lab-orders', orgSlug] }),
  });
}
