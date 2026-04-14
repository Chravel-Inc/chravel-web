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
import { VoiceConciergeScreen } from '../components/mockscreens/VoiceConciergeScreen';
import { AndroidNotificationBar } from '../components/AndroidNotificationBar';
import { AndroidHomeScreen } from '../components/AndroidHomeScreen';

const { fontFamily } = loadFont('normal', {
  weights: ['400', '500', '600', '700', '800'],
  subsets: ['latin'],
});

// Scene durations (frames at 30fps)
const S1_TITLE = 150; // 5s — Title card
const S2_VOICE_SESSION = 300; // 10s — Voice session starts
const S3_BACKGROUND = 210; // 7s — App goes to background
const S4_SPLIT_VIEW = 240; // 8s — Split view persistence proof
const S5_RETURN = 210; // 7s — Return to app
const S6_END_CARD = TIMING.endCard; // 3s — End card

export const GOOGLE_PLAY_VOICE_DEMO_DURATION =
  S1_TITLE + S2_VOICE_SESSION + S3_BACKGROUND + S4_SPLIT_VIEW + S5_RETURN + S6_END_CARD;
// = 1200 frames = 40 seconds

/* ── Scene 1: Title Card ── */
const TitleCardScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const heading1 = spring({ frame, fps, delay: 5, config: SPRING.smooth });
  const heading2 = spring({ frame, fps, delay: 12, config: SPRING.smooth });
  const lineReveal = spring({ frame, fps, delay: 18, config: SPRING.smooth });
  const subtitle = spring({ frame, fps, delay: 25, config: SPRING.smooth });
  const badge = spring({ frame, fps, delay: 40, config: SPRING.snappy });

  return (
    <AbsoluteFill>
      <TravelBackground variant="gold-ambient" />
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {/* Heading line 1 */}
        <div
          style={{
            fontFamily,
            fontSize: 72,
            fontWeight: 800,
            color: COLORS.white,
            letterSpacing: '-0.01em',
            opacity: interpolate(heading1, [0, 1], [0, 1]),
            transform: `translateY(${interpolate(heading1, [0, 1], [30, 0])}px)`,
          }}
        >
          Voice AI Concierge
        </div>

        {/* Heading line 2 */}
        <div
          style={{
            fontFamily,
            fontSize: 72,
            fontWeight: 800,
            color: COLORS.gold,
            letterSpacing: '-0.01em',
            opacity: interpolate(heading2, [0, 1], [0, 1]),
            transform: `translateY(${interpolate(heading2, [0, 1], [30, 0])}px)`,
          }}
        >
          Media Playback
        </div>

        {/* Gold accent line */}
        <div
          style={{
            width: interpolate(lineReveal, [0, 1], [0, 100]),
            height: 3,
            background: COLORS.gold,
            borderRadius: 2,
            marginTop: 20,
          }}
        />

        {/* Subtitle */}
        <div
          style={{
            fontFamily,
            fontSize: 28,
            fontWeight: 400,
            color: COLORS.muted,
            marginTop: 24,
            opacity: interpolate(subtitle, [0, 1], [0, 1]),
            transform: `translateY(${interpolate(subtitle, [0, 1], [20, 0])}px)`,
          }}
        >
          Foreground service for real-time voice streaming
        </div>

        {/* Android badge */}
        <div
          style={{
            marginTop: 32,
            opacity: interpolate(badge, [0, 1], [0, 1]),
            transform: `scale(${interpolate(badge, [0, 1], [0.8, 1])})`,
          }}
        >
          <div
            style={{
              fontFamily,
              fontSize: 14,
              fontWeight: 600,
              color: '#a4c639',
              background: 'rgba(164,198,57,0.12)',
              border: '1px solid rgba(164,198,57,0.25)',
              borderRadius: 20,
              padding: '6px 18px',
              letterSpacing: '0.5px',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <span style={{ fontSize: 18 }}>🤖</span>
            Android
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

/* ── Scene 2: Voice Session Start ── */
const VoiceSessionScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Title overlay
  const titleProgress = spring({ frame, fps, delay: 5, config: SPRING.smooth });

  // Determine voice state based on frame
  const voiceState: 'idle' | 'connecting' | 'listening' | 'speaking' =
    frame < 15 ? 'idle' : frame < 30 ? 'connecting' : frame < 150 ? 'listening' : 'speaking';

  // Floating annotation cards
  const card1Progress = spring({ frame, fps, delay: 180, config: SPRING.snappy });
  const card2Progress = spring({ frame, fps, delay: 210, config: SPRING.snappy });

  return (
    <AbsoluteFill>
      <TravelBackground variant="gold-ambient" />

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
          Voice AI
        </div>
        <div style={{ fontFamily, fontSize: 42, fontWeight: 800, color: COLORS.gold }}>
          Concierge
        </div>
        <div
          style={{ fontFamily, fontSize: 20, fontWeight: 400, color: COLORS.muted, marginTop: 12 }}
        >
          Real-time duplex voice streaming
        </div>
      </div>

      {/* Phone with voice concierge */}
      <PhoneFrame scale={0.9} x={80} y={20} delay={10} float>
        <VoiceConciergeScreen
          animationDelay={15}
          voiceState={voiceState}
          showMicTap
          waveformActive={frame > 30}
          userTranscript="What's the best restaurant near our hotel?"
          assistantTranscript={
            frame > 150
              ? "I found 3 highly-rated restaurants within walking distance. Let me tell you about the top pick — it's a beachfront spot with incredible reviews..."
              : undefined
          }
        />
      </PhoneFrame>

      {/* Floating card 1: Audio Streaming Active */}
      <div
        style={{
          position: 'absolute',
          right: 120,
          top: 320,
          opacity: interpolate(card1Progress, [0, 1], [0, 1]),
          transform: `translateX(${interpolate(card1Progress, [0, 1], [30, 0])}px) scale(${interpolate(card1Progress, [0, 1], [0.9, 1])})`,
        }}
      >
        <div
          style={{
            background: COLORS.surface,
            border: `1px solid ${COLORS.gold}30`,
            borderRadius: 12,
            padding: '12px 16px',
            boxShadow: SHADOWS.goldGlowSubtle,
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            maxWidth: 280,
          }}
        >
          <div style={{ fontSize: 24 }}>🔊</div>
          <div>
            <div style={{ fontFamily, fontSize: 14, fontWeight: 600, color: COLORS.white }}>
              Audio Streaming Active
            </div>
            <div style={{ fontFamily, fontSize: 11, color: COLORS.muted }}>
              24kHz PCM &middot; Gemini Live
            </div>
          </div>
        </div>
      </div>

      {/* Floating card 2: Foreground Service */}
      <div
        style={{
          position: 'absolute',
          right: 140,
          top: 420,
          opacity: interpolate(card2Progress, [0, 1], [0, 1]),
          transform: `translateX(${interpolate(card2Progress, [0, 1], [30, 0])}px) scale(${interpolate(card2Progress, [0, 1], [0.9, 1])})`,
        }}
      >
        <div
          style={{
            background: COLORS.surface,
            border: `1px solid ${COLORS.gold}30`,
            borderRadius: 12,
            padding: '12px 16px',
            boxShadow: SHADOWS.goldGlowSubtle,
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            maxWidth: 280,
          }}
        >
          <div style={{ fontSize: 16, color: COLORS.paymentGreen }}>✓</div>
          <div>
            <div style={{ fontFamily, fontSize: 14, fontWeight: 600, color: COLORS.white }}>
              Foreground Service
            </div>
            <div style={{ fontFamily, fontSize: 11, color: COLORS.muted }}>
              Media playback continues in background
            </div>
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

/* ── Scene 3: App Goes to Background ── */
const BackgroundScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Text overlay
  const textProgress = spring({ frame, fps, delay: 5, config: SPRING.smooth });

  // Phone shrink: frames 15-50
  const shrinkProgress = interpolate(frame, [15, 50], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const phoneScale = interpolate(shrinkProgress, [0, 1], [0.9, 0.4]);
  const phoneX = interpolate(shrinkProgress, [0, 1], [80, 200]);
  const phoneY = interpolate(shrinkProgress, [0, 1], [20, 100]);

  // Home gesture (white bar swipes up) — frames 20-35
  const gestureY = interpolate(frame, [20, 35], [0, -30], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const gestureOpacity = interpolate(frame, [20, 25, 30, 35], [0, 1, 1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // Content crossfade to home screen (frames 35-55)
  const homeScreenOpacity = interpolate(frame, [35, 55], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // Notification entrance (frames 50+)
  const notifDelay = 50;

  // Annotation callout (frames 110+)
  const calloutProgress = spring({ frame, fps, delay: 110, config: SPRING.snappy });

  return (
    <AbsoluteFill>
      <TravelBackground variant="gold-ambient" />

      {/* Text overlay */}
      <div
        style={{
          position: 'absolute',
          top: 80,
          left: 100,
          opacity: interpolate(textProgress, [0, 1], [0, 1]),
          transform: `translateY(${interpolate(textProgress, [0, 1], [20, 0])}px)`,
        }}
      >
        <div style={{ fontFamily, fontSize: 42, fontWeight: 800, color: COLORS.white }}>
          App Goes to
        </div>
        <div style={{ fontFamily, fontSize: 42, fontWeight: 800, color: COLORS.gold }}>
          Background
        </div>
        <div
          style={{ fontFamily, fontSize: 20, fontWeight: 400, color: COLORS.muted, marginTop: 12 }}
        >
          Voice session persists via foreground service
        </div>
      </div>

      {/* Phone (shrinking) */}
      <div
        style={{
          position: 'absolute',
          left: '50%',
          top: '50%',
          transform: `translate(-50%, -50%) translate(${phoneX}px, ${phoneY}px) scale(${phoneScale})`,
        }}
      >
        <div style={{ width: 280, height: 606, position: 'relative' }}>
          {/* Voice concierge content (fading out) */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              opacity: 1 - homeScreenOpacity,
              borderRadius: 40,
              overflow: 'hidden',
            }}
          >
            <VoiceConciergeScreen
              voiceState="speaking"
              waveformActive
              assistantTranscript="I found 3 highly-rated restaurants..."
            />
          </div>

          {/* Home screen content (fading in) */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              opacity: homeScreenOpacity,
              borderRadius: 40,
              overflow: 'hidden',
            }}
          >
            <AndroidHomeScreen showActiveApp />
          </div>

          {/* Bezel overlay (to match PhoneFrame look) */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              borderRadius: 48,
              border: '4px solid #2a2a2e',
              pointerEvents: 'none',
              boxShadow: '0 20px 60px rgba(0,0,0,0.8), 0 8px 24px rgba(0,0,0,0.6)',
            }}
          />
        </div>

        {/* Home gesture indicator */}
        <div
          style={{
            position: 'absolute',
            bottom: -20,
            left: '50%',
            transform: `translateX(-50%) translateY(${gestureY}px)`,
            opacity: gestureOpacity,
            width: 40,
            height: 4,
            borderRadius: 2,
            background: COLORS.white,
          }}
        />
      </div>

      {/* Android notification bar */}
      <div
        style={{
          position: 'absolute',
          top: 120,
          left: 100,
        }}
      >
        <AndroidNotificationBar delay={notifDelay} waveformActive />
      </div>

      {/* Annotation callout */}
      <div
        style={{
          position: 'absolute',
          left: 100,
          top: 380,
          opacity: interpolate(calloutProgress, [0, 1], [0, 1]),
          transform: `translateY(${interpolate(calloutProgress, [0, 1], [15, 0])}px)`,
        }}
      >
        <div
          style={{
            background: `${COLORS.surface}e6`,
            border: `1px solid ${COLORS.gold}40`,
            borderRadius: 8,
            padding: '8px 14px',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <div
            style={{
              width: 6,
              height: 6,
              borderRadius: '50%',
              background: COLORS.paymentGreen,
              boxShadow: `0 0 6px ${COLORS.paymentGreen}60`,
            }}
          />
          <div style={{ fontFamily, fontSize: 14, fontWeight: 600, color: COLORS.white }}>
            Foreground Service Notification
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

/* ── Scene 4: Split View — Background Persistence ── */
const SplitViewScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Left side entrance
  const leftEntrance = spring({ frame, fps, delay: 5, config: SPRING.smooth });
  const leftX = interpolate(leftEntrance, [0, 1], [-60, 0]);

  // Right side entrance
  const rightEntrance = spring({ frame, fps, delay: 10, config: SPRING.smooth });
  const rightX = interpolate(rightEntrance, [0, 1], [60, 0]);

  // Center text
  const textProgress = spring({ frame, fps, delay: 50, config: SPRING.smooth });

  // Permission badge
  const badgeProgress = spring({ frame, fps, delay: 80, config: SPRING.snappy });

  // Connecting line pulse
  const linePulse = interpolate(Math.sin(frame * 0.08) * 0.5 + 0.5, [0, 1], [0.3, 0.8]);

  return (
    <AbsoluteFill>
      <TravelBackground variant="gold-ambient" />

      {/* Left side: minimized app */}
      <div
        style={{
          position: 'absolute',
          left: 120,
          top: '50%',
          transform: `translate(${leftX}px, -50%)`,
          opacity: interpolate(leftEntrance, [0, 1], [0, 1]),
        }}
      >
        {/* Mini phone with active waveform */}
        <div
          style={{
            width: 200,
            height: 400,
            borderRadius: 32,
            border: `3px solid #2a2a2e`,
            overflow: 'hidden',
            boxShadow: SHADOWS.phone,
            position: 'relative',
          }}
        >
          <AndroidHomeScreen showActiveApp delay={5} />

          {/* Waveform overlay on the mini app card */}
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              background: `${COLORS.surface}e6`,
              border: `1px solid ${COLORS.gold}30`,
              borderRadius: 12,
              padding: '10px 14px',
              textAlign: 'center',
            }}
          >
            <VoiceConciergeScreen compact waveformActive voiceState="speaking" />
            <div
              style={{
                fontFamily,
                fontSize: 8,
                color: COLORS.gold,
                marginTop: 4,
              }}
            >
              Session active
            </div>
          </div>
        </div>

        <div
          style={{
            fontFamily,
            fontSize: 14,
            fontWeight: 600,
            color: COLORS.muted,
            textAlign: 'center',
            marginTop: 16,
          }}
        >
          App in background
        </div>
      </div>

      {/* Connecting dotted line */}
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: 340,
          right: 460,
          height: 2,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          opacity: interpolate(rightEntrance, [0, 1], [0, 1]),
        }}
      >
        <svg width="100%" height="4" style={{ overflow: 'visible' }}>
          <line
            x1="0"
            y1="2"
            x2="100%"
            y2="2"
            stroke={COLORS.gold}
            strokeWidth="2"
            strokeDasharray="6 4"
            opacity={linePulse}
          />
        </svg>
      </div>

      {/* Right side: enlarged notification */}
      <div
        style={{
          position: 'absolute',
          right: 120,
          top: '50%',
          transform: `translate(${rightX}px, -50%)`,
          opacity: interpolate(rightEntrance, [0, 1], [0, 1]),
        }}
      >
        <AndroidNotificationBar expanded waveformActive sessionDuration="01:23" delay={15} />

        <div
          style={{
            fontFamily,
            fontSize: 14,
            fontWeight: 600,
            color: COLORS.muted,
            textAlign: 'center',
            marginTop: 16,
          }}
        >
          Foreground service notification
        </div>
      </div>

      {/* Center bottom text */}
      <div
        style={{
          position: 'absolute',
          bottom: 120,
          left: 0,
          right: 0,
          textAlign: 'center',
          opacity: interpolate(textProgress, [0, 1], [0, 1]),
          transform: `translateY(${interpolate(textProgress, [0, 1], [20, 0])}px)`,
        }}
      >
        <div style={{ fontFamily, fontSize: 36, fontWeight: 700, color: COLORS.white }}>
          Audio playback continues as <span style={{ color: COLORS.gold }}>foreground service</span>
        </div>
      </div>

      {/* Permission badge */}
      <div
        style={{
          position: 'absolute',
          bottom: 70,
          left: '50%',
          transform: `translateX(-50%) scale(${interpolate(badgeProgress, [0, 1], [0.8, 1])})`,
          opacity: interpolate(badgeProgress, [0, 1], [0, 1]),
        }}
      >
        <div
          style={{
            fontFamily,
            fontSize: 14,
            fontWeight: 500,
            color: COLORS.goldPale,
            background: COLORS.surface,
            border: `1px solid ${COLORS.gold}30`,
            borderRadius: 8,
            padding: '8px 20px',
            letterSpacing: '1px',
          }}
        >
          FOREGROUND_SERVICE_MEDIA_PLAYBACK
        </div>
      </div>
    </AbsoluteFill>
  );
};

/* ── Scene 5: Return to App ── */
const ReturnScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Text overlay
  const textProgress = spring({ frame, fps, delay: 5, config: SPRING.smooth });

  // Notification tap ripple (frames 15-30)
  const rippleProgress = interpolate(frame, [15, 35], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const rippleOpacity = interpolate(rippleProgress, [0, 0.3, 1], [0, 0.6, 0]);
  const rippleScale = interpolate(rippleProgress, [0, 1], [0.5, 2.5]);

  // Phone expand: frames 20-60
  const expandProgress = interpolate(frame, [20, 60], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const phoneScale = interpolate(expandProgress, [0, 1], [0.4, 0.9]);
  const phoneX = interpolate(expandProgress, [0, 1], [200, 80]);
  const phoneY = interpolate(expandProgress, [0, 1], [100, 20]);

  // Content crossfade back to voice screen (frames 30-55)
  const voiceScreenOpacity = interpolate(frame, [30, 55], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // Confirmation card
  const confirmProgress = spring({ frame, fps, delay: 80, config: SPRING.snappy });

  return (
    <AbsoluteFill>
      <TravelBackground variant="gold-ambient" />

      {/* Text overlay */}
      <div
        style={{
          position: 'absolute',
          top: 80,
          left: 100,
          opacity: interpolate(textProgress, [0, 1], [0, 1]),
          transform: `translateY(${interpolate(textProgress, [0, 1], [20, 0])}px)`,
        }}
      >
        <div style={{ fontFamily, fontSize: 42, fontWeight: 800, color: COLORS.white }}>
          Tap to Return
        </div>
        <div style={{ fontFamily, fontSize: 42, fontWeight: 800, color: COLORS.gold }}>
          Session Never Interrupted
        </div>
        <div
          style={{ fontFamily, fontSize: 20, fontWeight: 400, color: COLORS.muted, marginTop: 12 }}
        >
          Voice resumes instantly from the notification
        </div>
      </div>

      {/* Tap ripple effect */}
      {rippleOpacity > 0 && (
        <div
          style={{
            position: 'absolute',
            left: 250,
            top: 350,
            width: 60,
            height: 60,
            borderRadius: '50%',
            border: `2px solid ${COLORS.gold}`,
            opacity: rippleOpacity,
            transform: `scale(${rippleScale})`,
          }}
        />
      )}

      {/* Phone (expanding back) */}
      <PhoneFrame scale={phoneScale} x={phoneX} y={phoneY} delay={0} float={frame > 60}>
        <div style={{ width: '100%', height: '100%', position: 'relative' }}>
          {/* Home screen (fading out) */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              opacity: 1 - voiceScreenOpacity,
            }}
          >
            <AndroidHomeScreen showActiveApp />
          </div>

          {/* Voice concierge (fading in) */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              opacity: voiceScreenOpacity,
            }}
          >
            <VoiceConciergeScreen
              voiceState="listening"
              waveformActive
              assistantTranscript="I found 3 highly-rated restaurants within walking distance. Let me tell you about the top pick..."
            />
          </div>
        </div>
      </PhoneFrame>

      {/* Confirmation card */}
      <div
        style={{
          position: 'absolute',
          right: 120,
          top: 380,
          opacity: interpolate(confirmProgress, [0, 1], [0, 1]),
          transform: `translateX(${interpolate(confirmProgress, [0, 1], [30, 0])}px) scale(${interpolate(confirmProgress, [0, 1], [0.9, 1])})`,
        }}
      >
        <div
          style={{
            background: COLORS.surface,
            border: `1px solid ${COLORS.gold}30`,
            borderRadius: 12,
            padding: '14px 18px',
            boxShadow: SHADOWS.goldGlowSubtle,
            display: 'flex',
            flexDirection: 'column',
            gap: 6,
            maxWidth: 280,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ fontSize: 16, color: COLORS.paymentGreen }}>✓</div>
            <div style={{ fontFamily, fontSize: 14, fontWeight: 600, color: COLORS.white }}>
              Session Duration: 1m 23s
            </div>
          </div>
          <div
            style={{
              fontFamily,
              fontSize: 12,
              color: COLORS.muted,
              paddingLeft: 24,
            }}
          >
            No audio interruption
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

/* ── Main Composition ── */
export const GooglePlayVoiceDemo: React.FC = () => {
  let offset = 0;

  return (
    <AbsoluteFill style={{ background: COLORS.background }}>
      {/* Scene 1: Title Card */}
      <Sequence from={offset} durationInFrames={S1_TITLE}>
        <TitleCardScene />
      </Sequence>

      {/* Scene 2: Voice Session Start */}
      <Sequence from={(offset += S1_TITLE)} durationInFrames={S2_VOICE_SESSION}>
        <VoiceSessionScene />
      </Sequence>

      {/* Scene 3: App Goes to Background */}
      <Sequence from={(offset += S2_VOICE_SESSION)} durationInFrames={S3_BACKGROUND}>
        <BackgroundScene />
      </Sequence>

      {/* Scene 4: Split View — Background Persistence */}
      <Sequence from={(offset += S3_BACKGROUND)} durationInFrames={S4_SPLIT_VIEW}>
        <SplitViewScene />
      </Sequence>

      {/* Scene 5: Return to App */}
      <Sequence from={(offset += S4_SPLIT_VIEW)} durationInFrames={S5_RETURN}>
        <ReturnScene />
      </Sequence>

      {/* Scene 6: End Card */}
      <Sequence from={GOOGLE_PLAY_VOICE_DEMO_DURATION - S6_END_CARD}>
        <EndCard />
      </Sequence>
    </AbsoluteFill>
  );
};
