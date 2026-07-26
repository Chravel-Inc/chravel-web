import React from 'react';
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { COLORS, GRADIENTS } from '../../theme';
import { fontFamily } from '../../fonts';
import { Plate } from '../Plate';
import { LAYOUT } from '../layout';
import type { Format, Scenario } from '../types';

/**
 * Scene 3 — the turn.
 *
 * The pivot of the whole film: a gold wipe sweeps the frame, the plate returns,
 * and the wordmark lands. This is the only place the brand interrupts the story,
 * and it earns the interruption by resolving the escalation.
 */
export const TheTurn: React.FC<{
  scenario: Scenario;
  format: Format;
  durationInFrames: number;
}> = ({ scenario, format, durationInFrames }) => {
  const frame = useCurrentFrame();
  const { fps, width } = useVideoConfig();
  const L = LAYOUT[format];

  // Gold sweep crosses the frame in the first 18 frames.
  const sweep = interpolate(frame, [0, 18], [-1.1, 1.1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const logo = spring({ frame, fps, delay: 16, config: { damping: 200 } });
  const logoOpacity = interpolate(logo, [0, 1], [0, 1]);
  const logoScale = interpolate(logo, [0, 1], [0.9, 1]);

  const exit = interpolate(frame, [durationInFrames - 8, durationInFrames], [1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <AbsoluteFill style={{ opacity: exit }}>
      <Plate plate={scenario.plates.turn} durationInFrames={durationInFrames} />

      {/* Gold light sweep */}
      <AbsoluteFill
        style={{
          transform: `translateX(${sweep * width}px)`,
          background: `linear-gradient(105deg, transparent 0%, rgba(232,175,72,0.0) 34%, rgba(232,175,72,0.55) 50%, rgba(232,175,72,0.0) 66%, transparent 100%)`,
          mixBlendMode: 'screen',
        }}
      />

      <AbsoluteFill
        style={{
          justifyContent: 'center',
          alignItems: 'center',
          paddingLeft: L.gutter,
          paddingRight: L.gutter,
        }}
      >
        <div
          style={{
            opacity: logoOpacity,
            transform: `scale(${logoScale})`,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}
        >
          {/* Typographic wordmark, not the logo PNG: that asset is a full lockup on
              opaque black, which reads as a black box over photography. Over a plate
              the drawn wordmark is cleaner and stays crisp at any size. */}
          <div
            style={{
              fontFamily,
              fontSize: L.headline * 0.92,
              fontWeight: 800,
              letterSpacing: '-0.02em',
              backgroundImage: GRADIENTS.gold,
              WebkitBackgroundClip: 'text',
              backgroundClip: 'text',
              color: 'transparent',
              textAlign: 'center',
            }}
          >
            ChravelApp
          </div>

          <div
            style={{
              marginTop: 22,
              height: 1,
              width: 190,
              background: `linear-gradient(90deg, transparent, ${COLORS.gold}, transparent)`,
            }}
          />

          <div
            style={{
              fontFamily,
              fontSize: L.eyebrow,
              fontWeight: 600,
              letterSpacing: '0.32em',
              textTransform: 'uppercase',
              color: COLORS.goldPale,
              marginTop: 22,
              textAlign: 'center',
            }}
          >
            Less Chaos · More Coordination
          </div>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
