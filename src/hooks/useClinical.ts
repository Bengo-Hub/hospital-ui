'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useParams } from 'next/navigation';
import {
  patientsApi, visitsApi, triageApi, examinationApi, diagnosisCatalogApi, referralsApi,
  type RegisterPatientInput, type CheckInVisitInput, type RecordTriageInput,
  type RecordExaminationInput, type ReferredTo,
} from '@/lib/api/clinical';

function useOrgSlug(): string {
  const params = useParams();
  return (params?.orgSlug as string) ?? '';
}

// ── Patients ─────────────────────────────────────────────────────────────────────────────

export function usePatients(q?: string) {
  const orgSlug = useOrgSlug();
  return useQuery({
    queryKey: ['hospital', 'patients', orgSlug, q],
    queryFn: () => patientsApi.list(orgSlug, q),
    enabled: !!orgSlug,
  });
}

export function usePatient(patientId?: string) {
  const orgSlug = useOrgSlug();
  return useQuery({
    queryKey: ['hospital', 'patients', orgSlug, patientId],
    queryFn: () => patientsApi.get(orgSlug, patientId as string),
    enabled: !!orgSlug && !!patientId,
  });
}

export function useRegisterPatient() {
  const orgSlug = useOrgSlug();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: RegisterPatientInput) => patientsApi.register(orgSlug, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['hospital', 'patients', orgSlug] }),
  });
}

// ── Visits ───────────────────────────────────────────────────────────────────────────────

export function useVisits(status?: string) {
  const orgSlug = useOrgSlug();
  return useQuery({
    queryKey: ['hospital', 'visits', orgSlug, status],
    queryFn: () => visitsApi.list(orgSlug, status),
    enabled: !!orgSlug,
    refetchInterval: 15000,
  });
}

export function useVisit(visitId?: string) {
  const orgSlug = useOrgSlug();
  return useQuery({
    queryKey: ['hospital', 'visits', orgSlug, visitId],
    queryFn: () => visitsApi.get(orgSlug, visitId as string),
    enabled: !!orgSlug && !!visitId,
  });
}

export function useCheckInVisit() {
  const orgSlug = useOrgSlug();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CheckInVisitInput) => visitsApi.checkIn(orgSlug, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['hospital', 'visits', orgSlug] }),
  });
}

// ── Triage ───────────────────────────────────────────────────────────────────────────────

export function useRecordTriage() {
  const orgSlug = useOrgSlug();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ visitId, data }: { visitId: string; data: RecordTriageInput }) =>
      triageApi.record(orgSlug, visitId, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['hospital', 'visits', orgSlug] }),
  });
}

// ── Consultation / Examination ──────────────────────────────────────────────────────────

export function useRecordExamination() {
  const orgSlug = useOrgSlug();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ visitId, data }: { visitId: string; data: RecordExaminationInput }) =>
      examinationApi.record(orgSlug, visitId, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['hospital', 'visits', orgSlug] }),
  });
}

// ── Diagnosis Catalog ────────────────────────────────────────────────────────────────────

export function useDiagnosisCatalog() {
  const orgSlug = useOrgSlug();
  return useQuery({
    queryKey: ['hospital', 'diagnosis-catalog', orgSlug],
    queryFn: () => diagnosisCatalogApi.list(orgSlug),
    enabled: !!orgSlug,
    staleTime: 5 * 60 * 1000,
  });
}

export function useCreateDiagnosisEntry() {
  const orgSlug = useOrgSlug();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { code: string; name: string; category?: string }) => diagnosisCatalogApi.create(orgSlug, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['hospital', 'diagnosis-catalog', orgSlug] }),
  });
}

// ── Referrals ────────────────────────────────────────────────────────────────────────────

export function useCreateReferral() {
  const orgSlug = useOrgSlug();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ visitId, referredTo, reason }: { visitId: string; referredTo: ReferredTo; reason?: string }) =>
      referralsApi.create(orgSlug, visitId, { referred_to: referredTo, reason }),
    onSuccess: (_res, { visitId }) => {
      qc.invalidateQueries({ queryKey: ['hospital', 'visits', orgSlug] });
      qc.invalidateQueries({ queryKey: ['hospital', 'referrals', orgSlug, visitId] });
    },
  });
}

export function useReferrals(visitId?: string) {
  const orgSlug = useOrgSlug();
  return useQuery({
    queryKey: ['hospital', 'referrals', orgSlug, visitId],
    queryFn: () => referralsApi.list(orgSlug, visitId as string),
    enabled: !!orgSlug && !!visitId,
  });
}
