import React from 'react';
import { interpolate, spring } from 'remotion';
import {
  FPS,
  R_CLOSE,
  R_FIRST_CLOSE,
  R_HOLD,
  R_HOME,
  R_OPEN,
  R_SWIPE_GAP,
  R_TAP,
  R_TRANSITION,
  SCREEN_H,
  SCREEN_W,
  rightTransitionStart,
} from '../theme';
import {
  AIChatApp,
  AppKind,
  CalendarApp,
  FilesApp,
  HomeScreen,
  MessagesApp,
  PhotosApp,
  TodoApp,
  targetIconCenter,
} from './apps';

// The gauntlet: which app is open at each step
const APP_ORDER: AppKind[] = [
  'messages',
  'calendar',
  'aichat',
  'photos',
  'files',
  'todo',
  'messages', // …and back to Messages. Again.
];

const renderApp = (index: number, localFrame: number): React.ReactNode => {
  const kind = APP_ORDER[index];
  switch (kind) {
    case 'messages':
      return <MessagesApp localFrame={localFrame} revisit={index === 6} />;
    case 'calendar':
      return <CalendarApp localFrame={localFrame} />;
    case 'aichat':
      return <AIChatApp localFrame={localFrame} />;
    case 'photos':
      return <PhotosApp localFrame={localFrame} />;
    case 'files':
      return <FilesApp localFrame={localFrame} />;
    case 'todo':
      return <TodoApp localFrame={localFrame} />;
  }
};

const TouchDot: React.FC<{ x: number; y: number; opacity: number }> = ({ x, y, opacity }) => (
  <div
    style={{
      position: 'absolute',
      left: x - 17,
      top: y - 17,
      width: 34,
      height: 34,
      borderRadius: '50%',
      background: 'rgba(255,255,255,0.55)',
      boxShadow: '0 0 16px rgba(255,255,255,0.5)',
      opacity,
      zIndex: 40,
    }}
  />
);

export const OldWayScreen: React.FC<{ frame: number }> = ({ frame }) => {
  // Before the first close: Messages, full screen
  if (frame < R_FIRST_CLOSE) {
    return <>{renderApp(0, frame)}</>;
  }

  const i = Math.min(5, Math.floor((frame - R_FIRST_CLOSE) / (R_TRANSITION + R_HOLD)));
  const t = frame - rightTransitionStart(i);

  // Holding the app that transition i opened
  if (t >= R_TRANSITION) {
    return <>{renderApp(i + 1, t - R_TRANSITION)}</>;
  }

  // ---- Mid-transition: closing app -> home page 1 -> swipe -> tap -> zoom open ----
  const nextKind = APP_ORDER[i + 1];

  const closeP = spring({
    frame: t,
    fps: FPS,
    config: { damping: 200 },
    durationInFrames: R_CLOSE,
  });

  const swipeStart = R_CLOSE + R_SWIPE_GAP;
  const pageOffset = spring({
    frame: t - swipeStart,
    fps: FPS,
    config: { damping: 200 },
    durationInFrames: 16,
  });

  const tapStart = R_CLOSE + R_HOME;
  const tapProgress = interpolate(t, [tapStart, tapStart + 5, tapStart + R_TAP], [0, 1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const openStart = tapStart + R_TAP;
  const openP = spring({
    frame: t - openStart,
    fps: FPS,
    config: { damping: 200 },
    durationInFrames: R_OPEN,
  });

  const icon = targetIconCenter(nextKind);

  // Touch dots: swipe-up, page swipe, tap
  const dots: Array<{ x: number; y: number; o: number }> = [];
  if (t <= 18) {
    dots.push({
      x: SCREEN_W / 2,
      y: interpolate(t, [0, 16], [SCREEN_H - 60, SCREEN_H - 320], {
        extrapolateRight: 'clamp',
      }),
      o: interpolate(t, [0, 4, 16], [0, 0.9, 0], {
        extrapolateLeft: 'clamp',
        extrapolateRight: 'clamp',
      }),
    });
  }
  if (t >= swipeStart - 4 && t <= swipeStart + 16) {
    dots.push({
      x: interpolate(t, [swipeStart - 4, swipeStart + 14], [SCREEN_W - 62, 58]),
      y: SCREEN_H * 0.45,
      o: interpolate(t, [swipeStart - 4, swipeStart + 2, swipeStart + 14], [0, 0.9, 0], {
        extrapolateLeft: 'clamp',
        extrapolateRight: 'clamp',
      }),
    });
  }
  if (tapProgress > 0) {
    dots.push({ x: icon.x, y: icon.y, o: tapProgress * 0.9 });
  }

  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
      {/* Home screen beneath, zooming in as the app closes */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          transform: `scale(${0.9 + 0.1 * closeP})`,
          opacity: interpolate(closeP, [0, 0.35], [0, 1], {
            extrapolateRight: 'clamp',
          }),
        }}
      >
        <HomeScreen pageOffset={pageOffset} tapApp={nextKind} tapProgress={tapProgress} />
      </div>

      {/* Closing app card flying up */}
      {t < R_CLOSE + 6 ? (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            transform: `translateY(${-closeP * 310}px) scale(${1 - 0.55 * closeP})`,
            opacity: interpolate(t, [10, R_CLOSE + 2], [1, 0], {
              extrapolateLeft: 'clamp',
              extrapolateRight: 'clamp',
            }),
            borderRadius: 14 + 30 * closeP,
            overflow: 'hidden',
            boxShadow: '0 24px 60px rgba(0,0,0,0.45)',
          }}
        >
          {renderApp(i, 999)}
        </div>
      ) : null}

      {/* Opening app zooming out of its icon */}
      {t >= openStart - 1 ? (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            transformOrigin: `${icon.x}px ${icon.y}px`,
            transform: `scale(${0.12 + 0.88 * openP})`,
            opacity: interpolate(openP, [0, 0.3], [0, 1], {
              extrapolateRight: 'clamp',
            }),
            borderRadius: (1 - openP) * 44,
            overflow: 'hidden',
          }}
        >
          {renderApp(i + 1, 0)}
        </div>
      ) : null}

      {dots.map((d, di) => (
        <TouchDot key={di} x={d.x} y={d.y} opacity={d.o} />
      ))}
    </div>
  );
};
