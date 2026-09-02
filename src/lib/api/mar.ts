/** hospital-api's Medication Administration Record (MAR) domain — nurse-charted per-dose record
 * for an admission, distinct from pharmacy's own dispense event. Field names match hospital-api's
 * Ent-generated JSON tags — see internal/ent/schema/medication_administration.go. */

import { apiClient } from './client';
import { hospitalBase, unwrapList } from './types';
import type { Prescription } from './pharmacy';

export type MarStatus = 'scheduled' | 'given' | 'refused' | 'missed' | 'held';

export interface MedicationAdministration {
  id: string;
  tenant_id: string;
  admission_id: string;
  prescription_line_id: string;
  scheduled_time: string;
  administered_at?: string;
  administered_by?: string;
  status: MarStatus;
  notes?: string;
  created_at: string;
}

export interface ChartDoseInput {
  prescription_line_id: string;
  scheduled_time?: string;
  status: 'given' | 'refused' | 'missed' | 'held';
  notes?: string;
}

export const marApi = {
  chartDose: (orgSlug: string, admissionId: string, data: ChartDoseInput) =>
    apiClient.post<MedicationAdministration>(`${hospitalBase(orgSlug)}/admissions/${admissionId}/mar`, data),
  listByAdmission: async (orgSlug: string, admissionId: string): Promise<MedicationAdministration[]> => {
    const res = await apiClient.get<{ data: MedicationAdministration[] }>(`${hospitalBase(orgSlug)}/admissions/${admissionId}/mar`);
    return unwrapList(res);
  },
  listActivePrescriptions: async (orgSlug: string, admissionId: string): Promise<Prescription[]> => {
    const res = await apiClient.get<{ data: Prescription[] }>(`${hospitalBase(orgSlug)}/admissions/${admissionId}/mar/prescriptions`);
    return unwrapList(res);
  },
};
