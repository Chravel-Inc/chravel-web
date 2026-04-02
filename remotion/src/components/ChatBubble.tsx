import { interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { loadFont } from '@remotion/google-fonts/Inter';
import { COLORS, SPRING } from '../theme';

const { fontFamily } = loadFont('normal', {
  weights: ['400', '500', '600'],
  subsets: ['latin'],
});

type ChatBubbleProps = {
  text: string;
  sender?: string;
  isOwn?: boolean;
  isAI?: boolean;
  delay?: number;
};

export const ChatBubble: React.FC<ChatBubbleProps> = ({
  text,
  sender,
  isOwn = false,
  isAI = false,
  delay = 0,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const progress = spring({
    frame,
    fps,
    delay,
    config: SPRING.snappy,
  });
  const scale = interpolate(progress, [0, 1], [0.8, 1]);
  const opacity = interpolate(progress, [0, 1], [0, 1]);
  const y = interpolate(progress, [0, 1], [10, 0]);

  const bgColor = isOwn ? COLORS.chatBlue : COLORS.chatReceived;
  const align = isOwn ? 'flex-end' : 'flex-start';

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: align,
        opacity,
        transform: `translateY(${y}px) scale(${scale})`,
        transformOrigin: isOwn ? 'bottom right' : 'bottom left',
        width: '100%',
      }}
    >
      {sender && !isOwn && (
        <div
          style={{
            fontFamily,
            fontSize: 9,
            fontWeight: 600,
            color: isAI ? COLORS.gold : COLORS.muted,
            marginBottom: 2,
            marginLeft: 8,
          }}
        >
          {sender}
        </div>
      )}
      <div
        style={{
          background: bgColor,
          borderRadius: 14,
          padding: '6px 10px',
          maxWidth: '75%',
          borderLeft: isAI ? `2px solid ${COLORS.gold}40` : 'none',
          position: 'relative',
        }}
      >
        <div
          style={{
            fontFamily,
            fontSize: 11,
            fontWeight: 400,
            color: COLORS.white,
            lineHeight: 1.4,
          }}
        >
          {text}
        </div>
      </div>
    </div>
  );
};
