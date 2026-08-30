/** hospital-api Sprint 3 domain: Laboratory ordering, worklist, results, test catalog. Field
 * names match hospital-api's Ent-generated JSON tags — see
 * internal/ent/schema/lab_order{,_line}.go, lab_test_catalog_{default,entry}.go. */

import { apiClient } from './client';
import { hospitalBase, unwrapList } from './types';
import type { InsuranceClaimResult } from './billing';

export type LabOrderStatus = 'requested' | 'awaiting_payment' | 'resulted' | 'cancelled';
export type ResultFlag = 'pending' | 'normal' | 'abnormal' | 'critical';

export interface LabOrder {
  id: string;
  tenant_id: string;
  visit_id: string;
  examination_id?: string;
  ordered_by: string;
  status: LabOrderStatus;
  notes?: string;
  ordered_at: string;
  completed_at?: string;
}

export interface LabOrderLine {
  id: string;
  tenant_id: string;
  lab_order_id: string;
  test_code: string;
  test_name: string;
  price: number;
  specimen_type?: string;
  result_value?: string;
  unit?: string;
  reference_range?: string;
  flag: ResultFlag;
  notes?: string;
  resulted_by?: string;
  resulted_at?: string;
  created_at: string;
}

export interface CreateLabOrderInput {
  visit_id: string;
  examination_id?: string;
  test_codes: string[];
  notes?: string;
}

export interface EnterResultInput {
  result_value: string;
  unit?: string;
  reference_range?: string;
  flag?: ResultFlag;
  notes?: string;
}

export interface CatalogTest {
  code: string;
  name: string;
  specimen_type?: string;
  price: number;
  is_global: boolean;
}

// ── Tenant Lab Test Catalog admin CRUD (2026-08-30) ─────────────────────────────────────────

export interface LabTestCatalogEntry {
  id: string;
  code: string;
  name: string;
  specimen_type?: string;
  reference_range?: string;
  unit?: string;
  turnaround_hours?: number;
  price: number;
  is_active: boolean;
}

export interface CreateLabTestEntryInput {
  code: string;
  name: string;
  specimen_type?: string;
  reference_range?: string;
  unit?: string;
  turnaround_hours?: number;
  price?: number;
}

export interface UpdateLabTestEntryInput {
  name?: string;
  specimen_type?: string;
  reference_range?: string;
  unit?: string;
  turnaround_hours?: number;
  price?: number;
  is_active?: boolean;
}

export const labApi = {
  createOrder: (orgSlug: string, data: CreateLabOrderInput) =>
    apiClient.post<LabOrder>(`${hospitalBase(orgSlug)}/lab-orders`, data),
  listWorklist: async (orgSlug: string, status?: string): Promise<LabOrder[]> => {
    const res = await apiClient.get<{ data: LabOrder[] }>(`${hospitalBase(orgSlug)}/lab-orders`, status ? { status } : undefined);
    return unwrapList(res);
  },
  getOrder: (orgSlug: string, orderId: string) =>
    apiClient.get<{ order: LabOrder; lines: LabOrderLine[] }>(`${hospitalBase(orgSlug)}/lab-orders/${orderId}`),
  activateIfPaid: (orgSlug: string, orderId: string) =>
    apiClient.post<LabOrder>(`${hospitalBase(orgSlug)}/lab-orders/${orderId}/activate`),
  cancelOrder: (orgSlug: string, orderId: string, reason?: string) =>
    apiClient.post<LabOrder>(`${hospitalBase(orgSlug)}/lab-orders/${orderId}/cancel`, { reason }),
  enterResult: (orgSlug: string, lineId: string, data: EnterResultInput) =>
    apiClient.post<LabOrderLine>(`${hospitalBase(orgSlug)}/lab-orders/lines/${lineId}/result`, data),
  listCatalog: async (orgSlug: string): Promise<CatalogTest[]> => {
    const res = await apiClient.get<{ data: CatalogTest[] }>(`${hospitalBase(orgSlug)}/lab-test-catalog`);
    return unwrapList(res);
  },
  submitInsuranceClaim: (
    orgSlug: string,
    orderId: string,
    data: { provider_id: string; coverage_id?: string; outlet_id?: string }
  ) =>
    apiClient.post<{ order: LabOrder; claim: InsuranceClaimResult }>(
      `${hospitalBase(orgSlug)}/lab-orders/${orderId}/insurance-claim`,
      data
    ),

  listTenantCatalogEntries: (orgSlug: string, includeInactive = false) =>
    apiClient
      .get<{ data: LabTestCatalogEntry[] }>(`${hospitalBase(orgSlug)}/lab-test-catalog/entries`, includeInactive ? { include_inactive: '1' } : undefined)
      .then(unwrapList),
  createCatalogEntry: (orgSlug: string, data: CreateLabTestEntryInput) =>
    apiClient.post<LabTestCatalogEntry>(`${hospitalBase(orgSlug)}/lab-test-catalog/entries`, data),
  updateCatalogEntry: (orgSlug: string, entryId: string, data: UpdateLabTestEntryInput) =>
    apiClient.put<LabTestCatalogEntry>(`${hospitalBase(orgSlug)}/lab-test-catalog/entries/${entryId}`, data),
  deactivateCatalogEntry: (orgSlug: string, entryId: string) =>
    apiClient.post<LabTestCatalogEntry>(`${hospitalBase(orgSlug)}/lab-test-catalog/entries/${entryId}/deactivate`, {}),
};
