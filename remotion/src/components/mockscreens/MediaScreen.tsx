import { interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { loadFont } from '@remotion/google-fonts/Inter';
import { COLORS, SPRING } from '../../theme';
import { TabBar } from '../TabBar';

const { fontFamily } = loadFont('normal', {
  weights: ['500', '600', '700'],
  subsets: ['latin'],
});

/** Deterministic color palette for photo grid placeholders */
const PHOTO_COLORS = [
  '#1a3a4a',
  '#2a4a3a',
  '#3a2a4a',
  '#4a3a1a',
  '#1a4a3a',
  '#3a1a4a',
  '#4a2a3a',
  '#2a3a4a',
  '#3a4a2a',
];

type MediaScreenProps = {
  animationDelay?: number;
};

export const MediaScreen: React.FC<MediaScreenProps> = ({ animationDelay = 0 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  return (
    <div
      style={{ width: '100%', height: '100%', background: COLORS.background, position: 'relative' }}
    >
      {/* Header */}
      <div style={{ padding: '8px 12px', borderBottom: `1px solid ${COLORS.border}` }}>
        <div style={{ fontFamily, fontSize: 12, fontWeight: 700, color: COLORS.white }}>
          📸 Media
        </div>
        <div style={{ fontFamily, fontSize: 8, color: COLORS.muted, marginTop: 2 }}>
          47 photos · 3 videos
        </div>
      </div>

      {/* Photo grid */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 2,
          padding: 4,
        }}
      >
        {PHOTO_COLORS.map((color, i) => {
          const progress = spring({
            frame,
            fps,
            delay: animationDelay + 8 + i * 4,
            config: SPRING.snappy,
          });
          const scale = interpolate(progress, [0, 1], [0.7, 1]);
          const opacity = interpolate(progress, [0, 1], [0, 1]);

          const isLarge = i === 0;
          const size = isLarge ? 130 : 63;

          return (
            <div
              key={i}
              style={{
                width: size,
                height: size,
                borderRadius: 4,
                background: `linear-gradient(135deg, ${color} 0%, ${color}80 100%)`,
                opacity,
                transform: `scale(${scale})`,
                overflow: 'hidden',
                position: 'relative',
              }}
            >
              {/* Fake image shimmer */}
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  background: `linear-gradient(135deg, transparent 30%, ${COLORS.white}08 50%, transparent 70%)`,
                }}
              />
              {/* Video indicator on one tile */}
              {i === 3 && (
                <div
                  style={{
                    position: 'absolute',
                    bottom: 3,
                    right: 3,
                    fontFamily,
                    fontSize: 7,
                    color: COLORS.white,
                    background: 'rgba(0,0,0,0.6)',
                    borderRadius: 3,
                    padding: '1px 3px',
                  }}
                >
                  ▶ 0:24
                </div>
              )}
              {/* Avatar indicator (shared by) */}
              {i < 3 && (
                <div
                  style={{
                    position: 'absolute',
                    top: 3,
                    left: 3,
                    width: 12,
                    height: 12,
                    borderRadius: '50%',
                    background: COLORS.gold,
                    border: `1px solid ${COLORS.background}`,
                    opacity: 0.8,
                  }}
                />
              )}
            </div>
          );
        })}
      </div>

      <TabBar activeTab="media" delay={animationDelay + 5} />
    </div>
  );
};
