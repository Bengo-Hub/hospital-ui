'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useParams } from 'next/navigation';
import { pharmacyApi, type CreatePrescriptionInput, type DispenseInput } from '@/lib/api/pharmacy';

function useOrgSlug(): string {
  const params = useParams();
  return (params?.orgSlug as string) ?? '';
}

export function usePrescriptions(status?: string) {
  const orgSlug = useOrgSlug();
  return useQuery({
    queryKey: ['hospital', 'prescriptions', orgSlug, status],
    queryFn: () => pharmacyApi.list(orgSlug, status),
    enabled: !!orgSlug,
    refetchInterval: 15000,
  });
}

export function usePrescription(id?: string) {
  const orgSlug = useOrgSlug();
  return useQuery({
    queryKey: ['hospital', 'prescriptions', orgSlug, id],
    queryFn: () => pharmacyApi.get(orgSlug, id as string),
    enabled: !!orgSlug && !!id,
  });
}

export function useControlledSubstanceLogs() {
  const orgSlug = useOrgSlug();
  return useQuery({
    queryKey: ['hospital', 'controlled-substances', orgSlug],
    queryFn: () => pharmacyApi.listControlledSubstanceLogs(orgSlug),
    enabled: !!orgSlug,
  });
}

export function useCreatePrescription() {
  const orgSlug = useOrgSlug();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreatePrescriptionInput) => pharmacyApi.create(orgSlug, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['hospital', 'prescriptions', orgSlug] }),
  });
}

function useRxAction(action: (orgSlug: string, id: string, arg?: string) => Promise<unknown>) {
  const orgSlug = useOrgSlug();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, arg }: { id: string; arg?: string }) => action(orgSlug, id, arg),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['hospital', 'prescriptions', orgSlug] }),
  });
}

export function useApprovePrescription() {
  return useRxAction((orgSlug, id, overrideReason) => pharmacyApi.approve(orgSlug, id, overrideReason));
}

export function useLockPrescription() {
  return useRxAction((orgSlug, id) => pharmacyApi.lock(orgSlug, id));
}

export function useRejectPrescription() {
  return useRxAction((orgSlug, id, reason) => pharmacyApi.reject(orgSlug, id, reason));
}

export function useCancelPrescription() {
  return useRxAction((orgSlug, id, reason) => pharmacyApi.cancel(orgSlug, id, reason));
}

export function useDispensePrescription() {
  const orgSlug = useOrgSlug();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: DispenseInput }) => pharmacyApi.dispense(orgSlug, id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['hospital', 'prescriptions', orgSlug] });
      qc.invalidateQueries({ queryKey: ['hospital', 'controlled-substances', orgSlug] });
    },
  });
}
