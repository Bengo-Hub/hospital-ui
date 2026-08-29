'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useParams } from 'next/navigation';
import { billingApi, type CollectChargeInput } from '@/lib/api/billing';

function useOrgSlug(): string {
  const params = useParams();
  return (params?.orgSlug as string) ?? '';
}

export function useAccountByVisit(visitId?: string) {
  const orgSlug = useOrgSlug();
  return useQuery({
    queryKey: ['hospital', 'account', orgSlug, visitId],
    queryFn: () => billingApi.getAccountByVisit(orgSlug, visitId as string),
    enabled: !!orgSlug && !!visitId,
  });
}

export function usePendingCharges(department?: string) {
  const orgSlug = useOrgSlug();
  return useQuery({
    queryKey: ['hospital', 'billing-queue', orgSlug, department],
    queryFn: () => billingApi.listPendingCharges(orgSlug, department),
    enabled: !!orgSlug,
    refetchInterval: 15000,
  });
}

export function useCollectCharge() {
  const orgSlug = useOrgSlug();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ chargeId, data }: { chargeId: string; data: CollectChargeInput }) =>
      billingApi.collectCharge(orgSlug, chargeId, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['hospital', 'billing-queue', orgSlug] });
      qc.invalidateQueries({ queryKey: ['hospital', 'account', orgSlug] });
    },
  });
}

export function useSettleAccount() {
  const orgSlug = useOrgSlug();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ accountId, data }: { accountId: string; data: CollectChargeInput & { next_of_kin_id?: string } }) =>
      billingApi.settleAccount(orgSlug, accountId, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['hospital', 'account', orgSlug] }),
  });
}

export function useOverrideSettlement() {
  const orgSlug = useOrgSlug();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ accountId, reason }: { accountId: string; reason: string }) =>
      billingApi.overrideSettlement(orgSlug, accountId, reason),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['hospital', 'account', orgSlug] }),
  });
}
