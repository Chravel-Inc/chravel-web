import React from 'react';
import {
  AbsoluteFill,
  Sequence,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import { COLORS, GRADIENTS, SHADOWS, FPS } from '../theme';
import { fontFamily } from '../fonts';
import { Plate } from './Plate';
import { LAYOUT } from './layout';
import { SCENARIOS } from './scenarios';
import type { Format, Scenario } from './types';

/**
 * The 75-second brand anthem.
 *
 * Structure: a 12s cold open on the universal problem, 11 x 4s vignettes (one per
 * use case, in page order), then a 19s close. The argument the film makes is the
 * breadth argument — that these eleven very different groups have the same problem
 * and the same fix — so the vignettes are deliberately uniform and fast. Sameness is
 * the point; a bespoke treatment per scenario would undercut it.
 */

const OPEN = 12 * FPS; // 360
const VIGNETTE = 4 * FPS; // 120
const CLOSE = 19 * FPS; // 570
export const ANTHEM_DURATION = OPEN + VIGNETTE * SCENARIOS.length + CLOSE; // 2250 = 75s

const AnthemOpen: React.FC<{ format: Format }> = ({ format }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const L = LAYOUT[format];

  const lines = ['Every group has a plan.', 'And a group chat where the plan goes to die.'];

  const exit = interpolate(frame, [OPEN - 14, OPEN], [1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <AbsoluteFill style={{ opacity: exit }}>
      <Plate
        plate={{ still: 'group-cruise-deck-aerial.jpg', push: 'in', darken: 0.66 }}
        durationInFrames={OPEN}
      />
      <AbsoluteFill
        style={{
          justifyContent: 'center',
          alignItems: 'center',
          paddingLeft: L.gutter,
          paddingRight: L.gutter,
        }}
      >
        <div style={{ maxWidth: L.textMax }}>
          {lines.map((line, i) => {
            const s = spring({ frame, fps, delay: 24 + i * 52, config: { damping: 200 } });
            return (
              <div
                key={line}
                style={{
                  fontFamily,
                  fontSize: L.headline * 0.9,
                  fontWeight: 800,
                  letterSpacing: '-0.02em',
                  lineHeight: 1.16,
                  color: i === 1 ? COLORS.goldPale : COLORS.white,
                  textAlign: 'center',
                  marginBottom: 22,
                  opacity: interpolate(s, [0, 1], [0, 1]),
                  transform: `translateY(${interpolate(s, [0, 1], [30, 0])}px)`,
                  textShadow: '0 2px 20px rgba(0,0,0,0.9)',
                }}
              >
                {line}
              </div>
            );
          })}
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

const Vignette: React.FC<{ scenario: Scenario; format: Format }> = ({ scenario, format }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const L = LAYOUT[format];

  const enter = spring({ frame, fps, delay: 4, config: { damping: 200 } });
  const opacity = interpolate(enter, [0, 1], [0, 1]);
  const x = interpolate(enter, [0, 1], [-26, 0]);

  const out = interpolate(frame, [VIGNETTE - 10, VIGNETTE], [1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <AbsoluteFill style={{ opacity: out }}>
      <Plate plate={scenario.plates.payoff} durationInFrames={VIGNETTE} />

      <AbsoluteFill
        style={{
          justifyContent: 'flex-end',
          alignItems: 'flex-start',
          paddingLeft: L.gutter,
          paddingRight: L.gutter,
          paddingBottom: format === 'vertical' ? L.safeBottom : L.safeBottom * 1.4,
        }}
      >
        <div style={{ opacity, transform: `translateX(${x}px)`, maxWidth: L.textMax }}>
          <div
            style={{
              fontFamily,
              fontSize: L.eyebrow * 0.92,
              fontWeight: 700,
              letterSpacing: '0.3em',
              color: COLORS.gold,
              marginBottom: 16,
            }}
          >
            {String(scenario.index).padStart(2, '0')}
          </div>
          <div
            style={{
              fontFamily,
              fontSize: L.headline * 0.72,
              fontWeight: 800,
              letterSpacing: '-0.02em',
              color: COLORS.white,
              lineHeight: 1.1,
              textShadow: '0 2px 18px rgba(0,0,0,0.9)',
            }}
          >
            {scenario.title}
          </div>
          <div
            style={{
              fontFamily,
              fontSize: L.body * 0.92,
              fontWeight: 500,
              color: COLORS.goldPale,
              marginTop: 14,
              letterSpacing: '0.02em',
              textShadow: '0 2px 12px rgba(0,0,0,0.9)',
            }}
          >
            {scenario.audience}
          </div>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

const AnthemClose: React.FC<{ format: Format }> = ({ format }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const L = LAYOUT[format];

  const logo = spring({ frame, fps, delay: 8, config: { damping: 14, stiffness: 120 } });
  const head = spring({ frame, fps, delay: 26, config: { damping: 200 } });
  const sub = spring({ frame, fps, delay: 42, config: { damping: 200 } });
  const cta = spring({ frame, fps, delay: 62, config: { damping: 200 } });

  const glow = interpolate(frame, [0, 40, 90, CLOSE], [0, 0.36, 0.2, 0.32], {
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
        {/* Drawn wordmark rather than the logo PNG: the PNG bakes in the tagline that
            this scene animates in on its own line, so using both would say it twice. */}
        <div
          style={{
            fontFamily,
            fontSize: L.headline * 1.05,
            fontWeight: 800,
            letterSpacing: '-0.02em',
            backgroundImage: GRADIENTS.gold,
            WebkitBackgroundClip: 'text',
            backgroundClip: 'text',
            color: 'transparent',
            marginBottom: 30,
            opacity: interpolate(logo, [0, 1], [0, 1]),
            transform: `scale(${interpolate(logo, [0, 1], [0.82, 1])})`,
          }}
        >
          ChravelApp
        </div>

        <div
          style={{
            fontFamily,
            fontSize: L.headline * 0.88,
            fontWeight: 800,
            letterSpacing: '-0.02em',
            color: COLORS.white,
            textAlign: 'center',
            lineHeight: 1.12,
            maxWidth: L.textMax,
            opacity: interpolate(head, [0, 1], [0, 1]),
            transform: `translateY(${interpolate(head, [0, 1], [26, 0])}px)`,
          }}
        >
          The Group <span style={{ color: COLORS.gold }}>Chat Travel App</span>
        </div>

        <div
          style={{
            fontFamily,
            fontSize: L.eyebrow,
            fontWeight: 600,
            letterSpacing: '0.32em',
            textTransform: 'uppercase',
            color: COLORS.goldPale,
            marginTop: 28,
            opacity: interpolate(sub, [0, 1], [0, 1]),
          }}
        >
          Less Chaos · More Coordination
        </div>

        <div
          style={{
            marginTop: 48,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 22,
            opacity: interpolate(cta, [0, 1], [0, 1]),
            transform: `scale(${interpolate(cta, [0, 1], [0.94, 1])})`,
          }}
        >
          <div
            style={{
              fontFamily,
              fontSize: L.body * 1.08,
              fontWeight: 700,
              color: '#000000',
              background: GRADIENTS.goldButton,
              padding: '22px 58px',
              borderRadius: 16,
              boxShadow: SHADOWS.goldGlow,
            }}
          >
            Get started free
          </div>
          <div
            style={{
              fontFamily,
              fontSize: L.body * 0.88,
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

export const Anthem: React.FC<{ format: Format }> = ({ format }) => (
  <AbsoluteFill style={{ backgroundColor: COLORS.background }}>
    <Sequence from={0} durationInFrames={OPEN}>
      <AnthemOpen format={format} />
    </Sequence>

    {SCENARIOS.map((s, i) => (
      <Sequence key={s.slug} from={OPEN + i * VIGNETTE} durationInFrames={VIGNETTE}>
        <Vignette scenario={s} format={format} />
      </Sequence>
    ))}

    <Sequence from={OPEN + SCENARIOS.length * VIGNETTE} durationInFrames={CLOSE}>
      <AnthemClose format={format} />
    </Sequence>
  </AbsoluteFill>
);
