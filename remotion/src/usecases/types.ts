/**
 * Types for the per-use-case brand films.
 *
 * One `Scenario` drives every output format. The film component reads the same
 * manifest for 9:16, 1:1, and the anthem vignette — there is no second edit to
 * keep in sync, only a `Format` switch that changes framing and which beats run.
 */

export type Format = 'vertical' | 'square' | 'wide';

/** Which product surface a resolution beat shows. Maps to real captures in public/captures. */
export interface SolutionBeat {
  /** Short on-screen label. Rendered in Inter by Remotion — never baked into an AI plate. */
  label: string;
  /** Filename in public/captures/mobile (e.g. 'm-calendar.png'). */
  capture: string;
}

/**
 * A live-action plate slot.
 *
 * `clip` is optional on purpose: until AI footage exists, `Plate` falls back to
 * `still` with a slow push, so every composition renders complete from day one.
 */
export interface PlateRef {
  /** Filename in public/plates/clips (e.g. 'wedding-coldopen.mp4'). Optional. */
  clip?: string;
  /** Filename in public/plates/stills — the always-present fallback. */
  still: string;
  /** Ken Burns direction for the still fallback. */
  push?: 'in' | 'out';
  /** 0-1. How far to crush the plate toward black so white text stays legible. */
  darken?: number;
}

export interface Scenario {
  /** 1-11, drives the ordinal shown in the lockup. */
  index: number;
  /** Matches the app's use-case slug where one exists. Used for output filenames. */
  slug: string;
  /** Card title from the app. */
  title: string;
  /** Audience line — the '·' separated subtitle from the landing card. */
  audience: string;

  /** Cold-open line: the chaos. Verbatim `scenario.before`. */
  before: string;
  /** Resolution line: the fix. Verbatim `scenario.after`. */
  after: string;
  /** Lockup line. Verbatim `scenario.badge`. */
  badge: string;
  /** Closing CTA heading, from the use-case page's `cta.heading`. */
  ctaHeading: string;

  /** 3 short pain fragments for the escalation cuts. Condensed from `featureMap[].pain`. */
  pains: string[];
  /** 2-3 product beats for the resolution. From `featureMap[].solution`. */
  solutions: SolutionBeat[];

  /** Live-action slots. */
  plates: {
    coldOpen: PlateRef;
    turn: PlateRef;
    payoff: PlateRef;
  };
}
