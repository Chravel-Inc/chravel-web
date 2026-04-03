import { interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { loadFont } from '@remotion/google-fonts/Inter';
import { COLORS, SPRING, SHADOWS } from '../theme';

const { fontFamily } = loadFont('normal', {
  weights: ['500', '600'],
  subsets: ['latin'],
});

type NotificationPopProps = {
  text: string;
  icon?: string;
  delay?: number;
};

export const NotificationPop: React.FC<NotificationPopProps> = ({
  text,
  icon = '🔔',
  delay = 0,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const entrance = spring({
    frame,
    fps,
    delay,
    config: SPRING.snappy,
  });
  const y = interpolate(entrance, [0, 1], [-40, 0]);
  const opacity = interpolate(entrance, [0, 1], [0, 1]);
  const scale = interpolate(entrance, [0, 1], [0.9, 1]);

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        background: COLORS.surface,
        border: `1px solid ${COLORS.border}`,
        borderRadius: 10,
        padding: '8px 12px',
        boxShadow: SHADOWS.card,
        transform: `translateY(${y}px) scale(${scale})`,
        opacity,
        maxWidth: 220,
      }}
    >
      {/* Gold left accent */}
      <div
        style={{
          position: 'absolute',
          left: 0,
          top: '20%',
          bottom: '20%',
          width: 3,
          borderRadius: 2,
          background: COLORS.gold,
        }}
      />
      <div style={{ fontSize: 14, flexShrink: 0, marginLeft: 4 }}>{icon}</div>
      <div
        style={{
          fontFamily,
          fontSize: 10,
          fontWeight: 500,
          color: COLORS.white,
          lineHeight: 1.3,
        }}
      >
        {text}
      </div>
    </div>
  );
};
