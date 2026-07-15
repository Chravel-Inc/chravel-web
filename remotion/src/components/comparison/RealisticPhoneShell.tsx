import { interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { COLORS, GRADIENTS, SHADOWS, SPRING } from '../../theme';

/** iPhone 15 Pro–style dimensions for the comparison video */
export const IPHONE = {
  width: 290,
  height: 628,
  borderRadius: 52,
  screenRadius: 46,
  bezel: 3,
  islandW: 118,
  islandH: 34,
} as const;

type RealisticPhoneShellProps = {
  children: React.ReactNode;
  scale?: number;
  x?: number;
  y?: number;
  delay?: number;
  /** Optional tinted edge glow (gold | danger | none) */
  glow?: 'gold' | 'danger' | 'none';
};

/**
 * True-to-device phone shell. Content fills the entire screen so real
 * screenshots (which already include status bars) sit flush — Dynamic Island
 * and home indicator overlay on top.
 */
export const RealisticPhoneShell: React.FC<RealisticPhoneShellProps> = ({
  children,
  scale = 1,
  x = 0,
  y = 0,
  delay = 0,
  glow = 'none',
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const entrance = spring({
    frame,
    fps,
    delay,
    config: SPRING.gentle,
  });
  const entranceY = interpolate(entrance, [0, 1], [70, 0]);
  const opacity = interpolate(entrance, [0, 1], [0, 1]);

  const glowShadow =
    glow === 'gold'
      ? SHADOWS.goldGlowSubtle
      : glow === 'danger'
        ? '0 20px 60px rgba(0,0,0,0.75), 0 0 40px rgba(255,80,80,0.12)'
        : SHADOWS.phone;

  return (
    <div
      style={{
        position: 'absolute',
        left: '50%',
        top: '50%',
        transform: `translate(-50%, -50%) translate(${x}px, ${y + entranceY}px) scale(${scale})`,
        opacity,
        width: IPHONE.width,
        height: IPHONE.height,
      }}
    >
      <div
        style={{
          width: IPHONE.width,
          height: IPHONE.height,
          borderRadius: IPHONE.borderRadius,
          background: GRADIENTS.bezel,
          padding: IPHONE.bezel,
          boxShadow: glowShadow,
          position: 'relative',
        }}
      >
        {/* Titanium edge highlight */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            borderRadius: IPHONE.borderRadius,
            border: `1px solid ${COLORS.bezelLight}55`,
            pointerEvents: 'none',
            zIndex: 5,
          }}
        />

        <div
          style={{
            width: '100%',
            height: '100%',
            borderRadius: IPHONE.screenRadius,
            background: '#000',
            overflow: 'hidden',
            position: 'relative',
          }}
        >
          {/* Full-bleed screen content */}
          <div style={{ position: 'absolute', inset: 0 }}>{children}</div>

          {/* Dynamic Island */}
          <div
            style={{
              position: 'absolute',
              top: 11,
              left: '50%',
              transform: 'translateX(-50%)',
              width: IPHONE.islandW,
              height: IPHONE.islandH,
              borderRadius: 20,
              background: '#000',
              zIndex: 20,
              boxShadow: 'inset 0 0 0 1px #1a1a1a',
            }}
          />

          {/* Home indicator */}
          <div
            style={{
              position: 'absolute',
              bottom: 7,
              left: '50%',
              transform: 'translateX(-50%)',
              width: 108,
              height: 5,
              borderRadius: 3,
              background: 'rgba(255,255,255,0.42)',
              zIndex: 20,
            }}
          />
        </div>
      </div>
    </div>
  );
};
