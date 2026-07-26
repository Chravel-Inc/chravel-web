import type { Format } from './types';

/**
 * Format-aware layout.
 *
 * Social crops are not just a resize. Reels and TikTok overlay their own UI over
 * roughly the top 12% and bottom 20% of a 9:16 frame, so anything that must be
 * read lives inside `safeTop`/`safeBottom`. Square posts have no such overlay but
 * far less vertical room, so the type scale drops rather than the copy wrapping
 * into four lines.
 */
export interface LayoutSpec {
  /** Headline size in px. */
  headline: number;
  /** Supporting/label size in px. */
  body: number;
  /** Small caps eyebrow size in px. */
  eyebrow: number;
  /** Horizontal gutter in px. */
  gutter: number;
  /** Reserved space at the top, in px. */
  safeTop: number;
  /** Reserved space at the bottom, in px. */
  safeBottom: number;
  /** Max width for text blocks, in px. */
  textMax: number;
  /** Scale multiplier for the phone frame. */
  phoneScale: number;
}

export const LAYOUT: Record<Format, LayoutSpec> = {
  // 1080x1920
  vertical: {
    headline: 82,
    body: 36,
    eyebrow: 24,
    gutter: 96,
    safeTop: 230,
    safeBottom: 380,
    textMax: 880,
    // 280x606 base * 2.05 ≈ 574x1242 — fills the 1080x1920 frame without colliding
    // with the label pill below it.
    phoneScale: 2.05,
  },
  // 1080x1080
  square: {
    headline: 66,
    body: 31,
    eyebrow: 21,
    gutter: 84,
    safeTop: 90,
    safeBottom: 110,
    textMax: 900,
    phoneScale: 1.3,
  },
  // 1920x1080
  wide: {
    headline: 78,
    body: 34,
    eyebrow: 23,
    gutter: 140,
    safeTop: 110,
    safeBottom: 130,
    textMax: 1180,
    phoneScale: 1.2,
  },
};

export const DIMENSIONS: Record<Format, { width: number; height: number }> = {
  vertical: { width: 1080, height: 1920 },
  square: { width: 1080, height: 1080 },
  wide: { width: 1920, height: 1080 },
};
