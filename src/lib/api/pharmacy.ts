/** hospital-api Sprint 4 domain: prescription lifecycle, dispensing, controlled-substance
 * register. Field names match hospital-api's Ent-generated JSON tags — see
 * internal/ent/schema/prescription{,_line}.go, controlled_substance_log.go. */

import { apiClient } from './client';
import { hospitalBase, unwrapList } from './types';

export type PrescriptionStatus =
  | 'pending' | 'pharmacist_review' | 'flagged' | 'approved' | 'locked'
  | 'partially_dispensed' | 'dispensed' | 'rejected' | 'cancelled';
export type PrescriptionLineStatus = 'pending' | 'dispensed' | 'partially_dispensed' | 'cancelled';

export interface PrescriptionLine {
  id: string;
  tenant_id: string;
  prescription_id: string;
  inventory_item_sku?: string;
  drug_name: string;
  dosage?: string;
  form?: string;
  instructions?: string;
  quantity_prescribed: number;
  quantity_dispensed: number;
  unit_price: number;
  lot_number?: string;
  expiry_date?: string;
  status: PrescriptionLineStatus;
}

export interface Prescription {
  id: string;
  tenant_id: string;
  outlet_id: string;
  patient_id?: string;
  visit_id?: string;
  examination_id?: string;
  external_facility_name?: string;
  prescription_number: string;
  prescriber_name?: string;
  prescriber_license?: string;
  patient_name?: string;
  patient_dob?: string;
  patient_id_number?: string;
  status: PrescriptionStatus;
  notes?: string;
  dispensed_at?: string;
  dispensed_by?: string;
  metadata?: Record<string, unknown>;
  created_at: string;
  updated_at: string;
  edges?: { lines?: PrescriptionLine[] };
}

export interface PrescriptionLineInput {
  inventory_item_sku?: string;
  drug_name: string;
  dosage?: string;
  form?: string;
  instructions?: string;
  quantity_prescribed: number;
  unit_price?: number;
}

export interface CreatePrescriptionInput {
  patient_id?: string;
  visit_id?: string;
  examination_id?: string;
  external_facility_name?: string;
  prescriber_name?: string;
  prescriber_license?: string;
  patient_name?: string;
  patient_id_number?: string;
  allergy_flags?: string[];
  outlet_id?: string;
  lines: PrescriptionLineInput[];
}

export interface DispenseLineInput {
  line_id: string;
  quantity_to_dispense: number;
  requires_witness?: boolean;
  witness_staff_id?: string;
}

export interface DispenseInput {
  patient_name?: string;
  patient_id_number?: string;
  outlet_id?: string;
  lines: DispenseLineInput[];
}

export interface ControlledSubstanceLog {
  id: string;
  tenant_id: string;
  outlet_id: string;
  prescription_id?: string;
  item_sku: string;
  item_name: string;
  quantity_dispensed: number;
  dispensed_by: string;
  patient_name?: string;
  patient_id_number?: string;
  witness_staff_id?: string;
  notes?: string;
  lot_number?: string;
  lot_expiry_date?: string;
  dispensed_at: string;
}

export const pharmacyApi = {
  create: (orgSlug: string, data: CreatePrescriptionInput) =>
    apiClient.post<Prescription>(`${hospitalBase(orgSlug)}/prescriptions`, data),
  list: async (orgSlug: string, status?: string): Promise<Prescription[]> => {
    const res = await apiClient.get<{ data: Prescription[] }>(`${hospitalBase(orgSlug)}/prescriptions`, status ? { status } : undefined);
    return unwrapList(res);
  },
  get: (orgSlug: string, id: string) =>
    apiClient.get<Prescription>(`${hospitalBase(orgSlug)}/prescriptions/${id}`),
  approve: (orgSlug: string, id: string, overrideReason?: string) =>
    apiClient.post<Prescription>(`${hospitalBase(orgSlug)}/prescriptions/${id}/approve`, { override_reason: overrideReason }),
  lock: (orgSlug: string, id: string) =>
    apiClient.post<Prescription>(`${hospitalBase(orgSlug)}/prescriptions/${id}/lock`),
  reject: (orgSlug: string, id: string, reason?: string) =>
    apiClient.post<Prescription>(`${hospitalBase(orgSlug)}/prescriptions/${id}/reject`, { reason }),
  cancel: (orgSlug: string, id: string, reason?: string) =>
    apiClient.post<Prescription>(`${hospitalBase(orgSlug)}/prescriptions/${id}/cancel`, { reason }),
  dispense: (orgSlug: string, id: string, data: DispenseInput) =>
    apiClient.post<Prescription>(`${hospitalBase(orgSlug)}/prescriptions/${id}/dispense`, data),
  listControlledSubstanceLogs: async (orgSlug: string): Promise<ControlledSubstanceLog[]> => {
    const res = await apiClient.get<{ data: ControlledSubstanceLog[] }>(`${hospitalBase(orgSlug)}/pharmacy/controlled-substances`);
    return unwrapList(res);
  },
};
