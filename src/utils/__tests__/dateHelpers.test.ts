import { describe, it, expect } from 'vitest';
import { parseLocalDate } from '../dateHelpers';

describe('dateHelpers', () => {
  describe('parseLocalDate', () => {
    it('should correctly parse YYYY-MM-DD into local Date', () => {
      const date = parseLocalDate('2023-10-05');
      // Should not shift timezone
      expect(date.getFullYear()).toBe(2023);
      expect(date.getMonth()).toBe(9); // 0-indexed
      expect(date.getDate()).toBe(5);
    });

    it('should fallback to current date for empty string', () => {
      const date = parseLocalDate('');
      const now = new Date();
      expect(date.getFullYear()).toBe(now.getFullYear());
      expect(date.getMonth()).toBe(now.getMonth());
      expect(date.getDate()).toBe(now.getDate());
    });

    it('should handle malformed standard dates', () => {
      const date = parseLocalDate('invalid-date');
      const now = new Date();
      expect(date.getFullYear()).toBe(now.getFullYear());
      expect(date.getMonth()).toBe(now.getMonth());
      expect(date.getDate()).toBe(now.getDate());
    });
  });
});
