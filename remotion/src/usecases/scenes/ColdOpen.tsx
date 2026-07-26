import React from 'react';
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { COLORS } from '../../theme';
import { fontFamily } from '../../fonts';
import { Plate } from '../Plate';
import { LAYOUT } from '../layout';
import type { Format, Scenario } from '../types';

/**
 * Scene 1 — the chaos.
 *
 * One plate, one line of copy, held long enough to land. The line is the
 * scenario's verbatim `before` string: the problem stated in the customer's
 * own words, which is the strongest hook we have and is already tested copy.
 */
export const ColdOpen: React.FC<{
  scenario: Scenario;
  format: Format;
  durationInFrames: number;
}> = ({ scenario, format, durationInFrames }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const L = LAYOUT[format];

  const enter = spring({ frame, fps, delay: 8, config: { damping: 200 } });
  const opacity = interpolate(enter, [0, 1], [0, 1]);
  const y = interpolate(enter, [0, 1], [34, 0]);

  // Fade the whole scene out over the last 10 frames so cuts breathe.
  const exit = interpolate(frame, [durationInFrames - 10, durationInFrames], [1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <AbsoluteFill style={{ opacity: exit }}>
      <Plate plate={scenario.plates.coldOpen} durationInFrames={durationInFrames} />

      <AbsoluteFill
        style={{
          justifyContent: 'flex-end',
          alignItems: 'center',
          paddingLeft: L.gutter,
          paddingRight: L.gutter,
          paddingBottom: L.safeBottom,
        }}
      >
        <div style={{ maxWidth: L.textMax, opacity, transform: `translateY(${y}px)` }}>
          <div
            style={{
              fontFamily,
              fontSize: L.eyebrow,
              fontWeight: 600,
              letterSpacing: '0.32em',
              textTransform: 'uppercase',
              color: COLORS.goldPale,
              marginBottom: 26,
              textAlign: 'center',
            }}
          >
            {scenario.title}
          </div>

          <div
            style={{
              fontFamily,
              fontSize: L.headline,
              fontWeight: 800,
              letterSpacing: '-0.02em',
              lineHeight: 1.12,
              color: COLORS.white,
              textAlign: 'center',
              textShadow: '0 2px 18px rgba(0,0,0,0.85)',
            }}
          >
            {scenario.before}
          </div>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
