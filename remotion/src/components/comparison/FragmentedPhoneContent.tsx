import { Easing, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { loadFont } from '@remotion/google-fonts/Inter';
import { COLORS, SPRING } from '../../theme';
import {
  AiAssistantAppScreen,
  CalendarAppScreen,
  FilesAppScreen,
  HomeScreen,
  MessagesAppScreen,
  PhotosAppScreen,
  TodoAppScreen,
} from './FragmentedAppScreens';

const { fontFamily } = loadFont('normal', {
  weights: ['500', '600', '700'],
  subsets: ['latin'],
});

/**
 * Right-phone timeline phases (local frames from phone start).
 * Intentionally slower / more tedious than the left phone.
 */
export type FragmentPhase =
  | { kind: 'app'; app: string; label: string }
  | { kind: 'closing'; from: string; label: string }
  | { kind: 'home'; target: string; label: string; scroll: number }
  | { kind: 'opening'; app: string; label: string }
  | { kind: 'chaos'; label: string };

type PhaseSpan = { start: number; end: number; phase: FragmentPhase };

/** Build the friction-heavy app-switching schedule */
export const FRAGMENT_PHASES: PhaseSpan[] = [
  { start: 0, end: 48, phase: { kind: 'app', app: 'messages', label: 'Trip chat in Messages' } },
  { start: 48, end: 66, phase: { kind: 'closing', from: 'messages', label: 'Close Messages…' } },
  {
    start: 66,
    end: 108,
    phase: { kind: 'home', target: 'calendar', label: 'Find Calendar…', scroll: 20 },
  },
  { start: 108, end: 122, phase: { kind: 'opening', app: 'calendar', label: 'Open Calendar' } },
  { start: 122, end: 168, phase: { kind: 'app', app: 'calendar', label: 'Check itinerary' } },
  { start: 168, end: 186, phase: { kind: 'closing', from: 'calendar', label: 'Close Calendar…' } },
  {
    start: 186,
    end: 236,
    phase: { kind: 'home', target: 'ai', label: 'Scroll for AI app…', scroll: 55 },
  },
  { start: 236, end: 250, phase: { kind: 'opening', app: 'ai', label: 'Open Assistant' } },
  { start: 250, end: 300, phase: { kind: 'app', app: 'ai', label: 'Ask for help (no context)' } },
  { start: 300, end: 318, phase: { kind: 'closing', from: 'ai', label: 'Close Assistant…' } },
  {
    start: 318,
    end: 362,
    phase: { kind: 'home', target: 'photos', label: 'Find Photos…', scroll: 40 },
  },
  { start: 362, end: 376, phase: { kind: 'opening', app: 'photos', label: 'Open Photos' } },
  { start: 376, end: 422, phase: { kind: 'app', app: 'photos', label: 'Hunt for trip photos' } },
  { start: 422, end: 440, phase: { kind: 'closing', from: 'photos', label: 'Close Photos…' } },
  {
    start: 440,
    end: 484,
    phase: { kind: 'home', target: 'files', label: 'Find Files…', scroll: 70 },
  },
  { start: 484, end: 498, phase: { kind: 'opening', app: 'files', label: 'Open Files' } },
  { start: 498, end: 540, phase: { kind: 'app', app: 'files', label: 'Search documents' } },
  { start: 540, end: 558, phase: { kind: 'closing', from: 'files', label: 'Close Files…' } },
  {
    start: 558,
    end: 600,
    phase: { kind: 'home', target: 'todo', label: 'Find Reminders…', scroll: 90 },
  },
  { start: 600, end: 614, phase: { kind: 'opening', app: 'todo', label: 'Open Reminders' } },
  { start: 614, end: 660, phase: { kind: 'app', app: 'todo', label: 'Update tasks alone' } },
  { start: 660, end: 690, phase: { kind: 'chaos', label: 'Still switching apps…' } },
];

export function getFragmentPhaseAt(localFrame: number): PhaseSpan {
  for (let i = FRAGMENT_PHASES.length - 1; i >= 0; i--) {
    if (localFrame >= FRAGMENT_PHASES[i].start) {
      return FRAGMENT_PHASES[i];
    }
  }
  return FRAGMENT_PHASES[0];
}

const renderApp = (appId: string, delay: number) => {
  switch (appId) {
    case 'messages':
      return <MessagesAppScreen delay={delay} />;
    case 'calendar':
      return <CalendarAppScreen delay={delay} />;
    case 'ai':
      return <AiAssistantAppScreen delay={delay} />;
    case 'photos':
      return <PhotosAppScreen delay={delay} />;
    case 'files':
      return <FilesAppScreen delay={delay} />;
    case 'todo':
      return <TodoAppScreen delay={delay} />;
    default:
      return <MessagesAppScreen delay={delay} />;
  }
};

type FragmentedPhoneContentProps = {
  startFrame?: number;
  showScattered?: boolean;
};

/** Scattered icons final state for the right phone */
const ScatteredIcons: React.FC<{ local: number }> = ({ local }) => {
  const { fps } = useVideoConfig();
  const icons = [
    { emoji: '💬', x: 18, y: 70, rot: -12 },
    { emoji: '📅', x: 150, y: 50, rot: 8 },
    { emoji: '✨', x: 70, y: 160, rot: -6 },
    { emoji: '🖼️', x: 170, y: 180, rot: 14 },
    { emoji: '📁', x: 30, y: 280, rot: -18 },
    { emoji: '✅', x: 140, y: 300, rot: 10 },
    { emoji: '📝', x: 90, y: 220, rot: -4 },
    { emoji: '✉️', x: 200, y: 120, rot: 16 },
  ];

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        background: 'linear-gradient(180deg, #1a1020 0%, #0a0a12 100%)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: 16,
          left: 0,
          right: 0,
          textAlign: 'center',
          fontFamily,
          fontSize: 11,
          fontWeight: 700,
          color: '#ff6b6b',
        }}
      >
        Too many apps
      </div>
      {icons.map((icon, i) => {
        const p = spring({
          frame: local,
          fps,
          delay: 4 + i * 3,
          config: SPRING.bouncy,
        });
        const wobble = Math.sin((local + i * 20) * 0.08) * 3;
        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: icon.x,
              top: icon.y + wobble,
              width: 48,
              height: 48,
              borderRadius: 12,
              background: COLORS.surface,
              border: '1px solid #333',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 22,
              transform: `rotate(${icon.rot}deg) scale(${interpolate(p, [0, 1], [0.5, 1])})`,
              opacity: interpolate(p, [0, 1], [0, 1]),
              boxShadow: '0 8px 20px rgba(0,0,0,0.45)',
            }}
          >
            {icon.emoji}
          </div>
        );
      })}
    </div>
  );
};

/** Right phone: repetitive close → scroll → open friction */
export const FragmentedPhoneContent: React.FC<FragmentedPhoneContentProps> = ({
  startFrame = 0,
  showScattered = false,
}) => {
  const frame = useCurrentFrame();
  const local = Math.max(0, frame - startFrame);

  if (showScattered) {
    return <ScatteredIcons local={local} />;
  }

  const { start, end, phase } = getFragmentPhaseAt(local);
  const phaseLocal = local - start;
  const phaseDur = Math.max(1, end - start);

  let content: React.ReactNode = null;
  let overlayScale = 1;
  let overlayY = 0;
  let overlayOpacity = 1;

  if (phase.kind === 'app') {
    content = renderApp(phase.app, 0);
  } else if (phase.kind === 'closing') {
    const close = interpolate(phaseLocal, [0, phaseDur], [0, 1], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
      easing: Easing.in(Easing.cubic),
    });
    overlayScale = interpolate(close, [0, 1], [1, 0.55]);
    overlayY = interpolate(close, [0, 1], [0, 220]);
    overlayOpacity = interpolate(close, [0, 0.85, 1], [1, 0.5, 0]);
    content = (
      <>
        <div style={{ position: 'absolute', inset: 0 }}>
          <HomeScreen />
        </div>
        <div
          style={{
            position: 'absolute',
            inset: 0,
            transform: `translateY(${overlayY}px) scale(${overlayScale})`,
            opacity: overlayOpacity,
            transformOrigin: 'center bottom',
            borderRadius: 16,
            overflow: 'hidden',
            boxShadow: '0 10px 40px rgba(0,0,0,0.5)',
          }}
        >
          {renderApp(phase.from, 0)}
        </div>
      </>
    );
  } else if (phase.kind === 'home') {
    const scrollProgress = interpolate(phaseLocal, [0, phaseDur * 0.7], [0, 1], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
      easing: Easing.inOut(Easing.quad),
    });
    const scrollY = interpolate(scrollProgress, [0, 1], [0, phase.scroll]);
    const pulse =
      phaseLocal > phaseDur * 0.65 ? interpolate(Math.sin(phaseLocal * 0.45), [-1, 1], [0, 1]) : 0;
    content = <HomeScreen scrollY={scrollY} highlightId={phase.target} pulse={pulse} />;
  } else if (phase.kind === 'opening') {
    const open = interpolate(phaseLocal, [0, phaseDur], [0, 1], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
      easing: Easing.out(Easing.cubic),
    });
    content = (
      <>
        <div style={{ position: 'absolute', inset: 0 }}>
          <HomeScreen highlightId={phase.app} pulse={0.5} />
        </div>
        <div
          style={{
            position: 'absolute',
            inset: 0,
            transform: `scale(${interpolate(open, [0, 1], [0.4, 1])})`,
            opacity: interpolate(open, [0, 0.2, 1], [0, 0.7, 1]),
            transformOrigin: 'center center',
            overflow: 'hidden',
            borderRadius: interpolate(open, [0, 1], [24, 0]),
          }}
        >
          {renderApp(phase.app, 0)}
        </div>
      </>
    );
  } else if (phase.kind === 'chaos') {
    content = <ScatteredIcons local={phaseLocal} />;
  }

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative', overflow: 'hidden' }}>
      {content}

      {/* Friction caption chip */}
      <div
        style={{
          position: 'absolute',
          bottom: 10,
          left: 8,
          right: 8,
          zIndex: 30,
          background: 'rgba(20,10,10,0.88)',
          border: '1px solid rgba(255,100,100,0.35)',
          borderRadius: 10,
          padding: '5px 8px',
          textAlign: 'center',
        }}
      >
        <div style={{ fontFamily, fontSize: 9, fontWeight: 600, color: '#ff8a8a' }}>
          {phase.label}
        </div>
      </div>
    </div>
  );
};
