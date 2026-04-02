import {
  AbsoluteFill,
  Img,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import { loadFont } from '@remotion/google-fonts/Inter';
import { COLORS, SPRING } from '../theme';

const { fontFamily } = loadFont('normal', {
  weights: ['600', '700', '800'],
  subsets: ['latin'],
});

/**
 * EndCard — 90 frames (3 seconds at 30fps).
 * Sequence this at the end of every composition:
 * <Sequence from={totalDuration - TIMING.endCard}><EndCard /></Sequence>
 */
export const EndCard: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Logo entrance
  const logoProgress = spring({
    frame,
    fps,
    delay: 5,
    config: SPRING.bouncy,
  });
  const logoScale = interpolate(logoProgress, [0, 1], [0.6, 1]);
  const logoOpacity = interpolate(logoProgress, [0, 1], [0, 1]);

  // Tagline entrance
  const taglineProgress = spring({
    frame,
    fps,
    delay: 15,
    config: SPRING.smooth,
  });
  const taglineOpacity = interpolate(taglineProgress, [0, 1], [0, 1]);
  const taglineY = interpolate(taglineProgress, [0, 1], [20, 0]);

  // URL entrance
  const urlProgress = spring({
    frame,
    fps,
    delay: 25,
    config: SPRING.smooth,
  });
  const urlOpacity = interpolate(urlProgress, [0, 1], [0, 1]);
  const urlY = interpolate(urlProgress, [0, 1], [15, 0]);

  // Gold glow pulse
  const glowOpacity = interpolate(frame, [30, 50, 70, 90], [0, 0.35, 0.2, 0.3], {
    extrapolateRight: 'clamp',
    extrapolateLeft: 'clamp',
  });

  return (
    <AbsoluteFill
      style={{
        background: COLORS.background,
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      {/* Gold radial glow behind logo */}
      <div
        style={{
          position: 'absolute',
          width: 500,
          height: 500,
          borderRadius: '50%',
          background: `radial-gradient(circle, ${COLORS.gold}40 0%, transparent 65%)`,
          opacity: glowOpacity,
        }}
      />

      {/* Logo */}
      <div
        style={{
          transform: `scale(${logoScale})`,
          opacity: logoOpacity,
          marginBottom: 24,
        }}
      >
        <Img src={staticFile('chravel-logo.png')} style={{ width: 200, height: 'auto' }} />
      </div>

      {/* Tagline */}
      <div
        style={{
          fontFamily,
          fontSize: 32,
          fontWeight: 700,
          color: COLORS.gold,
          letterSpacing: 3,
          textTransform: 'uppercase',
          opacity: taglineOpacity,
          transform: `translateY(${taglineY}px)`,
          marginTop: 16,
        }}
      >
        Group Travel Made Easy
      </div>

      {/* URL */}
      <div
        style={{
          fontFamily,
          fontSize: 20,
          fontWeight: 600,
          color: COLORS.muted,
          letterSpacing: 2,
          opacity: urlOpacity,
          transform: `translateY(${urlY}px)`,
          marginTop: 20,
        }}
      >
        chravel.app
      </div>
    </AbsoluteFill>
  );
};
