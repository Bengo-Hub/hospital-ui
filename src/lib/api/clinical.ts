/** hospital-api Sprint 1-2 domain: Patients, Visits, Triage, Consultation/Examination,
 * Diagnosis Catalog, Referrals. Field names match hospital-api's Ent-generated JSON tags
 * (snake_case) exactly — see internal/ent/schema/{patient,patient_visit,triage_record,
 * examination_record,diagnosis_catalog_*,referral}.go. */

import { apiClient } from './client';
import { hospitalBase, unwrapList } from './types';

// ── Patients ─────────────────────────────────────────────────────────────────────────────

export type IdentificationType = 'national_id' | 'passport' | 'birth_certificate' | 'maisha_number' | 'alien_id';

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
  identification_type?: IdentificationType;
  sha_beneficiary_number?: string;
  photo_url?: string;
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
  identification_type?: IdentificationType;
  sha_beneficiary_number?: string;
  photo_url?: string;
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
  identification_type?: IdentificationType;
  sha_beneficiary_number?: string;
  photo_url?: string;
  address?: string;
  next_of_kin?: string;
  allergy_flags?: string[];
}

/** Lightweight projection returned by patientsApi.checkDuplicates — enough to recognise "is this
 * the same person" without a full patient fetch. Mirrors hospital-api's PatientSummary. */
export interface PatientDuplicateSummary {
  id: string;
  mrn: string;
  full_name: string;
  phone?: string;
  id_number?: string;
  dob?: string;
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
  /** Non-blocking pre-registration lookup — call before the final "Register" submit and surface
   * a "continue anyway?" warning when it returns matches. Never call this to hard-block. */
  checkDuplicates: async (
    orgSlug: string,
    params: { full_name?: string; phone?: string; id_number?: string },
  ): Promise<PatientDuplicateSummary[]> => {
    const res = await apiClient.get<{ data: PatientDuplicateSummary[] }>(
      `${hospitalBase(orgSlug)}/patients/check-duplicates`,
      params,
    );
    return unwrapList(res);
  },
};

/** Uploads a patient photo (JPEG/PNG, 2MB max) and returns its stored URL for photo_url. */
export const mediaApi = {
  upload: async (orgSlug: string, file: File): Promise<{ url: string; filename: string }> => {
    const form = new FormData();
    form.append('file', file);
    return apiClient.post(`${hospitalBase(orgSlug)}/media/upload`, form);
  },
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
  /** Only populated by ListVisits' OPD-queue path (not the per-patient history path) — the
   * visit's TriageRecords, used client-side to show the latest acuity/priority badge. The list
   * itself already comes back urgent-first for registered/triaged visits (see ListVisits'
   * server-side acuity sort), this is just for the badge's label/colour. */
  edges?: { triage_records?: TriageRecord[] };
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
  cancel: (orgSlug: string, visitId: string, reason?: string) =>
    apiClient.post<PatientVisit>(`${hospitalBase(orgSlug)}/visits/${visitId}/cancel`, { reason }),
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

export interface DiagnosisHistoryEntry {
  code?: string;
  name?: string;
  changed_by?: string;
  changed_at: string;
}

export interface ExaminationRecord {
  id: string;
  tenant_id: string;
  visit_id: string;
  clinician_id: string;
  queue_type: QueueType;
  chief_complaint?: string;
  diagnosis_code?: string;
  diagnosis_name?: string;
  diagnosis_history?: DiagnosisHistoryEntry[];
  review_of_systems?: Record<string, string>;
  physical_exam_findings?: Record<string, string>;
  treatment_plan?: string;
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
  review_of_systems?: Record<string, string>;
  physical_exam_findings?: Record<string, string>;
  treatment_plan?: string;
  notes?: string;
  complete?: boolean;
}

export const examinationApi = {
  record: (orgSlug: string, visitId: string, data: RecordExaminationInput) =>
    apiClient.post<ExaminationRecord>(`${hospitalBase(orgSlug)}/visits/${visitId}/examination`, data),
  /** Latest ExaminationRecord for a visit, or null if it hasn't been examined yet — used to show
   * the diagnosis-history trail and any already-recorded findings when a case is reopened. */
  getLatest: async (orgSlug: string, visitId: string): Promise<ExaminationRecord | null> => {
    try {
      return await apiClient.get<ExaminationRecord>(`${hospitalBase(orgSlug)}/visits/${visitId}/examination`);
    } catch {
      return null;
    }
  },
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
  cancel: (orgSlug: string, visitId: string, referralId: string) =>
    apiClient.post<Referral>(`${hospitalBase(orgSlug)}/visits/${visitId}/refer/${referralId}/cancel`, {}),
};
