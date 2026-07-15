import React from 'react';
import { interpolate, spring } from 'remotion';
import { Glyph, GlyphName } from '../Glyph';
import {
  BORDER,
  CARD,
  FPS,
  GOLD_GRADIENT,
  GOLD_LIGHT,
  GOLD_MID,
  INK_1,
  INK_2,
  INK_3,
} from '../theme';

export type TabDef = {
  key: string;
  label: string;
  icon: GlyphName;
};

export const TABS: TabDef[] = [
  { key: 'chat', label: 'Chat', icon: 'chat' },
  { key: 'calendar', label: 'Calendar', icon: 'calendar' },
  { key: 'concierge', label: 'Concierge', icon: 'sparkle' },
  { key: 'media', label: 'Media', icon: 'photo' },
  { key: 'polls', label: 'Polls', icon: 'poll' },
  { key: 'tasks', label: 'Tasks', icon: 'check' },
  { key: 'files', label: 'Files & Notes', icon: 'file' },
];

// Local frame passed down = frames since this tab became the active tab
// (negative while it is still upcoming). Used for micro-animations.
type PanelProps = { activeFor: number };

const panelStyle: React.CSSProperties = {
  width: '100%',
  height: '100%',
  padding: '14px 16px',
  display: 'flex',
  flexDirection: 'column',
  gap: 10,
  fontFamily: 'inherit',
};

const sectionTitle: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 700,
  letterSpacing: 1.2,
  textTransform: 'uppercase',
  color: INK_3,
};

const AVATAR_COLORS = ['#7c5cbf', '#3b82a0', '#b0684f', '#5e8f62', '#a35d84'];

export const MiniAvatar: React.FC<{ i: number; size?: number; label?: string }> = ({
  i,
  size = 26,
  label,
}) => (
  <div
    style={{
      width: size,
      height: size,
      borderRadius: '50%',
      background: `linear-gradient(135deg, ${AVATAR_COLORS[i % AVATAR_COLORS.length]}, #1d1d21)`,
      border: '1.5px solid rgba(255,255,255,0.18)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: 'rgba(255,255,255,0.9)',
      fontSize: size * 0.42,
      fontWeight: 700,
      flexShrink: 0,
    }}
  >
    {label ?? ''}
  </div>
);

const Bubble: React.FC<{
  mine?: boolean;
  children: React.ReactNode;
  avatar?: number;
  appearAt?: number;
  activeFor?: number;
}> = ({ mine, children, avatar, appearAt = -999, activeFor = 0 }) => {
  const pop =
    appearAt <= -999
      ? 1
      : spring({
          frame: Math.max(0, activeFor - appearAt),
          fps: FPS,
          config: { damping: 16, stiffness: 220 },
          durationInFrames: 18,
        });
  const shown = activeFor >= appearAt;
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: mine ? 'flex-end' : 'flex-start',
        alignItems: 'flex-end',
        gap: 7,
        opacity: shown ? 1 : 0,
        transform: `scale(${shown ? 0.85 + 0.15 * pop : 0.85})`,
        transformOrigin: mine ? 'bottom right' : 'bottom left',
      }}
    >
      {!mine && avatar !== undefined ? <MiniAvatar i={avatar} label="" size={22} /> : null}
      <div
        style={{
          maxWidth: 220,
          padding: '9px 13px',
          borderRadius: 18,
          borderBottomRightRadius: mine ? 5 : 18,
          borderBottomLeftRadius: mine ? 18 : 5,
          background: mine ? GOLD_GRADIENT : 'rgba(255,255,255,0.09)',
          color: mine ? '#161006' : INK_1,
          fontSize: 13.5,
          fontWeight: mine ? 600 : 400,
          lineHeight: 1.35,
        }}
      >
        {children}
      </div>
    </div>
  );
};

export const ChatPanel: React.FC<PanelProps> = ({ activeFor }) => {
  const dotBounce = (i: number) => Math.sin((Math.max(activeFor, 0) / FPS) * 6 + i * 0.9) * 2.5;
  return (
    <div style={{ ...panelStyle, justifyContent: 'flex-end', paddingBottom: 22 }}>
      <div style={{ ...sectionTitle }}>Today</div>
      <Bubble avatar={0}>Just landed! 🛬 Who's at the hotel?</Bubble>
      <Bubble mine>Checked in — room 1204. Rooftop at 7?</Bubble>
      <Bubble avatar={2}>Adding the ramen spot to the calendar 🍜</Bubble>
      <Bubble mine appearAt={18} activeFor={activeFor}>
        Poll is up — vote for Saturday!
      </Bubble>
      {/* Typing indicator */}
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 7 }}>
        <MiniAvatar i={4} label="" size={22} />
        <div
          style={{
            padding: '10px 13px',
            borderRadius: 18,
            borderBottomLeftRadius: 5,
            background: 'rgba(255,255,255,0.09)',
            display: 'flex',
            gap: 4,
          }}
        >
          {[0, 1, 2].map(i => (
            <div
              key={i}
              style={{
                width: 6,
                height: 6,
                borderRadius: '50%',
                background: INK_2,
                transform: `translateY(${dotBounce(i)}px)`,
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

const EventCard: React.FC<{
  time: string;
  title: string;
  sub: string;
  icon: GlyphName;
}> = ({ time, title, sub, icon }) => (
  <div
    style={{
      display: 'flex',
      alignItems: 'center',
      gap: 12,
      padding: '12px 13px',
      borderRadius: 16,
      background: CARD,
      border: `1px solid ${BORDER}`,
    }}
  >
    <div
      style={{
        padding: '5px 9px',
        borderRadius: 9,
        background: 'rgba(196,151,70,0.14)',
        border: '1px solid rgba(196,151,70,0.4)',
        color: GOLD_MID,
        fontSize: 11.5,
        fontWeight: 700,
        whiteSpace: 'nowrap',
      }}
    >
      {time}
    </div>
    <div style={{ flex: 1, minWidth: 0 }}>
      <div style={{ color: INK_1, fontSize: 13.5, fontWeight: 600 }}>{title}</div>
      <div style={{ color: INK_3, fontSize: 11.5, marginTop: 1 }}>{sub}</div>
    </div>
    <div style={{ color: INK_3 }}>
      <Glyph name={icon} size={15} />
    </div>
  </div>
);

export const CalendarPanel: React.FC<PanelProps> = () => (
  <div style={panelStyle}>
    <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
      <div style={{ color: INK_1, fontSize: 19, fontWeight: 800 }}>Tue, Apr 14</div>
      <div style={{ color: INK_3, fontSize: 12 }}>Day 3 of 7</div>
    </div>
    <EventCard time="10:40" title="Flight NH 231 lands" sub="Haneda · Terminal 3" icon="plane" />
    <EventCard time="14:00" title="Hotel check-in" sub="Shibuya Stream Hotel" icon="folder" />
    <EventCard time="19:00" title="Ramen tour" sub="Added by Maya · 6 going" icon="clock" />
    <div
      style={{
        marginTop: 2,
        padding: '10px 13px',
        borderRadius: 14,
        border: '1px dashed rgba(196,151,70,0.45)',
        color: GOLD_MID,
        fontSize: 12,
        fontWeight: 600,
        textAlign: 'center',
      }}
    >
      Synced with everyone's calendar
    </div>
  </div>
);

export const ConciergePanel: React.FC<PanelProps> = ({ activeFor }) => {
  const reveal = interpolate(activeFor, [10, 30], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  return (
    <div style={panelStyle}>
      <Bubble mine>Best sushi near our hotel tonight?</Bubble>
      <div
        style={{
          borderRadius: 16,
          background: CARD,
          border: '1px solid rgba(196,151,70,0.35)',
          padding: 13,
          opacity: reveal,
          transform: `translateY(${(1 - reveal) * 10}px)`,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 8 }}>
          <div style={{ color: GOLD_MID }}>
            <Glyph name="sparkle" size={15} fill />
          </div>
          <div style={{ color: GOLD_LIGHT, fontSize: 12, fontWeight: 700 }}>
            Concierge · knows your trip
          </div>
        </div>
        {[
          ['Sushi Katsu', '4 min from Shibuya Stream · ¥¥'],
          ['Uogashi Nihon-Ichi', 'Standing bar · fits your 7pm gap'],
          ['Midori Sushi', 'Group-friendly · books 8 seats'],
        ].map(([name, sub], i) => (
          <div
            key={name}
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '8px 2px',
              borderTop: i === 0 ? 'none' : `1px solid ${BORDER}`,
            }}
          >
            <div>
              <div style={{ color: INK_1, fontSize: 13, fontWeight: 600 }}>{name}</div>
              <div style={{ color: INK_3, fontSize: 11 }}>{sub}</div>
            </div>
            <div
              style={{
                color: '#161006',
                background: GOLD_GRADIENT,
                borderRadius: 999,
                fontSize: 10.5,
                fontWeight: 700,
                padding: '4px 10px',
              }}
            >
              Add
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const PHOTO_GRADIENTS = [
  'linear-gradient(135deg, #2c3e6b, #7290c9)',
  'linear-gradient(135deg, #7d4a2f, #d99a62)',
  'linear-gradient(135deg, #274e3d, #6fae8f)',
  'linear-gradient(135deg, #5b3b6e, #a67cc9)',
  'linear-gradient(135deg, #6e3b3b, #c97c7c)',
  'linear-gradient(135deg, #1f4e5f, #66a5ad)',
  'linear-gradient(135deg, #4a4a2f, #a3a362)',
  'linear-gradient(135deg, #3b2f6e, #7c6fc9)',
  'linear-gradient(135deg, #6e5a2f, #c9ae62)',
];

export const MediaPanel: React.FC<PanelProps> = ({ activeFor }) => (
  <div style={panelStyle}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
      <div style={{ color: INK_1, fontSize: 15, fontWeight: 700 }}>Shared album</div>
      <div style={{ color: INK_3, fontSize: 11.5 }}>128 photos · 8 people</div>
    </div>
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: 6,
      }}
    >
      {PHOTO_GRADIENTS.map((g, i) => {
        const pop = spring({
          frame: Math.max(0, activeFor - i * 2),
          fps: FPS,
          config: { damping: 200 },
          durationInFrames: 14,
        });
        return (
          <div
            key={i}
            style={{
              paddingBottom: '100%',
              borderRadius: 10,
              background: g,
              position: 'relative',
              overflow: 'hidden',
              opacity: 0.35 + 0.65 * pop,
              transform: `scale(${0.92 + 0.08 * pop})`,
            }}
          >
            <div
              style={{
                position: 'absolute',
                inset: 0,
                background:
                  'radial-gradient(circle at 30% 25%, rgba(255,255,255,0.25), rgba(0,0,0,0.15) 70%)',
              }}
            />
          </div>
        );
      })}
    </div>
    <div style={{ color: INK_3, fontSize: 11.5, textAlign: 'center' }}>
      Everyone's photos land here automatically
    </div>
  </div>
);

export const PollsPanel: React.FC<PanelProps> = ({ activeFor }) => {
  const options: Array<[string, number]> = [
    ['Mt. Fuji day trip', 62],
    ['Kamakura beaches', 25],
    ['Free explore day', 13],
  ];
  return (
    <div style={panelStyle}>
      <div style={{ color: INK_1, fontSize: 16, fontWeight: 800 }}>Saturday plan — vote now</div>
      <div style={{ color: INK_3, fontSize: 11.5, marginTop: -6 }}>8 of 8 voted · closes 6pm</div>
      {options.map(([label, pct], i) => {
        const grow = spring({
          frame: Math.max(0, activeFor - 6 - i * 5),
          fps: FPS,
          config: { damping: 200 },
          durationInFrames: 28,
        });
        const lead = i === 0;
        return (
          <div
            key={label}
            style={{
              position: 'relative',
              borderRadius: 13,
              border: `1px solid ${lead ? 'rgba(196,151,70,0.5)' : BORDER}`,
              overflow: 'hidden',
              padding: '11px 13px',
            }}
          >
            <div
              style={{
                position: 'absolute',
                inset: 0,
                width: `${pct * grow}%`,
                background: lead
                  ? 'linear-gradient(90deg, rgba(196,151,70,0.32), rgba(232,175,72,0.16))'
                  : 'rgba(255,255,255,0.07)',
              }}
            />
            <div
              style={{
                position: 'relative',
                display: 'flex',
                justifyContent: 'space-between',
                color: lead ? GOLD_LIGHT : INK_1,
                fontSize: 13,
                fontWeight: lead ? 700 : 500,
              }}
            >
              <span>{label}</span>
              <span>{Math.round(pct * grow)}%</span>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export const TasksPanel: React.FC<PanelProps> = ({ activeFor }) => {
  const items: Array<[string, string, boolean]> = [
    ['Book airport transfer', 'Leo · done', true],
    ['Reserve ramen tour', 'Maya · done', true],
    ['Exchange yen', 'You · today', false],
    ['Pack rain jackets', 'Everyone', false],
  ];
  // Third item checks itself off while the tab is active
  const checkAnim = spring({
    frame: Math.max(0, activeFor - 22),
    fps: FPS,
    config: { damping: 14, stiffness: 200 },
    durationInFrames: 16,
  });
  return (
    <div style={panelStyle}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <div style={{ color: INK_1, fontSize: 16, fontWeight: 800 }}>Trip tasks</div>
        <div style={{ color: GOLD_MID, fontSize: 11.5, fontWeight: 700 }}>
          {activeFor > 22 ? '3' : '2'} of 4 done
        </div>
      </div>
      {items.map(([label, sub, done], i) => {
        const isAnimated = i === 2;
        const checked = done || (isAnimated && activeFor > 22);
        const scale = isAnimated ? 1 + 0.25 * Math.sin(Math.PI * Math.min(checkAnim, 1)) : 1;
        return (
          <div
            key={label}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 11,
              padding: '11px 13px',
              borderRadius: 14,
              background: CARD,
              border: `1px solid ${BORDER}`,
            }}
          >
            <div
              style={{
                width: 22,
                height: 22,
                borderRadius: '50%',
                border: checked ? 'none' : `2px solid ${INK_3}`,
                background: checked ? GOLD_GRADIENT : 'transparent',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transform: `scale(${scale})`,
              }}
            >
              {checked ? (
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#161006"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M5 13l4 4 10-11" />
                </svg>
              ) : null}
            </div>
            <div style={{ flex: 1 }}>
              <div
                style={{
                  color: checked ? INK_3 : INK_1,
                  fontSize: 13.5,
                  fontWeight: 600,
                  textDecoration: checked ? 'line-through' : 'none',
                }}
              >
                {label}
              </div>
              <div style={{ color: INK_3, fontSize: 11 }}>{sub}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export const FilesPanel: React.FC<PanelProps> = () => (
  <div style={panelStyle}>
    <div style={{ ...sectionTitle }}>Trip documents</div>
    {[
      ['Flight-itinerary.pdf', 'Imported from Gmail', 'file'],
      ['Hotel-confirmation.pdf', 'Shared by Leo', 'file'],
      ['Rail-passes.pdf', 'Smart Import · 8 passes', 'file'],
    ].map(([name, sub, icon]) => (
      <div
        key={name}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 11,
          padding: '11px 13px',
          borderRadius: 14,
          background: CARD,
          border: `1px solid ${BORDER}`,
        }}
      >
        <div
          style={{
            width: 34,
            height: 34,
            borderRadius: 9,
            background: 'rgba(196,151,70,0.13)',
            border: '1px solid rgba(196,151,70,0.35)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: GOLD_MID,
          }}
        >
          <Glyph name={icon as GlyphName} size={16} />
        </div>
        <div>
          <div style={{ color: INK_1, fontSize: 13, fontWeight: 600 }}>{name}</div>
          <div style={{ color: INK_3, fontSize: 11 }}>{sub}</div>
        </div>
      </div>
    ))}
    <div style={{ ...sectionTitle, marginTop: 4 }}>Notes</div>
    <div
      style={{
        padding: '11px 13px',
        borderRadius: 14,
        background: 'rgba(196,151,70,0.08)',
        border: '1px solid rgba(196,151,70,0.3)',
        color: INK_1,
        fontSize: 12.5,
        lineHeight: 1.45,
      }}
    >
      JR Pass activates <b style={{ color: GOLD_LIGHT }}>Apr 13</b> — everyone bring passports for
      pickup. Meeting lobby 9:00.
    </div>
  </div>
);

export const PANELS: Array<React.FC<PanelProps>> = [
  ChatPanel,
  CalendarPanel,
  ConciergePanel,
  MediaPanel,
  PollsPanel,
  TasksPanel,
  FilesPanel,
];
