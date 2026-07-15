import { Easing, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { loadFont } from '@remotion/google-fonts/Inter';
import { SPRING } from '../../theme';
import {
  AiChatAppScreen,
  CalendarAppScreen,
  FilesAppScreen,
  type HomeAppId,
  IosHomeScreen,
  MessagesAppScreen,
  MicrosoftToDoScreen,
  NotesAppScreen,
  PhotosAppScreen,
  VenmoAppScreen,
  YelpAppScreen,
  renderHomeIcon,
} from './FragmentedAppScreens';

const { fontFamily } = loadFont('normal', {
  weights: ['500', '600', '700'],
  subsets: ['latin'],
});

export type FragmentPhase =
  | { kind: 'app'; app: string; label: string }
  | { kind: 'closing'; from: string; label: string }
  | { kind: 'home'; target: HomeAppId; label: string; scroll: number }
  | { kind: 'opening'; app: string; label: string }
  | { kind: 'chaos'; label: string };

type PhaseSpan = { start: number; end: number; phase: FragmentPhase };

/**
 * Maps each Chravel tab to a real iPhone app (+ Files extra):
 *   Chat → Messages
 *   Calendar → Calendar
 *   Concierge → ChatGPT
 *   Media → Photos
 *   Places → Yelp
 *   Polls → Notes
 *   Tasks → Microsoft To Do
 *   Payments → Venmo
 *   (+ Files between Photos and Yelp)
 *
 * Intentionally slower than the left phone's 8-tab swipe.
 */
export const FRAGMENT_PHASES: PhaseSpan[] = [
  // 1. Chat → Messages
  { start: 0, end: 38, phase: { kind: 'app', app: 'messages', label: 'Trip chat in Messages' } },
  { start: 38, end: 54, phase: { kind: 'closing', from: 'messages', label: 'Swipe up to Home…' } },
  // 2. Calendar
  {
    start: 54,
    end: 90,
    phase: { kind: 'home', target: 'calendar', label: 'Find Calendar…', scroll: 6 },
  },
  { start: 90, end: 102, phase: { kind: 'opening', app: 'calendar', label: 'Open Calendar' } },
  { start: 102, end: 140, phase: { kind: 'app', app: 'calendar', label: 'Apple Calendar' } },
  {
    start: 140,
    end: 156,
    phase: { kind: 'closing', from: 'calendar', label: 'Swipe up to Home…' },
  },
  // 3. Concierge → ChatGPT
  {
    start: 156,
    end: 196,
    phase: { kind: 'home', target: 'aichat', label: 'Find ChatGPT…', scroll: 14 },
  },
  { start: 196, end: 208, phase: { kind: 'opening', app: 'aichat', label: 'Open ChatGPT' } },
  { start: 208, end: 250, phase: { kind: 'app', app: 'aichat', label: 'AI with no trip context' } },
  { start: 250, end: 266, phase: { kind: 'closing', from: 'aichat', label: 'Swipe up to Home…' } },
  // 4. Media → Photos
  {
    start: 266,
    end: 304,
    phase: { kind: 'home', target: 'photos', label: 'Find Photos…', scroll: 4 },
  },
  { start: 304, end: 316, phase: { kind: 'opening', app: 'photos', label: 'Open Photos' } },
  { start: 316, end: 358, phase: { kind: 'app', app: 'photos', label: 'iCloud Photos' } },
  { start: 358, end: 374, phase: { kind: 'closing', from: 'photos', label: 'Swipe up to Home…' } },
  // Extra: Files
  {
    start: 374,
    end: 412,
    phase: { kind: 'home', target: 'files', label: 'Find Files…', scroll: 10 },
  },
  { start: 412, end: 424, phase: { kind: 'opening', app: 'files', label: 'Open Files' } },
  { start: 424, end: 462, phase: { kind: 'app', app: 'files', label: 'iCloud Drive / Files' } },
  { start: 462, end: 478, phase: { kind: 'closing', from: 'files', label: 'Swipe up to Home…' } },
  // 5. Places → Yelp
  {
    start: 478,
    end: 518,
    phase: { kind: 'home', target: 'yelp', label: 'Find Yelp…', scroll: 18 },
  },
  { start: 518, end: 530, phase: { kind: 'opening', app: 'yelp', label: 'Open Yelp' } },
  { start: 530, end: 572, phase: { kind: 'app', app: 'yelp', label: 'Yelp — places alone' } },
  { start: 572, end: 588, phase: { kind: 'closing', from: 'yelp', label: 'Swipe up to Home…' } },
  // 6. Polls → Notes
  {
    start: 588,
    end: 626,
    phase: { kind: 'home', target: 'notes', label: 'Find Notes…', scroll: 22 },
  },
  { start: 626, end: 638, phase: { kind: 'opening', app: 'notes', label: 'Open Notes' } },
  { start: 638, end: 678, phase: { kind: 'app', app: 'notes', label: 'Notes — no group voting' } },
  { start: 678, end: 694, phase: { kind: 'closing', from: 'notes', label: 'Swipe up to Home…' } },
  // 7. Tasks → Microsoft To Do
  {
    start: 694,
    end: 734,
    phase: { kind: 'home', target: 'todo', label: 'Find Microsoft To Do…', scroll: 30 },
  },
  { start: 734, end: 746, phase: { kind: 'opening', app: 'todo', label: 'Open Microsoft To Do' } },
  { start: 746, end: 788, phase: { kind: 'app', app: 'todo', label: 'Tasks only you can see' } },
  { start: 788, end: 804, phase: { kind: 'closing', from: 'todo', label: 'Swipe up to Home…' } },
  // 8. Payments → Venmo
  {
    start: 804,
    end: 844,
    phase: { kind: 'home', target: 'venmo', label: 'Find Venmo…', scroll: 36 },
  },
  { start: 844, end: 856, phase: { kind: 'opening', app: 'venmo', label: 'Open Venmo' } },
  {
    start: 856,
    end: 900,
    phase: { kind: 'app', app: 'venmo', label: 'Venmo — chase people one by one' },
  },
  { start: 900, end: 940, phase: { kind: 'chaos', label: 'Still switching apps…' } },
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
    case 'aichat':
      return <AiChatAppScreen delay={delay} />;
    case 'photos':
      return <PhotosAppScreen delay={delay} />;
    case 'files':
      return <FilesAppScreen delay={delay} />;
    case 'yelp':
      return <YelpAppScreen delay={delay} />;
    case 'notes':
      return <NotesAppScreen delay={delay} />;
    case 'todo':
      return <MicrosoftToDoScreen delay={delay} />;
    case 'venmo':
      return <VenmoAppScreen delay={delay} />;
    default:
      return <MessagesAppScreen delay={delay} />;
  }
};

const SCATTERED: Array<{ id: HomeAppId; x: number; y: number; rot: number }> = [
  { id: 'messages', x: 22, y: 68, rot: -14 },
  { id: 'calendar', x: 160, y: 48, rot: 9 },
  { id: 'aichat', x: 70, y: 145, rot: -7 },
  { id: 'photos', x: 175, y: 160, rot: 12 },
  { id: 'files', x: 28, y: 240, rot: -10 },
  { id: 'yelp', x: 150, y: 255, rot: 8 },
  { id: 'notes', x: 95, y: 330, rot: -4 },
  { id: 'todo', x: 200, y: 310, rot: 14 },
  { id: 'venmo', x: 55, y: 400, rot: -12 },
];

const ScatteredIcons: React.FC<{ local: number }> = ({ local }) => {
  const { fps } = useVideoConfig();

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        background:
          'radial-gradient(ellipse at 30% 20%, #3b1d5c 0%, transparent 50%), linear-gradient(180deg, #1a1028 0%, #0a0a12 100%)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: 52,
          left: 0,
          right: 0,
          textAlign: 'center',
          fontFamily,
          fontSize: 12,
          fontWeight: 700,
          color: '#ff6b6b',
        }}
      >
        Too many apps
      </div>
      {SCATTERED.map((icon, i) => {
        const p = spring({
          frame: local,
          fps,
          delay: 4 + i * 3,
          config: SPRING.bouncy,
        });
        const wobble = Math.sin((local + i * 20) * 0.08) * 3;
        return (
          <div
            key={icon.id}
            style={{
              position: 'absolute',
              left: icon.x,
              top: icon.y + wobble,
              transform: `rotate(${icon.rot}deg) scale(${interpolate(p, [0, 1], [0.5, 1])})`,
              opacity: interpolate(p, [0, 1], [0, 1]),
            }}
          >
            {renderHomeIcon(icon.id, { size: 46 })}
          </div>
        );
      })}
    </div>
  );
};

type FragmentedPhoneContentProps = {
  startFrame?: number;
  showScattered?: boolean;
};

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

  if (phase.kind === 'app') {
    content = renderApp(phase.app, 0);
  } else if (phase.kind === 'closing') {
    const close = interpolate(phaseLocal, [0, phaseDur], [0, 1], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
      easing: Easing.in(Easing.cubic),
    });
    content = (
      <>
        <div style={{ position: 'absolute', inset: 0 }}>
          <IosHomeScreen />
        </div>
        <div
          style={{
            position: 'absolute',
            inset: 0,
            transform: `translateY(${interpolate(close, [0, 1], [0, 240])}px) scale(${interpolate(close, [0, 1], [1, 0.52])})`,
            opacity: interpolate(close, [0, 0.85, 1], [1, 0.45, 0]),
            transformOrigin: 'center bottom',
            borderRadius: 20,
            overflow: 'hidden',
            boxShadow: '0 12px 40px rgba(0,0,0,0.55)',
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
    content = <IosHomeScreen scrollY={scrollY} highlightId={phase.target} pulse={pulse} />;
  } else if (phase.kind === 'opening') {
    const open = interpolate(phaseLocal, [0, phaseDur], [0, 1], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
      easing: Easing.out(Easing.cubic),
    });
    content = (
      <>
        <div style={{ position: 'absolute', inset: 0 }}>
          <IosHomeScreen highlightId={phase.app as HomeAppId} pulse={0.5} />
        </div>
        <div
          style={{
            position: 'absolute',
            inset: 0,
            transform: `scale(${interpolate(open, [0, 1], [0.38, 1])})`,
            opacity: interpolate(open, [0, 0.18, 1], [0, 0.75, 1]),
            transformOrigin: 'center center',
            overflow: 'hidden',
            borderRadius: interpolate(open, [0, 1], [28, 0]),
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
      <div
        style={{
          position: 'absolute',
          bottom: 14,
          left: 8,
          right: 8,
          zIndex: 30,
          background: 'rgba(20,10,10,0.9)',
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
