/**
 * MobileAppDemo — 1080x1920 / 30fps / ~14s.
 *
 * Mobile vertical product cut for app store / mobile landing / social. Reuses
 * the PhoneFrame primitive and shows a condensed sweep through the trip tabs.
 */
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { TransitionSeries, linearTiming } from '@remotion/transitions';
import { fade } from '@remotion/transitions/fade';
import { loadFont } from '@remotion/google-fonts/Inter';
import { COLORS, GRADIENTS, SHADOWS, SPRING, FPS } from '../theme';
import { PhoneFrame } from '../components/PhoneFrame';
import { SceneCaption } from '../components/SceneCaption';

const { fontFamily } = loadFont('normal', {
  weights: ['400', '500', '600', '700', '800'],
  subsets: ['latin'],
});

const SCENE = 75;
const TRANSITION = 12;
const END = 75;
export const MOBILE_DEMO_DURATION = SCENE * 5 + END - TRANSITION * 5; // ≈ 390 frames ≈ 13s

const PhoneStage: React.FC<{ children: React.ReactNode; caption: string }> = ({
  children,
  caption,
}) => (
  <AbsoluteFill style={{ background: COLORS.background, fontFamily }}>
    <AbsoluteFill style={{ background: GRADIENTS.backgroundRadial }} />
    <AbsoluteFill style={{ background: GRADIENTS.goldAmbient }} />
    {/* Scale phone frame up for vertical 1080x1920 stage */}
    <div
      style={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transform: 'scale(2.4)',
        transformOrigin: 'center',
      }}
    >
      <PhoneFrame float>{children}</PhoneFrame>
    </div>
    <SceneCaption text={caption} position="bottom" />
  </AbsoluteFill>
);

// ─── Mini phone screens ──────────────────────────────────────────────────────

const PhoneDashboard: React.FC = () => (
  <div style={{ padding: 14, color: COLORS.white }}>
    <div style={{ fontWeight: 800, fontSize: 18, marginBottom: 10 }}>My Trips</div>
    {[
      { n: 'Bali Trip 2026', d: 'Mar 14 – 22', c: '#3a5a8a' },
      { n: 'Cousins Reunion', d: 'Jul 04 – 08', c: '#8a5a3a' },
      { n: 'Tahoe Bachelor', d: 'Aug 22 – 25', c: '#5a8a3a' },
    ].map((t, i) => (
      <div
        key={t.n}
        style={{
          background: COLORS.surfaceLight,
          border: `1px solid ${i === 0 ? COLORS.gold : COLORS.border}`,
          borderRadius: 12,
          marginBottom: 10,
          overflow: 'hidden',
        }}
      >
        <div style={{ height: 56, background: t.c }} />
        <div style={{ padding: 10 }}>
          <div style={{ fontSize: 13, fontWeight: 700 }}>{t.n}</div>
          <div style={{ fontSize: 10, color: COLORS.muted }}>{t.d}</div>
        </div>
      </div>
    ))}
  </div>
);

const PhoneChat: React.FC = () => {
  const msgs = [
    { t: 'What time are we leaving?', me: false, d: 4 },
    { t: 'Address is pinned 📍', me: true, d: 14 },
    { t: 'Vote on brunch?', me: true, d: 24 },
  ];
  return (
    <div style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ color: COLORS.white, fontWeight: 700, fontSize: 14, marginBottom: 4 }}>
        Bali Trip 2026
      </div>
      {msgs.map(m => (
        <PhoneBubble key={m.t} {...m} />
      ))}
    </div>
  );
};

const PhoneBubble: React.FC<{ t: string; me: boolean; d: number }> = ({ t, me, d }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const enter = spring({ frame, fps, delay: d, config: SPRING.snappy });
  return (
    <div
      style={{
        alignSelf: me ? 'flex-end' : 'flex-start',
        background: me ? COLORS.chatBlue : COLORS.chatReceived,
        color: COLORS.white,
        padding: '7px 11px',
        borderRadius: 14,
        fontSize: 12,
        maxWidth: '78%',
        opacity: interpolate(enter, [0, 1], [0, 1]),
        transform: `translateY(${interpolate(enter, [0, 1], [8, 0])}px)`,
      }}
    >
      {t}
    </div>
  );
};

const PhoneCalendar: React.FC = () => (
  <div style={{ padding: 14, color: COLORS.white }}>
    <div style={{ fontWeight: 800, fontSize: 14, marginBottom: 8 }}>Saturday · Mar 21</div>
    {[
      { t: '8:30a', l: 'Airport pickup', hl: false },
      { t: '11:30a', l: 'Brunch · Sisterfields', hl: false },
      { t: '2:00p', l: 'Beach + surf', hl: true },
      { t: '8:00p', l: 'Dinner · Mama San', hl: false },
    ].map(e => (
      <div
        key={e.l}
        style={{
          display: 'flex',
          gap: 10,
          padding: '8px 10px',
          background: e.hl ? `${COLORS.gold}1a` : COLORS.surfaceLight,
          border: `1px solid ${e.hl ? COLORS.gold : COLORS.border}`,
          borderRadius: 10,
          marginBottom: 6,
        }}
      >
        <div style={{ color: COLORS.gold, fontWeight: 700, fontSize: 11, width: 44 }}>{e.t}</div>
        <div style={{ fontSize: 12, fontWeight: 600 }}>{e.l}</div>
      </div>
    ))}
  </div>
);

const PhonePayments: React.FC = () => (
  <div style={{ padding: 14, color: COLORS.white }}>
    <div
      style={{
        background: COLORS.paymentBg,
        color: COLORS.paymentGreen,
        padding: '8px 10px',
        borderRadius: 8,
        fontWeight: 700,
        fontSize: 12,
        marginBottom: 10,
        textAlign: 'center',
      }}
    >
      You're owed $312
    </div>
    {[
      { w: 'Villa deposit', a: '$1,200', s: '$200 each' },
      { w: 'Dinner · Mama San', a: '$336', s: '$42 each' },
      { w: 'Surf lessons', a: '$240', s: '$30 each' },
    ].map(e => (
      <div
        key={e.w}
        style={{
          background: COLORS.surfaceLight,
          border: `1px solid ${COLORS.border}`,
          padding: 10,
          borderRadius: 10,
          marginBottom: 6,
          display: 'flex',
          justifyContent: 'space-between',
        }}
      >
        <div>
          <div style={{ fontSize: 12, fontWeight: 700 }}>{e.w}</div>
          <div style={{ fontSize: 10, color: COLORS.gold }}>{e.s}</div>
        </div>
        <div style={{ fontWeight: 800, fontSize: 13 }}>{e.a}</div>
      </div>
    ))}
  </div>
);

const PhoneConcierge: React.FC = () => {
  const frame = useCurrentFrame();
  const answer = 'Brunch 11:30, beach 2pm, dinner 8pm. Jordan & Maya owe $42 each.';
  const n = Math.floor(
    interpolate(frame, [20, 65], [0, answer.length], { extrapolateRight: 'clamp' }),
  );
  return (
    <div style={{ padding: 14, color: COLORS.white }}>
      <div
        style={{
          alignSelf: 'flex-end',
          background: COLORS.chatBlue,
          padding: '8px 12px',
          borderRadius: 14,
          fontSize: 12,
          marginBottom: 8,
          marginLeft: 'auto',
          maxWidth: '85%',
        }}
      >
        Summarize Saturday?
      </div>
      <div
        style={{
          background: COLORS.surfaceLight,
          border: `1px solid ${COLORS.borderGold}`,
          padding: '10px 12px',
          borderRadius: 14,
          fontSize: 12,
          maxWidth: '90%',
        }}
      >
        <div
          style={{
            color: COLORS.gold,
            fontSize: 9,
            fontWeight: 700,
            letterSpacing: '0.15em',
            marginBottom: 4,
          }}
        >
          CONCIERGE
        </div>
        {answer.slice(0, n)}
        {n < answer.length ? '▍' : ''}
      </div>
    </div>
  );
};

// ─── End frame ───────────────────────────────────────────────────────────────

const MobileEnd: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const e = spring({ frame, fps, delay: 5, config: SPRING.bouncy });
  return (
    <AbsoluteFill
      style={{
        background: COLORS.background,
        fontFamily,
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
      }}
    >
      <AbsoluteFill style={{ background: GRADIENTS.goldAmbient }} />
      <div
        style={{
          color: COLORS.gold,
          fontSize: 42,
          fontWeight: 800,
          letterSpacing: 4,
          textTransform: 'uppercase',
          opacity: interpolate(e, [0, 1], [0, 1]),
          transform: `scale(${interpolate(e, [0, 1], [0.92, 1])})`,
        }}
      >
        ChravelApp
      </div>
      <div
        style={{
          color: COLORS.white,
          fontSize: 64,
          fontWeight: 800,
          marginTop: 28,
          maxWidth: 900,
          padding: '0 40px',
          lineHeight: 1.1,
          opacity: interpolate(e, [0, 1], [0, 1]),
        }}
      >
        The group chat travel app.
      </div>
      <div style={{ color: COLORS.muted, marginTop: 36, fontSize: 28, letterSpacing: 3 }}>
        chravel.app
      </div>
    </AbsoluteFill>
  );
};

export const MobileAppDemo: React.FC = () => {
  const t = linearTiming({ durationInFrames: TRANSITION });
  return (
    <AbsoluteFill style={{ background: COLORS.background }}>
      <TransitionSeries>
        <TransitionSeries.Sequence durationInFrames={SCENE}>
          <PhoneStage caption="Every trip gets one home.">
            <PhoneDashboard />
          </PhoneStage>
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={fade()} timing={t} />
        <TransitionSeries.Sequence durationInFrames={SCENE}>
          <PhoneStage caption="No more buried plans.">
            <PhoneChat />
          </PhoneStage>
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={fade()} timing={t} />
        <TransitionSeries.Sequence durationInFrames={SCENE}>
          <PhoneStage caption="Shared calendars that stay synced.">
            <PhoneCalendar />
          </PhoneStage>
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={fade()} timing={t} />
        <TransitionSeries.Sequence durationInFrames={SCENE}>
          <PhoneStage caption="Track who paid and who owes.">
            <PhonePayments />
          </PhoneStage>
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={fade()} timing={t} />
        <TransitionSeries.Sequence durationInFrames={SCENE}>
          <PhoneStage caption="Ask AI anything about your trip.">
            <PhoneConcierge />
          </PhoneStage>
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={fade()} timing={t} />
        <TransitionSeries.Sequence durationInFrames={END}>
          <MobileEnd />
        </TransitionSeries.Sequence>
      </TransitionSeries>
    </AbsoluteFill>
  );
};
