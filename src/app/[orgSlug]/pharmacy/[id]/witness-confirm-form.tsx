'use client';

import { useState } from 'react';
import { CheckCircle2, Loader2, ShieldCheck } from 'lucide-react';
import { Button, Input } from '@/components/ui/base';
import { apiErrorMessage } from '@/lib/api/error-message';
import { useVerifyWitness } from '@/hooks/usePharmacy';

/** A verified, in-memory-only witness credential for ONE dispense action. Never persisted to
 * localStorage/anywhere durable — it lives only in the dispense modal's component state and is
 * discarded the moment the modal closes (unmounts) or the dispense submits/expires.
 *
 * ONE confirmation covers every witness-requiring line in the same dispense request: hospital-
 * api's pharmacy.Service.Dispense validates each line's witness_token independently (a stateless
 * JWT check — signature/purpose/tenant/expiry only, no single-use/consumption tracking), so the
 * exact same token verifies successfully for every line as long as it's sent before it expires.
 * There is deliberately no per-line witness confirmation UI. */
export interface ConfirmedWitness {
  token: string;
  name: string;
  confirmedAt: number;
  expiresIn: number;
}

interface WitnessConfirmFormProps {
  confirmedWitness: ConfirmedWitness | null;
  onConfirmed: (witness: ConfirmedWitness) => void;
  /** Shown above the credentials form — used to explain why a prior confirmation was cleared
   * (e.g. the token expired before the dispense was submitted). */
  noticeMessage?: string | null;
}

export function WitnessConfirmForm({ confirmedWitness, onConfirmed, noticeMessage }: WitnessConfirmFormProps) {
  const verifyWitness = useVerifyWitness();
  const [phase, setPhase] = useState<'credentials' | 'mfa'>('credentials');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [totpCode, setTotpCode] = useState('');
  const [error, setError] = useState<string | null>(null);

  if (confirmedWitness) {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-green-500/30 bg-green-500/10 px-3 py-2 text-sm text-green-700 dark:text-green-400">
        <CheckCircle2 className="h-4 w-4 shrink-0" />
        <span className="font-medium">Witness confirmed: {confirmedWitness.name}</span>
      </div>
    );
  }

  const submit = async () => {
    if (!email.trim() || !password) {
      setError('Enter the witness’s email and password');
      return;
    }
    setError(null);
    try {
      const res = await verifyWitness.mutateAsync({
        email: email.trim(),
        password,
        totp_code: phase === 'mfa' ? totpCode.trim() : undefined,
      });
      if (res.mfa_required) {
        setPhase('mfa');
        return;
      }
      if (!res.witness_token) {
        setError('Witness verification did not return a token — try again');
        return;
      }
      onConfirmed({
        token: res.witness_token,
        name: res.witness_name || 'Witness',
        confirmedAt: Date.now(),
        expiresIn: res.expires_in ?? 120,
      });
      setPhase('credentials');
      setEmail('');
      setPassword('');
      setTotpCode('');
    } catch (e) {
      setError(await apiErrorMessage(e, 'Witness verification failed'));
    }
  };

  return (
    <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-3 space-y-2.5">
      <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-700 dark:text-amber-400">
        <ShieldCheck className="h-3.5 w-3.5" />
        Confirm witness identity
      </div>
      {noticeMessage && <p className="text-xs text-amber-700 dark:text-amber-400">{noticeMessage}</p>}
      {phase === 'credentials' ? (
        <>
          <p className="text-xs text-muted-foreground">
            The witness must re-enter their own login credentials (a different staff member than the person dispensing).
          </p>
          <Input
            type="email"
            autoComplete="off"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Witness email"
          />
          <Input
            type="password"
            autoComplete="off"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Witness password"
            onKeyDown={(e) => {
              if (e.key === 'Enter') submit();
            }}
          />
        </>
      ) : (
        <>
          <p className="text-xs text-muted-foreground">
            This account requires a verification code. Enter the current code from the witness&apos;s authenticator app.
          </p>
          <Input
            value={totpCode}
            onChange={(e) => setTotpCode(e.target.value)}
            placeholder="6-digit code"
            inputMode="numeric"
            autoComplete="one-time-code"
            onKeyDown={(e) => {
              if (e.key === 'Enter') submit();
            }}
          />
        </>
      )}
      {error && <p className="text-xs text-destructive">{error}</p>}
      <Button
        type="button"
        size="sm"
        className="gap-2"
        onClick={submit}
        disabled={verifyWitness.isPending || (phase === 'credentials' ? !email.trim() || !password : !totpCode.trim())}
      >
        {verifyWitness.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ShieldCheck className="h-3.5 w-3.5" />}
        Confirm as Witness
      </Button>
    </div>
  );
}
