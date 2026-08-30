'use client';

import { useState } from 'react';
import { Loader2, ShieldCheck, X } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/base';
import { apiErrorMessage } from '@/lib/api/error-message';
import { useInsuranceProviders } from '@/hooks/useBilling';
import type { InsuranceClaimResult } from '@/lib/api/billing';

interface InsuranceClaimModalProps {
  /** What's being claimed — shown in the modal header (e.g. an order/prescription number). */
  title: string;
  amountLabel?: string;
  /** Caller normalizes its own response shape down to InsuranceClaimResult (Lab/Pharmacy return
   * `{order|prescription, claim}`; Billing's visit-level route returns it directly). */
  onSubmit: (input: { provider_id: string; coverage_id?: string }) => Promise<InsuranceClaimResult>;
  onClose: () => void;
}

/** Shared insurance-claim submission modal — Lab, Pharmacy and Billing's own visit-level
 * insurance action all use this one component instead of three near-identical copies.
 * Submits a claim against a provider (picked from treasury-api's configured list, never a raw
 * UUID text box) and reports whether the claim was accepted immediately or is still pending
 * async adjudication (SHA's mediator_id pattern — see billing.Service.SubmitInsuranceClaim's
 * doc comment). */
export function InsuranceClaimModal({ title, amountLabel, onSubmit, onClose }: InsuranceClaimModalProps) {
  const { data: providers = [], isLoading: providersLoading } = useInsuranceProviders();
  const [providerId, setProviderId] = useState('');
  const [coverageId, setCoverageId] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<InsuranceClaimResult | null>(null);

  const activeProviders = providers.filter((p) => p.is_active);

  const handleSubmit = async () => {
    if (!providerId) {
      toast.error('Select an insurance provider');
      return;
    }
    setSubmitting(true);
    try {
      const claimResult = await onSubmit({ provider_id: providerId, coverage_id: coverageId.trim() || undefined });
      setResult(claimResult);
      toast.success(claimResult.accepted ? 'Claim accepted — charges exempted.' : 'Claim submitted — pending adjudication.');
    } catch (e) {
      toast.error(await apiErrorMessage(e, 'Failed to submit insurance claim'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-card rounded-2xl border border-border w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center">
              <ShieldCheck className="h-4.5 w-4.5 text-primary" />
            </div>
            <div>
              <h3 className="font-bold text-base">Bill to Insurance</h3>
              <p className="text-xs text-muted-foreground">{title}</p>
            </div>
          </div>
          <button onClick={onClose} className="h-9 w-9 rounded-xl flex items-center justify-center hover:bg-accent">
            <X className="h-4 w-4" />
          </button>
        </div>

        {result ? (
          <div className="p-6 space-y-4">
            <div className={`rounded-xl border px-4 py-3 text-sm ${result.accepted ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-600' : 'border-amber-500/30 bg-amber-500/10 text-amber-600'}`}>
              {result.accepted
                ? 'Claim accepted — the outstanding charge(s) are now exempted (settled via insurance).'
                : `Claim submitted, status: ${result.claim.status}. Not yet finalized — check back or poll for status.`}
            </div>
            <Button className="w-full" onClick={onClose}>Done</Button>
          </div>
        ) : (
          <>
            <div className="p-6 space-y-4">
              {amountLabel && (
                <div className="rounded-xl border border-border bg-background/50 px-4 py-3 flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Amount</span>
                  <span className="text-lg font-bold">{amountLabel}</span>
                </div>
              )}
              <div>
                <label className="text-xs font-semibold text-muted-foreground mb-1 block">
                  Insurance Provider <span className="text-destructive">*</span>
                </label>
                <select
                  value={providerId}
                  onChange={(e) => setProviderId(e.target.value)}
                  disabled={providersLoading}
                  className="w-full bg-background border border-border rounded-xl py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 disabled:opacity-60"
                >
                  <option value="">{providersLoading ? 'Loading providers…' : 'Select a provider'}</option>
                  {activeProviders.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
                {!providersLoading && activeProviders.length === 0 && (
                  <p className="text-xs text-muted-foreground mt-1.5">
                    No insurance providers are configured for this tenant yet — set one up in treasury's insurance admin first.
                  </p>
                )}
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground mb-1 block">Coverage ID (optional)</label>
                <input
                  value={coverageId}
                  onChange={(e) => setCoverageId(e.target.value)}
                  placeholder="Leave blank to use the provider's default"
                  className="w-full bg-background border border-border rounded-xl py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
              </div>
            </div>
            <div className="flex gap-3 px-6 pb-6">
              <Button variant="outline" className="flex-1" onClick={onClose} disabled={submitting}>
                Cancel
              </Button>
              <Button className="flex-1 gap-2" onClick={handleSubmit} disabled={submitting || !providerId}>
                {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                Submit Claim
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
