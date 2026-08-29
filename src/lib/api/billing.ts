/** hospital-api Sprint 5 core domain: the Distributed Billing & Patient Accounts ledger. Field
 * names match hospital-api's Ent-generated JSON tags — see internal/ent/schema/
 * {patient_account,billable_charge,billable_item_catalog,patient_next_of_kin}.go. Money never
 * lives here — treasury_invoice_id/treasury_payment_intent_id are references only. */

import { apiClient } from './client';
import { hospitalBase, unwrapList } from './types';

export type AccountStatus = 'open' | 'settled' | 'written_off';
export type SettlementRequiredBefore = 'nothing' | 'discharge' | 'body_release';
export type ChargeStatus = 'pending' | 'invoiced' | 'paid' | 'waived' | 'written_off';
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
};
