import { interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { loadFont } from '@remotion/google-fonts/Inter';
import { COLORS, SPRING } from '../../theme';
import { TabBar } from '../TabBar';

const { fontFamily } = loadFont('normal', {
  weights: ['400', '500', '600', '700'],
  subsets: ['latin'],
});

const FILES = [
  { name: 'Flight confirmations.pdf', meta: 'PDF · 240 KB', icon: '📄', delay: 8 },
  { name: 'Airbnb booking.pdf', meta: 'PDF · 180 KB', icon: '🏠', delay: 14 },
  { name: 'Group packing list', meta: 'Note · Edited today', icon: '📝', delay: 20 },
  { name: 'Dinner reservations', meta: 'Note · Shared', icon: '🍽️', delay: 26 },
];

type FilesNotesScreenProps = {
  animationDelay?: number;
};

/** Chravel Files / Notes tab mock for the comparison video */
export const FilesNotesScreen: React.FC<FilesNotesScreenProps> = ({ animationDelay = 0 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const headerEntrance = spring({
    frame,
    fps,
    delay: animationDelay,
    config: SPRING.smooth,
  });

  return (
    <div
      style={{ width: '100%', height: '100%', background: COLORS.background, position: 'relative' }}
    >
      <div
        style={{
          padding: '8px 12px',
          borderBottom: `1px solid ${COLORS.border}`,
          opacity: interpolate(headerEntrance, [0, 1], [0, 1]),
        }}
      >
        <div style={{ fontFamily, fontSize: 12, fontWeight: 700, color: COLORS.white }}>
          Files & Notes
        </div>
        <div style={{ fontFamily, fontSize: 9, color: COLORS.gold, fontWeight: 500, marginTop: 2 }}>
          Bali Trip · Shared with group
        </div>
      </div>

      <div style={{ padding: '8px 10px', display: 'flex', flexDirection: 'column', gap: 6 }}>
        {FILES.map((file, i) => {
          const progress = spring({
            frame,
            fps,
            delay: animationDelay + file.delay,
            config: SPRING.snappy,
          });
          return (
            <div
              key={i}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '8px 10px',
                borderRadius: 10,
                background: COLORS.surface,
                border: `1px solid ${COLORS.border}`,
                opacity: interpolate(progress, [0, 1], [0, 1]),
                transform: `translateY(${interpolate(progress, [0, 1], [10, 0])}px)`,
              }}
            >
              <div style={{ fontSize: 16 }}>{file.icon}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontFamily,
                    fontSize: 11,
                    fontWeight: 600,
                    color: COLORS.white,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {file.name}
                </div>
                <div style={{ fontFamily, fontSize: 8, color: COLORS.muted, marginTop: 1 }}>
                  {file.meta}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <TabBar activeTab="places" delay={animationDelay} />
    </div>
  );
};
