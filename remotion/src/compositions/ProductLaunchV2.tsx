import {
  AbsoluteFill,
  Sequence,
  Img,
  staticFile,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import { loadFont } from '@remotion/google-fonts/Inter';
import { LogoReveal } from '../components/LogoReveal';
import { TextReveal } from '../components/TextReveal';
import { BrowserFrame } from '../components/BrowserFrame';
import { ScreenshotCarousel } from '../components/ScreenshotCarousel';
import { CallToAction } from '../components/CallToAction';
import { EndCard } from '../components/EndCard';
import { PhoneFrame } from '../components/PhoneFrame';
import { COLORS, SPRING } from '../theme';

const { fontFamily } = loadFont('normal', {
  weights: ['400', '600', '700', '800'],
  subsets: ['latin'],
});

export const PRODUCT_LAUNCH_V2_DURATION = 900; // 30s at 30fps

const MOBILE_CAROUSEL_1 = [
  { src: 'screenshots/mobile/02-trip-chat.png', label: 'Group Chat' },
  { src: 'screenshots/mobile/03-calendar-itinerary.png', label: 'Calendar' },
  { src: 'screenshots/mobile/04-ai-concierge.png', label: 'AI Concierge' },
  { src: 'screenshots/mobile/05-expense-splitting.png', label: 'Split Expenses' },
];

const MOBILE_CAROUSEL_2 = [
  { src: 'screenshots/mobile/06-maps-places.png', label: 'Maps & Places' },
  { src: 'screenshots/mobile/07-media-gallery.png', label: 'Media Gallery' },
  { src: 'screenshots/mobile/08-polls-voting.png', label: 'Polls & Voting' },
  { src: 'screenshots/mobile/01-home-dashboard.png', label: 'Trip Dashboard' },
];

/** Scene 5: Side-by-side web + mobile */
const SideBySideScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const webEntrance = spring({ frame, fps, config: SPRING.gentle });
  const webX = interpolate(webEntrance, [0, 1], [-120, 0]);
  const webOpacity = interpolate(webEntrance, [0, 1], [0, 1]);

  const phoneEntrance = spring({ frame, fps, delay: 10, config: SPRING.gentle });
  const phoneX = interpolate(phoneEntrance, [0, 1], [120, 0]);
  const phoneOpacity = interpolate(phoneEntrance, [0, 1], [0, 1]);

  const labelProgress = spring({ frame, fps, delay: 20, config: SPRING.smooth });
  const labelOpacity = interpolate(labelProgress, [0, 1], [0, 1]);
  const labelY = interpolate(labelProgress, [0, 1], [20, 0]);

  return (
    <AbsoluteFill
      style={{
        background: COLORS.background,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {/* Gold ambient glow */}
      <div
        style={{
          position: 'absolute',
          width: 800,
          height: 800,
          borderRadius: '50%',
          background: `radial-gradient(circle, ${COLORS.gold}15 0%, transparent 60%)`,
        }}
      />

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 80,
        }}
      >
        {/* Web browser */}
        <div
          style={{
            opacity: webOpacity,
            transform: `translateX(${webX}px)`,
          }}
        >
          <BrowserFrame width={720} height={440} url="chravel.app">
            <Img
              src={staticFile('screenshots/web/01-dashboard.png')}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          </BrowserFrame>
        </div>

        {/* Mobile phone */}
        <div
          style={{
            opacity: phoneOpacity,
            transform: `translateX(${phoneX}px)`,
          }}
        >
          <PhoneFrame scale={0.85} float={false} delay={0}>
            <Img
              src={staticFile('screenshots/mobile/02-trip-chat.png')}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          </PhoneFrame>
        </div>
      </div>

      {/* Label */}
      <div
        style={{
          position: 'absolute',
          bottom: 80,
          fontFamily,
          fontSize: 36,
          fontWeight: 700,
          color: COLORS.white,
          textAlign: 'center',
          opacity: labelOpacity,
          transform: `translateY(${labelY}px)`,
        }}
      >
        Web & Mobile. <span style={{ color: COLORS.gold }}>One Platform.</span>
      </div>
    </AbsoluteFill>
  );
};

/** Scene 3: Web Dashboard in browser frame */
const WebShowcaseScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const labelProgress = spring({ frame, fps, delay: 15, config: SPRING.smooth });
  const labelOpacity = interpolate(labelProgress, [0, 1], [0, 1]);
  const labelY = interpolate(labelProgress, [0, 1], [20, 0]);

  return (
    <AbsoluteFill
      style={{
        background: COLORS.background,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <div
        style={{
          position: 'absolute',
          width: 1000,
          height: 1000,
          borderRadius: '50%',
          background: `radial-gradient(circle, ${COLORS.gold}10 0%, transparent 50%)`,
        }}
      />

      <BrowserFrame width={1100} height={660} delay={0} url="chravel.app">
        <Img
          src={staticFile('screenshots/web/01-dashboard.png')}
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
      </BrowserFrame>

      <div
        style={{
          position: 'absolute',
          bottom: 50,
          fontFamily,
          fontSize: 28,
          fontWeight: 600,
          color: COLORS.muted,
          opacity: labelOpacity,
          transform: `translateY(${labelY}px)`,
          letterSpacing: 1,
        }}
      >
        Your trips. All in one place.
      </div>
    </AbsoluteFill>
  );
};

/** Scene 4/6: Mobile carousel wrapper */
const MobileCarouselScene: React.FC<{
  items: { src: string; label: string }[];
  duration: number;
}> = ({ items, duration }) => {
  return (
    <AbsoluteFill
      style={{
        background: COLORS.background,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <div
        style={{
          position: 'absolute',
          width: 600,
          height: 600,
          borderRadius: '50%',
          background: `radial-gradient(circle, ${COLORS.gold}12 0%, transparent 55%)`,
        }}
      />
      <ScreenshotCarousel items={items} frameDuration={duration} />
    </AbsoluteFill>
  );
};

export const ProductLaunchV2: React.FC = () => {
  // Scene timings (frames)
  const S1 = 80; // Logo reveal
  const S2 = 80; // Text reveal
  const S3 = 140; // Web dashboard
  const S4 = 220; // Mobile carousel 1
  const S5 = 140; // Side by side
  const S6 = 120; // Mobile carousel 2
  const S7 = 120; // CTA + End card

  let offset = 0;

  return (
    <AbsoluteFill style={{ background: COLORS.background }}>
      {/* Scene 1: Logo Reveal */}
      <Sequence from={offset} durationInFrames={S1}>
        <LogoReveal />
      </Sequence>

      {/* Scene 2: Text Reveal */}
      <Sequence from={(offset += S1)} durationInFrames={S2}>
        <TextReveal
          heading="Group Travel Made Easy"
          subheading="For Friends, Families, Sports Teams, Tours & More"
          goldWord="Easy"
        />
      </Sequence>

      {/* Scene 3: Web Dashboard */}
      <Sequence from={(offset += S2)} durationInFrames={S3}>
        <WebShowcaseScene />
      </Sequence>

      {/* Scene 4: Mobile Carousel 1 */}
      <Sequence from={(offset += S3)} durationInFrames={S4}>
        <MobileCarouselScene items={MOBILE_CAROUSEL_1} duration={S4} />
      </Sequence>

      {/* Scene 5: Side by Side */}
      <Sequence from={(offset += S4)} durationInFrames={S5}>
        <SideBySideScene />
      </Sequence>

      {/* Scene 6: Mobile Carousel 2 */}
      <Sequence from={(offset += S5)} durationInFrames={S6}>
        <MobileCarouselScene items={MOBILE_CAROUSEL_2} duration={S6} />
      </Sequence>

      {/* Scene 7: CTA */}
      <Sequence from={(offset += S6)} durationInFrames={S7 - 60}>
        <CallToAction />
      </Sequence>

      {/* End Card */}
      <Sequence from={offset + S7 - 60} durationInFrames={60}>
        <EndCard />
      </Sequence>
    </AbsoluteFill>
  );
};
