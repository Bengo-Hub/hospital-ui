'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useParams } from 'next/navigation';
import { theatreApi, type CreateBookingInput } from '@/lib/api/theatre';

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
