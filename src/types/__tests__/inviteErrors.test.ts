import { describe, it, expect } from 'vitest';
import {
  normalizeErrorCode,
  createInviteError,
  isRecoverableError,
  getErrorIconType,
  getErrorSeverity,
  INVITE_ERROR_SPECS,
} from '../inviteErrors';

describe('inviteErrors', () => {
  describe('normalizeErrorCode', () => {
    it('maps legacy codes to new codes', () => {
      expect(normalizeErrorCode('INVALID')).toBe('INVALID_LINK');
      expect(normalizeErrorCode('EXPIRED')).toBe('INVITE_EXPIRED');
      expect(normalizeErrorCode('INACTIVE')).toBe('INVITE_INACTIVE');
      expect(normalizeErrorCode('MAX_USES')).toBe('INVITE_MAX_USES');
      expect(normalizeErrorCode('NOT_FOUND')).toBe('INVITE_NOT_FOUND');
      expect(normalizeErrorCode('NETWORK')).toBe('NETWORK_ERROR');
    });

    it('passes through new codes', () => {
      expect(normalizeErrorCode('AUTH_REQUIRED')).toBe('AUTH_REQUIRED');
      expect(normalizeErrorCode('TRIP_FULL')).toBe('TRIP_FULL');
      expect(normalizeErrorCode('ALREADY_MEMBER')).toBe('ALREADY_MEMBER');
    });

    it('returns UNKNOWN_ERROR for unknown or undefined inputs', () => {
      expect(normalizeErrorCode('SOME_RANDOM_CODE')).toBe('UNKNOWN_ERROR');
      expect(normalizeErrorCode(undefined)).toBe('UNKNOWN_ERROR');
      expect(normalizeErrorCode('')).toBe('UNKNOWN_ERROR');
    });
  });

  describe('createInviteError', () => {
    it('creates an InviteError with default message from spec', () => {
      const error = createInviteError('INVITE_EXPIRED');
      expect(error).toEqual({
        code: 'INVITE_EXPIRED',
        title: INVITE_ERROR_SPECS.INVITE_EXPIRED.title,
        message: INVITE_ERROR_SPECS.INVITE_EXPIRED.message,
        primaryCTA: INVITE_ERROR_SPECS.INVITE_EXPIRED.primaryCTA,
        secondaryCTA: INVITE_ERROR_SPECS.INVITE_EXPIRED.secondaryCTA,
        metadata: undefined,
      });
    });

    it('creates an InviteError with custom message and metadata', () => {
      const customMessage = 'A very custom error message.';
      const metadata = { tripId: 'trip-123' };
      const error = createInviteError('ACCESS_DENIED', metadata, customMessage);

      expect(error.code).toBe('ACCESS_DENIED');
      expect(error.message).toBe(customMessage);
      expect(error.metadata).toEqual(metadata);
      expect(error.title).toBe(INVITE_ERROR_SPECS.ACCESS_DENIED.title);
    });
  });

  describe('isRecoverableError', () => {
    it('returns false for non-recoverable errors', () => {
      expect(isRecoverableError('TRIP_NOT_FOUND')).toBe(false);
      expect(isRecoverableError('APPROVAL_REJECTED')).toBe(false);
    });

    it('returns true for recoverable errors', () => {
      expect(isRecoverableError('INVITE_EXPIRED')).toBe(true);
      expect(isRecoverableError('AUTH_REQUIRED')).toBe(true);
      expect(isRecoverableError('UNKNOWN_ERROR')).toBe(true);
    });
  });

  describe('getErrorIconType', () => {
    it('returns the correct icon type for a given error code', () => {
      expect(getErrorIconType('AUTH_REQUIRED')).toBe('auth');
      expect(getErrorIconType('INVITE_EXPIRED')).toBe('clock');
      expect(getErrorIconType('INVITE_NOT_FOUND')).toBe('alert');
    });
  });

  describe('getErrorSeverity', () => {
    it('returns the correct severity for a given error code', () => {
      expect(getErrorSeverity('AUTH_REQUIRED')).toBe('info');
      expect(getErrorSeverity('INVITE_EXPIRED')).toBe('warning');
      expect(getErrorSeverity('INVITE_NOT_FOUND')).toBe('error');
    });
  });
});
