import { INTER_WOFF2_DATA_URI } from './interFontData';

// Embedded variable font (weights 100-900) registered via a synchronous
// @font-face style tag. Deliberately NO delayRender and NO FontFace.load():
// the bundle is also evaluated on Remotion's composition-selection page, where
// font promises never resolve and timers don't run — an uncleared delayRender
// there detonates after its timeout and kills the whole render (four failed
// runs, each dying at exactly render-speed x timeout frames). A data-URI
// @font-face decodes during style resolution, so glyphs are ready before the
// first captured frame without any async wait.
if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = `@font-face {
    font-family: 'Inter';
    src: url('${INTER_WOFF2_DATA_URI}') format('woff2');
    font-weight: 100 900;
    font-style: normal;
    font-display: block;
  }`;
  document.head.appendChild(style);
}

export const FONT = 'Inter, sans-serif';

// Chravel brand — metallic gold system (see docs/ACCENT_DESIGN_SYSTEM.md)
export const GOLD = '#c49746';
export const GOLD_MID = '#e8af48';
export const GOLD_LIGHT = '#feeaa5';
export const GOLD_DARK = '#533517';

export const BG = '#050505';
export const SURFACE = '#101013';
export const CARD = 'rgba(255,255,255,0.05)';
export const BORDER = 'rgba(255,255,255,0.10)';
export const INK_1 = '#f5f5f4';
export const INK_2 = '#a1a1aa';
export const INK_3 = '#71717a';

export const GOLD_GRADIENT = `linear-gradient(135deg, ${GOLD_DARK} 0%, ${GOLD} 45%, ${GOLD_MID} 75%, ${GOLD_LIGHT} 100%)`;
export const GOLD_TEXT_GRADIENT = `linear-gradient(120deg, ${GOLD} 10%, ${GOLD_MID} 45%, ${GOLD_LIGHT} 80%)`;

// ---- Timeline (30 fps) ----
export const FPS = 30;
export const INTRO_FRAMES = 80;
// 30 extra frames past the right phone's last app-open (internal 951) so the
// final "Messages… again" chip finishes its pop before the scene cut
export const COMPARISON_FRAMES = 1030;
export const FINAL_FRAMES = 190;
export const END_FRAMES = 200;
export const TOTAL_FRAMES = INTRO_FRAMES + COMPARISON_FRAMES + FINAL_FRAMES + END_FRAMES;

// ---- Phone geometry (shared by both phones) ----
export const PHONE_W = 380;
export const PHONE_H = 800;
export const BEZEL = 12;
export const SCREEN_W = PHONE_W - BEZEL * 2; // 356
export const SCREEN_H = PHONE_H - BEZEL * 2; // 776

// Frames the phones take to fly in before either phone's choreography starts
export const SCENE_CONTENT_DELAY = 20;

// ---- Left phone (Chravel) choreography, local to comparison scene ----
export const LEFT_FIRST_SWIPE = 96;
export const LEFT_HOLD = 72;
export const LEFT_SWIPE_DUR = 20;
export const LEFT_CYCLE = LEFT_HOLD + LEFT_SWIPE_DUR; // 92
export const LEFT_TAB_COUNT = 7;
// Frame at which swipe i (0-based, i = 0..5) begins
export const leftSwipeStart = (i: number): number => LEFT_FIRST_SWIPE + i * LEFT_CYCLE;
// Frame at which the "everything in one place" overview zoom starts
export const LEFT_OVERVIEW_START = 700;

// Frames at which each left feature chip appears (tab visited)
export const LEFT_CHIP_FRAMES: number[] = [
  30,
  ...Array.from({ length: LEFT_TAB_COUNT - 1 }, (_, i) => leftSwipeStart(i) + LEFT_SWIPE_DUR),
];

// ---- Right phone (old way) choreography ----
// Each transition: close (20) + home hunt (48) + tap (12) + zoom open (16) = 96
export const R_CLOSE = 20;
export const R_HOME = 48;
export const R_TAP = 12;
export const R_OPEN = 16;
export const R_TRANSITION = R_CLOSE + R_HOME + R_TAP + R_OPEN; // 96
// Pause on home page 1 (within R_HOME) before swiping to page 2
export const R_SWIPE_GAP = 14;
export const R_HOLD = 60;
export const R_FIRST_CLOSE = 75;
// Transition i (0-based, i = 0..5) starts at:
export const rightTransitionStart = (i: number): number =>
  R_FIRST_CLOSE + i * (R_TRANSITION + R_HOLD);

// Frames at which each right app chip appears (app finally open)
export const RIGHT_CHIP_FRAMES: number[] = [
  20,
  ...Array.from({ length: 6 }, (_, i) => rightTransitionStart(i) + R_TRANSITION),
];
