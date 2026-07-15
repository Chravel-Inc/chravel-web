import { describe, expect, it } from 'vitest';
import {
  hostMatchesAllowlistedDomain,
  isNativeAuthReturnPath,
  preferExistingDeferredPath,
  urlHostMatchesAllowlistedDomain,
} from '@/lib/nativeRoutingGuards';

describe('nativeRoutingGuards', () => {
  describe('isNativeAuthReturnPath', () => {
    it('rejects bare /auth so login pages do not swallow deferred navigation', () => {
      expect(isNativeAuthReturnPath('/auth')).toBe(false);
      expect(isNativeAuthReturnPath('/auth?mode=signin')).toBe(false);
      expect(isNativeAuthReturnPath('/auth?returnTo=%2Ftrip%2F1')).toBe(false);
    });

    it('accepts only session-bearing auth return paths', () => {
      expect(isNativeAuthReturnPath('/auth-callback')).toBe(true);
      expect(isNativeAuthReturnPath('/auth-callback?error=access_denied')).toBe(true);
      expect(isNativeAuthReturnPath('/auth?code=abc123')).toBe(true);
      expect(isNativeAuthReturnPath('/auth#access_token=jwt&refresh_token=refresh')).toBe(true);
    });

    it('rejects Supabase authorization endpoints that are not app return paths', () => {
      expect(isNativeAuthReturnPath('/auth/v1/authorize/')).toBe(false);
      expect(isNativeAuthReturnPath('https://project.supabase.co/auth/v1/authorize/')).toBe(false);
    });
  });

  describe('hostMatchesAllowlistedDomain', () => {
    it('matches exact hosts and real subdomains only', () => {
      expect(hostMatchesAllowlistedDomain('supabase.co', ['supabase.co'])).toBe(true);
      expect(hostMatchesAllowlistedDomain('abc.supabase.co', ['supabase.co'])).toBe(true);
      expect(hostMatchesAllowlistedDomain('p.chravel.app', ['chravel.app'])).toBe(true);
    });

    it('rejects historical suffix-bypass domains', () => {
      expect(hostMatchesAllowlistedDomain('evilsupabase.co', ['supabase.co'])).toBe(false);
      expect(hostMatchesAllowlistedDomain('notsupabase.co', ['supabase.co'])).toBe(false);
      expect(hostMatchesAllowlistedDomain('chravel.app.evil.com', ['chravel.app'])).toBe(false);
      expect(
        urlHostMatchesAllowlistedDomain('https://evilsupabase.co/storage/x.png', ['supabase.co']),
      ).toBe(false);
    });
  });

  describe('preferExistingDeferredPath', () => {
    it('keeps a richer notification route over a generic initial URL', () => {
      expect(
        preferExistingDeferredPath(
          '/trip/trip-1?tab=chat&messageId=msg-1&source=notification',
          '/trip/trip-1',
        ),
      ).toBe('/trip/trip-1?tab=chat&messageId=msg-1&source=notification');
    });

    it('allows a richer candidate to replace a generic existing path', () => {
      expect(
        preferExistingDeferredPath(
          '/trip/trip-1',
          '/trip/trip-1?tab=chat&threadId=thread-1&source=notification',
        ),
      ).toBe('/trip/trip-1?tab=chat&threadId=thread-1&source=notification');
    });
  });
});
