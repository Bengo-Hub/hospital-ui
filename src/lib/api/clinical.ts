/** hospital-api Sprint 1-2 domain: Patients, Visits, Triage, Consultation/Examination,
 * Diagnosis Catalog, Referrals. Field names match hospital-api's Ent-generated JSON tags
 * (snake_case) exactly — see internal/ent/schema/{patient,patient_visit,triage_record,
 * examination_record,diagnosis_catalog_*,referral}.go. */

import { apiClient } from './client';
import { hospitalBase, unwrapList } from './types';

// ── Patients ─────────────────────────────────────────────────────────────────────────────

export interface Patient {
  id: string;
  tenant_id: string;
  outlet_id: string;
  mrn: string;
  full_name: string;
  dob?: string;
  sex?: string;
  phone?: string;
  id_number?: string;
  address?: string;
  next_of_kin?: string;
  allergy_flags?: string[];
  client_registry_id?: string;
  crm_contact_id?: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface RegisterPatientInput {
  full_name: string;
  dob?: string;
  sex?: string;
  phone?: string;
  id_number?: string;
  address?: string;
  next_of_kin?: string;
  allergy_flags?: string[];
  outlet_id?: string;
}

export interface UpdatePatientInput {
  full_name?: string;
  dob?: string;
  sex?: string;
  phone?: string;
  id_number?: string;
  address?: string;
  next_of_kin?: string;
  allergy_flags?: string[];
}

export const patientsApi = {
  register: (orgSlug: string, data: RegisterPatientInput) =>
    apiClient.post<Patient>(`${hospitalBase(orgSlug)}/patients`, data),
  list: async (orgSlug: string, q?: string): Promise<Patient[]> => {
    const res = await apiClient.get<{ data: Patient[] }>(`${hospitalBase(orgSlug)}/patients`, q ? { q } : undefined);
    return unwrapList(res);
  },
  get: (orgSlug: string, patientId: string) =>
    apiClient.get<Patient>(`${hospitalBase(orgSlug)}/patients/${patientId}`),
  update: (orgSlug: string, patientId: string, data: UpdatePatientInput) =>
    apiClient.put<Patient>(`${hospitalBase(orgSlug)}/patients/${patientId}`, data),
};

// ── Visits ───────────────────────────────────────────────────────────────────────────────

export type VisitType = 'OPD' | 'IPD';
export type VisitStatus =
  | 'registered' | 'triaged' | 'in_examination' | 'awaiting_lab' | 'lab_complete'
  | 'prescribed' | 'dispensed' | 'admitted' | 'completed' | 'cancelled';

export interface PatientVisit {
  id: string;
  tenant_id: string;
  outlet_id: string;
  patient_id: string;
  visit_number: string;
  visit_type: VisitType;
  status: VisitStatus;
  chief_complaint?: string;
  registered_by?: string;
  checked_in_at: string;
  discharged_at?: string;
  created_at: string;
  updated_at: string;
}

export interface CheckInVisitInput {
  patient_id: string;
  outlet_id?: string;
  visit_type?: VisitType;
  chief_complaint?: string;
}

export const visitsApi = {
  checkIn: (orgSlug: string, data: CheckInVisitInput) =>
    apiClient.post<PatientVisit>(`${hospitalBase(orgSlug)}/visits`, data),
  list: async (orgSlug: string, status?: string): Promise<PatientVisit[]> => {
    const res = await apiClient.get<{ data: PatientVisit[] }>(`${hospitalBase(orgSlug)}/visits`, status ? { status } : undefined);
    return unwrapList(res);
  },
  get: (orgSlug: string, visitId: string) =>
    apiClient.get<PatientVisit>(`${hospitalBase(orgSlug)}/visits/${visitId}`),
  listByPatient: async (orgSlug: string, patientId: string): Promise<PatientVisit[]> => {
    const res = await apiClient.get<{ data: PatientVisit[] }>(`${hospitalBase(orgSlug)}/visits`, { patient_id: patientId });
    return unwrapList(res);
  },
};

// ── Triage ───────────────────────────────────────────────────────────────────────────────

export interface TriageRecord {
  id: string;
  tenant_id: string;
  visit_id: string;
  taken_by: string;
  bp_systolic?: number;
  bp_diastolic?: number;
  temperature_celsius?: number;
  pulse_bpm?: number;
  respiration_rate?: number;
  spo2_percent?: number;
  weight_kg?: number;
  height_cm?: number;
  priority?: string;
  notes?: string;
  taken_at: string;
}

export interface RecordTriageInput {
  bp_systolic?: number;
  bp_diastolic?: number;
  temperature_celsius?: number;
  pulse_bpm?: number;
  respiration_rate?: number;
  spo2_percent?: number;
  weight_kg?: number;
  height_cm?: number;
  priority?: string;
  notes?: string;
}

export const triageApi = {
  record: (orgSlug: string, visitId: string, data: RecordTriageInput) =>
    apiClient.post<TriageRecord>(`${hospitalBase(orgSlug)}/visits/${visitId}/triage`, data),
};

// ── Consultation / Examination ──────────────────────────────────────────────────────────

export type QueueType = 'doctor' | 'dental' | 'mch' | 'specialist';
export type ExaminationStatus = 'in_progress' | 'awaiting_lab' | 'completed';

export interface ExaminationRecord {
  id: string;
  tenant_id: string;
  visit_id: string;
  clinician_id: string;
  queue_type: QueueType;
  chief_complaint?: string;
  diagnosis_code?: string;
  diagnosis_name?: string;
  notes?: string;
  status: ExaminationStatus;
  examined_at: string;
  completed_at?: string;
}

export interface RecordExaminationInput {
  queue_type?: QueueType;
  chief_complaint?: string;
  diagnosis_code?: string;
  diagnosis_name?: string;
  notes?: string;
  complete?: boolean;
}

export const examinationApi = {
  record: (orgSlug: string, visitId: string, data: RecordExaminationInput) =>
    apiClient.post<ExaminationRecord>(`${hospitalBase(orgSlug)}/visits/${visitId}/examination`, data),
};

// ── Diagnosis Catalog ────────────────────────────────────────────────────────────────────

export interface DiagnosisEntry {
  id: string;
  code: string;
  name: string;
  category?: string;
  is_global: boolean;
}

export const diagnosisCatalogApi = {
  list: async (orgSlug: string): Promise<DiagnosisEntry[]> => {
    const res = await apiClient.get<{ data: DiagnosisEntry[] }>(`${hospitalBase(orgSlug)}/diagnosis-catalog`);
    return unwrapList(res);
  },
  create: (orgSlug: string, data: { code: string; name: string; category?: string }) =>
    apiClient.post(`${hospitalBase(orgSlug)}/diagnosis-catalog`, data),
};

// ── Referrals ────────────────────────────────────────────────────────────────────────────

export type ReferredTo = 'lab' | 'pharmacy' | 'external_facility' | 'specialist';

export interface Referral {
  id: string;
  tenant_id: string;
  visit_id: string;
  referred_to: ReferredTo;
  reason?: string;
  status: string;
  referred_by?: string;
  created_at: string;
}

export const referralsApi = {
  create: (orgSlug: string, visitId: string, data: { referred_to: ReferredTo; reason?: string }) =>
    apiClient.post<Referral>(`${hospitalBase(orgSlug)}/visits/${visitId}/refer`, data),
  list: (orgSlug: string, visitId: string) =>
    apiClient.get<{ data: Referral[] }>(`${hospitalBase(orgSlug)}/visits/${visitId}/referrals`).then(unwrapList),
};
