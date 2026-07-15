import { Img, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from 'remotion';
import { loadFont } from '@remotion/google-fonts/Inter';
import { SPRING } from '../../theme';

const { fontFamily } = loadFont('normal', {
  weights: ['400', '500', '600', '700'],
  subsets: ['latin'],
});

/** iOS status bar */
export const IosStatusBar: React.FC<{ dark?: boolean; time?: string }> = ({
  dark = false,
  time = '9:41',
}) => {
  const color = dark ? '#000' : '#fff';
  return (
    <div
      style={{
        height: 48,
        padding: '14px 22px 0',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'relative',
        zIndex: 4,
      }}
    >
      <div style={{ fontFamily, fontSize: 13, fontWeight: 600, color, width: 54 }}>{time}</div>
      <div style={{ display: 'flex', gap: 5, alignItems: 'center' }}>
        <div style={{ width: 15, height: 9, borderBottom: `2px solid ${color}`, opacity: 0.9 }} />
        <div
          style={{
            width: 16,
            height: 10,
            borderRadius: 2.5,
            border: `1.2px solid ${color}`,
            opacity: 0.9,
            position: 'relative',
          }}
        >
          <div
            style={{
              position: 'absolute',
              inset: 1.5,
              borderRadius: 1,
              background: color,
              width: '70%',
            }}
          />
        </div>
      </div>
    </div>
  );
};

export type HomeAppId =
  | 'messages'
  | 'calendar'
  | 'photos'
  | 'files'
  | 'aichat'
  | 'yelp'
  | 'notes'
  | 'todo'
  | 'venmo'
  | 'safari'
  | 'maps'
  | 'settings';

const r = (size: number, ratio: number) => size * ratio;

/** Apple Calendar icon — red weekday header + large date numeral */
const CalendarIconFace: React.FC<{ size?: number }> = ({ size = 48 }) => (
  <div
    style={{
      width: size,
      height: size,
      borderRadius: r(size, 0.22),
      background: '#fff',
      overflow: 'hidden',
      boxShadow: '0 6px 14px rgba(0,0,0,0.28)',
      display: 'flex',
      flexDirection: 'column',
    }}
  >
    <div
      style={{
        background: '#FF3B30',
        height: r(size, 0.28),
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily,
        fontSize: r(size, 0.18),
        fontWeight: 700,
        color: '#fff',
        letterSpacing: 0.6,
      }}
    >
      WED
    </div>
    <div
      style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily,
        fontSize: r(size, 0.44),
        fontWeight: 700,
        color: '#000',
        lineHeight: 1,
      }}
    >
      15
    </div>
  </div>
);

/** iMessage — green gradient with white bubble */
const MessagesIconFace: React.FC<{ size?: number }> = ({ size = 48 }) => (
  <div
    style={{
      width: size,
      height: size,
      borderRadius: r(size, 0.22),
      background: 'linear-gradient(180deg, #5BF37C 0%, #20C15B 100%)',
      boxShadow: '0 6px 14px rgba(0,0,0,0.28)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative',
    }}
  >
    <div
      style={{
        width: r(size, 0.55),
        height: r(size, 0.42),
        background: '#fff',
        borderRadius: r(size, 0.18),
        position: 'relative',
      }}
    >
      <div
        style={{
          position: 'absolute',
          bottom: -r(size, 0.06),
          left: r(size, 0.08),
          width: 0,
          height: 0,
          borderLeft: `${r(size, 0.08)}px solid transparent`,
          borderRight: `${r(size, 0.04)}px solid transparent`,
          borderTop: `${r(size, 0.1)}px solid #fff`,
        }}
      />
    </div>
  </div>
);

/** Photos — classic multicolor flower */
const PhotosIconFace: React.FC<{ size?: number }> = ({ size = 48 }) => {
  const petals = [
    { c: '#F9CE34', x: 0.5, y: 0.28 },
    { c: '#F4A261', x: 0.72, y: 0.42 },
    { c: '#EE2A7B', x: 0.68, y: 0.68 },
    { c: '#6228D7', x: 0.5, y: 0.78 },
    { c: '#2D9CDB', x: 0.32, y: 0.68 },
    { c: '#27AE60', x: 0.28, y: 0.42 },
  ];
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: r(size, 0.22),
        background: '#fff',
        boxShadow: '0 6px 14px rgba(0,0,0,0.28)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {petals.map((p, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            left: `${p.x * 100}%`,
            top: `${p.y * 100}%`,
            width: r(size, 0.32),
            height: r(size, 0.32),
            marginLeft: -r(size, 0.16),
            marginTop: -r(size, 0.16),
            borderRadius: '50%',
            background: p.c,
            opacity: 0.92,
          }}
        />
      ))}
      <div
        style={{
          position: 'absolute',
          left: '50%',
          top: '50%',
          width: r(size, 0.18),
          height: r(size, 0.18),
          marginLeft: -r(size, 0.09),
          marginTop: -r(size, 0.09),
          borderRadius: '50%',
          background: '#fff',
        }}
      />
    </div>
  );
};

const FilesIconFace: React.FC<{ size?: number }> = ({ size = 48 }) => (
  <div
    style={{
      width: size,
      height: size,
      borderRadius: r(size, 0.22),
      background: 'linear-gradient(180deg, #64D2FF 0%, #0A84FF 100%)',
      boxShadow: '0 6px 14px rgba(0,0,0,0.28)',
      display: 'flex',
      alignItems: 'flex-end',
      justifyContent: 'center',
      paddingBottom: r(size, 0.14),
    }}
  >
    <div
      style={{
        width: r(size, 0.58),
        height: r(size, 0.42),
        background: '#fff',
        borderRadius: r(size, 0.06),
        position: 'relative',
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: -r(size, 0.1),
          left: 0,
          width: r(size, 0.28),
          height: r(size, 0.14),
          background: '#E8F4FF',
          borderRadius: `${r(size, 0.04)}px ${r(size, 0.04)}px 0 0`,
        }}
      />
    </div>
  </div>
);

const AiChatIconFace: React.FC<{ size?: number }> = ({ size = 48 }) => (
  <div
    style={{
      width: size,
      height: size,
      borderRadius: r(size, 0.22),
      background: 'linear-gradient(145deg, #10a37f 0%, #1a7f64 100%)',
      boxShadow: '0 6px 14px rgba(0,0,0,0.28)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily,
      fontSize: r(size, 0.38),
      fontWeight: 700,
      color: '#fff',
    }}
  >
    ✦
  </div>
);

const YelpIconFace: React.FC<{ size?: number }> = ({ size = 48 }) => (
  <div
    style={{
      width: size,
      height: size,
      borderRadius: r(size, 0.22),
      background: '#FF1A1A',
      boxShadow: '0 6px 14px rgba(0,0,0,0.28)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily,
      fontSize: r(size, 0.48),
      fontWeight: 800,
      color: '#fff',
      letterSpacing: -1,
    }}
  >
    y
  </div>
);

const NotesIconFace: React.FC<{ size?: number }> = ({ size = 48 }) => (
  <div
    style={{
      width: size,
      height: size,
      borderRadius: r(size, 0.22),
      background: '#fff',
      boxShadow: '0 6px 14px rgba(0,0,0,0.28)',
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
    }}
  >
    <div style={{ height: r(size, 0.22), background: '#FFD60A' }} />
    <div
      style={{
        flex: 1,
        padding: `${r(size, 0.1)}px ${r(size, 0.12)}px`,
        display: 'flex',
        flexDirection: 'column',
        gap: r(size, 0.08),
      }}
    >
      {[0.7, 0.55, 0.65].map((w, i) => (
        <div
          key={i}
          style={{
            height: 2,
            width: `${w * 100}%`,
            background: '#C7C7CC',
            borderRadius: 1,
          }}
        />
      ))}
    </div>
  </div>
);

const TodoIconFace: React.FC<{ size?: number }> = ({ size = 48 }) => (
  <div
    style={{
      width: size,
      height: size,
      borderRadius: r(size, 0.22),
      background: '#0078D4',
      boxShadow: '0 6px 14px rgba(0,0,0,0.28)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily,
      fontSize: r(size, 0.48),
      fontWeight: 700,
      color: '#fff',
    }}
  >
    ✓
  </div>
);

const VenmoIconFace: React.FC<{ size?: number }> = ({ size = 48 }) => (
  <div
    style={{
      width: size,
      height: size,
      borderRadius: r(size, 0.22),
      background: 'linear-gradient(180deg, #3D95CE 0%, #008CFF 100%)',
      boxShadow: '0 6px 14px rgba(0,0,0,0.28)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily,
      fontSize: r(size, 0.52),
      fontWeight: 800,
      color: '#fff',
      fontStyle: 'italic',
    }}
  >
    V
  </div>
);

const GenericIconFace: React.FC<{ size?: number; bg: string; emoji: string }> = ({
  size = 48,
  bg,
  emoji,
}) => (
  <div
    style={{
      width: size,
      height: size,
      borderRadius: r(size, 0.22),
      background: bg,
      boxShadow: '0 6px 14px rgba(0,0,0,0.28)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: r(size, 0.42),
    }}
  >
    {emoji}
  </div>
);

export const HOME_APPS: Array<{ id: HomeAppId; label: string }> = [
  { id: 'messages', label: 'Messages' },
  { id: 'calendar', label: 'Calendar' },
  { id: 'photos', label: 'Photos' },
  { id: 'files', label: 'Files' },
  { id: 'aichat', label: 'ChatGPT' },
  { id: 'yelp', label: 'Yelp' },
  { id: 'notes', label: 'Notes' },
  { id: 'todo', label: 'To Do' },
  { id: 'venmo', label: 'Venmo' },
  { id: 'maps', label: 'Maps' },
  { id: 'safari', label: 'Safari' },
  { id: 'settings', label: 'Settings' },
];

export const renderHomeIcon = (
  id: HomeAppId,
  opts: { size?: number; highlight?: boolean; pulse?: number } = {},
) => {
  const size = opts.size ?? 48;
  const face = (() => {
    switch (id) {
      case 'messages':
        return <MessagesIconFace size={size} />;
      case 'calendar':
        return <CalendarIconFace size={size} />;
      case 'photos':
        return <PhotosIconFace size={size} />;
      case 'files':
        return <FilesIconFace size={size} />;
      case 'aichat':
        return <AiChatIconFace size={size} />;
      case 'yelp':
        return <YelpIconFace size={size} />;
      case 'notes':
        return <NotesIconFace size={size} />;
      case 'todo':
        return <TodoIconFace size={size} />;
      case 'venmo':
        return <VenmoIconFace size={size} />;
      case 'maps':
        return (
          <GenericIconFace size={size} bg="linear-gradient(180deg,#64D2FF,#0A84FF)" emoji="🗺️" />
        );
      case 'safari':
        return (
          <GenericIconFace size={size} bg="linear-gradient(180deg,#64D2FF,#0A84FF)" emoji="🧭" />
        );
      case 'settings':
        return (
          <GenericIconFace size={size} bg="linear-gradient(180deg,#8E8E93,#636366)" emoji="⚙️" />
        );
      default:
        return <GenericIconFace size={size} bg="#555" emoji="•" />;
    }
  })();

  return (
    <div
      style={{
        transform: `scale(${1 + (opts.pulse ?? 0) * 0.07})`,
        boxShadow: opts.highlight ? '0 0 0 2.5px #fff, 0 0 16px rgba(255,255,255,0.45)' : undefined,
        borderRadius: r(size, 0.22),
      }}
    >
      {face}
    </div>
  );
};

type HomeScreenProps = {
  scrollY?: number;
  highlightId?: HomeAppId | null;
  pulse?: number;
};

export const IosHomeScreen: React.FC<HomeScreenProps> = ({
  scrollY = 0,
  highlightId = null,
  pulse = 0,
}) => {
  const pageApps = HOME_APPS.slice(0, 12);
  const dock: HomeAppId[] = ['messages', 'safari', 'photos', 'venmo'];

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        position: 'relative',
        overflow: 'hidden',
        background:
          'radial-gradient(ellipse at 20% 10%, #6ea8ff 0%, transparent 45%), radial-gradient(ellipse at 90% 30%, #c084fc 0%, transparent 40%), linear-gradient(165deg, #1e3a5f 0%, #0f172a 40%, #1a1035 75%, #0b1220 100%)',
      }}
    >
      <IosStatusBar />
      <div style={{ padding: '4px 14px 0', transform: `translateY(${-scrollY}px)` }}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: '14px 6px',
            justifyItems: 'center',
          }}
        >
          {pageApps.map(app => {
            const isHighlight = highlightId === app.id;
            return (
              <div
                key={app.id}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 4,
                  width: 62,
                }}
              >
                {renderHomeIcon(app.id, {
                  size: 46,
                  highlight: isHighlight,
                  pulse: isHighlight ? pulse : 0,
                })}
                <div
                  style={{
                    fontFamily,
                    fontSize: 9,
                    color: '#fff',
                    fontWeight: 500,
                    textAlign: 'center',
                    textShadow: '0 1px 3px rgba(0,0,0,0.6)',
                  }}
                >
                  {app.label}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div
        style={{
          position: 'absolute',
          left: 12,
          right: 12,
          bottom: 22,
          height: 72,
          borderRadius: 28,
          background: 'rgba(255,255,255,0.22)',
          backdropFilter: 'blur(20px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-around',
          padding: '0 10px',
          border: '1px solid rgba(255,255,255,0.18)',
        }}
      >
        {dock.map(id => (
          <div key={id}>{renderHomeIcon(id, { size: 44 })}</div>
        ))}
      </div>
    </div>
  );
};

// ─── App screens ─────────────────────────────────────────────────────────────

export const MessagesAppScreen: React.FC<{ delay?: number }> = ({ delay = 0 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const messages = [
    { text: 'Wait which hotel did we book??', own: false, name: 'Sarah', d: 4 },
    { text: 'Check the other group chat 😅', own: true, d: 12 },
    { text: 'Can someone AirDrop the flight PDF?', own: false, name: 'Mike', d: 20 },
    { text: "It's in my Photos… or Files?", own: true, d: 28 },
  ];

  return (
    <div style={{ width: '100%', height: '100%', background: '#000', position: 'relative' }}>
      <IosStatusBar />
      <div
        style={{
          padding: '0 10px 8px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '0.5px solid #2c2c2e',
        }}
      >
        <div style={{ fontFamily, fontSize: 14, color: '#0A84FF' }}>{'< Lists'}</div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontFamily, fontSize: 13, fontWeight: 600, color: '#fff' }}>Bali Trip</div>
          <div style={{ fontFamily, fontSize: 9, color: '#8e8e93' }}>iMessage · 4 people</div>
        </div>
        <div style={{ width: 40 }} />
      </div>
      <div style={{ padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: 8 }}>
        {messages.map((m, i) => {
          const p = spring({ frame, fps, delay: delay + m.d, config: SPRING.snappy });
          return (
            <div
              key={i}
              style={{
                alignSelf: m.own ? 'flex-end' : 'flex-start',
                maxWidth: '80%',
                opacity: interpolate(p, [0, 1], [0, 1]),
                transform: `translateY(${interpolate(p, [0, 1], [8, 0])}px)`,
              }}
            >
              {!m.own && (
                <div
                  style={{
                    fontFamily,
                    fontSize: 9,
                    color: '#8e8e93',
                    marginBottom: 2,
                    marginLeft: 10,
                  }}
                >
                  {m.name}
                </div>
              )}
              <div
                style={{
                  background: m.own ? '#0A84FF' : '#1c1c1e',
                  borderRadius: 18,
                  padding: '7px 11px',
                  fontFamily,
                  fontSize: 12,
                  color: '#fff',
                  lineHeight: 1.3,
                }}
              >
                {m.text}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export const CalendarAppScreen: React.FC<{ delay?: number }> = ({ delay = 0 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const events = [
    { time: '9:00 AM', title: 'Flight to DPS', color: '#FF3B30', loc: 'LAX TBIT' },
    { time: '2:30 PM', title: 'Hotel check-in', color: '#007AFF', loc: 'Seminyak' },
    { time: '7:00 PM', title: 'Dinner??', color: '#FF9500', loc: 'TBD — ask group' },
  ];

  return (
    <div style={{ width: '100%', height: '100%', background: '#000', position: 'relative' }}>
      <IosStatusBar />
      <div style={{ padding: '4px 16px 8px' }}>
        <div style={{ fontFamily, fontSize: 12, color: '#FF3B30', fontWeight: 500 }}>
          Wednesday, March 15
        </div>
        <div
          style={{
            fontFamily,
            fontSize: 28,
            fontWeight: 700,
            color: '#fff',
            letterSpacing: -0.5,
          }}
        >
          Today
        </div>
      </div>
      <div style={{ padding: '4px 12px' }}>
        {events.map((e, i) => {
          const p = spring({ frame, fps, delay: delay + 6 + i * 8, config: SPRING.snappy });
          return (
            <div
              key={i}
              style={{
                display: 'flex',
                gap: 10,
                marginBottom: 10,
                opacity: interpolate(p, [0, 1], [0, 1]),
                transform: `translateX(${interpolate(p, [0, 1], [14, 0])}px)`,
              }}
            >
              <div style={{ width: 52, paddingTop: 2 }}>
                <div style={{ fontFamily, fontSize: 10, color: '#8e8e93', fontWeight: 500 }}>
                  {e.time}
                </div>
              </div>
              <div
                style={{
                  flex: 1,
                  background: '#1c1c1e',
                  borderRadius: 10,
                  borderLeft: `3.5px solid ${e.color}`,
                  padding: '8px 10px',
                }}
              >
                <div style={{ fontFamily, fontSize: 13, fontWeight: 600, color: '#fff' }}>
                  {e.title}
                </div>
                <div style={{ fontFamily, fontSize: 10, color: '#8e8e93', marginTop: 2 }}>
                  {e.loc}
                </div>
              </div>
            </div>
          );
        })}
      </div>
      <div
        style={{
          position: 'absolute',
          bottom: 18,
          left: 0,
          right: 0,
          display: 'flex',
          justifyContent: 'space-around',
          padding: '8px 0',
          borderTop: '0.5px solid #2c2c2e',
          background: 'rgba(0,0,0,0.85)',
        }}
      >
        {['Today', 'Calendars', 'Inbox'].map((t, i) => (
          <div
            key={t}
            style={{
              fontFamily,
              fontSize: 10,
              fontWeight: i === 0 ? 600 : 400,
              color: i === 0 ? '#FF3B30' : '#8e8e93',
            }}
          >
            {t}
          </div>
        ))}
      </div>
    </div>
  );
};

const PHOTO_FILES = [
  'mock-photos/beach.jpg',
  'mock-photos/temple.jpg',
  'mock-photos/dinner.jpg',
  'mock-photos/pool.jpg',
  'mock-photos/friends.jpg',
  'mock-photos/night.jpg',
  'mock-photos/market.jpg',
  'mock-photos/flight.jpg',
  'mock-photos/hike.jpg',
];

/** iOS Photos with real mock travel images (not solid color tiles) */
export const PhotosAppScreen: React.FC<{ delay?: number }> = ({ delay = 0 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  return (
    <div style={{ width: '100%', height: '100%', background: '#000', position: 'relative' }}>
      <IosStatusBar />
      <div style={{ padding: '2px 16px 6px', display: 'flex', justifyContent: 'space-between' }}>
        <div style={{ fontFamily, fontSize: 14, color: '#0A84FF' }}>Albums</div>
        <div style={{ fontFamily, fontSize: 14, color: '#0A84FF' }}>Select</div>
      </div>
      <div style={{ padding: '0 16px 6px' }}>
        <div style={{ fontFamily, fontSize: 28, fontWeight: 700, color: '#fff' }}>Library</div>
        <div style={{ fontFamily, fontSize: 11, color: '#8e8e93', marginTop: 2 }}>
          iCloud Photos · Recents
        </div>
      </div>
      <div
        style={{
          padding: '2px 1px',
          display: 'grid',
          gridTemplateColumns: '1fr 1fr 1fr',
          gap: 1.5,
        }}
      >
        {PHOTO_FILES.map((src, i) => {
          const p = spring({ frame, fps, delay: delay + 3 + i * 3, config: SPRING.snappy });
          return (
            <div
              key={src}
              style={{
                aspectRatio: '1',
                overflow: 'hidden',
                opacity: interpolate(p, [0, 1], [0, 1]),
                transform: `scale(${interpolate(p, [0, 1], [0.94, 1])})`,
              }}
            >
              <Img
                src={staticFile(src)}
                style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
              />
            </div>
          );
        })}
      </div>
      <div
        style={{
          position: 'absolute',
          bottom: 18,
          left: 0,
          right: 0,
          display: 'flex',
          justifyContent: 'space-around',
          padding: '10px 0 4px',
          background: 'rgba(28,28,30,0.94)',
          borderTop: '0.5px solid #3a3a3c',
        }}
      >
        {['Library', 'For You', 'Albums', 'Search'].map((t, i) => (
          <div
            key={t}
            style={{
              fontFamily,
              fontSize: 9,
              fontWeight: i === 0 ? 600 : 400,
              color: i === 0 ? '#0A84FF' : '#8e8e93',
            }}
          >
            {t}
          </div>
        ))}
      </div>
    </div>
  );
};

export const FilesAppScreen: React.FC<{ delay?: number }> = ({ delay = 0 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const rows = [
    { name: 'flight_conf_FINAL.pdf', meta: 'iCloud Drive · PDF', icon: '📄' },
    { name: 'Airbnb confirmation.pdf', meta: 'Downloads · PDF', icon: '🏠' },
    { name: 'Screenshot 284.png', meta: 'On My iPhone · PNG', icon: '🖼️' },
    { name: 'Bali packing.xlsx', meta: 'iCloud Drive · Sheet', icon: '📊' },
  ];

  return (
    <div style={{ width: '100%', height: '100%', background: '#000' }}>
      <IosStatusBar />
      <div style={{ padding: '2px 16px 8px', display: 'flex', justifyContent: 'space-between' }}>
        <div style={{ fontFamily, fontSize: 14, color: '#0A84FF' }}>{'< Browse'}</div>
        <div style={{ fontFamily, fontSize: 14, color: '#0A84FF' }}>Select</div>
      </div>
      <div style={{ padding: '0 16px 10px' }}>
        <div style={{ fontFamily, fontSize: 28, fontWeight: 700, color: '#fff' }}>Recents</div>
        <div style={{ fontFamily, fontSize: 11, color: '#8e8e93', marginTop: 2 }}>
          iCloud Drive · On My iPhone
        </div>
      </div>
      <div style={{ padding: '0 8px' }}>
        {rows.map((row, i) => {
          const p = spring({ frame, fps, delay: delay + 6 + i * 6, config: SPRING.snappy });
          return (
            <div
              key={i}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '9px 8px',
                borderBottom: '0.5px solid #2c2c2e',
                opacity: interpolate(p, [0, 1], [0, 1]),
              }}
            >
              <div
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: 6,
                  background: '#1c1c1e',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 16,
                }}
              >
                {row.icon}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontFamily,
                    fontSize: 13,
                    color: '#fff',
                    fontWeight: 500,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {row.name}
                </div>
                <div style={{ fontFamily, fontSize: 10, color: '#8e8e93' }}>{row.meta}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

/** ChatGPT-style AI assistant — maps to Concierge */
export const AiChatAppScreen: React.FC<{ delay?: number }> = ({ delay = 0 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const reply = spring({ frame, fps, delay: delay + 16, config: SPRING.smooth });

  return (
    <div style={{ width: '100%', height: '100%', background: '#212121' }}>
      <IosStatusBar />
      <div
        style={{
          padding: '4px 14px 10px',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          borderBottom: '0.5px solid #333',
        }}
      >
        <div
          style={{
            width: 26,
            height: 26,
            borderRadius: 8,
            background: '#10a37f',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            fontSize: 12,
            fontWeight: 700,
          }}
        >
          ✦
        </div>
        <div>
          <div style={{ fontFamily, fontSize: 14, fontWeight: 600, color: '#fff' }}>ChatGPT</div>
          <div style={{ fontFamily, fontSize: 9, color: '#888' }}>No trip context</div>
        </div>
      </div>
      <div style={{ padding: 12 }}>
        <div
          style={{
            background: '#2f2f2f',
            borderRadius: 14,
            padding: '8px 10px',
            marginBottom: 10,
            marginLeft: 40,
            fontFamily,
            fontSize: 11,
            color: '#fff',
          }}
        >
          Best restaurants near our hotel in Bali?
        </div>
        <div
          style={{
            background: '#1a1a1a',
            borderRadius: 14,
            padding: '8px 10px',
            opacity: interpolate(reply, [0, 1], [0, 1]),
            transform: `translateY(${interpolate(reply, [0, 1], [8, 0])}px)`,
            fontFamily,
            fontSize: 11,
            color: '#e5e5e5',
            lineHeight: 1.4,
          }}
        >
          I can suggest a few spots — but I don&apos;t know your hotel, budget, or group dietary
          needs. Want to paste those in?
        </div>
      </div>
    </div>
  );
};

/** Yelp — maps to Places */
export const YelpAppScreen: React.FC<{ delay?: number }> = ({ delay = 0 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const places = [
    { name: 'La Favela Bali', cat: 'Nightlife · Seminyak', stars: '4.3', reviews: '1.2k' },
    { name: 'Sarong Restaurant', cat: 'Indonesian · Fine dining', stars: '4.6', reviews: '890' },
    { name: 'Potato Head Beach Club', cat: 'Beach club · Seminyak', stars: '4.1', reviews: '3.4k' },
  ];

  return (
    <div style={{ width: '100%', height: '100%', background: '#fff', position: 'relative' }}>
      <IosStatusBar dark />
      <div
        style={{
          padding: '4px 14px 10px',
          background: '#FF1A1A',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
        }}
      >
        <div style={{ fontFamily, fontSize: 20, fontWeight: 800, color: '#fff' }}>yelp</div>
        <div
          style={{
            flex: 1,
            background: 'rgba(255,255,255,0.95)',
            borderRadius: 8,
            padding: '6px 10px',
            fontFamily,
            fontSize: 11,
            color: '#666',
          }}
        >
          Bali restaurants near me
        </div>
      </div>
      <div style={{ padding: '8px 10px' }}>
        {places.map((pl, i) => {
          const p = spring({ frame, fps, delay: delay + 6 + i * 7, config: SPRING.snappy });
          return (
            <div
              key={i}
              style={{
                display: 'flex',
                gap: 10,
                padding: '10px 4px',
                borderBottom: '0.5px solid #e5e5e5',
                opacity: interpolate(p, [0, 1], [0, 1]),
              }}
            >
              <div
                style={{
                  width: 52,
                  height: 52,
                  borderRadius: 6,
                  background: `linear-gradient(145deg, hsl(${20 + i * 40},60%,55%), hsl(${40 + i * 40},50%,35%))`,
                  flexShrink: 0,
                }}
              />
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily, fontSize: 13, fontWeight: 700, color: '#111' }}>
                  {pl.name}
                </div>
                <div style={{ fontFamily, fontSize: 10, color: '#666', marginTop: 2 }}>
                  ★ {pl.stars} · {pl.reviews} reviews
                </div>
                <div style={{ fontFamily, fontSize: 10, color: '#888', marginTop: 2 }}>
                  {pl.cat}
                </div>
              </div>
            </div>
          );
        })}
        <div
          style={{
            fontFamily,
            fontSize: 10,
            color: '#999',
            marginTop: 10,
            textAlign: 'center',
          }}
        >
          Not shared with your trip group
        </div>
      </div>
    </div>
  );
};

/** Apple Notes — maps to Polls / basic shared notes */
export const NotesAppScreen: React.FC<{ delay?: number }> = ({ delay = 0 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const entrance = spring({ frame, fps, delay: delay + 6, config: SPRING.smooth });

  return (
    <div style={{ width: '100%', height: '100%', background: '#1c1c1e' }}>
      <IosStatusBar />
      <div style={{ padding: '2px 14px 8px', display: 'flex', justifyContent: 'space-between' }}>
        <div style={{ fontFamily, fontSize: 14, color: '#FFD60A' }}>{'< Notes'}</div>
        <div style={{ fontFamily, fontSize: 14, color: '#FFD60A' }}>Done</div>
      </div>
      <div
        style={{
          padding: '4px 16px',
          opacity: interpolate(entrance, [0, 1], [0, 1]),
        }}
      >
        <div style={{ fontFamily, fontSize: 10, color: '#8e8e93', marginBottom: 6 }}>
          March 12 · On My iPhone
        </div>
        <div
          style={{
            fontFamily,
            fontSize: 22,
            fontWeight: 700,
            color: '#fff',
            marginBottom: 12,
          }}
        >
          Bali group decisions
        </div>
        <div style={{ fontFamily, fontSize: 13, color: '#e5e5e5', lineHeight: 1.55 }}>
          Restaurant Sat?
          {'\n'}• Sushi — Sarah wants
          {'\n'}• Tacos — Mike wants
          {'\n'}• Still no vote…
          {'\n\n'}
          Beach time?
          {'\n'}Need everyone to reply in the chat 🙃
        </div>
        <div
          style={{
            marginTop: 16,
            fontFamily,
            fontSize: 10,
            color: '#8e8e93',
            fontStyle: 'italic',
          }}
        >
          Private note · Group can&apos;t vote here
        </div>
      </div>
    </div>
  );
};

export const MicrosoftToDoScreen: React.FC<{ delay?: number }> = ({ delay = 0 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const tasks = [
    { text: 'Book airport transfer', done: false },
    { text: 'Split Airbnb deposit', done: false },
    { text: 'Confirm Jimbaran dinner', done: true },
    { text: 'Download offline maps', done: false },
  ];

  return (
    <div style={{ width: '100%', height: '100%', background: '#0f0f0f' }}>
      <IosStatusBar />
      <div
        style={{
          padding: '4px 14px 10px',
          background: 'linear-gradient(180deg, #0078D4 0%, #106EBE 100%)',
        }}
      >
        <div style={{ fontFamily, fontSize: 11, color: 'rgba(255,255,255,0.85)', fontWeight: 500 }}>
          Microsoft To Do
        </div>
        <div style={{ fontFamily, fontSize: 22, fontWeight: 700, color: '#fff', marginTop: 2 }}>
          My Day
        </div>
        <div style={{ fontFamily, fontSize: 11, color: 'rgba(255,255,255,0.8)', marginTop: 2 }}>
          Wednesday · 3 tasks left
        </div>
      </div>
      <div style={{ padding: '12px 12px' }}>
        {tasks.map((t, i) => {
          const p = spring({ frame, fps, delay: delay + 6 + i * 6, config: SPRING.snappy });
          return (
            <div
              key={i}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '10px 10px',
                background: '#1a1a1a',
                borderRadius: 8,
                marginBottom: 8,
                opacity: interpolate(p, [0, 1], [0, 1]),
              }}
            >
              <div
                style={{
                  width: 18,
                  height: 18,
                  borderRadius: '50%',
                  border: `2px solid ${t.done ? '#0078D4' : '#666'}`,
                  background: t.done ? '#0078D4' : 'transparent',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#fff',
                  fontSize: 11,
                  fontWeight: 700,
                }}
              >
                {t.done ? '✓' : ''}
              </div>
              <div
                style={{
                  fontFamily,
                  fontSize: 13,
                  color: t.done ? '#888' : '#fff',
                  textDecoration: t.done ? 'line-through' : 'none',
                }}
              >
                {t.text}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

/** Venmo — maps to Payments */
export const VenmoAppScreen: React.FC<{ delay?: number }> = ({ delay = 0 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const rows = [
    { name: 'Sarah Chen', memo: 'Dinner at Sakura', amount: '-$60.00', out: true },
    { name: 'Mike R.', memo: 'Airbnb deposit', amount: '-$210.00', out: true },
    { name: 'You', memo: 'Taxi split', amount: '+$18.50', out: false },
  ];

  return (
    <div style={{ width: '100%', height: '100%', background: '#fff', position: 'relative' }}>
      <IosStatusBar dark />
      <div
        style={{
          padding: '6px 14px 12px',
          background: '#008CFF',
        }}
      >
        <div style={{ fontFamily, fontSize: 11, color: 'rgba(255,255,255,0.85)' }}>Venmo</div>
        <div style={{ fontFamily, fontSize: 22, fontWeight: 700, color: '#fff', marginTop: 2 }}>
          $142.30
        </div>
        <div style={{ fontFamily, fontSize: 11, color: 'rgba(255,255,255,0.85)' }}>
          Available balance
        </div>
      </div>
      <div style={{ padding: '10px 12px' }}>
        <div
          style={{
            fontFamily,
            fontSize: 12,
            fontWeight: 600,
            color: '#666',
            marginBottom: 8,
          }}
        >
          Recent
        </div>
        {rows.map((row, i) => {
          const p = spring({ frame, fps, delay: delay + 6 + i * 7, config: SPRING.snappy });
          return (
            <div
              key={i}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '10px 0',
                borderBottom: '0.5px solid #eee',
                opacity: interpolate(p, [0, 1], [0, 1]),
              }}
            >
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: '50%',
                  background: `hsl(${200 + i * 40}, 55%, 55%)`,
                  flexShrink: 0,
                }}
              />
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily, fontSize: 13, fontWeight: 600, color: '#111' }}>
                  {row.name}
                </div>
                <div style={{ fontFamily, fontSize: 10, color: '#888' }}>{row.memo}</div>
              </div>
              <div
                style={{
                  fontFamily,
                  fontSize: 13,
                  fontWeight: 700,
                  color: row.out ? '#111' : '#008CFF',
                }}
              >
                {row.amount}
              </div>
            </div>
          );
        })}
        <div
          style={{
            fontFamily,
            fontSize: 10,
            color: '#999',
            marginTop: 12,
            textAlign: 'center',
          }}
        >
          No shared trip ledger · Chase people one by one
        </div>
      </div>
    </div>
  );
};
