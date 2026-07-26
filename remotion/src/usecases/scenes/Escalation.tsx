import React from 'react';
import { AbsoluteFill, Sequence, interpolate, useCurrentFrame, useVideoConfig } from 'remotion';
import { COLORS } from '../../theme';
import { fontFamily } from '../../fonts';
import { LAYOUT } from '../layout';
import type { Format, Scenario } from '../types';

/**
 * Scene 2 — escalation.
 *
 * Three hard cuts, one pain per cut, each on black with a red-hot edge. Deliberately
 * NOT on photography: dropping to near-black after the cold open makes the chaos feel
 * claustrophobic, and it gives the gold in scene 3 somewhere to arrive from.
 *
 * Cut on the beat: each card gets an equal slice, with a 3-frame flash between.
 */
const PainCard: React.FC<{ text: string; format: Format; slice: number }> = ({
  text,
  format,
  slice,
}) => {
  const frame = useCurrentFrame();
  const L = LAYOUT[format];

  // Snap in — no easing. Escalation should feel abrupt, not designed.
  const opacity = interpolate(frame, [0, 3, slice - 5, slice - 2], [0, 1, 1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const shake = Math.sin(frame * 0.9) * 2.2;

  return (
    <AbsoluteFill
      style={{
        backgroundColor: '#050505',
        justifyContent: 'center',
        alignItems: 'center',
        paddingLeft: L.gutter,
        paddingRight: L.gutter,
        opacity,
      }}
    >
      <div
        style={{
          fontFamily,
          fontSize: L.headline * 0.74,
          fontWeight: 700,
          letterSpacing: '-0.015em',
          lineHeight: 1.2,
          color: COLORS.white,
          textAlign: 'center',
          maxWidth: L.textMax,
          transform: `translateX(${shake}px)`,
        }}
      >
        {text}
      </div>

      {/* Thin red rule — the only non-gold accent in the system, reserved for the problem. */}
      <div
        style={{
          marginTop: 34,
          width: 74,
          height: 3,
          backgroundColor: COLORS.destructive,
          opacity: 0.9,
        }}
      />
    </AbsoluteFill>
  );
};

export const Escalation: React.FC<{
  scenario: Scenario;
  format: Format;
  durationInFrames: number;
}> = ({ scenario, format, durationInFrames }) => {
  const pains = scenario.pains.slice(0, 3);
  // A scenario authored with no pains would make `slice` NaN and hand Remotion a
  // NaN durationInFrames, which fails at render rather than at typecheck — the type
  // only says string[], it cannot say non-empty.
  if (pains.length === 0) return null;
  const slice = Math.floor(durationInFrames / pains.length);

  return (
    <AbsoluteFill style={{ backgroundColor: '#050505' }}>
      {pains.map((pain, i) => (
        <Sequence key={pain} from={i * slice} durationInFrames={slice}>
          <PainCard text={pain} format={format} slice={slice} />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};
