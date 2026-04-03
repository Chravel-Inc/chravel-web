import {
  AbsoluteFill,
  Sequence,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import { loadFont } from '@remotion/google-fonts/Inter';
import { COLORS, SPRING, TIMING, SHADOWS, FPS } from '../theme';
import { PhoneFrame } from '../components/PhoneFrame';
import { TravelBackground } from '../components/TravelBackground';
import { EndCard } from '../components/EndCard';
import { ConciergeScreen } from '../components/mockscreens/ConciergeScreen';

const { fontFamily } = loadFont('normal', {
  weights: ['400', '600', '700', '800'],
  subsets: ['latin'],
});

export const AI_CONCIERGE_DURATION = 12 * FPS; // 360 frames

/** Scene: AI Concierge in Action — user asks, AI suggests, takes actions */
export const AIConciergeAction: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Title
  const titleProgress = spring({ frame, fps, delay: 5, config: SPRING.smooth });

  // Action confirmation cards floating outside phone
  const action1Progress = spring({ frame, fps, delay: 180, config: SPRING.snappy });
  const action2Progress = spring({ frame, fps, delay: 200, config: SPRING.snappy });

  return (
    <AbsoluteFill>
      <TravelBackground variant="gold-ambient" />

      {/* Title overlay */}
      <div
        style={{
          position: 'absolute',
          top: 80,
          left: 100,
          opacity: interpolate(titleProgress, [0, 1], [0, 1]),
          transform: `translateY(${interpolate(titleProgress, [0, 1], [20, 0])}px)`,
        }}
      >
        <div style={{ fontFamily, fontSize: 42, fontWeight: 800, color: COLORS.white }}>
          Your AI Travel
        </div>
        <div style={{ fontFamily, fontSize: 42, fontWeight: 800, color: COLORS.gold }}>
          Concierge
        </div>
        <div
          style={{ fontFamily, fontSize: 20, fontWeight: 400, color: COLORS.muted, marginTop: 12 }}
        >
          Ask anything. It takes action for you.
        </div>
      </div>

      {/* Main phone with concierge chat */}
      <PhoneFrame scale={0.9} x={80} y={20} delay={10} float>
        <ConciergeScreen animationDelay={15} />
      </PhoneFrame>

      {/* Floating action confirmations outside phone */}
      <div
        style={{
          position: 'absolute',
          right: 140,
          top: 340,
          opacity: interpolate(action1Progress, [0, 1], [0, 1]),
          transform: `translateX(${interpolate(action1Progress, [0, 1], [30, 0])}px) scale(${interpolate(action1Progress, [0, 1], [0.9, 1])})`,
        }}
      >
        <div
          style={{
            background: COLORS.surface,
            border: `1px solid ${COLORS.gold}30`,
            borderRadius: 12,
            padding: '12px 16px',
            boxShadow: SHADOWS.goldGlowSubtle,
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            maxWidth: 260,
          }}
        >
          <div style={{ fontSize: 24 }}>📅</div>
          <div>
            <div style={{ fontFamily, fontSize: 14, fontWeight: 600, color: COLORS.white }}>
              Added to Calendar
            </div>
            <div style={{ fontFamily, fontSize: 11, color: COLORS.muted }}>
              The Legian Seminyak · Mar 16
            </div>
          </div>
          <div style={{ fontSize: 16, color: COLORS.paymentGreen }}>✓</div>
        </div>
      </div>

      <div
        style={{
          position: 'absolute',
          right: 160,
          top: 440,
          opacity: interpolate(action2Progress, [0, 1], [0, 1]),
          transform: `translateX(${interpolate(action2Progress, [0, 1], [30, 0])}px) scale(${interpolate(action2Progress, [0, 1], [0.9, 1])})`,
        }}
      >
        <div
          style={{
            background: COLORS.surface,
            border: `1px solid ${COLORS.gold}30`,
            borderRadius: 12,
            padding: '12px 16px',
            boxShadow: SHADOWS.goldGlowSubtle,
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            maxWidth: 260,
          }}
        >
          <div style={{ fontSize: 24 }}>📊</div>
          <div>
            <div style={{ fontFamily, fontSize: 14, fontWeight: 600, color: COLORS.white }}>
              Poll Created
            </div>
            <div style={{ fontFamily, fontSize: 11, color: COLORS.muted }}>
              "Which hotel for Seminyak?"
            </div>
          </div>
          <div style={{ fontSize: 16, color: COLORS.paymentGreen }}>✓</div>
        </div>
      </div>

      {/* End card */}
      <Sequence from={AI_CONCIERGE_DURATION - TIMING.endCard}>
        <EndCard />
      </Sequence>
    </AbsoluteFill>
  );
};
