import React, { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { logAuthEvent } from '@/utils/authTelemetry';

type MfaChallengeGateProps = {
  open: boolean;
  onVerified: () => void;
};

/**
 * Full-screen gate when the user has enrolled MFA (TOTP or phone) but the current
 * JWT is still at AAL1. Supabase does not complete sign-in until challenge + verify.
 */
export function MfaChallengeGate({ open, onVerified }: MfaChallengeGateProps) {
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setError('');
      const trimmed = code.trim();
      if (!trimmed) {
        setError('Enter the code from your authenticator app.');
        return;
      }

      setSubmitting(true);
      try {
        const { data: factorsData, error: listError } = await supabase.auth.mfa.listFactors();
        if (listError) {
          setError(listError.message);
          return;
        }

        const totpVerified =
          factorsData.totp?.find(f => f.status === 'verified') ?? factorsData.totp?.[0];
        const phoneVerified =
          factorsData.phone?.find(f => f.status === 'verified') ?? factorsData.phone?.[0];
        const factor = totpVerified ?? phoneVerified;

        if (!factor) {
          setError('No verified second factor found. Contact support or try signing in again.');
          return;
        }

        const { data: challengeData, error: challengeError } = await supabase.auth.mfa.challenge({
          factorId: factor.id,
        });
        if (challengeError || !challengeData) {
          setError(challengeError?.message ?? 'Could not start verification. Try again.');
          return;
        }

        const { error: verifyError } = await supabase.auth.mfa.verify({
          factorId: factor.id,
          challengeId: challengeData.id,
          code: trimmed,
        });

        if (verifyError) {
          logAuthEvent('login_failure', {
            method: `mfa_${factor.factor_type}`,
            errorReason: verifyError.message,
          });
          setError(verifyError.message);
          return;
        }

        logAuthEvent('login_success', { method: `mfa_${factor.factor_type}` });
        setCode('');
        onVerified();
      } finally {
        setSubmitting(false);
      }
    },
    [code, onVerified],
  );

  const handleSignOut = useCallback(async () => {
    setError('');
    setCode('');
    await supabase.auth.signOut();
  }, []);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[200] flex items-end tablet:items-center justify-center bg-black/90 backdrop-blur-sm p-4 animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="mfa-challenge-title"
    >
      <div className="w-full max-w-md rounded-2xl border border-white/20 bg-white/10 p-6 shadow-xl backdrop-blur-md">
        <h2 id="mfa-challenge-title" className="text-xl font-semibold text-white">
          Two-factor authentication
        </h2>
        <p className="mt-2 text-sm text-gray-300">
          Enter the verification code from your authenticator app or SMS, depending on how your
          account is set up.
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          {error ? (
            <div className="rounded-lg border border-red-500/50 bg-red-500/20 px-3 py-2 text-sm text-red-100">
              {error}
            </div>
          ) : null}

          <div>
            <label htmlFor="mfa-code" className="mb-1 block text-sm text-gray-300">
              Verification code
            </label>
            <input
              id="mfa-code"
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              autoFocus
              value={code}
              onChange={e => setCode(e.target.value.replace(/\s/g, ''))}
              placeholder="6-digit code"
              className="w-full min-h-[48px] rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-base text-white placeholder:text-gray-500 focus:border-glass-orange focus:outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full min-h-[48px] rounded-xl bg-gradient-to-r from-glass-orange to-glass-yellow font-medium text-white transition-transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
          >
            {submitting ? 'Verifying…' : 'Verify and continue'}
          </button>

          <button
            type="button"
            onClick={handleSignOut}
            disabled={submitting}
            className="w-full py-2 text-sm text-gray-400 hover:text-white disabled:opacity-50"
          >
            Sign out
          </button>
        </form>
      </div>
    </div>
  );
}
