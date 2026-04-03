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
import { ChatScreen } from '../components/mockscreens/ChatScreen';

const { fontFamily } = loadFont('normal', {
  weights: ['400', '600', '700', '800'],
  subsets: ['latin'],
});

export const BEFORE_AFTER_DURATION = 12 * FPS; // 360 frames

/** Chaotic messages for the "before" state */
const CHAOS_MESSAGES = [
  'Wait which hotel did we book??',
  'Can someone send the flight info again',
  "Who's paying for dinner?",
  'I thought checkout was Sunday',
  'Did anyone make the restaurant reservation?',
  'Where are we meeting??',
  'Check the other group chat',
  'I sent it last week, scroll up',
  'Which group chat?!',
  'Can someone just make a spreadsheet',
];

/** Scene: Before→After Chaos — chaotic group chat → clean Chravel organized space */
export const BeforeAfterChaos: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // The transition happens around frame 140-170
  const transitionPoint = 155;
  const isAfter = frame > transitionPoint;

  // Before: chaos phase
  const chaosIntensity = interpolate(frame, [0, 80, 140], [0, 1, 1.2], {
    extrapolateRight: 'clamp',
    extrapolateLeft: 'clamp',
  });

  // Flash/glitch transition
  const flashOpacity = interpolate(frame, [145, 150, 155, 160], [0, 1, 1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // After: calm organized entrance
  const afterProgress = spring({
    frame: Math.max(0, frame - transitionPoint),
    fps,
    config: SPRING.smooth,
  });

  // Before label
  const beforeLabelProgress = spring({ frame, fps, delay: 10, config: SPRING.smooth });
  // After label
  const afterLabelProgress = spring({
    frame: Math.max(0, frame - transitionPoint - 10),
    fps,
    config: SPRING.smooth,
  });

  return (
    <AbsoluteFill>
      <TravelBackground variant="gradient" />

      {/* === BEFORE PHASE === */}
      {!isAfter && (
        <>
          {/* "Before" label */}
          <div
            style={{
              position: 'absolute',
              top: 80,
              left: '50%',
              transform: `translateX(-50%) translateY(${interpolate(beforeLabelProgress, [0, 1], [20, 0])}px)`,
              opacity: interpolate(beforeLabelProgress, [0, 1], [0, 1]),
              textAlign: 'center',
            }}
          >
            <div style={{ fontFamily, fontSize: 48, fontWeight: 800, color: COLORS.destructive }}>
              Group Chat Chaos
            </div>
            <div
              style={{
                fontFamily,
                fontSize: 20,
                fontWeight: 400,
                color: COLORS.muted,
                marginTop: 8,
              }}
            >
              Sound familiar?
            </div>
          </div>

          {/* Scattered chaotic message bubbles */}
          {CHAOS_MESSAGES.map((msg, i) => {
            const msgDelay = 20 + i * 8;
            const msgProgress = spring({
              frame,
              fps,
              delay: msgDelay,
              config: { damping: 15, stiffness: 100 },
            });

            // Semi-random positions using index
            const angle = (i / CHAOS_MESSAGES.length) * Math.PI * 2 + 0.3;
            const radius = 200 + (i % 3) * 80;
            const baseX = Math.cos(angle) * radius;
            const baseY = Math.sin(angle) * radius * 0.5;

            // Wobble animation
            const wobble = Math.sin(frame * 0.05 + i * 1.5) * 3 * chaosIntensity;
            const rotateWobble = Math.sin(frame * 0.03 + i * 2) * 4 * chaosIntensity;

            return (
              <div
                key={i}
                style={{
                  position: 'absolute',
                  left: `calc(50% + ${baseX}px)`,
                  top: `calc(55% + ${baseY}px)`,
                  transform: `translate(-50%, -50%) rotate(${rotateWobble}deg) translateY(${wobble}px) scale(${interpolate(msgProgress, [0, 1], [0, 1])})`,
                  opacity: interpolate(msgProgress, [0, 1], [0, 0.9]),
                  maxWidth: 220,
                }}
              >
                <div
                  style={{
                    background: i % 3 === 0 ? '#2a5a2a' : i % 3 === 1 ? '#3a3a4a' : '#4a3a2a',
                    borderRadius: 12,
                    padding: '8px 12px',
                    boxShadow: SHADOWS.card,
                  }}
                >
                  <div
                    style={{
                      fontFamily,
                      fontSize: 12,
                      fontWeight: 500,
                      color: COLORS.white,
                      lineHeight: 1.3,
                    }}
                  >
                    {msg}
                  </div>
                </div>
              </div>
            );
          })}
        </>
      )}

      {/* === FLASH TRANSITION === */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: COLORS.gold,
          opacity: flashOpacity * 0.8,
          zIndex: 50,
        }}
      />

      {/* === AFTER PHASE === */}
      {isAfter && (
        <>
          {/* "After" label */}
          <div
            style={{
              position: 'absolute',
              top: 80,
              left: 100,
              opacity: interpolate(afterLabelProgress, [0, 1], [0, 1]),
              transform: `translateY(${interpolate(afterLabelProgress, [0, 1], [20, 0])}px)`,
            }}
          >
            <div style={{ fontFamily, fontSize: 48, fontWeight: 800, color: COLORS.white }}>
              With <span style={{ color: COLORS.gold }}>Chravel</span>
            </div>
            <div
              style={{
                fontFamily,
                fontSize: 20,
                fontWeight: 400,
                color: COLORS.muted,
                marginTop: 8,
              }}
            >
              Everything organized. Everyone in sync.
            </div>
          </div>

          {/* Clean organized phone */}
          <div
            style={{
              opacity: interpolate(afterProgress, [0, 1], [0, 1]),
              transform: `scale(${interpolate(afterProgress, [0, 1], [0.9, 1])})`,
            }}
          >
            <PhoneFrame scale={0.9} x={80} y={20} delay={0} float>
              <ChatScreen animationDelay={0} />
            </PhoneFrame>
          </div>

          {/* Floating organized feature badges */}
          {['📅 Calendar', '💰 Splits', '📸 Media', '📊 Polls', '✅ Tasks'].map((badge, i) => {
            const badgeProgress = spring({
              frame: Math.max(0, frame - transitionPoint - 20 - i * 6),
              fps,
              config: SPRING.snappy,
            });
            const positions = [
              { x: 680, y: 310 },
              { x: 700, y: 380 },
              { x: 660, y: 450 },
              { x: 720, y: 520 },
              { x: 680, y: 590 },
            ];
            return (
              <div
                key={i}
                style={{
                  position: 'absolute',
                  left: positions[i].x,
                  top: positions[i].y,
                  opacity: interpolate(badgeProgress, [0, 1], [0, 1]),
                  transform: `translateX(${interpolate(badgeProgress, [0, 1], [30, 0])}px) scale(${interpolate(badgeProgress, [0, 1], [0.8, 1])})`,
                }}
              >
                <div
                  style={{
                    background: COLORS.surface,
                    border: `1px solid ${COLORS.gold}25`,
                    borderRadius: 20,
                    padding: '8px 16px',
                    fontFamily,
                    fontSize: 16,
                    fontWeight: 600,
                    color: COLORS.white,
                    boxShadow: SHADOWS.goldGlowSubtle,
                  }}
                >
                  {badge}
                </div>
              </div>
            );
          })}
        </>
      )}

      {/* End card */}
      <Sequence from={BEFORE_AFTER_DURATION - TIMING.endCard}>
        <EndCard />
      </Sequence>
    </AbsoluteFill>
  );
};
