/** Chravel design system tokens for Remotion video compositions */

export const COLORS = {
  // Backgrounds
  background: '#000000',
  surface: '#0f0f0f',
  surfaceLight: '#141414',
  border: '#1a1a1a',
  borderGold: '#2a2010',

  // Gold accent system
  gold: '#c49746',
  goldLight: '#e8af48',
  goldPale: '#feeaa5',
  goldDark: '#a07a32',
  bronze: '#533517',

  // Text
  white: '#ffffff',
  muted: '#999999',
  mutedLight: '#666666',

  // Functional
  chatBlue: '#007AFF',
  chatReceived: '#1c1c1e',
  paymentGreen: '#62D621',
  paymentBg: '#0a2617',
  destructive: '#ef4444',
  aiPurple: '#8b5cf6',

  // Phone frame
  bezel: '#2a2a2e',
  bezelLight: '#3a3a3e',
  bezelDark: '#1a1a1e',
} as const;

export const GRADIENTS = {
  gold: `linear-gradient(135deg, #e8af48 0%, #c49746 50%, #a07a32 100%)`,
  goldButton: `linear-gradient(135deg, ${COLORS.gold} 0%, ${COLORS.goldLight} 100%)`,
  surface: `linear-gradient(135deg, ${COLORS.surface} 0%, ${COLORS.surfaceLight} 100%)`,
  bezel: `linear-gradient(135deg, #3a3a3e 0%, #1a1a1e 100%)`,
  backgroundRadial: `radial-gradient(ellipse at 50% 30%, #0a0a0a 0%, #000000 70%)`,
  goldAmbient: `radial-gradient(circle at 50% 50%, rgba(196,151,70,0.08) 0%, transparent 60%)`,
} as const;

export const SHADOWS = {
  card: '0 4px 8px rgba(0,0,0,0.4), 0 2px 4px rgba(0,0,0,0.3)',
  cardLg: '0 8px 16px rgba(0,0,0,0.5), 0 4px 8px rgba(0,0,0,0.4)',
  goldGlow: '0 8px 32px rgba(232,175,72,0.35), 0 4px 16px rgba(196,151,70,0.25)',
  goldGlowSubtle: '0 4px 16px rgba(232,175,72,0.15), 0 2px 8px rgba(196,151,70,0.10)',
  goldRing: '0 0 12px rgba(232,175,72,0.25), 0 0 4px rgba(196,151,70,0.15)',
  phone: '0 20px 60px rgba(0,0,0,0.8), 0 8px 24px rgba(0,0,0,0.6)',
} as const;

export const FONTS = {
  heading: 'Inter',
  body: 'Inter',
} as const;

/** Typography scale for video (sizes in px) */
export const TYPE = {
  hero: { size: 96, weight: '800' as const, letterSpacing: '-0.02em' },
  heading: { size: 72, weight: '800' as const, letterSpacing: '-0.01em' },
  subheading: { size: 42, weight: '700' as const, letterSpacing: '0' },
  body: { size: 28, weight: '400' as const, letterSpacing: '0' },
  bodyBold: { size: 28, weight: '700' as const, letterSpacing: '0' },
  caption: { size: 22, weight: '600' as const, letterSpacing: '0.15em' },
  small: { size: 18, weight: '400' as const, letterSpacing: '0' },
  // Phone UI scale
  phoneTitle: { size: 18, weight: '700' as const },
  phoneBody: { size: 14, weight: '400' as const },
  phoneCaption: { size: 12, weight: '500' as const },
  phoneSmall: { size: 10, weight: '400' as const },
} as const;

/** Spring animation presets — use with remotion spring() */
export const SPRING = {
  smooth: { damping: 200 },
  snappy: { damping: 20, stiffness: 200 },
  bouncy: { damping: 8, stiffness: 120 },
  gentle: { damping: 200, mass: 2 },
  elastic: { damping: 12, stiffness: 150 },
} as const;

/** Timing presets in frames (at 30fps) */
export const TIMING = {
  fast: 8,
  normal: 15,
  slow: 30,
  dramatic: 45,
  stagger: 6,
  endCard: 90, // 3 seconds
} as const;

/** Phone frame dimensions */
export const PHONE = {
  width: 280,
  height: 606,
  borderRadius: 48,
  screenRadius: 40,
  bezelWidth: 4,
  notchWidth: 120,
  notchHeight: 34,
  statusBarHeight: 44,
  homeIndicatorHeight: 5,
} as const;

export const FPS = 30;
