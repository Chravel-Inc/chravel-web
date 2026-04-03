import { interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { COLORS, SPRING } from '../theme';

type SyncIndicatorProps = {
  delay?: number;
  x?: number;
  y?: number;
  /** Color of the ripple */
  color?: string;
};

export const SyncIndicator: React.FC<SyncIndicatorProps> = ({
  delay = 0,
  x = 0,
  y = 0,
  color = COLORS.gold,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const entrance = spring({
    frame,
    fps,
    delay,
    config: SPRING.smooth,
  });

  // Repeating ripple cycle (every 45 frames = 1.5s)
  const cycleFrame = Math.max(0, frame - delay);
  const ripple1 = (cycleFrame % 45) / 45;
  const ripple2 = ((cycleFrame + 15) % 45) / 45;

  const renderRipple = (progress: number, key: number) => {
    const scale = interpolate(progress, [0, 1], [0.3, 1.5]);
    const opacity = interpolate(progress, [0, 0.3, 1], [0, 0.6, 0]);
    return (
      <div
        key={key}
        style={{
          position: 'absolute',
          width: 24,
          height: 24,
          borderRadius: '50%',
          border: `2px solid ${color}`,
          transform: `scale(${scale})`,
          opacity: opacity * entrance,
        }}
      />
    );
  };

  return (
    <div
      style={{
        position: 'absolute',
        left: x,
        top: y,
        width: 24,
        height: 24,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {renderRipple(ripple1, 0)}
      {renderRipple(ripple2, 1)}
      {/* Center dot */}
      <div
        style={{
          width: 8,
          height: 8,
          borderRadius: '50%',
          background: color,
          opacity: entrance,
        }}
      />
    </div>
  );
};
