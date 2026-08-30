/** hospital-api Sprint 4 domain: prescription lifecycle, dispensing, controlled-substance
 * register. Field names match hospital-api's Ent-generated JSON tags — see
 * internal/ent/schema/prescription{,_line}.go, controlled_substance_log.go. */

import { apiClient } from './client';
import { hospitalBase, unwrapList } from './types';
import type { InsuranceClaimResult } from './billing';

export interface InteractionCheck {
  id: string;
  prescription_id?: string;
  drug_skus?: string[];
  result: 'clear' | 'interactions_found' | 'allergy_match';
  details?: {
    interactions?: { severity?: string; description?: string; drugs?: string[] }[];
    allergy_matches?: { allergy?: string; sku?: string; description?: string }[];
  };
  checked_at: string;
}

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
  // witness_token is the short-lived token minted by POST .../pharmacy/verify-witness after the
  // witness re-authenticated with THEIR OWN credentials (see pharmacyApi.verifyWitness). There is
  // deliberately no witness_staff_id field any more — the backend closed that client-suppliable
  // identity path entirely (2026-08-29 security fix): a plain client-supplied staff UUID could
  // name ANY staff member as "witness" with zero verification. One token, minted from one
  // confirmation, is reusable across every witnessed line in the same dispense request within its
  // 120s TTL — see pharmacy.Service.Dispense's per-line loop in hospital-api, which validates each
  // line's token independently (stateless JWT check, no single-use/consumption tracking) rather
  // than requiring a distinct token per line.
  witness_token?: string;
}

export interface DispenseInput {
  patient_name?: string;
  patient_id_number?: string;
  outlet_id?: string;
  lines: DispenseLineInput[];
}

/** Step 1 of the controlled-substance dual-witness flow — the WITNESS's own credentials, never
 * the dispensing user's. Mirrors hospital-api's verifyWitnessRequest (handlers/pharmacy.go). */
export interface VerifyWitnessInput {
  email: string;
  password: string;
  totp_code?: string;
}

/** Response from POST .../pharmacy/verify-witness — either an MFA challenge to resubmit with
 * totp_code filled in, or a minted short-lived witness_token + witness_name on success. */
export interface VerifyWitnessResult {
  mfa_required?: boolean;
  mfa_method?: string;
  user_id?: string;
  witness_token?: string;
  witness_name?: string;
  expires_in?: number;
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
  verifyWitness: (orgSlug: string, data: VerifyWitnessInput) =>
    apiClient.post<VerifyWitnessResult>(`${hospitalBase(orgSlug)}/pharmacy/verify-witness`, data),
  listControlledSubstanceLogs: async (orgSlug: string): Promise<ControlledSubstanceLog[]> => {
    const res = await apiClient.get<{ data: ControlledSubstanceLog[] }>(`${hospitalBase(orgSlug)}/pharmacy/controlled-substances`);
    return unwrapList(res);
  },
  submitInsuranceClaim: (
    orgSlug: string,
    id: string,
    data: { provider_id: string; coverage_id?: string; outlet_id?: string; line_ids?: string[] }
  ) =>
    apiClient.post<{ prescription: Prescription; claim: InsuranceClaimResult }>(
      `${hospitalBase(orgSlug)}/prescriptions/${id}/insurance-claim`,
      data
    ),
  recheckInteractions: (orgSlug: string, id: string, allergyFlags?: string[]) =>
    apiClient.post<{ check: InteractionCheck; prescription: Prescription }>(
      `${hospitalBase(orgSlug)}/prescriptions/${id}/recheck-interactions`,
      { allergy_flags: allergyFlags }
    ),
  /** Preview-first: fetched as a blob and shown via shared-ui-lib's PdfPreview, never a raw
   *  navigation — mirrors treasury-ui's own document-preview convention. */
  downloadLabel: (orgSlug: string, prescriptionId: string, lineId: string) =>
    apiClient.getBlob(`${hospitalBase(orgSlug)}/prescriptions/${prescriptionId}/lines/${lineId}/label.pdf`),
};
