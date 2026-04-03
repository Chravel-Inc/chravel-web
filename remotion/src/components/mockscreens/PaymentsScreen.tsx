import { interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { loadFont } from '@remotion/google-fonts/Inter';
import { COLORS, SPRING } from '../../theme';
import { TabBar } from '../TabBar';

const { fontFamily } = loadFont('normal', {
  weights: ['400', '500', '600', '700'],
  subsets: ['latin'],
});

const EXPENSES = [
  { title: 'Airbnb Villa', amount: '$1,240', split: '$310/person', icon: '🏠', delay: 12 },
  { title: 'Dinner at Jimbaran', amount: '$180', split: '$45/person', icon: '🍽️', delay: 22 },
  { title: 'Scooter Rental', amount: '$80', split: '$20/person', icon: '🛵', delay: 32 },
];

const BALANCES = [
  { name: 'You', amount: '+$0', color: COLORS.muted },
  { name: 'Sarah', amount: '-$85', color: COLORS.destructive },
  { name: 'Mike', amount: '+$42', color: COLORS.paymentGreen },
  { name: 'Alex', amount: '+$43', color: COLORS.paymentGreen },
];

type PaymentsScreenProps = {
  animationDelay?: number;
};

export const PaymentsScreen: React.FC<PaymentsScreenProps> = ({ animationDelay = 0 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  return (
    <div
      style={{ width: '100%', height: '100%', background: COLORS.background, position: 'relative' }}
    >
      {/* Header */}
      <div style={{ padding: '8px 12px', borderBottom: `1px solid ${COLORS.border}` }}>
        <div style={{ fontFamily, fontSize: 12, fontWeight: 700, color: COLORS.white }}>
          💰 Payments
        </div>
        <div style={{ fontFamily, fontSize: 9, color: COLORS.muted, marginTop: 2 }}>
          Total: $1,500 · 4 people
        </div>
      </div>

      {/* Expense list */}
      <div style={{ padding: '6px 10px', display: 'flex', flexDirection: 'column', gap: 4 }}>
        {EXPENSES.map((exp, i) => {
          const progress = spring({
            frame,
            fps,
            delay: animationDelay + exp.delay,
            config: SPRING.smooth,
          });
          return (
            <div
              key={i}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                background: COLORS.surface,
                border: `1px solid ${COLORS.border}`,
                borderRadius: 8,
                padding: '6px 8px',
                opacity: interpolate(progress, [0, 1], [0, 1]),
                transform: `translateX(${interpolate(progress, [0, 1], [20, 0])}px)`,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{ fontSize: 14 }}>{exp.icon}</div>
                <div>
                  <div style={{ fontFamily, fontSize: 10, fontWeight: 600, color: COLORS.white }}>
                    {exp.title}
                  </div>
                  <div style={{ fontFamily, fontSize: 7, color: COLORS.muted }}>{exp.split}</div>
                </div>
              </div>
              <div style={{ fontFamily, fontSize: 11, fontWeight: 700, color: COLORS.white }}>
                {exp.amount}
              </div>
            </div>
          );
        })}
      </div>

      {/* Balance bar */}
      <div style={{ padding: '6px 10px' }}>
        <div
          style={{
            fontFamily,
            fontSize: 8,
            fontWeight: 600,
            color: COLORS.gold,
            marginBottom: 4,
            textTransform: 'uppercase',
            letterSpacing: 1,
          }}
        >
          Balances
        </div>
        <div style={{ display: 'flex', gap: 4 }}>
          {BALANCES.map((b, i) => {
            const progress = spring({
              frame,
              fps,
              delay: animationDelay + 45 + i * 5,
              config: SPRING.snappy,
            });
            return (
              <div
                key={i}
                style={{
                  flex: 1,
                  background: COLORS.surface,
                  borderRadius: 6,
                  padding: '4px 6px',
                  textAlign: 'center',
                  opacity: interpolate(progress, [0, 1], [0, 1]),
                  transform: `scale(${interpolate(progress, [0, 1], [0.8, 1])})`,
                }}
              >
                <div style={{ fontFamily, fontSize: 7, color: COLORS.muted }}>{b.name}</div>
                <div style={{ fontFamily, fontSize: 9, fontWeight: 700, color: b.color }}>
                  {b.amount}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <TabBar activeTab="payments" delay={animationDelay + 5} />
    </div>
  );
};
