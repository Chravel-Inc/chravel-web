import { interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { loadFont } from '@remotion/google-fonts/Inter';
import { COLORS, SPRING } from '../../theme';
import { ChatBubble } from '../ChatBubble';
import { TabBar } from '../TabBar';

const { fontFamily } = loadFont('normal', {
  weights: ['600', '700'],
  subsets: ['latin'],
});

const MESSAGES = [
  { text: 'Just booked the Airbnb! 🏠', sender: 'Sarah', isOwn: false, delay: 8 },
  { text: 'Amazing!! Send the link', isOwn: true, delay: 20 },
  { text: 'Can we do a pool day on Saturday?', sender: 'Mike', isOwn: false, delay: 35 },
  { text: "I'm so down 🏊‍♂️", isOwn: true, delay: 48 },
  { text: 'Adding it to the calendar now!', sender: 'Sarah', isOwn: false, delay: 60 },
];

type ChatScreenProps = {
  animationDelay?: number;
};

export const ChatScreen: React.FC<ChatScreenProps> = ({ animationDelay = 0 }) => {
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
      {/* Header */}
      <div
        style={{
          padding: '8px 12px',
          borderBottom: `1px solid ${COLORS.border}`,
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          opacity: interpolate(headerEntrance, [0, 1], [0, 1]),
        }}
      >
        <div style={{ fontSize: 10, color: COLORS.muted }}>←</div>
        <div
          style={{
            width: 24,
            height: 24,
            borderRadius: '50%',
            background: `linear-gradient(135deg, ${COLORS.gold}40, ${COLORS.gold}20)`,
            border: `1px solid ${COLORS.gold}30`,
          }}
        />
        <div>
          <div style={{ fontFamily, fontSize: 12, fontWeight: 700, color: COLORS.white }}>
            Bali Trip 🌴
          </div>
          <div style={{ fontFamily, fontSize: 8, color: COLORS.muted }}>4 members · Active now</div>
        </div>
      </div>

      {/* Messages */}
      <div
        style={{
          padding: '8px 10px',
          display: 'flex',
          flexDirection: 'column',
          gap: 6,
          flex: 1,
        }}
      >
        {MESSAGES.map((msg, i) => (
          <ChatBubble
            key={i}
            text={msg.text}
            sender={msg.sender}
            isOwn={msg.isOwn ?? false}
            delay={animationDelay + msg.delay}
          />
        ))}
      </div>

      <TabBar activeTab="chat" delay={animationDelay + 5} />
    </div>
  );
};
