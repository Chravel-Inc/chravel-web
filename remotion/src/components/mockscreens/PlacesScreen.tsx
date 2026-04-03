import { interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { loadFont } from '@remotion/google-fonts/Inter';
import { COLORS, SPRING } from '../../theme';
import { TabBar } from '../TabBar';

const { fontFamily } = loadFont('normal', {
  weights: ['400', '500', '600', '700'],
  subsets: ['latin'],
});

const PLACES = [
  { name: 'Tanah Lot Temple', type: 'Attraction', icon: '⛩️', delay: 10 },
  { name: 'Seminyak Beach Club', type: 'Beach', icon: '🏖️', delay: 18 },
  { name: 'Ubud Monkey Forest', type: 'Nature', icon: '🐒', delay: 26 },
  { name: 'La Favela Bali', type: 'Restaurant', icon: '🍸', delay: 34 },
];

type PlacesScreenProps = {
  animationDelay?: number;
};

export const PlacesScreen: React.FC<PlacesScreenProps> = ({ animationDelay = 0 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  return (
    <div
      style={{ width: '100%', height: '100%', background: COLORS.background, position: 'relative' }}
    >
      {/* Map area (mock) */}
      <div
        style={{
          height: 120,
          background: `linear-gradient(135deg, #0a1a2a 0%, #0a2a1a 50%, #1a1a0a 100%)`,
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Map grid lines */}
        {[0, 1, 2, 3].map(i => (
          <div
            key={`h${i}`}
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              top: i * 40,
              height: 1,
              background: `${COLORS.gold}08`,
            }}
          />
        ))}
        {[0, 1, 2, 3, 4].map(i => (
          <div
            key={`v${i}`}
            style={{
              position: 'absolute',
              top: 0,
              bottom: 0,
              left: i * 70,
              width: 1,
              background: `${COLORS.gold}08`,
            }}
          />
        ))}

        {/* Map pins */}
        {PLACES.map((place, i) => {
          const pinProgress = spring({
            frame,
            fps,
            delay: animationDelay + place.delay,
            config: SPRING.bouncy,
          });
          const positions = [
            { x: 80, y: 30 },
            { x: 180, y: 60 },
            { x: 120, y: 80 },
            { x: 200, y: 35 },
          ];
          return (
            <div
              key={i}
              style={{
                position: 'absolute',
                left: positions[i].x,
                top: positions[i].y,
                fontSize: 16,
                transform: `scale(${interpolate(pinProgress, [0, 1], [0, 1])})`,
                opacity: interpolate(pinProgress, [0, 1], [0, 1]),
              }}
            >
              📍
            </div>
          );
        })}
      </div>

      {/* Places list */}
      <div style={{ padding: '6px 10px', display: 'flex', flexDirection: 'column', gap: 4 }}>
        <div
          style={{
            fontFamily,
            fontSize: 8,
            fontWeight: 600,
            color: COLORS.gold,
            textTransform: 'uppercase',
            letterSpacing: 1,
            marginBottom: 2,
          }}
        >
          Saved Places
        </div>
        {PLACES.map((place, i) => {
          const progress = spring({
            frame,
            fps,
            delay: animationDelay + place.delay + 5,
            config: SPRING.smooth,
          });
          return (
            <div
              key={i}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                background: COLORS.surface,
                border: `1px solid ${COLORS.border}`,
                borderRadius: 8,
                padding: '5px 8px',
                opacity: interpolate(progress, [0, 1], [0, 1]),
                transform: `translateX(${interpolate(progress, [0, 1], [20, 0])}px)`,
              }}
            >
              <div style={{ fontSize: 14 }}>{place.icon}</div>
              <div>
                <div style={{ fontFamily, fontSize: 10, fontWeight: 600, color: COLORS.white }}>
                  {place.name}
                </div>
                <div style={{ fontFamily, fontSize: 7, color: COLORS.muted }}>{place.type}</div>
              </div>
            </div>
          );
        })}
      </div>

      <TabBar activeTab="places" delay={animationDelay + 5} />
    </div>
  );
};
