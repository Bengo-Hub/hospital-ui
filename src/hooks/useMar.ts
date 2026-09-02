'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useParams } from 'next/navigation';
import { marApi, type ChartDoseInput } from '@/lib/api/mar';

function useOrgSlug(): string {
  const params = useParams();
  return (params?.orgSlug as string) ?? '';
}

export function useMedicationAdministrations(admissionId?: string) {
  const orgSlug = useOrgSlug();
  return useQuery({
    queryKey: ['hospital', 'mar', orgSlug, admissionId],
    queryFn: () => marApi.listByAdmission(orgSlug, admissionId as string),
    enabled: !!orgSlug && !!admissionId,
  });
}

export function useActivePrescriptionsForMar(admissionId?: string) {
  const orgSlug = useOrgSlug();
  return useQuery({
    queryKey: ['hospital', 'mar-prescriptions', orgSlug, admissionId],
    queryFn: () => marApi.listActivePrescriptions(orgSlug, admissionId as string),
    enabled: !!orgSlug && !!admissionId,
  });
}

export function useChartDose() {
  const orgSlug = useOrgSlug();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ admissionId, data }: { admissionId: string; data: ChartDoseInput }) =>
      marApi.chartDose(orgSlug, admissionId, data),
    onSuccess: (_result, { admissionId }) =>
      qc.invalidateQueries({ queryKey: ['hospital', 'mar', orgSlug, admissionId] }),
  });
}
