import React from 'react';
import {
  AbsoluteFill,
  Img,
  OffthreadVideo,
  interpolate,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import { COLORS } from '../theme';
import type { PlateRef } from './types';

/**
 * A live-action background slot.
 *
 * This is the seam that lets the films be finished today and better later.
 * When `plate.clip` is set, it plays that AI-generated clip from
 * public/plates/clips. When it is not, it falls back to real brand photography
 * from public/plates/stills with a slow Ken Burns push. Both paths get the same
 * grade, vignette, and grain, so dropping a clip in changes the footage without
 * changing the look — and no code has to change, only the manifest.
 *
 * Everything drawn here is imagery only. All words are rendered by sibling
 * components in real Inter, never composited into the plate, which is why the
 * text can never come out garbled.
 */
export const Plate: React.FC<{ plate: PlateRef; durationInFrames: number }> = ({
  plate,
  durationInFrames,
}) => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();

  // Slow, deliberate move. Cinematic push is subtle — 6% over the whole beat.
  const t = interpolate(frame, [0, durationInFrames], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const scale = plate.push === 'out' ? 1.06 - t * 0.06 : 1.0 + t * 0.06;

  const darken = plate.darken ?? 0.45;

  return (
    <AbsoluteFill style={{ backgroundColor: COLORS.background, overflow: 'hidden' }}>
      <AbsoluteFill style={{ transform: `scale(${scale})`, transformOrigin: 'center center' }}>
        {plate.clip ? (
          <OffthreadVideo
            src={staticFile(`plates/clips/${plate.clip}`)}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            muted
          />
        ) : (
          <Img
            src={staticFile(`plates/stills/${plate.still}`)}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        )}
      </AbsoluteFill>

      {/* Grade: crush to black so white type stays legible over any plate. */}
      <AbsoluteFill style={{ backgroundColor: `rgba(0,0,0,${darken})` }} />

      {/* Warm gold ambient — the Chravel look, pulled from the app's radial glow. */}
      <AbsoluteFill
        style={{
          background: `radial-gradient(ellipse at 50% 55%, rgba(196,151,70,0.16) 0%, transparent 62%)`,
          mixBlendMode: 'screen',
        }}
      />

      {/* Vignette — focuses the eye and hides plate edges on the Ken Burns push. */}
      <AbsoluteFill
        style={{
          background: `radial-gradient(ellipse at 50% 50%, transparent 42%, rgba(0,0,0,0.78) 100%)`,
        }}
      />

      {/* 35mm grain. Static SVG noise at low opacity — reads as film, not as compression. */}
      <AbsoluteFill style={{ opacity: 0.07, mixBlendMode: 'overlay' }}>
        <svg width={width} height={height}>
          <filter id="plate-grain">
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.85"
              numOctaves={3}
              stitchTiles="stitch"
            />
          </filter>
          <rect width={width} height={height} filter="url(#plate-grain)" />
        </svg>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
