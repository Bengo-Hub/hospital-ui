/** hospital-api Sprint 7 domain: Theatre/OT scheduling. Field names match hospital-api's
 * Ent-generated JSON tags — see internal/ent/schema/theatre_booking.go. */

import { apiClient } from './client';
import { hospitalBase, unwrapList } from './types';

export type TheatreBookingStatus = 'awaiting_payment' | 'scheduled' | 'in_progress' | 'completed' | 'cancelled';

export interface TheatreBooking {
  id: string;
  tenant_id: string;
  outlet_id: string;
  patient_visit_id: string;
  patient_id: string;
  theatre_room: string;
  surgery_type: string;
  surgeon_id?: string;
  scheduled_at: string;
  duration_minutes: number;
  status: TheatreBookingStatus;
  checklist: Record<string, boolean>;
  fee_amount?: number;
  created_by?: string;
  started_at?: string;
  completed_at?: string;
  created_at: string;
}

export interface CreateBookingInput {
  visit_id: string;
  theatre_room: string;
  surgery_type: string;
  surgeon_id?: string;
  scheduled_at: string;
  duration_minutes?: number;
  fee_amount?: number;
}

export const theatreApi = {
  createBooking: (orgSlug: string, data: CreateBookingInput) =>
    apiClient.post<TheatreBooking>(`${hospitalBase(orgSlug)}/theatre-bookings`, data),
  listSchedule: (orgSlug: string, date?: string) =>
    apiClient
      .get<{ data: TheatreBooking[] }>(`${hospitalBase(orgSlug)}/theatre-bookings`, date ? { date } : undefined)
      .then(unwrapList),
  getBooking: (orgSlug: string, bookingId: string) =>
    apiClient.get<TheatreBooking>(`${hospitalBase(orgSlug)}/theatre-bookings/${bookingId}`),
  activateIfPaid: (orgSlug: string, bookingId: string) =>
    apiClient.post<TheatreBooking>(`${hospitalBase(orgSlug)}/theatre-bookings/${bookingId}/activate`),
  updateChecklist: (orgSlug: string, bookingId: string, checklist: Record<string, boolean>) =>
    apiClient.put<TheatreBooking>(`${hospitalBase(orgSlug)}/theatre-bookings/${bookingId}/checklist`, checklist),
  startSurgery: (orgSlug: string, bookingId: string) =>
    apiClient.post<TheatreBooking>(`${hospitalBase(orgSlug)}/theatre-bookings/${bookingId}/start`),
  completeSurgery: (orgSlug: string, bookingId: string) =>
    apiClient.post<TheatreBooking>(`${hospitalBase(orgSlug)}/theatre-bookings/${bookingId}/complete`),
  cancelBooking: (orgSlug: string, bookingId: string) =>
    apiClient.post<TheatreBooking>(`${hospitalBase(orgSlug)}/theatre-bookings/${bookingId}/cancel`),
};
