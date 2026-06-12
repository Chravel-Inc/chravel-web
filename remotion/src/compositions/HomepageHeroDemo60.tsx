import React from 'react';
import {
  AbsoluteFill,
  Img,
  Sequence,
  interpolate,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import { loadFont } from '@remotion/google-fonts/Inter';

const { fontFamily } = loadFont('normal', { weights: ['400', '600', '800'] });

/**
 * 60-second product walkthrough composed from REAL screenshots of the running
 * ChravelApp demo trip (Tokyo Adventure). No AI-generated UI. Each scene is a
 * Ken Burns push on a real screenshot with a gold caption.
 */

const FPS = 30;
export const HOMEPAGE_HERO_60_DURATION = FPS * 60; // 1800

interface SceneSpec {
  file: string;
  caption: string;
  // Crop focus for Ken Burns push (0..1 in image space)
  focusX?: number;
  focusY?: number;
}

const SCENES: SceneSpec[] = [
  {
    file: '00-dashboard.png',
    caption: 'Every group trip gets one private home.',
    focusX: 0.5,
    focusY: 0.35,
  },
  {
    file: '01-overview-chat.png',
    caption: 'Tokyo Adventure · 12 people · Oct 5 – Oct 15',
    focusX: 0.5,
    focusY: 0.25,
  },
  {
    file: '01-overview-chat.png',
    caption: 'Group chat — no more buried plans.',
    focusX: 0.5,
    focusY: 0.85,
  },
  {
    file: '02-calendar.png',
    caption: 'Everyone sees the same schedule.',
    focusX: 0.5,
    focusY: 0.75,
  },
  {
    file: '06-places.png',
    caption: 'Save hotels and basecamps once.',
    focusX: 0.5,
    focusY: 0.8,
  },
  {
    file: '05-payments.png',
    caption: 'Track who paid, who owes, what’s settled.',
    focusX: 0.5,
    focusY: 0.75,
  },
  {
    file: '07-polls.png',
    caption: 'Decide as a group — sushi, ramen, or izakaya?',
    focusX: 0.5,
    focusY: 0.78,
  },
  {
    file: '08-tasks.png',
    caption: 'Assign ownership. Keep moving.',
    focusX: 0.5,
    focusY: 0.8,
  },
  {
    file: '03-concierge.png',
    caption: 'Ask AI anything about your trip.',
    focusX: 0.5,
    focusY: 0.8,
  },
  {
    file: '04-media.png',
    caption: 'Photos, files, confirmations — one place.',
    focusX: 0.5,
    focusY: 0.85,
  },
];

const SCENE_FRAMES = Math.floor(HOMEPAGE_HERO_60_DURATION / SCENES.length); // 180
const FADE_FRAMES = 18;

const Caption: React.FC<{ text: string; localFrame: number }> = ({ text, localFrame }) => {
  const opacity = interpolate(
    localFrame,
    [0, 14, SCENE_FRAMES - 18, SCENE_FRAMES - 4],
    [0, 1, 1, 0],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' },
  );
  const lift = interpolate(localFrame, [0, 20], [18, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  return (
    <div
      style={{
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 56,
        display: 'flex',
        justifyContent: 'center',
        opacity,
        transform: `translateY(${lift}px)`,
        zIndex: 5,
        pointerEvents: 'none',
      }}
    >
      <div
        style={{
          fontFamily,
          fontWeight: 600,
          fontSize: 44,
          letterSpacing: -0.5,
          padding: '18px 36px',
          color: '#FEEAA5',
          background: 'rgba(8, 10, 18, 0.72)',
          border: '1px solid rgba(196, 151, 70, 0.45)',
          borderRadius: 999,
          boxShadow: '0 24px 60px rgba(0,0,0,0.55), 0 0 0 1px rgba(255,255,255,0.04) inset',
          backdropFilter: 'blur(6px)' as unknown as undefined,
        }}
      >
        {text}
      </div>
    </div>
  );
};

const ProductFrame: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div
    style={{
      position: 'absolute',
      inset: 64,
      borderRadius: 24,
      overflow: 'hidden',
      background: '#070B1A',
      boxShadow:
        '0 60px 120px rgba(0,0,0,0.7), 0 0 0 1px rgba(254, 234, 165, 0.18), 0 0 80px rgba(196,151,70,0.18)',
    }}
  >
    {children}
  </div>
);

const Scene: React.FC<{ spec: SceneSpec; localFrame: number }> = ({ spec, localFrame }) => {
  // Slow Ken Burns push from 1.0 -> 1.06
  const scale = interpolate(localFrame, [0, SCENE_FRAMES], [1.0, 1.06], {
    extrapolateRight: 'clamp',
  });
  const focusX = (spec.focusX ?? 0.5) * 100;
  const focusY = (spec.focusY ?? 0.5) * 100;

  return (
    <AbsoluteFill>
      {/* Gold-lit background */}
      <AbsoluteFill
        style={{
          background:
            'radial-gradient(circle at 30% 20%, rgba(196,151,70,0.22), transparent 55%), radial-gradient(circle at 80% 90%, rgba(83,53,23,0.35), transparent 60%), #05070F',
        }}
      />
      <ProductFrame>
        <div
          style={{
            position: 'absolute',
            inset: 0,
            transform: `scale(${scale})`,
            transformOrigin: `${focusX}% ${focusY}%`,
            transition: 'none',
          }}
        >
          <Img
            src={staticFile(`marketing/${spec.file}`)}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              objectPosition: `${focusX}% ${focusY}%`,
              display: 'block',
            }}
          />
        </div>
        {/* Bottom vignette so caption sits cleanly */}
        <div
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            bottom: 0,
            height: 260,
            background:
              'linear-gradient(to top, rgba(5,7,15,0.92), rgba(5,7,15,0.55) 55%, rgba(5,7,15,0))',
            pointerEvents: 'none',
          }}
        />
      </ProductFrame>
      <Caption text={spec.caption} localFrame={localFrame} />
    </AbsoluteFill>
  );
};

const Outro: React.FC<{ frame: number }> = ({ frame }) => {
  const fade = interpolate(frame, [0, 24], [0, 1], { extrapolateRight: 'clamp' });
  const lift = interpolate(frame, [0, 30], [20, 0], { extrapolateRight: 'clamp' });
  return (
    <AbsoluteFill
      style={{
        background:
          'radial-gradient(circle at 50% 40%, rgba(196,151,70,0.18), transparent 60%), #05070F',
        opacity: fade,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        transform: `translateY(${lift}px)`,
      }}
    >
      <div
        style={{
          fontFamily,
          fontWeight: 800,
          fontSize: 110,
          color: '#FEEAA5',
          letterSpacing: -2,
          textShadow: '0 8px 40px rgba(0,0,0,0.6)',
        }}
      >
        Less Chaos.
      </div>
      <div
        style={{
          fontFamily,
          fontWeight: 800,
          fontSize: 110,
          color: '#FFFFFF',
          letterSpacing: -2,
          textShadow: '0 8px 40px rgba(0,0,0,0.6)',
          marginTop: 8,
        }}
      >
        More Coordination.
      </div>
      <div
        style={{
          fontFamily,
          fontWeight: 600,
          fontSize: 36,
          color: 'rgba(255,255,255,0.7)',
          marginTop: 36,
          letterSpacing: 0.5,
        }}
      >
        Start your next group trip on ChravelApp · chravel.app
      </div>
    </AbsoluteFill>
  );
};

export const HomepageHeroDemo60: React.FC = () => {
  const frame = useCurrentFrame();
  useVideoConfig();

  // Show outro in the final 90 frames overlapping the last scene fade-out
  const outroStart = HOMEPAGE_HERO_60_DURATION - 90;
  const outroLocal = frame - outroStart;
  const outroOpacity = interpolate(outroLocal, [0, 20], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <AbsoluteFill style={{ background: '#05070F' }}>
      {SCENES.map((spec, i) => {
        const start = i * SCENE_FRAMES;
        const end = start + SCENE_FRAMES;
        // Render only scenes near the playhead to keep memory low
        if (frame < start - FADE_FRAMES || frame > end + FADE_FRAMES) return null;
        const local = frame - start;
        const inFade = interpolate(local, [0, FADE_FRAMES], [0, 1], {
          extrapolateLeft: 'clamp',
          extrapolateRight: 'clamp',
        });
        const outFade = interpolate(local, [SCENE_FRAMES - FADE_FRAMES, SCENE_FRAMES], [1, 0], {
          extrapolateLeft: 'clamp',
          extrapolateRight: 'clamp',
        });
        const opacity = Math.min(inFade, outFade);
        return (
          <Sequence key={i} from={start} durationInFrames={SCENE_FRAMES + FADE_FRAMES}>
            <AbsoluteFill style={{ opacity }}>
              <Scene spec={spec} localFrame={Math.max(0, local)} />
            </AbsoluteFill>
          </Sequence>
        );
      })}

      {/* Outro overlay */}
      {outroLocal > -5 && (
        <AbsoluteFill style={{ opacity: outroOpacity }}>
          <Outro frame={Math.max(0, outroLocal)} />
        </AbsoluteFill>
      )}
    </AbsoluteFill>
  );
};
