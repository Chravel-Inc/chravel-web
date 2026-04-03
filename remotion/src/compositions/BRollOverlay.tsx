import {
  AbsoluteFill,
  Sequence,
  Video,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import { loadFont } from '@remotion/google-fonts/Inter';
import { COLORS, SPRING, TIMING, SHADOWS, FPS } from '../theme';
import { PhoneFrame } from '../components/PhoneFrame';
import { EndCard } from '../components/EndCard';
import { ChatScreen } from '../components/mockscreens/ChatScreen';

const { fontFamily } = loadFont('normal', {
  weights: ['400', '600', '700', '800'],
  subsets: ['latin'],
});

export const BROLL_OVERLAY_DURATION = 12 * FPS; // 360 frames

type BRollOverlayProps = {
  /** Path to video file in public/ (e.g. "broll.mp4"). If not provided, uses gradient background. */
  videoFile?: string;
};

/** Confetti particle system */
const CONFETTI_COUNT = 30;
const confettiParticles = Array.from({ length: CONFETTI_COUNT }, (_, i) => {
  const seed = (n: number) => {
    const x = Math.sin(n * 9301 + 49297) * 49297;
    return x - Math.floor(x);
  };
  return {
    x: seed(i * 4 + 1) * 100,
    size: 4 + seed(i * 4 + 2) * 6,
    speed: 1 + seed(i * 4 + 3) * 2,
    color: [COLORS.gold, COLORS.goldLight, COLORS.goldPale, COLORS.white, COLORS.chatBlue][
      Math.floor(seed(i * 4 + 4) * 5)
    ],
    rotation: seed(i * 4 + 5) * 360,
    delay: seed(i * 4 + 6) * 30,
  };
});

/** Scene: B-Roll Overlay — composable scene with optional video background + UI overlay + confetti */
export const BRollOverlay: React.FC<BRollOverlayProps> = ({ videoFile }) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();

  // Phone entrance
  const phoneProgress = spring({ frame, fps, delay: 15, config: SPRING.gentle });

  // Confetti starts at frame 60
  const confettiActive = frame > 60;

  // Badge entrance
  const badgeProgress = spring({ frame, fps, delay: 40, config: SPRING.snappy });

  return (
    <AbsoluteFill>
      {/* Layer 1: Background — video or gradient */}
      {videoFile ? (
        <Video
          src={staticFile(videoFile)}
          style={{
            width,
            height,
            objectFit: 'cover',
          }}
        />
      ) : (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: `radial-gradient(ellipse at 40% 40%, #0a1a2a 0%, #000000 60%)`,
          }}
        />
      )}

      {/* Darken overlay for readability */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.4)',
        }}
      />

      {/* Layer 2: Confetti */}
      {confettiActive &&
        confettiParticles.map((p, i) => {
          const confettiFrame = Math.max(0, frame - 60 - p.delay);
          const fallY = confettiFrame * p.speed * 2;
          const swayX = Math.sin(confettiFrame * 0.08 + i) * 20;
          const spin = confettiFrame * 3 + p.rotation;
          const opacity = interpolate(confettiFrame, [0, 10, 80, 120], [0, 0.8, 0.6, 0], {
            extrapolateRight: 'clamp',
          });

          return (
            <div
              key={i}
              style={{
                position: 'absolute',
                left: `${p.x}%`,
                top: -20 + fallY,
                width: p.size,
                height: p.size * 0.6,
                borderRadius: 1,
                background: p.color,
                opacity,
                transform: `translateX(${swayX}px) rotate(${spin}deg)`,
              }}
            />
          );
        })}

      {/* Layer 3: Phone frame with UI */}
      <div
        style={{
          opacity: interpolate(phoneProgress, [0, 1], [0, 1]),
          transform: `scale(${interpolate(phoneProgress, [0, 1], [0.9, 1])})`,
        }}
      >
        <PhoneFrame scale={0.85} x={0} y={0} delay={15} float>
          <ChatScreen animationDelay={20} />
        </PhoneFrame>
      </div>

      {/* Layer 4: Feature badge */}
      <div
        style={{
          position: 'absolute',
          bottom: 160,
          left: '50%',
          transform: `translateX(-50%) translateY(${interpolate(badgeProgress, [0, 1], [20, 0])}px)`,
          opacity: interpolate(badgeProgress, [0, 1], [0, 1]),
        }}
      >
        <div
          style={{
            background: `${COLORS.background}cc`,
            border: `1px solid ${COLORS.gold}40`,
            borderRadius: 16,
            padding: '12px 24px',
            boxShadow: SHADOWS.goldGlowSubtle,
            textAlign: 'center',
          }}
        >
          <div style={{ fontFamily, fontSize: 24, fontWeight: 700, color: COLORS.white }}>
            Group Travel Made Easy
          </div>
          <div
            style={{ fontFamily, fontSize: 16, fontWeight: 500, color: COLORS.gold, marginTop: 4 }}
          >
            chravel.app
          </div>
        </div>
      </div>

      {/* End card */}
      <Sequence from={BROLL_OVERLAY_DURATION - TIMING.endCard}>
        <EndCard />
      </Sequence>
    </AbsoluteFill>
  );
};
