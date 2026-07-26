/**
 * UseCaseReel — Instagram / Reels vertical (1080×1920 · 30fps · ~22s)
 *
 * Multi-scene cinematic brand film per use case:
 * Hook → Pain → Turn → 3 Feature beats → CTA
 *
 * People & places: real stock footage + brand photography.
 * Typography: crisp Remotion text (no AI lettering).
 */
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
import { TransitionSeries, linearTiming } from '@remotion/transitions';
import { fade } from '@remotion/transitions/fade';
import { slide } from '@remotion/transitions/slide';
import { COLORS, GRADIENTS, SHADOWS, SPRING, FPS } from '../../theme';
import { fontFamily as sans } from '../../fonts';
import { serifDisplay, serifBody } from './cinematicFonts';
import { CinematicBackground } from './CinematicBackground';
import { type UseCaseScript, getScriptById } from './scripts';

const TRANSITION = 14;
const HOOK = 105;
const PAIN = 105;
const TURN = 96;
const FEATURE = 100;
const CTA = 120;

export const USE_CASE_REEL_DURATION = HOOK + PAIN + TURN + FEATURE * 3 + CTA - TRANSITION * 6;

export type UseCaseReelProps = {
  scriptId: string;
};

const springIn = (
  frame: number,
  fps: number,
  delay = 0,
  config: { damping: number; stiffness?: number; mass?: number } = SPRING.smooth,
) => spring({ frame, fps, delay, config });

const Multiline: React.FC<{
  text: string;
  style?: React.CSSProperties;
  stagger?: number;
  delay?: number;
}> = ({ text, style, stagger = 5, delay = 0 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const lines = text.split('\n');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {lines.map((line, i) => {
        const p = springIn(frame, fps, delay + i * stagger, SPRING.gentle);
        return (
          <div
            key={`${i}-${line}`}
            style={{
              opacity: interpolate(p, [0, 1], [0, 1]),
              transform: `translateY(${interpolate(p, [0, 1], [36, 0])}px)`,
              ...style,
            }}
          >
            {line}
          </div>
        );
      })}
    </div>
  );
};

const Eyebrow: React.FC<{ text: string; delay?: number }> = ({ text, delay = 0 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const p = springIn(frame, fps, delay, SPRING.snappy);
  return (
    <div
      style={{
        fontFamily: sans,
        fontSize: 22,
        fontWeight: 700,
        letterSpacing: '0.28em',
        color: COLORS.goldPale,
        textTransform: 'uppercase',
        opacity: interpolate(p, [0, 1], [0, 1]),
        transform: `translateY(${interpolate(p, [0, 1], [12, 0])}px)`,
        marginBottom: 28,
      }}
    >
      {text}
    </div>
  );
};

const GoldRule: React.FC<{ delay?: number; width?: number }> = ({ delay = 8, width = 120 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const p = springIn(frame, fps, delay, SPRING.smooth);
  return (
    <div
      style={{
        width: interpolate(p, [0, 1], [0, width]),
        height: 3,
        background: GRADIENTS.gold,
        borderRadius: 2,
        marginTop: 28,
        marginBottom: 28,
        boxShadow: SHADOWS.goldGlowSubtle,
      }}
    />
  );
};

const BrandMark: React.FC<{ delay?: number }> = ({ delay = 0 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const p = springIn(frame, fps, delay, SPRING.snappy);
  return (
    <div
      style={{
        position: 'absolute',
        top: 64,
        left: 0,
        right: 0,
        display: 'flex',
        justifyContent: 'center',
        opacity: interpolate(p, [0, 1], [0, 1]),
      }}
    >
      <div
        style={{
          fontFamily: sans,
          fontSize: 20,
          fontWeight: 800,
          letterSpacing: '0.22em',
          color: COLORS.white,
          textTransform: 'uppercase',
        }}
      >
        Chravel
        <span style={{ color: COLORS.gold }}>App</span>
      </div>
    </div>
  );
};

const SceneShell: React.FC<{
  children: React.ReactNode;
  clip?: string;
  still?: string;
  vignette?: number;
  showBrand?: boolean;
}> = ({ children, clip, still, vignette, showBrand = true }) => (
  <AbsoluteFill>
    <CinematicBackground clip={clip} still={still} vignette={vignette} />
    {showBrand ? <BrandMark /> : null}
    <AbsoluteFill
      style={{
        padding: '140px 56px 100px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'flex-end',
      }}
    >
      {children}
    </AbsoluteFill>
  </AbsoluteFill>
);

const HookScene: React.FC<{ script: UseCaseScript }> = ({ script }) => (
  <SceneShell clip={script.clips[0]} still={script.still} vignette={0.5}>
    <Eyebrow text={script.eyebrow} />
    <Multiline
      text={script.hook}
      stagger={6}
      delay={4}
      style={{
        fontFamily: serifDisplay,
        fontWeight: 700,
        fontSize: 64,
        lineHeight: 1.12,
        color: COLORS.white,
        letterSpacing: '-0.02em',
        textShadow: '0 8px 40px rgba(0,0,0,0.55)',
      }}
    />
    <GoldRule delay={18} width={140} />
  </SceneShell>
);

const PainScene: React.FC<{ script: UseCaseScript }> = ({ script }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const chipP = springIn(frame, fps, 20, SPRING.snappy);

  return (
    <SceneShell clip={script.clips[1]} still={script.still} vignette={0.62}>
      <div
        style={{
          alignSelf: 'flex-start',
          fontFamily: sans,
          fontSize: 16,
          fontWeight: 700,
          letterSpacing: '0.2em',
          color: COLORS.background,
          background: COLORS.gold,
          padding: '10px 16px',
          borderRadius: 999,
          marginBottom: 24,
          opacity: interpolate(chipP, [0, 1], [0, 1]),
          transform: `scale(${interpolate(chipP, [0, 1], [0.85, 1])})`,
        }}
      >
        THE GROUP-CHAT TAX
      </div>
      <Multiline
        text={script.pain}
        stagger={5}
        delay={6}
        style={{
          fontFamily: serifBody,
          fontWeight: 400,
          fontSize: 44,
          lineHeight: 1.25,
          color: COLORS.white,
          textShadow: '0 6px 28px rgba(0,0,0,0.6)',
        }}
      />
    </SceneShell>
  );
};

const TurnScene: React.FC<{ script: UseCaseScript }> = ({ script }) => (
  <SceneShell clip={script.clips[2]} still={script.still} vignette={0.58}>
    <Eyebrow text="CHRAVELAPP" delay={2} />
    <Multiline
      text={script.turn}
      stagger={7}
      delay={6}
      style={{
        fontFamily: serifDisplay,
        fontWeight: 700,
        fontSize: 60,
        lineHeight: 1.12,
        color: COLORS.white,
        letterSpacing: '-0.02em',
      }}
    />
    <GoldRule delay={22} width={160} />
    <Multiline
      text="One shared workspace.\nCalendar · Tasks · Places · Media · Payments"
      stagger={4}
      delay={26}
      style={{
        fontFamily: sans,
        fontWeight: 500,
        fontSize: 24,
        lineHeight: 1.45,
        color: COLORS.muted,
      }}
    />
  </SceneShell>
);

const PhoneCard: React.FC<{ lines: string[]; delay?: number }> = ({ lines, delay = 8 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const p = springIn(frame, fps, delay, SPRING.gentle);

  return (
    <div
      style={{
        width: '100%',
        maxWidth: 520,
        alignSelf: 'center',
        background: 'rgba(10,10,10,0.78)',
        border: `1px solid ${COLORS.borderGold}`,
        borderRadius: 28,
        padding: '28px 26px',
        backdropFilter: 'blur(18px)',
        boxShadow: SHADOWS.phone,
        opacity: interpolate(p, [0, 1], [0, 1]),
        transform: `translateY(${interpolate(p, [0, 1], [48, 0])}px) scale(${interpolate(p, [0, 1], [0.94, 1])})`,
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          marginBottom: 18,
        }}
      >
        <div
          style={{
            width: 10,
            height: 10,
            borderRadius: '50%',
            background: COLORS.gold,
            boxShadow: SHADOWS.goldRing,
          }}
        />
        <div
          style={{
            fontFamily: sans,
            fontSize: 14,
            fontWeight: 700,
            letterSpacing: '0.16em',
            color: COLORS.gold,
            textTransform: 'uppercase',
          }}
        >
          Live in ChravelApp
        </div>
      </div>
      {lines.map((line, i) => {
        const lp = springIn(frame, fps, delay + 8 + i * 6, SPRING.snappy);
        return (
          <div
            key={line}
            style={{
              fontFamily: sans,
              fontSize: 22,
              fontWeight: i === 0 ? 700 : 500,
              color: i === 0 ? COLORS.white : COLORS.muted,
              padding: '14px 0',
              borderTop: i === 0 ? 'none' : `1px solid ${COLORS.border}`,
              opacity: interpolate(lp, [0, 1], [0, 1]),
              transform: `translateX(${interpolate(lp, [0, 1], [16, 0])}px)`,
            }}
          >
            {line}
          </div>
        );
      })}
    </div>
  );
};

const FeatureScene: React.FC<{
  script: UseCaseScript;
  index: 0 | 1 | 2;
  clip: string;
}> = ({ script, index, clip }) => {
  const feature = script.features[index];
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const numP = springIn(frame, fps, 2, SPRING.bouncy);

  return (
    <SceneShell clip={clip} still={script.still} vignette={0.56}>
      <div
        style={{
          fontFamily: serifDisplay,
          fontSize: 72,
          fontWeight: 700,
          color: COLORS.gold,
          opacity: interpolate(numP, [0, 1], [0, 1]),
          transform: `scale(${interpolate(numP, [0, 1], [0.7, 1])})`,
          marginBottom: 8,
          textShadow: SHADOWS.goldGlowSubtle,
        }}
      >
        0{index + 1}
      </div>
      <Multiline
        text={feature.label}
        stagger={4}
        delay={8}
        style={{
          fontFamily: serifDisplay,
          fontWeight: 700,
          fontSize: 52,
          lineHeight: 1.15,
          color: COLORS.white,
          letterSpacing: '-0.015em',
        }}
      />
      <GoldRule delay={16} width={100} />
      <Multiline
        text={feature.detail}
        stagger={4}
        delay={18}
        style={{
          fontFamily: sans,
          fontWeight: 500,
          fontSize: 28,
          lineHeight: 1.4,
          color: 'rgba(255,255,255,0.82)',
          maxWidth: 640,
        }}
      />
      {index === 1 ? (
        <div style={{ marginTop: 36 }}>
          <PhoneCard lines={script.phoneLines} delay={28} />
        </div>
      ) : null}
    </SceneShell>
  );
};

const CtaScene: React.FC<{ script: UseCaseScript }> = ({ script }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const logoP = springIn(frame, fps, 4, SPRING.bouncy);
  const btnP = springIn(frame, fps, 18, SPRING.snappy);
  const glow = interpolate(frame % 70, [0, 35, 70], [0.25, 0.45, 0.25]);

  return (
    <AbsoluteFill style={{ background: COLORS.background }}>
      <CinematicBackground clip={script.clips[3]} still={script.still} vignette={0.72} goldWash />
      <AbsoluteFill
        style={{
          background:
            'radial-gradient(ellipse at 50% 40%, rgba(196,151,70,0.16) 0%, transparent 55%)',
        }}
      />
      <AbsoluteFill
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 56,
          textAlign: 'center',
        }}
      >
        <div
          style={{
            opacity: interpolate(logoP, [0, 1], [0, 1]),
            transform: `scale(${interpolate(logoP, [0, 1], [0.7, 1])})`,
            marginBottom: 28,
          }}
        >
          <Img src={staticFile('chravel-logo.png')} style={{ width: 160, height: 'auto' }} />
        </div>

        <Multiline
          text={script.cta}
          stagger={5}
          delay={10}
          style={{
            fontFamily: serifDisplay,
            fontWeight: 700,
            fontSize: 52,
            lineHeight: 1.15,
            color: COLORS.white,
            letterSpacing: '-0.02em',
          }}
        />
        <Multiline
          text={script.ctaSub}
          stagger={4}
          delay={18}
          style={{
            fontFamily: serifBody,
            fontWeight: 400,
            fontSize: 32,
            color: COLORS.goldPale,
            marginTop: 12,
          }}
        />

        <div
          style={{
            marginTop: 48,
            opacity: interpolate(btnP, [0, 1], [0, 1]),
            transform: `scale(${interpolate(btnP, [0, 1], [0.9, 1])})`,
            position: 'relative',
          }}
        >
          <div
            style={{
              position: 'absolute',
              inset: -14,
              borderRadius: 28,
              background: COLORS.gold,
              opacity: glow,
              filter: 'blur(22px)',
            }}
          />
          <div
            style={{
              position: 'relative',
              fontFamily: sans,
              fontSize: 26,
              fontWeight: 800,
              color: COLORS.background,
              background: GRADIENTS.gold,
              padding: '22px 42px',
              borderRadius: 18,
              letterSpacing: '0.02em',
            }}
          >
            Get started free
          </div>
        </div>

        <div
          style={{
            marginTop: 36,
            fontFamily: sans,
            fontSize: 22,
            fontWeight: 600,
            color: COLORS.muted,
            letterSpacing: '0.08em',
            opacity: interpolate(springIn(frame, fps, 28), [0, 1], [0, 1]),
          }}
        >
          {script.urlPath}
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

export const UseCaseReel: React.FC<UseCaseReelProps> = ({ scriptId }) => {
  const script = getScriptById(scriptId);
  const fadeT = linearTiming({ durationInFrames: TRANSITION });
  const slideT = linearTiming({ durationInFrames: TRANSITION });

  return (
    <AbsoluteFill style={{ background: COLORS.background }}>
      <TransitionSeries>
        <TransitionSeries.Sequence durationInFrames={HOOK}>
          <HookScene script={script} />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={fade()} timing={fadeT} />

        <TransitionSeries.Sequence durationInFrames={PAIN}>
          <PainScene script={script} />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition
          presentation={slide({ direction: 'from-bottom' })}
          timing={slideT}
        />

        <TransitionSeries.Sequence durationInFrames={TURN}>
          <TurnScene script={script} />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={fade()} timing={fadeT} />

        <TransitionSeries.Sequence durationInFrames={FEATURE}>
          <FeatureScene script={script} index={0} clip={script.clips[0]} />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={fade()} timing={fadeT} />

        <TransitionSeries.Sequence durationInFrames={FEATURE}>
          <FeatureScene script={script} index={1} clip={script.clips[2]} />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={fade()} timing={fadeT} />

        <TransitionSeries.Sequence durationInFrames={FEATURE}>
          <FeatureScene script={script} index={2} clip={script.clips[3]} />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={fade()} timing={fadeT} />

        <TransitionSeries.Sequence durationInFrames={CTA}>
          <CtaScene script={script} />
        </TransitionSeries.Sequence>
      </TransitionSeries>
    </AbsoluteFill>
  );
};

export { FPS as USE_CASE_REEL_FPS };
