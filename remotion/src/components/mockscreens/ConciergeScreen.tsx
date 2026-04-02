import { interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { loadFont } from '@remotion/google-fonts/Inter';
import { COLORS, SPRING } from '../../theme';
import { ChatBubble } from '../ChatBubble';
import { TabBar } from '../TabBar';

const { fontFamily } = loadFont('normal', {
  weights: ['400', '500', '600', '700'],
  subsets: ['latin'],
});

type ConciergeScreenProps = {
  animationDelay?: number;
};

export const ConciergeScreen: React.FC<ConciergeScreenProps> = ({ animationDelay = 0 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Typing indicator dots
  const typingProgress = spring({
    frame,
    fps,
    delay: animationDelay + 20,
    config: SPRING.smooth,
  });

  // Action card entrance
  const actionProgress = spring({
    frame,
    fps,
    delay: animationDelay + 55,
    config: SPRING.snappy,
  });

  return (
    <div
      style={{ width: '100%', height: '100%', background: COLORS.background, position: 'relative' }}
    >
      {/* Header */}
      <div
        style={{
          padding: '8px 12px',
          borderBottom: `1px solid ${COLORS.border}`,
          display: 'flex',
          alignItems: 'center',
          gap: 8,
        }}
      >
        <div
          style={{
            width: 24,
            height: 24,
            borderRadius: '50%',
            background: `linear-gradient(135deg, ${COLORS.gold}60, ${COLORS.gold}20)`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 12,
          }}
        >
          🤖
        </div>
        <div>
          <div style={{ fontFamily, fontSize: 12, fontWeight: 700, color: COLORS.white }}>
            Chravel Agent
          </div>
          <div style={{ fontFamily, fontSize: 8, color: COLORS.gold }}>AI Concierge</div>
        </div>
      </div>

      {/* Messages */}
      <div style={{ padding: '8px 10px', display: 'flex', flexDirection: 'column', gap: 6 }}>
        <ChatBubble
          text="Find me the best hotels near Seminyak Beach under $200/night"
          isOwn
          delay={animationDelay + 8}
        />

        {/* Typing indicator */}
        {interpolate(typingProgress, [0, 1], [0, 1]) > 0.1 &&
          interpolate(actionProgress, [0, 1], [0, 1]) < 0.5 && (
            <div
              style={{
                display: 'flex',
                gap: 4,
                padding: '8px 12px',
                opacity: interpolate(typingProgress, [0, 1], [0, 0.8]),
              }}
            >
              {[0, 1, 2].map(i => (
                <div
                  key={i}
                  style={{
                    width: 5,
                    height: 5,
                    borderRadius: '50%',
                    background: COLORS.gold,
                    opacity: interpolate((frame + i * 5) % 20, [0, 10, 20], [0.3, 1, 0.3]),
                  }}
                />
              ))}
            </div>
          )}

        <ChatBubble
          text="I found 3 top-rated hotels near Seminyak Beach! Here's my top pick:"
          sender="Chravel Agent"
          isAI
          delay={animationDelay + 45}
        />

        {/* Action card */}
        <div
          style={{
            background: COLORS.surface,
            border: `1px solid ${COLORS.gold}30`,
            borderRadius: 10,
            padding: 8,
            marginLeft: 4,
            maxWidth: '80%',
            opacity: interpolate(actionProgress, [0, 1], [0, 1]),
            transform: `translateY(${interpolate(actionProgress, [0, 1], [10, 0])}px)`,
          }}
        >
          <div style={{ fontFamily, fontSize: 10, fontWeight: 600, color: COLORS.white }}>
            🏨 The Legian Seminyak
          </div>
          <div style={{ fontFamily, fontSize: 8, color: COLORS.muted, marginTop: 2 }}>
            $189/night · ⭐ 4.8 · Beachfront
          </div>
          <div
            style={{
              marginTop: 4,
              display: 'flex',
              gap: 4,
            }}
          >
            <div
              style={{
                fontFamily,
                fontSize: 7,
                fontWeight: 600,
                color: COLORS.background,
                background: COLORS.gold,
                borderRadius: 4,
                padding: '2px 6px',
              }}
            >
              📅 Add to Calendar
            </div>
            <div
              style={{
                fontFamily,
                fontSize: 7,
                fontWeight: 600,
                color: COLORS.gold,
                border: `1px solid ${COLORS.gold}40`,
                borderRadius: 4,
                padding: '2px 6px',
              }}
            >
              📍 Save Place
            </div>
          </div>
        </div>
      </div>

      <TabBar activeTab="concierge" delay={animationDelay + 5} />
    </div>
  );
};
