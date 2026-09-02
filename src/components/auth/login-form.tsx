'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, KeyRound, Loader2, Lock, Mail, ShieldCheck } from 'lucide-react';
import { Button, Input } from '@/components/ui/base';
import { useAuthStore } from '@/store/auth';

interface LoginFormProps {
  /** Tenant this login is scoped to — root `/` defaults to the demo tenant (see page.tsx), the
   *  tenant-scoped `/[orgSlug]/login` page passes its own route param. */
  orgSlug: string;
  /** Where to send the user once fully authenticated. Defaults to `/${orgSlug}/dashboard`. */
  redirectTo?: string;
  /** Show the "or continue with SSO" divider + button below the password form. */
  showSSO?: boolean;
  /** Pre-fills the fields (still fully editable) — used by the demo tier picker. Only applied
   *  on mount; pass a `key` on this component from the caller to force a remount when the
   *  picked persona changes. */
  defaultEmail?: string;
  defaultPassword?: string;
}

/**
 * Email+password login (auth-api's public /auth/login, see lib/auth/api.ts), with an inline
 * TOTP step when the account has MFA enabled — the SAME two-step contract hospital-api's own
 * controlled-substance witness re-authentication already relies on (see hospital-api's
 * pharmacy.Service.VerifyWitness), just consumed here for the primary sign-in instead.
 */
export function LoginForm({ orgSlug, redirectTo, showSSO = true, defaultEmail = '', defaultPassword = '' }: LoginFormProps) {
  const router = useRouter();
  const loginWithPassword = useAuthStore((s) => s.loginWithPassword);
  const redirectToSSO = useAuthStore((s) => s.redirectToSSO);
  const status = useAuthStore((s) => s.status);

  const [email, setEmail] = useState(defaultEmail);
  const [password, setPassword] = useState(defaultPassword);
  const [totpCode, setTotpCode] = useState('');
  const [mfaRequired, setMfaRequired] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const destination = redirectTo ?? `/${orgSlug}/dashboard`;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim() || !password) {
      setError('Enter your email and password');
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      const result = await loginWithPassword(orgSlug, email.trim(), password, mfaRequired ? totpCode.trim() : undefined);
      if (result.mfaRequired) {
        setMfaRequired(true);
        return;
      }
      router.replace(destination);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign-in failed — please try again');
    } finally {
      setSubmitting(false);
    }
  }

  const busy = submitting || status === 'loading';

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {!mfaRequired ? (
        <>
          <div className="space-y-1.5">
            <label htmlFor="email" className="text-sm font-medium text-foreground">
              Email address
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="you@facility.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={busy}
                className="pl-10 h-11"
                required
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label htmlFor="password" className="text-sm font-medium text-foreground">
                Password
              </label>
              <a href="#" className="text-xs font-medium text-brand-primary hover:underline">
                Forgot password?
              </a>
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-muted-foreground" />
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={busy}
                className="pl-10 pr-10 h-11"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                tabIndex={-1}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                {showPassword ? <EyeOff className="h-4.5 w-4.5" /> : <Eye className="h-4.5 w-4.5" />}
              </button>
            </div>
          </div>
        </>
      ) : (
        <div className="space-y-1.5">
          <label htmlFor="totp" className="text-sm font-medium text-foreground">
            Two-factor code
          </label>
          <p className="text-xs text-muted-foreground">Enter the 6-digit code from your authenticator app.</p>
          <div className="relative">
            <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-muted-foreground" />
            <Input
              id="totp"
              inputMode="numeric"
              autoComplete="one-time-code"
              placeholder="123456"
              value={totpCode}
              onChange={(e) => setTotpCode(e.target.value)}
              disabled={busy}
              className="pl-10 h-11 tracking-widest"
              autoFocus
              required
            />
          </div>
        </div>
      )}

      {error && (
        <p className="flex items-center gap-1.5 text-sm text-destructive">
          <span className="text-xs">⚠</span>
          {error}
        </p>
      )}

      <Button type="submit" disabled={busy} className="w-full h-11 gap-2 bg-brand-primary text-brand-contrast hover:bg-brand-emphasis">
        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
        {mfaRequired ? 'Verify and sign in' : 'Sign in'}
      </Button>

      {mfaRequired && (
        <button
          type="button"
          onClick={() => {
            setMfaRequired(false);
            setTotpCode('');
            setError(null);
          }}
          className="w-full text-center text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
        >
          Back to password
        </button>
      )}

      {showSSO && !mfaRequired && (
        <>
          <div className="relative flex items-center gap-3 py-1">
            <div className="flex-1 border-t border-border" />
            <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">or</span>
            <div className="flex-1 border-t border-border" />
          </div>
          <button
            type="button"
            onClick={() => void redirectToSSO(orgSlug, destination)}
            disabled={busy}
            className="w-full inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-background px-4 py-2.5 text-sm font-semibold text-foreground hover:bg-accent transition-colors disabled:opacity-60"
          >
            <ShieldCheck className="h-4 w-4" />
            Sign in with SSO
          </button>
        </>
      )}
    </form>
  );
}
