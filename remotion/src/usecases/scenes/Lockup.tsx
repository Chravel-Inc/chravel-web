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
import { COLORS, GRADIENTS, SHADOWS } from '../../theme';
import { fontFamily } from '../../fonts';
import { LAYOUT } from '../layout';
import type { Format, Scenario } from '../types';

/**
 * Scene 6 — lockup.
 *
 * Identical construction across all 11 films: that repetition is the brand signature.
 * Rendered entirely in Remotion with no plate behind it, so every word here is real
 * font rasterization at full resolution — this is the guaranteed-clean-text zone, and
 * the reason no title in this system is ever handed to a video model.
 */
export const Lockup: React.FC<{
  scenario: Scenario;
  format: Format;
  durationInFrames: number;
}> = ({ scenario, format, durationInFrames }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const L = LAYOUT[format];

  const logo = spring({ frame, fps, delay: 2, config: { damping: 14, stiffness: 120 } });
  const logoScale = interpolate(logo, [0, 1], [0.7, 1]);
  const logoOpacity = interpolate(logo, [0, 1], [0, 1]);

  const heading = spring({ frame, fps, delay: 12, config: { damping: 200 } });
  const headingOpacity = interpolate(heading, [0, 1], [0, 1]);
  const headingY = interpolate(heading, [0, 1], [24, 0]);

  const badge = spring({ frame, fps, delay: 22, config: { damping: 200 } });
  const badgeOpacity = interpolate(badge, [0, 1], [0, 1]);
  const badgeY = interpolate(badge, [0, 1], [18, 0]);

  const cta = spring({ frame, fps, delay: 32, config: { damping: 200 } });
  const ctaOpacity = interpolate(cta, [0, 1], [0, 1]);
  const ctaScale = interpolate(cta, [0, 1], [0.94, 1]);

  const glow = interpolate(frame, [0, 24, 52, durationInFrames], [0, 0.34, 0.18, 0.3], {
    extrapolateRight: 'clamp',
  });

  return (
    <AbsoluteFill style={{ backgroundColor: COLORS.background }}>
      <AbsoluteFill style={{ background: GRADIENTS.backgroundRadial }} />
      <AbsoluteFill
        style={{
          background: `radial-gradient(circle at 50% 46%, rgba(196,151,70,${glow}) 0%, transparent 58%)`,
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
        {/* The real brand lockup. It ships on an opaque black plate, which is NOT
            invisible here — the scene's warm radial glow is lighter than the asset's
            black, so it reads as a rectangle. `screen` blending drops pure black to
            transparent and keeps the gold and blue, letting the mark sit on the glow. */}
        <Img
          src={staticFile('chravel-logo.png')}
          style={{
            width: '64%',
            height: 'auto',
            mixBlendMode: 'screen',
            opacity: logoOpacity,
            transform: `scale(${logoScale})`,
            marginBottom: -10,
          }}
        />

        <div
          style={{
            fontFamily,
            fontSize: L.headline * 0.66,
            fontWeight: 800,
            letterSpacing: '-0.02em',
            lineHeight: 1.16,
            color: COLORS.white,
            textAlign: 'center',
            maxWidth: L.textMax,
            opacity: headingOpacity,
            transform: `translateY(${headingY}px)`,
          }}
        >
          {scenario.ctaHeading}
        </div>

        <div
          style={{
            fontFamily,
            fontSize: L.eyebrow,
            fontWeight: 600,
            letterSpacing: '0.16em',
            textTransform: 'uppercase',
            color: COLORS.goldPale,
            textAlign: 'center',
            marginTop: 26,
            maxWidth: L.textMax * 0.82,
            // Badge lines are long and '·'-separated; balance stops a lone trailing word.
            textWrap: 'balance',
            opacity: badgeOpacity,
            transform: `translateY(${badgeY}px)`,
          }}
        >
          {scenario.badge}
        </div>

        <div
          style={{
            marginTop: 46,
            opacity: ctaOpacity,
            transform: `scale(${ctaScale})`,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 22,
          }}
        >
          <div
            style={{
              fontFamily,
              fontSize: L.body * 1.06,
              fontWeight: 700,
              color: '#000000',
              background: GRADIENTS.goldButton,
              padding: '20px 52px',
              borderRadius: 16,
              boxShadow: SHADOWS.goldGlow,
              letterSpacing: '-0.01em',
            }}
          >
            Get started free
          </div>

          <div
            style={{
              fontFamily,
              fontSize: L.body * 0.86,
              fontWeight: 600,
              color: COLORS.muted,
              letterSpacing: '0.06em',
            }}
          >
            chravel.app
          </div>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
