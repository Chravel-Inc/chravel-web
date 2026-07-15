import React from 'react';
import { AbsoluteFill, interpolate, spring, useCurrentFrame } from 'remotion';
import { LEFT_CX, RIGHT_CX, PHONE_TOP, SceneBackground, SideLabel } from './ComparisonScene';
import { IPhoneFrame, StatusBar } from './IPhoneFrame';
import { ChravelScreen } from './left/ChravelScreen';
import { AppIcon, APP_ICONS, AppKind, DECOYS } from './right/apps';
import { FONT, FPS, GOLD_MID, INK_2, INK_3, PHONE_H, PHONE_W } from './theme';

type Scattered = {
  kind?: AppKind;
  decoy?: number;
  x: number;
  y: number;
  rot: number;
  size: number;
  badge?: number;
};

// Hand-placed chaos: trip apps drowning among everything else
const SCATTER: Scattered[] = [
  { kind: 'messages', x: 44, y: 96, rot: -9, size: 62, badge: 12 },
  { decoy: 1, x: 196, y: 74, rot: 7, size: 54, badge: 47 },
  { kind: 'calendar', x: 262, y: 168, rot: 11, size: 58, badge: 2 },
  { decoy: 0, x: 118, y: 208, rot: -5, size: 50 },
  { kind: 'aichat', x: 38, y: 300, rot: 8, size: 56, badge: 1 },
  { decoy: 3, x: 232, y: 306, rot: -12, size: 52 },
  { kind: 'photos', x: 138, y: 372, rot: 5, size: 62, badge: 4 },
  { decoy: 9, x: 40, y: 452, rot: -7, size: 50 },
  { kind: 'files', x: 250, y: 452, rot: 9, size: 58, badge: 1 },
  { decoy: 5, x: 148, y: 520, rot: -10, size: 52 },
  { kind: 'todo', x: 60, y: 578, rot: 6, size: 58, badge: 3 },
  { decoy: 6, x: 246, y: 588, rot: -6, size: 48 },
];

const ScatteredScreen: React.FC<{ localFrame: number }> = ({ localFrame }) => (
  <div
    style={{
      width: '100%',
      height: '100%',
      background: 'linear-gradient(160deg, #30354d 0%, #1e2233 38%, #232030 65%, #3a2f3b 100%)',
      position: 'relative',
      overflow: 'hidden',
    }}
  >
    <StatusBar />
    {SCATTER.map((s, i) => {
      const pop = spring({
        frame: Math.max(0, localFrame - 6 - i * 2),
        fps: FPS,
        config: { damping: 15, stiffness: 170 },
        durationInFrames: 22,
      });
      const spec = s.kind ? APP_ICONS[s.kind] : DECOYS[s.decoy ?? 0];
      return (
        <div
          key={i}
          style={{
            position: 'absolute',
            left: s.x,
            top: s.y,
            transform: `rotate(${s.rot}deg) scale(${0.5 + 0.5 * pop})`,
            opacity: pop,
          }}
        >
          <AppIcon spec={spec} size={s.size} badge={s.badge} />
        </div>
      );
    })}
    <div
      style={{
        position: 'absolute',
        bottom: 42,
        left: 0,
        right: 0,
        textAlign: 'center',
        color: 'rgba(255,255,255,0.85)',
        fontSize: 14,
        fontWeight: 600,
        textShadow: '0 1px 4px rgba(0,0,0,0.6)',
        opacity: interpolate(localFrame, [40, 58], [0, 1], {
          extrapolateLeft: 'clamp',
          extrapolateRight: 'clamp',
        }),
      }}
    >
      12 apps · 0 shared plans
    </div>
  </div>
);

export const FinalFrame: React.FC = () => {
  const frame = useCurrentFrame();

  const subIn = spring({
    frame: frame - 30,
    fps: FPS,
    config: { damping: 200 },
    durationInFrames: 24,
  });

  return (
    <AbsoluteFill style={{ fontFamily: FONT }}>
      <SceneBackground />
      <SideLabel cx={LEFT_CX} gold text="ChravelApp: One Trip Hub" appear={1} />
      <SideLabel cx={RIGHT_CX} text="Old Way: Too Many Apps" appear={1} />

      <div
        style={{
          position: 'absolute',
          left: LEFT_CX - PHONE_W / 2,
          top: PHONE_TOP,
        }}
      >
        <IPhoneFrame>
          <ChravelScreen frame={frame} overviewOnly />
        </IPhoneFrame>
      </div>

      <div
        style={{
          position: 'absolute',
          left: RIGHT_CX - PHONE_W / 2,
          top: PHONE_TOP,
        }}
      >
        <IPhoneFrame>
          <ScatteredScreen localFrame={frame} />
        </IPhoneFrame>
      </div>

      {/* Verdict captions */}
      <div
        style={{
          position: 'absolute',
          top: PHONE_TOP + PHONE_H + 26,
          left: LEFT_CX - 420,
          width: 840,
          textAlign: 'center',
          fontSize: 25,
          fontWeight: 700,
          color: GOLD_MID,
          opacity: subIn,
          transform: `translateY(${(1 - subIn) * 14}px)`,
        }}
      >
        Everything for the trip — together.
      </div>
      <div
        style={{
          position: 'absolute',
          top: PHONE_TOP + PHONE_H + 26,
          left: RIGHT_CX - 420,
          width: 840,
          textAlign: 'center',
          fontSize: 25,
          fontWeight: 600,
          color: INK_3,
          opacity: subIn,
          transform: `translateY(${(1 - subIn) * 14}px)`,
        }}
      >
        Every app — disconnected.
      </div>

      <div
        style={{
          position: 'absolute',
          bottom: 18,
          left: 0,
          right: 0,
          textAlign: 'center',
          fontSize: 20,
          fontWeight: 500,
          color: INK_2,
          opacity: interpolate(frame, [70, 100], [0, 1], {
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
          }),
        }}
      >
        Same trip. One app — or twelve.
      </div>
    </AbsoluteFill>
  );
};
