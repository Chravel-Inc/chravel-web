import {
  AbsoluteFill,
  Sequence,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import { loadFont } from '@remotion/google-fonts/Inter';
import { COLORS, SPRING, TIMING, SHADOWS, FPS } from '../theme';
import { PhoneFrame } from '../components/PhoneFrame';
import { TravelBackground } from '../components/TravelBackground';
import { EndCard } from '../components/EndCard';
import { PaymentsScreen } from '../components/mockscreens/PaymentsScreen';

const { fontFamily } = loadFont('normal', {
  weights: ['400', '600', '700', '800'],
  subsets: ['latin'],
});

export const PAYMENT_SPLIT_DURATION = 10 * FPS; // 300 frames

const SPLIT_MEMBERS = [
  { name: 'You', amount: '$310', avatar: '👤', delay: 130 },
  { name: 'Sarah', amount: '$310', avatar: '👩', delay: 140 },
  { name: 'Mike', amount: '$310', avatar: '👨', delay: 150 },
  { name: 'Alex', amount: '$310', avatar: '🧑', delay: 160 },
];

/** Scene: Payment Split — expense appears, split calculated, who-owes-what animation */
export const PaymentSplit: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Title
  const titleProgress = spring({ frame, fps, delay: 5, config: SPRING.smooth });

  // Total amount entrance
  const totalProgress = spring({ frame, fps, delay: 100, config: SPRING.bouncy });

  // Split lines radiating out
  const splitProgress = spring({ frame, fps, delay: 120, config: SPRING.smooth });

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
          Split Expenses.
        </div>
        <div style={{ fontFamily, fontSize: 42, fontWeight: 800, color: COLORS.gold }}>
          Stay Friends.
        </div>
        <div
          style={{ fontFamily, fontSize: 20, fontWeight: 400, color: COLORS.muted, marginTop: 12 }}
        >
          No more awkward money conversations.
        </div>
      </div>

      {/* Phone with payments screen */}
      <PhoneFrame scale={0.85} x={-150} y={20} delay={10} float>
        <PaymentsScreen animationDelay={15} />
      </PhoneFrame>

      {/* Floating split visualization */}
      <div
        style={{
          position: 'absolute',
          right: 200,
          top: 350,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        {/* Total amount */}
        <div
          style={{
            opacity: interpolate(totalProgress, [0, 1], [0, 1]),
            transform: `scale(${interpolate(totalProgress, [0, 1], [0.7, 1])})`,
            background: COLORS.surface,
            border: `1px solid ${COLORS.gold}30`,
            borderRadius: 16,
            padding: '12px 24px',
            boxShadow: SHADOWS.goldGlow,
            textAlign: 'center',
            marginBottom: 20,
          }}
        >
          <div style={{ fontFamily, fontSize: 14, fontWeight: 600, color: COLORS.muted }}>
            Airbnb Villa
          </div>
          <div style={{ fontFamily, fontSize: 32, fontWeight: 800, color: COLORS.white }}>
            $1,240
          </div>
          <div style={{ fontFamily, fontSize: 12, fontWeight: 500, color: COLORS.gold }}>
            ÷ 4 people
          </div>
        </div>

        {/* Split lines */}
        <div
          style={{
            width: 2,
            height: interpolate(splitProgress, [0, 1], [0, 30]),
            background: `linear-gradient(180deg, ${COLORS.gold}, ${COLORS.gold}40)`,
            marginBottom: 10,
          }}
        />

        {/* Individual split cards */}
        <div style={{ display: 'flex', gap: 12 }}>
          {SPLIT_MEMBERS.map((member, i) => {
            const memberProgress = spring({
              frame,
              fps,
              delay: member.delay,
              config: SPRING.snappy,
            });
            return (
              <div
                key={i}
                style={{
                  opacity: interpolate(memberProgress, [0, 1], [0, 1]),
                  transform: `translateY(${interpolate(memberProgress, [0, 1], [20, 0])}px) scale(${interpolate(memberProgress, [0, 1], [0.8, 1])})`,
                  background: COLORS.surface,
                  border: `1px solid ${COLORS.border}`,
                  borderRadius: 12,
                  padding: '10px 14px',
                  textAlign: 'center',
                }}
              >
                <div style={{ fontSize: 20, marginBottom: 4 }}>{member.avatar}</div>
                <div style={{ fontFamily, fontSize: 11, fontWeight: 600, color: COLORS.white }}>
                  {member.name}
                </div>
                <div
                  style={{
                    fontFamily,
                    fontSize: 14,
                    fontWeight: 700,
                    color: COLORS.gold,
                    marginTop: 2,
                  }}
                >
                  {member.amount}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* End card */}
      <Sequence from={PAYMENT_SPLIT_DURATION - TIMING.endCard}>
        <EndCard />
      </Sequence>
    </AbsoluteFill>
  );
};
