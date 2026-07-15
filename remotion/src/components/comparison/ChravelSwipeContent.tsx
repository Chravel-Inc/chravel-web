import { Easing, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { loadFont } from '@remotion/google-fonts/Inter';
import { COLORS, SPRING } from '../../theme';
import { ChatScreen } from '../mockscreens/ChatScreen';
import { CalendarScreen } from '../mockscreens/CalendarScreen';
import { ConciergeScreen } from '../mockscreens/ConciergeScreen';
import { MediaScreen } from '../mockscreens/MediaScreen';
import { PollsScreen } from '../mockscreens/PollsScreen';
import { TasksScreen } from '../mockscreens/TasksScreen';
import { PlacesScreen } from '../mockscreens/PlacesScreen';
import { FilesNotesScreen } from './FilesNotesScreen';

const { fontFamily } = loadFont('normal', {
  weights: ['600', '700'],
  subsets: ['latin'],
});

export const CHRAVEL_TABS = [
  { id: 'chat', label: 'Chat' },
  { id: 'calendar', label: 'Calendar' },
  { id: 'concierge', label: 'Concierge' },
  { id: 'media', label: 'Media' },
  { id: 'polls', label: 'Polls' },
  { id: 'tasks', label: 'Tasks' },
  { id: 'files', label: 'Files' },
  { id: 'places', label: 'Places' },
] as const;

/** Frames each tab is held before the next swipe (smooth & fast) */
export const CHRAVEL_HOLD_FRAMES = 26;
/** Frames spent mid-swipe between tabs */
export const CHRAVEL_SWIPE_FRAMES = 10;
export const CHRAVEL_CYCLE_FRAMES = CHRAVEL_HOLD_FRAMES + CHRAVEL_SWIPE_FRAMES;

type ChravelSwipeContentProps = {
  /** Global frame when this phone content becomes active */
  startFrame?: number;
  /** When true, show a compact all-tabs overview instead of swiping */
  showOverview?: boolean;
};

const renderTab = (tabId: string, delay: number) => {
  switch (tabId) {
    case 'chat':
      return <ChatScreen animationDelay={delay} />;
    case 'calendar':
      return <CalendarScreen animationDelay={delay} />;
    case 'concierge':
      return <ConciergeScreen animationDelay={delay} />;
    case 'media':
      return <MediaScreen animationDelay={delay} />;
    case 'polls':
      return <PollsScreen animationDelay={delay} />;
    case 'tasks':
      return <TasksScreen animationDelay={delay} />;
    case 'files':
      return <FilesNotesScreen animationDelay={delay} />;
    case 'places':
      return <PlacesScreen animationDelay={delay} />;
    default:
      return <ChatScreen animationDelay={delay} />;
  }
};

/** Horizontal swipe through Chravel trip tabs — calm, effortless motion */
export const ChravelSwipeContent: React.FC<ChravelSwipeContentProps> = ({
  startFrame = 0,
  showOverview = false,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const local = Math.max(0, frame - startFrame);

  if (showOverview) {
    const entrance = spring({ frame: local, fps, config: SPRING.smooth });
    return (
      <div
        style={{
          width: '100%',
          height: '100%',
          background: COLORS.background,
          padding: 12,
          opacity: interpolate(entrance, [0, 1], [0, 1]),
        }}
      >
        <div
          style={{
            fontFamily,
            fontSize: 12,
            fontWeight: 700,
            color: COLORS.white,
            marginBottom: 4,
          }}
        >
          Bali Trip 🌴
        </div>
        <div
          style={{
            fontFamily,
            fontSize: 9,
            color: COLORS.gold,
            marginBottom: 12,
          }}
        >
          Everything in one hub
        </div>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 8,
          }}
        >
          {CHRAVEL_TABS.map((tab, i) => {
            const p = spring({
              frame: local,
              fps,
              delay: 4 + i * 3,
              config: SPRING.snappy,
            });
            return (
              <div
                key={tab.id}
                style={{
                  background: COLORS.surface,
                  border: `1px solid ${COLORS.gold}30`,
                  borderRadius: 10,
                  padding: '10px 8px',
                  textAlign: 'center',
                  opacity: interpolate(p, [0, 1], [0, 1]),
                  transform: `scale(${interpolate(p, [0, 1], [0.9, 1])})`,
                }}
              >
                <div style={{ fontFamily, fontSize: 11, fontWeight: 700, color: COLORS.gold }}>
                  {tab.label}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  const tabCount = CHRAVEL_TABS.length;
  const cycleIndex = Math.min(tabCount - 1, Math.floor(local / CHRAVEL_CYCLE_FRAMES));
  const cycleLocal = local - cycleIndex * CHRAVEL_CYCLE_FRAMES;
  const isSwiping = cycleLocal >= CHRAVEL_HOLD_FRAMES && cycleIndex < tabCount - 1;
  const swipeProgress = isSwiping
    ? interpolate(cycleLocal, [CHRAVEL_HOLD_FRAMES, CHRAVEL_CYCLE_FRAMES], [0, 1], {
        extrapolateLeft: 'clamp',
        extrapolateRight: 'clamp',
        easing: Easing.inOut(Easing.cubic),
      })
    : 0;

  const fromIndex = cycleIndex;
  const toIndex = Math.min(tabCount - 1, cycleIndex + (isSwiping ? 1 : 0));
  const translateX = -(fromIndex + swipeProgress) * 100;

  const activeLabelIndex = swipeProgress > 0.5 ? toIndex : fromIndex;
  const labelPulse = spring({
    frame: local - activeLabelIndex * CHRAVEL_CYCLE_FRAMES,
    fps,
    config: SPRING.snappy,
  });

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative', overflow: 'hidden' }}>
      {/* Floating tab chip so viewers instantly know the section */}
      <div
        style={{
          position: 'absolute',
          top: 6,
          left: '50%',
          transform: `translateX(-50%) translateY(${interpolate(labelPulse, [0, 1], [-6, 0])}px)`,
          zIndex: 20,
          background: `${COLORS.surface}ee`,
          border: `1px solid ${COLORS.gold}50`,
          borderRadius: 12,
          padding: '3px 10px',
          opacity: interpolate(labelPulse, [0, 1], [0.4, 1]),
          pointerEvents: 'none',
        }}
      >
        <div style={{ fontFamily, fontSize: 9, fontWeight: 700, color: COLORS.gold }}>
          {CHRAVEL_TABS[activeLabelIndex].label}
        </div>
      </div>

      <div
        style={{
          display: 'flex',
          width: `${tabCount * 100}%`,
          height: '100%',
          transform: `translateX(${translateX / tabCount}%)`,
        }}
      >
        {CHRAVEL_TABS.map((tab, i) => (
          <div
            key={tab.id}
            style={{
              width: `${100 / tabCount}%`,
              height: '100%',
              flexShrink: 0,
            }}
          >
            {renderTab(tab.id, i * CHRAVEL_CYCLE_FRAMES)}
          </div>
        ))}
      </div>
    </div>
  );
};

/** Derive which Chravel tab label is active at a given local frame */
export function getChravelTabAtFrame(localFrame: number): string {
  const idx = Math.min(
    CHRAVEL_TABS.length - 1,
    Math.floor(Math.max(0, localFrame) / CHRAVEL_CYCLE_FRAMES),
  );
  return CHRAVEL_TABS[idx].label;
}
