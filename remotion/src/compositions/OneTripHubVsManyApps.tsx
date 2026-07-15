import {
  AbsoluteFill,
  Easing,
  Sequence,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import { loadFont } from '@remotion/google-fonts/Inter';
import { COLORS, FPS, SHADOWS, SPRING, TIMING } from '../theme';
import { TravelBackground } from '../components/TravelBackground';
import { EndCard } from '../components/EndCard';
import { RealisticPhoneShell } from '../components/comparison/RealisticPhoneShell';
import {
  CHRAVEL_CYCLE_FRAMES,
  CHRAVEL_TABS,
  ChravelSwipeContent,
  getChravelTabAtFrame,
} from '../components/comparison/ChravelSwipeContent';
import { FragmentedPhoneContent } from '../components/comparison/FragmentedPhoneContent';

const { fontFamily } = loadFont('normal', {
  weights: ['400', '600', '700', '800'],
  subsets: ['latin'],
});

/**
 * Timeline (30fps):
 *  0–45     Intro — labels + phones enter
 *  45–690    Side-by-side comparison (left fast, right slow)
 *  720–810  Final comparison frame + taglines
 *  810–900  End card
 */
export const ONE_TRIP_HUB_DURATION = 30 * FPS; // 900 frames / 30s

const COMPARE_START = 45;
const FINALE_START = 720;
const ENDCARD_START = ONE_TRIP_HUB_DURATION - TIMING.endCard;

/** Product comparison: Chravel one-hub vs fragmented multi-app workflow */
export const OneTripHubVsManyApps: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const intro = spring({ frame, fps, delay: 4, config: SPRING.gentle });
  const labelIntro = spring({ frame, fps, delay: 10, config: SPRING.smooth });

  const isFinale = frame >= FINALE_START;
  const finaleLocal = Math.max(0, frame - FINALE_START);
  const finaleProgress = spring({
    frame: finaleLocal,
    fps,
    config: SPRING.smooth,
  });

  // Soften top chrome during finale so phones + tagline stay the focus
  const chromeFade = interpolate(frame, [FINALE_START - 10, FINALE_START + 6], [1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const leftLocal = Math.max(0, frame - COMPARE_START);
  const leftTabLabel = getChravelTabAtFrame(leftLocal);
  const leftTabsDone = leftLocal >= CHRAVEL_TABS.length * CHRAVEL_CYCLE_FRAMES;

  const leftSubtitle = isFinale
    ? 'Everything in one hub'
    : frame >= COMPARE_START
      ? leftTabsDone
        ? 'All connected · Never leave the trip'
        : `Swiping → ${leftTabLabel}`
      : 'Real trip tabs · one workspace';

  // Pace callout: while left zips ahead, right is still switching
  const paceCalloutOpacity = interpolate(
    frame,
    [COMPARE_START + 100, COMPARE_START + 120, COMPARE_START + 300, COMPARE_START + 330],
    [0, 1, 1, 0],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' },
  );

  const headlineOpacity =
    interpolate(frame, [0, 20], [0, 1], {
      extrapolateRight: 'clamp',
    }) * chromeFade;

  return (
    <AbsoluteFill>
      <TravelBackground variant="gold-ambient" />

      {/* Soft split wash — calm left / stressed right */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'linear-gradient(90deg, rgba(196,151,70,0.06) 0%, transparent 42%, transparent 58%, rgba(239,68,68,0.05) 100%)',
          opacity: interpolate(intro, [0, 1], [0, 1]),
          pointerEvents: 'none',
        }}
      />

      {/* Top headline */}
      {!isFinale && (
        <div
          style={{
            position: 'absolute',
            top: 36,
            left: 0,
            right: 0,
            textAlign: 'center',
            opacity: headlineOpacity,
          }}
        >
          <div
            style={{
              fontFamily,
              fontSize: 28,
              fontWeight: 800,
              color: COLORS.white,
              letterSpacing: '-0.01em',
            }}
          >
            One trip. Two ways to plan it.
          </div>
        </div>
      )}

      {/* Column labels — stay visible through finale */}
      <div
        style={{
          position: 'absolute',
          top: 88,
          left: 0,
          right: 0,
          display: 'flex',
          justifyContent: 'center',
          gap: 280,
          opacity: interpolate(labelIntro, [0, 1], [0, 1]),
          transform: `translateY(${interpolate(labelIntro, [0, 1], [16, 0])}px)`,
        }}
      >
        <div style={{ width: 340, textAlign: 'center' }}>
          <div
            style={{
              fontFamily,
              fontSize: 22,
              fontWeight: 800,
              color: COLORS.gold,
            }}
          >
            ChravelApp: One Trip Hub
          </div>
          <div
            style={{
              fontFamily,
              fontSize: 14,
              fontWeight: 500,
              color: COLORS.muted,
              marginTop: 6,
            }}
          >
            {leftSubtitle}
          </div>
        </div>
        <div style={{ width: 340, textAlign: 'center' }}>
          <div
            style={{
              fontFamily,
              fontSize: 22,
              fontWeight: 800,
              color: '#ff7b7b',
            }}
          >
            Old Way: Too Many Apps
          </div>
          <div
            style={{
              fontFamily,
              fontSize: 14,
              fontWeight: 500,
              color: COLORS.muted,
              marginTop: 6,
            }}
          >
            {isFinale ? 'Scattered across your phone' : 'Close · Scroll · Open · Repeat'}
          </div>
        </div>
      </div>

      {/* Real Chravel UI (left) vs realistic iOS multi-app (right) */}
      <RealisticPhoneShell scale={0.92} x={-350} y={isFinale ? 4 : 32} delay={8} glow="gold">
        <ChravelSwipeContent startFrame={COMPARE_START} showOverview={isFinale} />
      </RealisticPhoneShell>

      <RealisticPhoneShell scale={0.92} x={350} y={isFinale ? 4 : 32} delay={14} glow="danger">
        <FragmentedPhoneContent startFrame={COMPARE_START} showScattered={isFinale} />
      </RealisticPhoneShell>

      {/* Mid-video pacing proof callout */}
      {!isFinale && (
        <div
          style={{
            position: 'absolute',
            bottom: 56,
            left: '50%',
            transform: 'translateX(-50%)',
            opacity: paceCalloutOpacity,
            background: `${COLORS.surface}ee`,
            border: `1px solid ${COLORS.gold}40`,
            borderRadius: 16,
            padding: '10px 22px',
            boxShadow: SHADOWS.goldGlowSubtle,
            textAlign: 'center',
            maxWidth: 640,
          }}
        >
          <div style={{ fontFamily, fontSize: 16, fontWeight: 700, color: COLORS.white }}>
            Chravel already moved through several trip tabs —
          </div>
          <div
            style={{ fontFamily, fontSize: 15, fontWeight: 500, color: COLORS.muted, marginTop: 2 }}
          >
            the other phone is still closing apps and searching the home screen.
          </div>
        </div>
      )}

      {/* Finale copy */}
      <Sequence
        from={FINALE_START}
        durationInFrames={ENDCARD_START - FINALE_START}
        premountFor={fps}
      >
        <AbsoluteFill
          style={{
            justifyContent: 'flex-end',
            alignItems: 'center',
            paddingBottom: 72,
          }}
        >
          <div
            style={{
              textAlign: 'center',
              opacity: interpolate(finaleProgress, [0, 1], [0, 1]),
              transform: `translateY(${interpolate(finaleProgress, [0, 1], [24, 0])}px)`,
            }}
          >
            <div
              style={{
                fontFamily,
                fontSize: 36,
                fontWeight: 800,
                color: COLORS.white,
                letterSpacing: '-0.015em',
                marginBottom: 12,
              }}
            >
              Plan, chat, organize, and share in one place.
            </div>
            <div
              style={{
                fontFamily,
                fontSize: 28,
                fontWeight: 700,
                color: COLORS.gold,
                opacity: interpolate(finaleLocal, [12, 28], [0, 1], {
                  extrapolateLeft: 'clamp',
                  extrapolateRight: 'clamp',
                  easing: Easing.out(Easing.quad),
                }),
              }}
            >
              ChravelApp makes group travel easier.
            </div>
          </div>
        </AbsoluteFill>
      </Sequence>

      <Sequence from={ENDCARD_START} premountFor={fps}>
        <EndCard />
      </Sequence>
    </AbsoluteFill>
  );
};
