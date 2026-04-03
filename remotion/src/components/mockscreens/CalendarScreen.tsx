import { interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { loadFont } from '@remotion/google-fonts/Inter';
import { COLORS, SPRING } from '../../theme';
import { TabBar } from '../TabBar';

const { fontFamily } = loadFont('normal', {
  weights: ['400', '500', '600', '700'],
  subsets: ['latin'],
});

const EVENTS = [
  { time: '9:00 AM', title: 'Flight to Bali', color: COLORS.chatBlue, icon: '✈️', delay: 10 },
  { time: '2:30 PM', title: 'Hotel Check-in', color: COLORS.gold, icon: '🏨', delay: 18 },
  { time: '5:00 PM', title: 'Sunset at Tanah Lot', color: '#e8af48', icon: '🌅', delay: 26 },
  {
    time: '7:30 PM',
    title: 'Group Dinner — Jimbaran',
    color: COLORS.paymentGreen,
    icon: '🍽️',
    delay: 34,
  },
];

type CalendarScreenProps = {
  animationDelay?: number;
};

export const CalendarScreen: React.FC<CalendarScreenProps> = ({ animationDelay = 0 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  return (
    <div
      style={{ width: '100%', height: '100%', background: COLORS.background, position: 'relative' }}
    >
      {/* Header */}
      <div style={{ padding: '8px 12px', borderBottom: `1px solid ${COLORS.border}` }}>
        <div style={{ fontFamily, fontSize: 12, fontWeight: 700, color: COLORS.white }}>
          📅 Itinerary
        </div>
        <div style={{ fontFamily, fontSize: 9, color: COLORS.gold, fontWeight: 500, marginTop: 2 }}>
          Saturday, March 15
        </div>
      </div>

      {/* Timeline */}
      <div style={{ padding: '6px 12px', display: 'flex', flexDirection: 'column', gap: 6 }}>
        {EVENTS.map((event, i) => {
          const progress = spring({
            frame,
            fps,
            delay: animationDelay + event.delay,
            config: SPRING.smooth,
          });
          const x = interpolate(progress, [0, 1], [30, 0]);
          const opacity = interpolate(progress, [0, 1], [0, 1]);

          return (
            <div
              key={i}
              style={{
                display: 'flex',
                gap: 8,
                alignItems: 'flex-start',
                opacity,
                transform: `translateX(${x}px)`,
              }}
            >
              {/* Time */}
              <div
                style={{
                  fontFamily,
                  fontSize: 8,
                  color: COLORS.muted,
                  width: 42,
                  flexShrink: 0,
                  marginTop: 3,
                }}
              >
                {event.time}
              </div>

              {/* Timeline dot + line */}
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  width: 10,
                }}
              >
                <div
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    background: event.color,
                    flexShrink: 0,
                  }}
                />
                {i < EVENTS.length - 1 && (
                  <div
                    style={{ width: 1, height: 28, background: `${event.color}40`, marginTop: 2 }}
                  />
                )}
              </div>

              {/* Event card */}
              <div
                style={{
                  flex: 1,
                  background: COLORS.surface,
                  border: `1px solid ${COLORS.border}`,
                  borderLeft: `3px solid ${event.color}`,
                  borderRadius: 8,
                  padding: '6px 8px',
                }}
              >
                <div style={{ fontFamily, fontSize: 10, fontWeight: 600, color: COLORS.white }}>
                  {event.icon} {event.title}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <TabBar activeTab="calendar" delay={animationDelay + 5} />
    </div>
  );
};
