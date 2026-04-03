import {
  AbsoluteFill,
  Sequence,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import { loadFont } from '@remotion/google-fonts/Inter';
import { COLORS, GRADIENTS, SHADOWS, SPRING, TIMING, FPS } from '../theme';
import { PhoneFrame } from '../components/PhoneFrame';
import { TravelBackground } from '../components/TravelBackground';
import { EndCard } from '../components/EndCard';
import { TabBar } from '../components/TabBar';
import { SyncIndicator } from '../components/SyncIndicator';

const { fontFamily } = loadFont('normal', {
  weights: ['400', '500', '600', '700', '800'],
  subsets: ['latin'],
});

export const TRIP_CREATION_DURATION = 12 * FPS; // 360 frames

/** Scene: Trip Creation Flow — user names trip, adds details, invites via link, sync animation */
export const TripCreationFlow: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Text overlay entrance
  const titleProgress = spring({ frame, fps, delay: 5, config: SPRING.smooth });
  const titleOpacity = interpolate(titleProgress, [0, 1], [0, 1]);
  const titleY = interpolate(titleProgress, [0, 1], [20, 0]);

  // Trip name typing animation
  const tripName = 'Bali Trip 2026 🌴';
  const typedChars = Math.min(
    tripName.length,
    Math.floor(
      interpolate(frame, [30, 90], [0, tripName.length], {
        extrapolateRight: 'clamp',
        extrapolateLeft: 'clamp',
      }),
    ),
  );
  const typedText = tripName.slice(0, typedChars);

  // Invite link generation
  const linkProgress = spring({ frame, fps, delay: 110, config: SPRING.snappy });

  // Side phones entrance (for sync demo)
  const sidePhoneProgress = spring({ frame, fps, delay: 150, config: SPRING.gentle });
  const sidePhoneX = interpolate(sidePhoneProgress, [0, 1], [100, 0]);
  const sidePhoneOpacity = interpolate(sidePhoneProgress, [0, 1], [0, 1]);

  // Sync ripple
  const syncActive = frame > 180;

  return (
    <AbsoluteFill>
      <TravelBackground variant="particles" />

      {/* Title overlay */}
      <div
        style={{
          position: 'absolute',
          top: 80,
          left: 100,
          opacity: titleOpacity,
          transform: `translateY(${titleY}px)`,
        }}
      >
        <div
          style={{
            fontFamily,
            fontSize: 42,
            fontWeight: 800,
            color: COLORS.white,
            lineHeight: 1.2,
          }}
        >
          Create a Trip in
        </div>
        <div
          style={{ fontFamily, fontSize: 42, fontWeight: 800, color: COLORS.gold, lineHeight: 1.2 }}
        >
          Under 60 Seconds
        </div>
        <div
          style={{ fontFamily, fontSize: 20, fontWeight: 400, color: COLORS.muted, marginTop: 12 }}
        >
          Name it. Invite your crew. Done.
        </div>
      </div>

      {/* Side phones (sync targets) */}
      {sidePhoneOpacity > 0.05 && (
        <>
          <PhoneFrame scale={0.7} x={-420 - sidePhoneX} y={30} delay={150} float>
            <div
              style={{
                width: '100%',
                height: '100%',
                background: COLORS.background,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <div style={{ fontSize: 24 }}>🔔</div>
              <div
                style={{
                  fontFamily,
                  fontSize: 11,
                  fontWeight: 600,
                  color: COLORS.white,
                  marginTop: 8,
                  textAlign: 'center',
                }}
              >
                You've been invited to
              </div>
              <div
                style={{
                  fontFamily,
                  fontSize: 13,
                  fontWeight: 700,
                  color: COLORS.gold,
                  marginTop: 4,
                }}
              >
                {typedChars >= tripName.length ? tripName : 'Bali Trip...'}
              </div>
              <div
                style={{
                  fontFamily,
                  fontSize: 9,
                  fontWeight: 600,
                  color: COLORS.background,
                  background: COLORS.gold,
                  borderRadius: 6,
                  padding: '4px 12px',
                  marginTop: 10,
                }}
              >
                Join Trip
              </div>
            </div>
          </PhoneFrame>

          <PhoneFrame scale={0.7} x={420 + sidePhoneX} y={30} delay={165} float>
            <div
              style={{
                width: '100%',
                height: '100%',
                background: COLORS.background,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <div style={{ fontSize: 24 }}>🔔</div>
              <div
                style={{
                  fontFamily,
                  fontSize: 11,
                  fontWeight: 600,
                  color: COLORS.white,
                  marginTop: 8,
                  textAlign: 'center',
                }}
              >
                You've been invited to
              </div>
              <div
                style={{
                  fontFamily,
                  fontSize: 13,
                  fontWeight: 700,
                  color: COLORS.gold,
                  marginTop: 4,
                }}
              >
                {typedChars >= tripName.length ? tripName : 'Bali Trip...'}
              </div>
              <div
                style={{
                  fontFamily,
                  fontSize: 9,
                  fontWeight: 600,
                  color: COLORS.background,
                  background: COLORS.gold,
                  borderRadius: 6,
                  padding: '4px 12px',
                  marginTop: 10,
                }}
              >
                Join Trip
              </div>
            </div>
          </PhoneFrame>
        </>
      )}

      {/* Center phone — trip creation form */}
      <PhoneFrame scale={0.9} x={0} y={20} delay={10} float>
        <div
          style={{
            width: '100%',
            height: '100%',
            background: COLORS.background,
            position: 'relative',
          }}
        >
          {/* Header */}
          <div style={{ padding: '10px 12px', borderBottom: `1px solid ${COLORS.border}` }}>
            <div style={{ fontFamily, fontSize: 14, fontWeight: 700, color: COLORS.white }}>
              ✨ New Trip
            </div>
          </div>

          {/* Form */}
          <div style={{ padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 10 }}>
            {/* Trip name input */}
            <div>
              <div
                style={{
                  fontFamily,
                  fontSize: 9,
                  fontWeight: 600,
                  color: COLORS.gold,
                  marginBottom: 4,
                  textTransform: 'uppercase',
                  letterSpacing: 1,
                }}
              >
                Trip Name
              </div>
              <div
                style={{
                  background: COLORS.surface,
                  border: `1px solid ${COLORS.border}`,
                  borderRadius: 8,
                  padding: '8px 10px',
                  minHeight: 20,
                }}
              >
                <div style={{ fontFamily, fontSize: 12, fontWeight: 500, color: COLORS.white }}>
                  {typedText}
                  {typedChars < tripName.length && (
                    <span style={{ color: COLORS.gold, opacity: frame % 20 < 10 ? 1 : 0 }}>|</span>
                  )}
                </div>
              </div>
            </div>

            {/* Date selector */}
            <div>
              <div
                style={{
                  fontFamily,
                  fontSize: 9,
                  fontWeight: 600,
                  color: COLORS.gold,
                  marginBottom: 4,
                  textTransform: 'uppercase',
                  letterSpacing: 1,
                }}
              >
                Dates
              </div>
              <div
                style={{
                  background: COLORS.surface,
                  border: `1px solid ${COLORS.border}`,
                  borderRadius: 8,
                  padding: '8px 10px',
                }}
              >
                <div style={{ fontFamily, fontSize: 11, fontWeight: 500, color: COLORS.muted }}>
                  Mar 15 — Mar 22, 2026
                </div>
              </div>
            </div>

            {/* Invite link section */}
            <div
              style={{
                opacity: interpolate(linkProgress, [0, 1], [0, 1]),
                transform: `translateY(${interpolate(linkProgress, [0, 1], [15, 0])}px)`,
              }}
            >
              <div
                style={{
                  fontFamily,
                  fontSize: 9,
                  fontWeight: 600,
                  color: COLORS.gold,
                  marginBottom: 4,
                  textTransform: 'uppercase',
                  letterSpacing: 1,
                }}
              >
                Invite Link
              </div>
              <div
                style={{
                  background: `${COLORS.gold}10`,
                  border: `1px solid ${COLORS.gold}30`,
                  borderRadius: 8,
                  padding: '6px 10px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <div style={{ fontFamily, fontSize: 9, color: COLORS.muted }}>
                  chravel.app/join/bali-2026
                </div>
                <div style={{ fontFamily, fontSize: 8, fontWeight: 600, color: COLORS.gold }}>
                  📋 Copy
                </div>
              </div>
            </div>

            {/* Create button */}
            <div
              style={{
                background: GRADIENTS.gold,
                borderRadius: 10,
                padding: '10px 0',
                textAlign: 'center',
                boxShadow: SHADOWS.goldGlowSubtle,
                marginTop: 4,
              }}
            >
              <div style={{ fontFamily, fontSize: 12, fontWeight: 700, color: COLORS.background }}>
                Create Trip 🚀
              </div>
            </div>
          </div>

          <TabBar activeTab="chat" delay={15} />
        </div>
      </PhoneFrame>

      {/* Sync indicators */}
      {syncActive && (
        <>
          <SyncIndicator x={960 - 150} y={540} delay={180} color={COLORS.gold} />
          <SyncIndicator x={960 + 130} y={540} delay={190} color={COLORS.gold} />
        </>
      )}

      {/* End card */}
      <Sequence from={TRIP_CREATION_DURATION - TIMING.endCard}>
        <EndCard />
      </Sequence>
    </AbsoluteFill>
  );
};
