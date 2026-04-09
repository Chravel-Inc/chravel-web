import { useCurrentFrame, useVideoConfig, interpolate, spring, Img, staticFile } from 'remotion';
import { loadFont } from '@remotion/google-fonts/Inter';
import { COLORS, SPRING } from '../theme';

const { fontFamily } = loadFont('normal', {
  weights: ['600', '700'],
  subsets: ['latin'],
});

type CarouselItem = {
  src: string;
  label: string;
};

type ScreenshotCarouselProps = {
  items: CarouselItem[];
  frameDuration: number; // total frames for this carousel
};

export const ScreenshotCarousel: React.FC<ScreenshotCarouselProps> = ({
  items,
  frameDuration,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const perItem = Math.floor(frameDuration / items.length);

  const currentIndex = Math.min(Math.floor(frame / perItem), items.length - 1);
  const localFrame = frame - currentIndex * perItem;

  // Entrance spring for each item
  const entrance = spring({
    frame: localFrame,
    fps,
    config: SPRING.snappy,
  });
  const slideX = interpolate(entrance, [0, 1], [80, 0]);
  const opacity = interpolate(entrance, [0, 1], [0, 1]);

  // Label entrance
  const labelProgress = spring({
    frame: localFrame,
    fps,
    delay: 8,
    config: SPRING.smooth,
  });
  const labelOpacity = interpolate(labelProgress, [0, 1], [0, 1]);
  const labelY = interpolate(labelProgress, [0, 1], [15, 0]);

  const item = items[currentIndex];

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 24,
      }}
    >
      {/* Screenshot in phone frame area */}
      <div
        style={{
          opacity,
          transform: `translateX(${slideX}px)`,
          borderRadius: 24,
          overflow: 'hidden',
          boxShadow: '0 20px 60px rgba(0,0,0,0.6)',
          width: 300,
          height: 650,
        }}
      >
        <Img
          src={staticFile(item.src)}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
          }}
        />
      </div>

      {/* Feature label */}
      <div
        style={{
          fontFamily,
          fontSize: 32,
          fontWeight: 700,
          color: COLORS.gold,
          letterSpacing: 2,
          textTransform: 'uppercase',
          opacity: labelOpacity,
          transform: `translateY(${labelY}px)`,
        }}
      >
        {item.label}
      </div>
    </div>
  );
};
