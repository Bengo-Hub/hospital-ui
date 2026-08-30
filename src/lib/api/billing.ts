/** hospital-api Sprint 5 core domain: the Distributed Billing & Patient Accounts ledger. Field
 * names match hospital-api's Ent-generated JSON tags — see internal/ent/schema/
 * {patient_account,billable_charge,billable_item_catalog,patient_next_of_kin}.go. Money never
 * lives here — treasury_invoice_id/treasury_payment_intent_id are references only. */

import { apiClient } from './client';
import { hospitalBase, unwrapList } from './types';

export type AccountStatus = 'open' | 'settled' | 'written_off';
export type SettlementRequiredBefore = 'nothing' | 'discharge' | 'body_release';
/** 'exempted' = settled via an accepted insurance claim rather than cash — distinct from
 * 'waived' (a manual, no-payer write-off). */
export type ChargeStatus = 'pending' | 'invoiced' | 'paid' | 'exempted' | 'waived' | 'written_off';
export type PaymentMethod = 'mpesa' | 'card' | 'cash' | 'bank_transfer' | 'paystack';

export interface PatientAccount {
  id: string;
  tenant_id: string;
  patient_id: string;
  visit_id?: string;
  admission_id?: string;
  status: AccountStatus;
  total_charged: number;
  total_paid: number;
  balance: number;
  settlement_required_before: SettlementRequiredBefore;
  next_of_kin_id?: string;
  created_at: string;
  updated_at: string;
}

export interface BillableCharge {
  id: string;
  tenant_id: string;
  patient_account_id: string;
  billable_item_id?: string;
  source_module: string;
  source_reference_id?: string;
  description: string;
  amount: number;
  status: ChargeStatus;
  treasury_invoice_id?: string;
  treasury_payment_intent_id?: string;
  created_by_user_id?: string;
  paid_at?: string;
  created_at: string;
  updated_at: string;
}

export interface CollectChargeInput {
  payment_method: PaymentMethod;
  phone_number?: string;
}

// ── PatientNextOfKin (2026-08-30) ───────────────────────────────────────────────────────────

export interface NextOfKin {
  id: string;
  tenant_id: string;
  patient_id: string;
  name: string;
  phone?: string;
  relationship?: string;
  id_number?: string;
  is_primary: boolean;
  created_at: string;
}

export interface CreateNextOfKinInput {
  name: string;
  phone?: string;
  relationship?: string;
  id_number?: string;
  is_primary?: boolean;
}

// ── Insurance (2026-08-30) ───────────────────────────────────────────────────────────────────

export interface InsuranceProvider {
  id: string;
  name: string;
  is_active: boolean;
}

export interface InsuranceClaim {
  id: string;
  status: string;
  claim_reference?: string;
}

export interface InsuranceClaimResult {
  claim: InsuranceClaim;
  accepted: boolean;
  charges: BillableCharge[];
}

export interface SubmitInsuranceClaimInput {
  provider_id: string;
  coverage_id?: string;
  outlet_id?: string;
  charge_ids?: string[];
}

// ── BillableItemCatalog admin CRUD (2026-08-30) ─────────────────────────────────────────────

export type BillableItemAppliesTo = 'first_visit' | 'return_visit' | 'all';
export type BillableItemCollectionMode = 'direct' | 'billing_queue' | 'either';
export type BillableItemDepartment =
  | 'records' | 'triage' | 'consultation' | 'lab' | 'pharmacy' | 'theatre' | 'inpatient' | 'mortuary';

export interface BillableItemCatalogRow {
  id: string;
  department: BillableItemDepartment;
  code: string;
  name: string;
  price?: number;
  applies_to: BillableItemAppliesTo;
  requires_prepayment: boolean;
  collection_mode: BillableItemCollectionMode;
  is_active: boolean;
}

export interface CreateBillableItemInput {
  department: BillableItemDepartment;
  code: string;
  name: string;
  price?: number;
  applies_to?: BillableItemAppliesTo;
  requires_prepayment?: boolean;
  collection_mode?: BillableItemCollectionMode;
}

export interface UpdateBillableItemInput {
  name?: string;
  price?: number;
  clear_price?: boolean;
  applies_to?: BillableItemAppliesTo;
  requires_prepayment?: boolean;
  collection_mode?: BillableItemCollectionMode;
  is_active?: boolean;
}

export const billingApi = {
  getAccountByVisit: (orgSlug: string, visitId: string) =>
    apiClient.get<{ account: PatientAccount; charges: BillableCharge[] }>(`${hospitalBase(orgSlug)}/visits/${visitId}/account`),
  listPendingCharges: async (orgSlug: string, department?: string): Promise<BillableCharge[]> => {
    const res = await apiClient.get<{ data: BillableCharge[] }>(`${hospitalBase(orgSlug)}/billing/queue`, department ? { department } : undefined);
    return unwrapList(res);
  },
  collectCharge: (orgSlug: string, chargeId: string, data: CollectChargeInput) =>
    apiClient.post<BillableCharge>(`${hospitalBase(orgSlug)}/billing/charges/${chargeId}/collect`, data),
  settleAccount: (orgSlug: string, accountId: string, data: CollectChargeInput & { next_of_kin_id?: string }) =>
    apiClient.post<PatientAccount>(`${hospitalBase(orgSlug)}/billing/accounts/${accountId}/settle`, data),
  overrideSettlement: (orgSlug: string, accountId: string, reason: string) =>
    apiClient.post<PatientAccount>(`${hospitalBase(orgSlug)}/billing/accounts/${accountId}/override-settlement`, { reason }),

  // Insurance — shared across Lab/Pharmacy/Billing UIs.
  listInsuranceProviders: (orgSlug: string) =>
    apiClient.get<{ data: InsuranceProvider[] }>(`${hospitalBase(orgSlug)}/insurance/providers`).then(unwrapList),
  checkEligibility: (orgSlug: string, visitId: string, providerId: string, fields?: Record<string, string>) =>
    apiClient
      .post<{ data: Record<string, unknown> }>(`${hospitalBase(orgSlug)}/visits/${visitId}/insurance/check-eligibility`, {
        provider_id: providerId,
        fields,
      })
      .then((r) => r.data),
  submitInsuranceClaim: (orgSlug: string, visitId: string, data: SubmitInsuranceClaimInput) =>
    apiClient.post<InsuranceClaimResult>(`${hospitalBase(orgSlug)}/visits/${visitId}/insurance/submit-claim`, data),
  pollInsuranceClaim: (orgSlug: string, claimId: string) =>
    apiClient.get<InsuranceClaim>(`${hospitalBase(orgSlug)}/insurance/claims/${claimId}/status`),

  // Billable Item Catalog admin CRUD.
  listCatalog: (orgSlug: string, includeInactive = false) =>
    apiClient
      .get<{ data: BillableItemCatalogRow[] }>(`${hospitalBase(orgSlug)}/billing/catalog`, includeInactive ? { include_inactive: '1' } : undefined)
      .then(unwrapList),
  createCatalogItem: (orgSlug: string, data: CreateBillableItemInput) =>
    apiClient.post<BillableItemCatalogRow>(`${hospitalBase(orgSlug)}/billing/catalog`, data),
  updateCatalogItem: (orgSlug: string, itemId: string, data: UpdateBillableItemInput) =>
    apiClient.put<BillableItemCatalogRow>(`${hospitalBase(orgSlug)}/billing/catalog/${itemId}`, data),
  deactivateCatalogItem: (orgSlug: string, itemId: string) =>
    apiClient.post<BillableItemCatalogRow>(`${hospitalBase(orgSlug)}/billing/catalog/${itemId}/deactivate`, {}),

  // PatientNextOfKin — the Settle Account modal's picker/create source.
  listNextOfKin: (orgSlug: string, patientId: string) =>
    apiClient.get<{ data: NextOfKin[] }>(`${hospitalBase(orgSlug)}/patients/${patientId}/next-of-kin`).then(unwrapList),
  createNextOfKin: (orgSlug: string, patientId: string, data: CreateNextOfKinInput) =>
    apiClient.post<NextOfKin>(`${hospitalBase(orgSlug)}/patients/${patientId}/next-of-kin`, data),
};
