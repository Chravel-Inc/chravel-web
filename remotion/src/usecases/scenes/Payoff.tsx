import React from 'react';
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { COLORS } from '../../theme';
import { fontFamily } from '../../fonts';
import { Plate } from '../Plate';
import { LAYOUT } from '../layout';
import type { Format, Scenario } from '../types';

/**
 * Scene 5 — payoff.
 *
 * Back to people. The `after` line lands over the warmest plate in the set, with the
 * grade lifted (lower `darken`) so this beat is visibly brighter than the cold open.
 * That brightness delta is doing the emotional work: same world, lit differently.
 */
export const Payoff: React.FC<{
  scenario: Scenario;
  format: Format;
  durationInFrames: number;
}> = ({ scenario, format, durationInFrames }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const L = LAYOUT[format];

  const enter = spring({ frame, fps, delay: 6, config: { damping: 200 } });
  const opacity = interpolate(enter, [0, 1], [0, 1]);
  const y = interpolate(enter, [0, 1], [28, 0]);

  const rule = interpolate(
    spring({ frame, fps, delay: 14, config: { damping: 200 } }),
    [0, 1],
    [0, 132],
  );

  const exit = interpolate(frame, [durationInFrames - 12, durationInFrames], [1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <AbsoluteFill style={{ opacity: exit }}>
      <Plate plate={scenario.plates.payoff} durationInFrames={durationInFrames} />

      <AbsoluteFill
        style={{
          justifyContent: 'center',
          alignItems: 'center',
          paddingLeft: L.gutter,
          paddingRight: L.gutter,
          paddingTop: L.safeTop * 0.5,
          paddingBottom: L.safeBottom * 0.5,
        }}
      >
        <div
          style={{
            maxWidth: L.textMax,
            opacity,
            transform: `translateY(${y}px)`,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}
        >
          <div
            style={{
              fontFamily,
              fontSize: L.body * 1.32,
              fontWeight: 600,
              lineHeight: 1.38,
              color: COLORS.white,
              textAlign: 'center',
              textShadow: '0 2px 18px rgba(0,0,0,0.9)',
            }}
          >
            {scenario.after}
          </div>

          <div
            style={{
              marginTop: 34,
              height: 2,
              width: rule,
              background: `linear-gradient(90deg, transparent, ${COLORS.gold}, transparent)`,
            }}
          />
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
