import { interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { loadFont } from '@remotion/google-fonts/Inter';
import { COLORS, SPRING } from '../../theme';
import { TabBar } from '../TabBar';

const { fontFamily } = loadFont('normal', {
  weights: ['400', '500', '600', '700'],
  subsets: ['latin'],
});

type VoiceConciergeScreenProps = {
  animationDelay?: number;
  /** Which voice state to display */
  voiceState?: 'idle' | 'connecting' | 'listening' | 'speaking';
  /** Whether the waveform should animate */
  waveformActive?: boolean;
  /** User transcript to show below waveform */
  userTranscript?: string;
  /** Assistant transcript to show above waveform */
  assistantTranscript?: string;
  /** Show the initial mic button tap animation */
  showMicTap?: boolean;
  /** Compact mode for minimized views */
  compact?: boolean;
};

function stateLabel(state: string): string {
  switch (state) {
    case 'connecting':
      return 'Connecting\u2026';
    case 'listening':
      return 'Listening\u2026';
    case 'speaking':
      return 'Speaking\u2026';
    default:
      return '';
  }
}

/**
 * Build an animated SVG wave path.
 * `amplitude` ranges from 0 (flat line) to 1 (full wave).
 */
function wavePath(amplitude: number): string {
  const mid = 10;
  const a = 7 * amplitude;
  const y1 = mid - a;
  const y2 = mid + a;
  return `M 0 ${mid} C 12.5 ${y1}, 25 ${y1}, 37.5 ${mid} S 62.5 ${y2}, 75 ${mid} S 100 ${y1}, 112.5 ${mid} S 137.5 ${y2}, 150 ${mid} S 175 ${y1}, 187.5 ${mid} L 200 ${mid}`;
}

export const VoiceConciergeScreen: React.FC<VoiceConciergeScreenProps> = ({
  animationDelay = 0,
  voiceState = 'listening',
  waveformActive = true,
  userTranscript,
  assistantTranscript,
  showMicTap = false,
  compact = false,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Mic button tap animation
  const micTapProgress = showMicTap
    ? spring({ frame, fps, delay: animationDelay + 8, config: SPRING.elastic })
    : 0;

  // Waveform entrance
  const waveEntrance = spring({
    frame,
    fps,
    delay: animationDelay + (showMicTap ? 18 : 5),
    config: SPRING.smooth,
  });

  // Waveform amplitude oscillation
  const baseAmplitude = waveformActive
    ? interpolate(
        Math.sin((frame - animationDelay) * 0.12) * 0.5 +
          Math.sin((frame - animationDelay) * 0.07) * 0.3 +
          0.5,
        [0, 1],
        [0.3, 1],
      )
    : 0;
  const waveAmplitude = baseAmplitude * waveEntrance;

  // Glow intensity based on voice state
  const glowIntensity =
    voiceState === 'speaking'
      ? interpolate(Math.sin((frame - animationDelay) * 0.15) * 0.5 + 0.5, [0, 1], [0.2, 0.6])
      : voiceState === 'listening'
        ? 0.15
        : 0.05;

  // Audio level bar (simulated RMS)
  const audioLevel =
    voiceState === 'speaking' || voiceState === 'listening'
      ? interpolate(
          Math.sin((frame - animationDelay) * 0.2) * 0.4 +
            Math.sin((frame - animationDelay) * 0.13) * 0.3 +
            0.5,
          [0, 1],
          [20, 80],
        )
      : 0;

  // Assistant transcript fade
  const assistantFade = assistantTranscript
    ? spring({
        frame,
        fps,
        delay: animationDelay + (showMicTap ? 70 : 30),
        config: SPRING.smooth,
      })
    : 0;

  // User transcript typed character count
  const userChars = userTranscript
    ? Math.floor(
        interpolate(
          frame - animationDelay - (showMicTap ? 30 : 10),
          [0, userTranscript.length * 2],
          [0, userTranscript.length],
          { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' },
        ),
      )
    : 0;

  if (compact) {
    // Compact version for minimized/background scenes
    return (
      <div
        style={{
          width: '100%',
          height: '100%',
          background: COLORS.background,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
        }}
      >
        {/* Mini waveform */}
        <svg viewBox="0 0 200 20" width="80%" height="20" preserveAspectRatio="none">
          <defs>
            <linearGradient id="gold-wave-compact" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#533517" />
              <stop offset="25%" stopColor="#c49746" />
              <stop offset="50%" stopColor="#feeaa5" />
              <stop offset="75%" stopColor="#c49746" />
              <stop offset="100%" stopColor="#533517" />
            </linearGradient>
          </defs>
          <path
            d={wavePath(waveAmplitude)}
            stroke="url(#gold-wave-compact)"
            strokeWidth="2"
            fill="none"
            strokeLinecap="round"
          />
        </svg>
        <div style={{ fontFamily, fontSize: 7, color: COLORS.gold, marginTop: 4 }}>
          {stateLabel(voiceState)}
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        background: COLORS.background,
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: '8px 12px',
          borderBottom: `1px solid ${COLORS.border}`,
          display: 'flex',
          alignItems: 'center',
          gap: 8,
        }}
      >
        <div
          style={{
            width: 24,
            height: 24,
            borderRadius: '50%',
            background: `linear-gradient(135deg, ${COLORS.gold}60, ${COLORS.gold}20)`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 12,
          }}
        >
          🤖
        </div>
        <div>
          <div style={{ fontFamily, fontSize: 12, fontWeight: 700, color: COLORS.white }}>
            Chravel Agent
          </div>
          <div style={{ fontFamily, fontSize: 8, color: COLORS.gold }}>AI Concierge</div>
        </div>
      </div>

      {/* Main voice content area */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '8px 12px',
          minHeight: 0,
        }}
      >
        {/* Idle state: mic button */}
        {voiceState === 'idle' && (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: '50%',
                background: `linear-gradient(135deg, ${COLORS.gold}, ${COLORS.goldLight})`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 20,
                boxShadow: `0 4px 16px ${COLORS.gold}40`,
              }}
            >
              🎤
            </div>
            <div style={{ fontFamily, fontSize: 9, color: COLORS.muted, textAlign: 'center' }}>
              Tap to start voice session
            </div>
          </div>
        )}

        {/* Mic tap animation */}
        {showMicTap && voiceState !== 'idle' && (
          <div
            style={{
              position: 'absolute',
              top: '40%',
              left: '50%',
              transform: `translate(-50%, -50%) scale(${interpolate(micTapProgress, [0, 1], [1, 0])})`,
              opacity: interpolate(micTapProgress, [0, 0.5, 1], [1, 0.5, 0]),
              width: 48,
              height: 48,
              borderRadius: '50%',
              background: `linear-gradient(135deg, ${COLORS.gold}, ${COLORS.goldLight})`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 20,
              boxShadow: `0 4px 16px ${COLORS.gold}40`,
            }}
          >
            🎤
          </div>
        )}

        {/* Active voice state */}
        {voiceState !== 'idle' && (
          <>
            {/* Assistant transcript — above waveform */}
            <div
              style={{
                flex: 1,
                display: 'flex',
                alignItems: 'flex-end',
                justifyContent: 'center',
                width: '100%',
                minHeight: 0,
                marginBottom: 8,
                opacity: assistantFade,
                transform: `translateY(${interpolate(assistantFade, [0, 1], [8, 0])}px)`,
              }}
            >
              {assistantTranscript && (
                <div
                  style={{
                    fontFamily,
                    fontSize: 9,
                    fontWeight: 400,
                    color: `${COLORS.white}e6`,
                    textAlign: 'center',
                    lineHeight: 1.5,
                    padding: '0 4px',
                  }}
                >
                  {assistantTranscript}
                </div>
              )}
            </div>

            {/* Gold waveform */}
            <div style={{ width: '100%', flexShrink: 0 }}>
              <svg
                viewBox="0 0 200 20"
                width="100%"
                height="20"
                preserveAspectRatio="none"
                style={{
                  opacity: interpolate(waveEntrance, [0, 1], [0, 1]),
                  filter: `drop-shadow(0 0 ${4 + 10 * glowIntensity}px rgba(196, 151, 70, ${0.3 + glowIntensity * 0.4}))
                           drop-shadow(0 0 ${1 + 4 * glowIntensity}px rgba(254, 234, 165, ${0.15 + glowIntensity * 0.3}))`,
                }}
              >
                <defs>
                  <linearGradient id="gold-wave-voice" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#533517" />
                    <stop offset="25%" stopColor="#c49746" />
                    <stop offset="50%" stopColor="#feeaa5" />
                    <stop offset="75%" stopColor="#c49746" />
                    <stop offset="100%" stopColor="#533517" />
                  </linearGradient>
                </defs>
                <path
                  d={wavePath(waveAmplitude)}
                  stroke="url(#gold-wave-voice)"
                  strokeWidth="2.5"
                  fill="none"
                  strokeLinecap="round"
                />
              </svg>

              {/* Audio level bar */}
              {(voiceState === 'listening' || voiceState === 'speaking') && (
                <div
                  style={{
                    marginTop: 4,
                    height: 2,
                    borderRadius: 1,
                    background: `${COLORS.white}0d`,
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      height: '100%',
                      borderRadius: 1,
                      width: `${audioLevel}%`,
                      background:
                        voiceState === 'listening'
                          ? `linear-gradient(90deg, ${COLORS.gold}66, ${COLORS.goldLight}99)`
                          : `linear-gradient(90deg, ${COLORS.white}4d, ${COLORS.white}80)`,
                      transition: 'width 0.05s',
                    }}
                  />
                </div>
              )}

              {/* State label */}
              <div
                style={{
                  fontFamily,
                  fontSize: 8,
                  fontWeight: 500,
                  color: `${COLORS.white}66`,
                  textAlign: 'center',
                  marginTop: 6,
                  letterSpacing: '0.5px',
                }}
              >
                {stateLabel(voiceState)}
              </div>
            </div>

            {/* User transcript — below waveform */}
            <div
              style={{
                flex: 1,
                display: 'flex',
                alignItems: 'flex-start',
                justifyContent: 'center',
                width: '100%',
                minHeight: 0,
                marginTop: 8,
              }}
            >
              {userTranscript && userChars > 0 ? (
                <div
                  style={{
                    fontFamily,
                    fontSize: 9,
                    fontWeight: 400,
                    color: COLORS.goldPale,
                    textAlign: 'center',
                    lineHeight: 1.5,
                    padding: '0 4px',
                  }}
                >
                  {userTranscript.slice(0, userChars)}
                  <span
                    style={{
                      opacity: frame % 20 < 10 ? 1 : 0,
                      color: COLORS.gold,
                    }}
                  >
                    |
                  </span>
                </div>
              ) : voiceState === 'listening' && !userTranscript ? (
                <div
                  style={{
                    fontFamily,
                    fontSize: 8,
                    color: `${COLORS.gold}40`,
                    textAlign: 'center',
                    fontStyle: 'italic',
                  }}
                >
                  Speak now&hellip;
                </div>
              ) : null}
            </div>
          </>
        )}
      </div>

      <TabBar activeTab="concierge" delay={animationDelay + 3} />
    </div>
  );
};
