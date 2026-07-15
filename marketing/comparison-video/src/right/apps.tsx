import React from 'react';
import { spring } from 'remotion';
import { Glyph, GlyphName } from '../Glyph';
import { StatusBar } from '../IPhoneFrame';
import { FPS, SCREEN_W } from '../theme';

// ---------- App icons (generic look-alikes, no real artwork) ----------

export type AppKind = 'messages' | 'calendar' | 'aichat' | 'photos' | 'files' | 'todo';

type IconSpec = {
  bg: string;
  glyph?: GlyphName;
  glyphColor?: string;
  custom?: React.ReactNode;
};

const PHOTO_PETALS = [
  '#f2c144',
  '#ee7c4b',
  '#e0526e',
  '#a75dc4',
  '#5b74d6',
  '#4fb0dd',
  '#57c785',
  '#a4cf4e',
];

const photosPetals = (
  <div style={{ position: 'relative', width: '100%', height: '100%' }}>
    {PHOTO_PETALS.map((c, i) => {
      const angle = (i / PHOTO_PETALS.length) * Math.PI * 2;
      return (
        <div
          key={i}
          style={{
            position: 'absolute',
            left: '50%',
            top: '50%',
            width: '34%',
            height: '34%',
            borderRadius: '50%',
            background: c,
            opacity: 0.85,
            transform: `translate(-50%, -50%) translate(${Math.cos(angle) * 10}px, ${Math.sin(angle) * 10}px)`,
          }}
        />
      );
    })}
  </div>
);

const calendarFace = (
  <div
    style={{
      width: '100%',
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#fff',
    }}
  >
    <div
      style={{ fontSize: 8, fontWeight: 700, color: '#e0352b', letterSpacing: 0.5, marginTop: 3 }}
    >
      TUE
    </div>
    <div style={{ fontSize: 24, fontWeight: 300, color: '#1c1c1e', lineHeight: 1, marginTop: 1 }}>
      14
    </div>
  </div>
);

export const APP_ICONS: Record<AppKind, IconSpec> = {
  messages: {
    bg: 'linear-gradient(180deg, #6be36b 0%, #27b43e 100%)',
    glyph: 'chat',
    glyphColor: '#fff',
  },
  calendar: { bg: '#fff', custom: calendarFace },
  aichat: {
    bg: 'linear-gradient(180deg, #2b2b3d 0%, #14141f 100%)',
    glyph: 'sparkle',
    glyphColor: '#e8e8f5',
  },
  photos: { bg: '#fff', custom: photosPetals },
  files: {
    bg: 'linear-gradient(180deg, #fdfdfd 0%, #e8e8ee 100%)',
    glyph: 'folder',
    glyphColor: '#1f7cf1',
  },
  todo: {
    bg: 'linear-gradient(180deg, #fff 0%, #f2f2f6 100%)',
    glyph: 'check',
    glyphColor: '#f08a24',
  },
};

type DecoySpec = { label: string; bg: string; glyph: GlyphName; glyphColor: string };

export const DECOYS: DecoySpec[] = [
  {
    label: 'Weather',
    bg: 'linear-gradient(180deg, #4d9fe8, #2364c8)',
    glyph: 'sun',
    glyphColor: '#ffe37e',
  },
  {
    label: 'Mail',
    bg: 'linear-gradient(180deg, #57b7f5, #1a7de0)',
    glyph: 'mail',
    glyphColor: '#fff',
  },
  { label: 'Maps', bg: '#f4f4f6', glyph: 'map', glyphColor: '#4caf50' },
  {
    label: 'Music',
    bg: 'linear-gradient(180deg, #fb5c74, #e0356a)',
    glyph: 'music',
    glyphColor: '#fff',
  },
  { label: 'Clock', bg: '#141416', glyph: 'clock', glyphColor: '#fff' },
  {
    label: 'Notes',
    bg: 'linear-gradient(180deg, #ffe9a8 12%, #fff 12%)',
    glyph: 'note',
    glyphColor: '#e8a413',
  },
  {
    label: 'Settings',
    bg: 'linear-gradient(180deg, #9a9aa2, #6d6d75)',
    glyph: 'gear',
    glyphColor: '#ececf0',
  },
  {
    label: 'Camera',
    bg: 'linear-gradient(180deg, #8e8e96, #5c5c64)',
    glyph: 'camera',
    glyphColor: '#fff',
  },
  { label: 'Wallet', bg: '#17171c', glyph: 'wallet', glyphColor: '#fff' },
  { label: 'Web', bg: '#f4f4f6', glyph: 'globe', glyphColor: '#2d7ff0' },
  {
    label: 'Fitness',
    bg: 'linear-gradient(180deg, #3d3d44, #202027)',
    glyph: 'clock',
    glyphColor: '#b9ff4e',
  },
  {
    label: 'Bank',
    bg: 'linear-gradient(180deg, #3a6c56, #23453a)',
    glyph: 'wallet',
    glyphColor: '#d6e9df',
  },
  {
    label: 'Podcasts',
    bg: 'linear-gradient(180deg, #b06ef0, #7a3add)',
    glyph: 'music',
    glyphColor: '#fff',
  },
  {
    label: 'News',
    bg: 'linear-gradient(180deg, #fb4f57, #d92830)',
    glyph: 'file',
    glyphColor: '#fff',
  },
  {
    label: 'Translate',
    bg: 'linear-gradient(180deg, #4c68e0, #2b41ad)',
    glyph: 'globe',
    glyphColor: '#fff',
  },
  {
    label: 'Phone',
    bg: 'linear-gradient(180deg, #6be36b, #27b43e)',
    glyph: 'phone',
    glyphColor: '#fff',
  },
];

type AppIconProps = {
  spec: IconSpec | DecoySpec;
  size?: number;
  badge?: number;
};

export const AppIcon: React.FC<AppIconProps> = ({ spec, size = 56, badge }) => {
  const glyphSize = size * 0.5;
  const isDecoy = 'label' in spec;
  const bg = spec.bg;
  const glyph = spec.glyph;
  const glyphColor = isDecoy ? spec.glyphColor : (spec as IconSpec).glyphColor;
  const custom = isDecoy ? undefined : (spec as IconSpec).custom;
  return (
    <div
      style={{
        position: 'relative',
        width: size,
        height: size,
        borderRadius: size * 0.24,
        background: bg,
        overflow: 'visible',
        boxShadow: '0 4px 10px rgba(0,0,0,0.28)',
      }}
    >
      <div
        style={{
          position: 'absolute',
          inset: 0,
          borderRadius: size * 0.24,
          overflow: 'hidden',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {custom ??
          (glyph ? (
            <Glyph name={glyph} size={glyphSize} color={glyphColor} strokeWidth={2.2} />
          ) : null)}
      </div>
      {badge ? (
        <div
          style={{
            position: 'absolute',
            top: -6,
            right: -6,
            minWidth: 19,
            height: 19,
            borderRadius: 10,
            background: '#ff3b30',
            color: '#fff',
            fontSize: 11,
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '0 5px',
          }}
        >
          {badge}
        </div>
      ) : null}
    </div>
  );
};

// Dock apps must not repeat in the grid; page-2 fillers are unique too
const DOCK_LABELS = new Set(['Phone', 'Web', 'Mail', 'Music']);
const PAGE1_DECOYS: DecoySpec[] = DECOYS.filter(d => !DOCK_LABELS.has(d.label));

const PAGE2_FILLERS: DecoySpec[] = [
  { label: 'Stocks', bg: '#16161a', glyph: 'poll', glyphColor: '#4cd964' },
  {
    label: 'Shop',
    bg: 'linear-gradient(180deg, #f7a34b, #e2762a)',
    glyph: 'wallet',
    glyphColor: '#fff',
  },
  {
    label: 'Games',
    bg: 'linear-gradient(180deg, #7b6cf6, #4a3fd1)',
    glyph: 'sparkle',
    glyphColor: '#fff',
  },
  {
    label: 'Docs',
    bg: 'linear-gradient(180deg, #5b8def, #3462c8)',
    glyph: 'file',
    glyphColor: '#fff',
  },
  {
    label: 'Radio',
    bg: 'linear-gradient(180deg, #e05c9a, #b93277)',
    glyph: 'music',
    glyphColor: '#fff',
  },
  {
    label: 'Scan',
    bg: 'linear-gradient(180deg, #8a94a6, #5c6474)',
    glyph: 'camera',
    glyphColor: '#fff',
  },
];

// ---------- Home screen geometry ----------

const ICON_SIZE = 56;
const GRID_COLS = 4;
const GRID_GAP = (SCREEN_W - GRID_COLS * ICON_SIZE) / (GRID_COLS + 1); // ~26.4
const GRID_TOP = 74;
const ROW_PITCH = 94;

const cellX = (col: number): number => GRID_GAP + col * (ICON_SIZE + GRID_GAP);
const cellY = (row: number): number => GRID_TOP + row * ROW_PITCH;

// Where each target app lives on page 2 (col, row)
const TARGET_CELLS: Record<AppKind, { col: number; row: number }> = {
  messages: { col: 0, row: 0 },
  calendar: { col: 1, row: 0 },
  aichat: { col: 2, row: 0 },
  photos: { col: 3, row: 0 },
  files: { col: 0, row: 1 },
  todo: { col: 1, row: 1 },
};

export const targetIconCenter = (app: AppKind): { x: number; y: number } => {
  const { col, row } = TARGET_CELLS[app];
  return { x: cellX(col) + ICON_SIZE / 2, y: cellY(row) + ICON_SIZE / 2 };
};

const IconWithLabel: React.FC<{
  spec: IconSpec | DecoySpec;
  label: string;
  x: number;
  y: number;
  badge?: number;
  highlight?: number; // 0..1 tap feedback
}> = ({ spec, label, x, y, badge, highlight = 0 }) => (
  <div
    style={{
      position: 'absolute',
      left: x,
      top: y,
      width: ICON_SIZE,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: 5,
      transform: `scale(${1 - 0.14 * highlight})`,
      filter: highlight > 0 ? `brightness(${1 - 0.3 * highlight})` : undefined,
    }}
  >
    <AppIcon spec={spec} badge={badge} />
    <div
      style={{
        fontSize: 9.5,
        fontWeight: 500,
        color: 'rgba(255,255,255,0.95)',
        textShadow: '0 1px 3px rgba(0,0,0,0.5)',
        whiteSpace: 'nowrap',
      }}
    >
      {label}
    </div>
  </div>
);

const APP_LABELS: Record<AppKind, string> = {
  messages: 'Messages',
  calendar: 'Calendar',
  aichat: 'AI Chat',
  photos: 'Photos',
  files: 'Files',
  todo: 'To-Do',
};

const APP_BADGES: Partial<Record<AppKind, number>> = {
  messages: 12,
  aichat: 1,
};

type HomeScreenProps = {
  pageOffset: number; // 0 = page 1, 1 = page 2 (continuous during swipe)
  tapApp?: AppKind;
  tapProgress?: number; // 0..1
};

export const HomeScreen: React.FC<HomeScreenProps> = ({ pageOffset, tapApp, tapProgress = 0 }) => {
  const page1 = PAGE1_DECOYS;
  const page2Decoys = PAGE2_FILLERS;
  const targets = Object.keys(TARGET_CELLS) as AppKind[];

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        background: 'linear-gradient(160deg, #30354d 0%, #1e2233 38%, #232030 65%, #3a2f3b 100%)',
        overflow: 'hidden',
      }}
    >
      {/* Wallpaper glow */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'radial-gradient(circle at 70% 20%, rgba(120,130,190,0.35), transparent 55%), radial-gradient(circle at 25% 80%, rgba(190,130,120,0.22), transparent 50%)',
        }}
      />
      <StatusBar />

      {/* Pages strip */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          bottom: 0,
          left: 0,
          width: SCREEN_W * 2,
          transform: `translateX(${-pageOffset * SCREEN_W}px)`,
        }}
      >
        {/* Page 1: decoys only */}
        <div style={{ position: 'absolute', left: 0, top: 0, width: SCREEN_W, height: '100%' }}>
          {page1.map((d, i) => (
            <IconWithLabel
              key={d.label}
              spec={d}
              label={d.label}
              x={cellX(i % GRID_COLS)}
              y={cellY(Math.floor(i / GRID_COLS))}
              badge={d.label === 'Mail' ? 47 : undefined}
            />
          ))}
        </div>

        {/* Page 2: trip apps + more decoys */}
        <div
          style={{ position: 'absolute', left: SCREEN_W, top: 0, width: SCREEN_W, height: '100%' }}
        >
          {targets.map(app => (
            <IconWithLabel
              key={app}
              spec={APP_ICONS[app]}
              label={APP_LABELS[app]}
              x={cellX(TARGET_CELLS[app].col)}
              y={cellY(TARGET_CELLS[app].row)}
              badge={APP_BADGES[app]}
              highlight={tapApp === app ? tapProgress : 0}
            />
          ))}
          {page2Decoys.map((d, i) => {
            const cellIndex = 6 + i; // after the 6 target apps
            return (
              <IconWithLabel
                key={`p2-${d.label}`}
                spec={d}
                label={d.label}
                x={cellX(cellIndex % GRID_COLS)}
                y={cellY(Math.floor(cellIndex / GRID_COLS))}
              />
            );
          })}
        </div>
      </div>

      {/* Page dots */}
      <div
        style={{
          position: 'absolute',
          bottom: 112,
          left: 0,
          right: 0,
          display: 'flex',
          justifyContent: 'center',
          gap: 7,
        }}
      >
        {[0, 1].map(p => (
          <div
            key={p}
            style={{
              width: 7,
              height: 7,
              borderRadius: '50%',
              background:
                Math.round(pageOffset) === p ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.35)',
            }}
          />
        ))}
      </div>

      {/* Dock */}
      <div
        style={{
          position: 'absolute',
          bottom: 22,
          left: 12,
          right: 12,
          height: 82,
          borderRadius: 26,
          background: 'rgba(255,255,255,0.16)',
          backdropFilter: 'blur(20px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-evenly',
        }}
      >
        {[DECOYS[15], DECOYS[9], DECOYS[1], DECOYS[3]].map(d => (
          <AppIcon key={`dock-${d.label}`} spec={d} badge={d.label === 'Mail' ? 47 : undefined} />
        ))}
      </div>
    </div>
  );
};

// ---------- Individual app screens (generic iOS style) ----------

const lightNav = (title: string, accent: string): React.ReactNode => (
  <div
    style={{
      display: 'flex',
      alignItems: 'center',
      gap: 8,
      padding: '6px 14px 10px',
      borderBottom: '1px solid rgba(0,0,0,0.08)',
    }}
  >
    <svg
      width="11"
      height="18"
      viewBox="0 0 12 20"
      fill="none"
      stroke={accent}
      strokeWidth="2.5"
      strokeLinecap="round"
    >
      <path d="M10 2L3 10l7 8" />
    </svg>
    <div style={{ fontSize: 16, fontWeight: 700, color: '#111', flex: 1, textAlign: 'center' }}>
      {title}
    </div>
    <div style={{ width: 11 }} />
  </div>
);

const IBubble: React.FC<{ mine?: boolean; children: React.ReactNode; pop?: number }> = ({
  mine,
  children,
  pop = 1,
}) => (
  <div
    style={{
      display: 'flex',
      justifyContent: mine ? 'flex-end' : 'flex-start',
      opacity: pop,
      transform: `scale(${0.9 + 0.1 * pop})`,
      transformOrigin: mine ? 'bottom right' : 'bottom left',
    }}
  >
    <div
      style={{
        maxWidth: 225,
        padding: '9px 13px',
        borderRadius: 18,
        borderBottomRightRadius: mine ? 5 : 18,
        borderBottomLeftRadius: mine ? 18 : 5,
        background: mine ? '#0a84ff' : '#e9e9eb',
        color: mine ? '#fff' : '#111',
        fontSize: 13.5,
        lineHeight: 1.35,
      }}
    >
      {children}
    </div>
  </div>
);

export const MessagesApp: React.FC<{ localFrame: number; revisit?: boolean }> = ({
  localFrame,
  revisit,
}) => {
  const pop = spring({
    frame: Math.max(0, localFrame - 14),
    fps: FPS,
    config: { damping: 16, stiffness: 220 },
    durationInFrames: 16,
  });
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        background: '#fff',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <StatusBar dark />
      {lightNav('Trip Squad 🌴 (8)', '#0a84ff')}
      <div
        style={{
          flex: 1,
          padding: '12px 14px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'flex-end',
          gap: 8,
        }}
      >
        <IBubble>Flights are booked!! 🎉</IBubble>
        <IBubble mine>Wait — which hotel did we pick?</IBubble>
        <IBubble>It's in the email somewhere 😅</IBubble>
        <IBubble>Can someone make a packing list?</IBubble>
        {revisit ? (
          <>
            <IBubble pop={pop}>What time is dinner??</IBubble>
            <IBubble pop={pop}>Also who has the museum tickets?</IBubble>
          </>
        ) : (
          <IBubble mine pop={pop}>
            I'll check my calendar… one sec
          </IBubble>
        )}
      </div>
      <div style={{ padding: '8px 14px 34px' }}>
        <div
          style={{
            height: 36,
            borderRadius: 18,
            border: '1px solid rgba(0,0,0,0.15)',
            display: 'flex',
            alignItems: 'center',
            padding: '0 13px',
            color: '#9a9aa2',
            fontSize: 13,
          }}
        >
          iMessage
        </div>
      </div>
    </div>
  );
};

export const CalendarApp: React.FC<{ localFrame: number }> = () => {
  const days = Array.from({ length: 30 }, (_, i) => i + 1);
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        background: '#fff',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <StatusBar dark />
      <div style={{ padding: '4px 16px 8px' }}>
        <div style={{ fontSize: 24, fontWeight: 800, color: '#e0352b' }}>April</div>
      </div>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(7, 1fr)',
          padding: '0 12px',
          rowGap: 10,
        }}
      >
        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
          <div
            key={i}
            style={{ textAlign: 'center', fontSize: 10, fontWeight: 700, color: '#9a9aa2' }}
          >
            {d}
          </div>
        ))}
        {[null, null, null].map((_, i) => (
          <div key={`pad-${i}`} />
        ))}
        {days.map(d => {
          const isTrip = d >= 12 && d <= 19;
          const isToday = d === 14;
          return (
            <div
              key={d}
              style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}
            >
              <div
                style={{
                  width: 26,
                  height: 26,
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 12.5,
                  fontWeight: isToday ? 700 : 400,
                  color: isToday ? '#fff' : '#1c1c1e',
                  background: isToday ? '#e0352b' : 'transparent',
                }}
              >
                {d}
              </div>
              {isTrip ? (
                <div style={{ width: 4, height: 4, borderRadius: 2, background: '#0a84ff' }} />
              ) : (
                <div style={{ height: 4 }} />
              )}
            </div>
          );
        })}
      </div>
      <div style={{ padding: '14px 16px', borderTop: '8px solid #f2f2f7', marginTop: 10, flex: 1 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: '#111', marginBottom: 8 }}>
          Tue, Apr 14
        </div>
        <div style={{ display: 'flex', gap: 9, alignItems: 'stretch' }}>
          <div style={{ width: 4, borderRadius: 2, background: '#0a84ff' }} />
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#111' }}>Flight NH 231</div>
            <div style={{ fontSize: 11.5, color: '#8e8e93' }}>10:40 — added manually</div>
          </div>
        </div>
        <div style={{ marginTop: 14, fontSize: 11.5, color: '#b0b0b6' }}>
          Hotel? Dinner? Still in the group chat…
        </div>
      </div>
    </div>
  );
};

export const AIChatApp: React.FC<{ localFrame: number }> = ({ localFrame }) => {
  const lines = [220, 250, 180, 235, 140];
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        background: '#141419',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <StatusBar />
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 7,
          padding: '6px 0 10px',
          borderBottom: '1px solid rgba(255,255,255,0.1)',
        }}
      >
        <Glyph name="sparkle" size={14} color="#c9c9de" fill />
        <div style={{ fontSize: 15, fontWeight: 700, color: '#ececf5' }}>AI Assistant</div>
      </div>
      <div
        style={{ flex: 1, padding: '14px 14px', display: 'flex', flexDirection: 'column', gap: 10 }}
      >
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <div
            style={{
              maxWidth: 220,
              padding: '9px 13px',
              borderRadius: 18,
              background: '#3d3d4d',
              color: '#fff',
              fontSize: 13.5,
            }}
          >
            Best sushi near Shibuya?
          </div>
        </div>
        <div
          style={{
            borderRadius: 16,
            background: '#1e1e26',
            border: '1px solid rgba(255,255,255,0.08)',
            padding: 13,
          }}
        >
          <div style={{ color: '#d5d5e2', fontSize: 12.5, marginBottom: 9 }}>
            Here are 10 popular sushi spots in Tokyo…
          </div>
          {lines.map((w, i) => {
            const reveal = spring({
              frame: Math.max(0, localFrame - 8 - i * 4),
              fps: FPS,
              config: { damping: 200 },
              durationInFrames: 12,
            });
            return (
              <div
                key={i}
                style={{
                  height: 8,
                  width: w * reveal,
                  maxWidth: '100%',
                  borderRadius: 4,
                  background: 'rgba(255,255,255,0.14)',
                  marginBottom: 7,
                }}
              />
            );
          })}
          <div style={{ color: '#77777f', fontSize: 10.5, marginTop: 6 }}>
            Tip: paste your hotel, dates & group size for better results
          </div>
        </div>
      </div>
      <div style={{ padding: '8px 14px 34px' }}>
        <div
          style={{
            height: 38,
            borderRadius: 19,
            background: '#22222c',
            display: 'flex',
            alignItems: 'center',
            padding: '0 13px',
            color: '#6d6d78',
            fontSize: 13,
          }}
        >
          Message AI…
        </div>
      </div>
    </div>
  );
};

const PHOTO_THUMBS = [
  'linear-gradient(135deg, #9db4de, #5f7ec2)',
  'linear-gradient(135deg, #dfb28a, #bd7f4f)',
  'linear-gradient(135deg, #92c7a8, #58996f)',
  'linear-gradient(135deg, #c5a3de, #8f63bd)',
  'linear-gradient(135deg, #de9d9d, #b56060)',
  'linear-gradient(135deg, #8fc0cc, #549aa8)',
  'linear-gradient(135deg, #cfcf9a, #a3a35e)',
  'linear-gradient(135deg, #a89ade, #7263bd)',
  'linear-gradient(135deg, #dec59a, #bd9a4f)',
  'linear-gradient(135deg, #9adeb9, #5fbd8a)',
  'linear-gradient(135deg, #de9ac2, #bd5f92)',
  'linear-gradient(135deg, #9ab8de, #5f87bd)',
];

export const PhotosApp: React.FC<{ localFrame: number }> = () => (
  <div
    style={{
      width: '100%',
      height: '100%',
      background: '#fff',
      display: 'flex',
      flexDirection: 'column',
    }}
  >
    <StatusBar dark />
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '4px 16px 10px',
      }}
    >
      <div style={{ fontSize: 21, fontWeight: 800, color: '#111' }}>Recents</div>
      <div style={{ fontSize: 13, fontWeight: 600, color: '#0a84ff' }}>Select</div>
    </div>
    <div
      style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 2, padding: '0 2px' }}
    >
      {PHOTO_THUMBS.map((g, i) => (
        <div key={i} style={{ paddingBottom: '100%', background: g, position: 'relative' }}>
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background:
                'radial-gradient(circle at 35% 30%, rgba(255,255,255,0.3), rgba(0,0,0,0.12) 75%)',
            }}
          />
        </div>
      ))}
    </div>
    <div style={{ padding: '12px 16px', fontSize: 11.5, color: '#b0b0b6' }}>
      Now AirDrop these to 7 people, one by one…
    </div>
  </div>
);

export const FilesApp: React.FC<{ localFrame: number }> = () => (
  <div
    style={{
      width: '100%',
      height: '100%',
      background: '#f2f2f7',
      display: 'flex',
      flexDirection: 'column',
    }}
  >
    <StatusBar dark />
    <div style={{ padding: '4px 16px 8px' }}>
      <div style={{ fontSize: 24, fontWeight: 800, color: '#111' }}>Browse</div>
      <div
        style={{
          marginTop: 8,
          height: 34,
          borderRadius: 11,
          background: 'rgba(120,120,128,0.12)',
          display: 'flex',
          alignItems: 'center',
          padding: '0 11px',
          color: '#8e8e93',
          fontSize: 13,
        }}
      >
        Search — where was that PDF?
      </div>
    </div>
    <div style={{ margin: '6px 14px', borderRadius: 13, background: '#fff', overflow: 'hidden' }}>
      {[
        ['iCloud Drive', 'folder'],
        ['Downloads', 'folder'],
        ['On My iPhone', 'folder'],
      ].map(([name, icon], i) => (
        <div
          key={name}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 11,
            padding: '12px 13px',
            borderTop: i === 0 ? 'none' : '1px solid rgba(0,0,0,0.06)',
          }}
        >
          <Glyph name={icon as GlyphName} size={19} color="#1f7cf1" />
          <div style={{ fontSize: 14, color: '#111', flex: 1 }}>{name}</div>
          <svg
            width="8"
            height="14"
            viewBox="0 0 8 14"
            fill="none"
            stroke="#c7c7cc"
            strokeWidth="2"
            strokeLinecap="round"
          >
            <path d="M1.5 1.5L6.5 7l-5 5.5" />
          </svg>
        </div>
      ))}
    </div>
    <div style={{ margin: '8px 16px 4px', fontSize: 12, fontWeight: 700, color: '#8e8e93' }}>
      Recents
    </div>
    <div style={{ margin: '0 14px', borderRadius: 13, background: '#fff' }}>
      {[
        ['Flight itinerary(3).pdf', 'Downloads · 2w ago'],
        ['hotel-booking-FINAL.pdf', 'Mail · 1mo ago'],
      ].map(([name, sub], i) => (
        <div
          key={name}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 11,
            padding: '11px 13px',
            borderTop: i === 0 ? 'none' : '1px solid rgba(0,0,0,0.06)',
          }}
        >
          <Glyph name="file" size={19} color="#e0352b" />
          <div>
            <div style={{ fontSize: 13, color: '#111', fontWeight: 500 }}>{name}</div>
            <div style={{ fontSize: 11, color: '#8e8e93' }}>{sub}</div>
          </div>
        </div>
      ))}
    </div>
  </div>
);

export const TodoApp: React.FC<{ localFrame: number }> = ({ localFrame }) => {
  const checkAnim = spring({
    frame: Math.max(0, localFrame - 24),
    fps: FPS,
    config: { damping: 14, stiffness: 200 },
    durationInFrames: 14,
  });
  const items: Array<[string, string, boolean]> = [
    ['Book airport transfer', '#f08a24', false],
    ['Exchange yen', '#0a84ff', false],
    ['Make packing list', '#34c759', false],
    ['Text everyone the plan', '#af52de', false],
  ];
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        background: '#fff',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <StatusBar dark />
      <div style={{ padding: '4px 16px 10px' }}>
        <div style={{ fontSize: 24, fontWeight: 800, color: '#f08a24' }}>Trip To-Dos</div>
        <div style={{ fontSize: 11.5, color: '#8e8e93', marginTop: 2 }}>
          Shared with… actually, just you
        </div>
      </div>
      <div style={{ padding: '0 16px', display: 'flex', flexDirection: 'column' }}>
        {items.map(([label, color], i) => {
          const checked = i === 0 && localFrame > 24;
          const scale = i === 0 ? 1 + 0.2 * Math.sin(Math.PI * Math.min(checkAnim, 1)) : 1;
          return (
            <div
              key={label}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 11,
                padding: '12px 0',
                borderBottom: '1px solid rgba(0,0,0,0.07)',
              }}
            >
              <div
                style={{
                  width: 22,
                  height: 22,
                  borderRadius: '50%',
                  border: `2px solid ${color}`,
                  background: checked ? color : 'transparent',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transform: `scale(${scale})`,
                }}
              >
                {checked ? (
                  <svg
                    width="11"
                    height="11"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#fff"
                    strokeWidth="3.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M5 13l4 4 10-11" />
                  </svg>
                ) : null}
              </div>
              <div
                style={{
                  fontSize: 14.5,
                  color: checked ? '#b0b0b6' : '#111',
                  textDecoration: checked ? 'line-through' : 'none',
                }}
              >
                {label}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
