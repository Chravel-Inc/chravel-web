import { Easing, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { loadFont } from '@remotion/google-fonts/Inter';
import { SPRING } from '../../theme';
import {
  CalendarAppScreen,
  FilesAppScreen,
  type HomeAppId,
  IosHomeScreen,
  MailAppScreen,
  MessagesAppScreen,
  MicrosoftToDoScreen,
  PhotosAppScreen,
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
 * Friction-heavy timeline using real-looking iOS / Microsoft apps.
 * Intentionally slower than the left Chravel swipe pace.
 */
export const FRAGMENT_PHASES: PhaseSpan[] = [
  { start: 0, end: 42, phase: { kind: 'app', app: 'messages', label: 'Trip chat in Messages' } },
  { start: 42, end: 60, phase: { kind: 'closing', from: 'messages', label: 'Swipe up to Home…' } },
  {
    start: 60,
    end: 100,
    phase: { kind: 'home', target: 'calendar', label: 'Find Calendar…', scroll: 8 },
  },
  { start: 100, end: 114, phase: { kind: 'opening', app: 'calendar', label: 'Open Calendar' } },
  { start: 114, end: 156, phase: { kind: 'app', app: 'calendar', label: 'Apple Calendar' } },
  {
    start: 156,
    end: 174,
    phase: { kind: 'closing', from: 'calendar', label: 'Swipe up to Home…' },
  },
  {
    start: 174,
    end: 218,
    phase: { kind: 'home', target: 'photos', label: 'Find Photos…', scroll: 18 },
  },
  { start: 218, end: 232, phase: { kind: 'opening', app: 'photos', label: 'Open Photos' } },
  { start: 232, end: 274, phase: { kind: 'app', app: 'photos', label: 'iCloud Photos' } },
  { start: 274, end: 292, phase: { kind: 'closing', from: 'photos', label: 'Swipe up to Home…' } },
  {
    start: 292,
    end: 336,
    phase: { kind: 'home', target: 'files', label: 'Find Files…', scroll: 28 },
  },
  { start: 336, end: 350, phase: { kind: 'opening', app: 'files', label: 'Open Files' } },
  { start: 350, end: 392, phase: { kind: 'app', app: 'files', label: 'iCloud Drive / Files' } },
  { start: 392, end: 410, phase: { kind: 'closing', from: 'files', label: 'Swipe up to Home…' } },
  {
    start: 410,
    end: 452,
    phase: { kind: 'home', target: 'mail', label: 'Find Mail…', scroll: 36 },
  },
  { start: 452, end: 466, phase: { kind: 'opening', app: 'mail', label: 'Open Mail' } },
  { start: 466, end: 510, phase: { kind: 'app', app: 'mail', label: 'Hunt confirmation emails' } },
  { start: 510, end: 528, phase: { kind: 'closing', from: 'mail', label: 'Swipe up to Home…' } },
  {
    start: 528,
    end: 572,
    phase: { kind: 'home', target: 'todo', label: 'Find Microsoft To Do…', scroll: 48 },
  },
  { start: 572, end: 586, phase: { kind: 'opening', app: 'todo', label: 'Open Microsoft To Do' } },
  { start: 586, end: 640, phase: { kind: 'app', app: 'todo', label: 'Tasks only you can see' } },
  { start: 640, end: 690, phase: { kind: 'chaos', label: 'Still switching apps…' } },
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
    case 'photos':
      return <PhotosAppScreen delay={delay} />;
    case 'files':
      return <FilesAppScreen delay={delay} />;
    case 'mail':
      return <MailAppScreen delay={delay} />;
    case 'todo':
      return <MicrosoftToDoScreen delay={delay} />;
    default:
      return <MessagesAppScreen delay={delay} />;
  }
};

const SCATTERED: Array<{ id: HomeAppId; x: number; y: number; rot: number }> = [
  { id: 'messages', x: 22, y: 70, rot: -14 },
  { id: 'calendar', x: 160, y: 48, rot: 9 },
  { id: 'photos', x: 70, y: 155, rot: -7 },
  { id: 'files', x: 175, y: 175, rot: 12 },
  { id: 'mail', x: 28, y: 270, rot: -16 },
  { id: 'todo', x: 150, y: 295, rot: 8 },
  { id: 'notes', x: 95, y: 220, rot: -3 },
  { id: 'maps', x: 200, y: 115, rot: 15 },
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
            {renderHomeIcon(icon.id, { size: 48 })}
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

/** Right phone: realistic iOS close → scroll → open friction */
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
    const overlayScale = interpolate(close, [0, 1], [1, 0.52]);
    const overlayY = interpolate(close, [0, 1], [0, 240]);
    const overlayOpacity = interpolate(close, [0, 0.85, 1], [1, 0.45, 0]);
    content = (
      <>
        <div style={{ position: 'absolute', inset: 0 }}>
          <IosHomeScreen />
        </div>
        <div
          style={{
            position: 'absolute',
            inset: 0,
            transform: `translateY(${overlayY}px) scale(${overlayScale})`,
            opacity: overlayOpacity,
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
