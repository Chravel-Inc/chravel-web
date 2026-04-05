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
import { TAB_ITEMS } from '../components/TabBar';
import { ChatScreen } from '../components/mockscreens/ChatScreen';
import { CalendarScreen } from '../components/mockscreens/CalendarScreen';
import { ConciergeScreen } from '../components/mockscreens/ConciergeScreen';
import { MediaScreen } from '../components/mockscreens/MediaScreen';
import { PaymentsScreen } from '../components/mockscreens/PaymentsScreen';
import { PlacesScreen } from '../components/mockscreens/PlacesScreen';
import { PollsScreen } from '../components/mockscreens/PollsScreen';
import { TasksScreen } from '../components/mockscreens/TasksScreen';

const { fontFamily } = loadFont('normal', {
  weights: ['400', '600', '700', '800'],
  subsets: ['latin'],
});

export const TAB_NAV_DURATION = 15 * FPS; // 450 frames

// Each tab gets ~35 frames of visibility, with transitions
const TAB_SCHEDULE = TAB_ITEMS.map((tab, i) => ({
  ...tab,
  start: 30 + i * 38,
}));

/** Scene: Tab Navigation Hero — swipe through all 8 tabs */
export const TabNavigationHero: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Title
  const titleProgress = spring({ frame, fps, delay: 5, config: SPRING.smooth });

  // Determine active tab based on frame
  let activeIndex = 0;
  for (let i = TAB_SCHEDULE.length - 1; i >= 0; i--) {
    if (frame >= TAB_SCHEDULE[i].start) {
      activeIndex = i;
      break;
    }
  }
  const activeTab = TAB_SCHEDULE[activeIndex];

  // Tab label that shows current feature
  const TAB_DESCRIPTIONS = [
    'Private group messaging',
    'Shared live itinerary',
    'AI-powered travel assistant',
    'Trip photo & video hub',
    'Expense splitting & tracking',
    'Saved places & map',
    'Group voting & decisions',
    'Shared to-do lists',
  ];

  // Feature label animation
  const labelProgress = spring({
    frame: frame - activeTab.start,
    fps,
    config: SPRING.snappy,
  });

  // Render the active screen component
  const renderScreen = (tabId: string, delay: number) => {
    switch (tabId) {
      case 'chat':
        return <ChatScreen animationDelay={delay} />;
      case 'calendar':
        return <CalendarScreen animationDelay={delay} />;
      case 'concierge':
        return <ConciergeScreen animationDelay={delay} />;
      case 'media':
        return <MediaScreen animationDelay={delay} />;
      case 'payments':
        return <PaymentsScreen animationDelay={delay} />;
      case 'places':
        return <PlacesScreen animationDelay={delay} />;
      case 'polls':
        return <PollsScreen animationDelay={delay} />;
      case 'tasks':
        return <TasksScreen animationDelay={delay} />;
      default:
        return <ChatScreen animationDelay={delay} />;
    }
  };

  return (
    <AbsoluteFill>
      <TravelBackground variant="gold-ambient" />

      {/* Title overlay */}
      <div
        style={{
          position: 'absolute',
          top: 80,
          left: 100,
          opacity: interpolate(titleProgress, [0, 1], [0, 1]),
          transform: `translateY(${interpolate(titleProgress, [0, 1], [20, 0])}px)`,
        }}
      >
        <div style={{ fontFamily, fontSize: 42, fontWeight: 800, color: COLORS.white }}>
          8 Features.
        </div>
        <div style={{ fontFamily, fontSize: 42, fontWeight: 800, color: COLORS.gold }}>
          One App.
        </div>
      </div>

      {/* Active feature label */}
      <div
        style={{
          position: 'absolute',
          bottom: 120,
          left: 100,
          opacity: interpolate(labelProgress, [0, 1], [0, 1]),
          transform: `translateY(${interpolate(labelProgress, [0, 1], [15, 0])}px)`,
        }}
      >
        <div style={{ fontFamily, fontSize: 28, fontWeight: 700, color: COLORS.gold }}>
          {activeTab.icon} {activeTab.label}
        </div>
        <div
          style={{ fontFamily, fontSize: 18, fontWeight: 400, color: COLORS.muted, marginTop: 4 }}
        >
          {TAB_DESCRIPTIONS[activeIndex]}
        </div>
      </div>

      {/* Phone cycling through tabs */}
      <PhoneFrame scale={0.95} x={120} y={0} delay={8} float>
        {renderScreen(activeTab.id, activeTab.start)}
      </PhoneFrame>

      {/* Tab indicator dots on the side */}
      <div
        style={{
          position: 'absolute',
          right: 80,
          top: '50%',
          transform: 'translateY(-50%)',
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
        }}
      >
        {TAB_ITEMS.map((tab, i) => {
          const isActive = i === activeIndex;
          const dotProgress = spring({
            frame,
            fps,
            delay: 25 + i * 3,
            config: SPRING.smooth,
          });
          return (
            <div
              key={tab.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                opacity: interpolate(dotProgress, [0, 1], [0, 1]),
              }}
            >
              <div
                style={{
                  width: isActive ? 12 : 8,
                  height: isActive ? 12 : 8,
                  borderRadius: '50%',
                  background: isActive ? COLORS.gold : COLORS.mutedLight,
                  boxShadow: isActive ? SHADOWS.goldRing : 'none',
                }}
              />
              <div
                style={{
                  fontFamily,
                  fontSize: 14,
                  fontWeight: isActive ? 700 : 400,
                  color: isActive ? COLORS.gold : COLORS.mutedLight,
                }}
              >
                {tab.label}
              </div>
            </div>
          );
        })}
      </div>

      {/* End card */}
      <Sequence from={TAB_NAV_DURATION - TIMING.endCard}>
        <EndCard />
      </Sequence>
    </AbsoluteFill>
  );
};
