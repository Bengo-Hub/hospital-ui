/** hospital-api Sprint 6 domain: Ward/Bed/Admission/Transfer/Discharge. Field names match
 * hospital-api's Ent-generated JSON tags — see internal/ent/schema/{ward,bed,admission}.go. */

import { apiClient } from './client';
import { hospitalBase, unwrapList } from './types';
import type { PatientAccount } from './billing';

export type BedStatus = 'available' | 'occupied' | 'cleaning' | 'out_of_service';
export type AdmissionStatus = 'active' | 'discharged';
export type TransferType = 'intra_facility' | 'inter_facility';

export interface Ward {
  id: string;
  tenant_id: string;
  outlet_id: string;
  name: string;
  capacity: number;
  billable_item_code?: string;
  is_active: boolean;
  created_at: string;
}

export interface Bed {
  id: string;
  tenant_id: string;
  ward_id: string;
  bed_number: string;
  status: BedStatus;
  /** inventory-api Asset IDs linked to this bed (e.g. a bed-mounted monitor) — reference only. */
  equipment_asset_ids?: string[];
  created_at: string;
}

export interface Admission {
  id: string;
  tenant_id: string;
  outlet_id: string;
  patient_visit_id: string;
  patient_id: string;
  admission_number: string;
  ward_id: string;
  bed_id: string;
  status: AdmissionStatus;
  admitted_by?: string;
  admitted_at: string;
  discharged_at?: string;
  discharged_by?: string;
  discharge_summary?: string;
  insurance_guarantee_reference?: string;
  ward_charge_posted: boolean;
}

export interface BedOccupancy {
  bed: Bed;
  admission?: Admission;
  patient_name?: string;
  patient_mrn?: string;
}

export interface CreateWardInput {
  name: string;
  capacity?: number;
  billable_item_code?: string;
}

export interface CreateBedInput {
  bed_number: string;
}

export interface AdmitInput {
  visit_id: string;
  bed_id: string;
  insurance_guarantee_reference?: string;
}

export interface TransferInput {
  transfer_type: TransferType;
  to_ward_id?: string;
  to_bed_id?: string;
  receiving_facility_name?: string;
  referral_id?: string;
  ambulance_booking_id?: string;
  reason?: string;
  override_reason?: string;
}

export interface DischargeInput {
  summary?: string;
  override_reason?: string;
}

/** Shape of the 409 body Transfer/Discharge return while a balance is outstanding — matches
 * inpatient.ErrOutstandingBalance's handler response, `{error, account}`. */
export interface OutstandingBalanceError {
  error: string;
  account: PatientAccount;
}

export const inpatientApi = {
  // Wards
  createWard: (orgSlug: string, data: CreateWardInput) =>
    apiClient.post<Ward>(`${hospitalBase(orgSlug)}/wards`, data),
  listWards: (orgSlug: string) =>
    apiClient.get<{ data: Ward[] }>(`${hospitalBase(orgSlug)}/wards`).then(unwrapList),
  getWardOccupancy: (orgSlug: string, wardId: string) =>
    apiClient.get<{ ward: Ward; beds: BedOccupancy[] }>(`${hospitalBase(orgSlug)}/wards/${wardId}/occupancy`),

  // Beds
  createBed: (orgSlug: string, wardId: string, data: CreateBedInput) =>
    apiClient.post<Bed>(`${hospitalBase(orgSlug)}/wards/${wardId}/beds`, data),
  listBeds: (orgSlug: string, wardId: string) =>
    apiClient.get<{ data: Bed[] }>(`${hospitalBase(orgSlug)}/wards/${wardId}/beds`).then(unwrapList),
  setBedStatus: (orgSlug: string, bedId: string, status: BedStatus) =>
    apiClient.patch<Bed>(`${hospitalBase(orgSlug)}/beds/${bedId}/status`, { status }),

  // Admissions
  admit: (orgSlug: string, data: AdmitInput) =>
    apiClient.post<Admission>(`${hospitalBase(orgSlug)}/admissions`, data),
  listAdmissions: (orgSlug: string, status?: AdmissionStatus) =>
    apiClient
      .get<{ data: Admission[] }>(`${hospitalBase(orgSlug)}/admissions`, status ? { status } : undefined)
      .then(unwrapList),
  getAdmission: (orgSlug: string, admissionId: string) =>
    apiClient.get<Admission>(`${hospitalBase(orgSlug)}/admissions/${admissionId}`),
  transfer: (orgSlug: string, admissionId: string, data: TransferInput) =>
    apiClient.post<{ admission: Admission; account?: PatientAccount }>(
      `${hospitalBase(orgSlug)}/admissions/${admissionId}/transfer`,
      data,
    ),
  discharge: (orgSlug: string, admissionId: string, data: DischargeInput) =>
    apiClient.post<{ admission: Admission; account?: PatientAccount }>(
      `${hospitalBase(orgSlug)}/admissions/${admissionId}/discharge`,
      data,
    ),
};
