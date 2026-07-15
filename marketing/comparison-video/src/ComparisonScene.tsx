import React from 'react';
import { AbsoluteFill, interpolate, spring, useCurrentFrame } from 'remotion';
import { IPhoneFrame } from './IPhoneFrame';
import { ChravelScreen } from './left/ChravelScreen';
import { OldWayScreen } from './right/OldWayScreen';
import { TABS } from './left/tabs';
import {
  BORDER,
  FONT,
  FPS,
  GOLD_GRADIENT,
  GOLD_MID,
  GOLD_TEXT_GRADIENT,
  INK_2,
  INK_3,
  LEFT_CHIP_FRAMES,
  PHONE_H,
  PHONE_W,
  RIGHT_CHIP_FRAMES,
  SCENE_CONTENT_DELAY,
} from './theme';

const PHONE_TOP = 148;
const LEFT_CX = 490;
const RIGHT_CX = 1430;

export const SceneBackground: React.FC = () => (
  <AbsoluteFill>
    <AbsoluteFill
      style={{
        background:
          'radial-gradient(ellipse 120% 90% at 50% -10%, #17171c 0%, #0a0a0d 45%, #050506 100%)',
      }}
    />
    {/* Warm gold aura behind the Chravel phone */}
    <div
      style={{
        position: 'absolute',
        left: LEFT_CX - 430,
        top: 120,
        width: 860,
        height: 860,
        background: 'radial-gradient(circle, rgba(196,151,70,0.13) 0%, transparent 62%)',
      }}
    />
    {/* Cold gray wash behind the old-way phone */}
    <div
      style={{
        position: 'absolute',
        left: RIGHT_CX - 430,
        top: 120,
        width: 860,
        height: 860,
        background: 'radial-gradient(circle, rgba(120,126,145,0.10) 0%, transparent 62%)',
      }}
    />
    {/* Center divider */}
    <div
      style={{
        position: 'absolute',
        left: '50%',
        top: 120,
        bottom: 60,
        width: 1,
        background:
          'linear-gradient(180deg, transparent, rgba(255,255,255,0.09) 20%, rgba(255,255,255,0.09) 80%, transparent)',
      }}
    />
  </AbsoluteFill>
);

export const SideLabel: React.FC<{
  cx: number;
  gold?: boolean;
  text: string;
  appear: number;
}> = ({ cx, gold, text, appear }) => (
  <div
    style={{
      position: 'absolute',
      top: 58,
      left: cx - 420,
      width: 840,
      textAlign: 'center',
      opacity: appear,
      transform: `translateY(${(1 - appear) * -16}px)`,
    }}
  >
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 12,
        padding: '13px 30px',
        borderRadius: 999,
        border: gold ? '1px solid rgba(196,151,70,0.45)' : `1px solid ${BORDER}`,
        background: gold ? 'rgba(196,151,70,0.09)' : 'rgba(255,255,255,0.04)',
        boxShadow: gold ? '0 0 34px rgba(196,151,70,0.18)' : 'none',
      }}
    >
      {gold ? (
        <div
          style={{
            width: 10,
            height: 10,
            borderRadius: '50%',
            background: GOLD_GRADIENT,
            boxShadow: '0 0 10px rgba(232,175,72,0.8)',
          }}
        />
      ) : (
        <div
          style={{
            width: 10,
            height: 10,
            borderRadius: '50%',
            background: '#6d6d78',
          }}
        />
      )}
      <span
        style={{
          fontSize: 30,
          fontWeight: 800,
          letterSpacing: -0.4,
          ...(gold
            ? {
                backgroundImage: GOLD_TEXT_GRADIENT,
                WebkitBackgroundClip: 'text',
                backgroundClip: 'text',
                color: 'transparent',
              }
            : { color: INK_2 }),
        }}
      >
        {text}
      </span>
    </div>
  </div>
);

type ChipDef = { label: string; at: number };

const ChipRow: React.FC<{
  cx: number;
  chips: ChipDef[];
  gold?: boolean;
  frame: number;
}> = ({ cx, chips, gold, frame }) => (
  <div
    style={{
      position: 'absolute',
      top: PHONE_TOP + PHONE_H + 18,
      left: cx - 440,
      width: 880,
      display: 'flex',
      justifyContent: 'center',
    }}
  >
    {chips.map(chip => {
      const pop = spring({
        frame: frame - chip.at,
        fps: FPS,
        config: { damping: 15, stiffness: 190 },
        durationInFrames: 20,
      });
      const shown = frame >= chip.at;
      const reveal = shown ? pop : 0;
      return (
        <div
          key={chip.label}
          style={{
            // Collapse unrevealed chips so the row stays centered and
            // grows smoothly as each chip pops in
            maxWidth: reveal * 230,
            marginLeft: reveal * 4.5,
            marginRight: reveal * 4.5,
            overflow: 'hidden',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: `7px ${reveal * 13}px`,
            borderRadius: 999,
            border: gold ? '1px solid rgba(196,151,70,0.5)' : '1px solid rgba(255,255,255,0.14)',
            background: gold ? 'rgba(196,151,70,0.13)' : 'rgba(255,255,255,0.05)',
            opacity: reveal,
            transform: `scale(${0.7 + 0.3 * reveal})`,
            whiteSpace: 'nowrap',
          }}
        >
          {gold ? (
            <svg
              width="13"
              height="13"
              viewBox="0 0 24 24"
              fill="none"
              stroke={GOLD_MID}
              strokeWidth="3.4"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M4 13l5 5L20 6" />
            </svg>
          ) : (
            <svg
              width="13"
              height="13"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#8a8a94"
              strokeWidth="2.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M17 2v6h-6M7 22v-6h6" />
              <path d="M20.5 8A9 9 0 0 0 5 5.3L3 8M3.5 16A9 9 0 0 0 19 18.7L21 16" />
            </svg>
          )}
          <span
            style={{
              fontSize: 16.5,
              fontWeight: 600,
              color: gold ? '#f0d9a8' : INK_3,
            }}
          >
            {chip.label}
          </span>
        </div>
      );
    })}
  </div>
);

const RIGHT_APP_LABELS = [
  'Messages',
  'Calendar',
  'AI Chat',
  'Photos',
  'Files',
  'To-Do',
  'Messages… again',
];

export const ComparisonScene: React.FC = () => {
  const frame = useCurrentFrame();

  const labelIn = spring({
    frame,
    fps: FPS,
    config: { damping: 200 },
    durationInFrames: 22,
  });
  const phoneIn = spring({
    frame: frame - 6,
    fps: FPS,
    config: { damping: 26, stiffness: 130 },
    durationInFrames: 34,
  });

  const leftChips: ChipDef[] = TABS.map((t, i) => ({
    label: t.label,
    at: LEFT_CHIP_FRAMES[i],
  }));
  const rightChips: ChipDef[] = RIGHT_APP_LABELS.map((label, i) => ({
    label,
    at: RIGHT_CHIP_FRAMES[i],
  }));

  return (
    <AbsoluteFill style={{ fontFamily: FONT }}>
      <SceneBackground />

      <SideLabel cx={LEFT_CX} gold text="ChravelApp: One Trip Hub" appear={labelIn} />
      <SideLabel cx={RIGHT_CX} text="Old Way: Too Many Apps" appear={labelIn} />

      {/* Left phone */}
      <div
        style={{
          position: 'absolute',
          left: LEFT_CX - PHONE_W / 2,
          top: PHONE_TOP,
          opacity: phoneIn,
          transform: `translateY(${(1 - phoneIn) * 60}px)`,
        }}
      >
        <IPhoneFrame>
          <ChravelScreen frame={Math.max(0, frame - SCENE_CONTENT_DELAY)} />
        </IPhoneFrame>
      </div>

      {/* Right phone */}
      <div
        style={{
          position: 'absolute',
          left: RIGHT_CX - PHONE_W / 2,
          top: PHONE_TOP,
          opacity: phoneIn,
          transform: `translateY(${(1 - phoneIn) * 60}px)`,
        }}
      >
        <IPhoneFrame lightScreen>
          <OldWayScreen frame={Math.max(0, frame - SCENE_CONTENT_DELAY)} />
        </IPhoneFrame>
      </div>

      <ChipRow cx={LEFT_CX} chips={leftChips} gold frame={frame - SCENE_CONTENT_DELAY} />
      <ChipRow cx={RIGHT_CX} chips={rightChips} frame={frame - SCENE_CONTENT_DELAY} />

      {/* Bottom captions fade in once the gap is obvious */}
      <div
        style={{
          position: 'absolute',
          bottom: 18,
          left: 0,
          right: 0,
          textAlign: 'center',
          fontSize: 21,
          fontWeight: 500,
          color: INK_3,
          opacity: interpolate(frame, [640, 690], [0, 1], {
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
          }),
        }}
      >
        Seven trip tools in seconds — while the old way is still switching apps.
      </div>
    </AbsoluteFill>
  );
};

export { PHONE_TOP, LEFT_CX, RIGHT_CX };
