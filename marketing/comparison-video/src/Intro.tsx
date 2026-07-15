import React from 'react';
import {
  AbsoluteFill,
  Img,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import { FONT, FPS, GOLD_TEXT_GRADIENT, INK_2 } from './theme';

export const Intro: React.FC = () => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();

  const logoIn = spring({
    frame,
    fps: FPS,
    config: { damping: 22, stiffness: 110 },
    durationInFrames: 30,
  });
  const line1 = spring({
    frame: frame - 14,
    fps: FPS,
    config: { damping: 200 },
    durationInFrames: 22,
  });
  const fadeOut = interpolate(frame, [durationInFrames - 12, durationInFrames - 2], [1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <AbsoluteFill
      style={{
        background: '#050505',
        fontFamily: FONT,
        alignItems: 'center',
        justifyContent: 'center',
        opacity: fadeOut,
      }}
    >
      <div
        style={{
          position: 'absolute',
          width: 1100,
          height: 1100,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(196,151,70,0.10) 0%, transparent 60%)',
        }}
      />
      <Img
        src={staticFile('chravel-logo.png')}
        style={{
          width: 620,
          opacity: logoIn,
          transform: `scale(${0.88 + 0.12 * logoIn})`,
          WebkitMaskImage:
            'radial-gradient(ellipse 46% 46% at 50% 50%, black 62%, transparent 82%)',
          maskImage: 'radial-gradient(ellipse 46% 46% at 50% 50%, black 62%, transparent 82%)',
        }}
      />
      <div
        style={{
          marginTop: 8,
          fontSize: 44,
          fontWeight: 800,
          letterSpacing: -0.8,
          backgroundImage: GOLD_TEXT_GRADIENT,
          WebkitBackgroundClip: 'text',
          backgroundClip: 'text',
          color: 'transparent',
          opacity: line1,
          transform: `translateY(${(1 - line1) * 24}px)`,
        }}
      >
        Planning one trip shouldn't take ten apps.
      </div>
      <div
        style={{
          marginTop: 14,
          fontSize: 24,
          fontWeight: 500,
          color: INK_2,
          opacity: interpolate(frame, [34, 52], [0, 1], {
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
          }),
        }}
      >
        Watch the same trip, planned two ways.
      </div>
    </AbsoluteFill>
  );
};
