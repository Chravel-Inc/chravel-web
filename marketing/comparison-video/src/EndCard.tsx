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
import { FONT, FPS, GOLD_TEXT_GRADIENT, INK_1 } from './theme';

export const EndCard: React.FC = () => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();

  const logoIn = spring({
    frame,
    fps: FPS,
    config: { damping: 24, stiffness: 120 },
    durationInFrames: 28,
  });
  const line1 = spring({
    frame: frame - 18,
    fps: FPS,
    config: { damping: 200 },
    durationInFrames: 24,
  });
  const line2 = spring({
    frame: frame - 34,
    fps: FPS,
    config: { damping: 200 },
    durationInFrames: 24,
  });
  const fadeOut = interpolate(frame, [durationInFrames - 14, durationInFrames - 2], [1, 0], {
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
          width: 1200,
          height: 1200,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(196,151,70,0.11) 0%, transparent 60%)',
        }}
      />
      <Img
        src={staticFile('chravel-logo.png')}
        style={{
          width: 560,
          opacity: logoIn,
          transform: `scale(${0.9 + 0.1 * logoIn})`,
          WebkitMaskImage:
            'radial-gradient(ellipse 46% 46% at 50% 50%, black 62%, transparent 82%)',
          maskImage: 'radial-gradient(ellipse 46% 46% at 50% 50%, black 62%, transparent 82%)',
        }}
      />
      <div
        style={{
          marginTop: 10,
          fontSize: 38,
          fontWeight: 600,
          color: INK_1,
          letterSpacing: -0.4,
          opacity: line1,
          transform: `translateY(${(1 - line1) * 22}px)`,
        }}
      >
        Plan, chat, organize, and share in one place.
      </div>
      <div
        style={{
          marginTop: 16,
          fontSize: 52,
          fontWeight: 800,
          letterSpacing: -1,
          backgroundImage: GOLD_TEXT_GRADIENT,
          WebkitBackgroundClip: 'text',
          backgroundClip: 'text',
          color: 'transparent',
          opacity: line2,
          transform: `translateY(${(1 - line2) * 26}px)`,
        }}
      >
        ChravelApp makes group travel easier.
      </div>
    </AbsoluteFill>
  );
};
