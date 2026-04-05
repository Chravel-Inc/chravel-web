import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  parseJwtPayload,
  validateToken,
  isSessionTokenValid,
  logTokenDebug,
  TokenPayload,
} from '../tokenValidation';

// Helper to create a fake JWT string given a payload object
function createFakeJwt(payload: Partial<TokenPayload>): string {
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const body = btoa(JSON.stringify(payload))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
  const signature = 'fake-signature';
  return `${header}.${body}.${signature}`;
}

describe('tokenValidation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  describe('parseJwtPayload', () => {
    it('should correctly parse a valid JWT payload', () => {
      const payload: TokenPayload = {
        sub: '123e4567-e89b-12d3-a456-426614174000',
        exp: Math.floor(Date.now() / 1000) + 3600, // Expires in 1 hour
        iss: 'supabase',
      };
      const token = createFakeJwt(payload);
      const parsed = parseJwtPayload(token);
      expect(parsed).toEqual(payload);
    });

    it('should return null for empty or non-string token', () => {
      expect(parseJwtPayload('')).toBeNull();
      expect(parseJwtPayload(null as any)).toBeNull();
      expect(parseJwtPayload(123 as any)).toBeNull();
    });

    it('should return null and warn for token with invalid structure', () => {
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const token = 'header.payload'; // Only 2 parts
      expect(parseJwtPayload(token)).toBeNull();
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        '[TokenValidation] Invalid JWT structure - expected 3 parts, got',
        2,
      );
    });

    it('should return null and warn for invalid base64url payload', () => {
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      // Create a token with invalid base64 in the payload section
      const token = 'header.invalid_base64!.signature';
      expect(parseJwtPayload(token)).toBeNull();
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        '[TokenValidation] Failed to base64url-decode JWT payload',
      );
    });

    it('should handle atob absence gracefully', () => {
      // Mock globalThis.atob
      const originalAtob = globalThis.atob;
      (globalThis as any).atob = undefined;
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      const payload = { sub: 'test' };
      const token = createFakeJwt(payload);

      expect(parseJwtPayload(token)).toBeNull();
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        '[TokenValidation] Failed to base64url-decode JWT payload',
      );

      globalThis.atob = originalAtob;
    });

    it('should catch and log errors during parsing', () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      // Provide valid base64 but invalid JSON
      const header = btoa(JSON.stringify({ alg: 'HS256' }));
      const payload = btoa('invalid json');
      const token = `${header}.${payload}.sig`;

      expect(parseJwtPayload(token)).toBeNull();
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        '[TokenValidation] Failed to parse JWT:',
        expect.any(Error),
      );
    });
  });

  describe('validateToken', () => {
    it('should return valid for a correct token', () => {
      const payload: TokenPayload = {
        sub: '123e4567-e89b-12d3-a456-426614174000', // Valid UUID
        exp: Math.floor(Date.now() / 1000) + 3600, // Future
      };
      const result = validateToken(createFakeJwt(payload));
      expect(result).toEqual({ valid: true });
    });

    it('should fail if token parsing fails', () => {
      const result = validateToken('invalid-token');
      expect(result).toEqual({ valid: false, reason: 'TOKEN_PARSE_FAILED' });
    });

    it('should fail if missing sub claim', () => {
      const payload: TokenPayload = {
        exp: Math.floor(Date.now() / 1000) + 3600,
      };
      const result = validateToken(createFakeJwt(payload));
      expect(result).toEqual({ valid: false, reason: 'MISSING_SUB_CLAIM' });
    });

    it('should fail if missing exp claim', () => {
      const payload: TokenPayload = {
        sub: '123e4567-e89b-12d3-a456-426614174000',
      };
      const result = validateToken(createFakeJwt(payload));
      expect(result).toEqual({ valid: false, reason: 'MISSING_EXP_CLAIM' });
    });

    it('should fail if token is expired', () => {
      const payload: TokenPayload = {
        sub: '123e4567-e89b-12d3-a456-426614174000',
        exp: Math.floor(Date.now() / 1000) - 3600, // Past
      };
      const result = validateToken(createFakeJwt(payload));
      expect(result).toEqual({ valid: false, reason: 'TOKEN_EXPIRED' });
    });

    it('should fail if sub is not a valid UUID format', () => {
      const payload: TokenPayload = {
        sub: 'invalid-uuid-format',
        exp: Math.floor(Date.now() / 1000) + 3600,
      };
      const result = validateToken(createFakeJwt(payload));
      expect(result).toEqual({ valid: false, reason: 'INVALID_SUB_FORMAT' });
    });
  });

  describe('isSessionTokenValid', () => {
    it('should return true for a valid token', () => {
      const payload: TokenPayload = {
        sub: '123e4567-e89b-12d3-a456-426614174000',
        exp: Math.floor(Date.now() / 1000) + 3600,
      };
      expect(isSessionTokenValid(createFakeJwt(payload))).toBe(true);
    });

    it('should return false for undefined token', () => {
      expect(isSessionTokenValid(undefined)).toBe(false);
    });

    it('should return false and warn in DEV mode for invalid token', () => {
      const originalDev = import.meta.env.DEV;
      (import.meta.env as any).DEV = true;

      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      expect(isSessionTokenValid('invalid-token')).toBe(false);
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        '[TokenValidation] Invalid token detected:',
        'TOKEN_PARSE_FAILED',
      );

      (import.meta.env as any).DEV = originalDev;
    });

    it('should return false but not warn in non-DEV mode for invalid token', () => {
      const originalDev = import.meta.env.DEV;
      (import.meta.env as any).DEV = false;

      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      expect(isSessionTokenValid('invalid-token')).toBe(false);

      const hasInvalidTokenDetectedLog = consoleWarnSpy.mock.calls.some(
        call => call[0] === '[TokenValidation] Invalid token detected:',
      );
      expect(hasInvalidTokenDetectedLog).toBe(false);

      (import.meta.env as any).DEV = originalDev;
    });
  });

  describe('logTokenDebug', () => {
    it('should not log anything if not in DEV mode', () => {
      const originalDev = import.meta.env.DEV;
      (import.meta.env as any).DEV = false;

      const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      logTokenDebug('test', 'token');
      expect(consoleLogSpy).not.toHaveBeenCalled();

      (import.meta.env as any).DEV = originalDev;
    });

    it('should log when no token is present', () => {
      const originalDev = import.meta.env.DEV;
      (import.meta.env as any).DEV = true;

      const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      logTokenDebug('test context', undefined);
      expect(consoleLogSpy).toHaveBeenCalledWith('[TokenDebug - test context] No token present');

      (import.meta.env as any).DEV = originalDev;
    });

    it('should log error when token parsing fails', () => {
      const originalDev = import.meta.env.DEV;
      (import.meta.env as any).DEV = true;

      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      logTokenDebug('test context', 'invalid-token');
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        '[TokenDebug - test context] Failed to parse token',
      );

      (import.meta.env as any).DEV = originalDev;
    });

    it('should log token details for valid token', () => {
      const originalDev = import.meta.env.DEV;
      (import.meta.env as any).DEV = true;

      const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      const payload: TokenPayload = {
        sub: '123e4567-e89b-12d3-a456-426614174000',
        exp: Math.floor(Date.now() / 1000) + 3600,
        iss: 'supabase-iss',
      };
      logTokenDebug('test context', createFakeJwt(payload));

      expect(consoleLogSpy).toHaveBeenCalledWith(
        '[TokenDebug - test context]',
        expect.objectContaining({
          hasSub: true,
          sub: '123e4567...',
          iss: 'supabase-iss',
          isExpired: false,
        }),
      );

      (import.meta.env as any).DEV = originalDev;
    });
  });
});
