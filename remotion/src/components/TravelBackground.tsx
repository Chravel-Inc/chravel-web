import { AbsoluteFill, interpolate, useCurrentFrame } from 'remotion';
import { COLORS, GRADIENTS } from '../theme';

type TravelBackgroundProps = {
  variant?: 'gradient' | 'particles' | 'gold-ambient';
};

/** Seed-based pseudo-random for deterministic particle positions */
const seededRandom = (seed: number): number => {
  const x = Math.sin(seed * 9301 + 49297) * 49297;
  return x - Math.floor(x);
};

const PARTICLE_COUNT = 20;

const particles = Array.from({ length: PARTICLE_COUNT }, (_, i) => ({
  x: seededRandom(i * 3 + 1) * 100,
  y: seededRandom(i * 3 + 2) * 100,
  size: 2 + seededRandom(i * 3 + 3) * 3,
  speed: 0.3 + seededRandom(i * 3 + 4) * 0.7,
  phase: seededRandom(i * 3 + 5) * Math.PI * 2,
  opacity: 0.08 + seededRandom(i * 3 + 6) * 0.12,
}));

export const TravelBackground: React.FC<TravelBackgroundProps> = ({ variant = 'gradient' }) => {
  const frame = useCurrentFrame();

  return (
    <AbsoluteFill>
      {/* Base dark gradient */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: GRADIENTS.backgroundRadial,
        }}
      />

      {/* Gold ambient glow */}
      {(variant === 'gold-ambient' || variant === 'particles') && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: GRADIENTS.goldAmbient,
            opacity: interpolate(frame, [0, 30], [0, 1], {
              extrapolateRight: 'clamp',
            }),
          }}
        />
      )}

      {/* Floating particles */}
      {variant === 'particles' &&
        particles.map((p, i) => {
          const offsetX = Math.sin(frame * 0.01 * p.speed + p.phase) * 30;
          const offsetY = Math.cos(frame * 0.008 * p.speed + p.phase) * 20;
          const fadeIn = interpolate(frame, [0, 40], [0, 1], {
            extrapolateRight: 'clamp',
          });

          return (
            <div
              key={i}
              style={{
                position: 'absolute',
                left: `${p.x}%`,
                top: `${p.y}%`,
                width: p.size,
                height: p.size,
                borderRadius: '50%',
                background: COLORS.gold,
                opacity: p.opacity * fadeIn,
                transform: `translate(${offsetX}px, ${offsetY}px)`,
              }}
            />
          );
        })}

      {/* Subtle top/bottom vignette */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: `linear-gradient(180deg, rgba(0,0,0,0.3) 0%, transparent 15%, transparent 85%, rgba(0,0,0,0.3) 100%)`,
        }}
      />
    </AbsoluteFill>
  );
};
