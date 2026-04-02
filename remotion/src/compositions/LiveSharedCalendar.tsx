import {
  AbsoluteFill,
  Sequence,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import { loadFont } from '@remotion/google-fonts/Inter';
import { COLORS, SPRING, TIMING, FPS } from '../theme';
import { PhoneFrame } from '../components/PhoneFrame';
import { TravelBackground } from '../components/TravelBackground';
import { EndCard } from '../components/EndCard';
import { CalendarScreen } from '../components/mockscreens/CalendarScreen';
import { SyncIndicator } from '../components/SyncIndicator';

const { fontFamily } = loadFont('normal', {
  weights: ['400', '700', '800'],
  subsets: ['latin'],
});

export const LIVE_CALENDAR_DURATION = 12 * FPS; // 360 frames

/** Scene: Live Shared Calendar — itinerary builds live; changes sync across multiple phones */
export const LiveSharedCalendar: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Title
  const titleProgress = spring({ frame, fps, delay: 5, config: SPRING.smooth });

  // New event appearing (shows live update)
  const newEventProgress = spring({ frame, fps, delay: 130, config: SPRING.snappy });

  return (
    <AbsoluteFill>
      <TravelBackground variant="gradient" />

      {/* Title overlay */}
      <div
        style={{
          position: 'absolute',
          top: 80,
          right: 100,
          textAlign: 'right',
          opacity: interpolate(titleProgress, [0, 1], [0, 1]),
          transform: `translateY(${interpolate(titleProgress, [0, 1], [20, 0])}px)`,
        }}
      >
        <div style={{ fontFamily, fontSize: 42, fontWeight: 800, color: COLORS.white }}>
          One Itinerary.
        </div>
        <div style={{ fontFamily, fontSize: 42, fontWeight: 800, color: COLORS.gold }}>
          Always In Sync.
        </div>
        <div
          style={{ fontFamily, fontSize: 20, fontWeight: 400, color: COLORS.muted, marginTop: 12 }}
        >
          Everyone sees changes in real time.
        </div>
      </div>

      {/* Three phones showing same calendar */}
      <PhoneFrame scale={0.75} x={-320} y={40} delay={15} float>
        <CalendarScreen animationDelay={20} />
      </PhoneFrame>

      <PhoneFrame scale={0.85} x={0} y={20} delay={8} float>
        <div
          style={{
            width: '100%',
            height: '100%',
            background: COLORS.background,
            position: 'relative',
          }}
        >
          <CalendarScreen animationDelay={12} />

          {/* Live update indicator */}
          {newEventProgress > 0.1 && (
            <div
              style={{
                position: 'absolute',
                top: 8,
                right: 8,
                background: `${COLORS.paymentGreen}20`,
                border: `1px solid ${COLORS.paymentGreen}40`,
                borderRadius: 6,
                padding: '2px 6px',
                display: 'flex',
                alignItems: 'center',
                gap: 3,
                opacity: interpolate(newEventProgress, [0, 1], [0, 1]),
              }}
            >
              <div
                style={{
                  width: 4,
                  height: 4,
                  borderRadius: '50%',
                  background: COLORS.paymentGreen,
                }}
              />
              <div style={{ fontFamily, fontSize: 7, color: COLORS.paymentGreen, fontWeight: 600 }}>
                Live
              </div>
            </div>
          )}
        </div>
      </PhoneFrame>

      <PhoneFrame scale={0.75} x={320} y={40} delay={22} float>
        <CalendarScreen animationDelay={28} />
      </PhoneFrame>

      {/* Sync indicators between phones */}
      <SyncIndicator x={960 - 170} y={480} delay={100} color={COLORS.gold} />
      <SyncIndicator x={960 + 150} y={480} delay={110} color={COLORS.gold} />

      {/* End card */}
      <Sequence from={LIVE_CALENDAR_DURATION - TIMING.endCard}>
        <EndCard />
      </Sequence>
    </AbsoluteFill>
  );
};
