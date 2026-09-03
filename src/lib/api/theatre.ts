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
  /** inventory-api Asset IDs reserved for this booking (e.g. an anaesthesia machine) — reference only. */
  equipment_asset_ids?: string[];
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

// Partial update — every field optional. Deliberately excludes fee_amount: the procedure fee is
// already posted as a billing charge at booking-creation time, so editing it here would desync
// from what the patient may already owe. Only succeeds while status is awaiting_payment/scheduled
// (hospital-api re-runs the same room/staff overlap conflict checks booking-creation does).
export interface UpdateBookingInput {
  theatre_room?: string;
  surgery_type?: string;
  surgeon_id?: string;
  clear_surgeon_id?: boolean;
  scheduled_at?: string;
  duration_minutes?: number;
}

export type TheatreStaffRole = 'surgeon' | 'assistant_surgeon' | 'anaesthetist' | 'scrub_nurse' | 'circulating_nurse' | 'other';

export interface TheatreStaffAssignment {
  id: string;
  tenant_id: string;
  theatre_booking_id: string;
  staff_user_id: string;
  role: TheatreStaffRole;
  assigned_at: string;
}

export interface AssignStaffInput {
  staff_user_id: string;
  role: TheatreStaffRole;
}

export type PacuDisposition = 'to_ward' | 'to_icu' | 'home' | 'deceased';

export interface PacuStay {
  id: string;
  tenant_id: string;
  theatre_booking_id: string;
  bay_label?: string;
  admitted_at: string;
  discharged_at?: string;
  discharge_disposition?: PacuDisposition;
  monitoring_notes?: string;
}

export interface AdmitToPacuInput {
  bay_label?: string;
}

export interface DischargeFromPacuInput {
  disposition: PacuDisposition;
  monitoring_notes?: string;
}

export interface OperativeNote {
  id: string;
  tenant_id: string;
  theatre_booking_id: string;
  surgeon_id?: string;
  procedure_performed: string;
  findings?: string;
  complications?: string;
  estimated_blood_loss_ml?: number;
  implants_used?: string;
  specimens_sent: boolean;
  specimens_description?: string;
  post_op_diagnosis?: string;
  authored_by?: string;
  authored_at: string;
}

export interface OperativeNoteInput {
  surgeon_id?: string;
  procedure_performed: string;
  findings?: string;
  complications?: string;
  estimated_blood_loss_ml?: number;
  implants_used?: string;
  specimens_sent?: boolean;
  specimens_description?: string;
  post_op_diagnosis?: string;
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
  updateBooking: (orgSlug: string, bookingId: string, data: UpdateBookingInput) =>
    apiClient.put<TheatreBooking>(`${hospitalBase(orgSlug)}/theatre-bookings/${bookingId}`, data),
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

  // Surgical team assignment
  assignStaff: (orgSlug: string, bookingId: string, data: AssignStaffInput) =>
    apiClient.post<TheatreStaffAssignment>(`${hospitalBase(orgSlug)}/theatre-bookings/${bookingId}/staff`, data),
  listStaffAssignments: (orgSlug: string, bookingId: string) =>
    apiClient.get<{ data: TheatreStaffAssignment[] }>(`${hospitalBase(orgSlug)}/theatre-bookings/${bookingId}/staff`).then(unwrapList),
  removeStaffAssignment: (orgSlug: string, bookingId: string, assignmentId: string) =>
    apiClient.delete(`${hospitalBase(orgSlug)}/theatre-bookings/${bookingId}/staff/${assignmentId}`),

  // PACU
  admitToPacu: (orgSlug: string, bookingId: string, data: AdmitToPacuInput) =>
    apiClient.post<PacuStay>(`${hospitalBase(orgSlug)}/theatre-bookings/${bookingId}/pacu`, data),
  listPacuStays: (orgSlug: string, bookingId: string) =>
    apiClient.get<{ data: PacuStay[] }>(`${hospitalBase(orgSlug)}/theatre-bookings/${bookingId}/pacu`).then(unwrapList),
  dischargeFromPacu: (orgSlug: string, pacuStayId: string, data: DischargeFromPacuInput) =>
    apiClient.post<PacuStay>(`${hospitalBase(orgSlug)}/pacu-stays/${pacuStayId}/discharge`, data),

  // Operative note
  recordOperativeNote: (orgSlug: string, bookingId: string, data: OperativeNoteInput) =>
    apiClient.post<OperativeNote>(`${hospitalBase(orgSlug)}/theatre-bookings/${bookingId}/operative-note`, data),
  getOperativeNote: async (orgSlug: string, bookingId: string): Promise<OperativeNote | null> => {
    try {
      return await apiClient.get<OperativeNote>(`${hospitalBase(orgSlug)}/theatre-bookings/${bookingId}/operative-note`);
    } catch {
      return null;
    }
  },
};
