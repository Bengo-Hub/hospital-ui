'use client';

import { useState } from 'react';
import { CheckCircle2, Loader2, RefreshCw, ShieldCheck, X } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/base';
import { apiErrorMessage } from '@/lib/api/error-message';
import { useInsuranceProviders, useCheckEligibility, usePollInsuranceClaim } from '@/hooks/useBilling';
import type { InsuranceClaimResult } from '@/lib/api/billing';

interface InsuranceClaimModalProps {
  /** What's being claimed — shown in the modal header (e.g. an order/prescription number). */
  title: string;
  amountLabel?: string;
  /** The visit this claim is against — enables the eligibility pre-check step (which hits
   * POST /visits/{visitId}/insurance/check-eligibility). Omit when no visit is on hand; the
   * eligibility step is skipped, submission still works exactly as before. */
  visitId?: string;
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
 * doc comment). Also offers an optional eligibility pre-check and, once a claim is pending, a
 * status refresh / resubmit action (2026-09-02 — these two backend endpoints were real but had
 * zero UI call sites anywhere before this). */
export function InsuranceClaimModal({ title, amountLabel, visitId, onSubmit, onClose }: InsuranceClaimModalProps) {
  const { data: providers = [], isLoading: providersLoading } = useInsuranceProviders();
  const checkEligibility = useCheckEligibility();
  const [providerId, setProviderId] = useState('');
  const [coverageId, setCoverageId] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<InsuranceClaimResult | null>(null);
  const [eligibility, setEligibility] = useState<Record<string, unknown> | null>(null);
  const { data: polledClaim, refetch: refetchClaim, isFetching: polling } = usePollInsuranceClaim(result?.claim.id, false);

  const activeProviders = providers.filter((p) => p.is_active);

  const handleCheckEligibility = async () => {
    if (!providerId || !visitId) return;
    setEligibility(null);
    try {
      const data = await checkEligibility.mutateAsync({ visitId, providerId });
      setEligibility(data);
    } catch (e) {
      toast.error(await apiErrorMessage(e, 'Eligibility check failed — you can still submit the claim'));
    }
  };

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

  // Re-submitting is idempotent on the underlying order/prescription id treasury-api-side (see
  // billing.Service.PollInsuranceClaim's own doc comment) — this is what actually finalizes/
  // exempts the charge once the payer has adjudicated, unlike a plain status poll which only
  // reads the claim's current status without touching any charge.
  const handleResubmit = async () => {
    setSubmitting(true);
    try {
      const claimResult = await onSubmit({ provider_id: providerId, coverage_id: coverageId.trim() || undefined });
      setResult(claimResult);
      toast.success(claimResult.accepted ? 'Claim accepted — charges exempted.' : `Still pending, status: ${claimResult.claim.status}`);
    } catch (e) {
      toast.error(await apiErrorMessage(e, 'Failed to check claim'));
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
                : `Claim submitted, status: ${result.claim.status}. Not yet finalized.`}
            </div>
            {!result.accepted && (
              <div className="rounded-xl border border-border bg-background/50 px-4 py-3 space-y-2.5">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-xs font-semibold text-muted-foreground">
                    {polledClaim ? `Latest status: ${polledClaim.status}` : 'Check the payer\'s current adjudication status'}
                  </span>
                  <Button
                    size="sm"
                    variant="outline"
                    className="gap-1.5 shrink-0"
                    onClick={() => refetchClaim()}
                    disabled={polling}
                  >
                    {polling ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
                    Refresh Status
                  </Button>
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Refreshing only reads the current status. Once the payer has adjudicated, resubmit to finalize and exempt the charge.
                </p>
                <Button size="sm" className="w-full gap-1.5" onClick={handleResubmit} disabled={submitting}>
                  {submitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  Resubmit / Check for Approval
                </Button>
              </div>
            )}
            <Button variant="outline" className="w-full" onClick={onClose}>Done</Button>
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
              {visitId && providerId && (
                <div>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="gap-1.5"
                    onClick={handleCheckEligibility}
                    disabled={checkEligibility.isPending}
                  >
                    {checkEligibility.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ShieldCheck className="h-3.5 w-3.5" />}
                    Check Eligibility
                  </Button>
                  {eligibility && (
                    <div className="mt-2 rounded-xl border border-border bg-background/50 px-3 py-2 text-xs space-y-1">
                      <div className="flex items-center gap-1.5 font-semibold text-muted-foreground">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        Eligibility response
                      </div>
                      {Object.entries(eligibility).map(([key, value]) => (
                        <div key={key} className="flex items-center justify-between gap-3">
                          <span className="text-muted-foreground">{key}</span>
                          <span className="font-mono truncate max-w-[220px]">{String(value)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  <p className="text-[11px] text-muted-foreground mt-1.5">
                    Optional — a failed or skipped check never blocks submitting the claim.
                  </p>
                </div>
              )}
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
