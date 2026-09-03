'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useParams } from 'next/navigation';
import {
  inpatientApi,
  type AdmissionStatus,
  type AdmitInput,
  type BedStatus,
  type CreateBedInput,
  type CreateWardInput,
  type DischargeInput,
  type IsolationPrecaution,
  type RecordVitalsChartInput,
  type RecordWardRoundInput,
  type RenameBedInput,
  type TransferInput,
} from '@/lib/api/inpatient';

function useOrgSlug(): string {
  const params = useParams();
  return (params?.orgSlug as string) ?? '';
}

function invalidateInpatient(qc: ReturnType<typeof useQueryClient>, orgSlug: string) {
  qc.invalidateQueries({ queryKey: ['hospital', 'wards', orgSlug] });
  qc.invalidateQueries({ queryKey: ['hospital', 'ward-occupancy', orgSlug] });
  qc.invalidateQueries({ queryKey: ['hospital', 'admissions', orgSlug] });
  qc.invalidateQueries({ queryKey: ['hospital', 'admission', orgSlug] });
  qc.invalidateQueries({ queryKey: ['hospital', 'admission-account', orgSlug] });
}

// ── Wards / Beds ─────────────────────────────────────────────────────────────────────────────

export function useWards() {
  const orgSlug = useOrgSlug();
  return useQuery({
    queryKey: ['hospital', 'wards', orgSlug],
    queryFn: () => inpatientApi.listWards(orgSlug),
    enabled: !!orgSlug,
  });
}

export function useWardOccupancy(wardId?: string) {
  const orgSlug = useOrgSlug();
  return useQuery({
    queryKey: ['hospital', 'ward-occupancy', orgSlug, wardId],
    queryFn: () => inpatientApi.getWardOccupancy(orgSlug, wardId as string),
    enabled: !!orgSlug && !!wardId,
    refetchInterval: 15000,
  });
}

export function useCreateWard() {
  const orgSlug = useOrgSlug();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateWardInput) => inpatientApi.createWard(orgSlug, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['hospital', 'wards', orgSlug] }),
  });
}

export function useCreateBed() {
  const orgSlug = useOrgSlug();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ wardId, data }: { wardId: string; data: CreateBedInput }) => inpatientApi.createBed(orgSlug, wardId, data),
    onSuccess: () => invalidateInpatient(qc, orgSlug),
  });
}

export function useSetBedStatus() {
  const orgSlug = useOrgSlug();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ bedId, status }: { bedId: string; status: BedStatus }) => inpatientApi.setBedStatus(orgSlug, bedId, status),
    onSuccess: () => invalidateInpatient(qc, orgSlug),
  });
}

export function useSetBedIsolationPrecaution() {
  const orgSlug = useOrgSlug();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ bedId, isolationPrecaution }: { bedId: string; isolationPrecaution: IsolationPrecaution }) =>
      inpatientApi.setBedIsolationPrecaution(orgSlug, bedId, isolationPrecaution),
    onSuccess: () => invalidateInpatient(qc, orgSlug),
  });
}

export function useRenameBed() {
  const orgSlug = useOrgSlug();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ bedId, data }: { bedId: string; data: RenameBedInput }) => inpatientApi.renameBed(orgSlug, bedId, data),
    onSuccess: () => invalidateInpatient(qc, orgSlug),
  });
}

// ── Admissions ───────────────────────────────────────────────────────────────────────────────

export function useAdmissions(status?: AdmissionStatus) {
  const orgSlug = useOrgSlug();
  return useQuery({
    queryKey: ['hospital', 'admissions', orgSlug, status],
    queryFn: () => inpatientApi.listAdmissions(orgSlug, status),
    enabled: !!orgSlug,
    refetchInterval: 15000,
  });
}

export function useAdmission(admissionId?: string) {
  const orgSlug = useOrgSlug();
  return useQuery({
    queryKey: ['hospital', 'admission', orgSlug, admissionId],
    queryFn: () => inpatientApi.getAdmission(orgSlug, admissionId as string),
    enabled: !!orgSlug && !!admissionId,
  });
}

export function useAdmit() {
  const orgSlug = useOrgSlug();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: AdmitInput) => inpatientApi.admit(orgSlug, data),
    onSuccess: () => invalidateInpatient(qc, orgSlug),
  });
}

export function useTransfer() {
  const orgSlug = useOrgSlug();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ admissionId, data }: { admissionId: string; data: TransferInput }) =>
      inpatientApi.transfer(orgSlug, admissionId, data),
    // onSettled (not onSuccess): an inter-facility transfer that's blocked on an outstanding
    // balance still commits its ward-charge posting server-side before returning 409 — the
    // account panel must refresh even on a "failed" attempt so the newly-posted charge is visible.
    onSettled: () => invalidateInpatient(qc, orgSlug),
  });
}

export function useDischarge() {
  const orgSlug = useOrgSlug();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ admissionId, data }: { admissionId: string; data: DischargeInput }) =>
      inpatientApi.discharge(orgSlug, admissionId, data),
    // onSettled: see useTransfer's identical comment — Discharge's first (blocked) attempt still
    // posts the real ward/day-rate charge before the 409, so the UI must refresh regardless of
    // whether this call ultimately succeeded.
    onSettled: () => invalidateInpatient(qc, orgSlug),
  });
}

export function useTransferHistory(admissionId?: string) {
  const orgSlug = useOrgSlug();
  return useQuery({
    queryKey: ['hospital', 'transfers', orgSlug, admissionId],
    queryFn: () => inpatientApi.listTransfers(orgSlug, admissionId as string),
    enabled: !!orgSlug && !!admissionId,
  });
}

// ── Nursing vitals chart / doctor's ward rounds ─────────────────────────────────────────────

export function useVitalsChart(admissionId?: string) {
  const orgSlug = useOrgSlug();
  return useQuery({
    queryKey: ['hospital', 'vitals-chart', orgSlug, admissionId],
    queryFn: () => inpatientApi.listVitalsChart(orgSlug, admissionId as string),
    enabled: !!orgSlug && !!admissionId,
  });
}

export function useRecordVitalsChart() {
  const orgSlug = useOrgSlug();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ admissionId, data }: { admissionId: string; data: RecordVitalsChartInput }) =>
      inpatientApi.recordVitalsChart(orgSlug, admissionId, data),
    onSuccess: (_r, { admissionId }) => qc.invalidateQueries({ queryKey: ['hospital', 'vitals-chart', orgSlug, admissionId] }),
  });
}

export function useWardRounds(admissionId?: string) {
  const orgSlug = useOrgSlug();
  return useQuery({
    queryKey: ['hospital', 'ward-rounds', orgSlug, admissionId],
    queryFn: () => inpatientApi.listWardRounds(orgSlug, admissionId as string),
    enabled: !!orgSlug && !!admissionId,
  });
}

export function useRecordWardRound() {
  const orgSlug = useOrgSlug();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ admissionId, data }: { admissionId: string; data: RecordWardRoundInput }) =>
      inpatientApi.recordWardRound(orgSlug, admissionId, data),
    onSuccess: (_r, { admissionId }) => qc.invalidateQueries({ queryKey: ['hospital', 'ward-rounds', orgSlug, admissionId] }),
  });
}
