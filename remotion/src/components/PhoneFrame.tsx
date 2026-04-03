import { interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { COLORS, GRADIENTS, SHADOWS, PHONE, SPRING } from '../theme';

type PhoneFrameProps = {
  children: React.ReactNode;
  scale?: number;
  x?: number;
  y?: number;
  rotation?: number;
  delay?: number;
  /** Enable gentle floating animation */
  float?: boolean;
};

export const PhoneFrame: React.FC<PhoneFrameProps> = ({
  children,
  scale = 1,
  x = 0,
  y = 0,
  rotation = 0,
  delay = 0,
  float = true,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Entrance animation
  const entrance = spring({
    frame,
    fps,
    delay,
    config: SPRING.gentle,
  });
  const entranceY = interpolate(entrance, [0, 1], [80, 0]);
  const entranceOpacity = interpolate(entrance, [0, 1], [0, 1]);

  // Floating animation (subtle vertical oscillation)
  const floatY = float ? interpolate(frame % 150, [0, 37, 75, 112, 150], [0, -4, 0, 4, 0]) : 0;

  const totalY = y + entranceY + floatY;

  return (
    <div
      style={{
        position: 'absolute',
        left: '50%',
        top: '50%',
        transform: `translate(-50%, -50%) translate(${x}px, ${totalY}px) scale(${scale}) rotate(${rotation}deg)`,
        opacity: entranceOpacity,
        width: PHONE.width,
        height: PHONE.height,
      }}
    >
      {/* Phone bezel */}
      <div
        style={{
          width: PHONE.width,
          height: PHONE.height,
          borderRadius: PHONE.borderRadius,
          background: GRADIENTS.bezel,
          padding: PHONE.bezelWidth,
          boxShadow: SHADOWS.phone,
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Bezel edge highlight */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: 1,
            background: `linear-gradient(90deg, transparent 10%, ${COLORS.bezelLight}80 50%, transparent 90%)`,
          }}
        />

        {/* Screen area */}
        <div
          style={{
            width: '100%',
            height: '100%',
            borderRadius: PHONE.screenRadius,
            background: COLORS.background,
            overflow: 'hidden',
            position: 'relative',
          }}
        >
          {/* Dynamic Island */}
          <div
            style={{
              position: 'absolute',
              top: 12,
              left: '50%',
              transform: 'translateX(-50%)',
              width: PHONE.notchWidth,
              height: PHONE.notchHeight,
              borderRadius: 17,
              background: '#000000',
              zIndex: 10,
            }}
          />

          {/* Status bar area */}
          <div
            style={{
              height: PHONE.statusBarHeight,
              width: '100%',
              position: 'relative',
              zIndex: 5,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '0 20px',
            }}
          >
            <div style={{ fontSize: 11, fontWeight: 600, color: COLORS.white }}>9:41</div>
            <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
              <div
                style={{
                  width: 15,
                  height: 10,
                  borderRadius: 2,
                  border: `1px solid ${COLORS.white}60`,
                  position: 'relative',
                }}
              >
                <div
                  style={{
                    position: 'absolute',
                    inset: 1,
                    borderRadius: 1,
                    background: COLORS.white,
                  }}
                />
              </div>
            </div>
          </div>

          {/* Screen content */}
          <div
            style={{
              position: 'absolute',
              top: PHONE.statusBarHeight,
              left: 0,
              right: 0,
              bottom: PHONE.homeIndicatorHeight + 8,
              overflow: 'hidden',
            }}
          >
            {children}
          </div>

          {/* Home indicator */}
          <div
            style={{
              position: 'absolute',
              bottom: 6,
              left: '50%',
              transform: 'translateX(-50%)',
              width: 100,
              height: PHONE.homeIndicatorHeight,
              borderRadius: 3,
              background: `${COLORS.white}40`,
            }}
          />
        </div>
      </div>
    </div>
  );
};
