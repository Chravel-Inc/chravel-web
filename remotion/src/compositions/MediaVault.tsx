import {
  AbsoluteFill,
  Sequence,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import { loadFont } from '@remotion/google-fonts/Inter';
import { COLORS, SPRING, TIMING, SHADOWS, FPS } from '../theme';
import { PhoneFrame } from '../components/PhoneFrame';
import { TravelBackground } from '../components/TravelBackground';
import { EndCard } from '../components/EndCard';
import { MediaScreen } from '../components/mockscreens/MediaScreen';

const { fontFamily } = loadFont('normal', {
  weights: ['400', '600', '700', '800'],
  subsets: ['latin'],
});

export const MEDIA_VAULT_DURATION = 10 * FPS; // 300 frames

/** Deterministic colors for flying photo thumbnails */
const FLYING_PHOTOS = [
  { color: '#1a3a5a', startX: -400, startY: -200, delay: 40 },
  { color: '#3a2a4a', startX: 400, startY: -150, delay: 50 },
  { color: '#2a4a3a', startX: -300, startY: 200, delay: 60 },
  { color: '#4a3a2a', startX: 350, startY: 250, delay: 70 },
  { color: '#1a4a4a', startX: -200, startY: -300, delay: 80 },
];

/** Scene: Media Vault — photos cascade into phone, gallery assembles, shared indicators */
export const MediaVault: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Title
  const titleProgress = spring({ frame, fps, delay: 5, config: SPRING.smooth });

  return (
    <AbsoluteFill>
      <TravelBackground variant="particles" />

      {/* Title overlay */}
      <div
        style={{
          position: 'absolute',
          top: 80,
          left: 100,
          opacity: interpolate(titleProgress, [0, 1], [0, 1]),
          transform: `translateY(${interpolate(titleProgress, [0, 1], [20, 0])}px)`,
        }}
      >
        <div style={{ fontFamily, fontSize: 42, fontWeight: 800, color: COLORS.white }}>
          Every Photo.
        </div>
        <div style={{ fontFamily, fontSize: 42, fontWeight: 800, color: COLORS.gold }}>
          One Place.
        </div>
        <div
          style={{ fontFamily, fontSize: 20, fontWeight: 400, color: COLORS.muted, marginTop: 12 }}
        >
          Shared albums that everyone contributes to.
        </div>
      </div>

      {/* Flying photos that converge into the phone */}
      {FLYING_PHOTOS.map((photo, i) => {
        const flyProgress = spring({
          frame,
          fps,
          delay: photo.delay,
          config: SPRING.gentle,
        });
        const x = interpolate(flyProgress, [0, 1], [photo.startX, 0]);
        const y = interpolate(flyProgress, [0, 1], [photo.startY, 0]);
        const scale = interpolate(flyProgress, [0, 1], [0.6, 0]);
        const opacity = interpolate(flyProgress, [0, 0.7, 1], [0, 0.8, 0]);
        const rotation = interpolate(flyProgress, [0, 1], [15 * (i % 2 === 0 ? 1 : -1), 0]);

        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: '50%',
              top: '50%',
              width: 80,
              height: 80,
              borderRadius: 8,
              background: `linear-gradient(135deg, ${photo.color} 0%, ${photo.color}80 100%)`,
              transform: `translate(calc(-50% + ${x}px), calc(-50% + ${y}px)) scale(${scale}) rotate(${rotation}deg)`,
              opacity,
              boxShadow: SHADOWS.card,
            }}
          />
        );
      })}

      {/* Main phone with media gallery */}
      <PhoneFrame scale={0.9} x={80} y={20} delay={10} float>
        <MediaScreen animationDelay={15} />
      </PhoneFrame>

      {/* Upload counter */}
      <div
        style={{
          position: 'absolute',
          right: 180,
          bottom: 200,
        }}
      >
        {[0, 1, 2].map(i => {
          const avatarProgress = spring({
            frame,
            fps,
            delay: 100 + i * 10,
            config: SPRING.snappy,
          });
          return (
            <div
              key={i}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                background: COLORS.surface,
                border: `1px solid ${COLORS.border}`,
                borderRadius: 20,
                padding: '6px 12px',
                marginBottom: 8,
                opacity: interpolate(avatarProgress, [0, 1], [0, 1]),
                transform: `translateX(${interpolate(avatarProgress, [0, 1], [20, 0])}px)`,
              }}
            >
              <div
                style={{
                  width: 20,
                  height: 20,
                  borderRadius: '50%',
                  background: [COLORS.chatBlue, COLORS.gold, COLORS.paymentGreen][i],
                }}
              />
              <div style={{ fontFamily, fontSize: 12, fontWeight: 600, color: COLORS.white }}>
                {['Sarah added 12 photos', 'Mike added 8 photos', 'You added 15 photos'][i]}
              </div>
            </div>
          );
        })}
      </div>

      {/* End card */}
      <Sequence from={MEDIA_VAULT_DURATION - TIMING.endCard}>
        <EndCard />
      </Sequence>
    </AbsoluteFill>
  );
};
