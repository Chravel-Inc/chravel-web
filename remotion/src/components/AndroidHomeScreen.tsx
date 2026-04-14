import { interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { loadFont } from '@remotion/google-fonts/Inter';
import { COLORS, SPRING } from '../theme';

const { fontFamily } = loadFont('normal', {
  weights: ['400', '500', '600', '700'],
  subsets: ['latin'],
});

type AndroidHomeScreenProps = {
  delay?: number;
  /** Show gold pulse on the Chravel app icon */
  showActiveApp?: boolean;
};

const APP_ICONS = [
  { color: '#4285F4', label: 'Phone' },
  { color: '#34A853', label: 'Messages' },
  { color: '#EA4335', label: 'Gmail' },
  { color: '#FBBC04', label: 'Photos' },
  { color: COLORS.gold, label: 'Chravel', isChravel: true },
];

export const AndroidHomeScreen: React.FC<AndroidHomeScreenProps> = ({
  delay = 0,
  showActiveApp = true,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const entrance = spring({ frame, fps, delay, config: SPRING.smooth });
  const fadeIn = interpolate(entrance, [0, 1], [0, 1]);

  // Gold pulse on Chravel icon
  const pulseScale = showActiveApp ? 1 + Math.sin(frame * 0.1) * 0.06 : 1;
  const pulseGlow = showActiveApp
    ? interpolate(Math.sin(frame * 0.1) * 0.5 + 0.5, [0, 1], [0.2, 0.5])
    : 0;

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        background: `radial-gradient(ellipse at 50% 30%, #111111 0%, #050505 70%)`,
        position: 'relative',
        fontFamily,
        opacity: fadeIn,
      }}
    >
      {/* Clock widget */}
      <div
        style={{
          position: 'absolute',
          top: '20%',
          width: '100%',
          textAlign: 'center',
        }}
      >
        <div
          style={{
            fontSize: 32,
            fontWeight: 200,
            color: COLORS.white,
            letterSpacing: 2,
          }}
        >
          9:41
        </div>
        <div
          style={{
            fontSize: 9,
            fontWeight: 400,
            color: `${COLORS.white}80`,
            marginTop: 4,
          }}
        >
          Tuesday, April 14
        </div>
      </div>

      {/* App dock at bottom */}
      <div
        style={{
          position: 'absolute',
          bottom: 30,
          left: 0,
          right: 0,
          display: 'flex',
          justifyContent: 'center',
          gap: 12,
          padding: '0 16px',
        }}
      >
        {APP_ICONS.map((app, i) => (
          <div
            key={i}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 3,
            }}
          >
            <div
              style={{
                width: 28,
                height: 28,
                borderRadius: 7,
                background: app.isChravel
                  ? `linear-gradient(135deg, ${COLORS.gold}90, ${COLORS.goldDark})`
                  : `${app.color}cc`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: app.isChravel ? 11 : 10,
                fontWeight: 700,
                color: app.isChravel ? COLORS.background : COLORS.white,
                transform: app.isChravel ? `scale(${pulseScale})` : undefined,
                boxShadow: app.isChravel
                  ? `0 0 ${8 + pulseGlow * 16}px rgba(196,151,70,${pulseGlow})`
                  : 'none',
              }}
            >
              {app.isChravel ? 'C' : ''}
            </div>
            <div
              style={{
                fontSize: 6,
                color: `${COLORS.white}80`,
                textAlign: 'center',
              }}
            >
              {app.label}
            </div>
          </div>
        ))}
      </div>

      {/* Android nav bar */}
      <div
        style={{
          position: 'absolute',
          bottom: 4,
          left: '50%',
          transform: 'translateX(-50%)',
          width: 60,
          height: 3,
          borderRadius: 2,
          background: `${COLORS.white}40`,
        }}
      />
    </div>
  );
};
