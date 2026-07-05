import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  attemptNativeAppleSignIn,
  getNativeAppleSignIn,
  isLikelyUserCancellation,
  type SupabaseIdTokenAuth,
} from '@/utils/nativeAppleSignIn';

function setBridge(fn: unknown): void {
  (window as unknown as { ChravelNative?: Record<string, unknown> }).ChravelNative = {
    signInWithApple: fn,
  };
}

describe('attemptNativeAppleSignIn', () => {
  afterEach(() => {
    delete (window as unknown as { ChravelNative?: unknown }).ChravelNative;
    vi.restoreAllMocks();
  });

  it('authenticates via signInWithIdToken with the RAW nonce when the bridge is present', async () => {
    setBridge(
      vi.fn().mockResolvedValue({
        identityToken: 'id-token',
        rawNonce: 'raw-nonce',
        authorizationCode: 'auth-code',
      }),
    );
    const signInWithIdToken = vi.fn().mockResolvedValue({ error: null });

    const outcome = await attemptNativeAppleSignIn({ signInWithIdToken } as SupabaseIdTokenAuth);

    expect(signInWithIdToken).toHaveBeenCalledWith({
      provider: 'apple',
      token: 'id-token',
      nonce: 'raw-nonce',
    });
    expect(outcome).toEqual({ handled: true, authorizationCode: 'auth-code' });
  });

  it('reports bridge-missing (handled: false) and does not call signInWithIdToken when the bridge is absent', async () => {
    const signInWithIdToken = vi.fn();

    const outcome = await attemptNativeAppleSignIn({ signInWithIdToken } as SupabaseIdTokenAuth);

    expect(outcome).toEqual({ handled: false, unhandledReason: 'bridge-missing' });
    expect(signInWithIdToken).not.toHaveBeenCalled();
  });

  it('reports bridge-threw with the underlying cause when the native sheet throws (e.g. user canceled)', async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    const cause = new Error('user canceled');
    setBridge(vi.fn().mockRejectedValue(cause));
    const signInWithIdToken = vi.fn();

    const outcome = await attemptNativeAppleSignIn({ signInWithIdToken } as SupabaseIdTokenAuth);

    expect(outcome.handled).toBe(false);
    expect(outcome.unhandledReason).toBe('bridge-threw');
    expect(outcome.cause).toBe(cause);
    expect(signInWithIdToken).not.toHaveBeenCalled();
  });

  it('surfaces the provider error (handled) when signInWithIdToken fails', async () => {
    setBridge(vi.fn().mockResolvedValue({ identityToken: 't', rawNonce: 'n' }));
    const signInWithIdToken = vi
      .fn()
      .mockResolvedValue({ error: { message: 'provider is not enabled' } });

    const outcome = await attemptNativeAppleSignIn({ signInWithIdToken } as SupabaseIdTokenAuth);

    expect(outcome).toEqual({ handled: true, error: 'provider is not enabled' });
  });

  it('reports incomplete-credential when the native credential is incomplete', async () => {
    setBridge(vi.fn().mockResolvedValue({ identityToken: '', rawNonce: '' }));
    const signInWithIdToken = vi.fn();

    const outcome = await attemptNativeAppleSignIn({ signInWithIdToken } as SupabaseIdTokenAuth);

    expect(outcome).toEqual({ handled: false, unhandledReason: 'incomplete-credential' });
    expect(signInWithIdToken).not.toHaveBeenCalled();
  });

  it('reports timeout instead of hanging forever when the native bridge promise never settles', async () => {
    vi.useFakeTimers();
    try {
      vi.spyOn(console, 'warn').mockImplementation(() => {});
      // Simulates a stuck ASAuthorizationController delegate on the native side: the bridge
      // function returns a promise that never resolves or rejects.
      setBridge(vi.fn().mockReturnValue(new Promise(() => {})));
      const signInWithIdToken = vi.fn();

      const outcomePromise = attemptNativeAppleSignIn({
        signInWithIdToken,
      } as SupabaseIdTokenAuth);
      await vi.advanceTimersByTimeAsync(20_000);
      const outcome = await outcomePromise;

      expect(outcome).toEqual({ handled: false, unhandledReason: 'timeout' });
      expect(signInWithIdToken).not.toHaveBeenCalled();
    } finally {
      vi.useRealTimers();
    }
  });
});

describe('isLikelyUserCancellation', () => {
  it('matches canceled / cancelled / 1001 messages', () => {
    expect(isLikelyUserCancellation(new Error('The user canceled the request.'))).toBe(true);
    expect(isLikelyUserCancellation(new Error('Sign in was cancelled'))).toBe(true);
    expect(
      isLikelyUserCancellation('com.apple.AuthenticationServices.AuthorizationError error 1001'),
    ).toBe(true);
  });

  it('does not match genuine errors or empty causes', () => {
    expect(isLikelyUserCancellation(new Error('network offline'))).toBe(false);
    expect(isLikelyUserCancellation(undefined)).toBe(false);
    expect(isLikelyUserCancellation(null)).toBe(false);
  });
});

describe('getNativeAppleSignIn', () => {
  afterEach(() => {
    delete (window as unknown as { ChravelNative?: unknown }).ChravelNative;
  });

  it('returns null when no bridge is injected', () => {
    expect(getNativeAppleSignIn()).toBeNull();
  });

  it('returns the bridge function when injected', () => {
    const fn = vi.fn();
    setBridge(fn);
    expect(getNativeAppleSignIn()).toBe(fn);
  });
});
