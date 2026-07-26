import React from 'react';
import {
  AbsoluteFill,
  Img,
  Sequence,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import { COLORS, GRADIENTS, SHADOWS } from '../../theme';
import { fontFamily } from '../../fonts';
import { PhoneFrame } from '../../components/PhoneFrame';
import { LAYOUT } from '../layout';
import type { Format, Scenario, SolutionBeat } from '../types';

/**
 * Scene 4 — resolution.
 *
 * The proof. Real product captures from public/captures/mobile inside the existing
 * PhoneFrame, one per solution beat, each labelled. These are genuine screenshots of
 * shipped surfaces, not mockups — which is the whole reason this scene is rendered in
 * Remotion instead of generated: a video model would invent a plausible-looking app
 * that is not ours, with unreadable text in it.
 */
/**
 * Percent cropped off the top of every capture: the device status bar plus the
 * trip-title header. All captures come from one demo trip ("Spring Break Cancun 2026",
 * and a Beyoncé tour for the Pro team screen), so an uncropped header put that trip's
 * name inside the wedding, church-group, and conference films. Cropping starts each
 * shot on the tab bar — product surfaces instead of demo data.
 */
// 14.5 here crops 14.5/114.5 = 12.7% off the source, which lands just above the tab row
// in a 2532px capture. PhoneFrame draws its own status bar, so the capture's is
// redundant and goes too.
const CROP = 14.5;

const SolutionShot: React.FC<{
  beat: SolutionBeat;
  format: Format;
  slice: number;
}> = ({ beat, format, slice }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const L = LAYOUT[format];

  const label = spring({ frame, fps, delay: 10, config: { damping: 200 } });
  const labelOpacity = interpolate(label, [0, 1], [0, 1]);
  const labelY = interpolate(label, [0, 1], [22, 0]);

  const out = interpolate(frame, [slice - 8, slice - 2], [1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // Vertical has room for the phone centred with the label below; square is tighter,
  // so the phone sits high and the label tucks under it.
  const phoneY = format === 'vertical' ? -80 : -50;

  return (
    <AbsoluteFill style={{ opacity: out }}>
      <PhoneFrame scale={L.phoneScale} y={phoneY} delay={0} float>
        {/* Crop the top ~9.5% of each capture: the device status bar and the trip-title
            header. Both are captured against a single demo trip ("Spring Break Cancun
            2026"), so leaving the header in put that trip's name inside films for
            weddings, church groups, and conferences. Cropping it starts the shot on the
            tab bar, which shows product surfaces rather than demo data. */}
        <div style={{ position: 'relative', width: '100%', height: '100%', overflow: 'hidden' }}>
          <Img
            src={staticFile(`captures/mobile/${beat.capture}`)}
            style={{
              position: 'absolute',
              // `top` as a percentage resolves against the container's height, which is
              // what we want here. A percentage `margin-top` would resolve against its
              // WIDTH and crop far too little.
              top: `-${CROP}%`,
              left: 0,
              width: '100%',
              height: `${100 + CROP}%`,
              objectFit: 'cover',
              objectPosition: 'top',
            }}
          />
        </div>
      </PhoneFrame>

      <AbsoluteFill
        style={{
          justifyContent: 'flex-end',
          alignItems: 'center',
          paddingBottom: L.safeBottom * 0.55,
          paddingLeft: L.gutter,
          paddingRight: L.gutter,
        }}
      >
        <div
          style={{
            opacity: labelOpacity,
            transform: `translateY(${labelY}px)`,
            display: 'flex',
            alignItems: 'center',
            gap: 16,
            padding: '16px 30px',
            borderRadius: 999,
            backgroundColor: 'rgba(15,15,15,0.86)',
            border: `1px solid ${COLORS.borderGold}`,
            boxShadow: SHADOWS.goldGlowSubtle,
          }}
        >
          <div
            style={{
              width: 9,
              height: 9,
              borderRadius: 999,
              background: GRADIENTS.gold,
            }}
          />
          <div
            style={{
              fontFamily,
              fontSize: L.body,
              fontWeight: 700,
              color: COLORS.white,
              letterSpacing: '-0.01em',
              whiteSpace: 'nowrap',
            }}
          >
            {beat.label}
          </div>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

export const Resolution: React.FC<{
  scenario: Scenario;
  format: Format;
  durationInFrames: number;
}> = ({ scenario, format, durationInFrames }) => {
  // Square drops to two beats — 15s cannot carry three product shots and still breathe.
  const beats = scenario.solutions.slice(0, format === 'square' ? 2 : 3);
  const slice = Math.floor(durationInFrames / beats.length);

  return (
    <AbsoluteFill style={{ backgroundColor: COLORS.background }}>
      {/* Ambient gold wash so the product scene is not flat black behind the phone. */}
      <AbsoluteFill style={{ background: GRADIENTS.backgroundRadial }} />
      <AbsoluteFill style={{ background: GRADIENTS.goldAmbient }} />

      {beats.map((beat, i) => (
        <Sequence key={beat.label + i} from={i * slice} durationInFrames={slice}>
          <SolutionShot beat={beat} format={format} slice={slice} />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};
