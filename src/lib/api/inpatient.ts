/** hospital-api Sprint 6 domain: Ward/Bed/Admission/Transfer/Discharge. Field names match
 * hospital-api's Ent-generated JSON tags — see internal/ent/schema/{ward,bed,admission}.go. */

import { apiClient } from './client';
import { hospitalBase, unwrapList } from './types';
import type { PatientAccount } from './billing';

export type BedStatus = 'available' | 'occupied' | 'cleaning' | 'out_of_service';
export type AdmissionStatus = 'active' | 'discharged';
export type TransferType = 'intra_facility' | 'inter_facility';
export type WardType = 'general' | 'private' | 'semi_private' | 'isolation' | 'icu';
export type IsolationPrecaution = 'contact' | 'droplet' | 'airborne' | 'none';
export type ConditionAtDischarge = 'recovered' | 'improved' | 'unchanged' | 'deteriorated' | 'deceased';

export interface Ward {
  id: string;
  tenant_id: string;
  outlet_id: string;
  name: string;
  ward_type?: WardType;
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
  isolation_precaution: IsolationPrecaution;
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
  discharge_diagnosis?: string;
  procedures_performed?: string;
  discharge_medications?: string;
  follow_up_instructions?: string;
  condition_at_discharge?: ConditionAtDischarge;
  insurance_guarantee_reference?: string;
  ward_charge_posted: boolean;
}

export interface VitalsChartEntry {
  id: string;
  tenant_id: string;
  admission_id: string;
  recorded_by: string;
  bp_systolic?: number;
  bp_diastolic?: number;
  temperature_celsius?: number;
  pulse_bpm?: number;
  respiration_rate?: number;
  spo2_percent?: number;
  pain_score?: number;
  notes?: string;
  recorded_at: string;
}

export interface RecordVitalsChartInput {
  bp_systolic?: number;
  bp_diastolic?: number;
  temperature_celsius?: number;
  pulse_bpm?: number;
  respiration_rate?: number;
  spo2_percent?: number;
  pain_score?: number;
  notes?: string;
}

export interface WardRoundNote {
  id: string;
  tenant_id: string;
  admission_id: string;
  clinician_id: string;
  notes: string;
  diagnosis_code?: string;
  diagnosis_name?: string;
  recorded_at: string;
}

export interface RecordWardRoundInput {
  notes: string;
  diagnosis_code?: string;
  diagnosis_name?: string;
}

export interface PatientTransfer {
  id: string;
  tenant_id: string;
  admission_id: string;
  transfer_type: TransferType;
  from_ward_id: string;
  from_bed_id: string;
  to_ward_id?: string;
  to_bed_id?: string;
  receiving_facility_name?: string;
  reason?: string;
  transferred_by?: string;
  transferred_at: string;
}

export interface BedOccupancy {
  bed: Bed;
  admission?: Admission;
  patient_name?: string;
  patient_mrn?: string;
}

export interface CreateWardInput {
  name: string;
  ward_type?: WardType;
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
  isolation_precaution?: IsolationPrecaution;
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
  discharge_diagnosis?: string;
  procedures_performed?: string;
  discharge_medications?: string;
  follow_up_instructions?: string;
  condition_at_discharge?: ConditionAtDischarge;
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
  setBedIsolationPrecaution: (orgSlug: string, bedId: string, isolationPrecaution: IsolationPrecaution) =>
    apiClient.patch<Bed>(`${hospitalBase(orgSlug)}/beds/${bedId}/isolation-precaution`, { isolation_precaution: isolationPrecaution }),

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
  listTransfers: (orgSlug: string, admissionId: string) =>
    apiClient.get<{ data: PatientTransfer[] }>(`${hospitalBase(orgSlug)}/admissions/${admissionId}/transfers`).then(unwrapList),
  discharge: (orgSlug: string, admissionId: string, data: DischargeInput) =>
    apiClient.post<{ admission: Admission; account?: PatientAccount }>(
      `${hospitalBase(orgSlug)}/admissions/${admissionId}/discharge`,
      data,
    ),

  // Nursing vitals chart / doctor's ward rounds
  recordVitalsChart: (orgSlug: string, admissionId: string, data: RecordVitalsChartInput) =>
    apiClient.post<VitalsChartEntry>(`${hospitalBase(orgSlug)}/admissions/${admissionId}/vitals-chart`, data),
  listVitalsChart: (orgSlug: string, admissionId: string) =>
    apiClient.get<{ data: VitalsChartEntry[] }>(`${hospitalBase(orgSlug)}/admissions/${admissionId}/vitals-chart`).then(unwrapList),
  recordWardRound: (orgSlug: string, admissionId: string, data: RecordWardRoundInput) =>
    apiClient.post<WardRoundNote>(`${hospitalBase(orgSlug)}/admissions/${admissionId}/ward-rounds`, data),
  listWardRounds: (orgSlug: string, admissionId: string) =>
    apiClient.get<{ data: WardRoundNote[] }>(`${hospitalBase(orgSlug)}/admissions/${admissionId}/ward-rounds`).then(unwrapList),
};
