'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useParams } from 'next/navigation';
import {
  theatreApi,
  type AdmitToPacuInput,
  type AssignStaffInput,
  type CreateBookingInput,
  type DischargeFromPacuInput,
  type OperativeNoteInput,
  type UpdateBookingInput,
} from '@/lib/api/theatre';

function useOrgSlug(): string {
  const params = useParams();
  return (params?.orgSlug as string) ?? '';
}

function invalidateTheatre(qc: ReturnType<typeof useQueryClient>, orgSlug: string) {
  qc.invalidateQueries({ queryKey: ['hospital', 'theatre-schedule', orgSlug] });
  qc.invalidateQueries({ queryKey: ['hospital', 'theatre-booking', orgSlug] });
  qc.invalidateQueries({ queryKey: ['hospital', 'billing-queue', orgSlug] });
}

export function useTheatreSchedule(date?: string) {
  const orgSlug = useOrgSlug();
  return useQuery({
    queryKey: ['hospital', 'theatre-schedule', orgSlug, date],
    queryFn: () => theatreApi.listSchedule(orgSlug, date),
    enabled: !!orgSlug,
    refetchInterval: 15000,
  });
}

export function useTheatreBooking(bookingId?: string) {
  const orgSlug = useOrgSlug();
  return useQuery({
    queryKey: ['hospital', 'theatre-booking', orgSlug, bookingId],
    queryFn: () => theatreApi.getBooking(orgSlug, bookingId as string),
    enabled: !!orgSlug && !!bookingId,
  });
}

export function useCreateBooking() {
  const orgSlug = useOrgSlug();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateBookingInput) => theatreApi.createBooking(orgSlug, data),
    onSettled: () => invalidateTheatre(qc, orgSlug),
  });
}

export function useUpdateBooking() {
  const orgSlug = useOrgSlug();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ bookingId, data }: { bookingId: string; data: UpdateBookingInput }) => theatreApi.updateBooking(orgSlug, bookingId, data),
    onSettled: () => invalidateTheatre(qc, orgSlug),
  });
}

export function useActivateBooking() {
  const orgSlug = useOrgSlug();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (bookingId: string) => theatreApi.activateIfPaid(orgSlug, bookingId),
    onSettled: () => invalidateTheatre(qc, orgSlug),
  });
}

export function useUpdateChecklist() {
  const orgSlug = useOrgSlug();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ bookingId, checklist }: { bookingId: string; checklist: Record<string, boolean> }) =>
      theatreApi.updateChecklist(orgSlug, bookingId, checklist),
    onSuccess: () => invalidateTheatre(qc, orgSlug),
  });
}

export function useStartSurgery() {
  const orgSlug = useOrgSlug();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (bookingId: string) => theatreApi.startSurgery(orgSlug, bookingId),
    onSuccess: () => invalidateTheatre(qc, orgSlug),
  });
}

export function useCompleteSurgery() {
  const orgSlug = useOrgSlug();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (bookingId: string) => theatreApi.completeSurgery(orgSlug, bookingId),
    onSuccess: () => invalidateTheatre(qc, orgSlug),
  });
}

export function useCancelBooking() {
  const orgSlug = useOrgSlug();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (bookingId: string) => theatreApi.cancelBooking(orgSlug, bookingId),
    onSettled: () => invalidateTheatre(qc, orgSlug),
  });
}

// ── Surgical team assignment ─────────────────────────────────────────────────────────────────

export function useStaffAssignments(bookingId?: string) {
  const orgSlug = useOrgSlug();
  return useQuery({
    queryKey: ['hospital', 'theatre-staff', orgSlug, bookingId],
    queryFn: () => theatreApi.listStaffAssignments(orgSlug, bookingId as string),
    enabled: !!orgSlug && !!bookingId,
  });
}

export function useAssignStaff() {
  const orgSlug = useOrgSlug();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ bookingId, data }: { bookingId: string; data: AssignStaffInput }) => theatreApi.assignStaff(orgSlug, bookingId, data),
    onSuccess: (_r, { bookingId }) => qc.invalidateQueries({ queryKey: ['hospital', 'theatre-staff', orgSlug, bookingId] }),
  });
}

export function useRemoveStaffAssignment() {
  const orgSlug = useOrgSlug();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ bookingId, assignmentId }: { bookingId: string; assignmentId: string }) =>
      theatreApi.removeStaffAssignment(orgSlug, bookingId, assignmentId),
    onSuccess: (_r, { bookingId }) => qc.invalidateQueries({ queryKey: ['hospital', 'theatre-staff', orgSlug, bookingId] }),
  });
}

// ── PACU ─────────────────────────────────────────────────────────────────────────────────────

export function usePacuStays(bookingId?: string) {
  const orgSlug = useOrgSlug();
  return useQuery({
    queryKey: ['hospital', 'pacu-stays', orgSlug, bookingId],
    queryFn: () => theatreApi.listPacuStays(orgSlug, bookingId as string),
    enabled: !!orgSlug && !!bookingId,
  });
}

export function useAdmitToPacu() {
  const orgSlug = useOrgSlug();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ bookingId, data }: { bookingId: string; data: AdmitToPacuInput }) => theatreApi.admitToPacu(orgSlug, bookingId, data),
    onSuccess: (_r, { bookingId }) => qc.invalidateQueries({ queryKey: ['hospital', 'pacu-stays', orgSlug, bookingId] }),
  });
}

export function useDischargeFromPacu() {
  const orgSlug = useOrgSlug();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ pacuStayId, data }: { pacuStayId: string; data: DischargeFromPacuInput }) =>
      theatreApi.dischargeFromPacu(orgSlug, pacuStayId, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['hospital', 'pacu-stays', orgSlug] }),
  });
}

// ── Operative note ───────────────────────────────────────────────────────────────────────────

export function useOperativeNote(bookingId?: string) {
  const orgSlug = useOrgSlug();
  return useQuery({
    queryKey: ['hospital', 'operative-note', orgSlug, bookingId],
    queryFn: () => theatreApi.getOperativeNote(orgSlug, bookingId as string),
    enabled: !!orgSlug && !!bookingId,
  });
}

export function useRecordOperativeNote() {
  const orgSlug = useOrgSlug();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ bookingId, data }: { bookingId: string; data: OperativeNoteInput }) => theatreApi.recordOperativeNote(orgSlug, bookingId, data),
    onSuccess: (_r, { bookingId }) => qc.invalidateQueries({ queryKey: ['hospital', 'operative-note', orgSlug, bookingId] }),
  });
}
