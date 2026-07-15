import {
  Easing,
  Img,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import { loadFont } from '@remotion/google-fonts/Inter';
import { COLORS, SPRING } from '../../theme';

const { fontFamily } = loadFont('normal', {
  weights: ['600', '700'],
  subsets: ['latin'],
});

/**
 * Real ChravelApp mobile captures from remotion/public/captures/mobile/
 * (Playwright screenshots of the live demo UI — not mock DOM).
 */
export const CHRAVEL_TABS = [
  { id: 'chat', label: 'Chat', src: 'captures/mobile/m-chat.png' },
  { id: 'calendar', label: 'Calendar', src: 'captures/mobile/m-calendar.png' },
  { id: 'concierge', label: 'Concierge', src: 'captures/mobile/m-concierge.png' },
  { id: 'media', label: 'Media', src: 'captures/mobile/m-media.png' },
  { id: 'polls', label: 'Polls', src: 'captures/mobile/m-polls.png' },
  { id: 'tasks', label: 'Tasks', src: 'captures/mobile/m-tasks.png' },
  { id: 'places', label: 'Places', src: 'captures/mobile/m-places.png' },
  { id: 'payments', label: 'Payments', src: 'captures/mobile/m-payments.png' },
] as const;

export const CHRAVEL_HOLD_FRAMES = 28;
export const CHRAVEL_SWIPE_FRAMES = 12;
export const CHRAVEL_CYCLE_FRAMES = CHRAVEL_HOLD_FRAMES + CHRAVEL_SWIPE_FRAMES;

type ChravelSwipeContentProps = {
  startFrame?: number;
  showOverview?: boolean;
};

/** Horizontal swipe through REAL Chravel trip tab screenshots */
export const ChravelSwipeContent: React.FC<ChravelSwipeContentProps> = ({
  startFrame = 0,
  showOverview = false,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const local = Math.max(0, frame - startFrame);

  if (showOverview) {
    const entrance = spring({ frame: local, fps, config: SPRING.smooth });
    // Finale: show the real trip dashboard as the "everything together" hub
    return (
      <div
        style={{
          width: '100%',
          height: '100%',
          background: '#000',
          opacity: interpolate(entrance, [0, 1], [0, 1]),
          position: 'relative',
        }}
      >
        <Img
          src={staticFile('captures/mobile/m-dashboard.png')}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            objectPosition: '50% 0%',
            display: 'block',
          }}
        />
        {/* Soft overlay listing the connected tabs */}
        <div
          style={{
            position: 'absolute',
            left: 10,
            right: 10,
            bottom: 28,
            background: 'rgba(0,0,0,0.72)',
            border: `1px solid ${COLORS.gold}40`,
            borderRadius: 14,
            padding: '10px 10px 12px',
            backdropFilter: 'blur(8px)',
          }}
        >
          <div
            style={{
              fontFamily,
              fontSize: 10,
              fontWeight: 700,
              color: COLORS.gold,
              marginBottom: 8,
              textAlign: 'center',
            }}
          >
            All trip tools in one app
          </div>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr 1fr 1fr',
              gap: 5,
            }}
          >
            {CHRAVEL_TABS.map((tab, i) => {
              const p = spring({
                frame: local,
                fps,
                delay: 6 + i * 2,
                config: SPRING.snappy,
              });
              return (
                <div
                  key={tab.id}
                  style={{
                    background: COLORS.surface,
                    borderRadius: 8,
                    padding: '6px 2px',
                    textAlign: 'center',
                    opacity: interpolate(p, [0, 1], [0, 1]),
                    transform: `scale(${interpolate(p, [0, 1], [0.85, 1])})`,
                    border: `1px solid ${COLORS.gold}28`,
                  }}
                >
                  <div style={{ fontFamily, fontSize: 8, fontWeight: 700, color: COLORS.gold }}>
                    {tab.label}
                  </div>
                </div>
              );
            })}
          </div>
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

  const translatePct = -((cycleIndex + swipeProgress) * (100 / tabCount));

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative', overflow: 'hidden' }}>
      <div
        style={{
          display: 'flex',
          width: `${tabCount * 100}%`,
          height: '100%',
          transform: `translateX(${translatePct}%)`,
        }}
      >
        {CHRAVEL_TABS.map(tab => (
          <div
            key={tab.id}
            style={{
              width: `${100 / tabCount}%`,
              height: '100%',
              flexShrink: 0,
              background: '#000',
            }}
          >
            <Img
              src={staticFile(tab.src)}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                objectPosition: '50% 0%',
                display: 'block',
              }}
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export function getChravelTabAtFrame(localFrame: number): string {
  const idx = Math.min(
    CHRAVEL_TABS.length - 1,
    Math.floor(Math.max(0, localFrame) / CHRAVEL_CYCLE_FRAMES),
  );
  return CHRAVEL_TABS[idx].label;
}
