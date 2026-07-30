import {
  AbsoluteFill,
  Img,
  interpolate,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
  Video,
} from 'remotion';
import { COLORS } from '../../theme';

type CinematicBackgroundProps = {
  /** Relative to public/usecases/broll/ready/ */
  clip?: string;
  /** Relative to public/usecases/stills/ */
  still?: string;
  /** 0–1 darkness of cinematic grade */
  vignette?: number;
  /** Extra gold ambient */
  goldWash?: boolean;
  /** Ken Burns intensity for stills */
  kenBurns?: boolean;
};

/**
 * Full-bleed cinematic plate — real stock video or brand still with grade.
 * Text stays crisp via Remotion; people/places come from real footage.
 */
export const CinematicBackground: React.FC<CinematicBackgroundProps> = ({
  clip,
  still,
  vignette = 0.55,
  goldWash = true,
  kenBurns = true,
}) => {
  const frame = useCurrentFrame();
  const { durationInFrames, width, height } = useVideoConfig();

  const scale = kenBurns
    ? interpolate(frame, [0, durationInFrames], [1.08, 1.18], {
        extrapolateRight: 'clamp',
      })
    : 1.05;
  const panX = kenBurns
    ? interpolate(frame, [0, durationInFrames], [0, -24], {
        extrapolateRight: 'clamp',
      })
    : 0;
  const panY = kenBurns
    ? interpolate(frame, [0, durationInFrames], [0, -12], {
        extrapolateRight: 'clamp',
      })
    : 0;

  return (
    <AbsoluteFill style={{ background: COLORS.background, overflow: 'hidden' }}>
      <AbsoluteFill
        style={{
          transform: `translate(${panX}px, ${panY}px) scale(${scale})`,
          transformOrigin: 'center center',
        }}
      >
        {clip ? (
          <Video
            src={staticFile(`usecases/broll/ready/${clip}`)}
            muted
            style={{
              width,
              height,
              objectFit: 'cover',
            }}
          />
        ) : still ? (
          <Img
            src={staticFile(`usecases/stills/${still}`)}
            style={{
              width,
              height,
              objectFit: 'cover',
            }}
          />
        ) : (
          <AbsoluteFill style={{ background: COLORS.background }} />
        )}
      </AbsoluteFill>

      {/* Cinematic grade — warm shadow + cool lift */}
      <AbsoluteFill
        style={{
          background: `linear-gradient(180deg,
            rgba(0,0,0,${vignette * 0.75}) 0%,
            rgba(0,0,0,${vignette * 0.25}) 38%,
            rgba(0,0,0,${vignette * 0.35}) 62%,
            rgba(0,0,0,${Math.min(0.92, vignette + 0.25)}) 100%)`,
        }}
      />

      {/* Side vignette for vertical safe text */}
      <AbsoluteFill
        style={{
          background: `radial-gradient(ellipse at 50% 45%,
            transparent 0%,
            transparent 42%,
            rgba(0,0,0,${vignette * 0.55}) 100%)`,
        }}
      />

      {goldWash ? (
        <AbsoluteFill
          style={{
            background:
              'radial-gradient(ellipse at 50% 85%, rgba(196,151,70,0.18) 0%, transparent 55%)',
            mixBlendMode: 'screen',
          }}
        />
      ) : null}

      {/* Film grain suggestion via fine noise overlay (CSS only) */}
      <AbsoluteFill
        style={{
          opacity: 0.06,
          backgroundImage:
            'repeating-linear-gradient(0deg, rgba(255,255,255,0.04) 0, rgba(255,255,255,0.04) 1px, transparent 1px, transparent 3px)',
          pointerEvents: 'none',
        }}
      />
    </AbsoluteFill>
  );
};
