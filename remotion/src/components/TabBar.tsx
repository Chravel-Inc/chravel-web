import { interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { loadFont } from '@remotion/google-fonts/Inter';
import { COLORS, SPRING } from '../theme';

const { fontFamily } = loadFont('normal', {
  weights: ['500', '600'],
  subsets: ['latin'],
});

export const TAB_ITEMS = [
  { id: 'chat', label: 'Chat', icon: '💬' },
  { id: 'calendar', label: 'Calendar', icon: '📅' },
  { id: 'concierge', label: 'Concierge', icon: '🤖' },
  { id: 'media', label: 'Media', icon: '📸' },
  { id: 'payments', label: 'Payments', icon: '💰' },
  { id: 'places', label: 'Places', icon: '📍' },
  { id: 'polls', label: 'Polls', icon: '📊' },
  { id: 'tasks', label: 'Tasks', icon: '✅' },
] as const;

export type TabId = (typeof TAB_ITEMS)[number]['id'];

type TabBarProps = {
  activeTab: TabId;
  delay?: number;
};

export const TabBar: React.FC<TabBarProps> = ({ activeTab, delay = 0 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const entrance = spring({
    frame,
    fps,
    delay,
    config: SPRING.smooth,
  });
  const barY = interpolate(entrance, [0, 1], [60, 0]);
  const barOpacity = interpolate(entrance, [0, 1], [0, 1]);

  return (
    <div
      style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: 60,
        background: `${COLORS.surface}f0`,
        borderTop: `1px solid ${COLORS.border}`,
        display: 'flex',
        justifyContent: 'space-around',
        alignItems: 'center',
        padding: '0 4px',
        transform: `translateY(${barY}px)`,
        opacity: barOpacity,
      }}
    >
      {TAB_ITEMS.map(tab => {
        const isActive = tab.id === activeTab;
        return (
          <div
            key={tab.id}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 2,
              flex: 1,
            }}
          >
            <div style={{ fontSize: 16 }}>{tab.icon}</div>
            <div
              style={{
                fontFamily,
                fontSize: 8,
                fontWeight: isActive ? 600 : 500,
                color: isActive ? COLORS.gold : COLORS.mutedLight,
              }}
            >
              {tab.label}
            </div>
            {isActive && (
              <div
                style={{
                  width: 4,
                  height: 4,
                  borderRadius: '50%',
                  background: COLORS.gold,
                  marginTop: 1,
                }}
              />
            )}
          </div>
        );
      })}
    </div>
  );
};
