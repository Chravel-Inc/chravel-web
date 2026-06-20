/**
 * HomepageHeroDemo — 1920x1080 / 30fps / ~20s, loopable.
 *
 * Consumer-only product demo for chravel.app homepage hero. Sequences seven
 * mini-scenes (dashboard, chat, calendar, places, payments, concierge, end card)
 * with restrained fades and a unified caption system. No live API calls — all
 * data is deterministic mock UI rendered in Tailwind-free inline styles via the
 * shared theme tokens.
 */
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { TransitionSeries, linearTiming } from '@remotion/transitions';
import { fade } from '@remotion/transitions/fade';
import { slide } from '@remotion/transitions/slide';
import { loadFont } from '@remotion/google-fonts/Inter';
import { COLORS, GRADIENTS, SHADOWS, SPRING, FPS } from '../theme';
import { SceneCaption } from '../components/SceneCaption';
import { EndCard } from '../components/EndCard';

const { fontFamily } = loadFont('normal', {
  weights: ['400', '500', '600', '700', '800'],
  subsets: ['latin'],
});

const SCENE = 75; // 2.5s per scene
const TRANSITION = 14;
const END = 90;

export const HOMEPAGE_HERO_DURATION = SCENE * 6 + END - TRANSITION * 6; // ≈ 540 - 84 + 90 ≈ 546 frames ≈ 18.2s

// ─── Shared chrome ───────────────────────────────────────────────────────────

const BgWash: React.FC = () => (
  <AbsoluteFill style={{ background: COLORS.background }}>
    <AbsoluteFill style={{ background: GRADIENTS.backgroundRadial }} />
    <AbsoluteFill style={{ background: GRADIENTS.goldAmbient }} />
  </AbsoluteFill>
);

const Card: React.FC<{ children: React.ReactNode; width?: number; height?: number }> = ({
  children,
  width = 1240,
  height = 760,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const enter = spring({ frame, fps, config: SPRING.gentle });
  const scale = interpolate(enter, [0, 1], [0.96, 1]);
  const opacity = interpolate(enter, [0, 1], [0, 1]);
  return (
    <div
      style={{
        position: 'absolute',
        left: '50%',
        top: 110,
        transform: `translateX(-50%) scale(${scale})`,
        width,
        height,
        background: GRADIENTS.surface,
        border: `1px solid ${COLORS.borderGold}`,
        borderRadius: 24,
        boxShadow: SHADOWS.cardLg,
        overflow: 'hidden',
        opacity,
        fontFamily,
      }}
    >
      {children}
    </div>
  );
};

const Row: React.FC<{ children: React.ReactNode; style?: React.CSSProperties }> = ({
  children,
  style,
}) => <div style={{ display: 'flex', alignItems: 'center', gap: 16, ...style }}>{children}</div>;

const Avatar: React.FC<{ initials: string; color?: string }> = ({
  initials,
  color = COLORS.gold,
}) => (
  <div
    style={{
      width: 44,
      height: 44,
      borderRadius: 22,
      background: color,
      color: COLORS.background,
      fontWeight: 800,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: 16,
      flexShrink: 0,
    }}
  >
    {initials}
  </div>
);

// ─── Scene 1: Dashboard ──────────────────────────────────────────────────────

const DashboardScene: React.FC = () => {
  const trips = [
    { name: 'Bali Trip 2026', dates: 'Mar 14 – Mar 22', cover: '#3a5a8a', members: 6 },
    { name: 'Cousins Reunion', dates: 'Jul 04 – Jul 08', cover: '#8a5a3a', members: 11 },
    { name: 'Tahoe Bachelor', dates: 'Aug 22 – Aug 25', cover: '#5a8a3a', members: 8 },
    { name: 'NYC Long Weekend', dates: 'Oct 10 – Oct 13', cover: '#8a3a5a', members: 4 },
  ];
  return (
    <>
      <BgWash />
      <Card>
        <div style={{ padding: '28px 36px', borderBottom: `1px solid ${COLORS.border}` }}>
          <Row>
            <div style={{ color: COLORS.gold, fontWeight: 800, fontSize: 22 }}>ChravelApp</div>
            <div style={{ flex: 1 }} />
            <div style={{ color: COLORS.muted, fontSize: 14 }}>My Trips</div>
            <div style={{ color: COLORS.muted, fontSize: 14 }}>Concierge</div>
            <div style={{ color: COLORS.muted, fontSize: 14 }}>Settings</div>
            <div
              style={{
                background: GRADIENTS.goldButton,
                color: COLORS.background,
                padding: '10px 18px',
                borderRadius: 10,
                fontWeight: 700,
                fontSize: 14,
              }}
            >
              + New Trip
            </div>
          </Row>
        </div>
        <div style={{ padding: 32 }}>
          <div style={{ color: COLORS.white, fontSize: 28, fontWeight: 800, marginBottom: 6 }}>
            My Trips
          </div>
          <div style={{ color: COLORS.muted, fontSize: 15, marginBottom: 24 }}>
            4 active · 2 upcoming
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            {trips.map((t, i) => (
              <TripCard key={t.name} trip={t} delay={6 + i * 4} highlight={i === 0} />
            ))}
          </div>
        </div>
      </Card>
      <SceneCaption text="Every group trip gets one private home." />
    </>
  );
};

const TripCard: React.FC<{
  trip: { name: string; dates: string; cover: string; members: number };
  delay: number;
  highlight?: boolean;
}> = ({ trip, delay, highlight }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const enter = spring({ frame, fps, delay, config: SPRING.smooth });
  const opacity = interpolate(enter, [0, 1], [0, 1]);
  const y = interpolate(enter, [0, 1], [16, 0]);
  return (
    <div
      style={{
        background: COLORS.surfaceLight,
        border: `1px solid ${highlight ? COLORS.gold : COLORS.border}`,
        boxShadow: highlight ? SHADOWS.goldGlowSubtle : SHADOWS.card,
        borderRadius: 16,
        overflow: 'hidden',
        opacity,
        transform: `translateY(${y}px)`,
      }}
    >
      <div style={{ height: 130, background: trip.cover }} />
      <div style={{ padding: 18 }}>
        <div style={{ color: COLORS.white, fontWeight: 700, fontSize: 18 }}>{trip.name}</div>
        <div style={{ color: COLORS.muted, fontSize: 13, marginTop: 4 }}>{trip.dates}</div>
        <div style={{ color: COLORS.gold, fontSize: 12, marginTop: 8, fontWeight: 600 }}>
          {trip.members} travelers
        </div>
      </div>
    </div>
  );
};

// ─── Scene 2: Chat ───────────────────────────────────────────────────────────

const ChatScene: React.FC = () => {
  const msgs = [
    {
      from: 'Maya',
      initials: 'M',
      text: 'What time are we leaving for dinner?',
      side: 'left' as const,
      delay: 6,
    },
    {
      from: 'You',
      initials: 'J',
      text: 'Basecamp address is pinned in Places 📍',
      side: 'right' as const,
      delay: 16,
    },
    {
      from: 'Alex',
      initials: 'A',
      text: 'Just added the airport pickup to Calendar.',
      side: 'left' as const,
      delay: 28,
    },
    {
      from: 'You',
      initials: 'J',
      text: 'Can everyone vote on Saturday brunch?',
      side: 'right' as const,
      delay: 42,
    },
  ];
  return (
    <>
      <BgWash />
      <Card>
        <div style={{ padding: '20px 28px', borderBottom: `1px solid ${COLORS.border}` }}>
          <Row>
            <Avatar initials="BT" />
            <div>
              <div style={{ color: COLORS.white, fontWeight: 700, fontSize: 17 }}>
                Bali Trip 2026
              </div>
              <div style={{ color: COLORS.muted, fontSize: 12 }}>6 members · Chat</div>
            </div>
          </Row>
        </div>
        <div style={{ padding: '28px 40px', display: 'flex', flexDirection: 'column', gap: 14 }}>
          {msgs.map(m => (
            <ChatRow key={m.text} {...m} />
          ))}
        </div>
      </Card>
      <SceneCaption text="No more plans buried in random group chats." />
    </>
  );
};

const ChatRow: React.FC<{
  initials: string;
  from: string;
  text: string;
  side: 'left' | 'right';
  delay: number;
}> = ({ initials, from, text, side, delay }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const enter = spring({ frame, fps, delay, config: SPRING.snappy });
  const opacity = interpolate(enter, [0, 1], [0, 1]);
  const y = interpolate(enter, [0, 1], [12, 0]);
  const isMe = side === 'right';
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: isMe ? 'row-reverse' : 'row',
        gap: 12,
        alignItems: 'flex-end',
        opacity,
        transform: `translateY(${y}px)`,
      }}
    >
      <Avatar initials={initials} color={isMe ? COLORS.gold : COLORS.bezelLight} />
      <div style={{ maxWidth: 620 }}>
        <div
          style={{
            color: COLORS.muted,
            fontSize: 11,
            marginBottom: 4,
            textAlign: isMe ? 'right' : 'left',
          }}
        >
          {from}
        </div>
        <div
          style={{
            background: isMe ? COLORS.chatBlue : COLORS.chatReceived,
            color: COLORS.white,
            padding: '12px 16px',
            borderRadius: 18,
            fontSize: 18,
            fontWeight: 500,
            lineHeight: 1.35,
          }}
        >
          {text}
        </div>
      </div>
    </div>
  );
};

// ─── Scene 3: Calendar ───────────────────────────────────────────────────────

const CalendarScene: React.FC = () => {
  const events = [
    { time: '8:30 AM', title: 'Airport pickup', loc: 'DPS → Villa', delay: 6, hl: false },
    { time: '11:30 AM', title: 'Brunch at Sisterfields', loc: 'Seminyak', delay: 14, hl: false },
    { time: '2:00 PM', title: 'Beach + surf lessons', loc: 'Echo Beach', delay: 22, hl: true },
    {
      time: '8:00 PM',
      title: 'Group dinner reservation',
      loc: 'Mama San (8 ppl)',
      delay: 30,
      hl: false,
    },
  ];
  return (
    <>
      <BgWash />
      <Card>
        <div style={{ padding: '22px 32px', borderBottom: `1px solid ${COLORS.border}` }}>
          <Row>
            <div style={{ color: COLORS.white, fontWeight: 800, fontSize: 22 }}>
              Saturday · Mar 21
            </div>
            <div style={{ flex: 1 }} />
            <div style={{ color: COLORS.gold, fontSize: 13, fontWeight: 700 }}>
              Shared itinerary
            </div>
          </Row>
        </div>
        <div style={{ padding: 28, display: 'flex', flexDirection: 'column', gap: 12 }}>
          {events.map(e => (
            <CalRow key={e.title} {...e} />
          ))}
        </div>
      </Card>
      <SceneCaption text="Everyone sees the latest schedule." />
    </>
  );
};

const CalRow: React.FC<{
  time: string;
  title: string;
  loc: string;
  delay: number;
  hl: boolean;
}> = ({ time, title, loc, delay, hl }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const enter = spring({ frame, fps, delay, config: SPRING.smooth });
  const opacity = interpolate(enter, [0, 1], [0, 1]);
  const x = interpolate(enter, [0, 1], [-20, 0]);
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 24,
        padding: '16px 20px',
        background: hl ? `${COLORS.gold}14` : COLORS.surfaceLight,
        border: `1px solid ${hl ? COLORS.gold : COLORS.border}`,
        borderRadius: 14,
        opacity,
        transform: `translateX(${x}px)`,
      }}
    >
      <div style={{ width: 110, color: COLORS.gold, fontWeight: 700, fontSize: 18 }}>{time}</div>
      <div style={{ flex: 1 }}>
        <div style={{ color: COLORS.white, fontWeight: 700, fontSize: 20 }}>{title}</div>
        <div style={{ color: COLORS.muted, fontSize: 14, marginTop: 2 }}>{loc}</div>
      </div>
    </div>
  );
};

// ─── Scene 4: Places / Basecamp ──────────────────────────────────────────────

const PlacesScene: React.FC = () => {
  const pins = [
    {
      label: 'Villa Basecamp',
      sub: 'Jl. Pantai Batu Bolong 88',
      x: 38,
      y: 46,
      primary: true,
      delay: 6,
    },
    { label: 'Mama San', sub: 'Dinner · Sat 8pm', x: 62, y: 38, primary: false, delay: 14 },
    { label: 'Echo Beach', sub: 'Surf lessons · 2pm', x: 28, y: 64, primary: false, delay: 22 },
    { label: 'DPS Airport', sub: 'Pickup zone', x: 74, y: 70, primary: false, delay: 30 },
  ];
  return (
    <>
      <BgWash />
      <Card>
        <div style={{ position: 'relative', width: '100%', height: '100%' }}>
          {/* Faux map */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background:
                'radial-gradient(ellipse at 30% 40%, #1a2a3a 0%, #0a1420 60%, #050a10 100%)',
            }}
          />
          {/* Grid lines */}
          {Array.from({ length: 12 }).map((_, i) => (
            <div
              key={`v${i}`}
              style={{
                position: 'absolute',
                top: 0,
                bottom: 0,
                left: `${(i * 100) / 12}%`,
                width: 1,
                background: `${COLORS.gold}10`,
              }}
            />
          ))}
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={`h${i}`}
              style={{
                position: 'absolute',
                left: 0,
                right: 0,
                top: `${(i * 100) / 8}%`,
                height: 1,
                background: `${COLORS.gold}10`,
              }}
            />
          ))}
          {pins.map(p => (
            <Pin key={p.label} {...p} />
          ))}
        </div>
      </Card>
      <SceneCaption text="Save addresses, reservations, and links once." />
    </>
  );
};

const Pin: React.FC<{
  label: string;
  sub: string;
  x: number;
  y: number;
  primary: boolean;
  delay: number;
}> = ({ label, sub, x, y, primary, delay }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const enter = spring({ frame, fps, delay, config: SPRING.bouncy });
  const scale = interpolate(enter, [0, 1], [0.4, 1]);
  const opacity = interpolate(enter, [0, 1], [0, 1]);
  return (
    <div
      style={{
        position: 'absolute',
        left: `${x}%`,
        top: `${y}%`,
        transform: `translate(-50%, -100%) scale(${scale})`,
        opacity,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 6,
      }}
    >
      <div
        style={{
          background: primary ? COLORS.gold : COLORS.white,
          color: COLORS.background,
          padding: '8px 14px',
          borderRadius: 10,
          fontWeight: 700,
          fontSize: 14,
          boxShadow: primary ? SHADOWS.goldGlow : SHADOWS.card,
          whiteSpace: 'nowrap',
        }}
      >
        {label}
        <div style={{ fontSize: 11, fontWeight: 500, opacity: 0.7, marginTop: 2 }}>{sub}</div>
      </div>
      <div
        style={{
          width: 0,
          height: 0,
          borderLeft: '8px solid transparent',
          borderRight: '8px solid transparent',
          borderTop: `10px solid ${primary ? COLORS.gold : COLORS.white}`,
        }}
      />
    </div>
  );
};

// ─── Scene 5: Payments ───────────────────────────────────────────────────────

const PaymentsScene: React.FC = () => {
  const expenses = [
    { who: 'You paid', what: 'Villa deposit', amount: '$1,200', split: '$200 each', delay: 6 },
    {
      who: 'Maya paid',
      what: 'Group dinner · Mama San',
      amount: '$336',
      split: '$42 each',
      delay: 14,
    },
    { who: 'Alex paid', what: 'Surf lessons', amount: '$240', split: '$30 each', delay: 22 },
  ];
  return (
    <>
      <BgWash />
      <Card>
        <div style={{ padding: '24px 32px', borderBottom: `1px solid ${COLORS.border}` }}>
          <Row>
            <div style={{ color: COLORS.white, fontWeight: 800, fontSize: 22 }}>Payments</div>
            <div style={{ flex: 1 }} />
            <div
              style={{
                background: COLORS.paymentBg,
                color: COLORS.paymentGreen,
                padding: '8px 14px',
                borderRadius: 8,
                fontSize: 13,
                fontWeight: 700,
              }}
            >
              You're owed $312
            </div>
          </Row>
        </div>
        <div style={{ padding: 28, display: 'flex', flexDirection: 'column', gap: 12 }}>
          {expenses.map(e => (
            <ExpenseRow key={e.what} {...e} />
          ))}
        </div>
      </Card>
      <SceneCaption text="Know who paid, who owes, and what's settled." />
    </>
  );
};

const ExpenseRow: React.FC<{
  who: string;
  what: string;
  amount: string;
  split: string;
  delay: number;
}> = ({ who, what, amount, split, delay }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const enter = spring({ frame, fps, delay, config: SPRING.smooth });
  const opacity = interpolate(enter, [0, 1], [0, 1]);
  const y = interpolate(enter, [0, 1], [14, 0]);
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 20,
        padding: '18px 22px',
        background: COLORS.surfaceLight,
        border: `1px solid ${COLORS.border}`,
        borderRadius: 14,
        opacity,
        transform: `translateY(${y}px)`,
      }}
    >
      <div style={{ flex: 1 }}>
        <div style={{ color: COLORS.muted, fontSize: 13 }}>{who}</div>
        <div style={{ color: COLORS.white, fontWeight: 700, fontSize: 19, marginTop: 2 }}>
          {what}
        </div>
      </div>
      <div style={{ textAlign: 'right' }}>
        <div style={{ color: COLORS.white, fontWeight: 800, fontSize: 22 }}>{amount}</div>
        <div style={{ color: COLORS.gold, fontSize: 13, marginTop: 2 }}>{split}</div>
      </div>
    </div>
  );
};

// ─── Scene 6: AI Concierge ───────────────────────────────────────────────────

const ConciergeScene: React.FC = () => {
  const frame = useCurrentFrame();
  const prompt = 'Summarize Saturday and who still owes for dinner.';
  const answer =
    'Saturday: brunch 11:30, beach 2:00, dinner 8:00. Jordan and Maya still owe $42 each for Mama San.';
  const promptChars = Math.min(
    prompt.length,
    Math.floor(interpolate(frame, [10, 40], [0, prompt.length], { extrapolateRight: 'clamp' })),
  );
  const answerChars = Math.min(
    answer.length,
    Math.floor(interpolate(frame, [48, 90], [0, answer.length], { extrapolateRight: 'clamp' })),
  );
  return (
    <>
      <BgWash />
      <Card>
        <div style={{ padding: '24px 32px', borderBottom: `1px solid ${COLORS.border}` }}>
          <Row>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 18,
                background: GRADIENTS.goldButton,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: COLORS.background,
                fontWeight: 800,
              }}
            >
              ✦
            </div>
            <div style={{ color: COLORS.white, fontWeight: 800, fontSize: 22 }}>
              Concierge · Bali Trip 2026
            </div>
          </Row>
        </div>
        <div style={{ padding: 32, display: 'flex', flexDirection: 'column', gap: 18 }}>
          <div
            style={{
              alignSelf: 'flex-end',
              maxWidth: 720,
              background: COLORS.chatBlue,
              color: COLORS.white,
              padding: '14px 20px',
              borderRadius: 18,
              fontSize: 20,
              fontWeight: 500,
            }}
          >
            {prompt.slice(0, promptChars)}
            {promptChars < prompt.length ? '▍' : ''}
          </div>
          {answerChars > 0 && (
            <div
              style={{
                alignSelf: 'flex-start',
                maxWidth: 880,
                background: COLORS.surfaceLight,
                border: `1px solid ${COLORS.borderGold}`,
                color: COLORS.white,
                padding: '16px 22px',
                borderRadius: 18,
                fontSize: 20,
                lineHeight: 1.45,
                fontWeight: 500,
              }}
            >
              <div
                style={{
                  color: COLORS.gold,
                  fontSize: 12,
                  fontWeight: 700,
                  marginBottom: 6,
                  letterSpacing: '0.15em',
                }}
              >
                CHRAVEL CONCIERGE
              </div>
              {answer.slice(0, answerChars)}
              {answerChars < answer.length ? '▍' : ''}
            </div>
          )}
        </div>
      </Card>
      <SceneCaption text="AI that knows your trip — not generic advice." />
    </>
  );
};

// ─── Composition ─────────────────────────────────────────────────────────────

export const HomepageHeroDemo: React.FC = () => {
  const t = linearTiming({ durationInFrames: TRANSITION });
  return (
    <AbsoluteFill style={{ background: COLORS.background, fontFamily }}>
      <TransitionSeries>
        <TransitionSeries.Sequence durationInFrames={SCENE}>
          <DashboardScene />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={slide({ direction: 'from-right' })} timing={t} />
        <TransitionSeries.Sequence durationInFrames={SCENE}>
          <ChatScene />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={fade()} timing={t} />
        <TransitionSeries.Sequence durationInFrames={SCENE}>
          <CalendarScene />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={fade()} timing={t} />
        <TransitionSeries.Sequence durationInFrames={SCENE}>
          <PlacesScene />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={fade()} timing={t} />
        <TransitionSeries.Sequence durationInFrames={SCENE}>
          <PaymentsScene />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={fade()} timing={t} />
        <TransitionSeries.Sequence durationInFrames={SCENE + 15}>
          <ConciergeScene />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={fade()} timing={t} />
        <TransitionSeries.Sequence durationInFrames={END}>
          <EndCard />
        </TransitionSeries.Sequence>
      </TransitionSeries>
    </AbsoluteFill>
  );
};
