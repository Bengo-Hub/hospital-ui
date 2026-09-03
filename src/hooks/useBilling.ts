'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useParams } from 'next/navigation';
import {
  billingApi,
  type CollectChargeInput,
  type SubmitInsuranceClaimInput,
  type CreateBillableItemInput,
  type UpdateBillableItemInput,
  type CreateNextOfKinInput,
} from '@/lib/api/billing';

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

export function useAccountByAdmission(admissionId?: string) {
  const orgSlug = useOrgSlug();
  return useQuery({
    queryKey: ['hospital', 'admission-account', orgSlug, admissionId],
    queryFn: () => billingApi.getAccountByAdmission(orgSlug, admissionId as string),
    enabled: !!orgSlug && !!admissionId,
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
      qc.invalidateQueries({ queryKey: ['hospital', 'admission-account', orgSlug] });
    },
  });
}

export function useIssueRefund() {
  const orgSlug = useOrgSlug();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ chargeId, reason }: { chargeId: string; reason?: string }) =>
      billingApi.issueRefund(orgSlug, chargeId, reason),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['hospital', 'account', orgSlug] });
      qc.invalidateQueries({ queryKey: ['hospital', 'admission-account', orgSlug] });
    },
  });
}

export function useSettleAccount() {
  const orgSlug = useOrgSlug();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ accountId, data }: { accountId: string; data: CollectChargeInput & { next_of_kin_id?: string } }) =>
      billingApi.settleAccount(orgSlug, accountId, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['hospital', 'account', orgSlug] });
      qc.invalidateQueries({ queryKey: ['hospital', 'admission-account', orgSlug] });
    },
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

// ── Insurance ────────────────────────────────────────────────────────────────────────────────

/** Shared provider picker source — Lab/Pharmacy/Billing's insurance-claim UI all use this. */
export function useInsuranceProviders() {
  const orgSlug = useOrgSlug();
  return useQuery({
    queryKey: ['hospital', 'insurance-providers', orgSlug],
    queryFn: () => billingApi.listInsuranceProviders(orgSlug),
    enabled: !!orgSlug,
    staleTime: 5 * 60_000,
  });
}

export function useCheckEligibility() {
  const orgSlug = useOrgSlug();
  return useMutation({
    mutationFn: ({ visitId, providerId, fields }: { visitId: string; providerId: string; fields?: Record<string, string> }) =>
      billingApi.checkEligibility(orgSlug, visitId, providerId, fields),
  });
}

export function useSubmitVisitInsuranceClaim() {
  const orgSlug = useOrgSlug();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ visitId, data }: { visitId: string; data: SubmitInsuranceClaimInput }) =>
      billingApi.submitInsuranceClaim(orgSlug, visitId, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['hospital', 'account', orgSlug] }),
  });
}

export function usePollInsuranceClaim(claimId?: string, enabled = false) {
  const orgSlug = useOrgSlug();
  return useQuery({
    queryKey: ['hospital', 'insurance-claim', orgSlug, claimId],
    queryFn: () => billingApi.pollInsuranceClaim(orgSlug, claimId as string),
    enabled: !!orgSlug && !!claimId && enabled,
  });
}

// ── Billable Item Catalog admin ─────────────────────────────────────────────────────────────

export function useBillableItemCatalog(includeInactive = false) {
  const orgSlug = useOrgSlug();
  return useQuery({
    queryKey: ['hospital', 'billing-catalog', orgSlug, includeInactive],
    queryFn: () => billingApi.listCatalog(orgSlug, includeInactive),
    enabled: !!orgSlug,
  });
}

export function useCreateCatalogItem() {
  const orgSlug = useOrgSlug();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateBillableItemInput) => billingApi.createCatalogItem(orgSlug, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['hospital', 'billing-catalog', orgSlug] }),
  });
}

export function useUpdateCatalogItem() {
  const orgSlug = useOrgSlug();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ itemId, data }: { itemId: string; data: UpdateBillableItemInput }) =>
      billingApi.updateCatalogItem(orgSlug, itemId, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['hospital', 'billing-catalog', orgSlug] }),
  });
}

export function useDeactivateCatalogItem() {
  const orgSlug = useOrgSlug();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (itemId: string) => billingApi.deactivateCatalogItem(orgSlug, itemId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['hospital', 'billing-catalog', orgSlug] }),
  });
}

// ── PatientNextOfKin ─────────────────────────────────────────────────────────────────────────

export function useNextOfKin(patientId?: string) {
  const orgSlug = useOrgSlug();
  return useQuery({
    queryKey: ['hospital', 'next-of-kin', orgSlug, patientId],
    queryFn: () => billingApi.listNextOfKin(orgSlug, patientId as string),
    enabled: !!orgSlug && !!patientId,
  });
}

export function useCreateNextOfKin() {
  const orgSlug = useOrgSlug();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ patientId, data }: { patientId: string; data: CreateNextOfKinInput }) =>
      billingApi.createNextOfKin(orgSlug, patientId, data),
    onSuccess: (_res, { patientId }) =>
      qc.invalidateQueries({ queryKey: ['hospital', 'next-of-kin', orgSlug, patientId] }),
  });
}
