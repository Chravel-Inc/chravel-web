import { describe, it, expect } from 'vitest';
import { getMediaCategory, isBlobOrDataUrl } from '../mediaUtils';

describe('mediaUtils', () => {
  describe('getMediaCategory', () => {
    it('should return "video" for video mime types', () => {
      expect(getMediaCategory('video/mp4')).toBe('video');
      expect(getMediaCategory('video/quicktime')).toBe('video');
      expect(getMediaCategory('video/webm')).toBe('video');
    });

    it('should return "image" for image mime types', () => {
      expect(getMediaCategory('image/jpeg')).toBe('image');
      expect(getMediaCategory('image/png')).toBe('image');
      expect(getMediaCategory('image/webp')).toBe('image');
      expect(getMediaCategory('image/gif')).toBe('image');
    });

    it('should return "document" for other mime types', () => {
      expect(getMediaCategory('application/pdf')).toBe('document');
      expect(getMediaCategory('text/plain')).toBe('document');
      expect(getMediaCategory('application/octet-stream')).toBe('document');
      expect(getMediaCategory('')).toBe('document');
    });
  });

  describe('isBlobOrDataUrl', () => {
    it('should return true for blob URLs', () => {
      expect(isBlobOrDataUrl('blob:https://example.com/uuid')).toBe(true);
    });

    it('should return true for data URLs', () => {
      expect(isBlobOrDataUrl('data:image/png;base64,ivbor...')).toBe(true);
    });

    it('should return false for standard URLs', () => {
      expect(isBlobOrDataUrl('https://example.com/image.png')).toBe(false);
      expect(isBlobOrDataUrl('http://example.com/video.mp4')).toBe(false);
      expect(isBlobOrDataUrl('/path/to/file.jpg')).toBe(false);
    });
  });
});
