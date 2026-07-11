import { interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { loadFont } from '@remotion/google-fonts/Inter';
import { COLORS, SPRING } from '../theme';

const { fontFamily } = loadFont('normal', {
  weights: ['600', '700', '800'],
  subsets: ['latin'],
});

type Props = {
  text: string;
  /** Optional smaller eyebrow above the headline. */
  eyebrow?: string;
  /** Vertical position: 'top' | 'bottom' (default bottom). */
  position?: 'top' | 'bottom';
};

/** Restrained black/gold caption used across all hero scenes. */
export const SceneCaption: React.FC<Props> = ({ text, eyebrow, position = 'bottom' }) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  const enter = spring({ frame, fps, delay: 4, config: SPRING.smooth });
  const exit = spring({
    frame: frame - (durationInFrames - 14),
    fps,
    config: SPRING.smooth,
  });
  const opacity = Math.min(interpolate(enter, [0, 1], [0, 1]), 1 - exit);
  const y = interpolate(enter, [0, 1], [16, 0]);

  return (
    <div
      style={{
        position: 'absolute',
        left: 0,
        right: 0,
        [position]: 80,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 12,
        opacity,
        transform: `translateY(${y}px)`,
        fontFamily,
        pointerEvents: 'none',
        textShadow: '0 4px 24px rgba(0,0,0,0.85), 0 2px 8px rgba(0,0,0,0.7)',
      }}
    >
      {eyebrow ? (
        <div
          style={{
            fontSize: 18,
            fontWeight: 600,
            letterSpacing: '0.28em',
            textTransform: 'uppercase',
            color: COLORS.gold,
          }}
        >
          {eyebrow}
        </div>
      ) : null}
      <div
        style={{
          fontSize: 56,
          fontWeight: 800,
          letterSpacing: '-0.01em',
          color: COLORS.white,
          textAlign: 'center',
          maxWidth: 1400,
          lineHeight: 1.05,
          padding: '0 80px',
        }}
      >
        {text}
      </div>
    </div>
  );
};
