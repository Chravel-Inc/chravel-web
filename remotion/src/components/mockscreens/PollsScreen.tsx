import { interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { loadFont } from '@remotion/google-fonts/Inter';
import { COLORS, SPRING } from '../../theme';
import { TabBar } from '../TabBar';

const { fontFamily } = loadFont('normal', {
  weights: ['400', '500', '600', '700'],
  subsets: ['latin'],
});

const POLL_OPTIONS = [
  { label: 'Beach day 🏖️', votes: 3, pct: 75, delay: 18 },
  { label: 'Temple tour ⛩️', votes: 1, pct: 25, delay: 26 },
];

type PollsScreenProps = {
  animationDelay?: number;
};

export const PollsScreen: React.FC<PollsScreenProps> = ({ animationDelay = 0 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const headerProgress = spring({
    frame,
    fps,
    delay: animationDelay,
    config: SPRING.smooth,
  });

  return (
    <div
      style={{ width: '100%', height: '100%', background: COLORS.background, position: 'relative' }}
    >
      {/* Header */}
      <div style={{ padding: '8px 12px', borderBottom: `1px solid ${COLORS.border}` }}>
        <div style={{ fontFamily, fontSize: 12, fontWeight: 700, color: COLORS.white }}>
          📊 Polls
        </div>
        <div style={{ fontFamily, fontSize: 8, color: COLORS.muted, marginTop: 2 }}>
          2 active polls
        </div>
      </div>

      {/* Active poll */}
      <div style={{ padding: '8px 10px' }}>
        <div
          style={{
            background: COLORS.surface,
            border: `1px solid ${COLORS.border}`,
            borderRadius: 10,
            padding: 10,
            opacity: interpolate(headerProgress, [0, 1], [0, 1]),
          }}
        >
          <div
            style={{
              fontFamily,
              fontSize: 11,
              fontWeight: 700,
              color: COLORS.white,
              marginBottom: 2,
            }}
          >
            What should we do Saturday?
          </div>
          <div style={{ fontFamily, fontSize: 8, color: COLORS.muted, marginBottom: 8 }}>
            4 votes · Ends tomorrow
          </div>

          {/* Options with vote bars */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {POLL_OPTIONS.map((opt, i) => {
              const barProgress = spring({
                frame,
                fps,
                delay: animationDelay + opt.delay,
                config: SPRING.smooth,
              });
              const barWidth = interpolate(barProgress, [0, 1], [0, opt.pct]);

              return (
                <div key={i}>
                  <div
                    style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}
                  >
                    <div style={{ fontFamily, fontSize: 9, fontWeight: 500, color: COLORS.white }}>
                      {opt.label}
                    </div>
                    <div
                      style={{
                        fontFamily,
                        fontSize: 9,
                        fontWeight: 600,
                        color: i === 0 ? COLORS.gold : COLORS.muted,
                      }}
                    >
                      {opt.pct}%
                    </div>
                  </div>
                  <div
                    style={{
                      width: '100%',
                      height: 6,
                      borderRadius: 3,
                      background: COLORS.border,
                      overflow: 'hidden',
                    }}
                  >
                    <div
                      style={{
                        width: `${barWidth}%`,
                        height: '100%',
                        borderRadius: 3,
                        background: i === 0 ? COLORS.gold : COLORS.muted,
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Voter avatars */}
          <div style={{ display: 'flex', gap: -4, marginTop: 8 }}>
            {[COLORS.chatBlue, COLORS.gold, COLORS.paymentGreen, COLORS.aiPurple].map((c, i) => {
              const avatarProgress = spring({
                frame,
                fps,
                delay: animationDelay + 35 + i * 4,
                config: SPRING.snappy,
              });
              return (
                <div
                  key={i}
                  style={{
                    width: 16,
                    height: 16,
                    borderRadius: '50%',
                    background: c,
                    border: `1.5px solid ${COLORS.background}`,
                    marginLeft: i > 0 ? -4 : 0,
                    opacity: interpolate(avatarProgress, [0, 1], [0, 1]),
                    transform: `scale(${interpolate(avatarProgress, [0, 1], [0.5, 1])})`,
                  }}
                />
              );
            })}
          </div>
        </div>
      </div>

      <TabBar activeTab="polls" delay={animationDelay + 5} />
    </div>
  );
};
