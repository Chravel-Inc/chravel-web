import { interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { loadFont } from '@remotion/google-fonts/Inter';
import { COLORS, SPRING, TIMING } from '../theme';

const { fontFamily } = loadFont('normal', {
  weights: ['400', '500', '600', '700'],
  subsets: ['latin'],
});

type AndroidNotificationBarProps = {
  delay?: number;
  /** Whether the mini waveform equalizer animates */
  waveformActive?: boolean;
  /** Show in expanded/enlarged detail mode */
  expanded?: boolean;
  /** Session duration to display */
  sessionDuration?: string;
};

/** 3-bar equalizer animation */
const EqualizerBars: React.FC<{ active: boolean; barHeight: number }> = ({ active, barHeight }) => {
  const frame = useCurrentFrame();
  const heights = [
    active ? interpolate(Math.sin(frame * 0.25) * 0.5 + 0.5, [0, 1], [0.3, 1]) : 0.3,
    active ? interpolate(Math.sin(frame * 0.18 + 1) * 0.5 + 0.5, [0, 1], [0.2, 1]) : 0.5,
    active ? interpolate(Math.sin(frame * 0.22 + 2) * 0.5 + 0.5, [0, 1], [0.4, 1]) : 0.4,
  ];

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'flex-end',
        gap: 1.5,
        height: barHeight,
      }}
    >
      {heights.map((h, i) => (
        <div
          key={i}
          style={{
            width: barHeight * 0.2,
            height: `${h * 100}%`,
            borderRadius: 1,
            background: COLORS.gold,
          }}
        />
      ))}
    </div>
  );
};

export const AndroidNotificationBar: React.FC<AndroidNotificationBarProps> = ({
  delay = 0,
  waveformActive = true,
  expanded = false,
  sessionDuration = '00:42',
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const entrance = spring({ frame, fps, delay, config: SPRING.smooth });
  const slideY = interpolate(entrance, [0, 1], [-200, 0]);

  // Staggered elements inside notification
  const iconEntrance = spring({ frame, fps, delay: delay + TIMING.stagger, config: SPRING.snappy });
  const titleEntrance = spring({
    frame,
    fps,
    delay: delay + TIMING.stagger * 2,
    config: SPRING.snappy,
  });
  const controlsEntrance = spring({
    frame,
    fps,
    delay: delay + TIMING.stagger * 3,
    config: SPRING.snappy,
  });
  const badgeEntrance = spring({
    frame,
    fps,
    delay: delay + TIMING.stagger * 4,
    config: SPRING.snappy,
  });

  const scale = expanded ? 1.4 : 1;
  const width = expanded ? 440 : 320;

  return (
    <div
      style={{
        transform: `translateY(${slideY}px) scale(${scale})`,
        opacity: interpolate(entrance, [0, 1], [0, 1]),
        width,
        fontFamily,
      }}
    >
      {/* Android status bar */}
      <div
        style={{
          background: '#1a1a1a',
          padding: '4px 12px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderRadius: expanded ? '12px 12px 0 0' : '8px 8px 0 0',
        }}
      >
        <div style={{ fontSize: 10, fontWeight: 600, color: `${COLORS.white}cc` }}>9:41</div>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          {/* Wifi icon */}
          <svg width="10" height="8" viewBox="0 0 10 8">
            <path d="M5 8L0 3C1.5 1.5 3 0.5 5 0.5S8.5 1.5 10 3L5 8Z" fill={`${COLORS.white}99`} />
          </svg>
          {/* Signal bars */}
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 1 }}>
            {[4, 6, 8, 10].map((h, i) => (
              <div
                key={i}
                style={{
                  width: 2,
                  height: h,
                  borderRadius: 0.5,
                  background: `${COLORS.white}99`,
                }}
              />
            ))}
          </div>
          {/* Battery */}
          <div
            style={{
              width: 16,
              height: 8,
              borderRadius: 2,
              border: `1px solid ${COLORS.white}66`,
              padding: 1,
              position: 'relative',
            }}
          >
            <div
              style={{
                width: '75%',
                height: '100%',
                borderRadius: 1,
                background: `${COLORS.white}cc`,
              }}
            />
          </div>
        </div>
      </div>

      {/* Notification shade */}
      <div
        style={{
          background: 'rgba(15,15,15,0.95)',
          borderRadius: expanded ? '0 0 12px 12px' : '0 0 8px 8px',
          padding: expanded ? 16 : 10,
        }}
      >
        {/* Chravel notification card */}
        <div
          style={{
            background: COLORS.surface,
            border: `1px solid ${COLORS.borderGold}`,
            borderRadius: 10,
            padding: expanded ? '12px 14px' : '8px 10px',
            opacity: interpolate(iconEntrance, [0, 1], [0, 1]),
          }}
        >
          {/* Top row: icon + title + equalizer */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              opacity: interpolate(titleEntrance, [0, 1], [0, 1]),
            }}
          >
            {/* App icon */}
            <div
              style={{
                width: expanded ? 28 : 20,
                height: expanded ? 28 : 20,
                borderRadius: '50%',
                background: `linear-gradient(135deg, ${COLORS.gold}80, ${COLORS.gold}30)`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: expanded ? 12 : 9,
                fontWeight: 700,
                color: COLORS.gold,
                flexShrink: 0,
              }}
            >
              C
            </div>

            {/* Title & body */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  fontSize: expanded ? 13 : 10,
                  fontWeight: 600,
                  color: COLORS.white,
                }}
              >
                Chravel
              </div>
              <div
                style={{
                  fontSize: expanded ? 11 : 8,
                  color: COLORS.muted,
                  marginTop: 1,
                }}
              >
                Voice session active
              </div>
              {expanded && (
                <div style={{ fontSize: 9, color: COLORS.mutedLight, marginTop: 2 }}>
                  AI Concierge &middot; Streaming audio
                </div>
              )}
            </div>

            {/* Mini equalizer */}
            <EqualizerBars active={waveformActive} barHeight={expanded ? 18 : 14} />
          </div>

          {/* Media controls row */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: expanded ? 12 : 8,
              marginTop: expanded ? 10 : 6,
              opacity: interpolate(controlsEntrance, [0, 1], [0, 1]),
            }}
          >
            {/* Pause button */}
            <div
              style={{
                width: expanded ? 28 : 20,
                height: expanded ? 28 : 20,
                borderRadius: '50%',
                background: `${COLORS.white}15`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <div style={{ display: 'flex', gap: expanded ? 2.5 : 2 }}>
                <div
                  style={{
                    width: expanded ? 2.5 : 2,
                    height: expanded ? 10 : 7,
                    background: COLORS.white,
                    borderRadius: 1,
                  }}
                />
                <div
                  style={{
                    width: expanded ? 2.5 : 2,
                    height: expanded ? 10 : 7,
                    background: COLORS.white,
                    borderRadius: 1,
                  }}
                />
              </div>
            </div>

            {/* Stop button */}
            <div
              style={{
                width: expanded ? 28 : 20,
                height: expanded ? 28 : 20,
                borderRadius: '50%',
                background: `${COLORS.white}15`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <div
                style={{
                  width: expanded ? 9 : 6,
                  height: expanded ? 9 : 6,
                  background: COLORS.white,
                  borderRadius: 1,
                }}
              />
            </div>

            {/* Duration */}
            <div
              style={{
                fontSize: expanded ? 11 : 8,
                color: COLORS.muted,
                marginLeft: 'auto',
              }}
            >
              {sessionDuration}
            </div>
          </div>

          {/* Ongoing badge */}
          <div
            style={{
              marginTop: expanded ? 8 : 5,
              opacity: interpolate(badgeEntrance, [0, 1], [0, 1]),
            }}
          >
            <span
              style={{
                fontSize: expanded ? 9 : 7,
                fontWeight: 600,
                color: COLORS.goldPale,
                background: `${COLORS.gold}20`,
                borderRadius: 4,
                padding: expanded ? '2px 8px' : '1px 5px',
                letterSpacing: '0.3px',
              }}
            >
              Ongoing
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
