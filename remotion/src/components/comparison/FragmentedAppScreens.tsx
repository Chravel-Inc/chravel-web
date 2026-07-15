import { interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { loadFont } from '@remotion/google-fonts/Inter';
import { SPRING } from '../../theme';

const { fontFamily } = loadFont('normal', {
  weights: ['400', '500', '600', '700'],
  subsets: ['latin'],
});

/** iOS system-ish chrome: time + trailing status glyphs */
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

const SquircleIcon: React.FC<{
  background: string;
  emoji?: string;
  size?: number;
  highlight?: boolean;
  pulse?: number;
  highlightColor?: string;
}> = ({ background, emoji, size = 48, highlight = false, pulse = 0, highlightColor = '#fff' }) => (
  <div
    style={{
      width: size,
      height: size,
      borderRadius: size * 0.22,
      background,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: size * 0.42,
      boxShadow: highlight
        ? `0 0 0 2.5px #fff, 0 0 18px ${highlightColor}`
        : '0 6px 14px rgba(0,0,0,0.28)',
      transform: `scale(${1 + pulse * 0.07})`,
      overflow: 'hidden',
      position: 'relative',
    }}
  >
    {emoji}
  </div>
);

export type HomeAppId =
  | 'messages'
  | 'calendar'
  | 'photos'
  | 'files'
  | 'mail'
  | 'todo'
  | 'safari'
  | 'maps'
  | 'notes'
  | 'settings'
  | 'music'
  | 'camera';

export const HOME_APPS: Array<{
  id: HomeAppId;
  label: string;
  color: string;
  emoji: string;
}> = [
  {
    id: 'messages',
    label: 'Messages',
    color: 'linear-gradient(180deg,#5AF07A,#20C05A)',
    emoji: '💬',
  },
  { id: 'calendar', label: 'Calendar', color: '#FFFFFF', emoji: '' },
  {
    id: 'photos',
    label: 'Photos',
    color: 'linear-gradient(135deg,#F9CE34,#EE2A7B,#6228D7)',
    emoji: '🖼️',
  },
  { id: 'files', label: 'Files', color: 'linear-gradient(180deg,#5AC8FA,#007AFF)', emoji: '📁' },
  { id: 'mail', label: 'Mail', color: 'linear-gradient(180deg,#5AC8FA,#007AFF)', emoji: '✉️' },
  { id: 'todo', label: 'To Do', color: '#0078D4', emoji: '✓' },
  { id: 'maps', label: 'Maps', color: 'linear-gradient(180deg,#64D2FF,#0A84FF)', emoji: '🗺️' },
  { id: 'notes', label: 'Notes', color: 'linear-gradient(180deg,#FFD60A,#FF9F0A)', emoji: '📝' },
  { id: 'safari', label: 'Safari', color: 'linear-gradient(180deg,#64D2FF,#0A84FF)', emoji: '🧭' },
  { id: 'music', label: 'Music', color: 'linear-gradient(180deg,#FF375F,#FF2D55)', emoji: '🎵' },
  { id: 'camera', label: 'Camera', color: 'linear-gradient(180deg,#8E8E93,#636366)', emoji: '📷' },
  {
    id: 'settings',
    label: 'Settings',
    color: 'linear-gradient(180deg,#8E8E93,#636366)',
    emoji: '⚙️',
  },
];

const CalendarIconFace: React.FC<{ size?: number }> = ({ size = 48 }) => (
  <div
    style={{
      width: size,
      height: size,
      borderRadius: size * 0.22,
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
        height: size * 0.28,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily,
        fontSize: size * 0.18,
        fontWeight: 700,
        color: '#fff',
        letterSpacing: 0.5,
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
        fontSize: size * 0.42,
        fontWeight: 700,
        color: '#000',
        lineHeight: 1,
      }}
    >
      15
    </div>
  </div>
);

const TodoIconFace: React.FC<{ size?: number }> = ({ size = 48 }) => (
  <div
    style={{
      width: size,
      height: size,
      borderRadius: size * 0.22,
      background: '#0078D4',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      boxShadow: '0 6px 14px rgba(0,0,0,0.28)',
      fontFamily,
      fontSize: size * 0.48,
      fontWeight: 700,
      color: '#fff',
    }}
  >
    ✓
  </div>
);

export const renderHomeIcon = (
  id: HomeAppId,
  opts: { size?: number; highlight?: boolean; pulse?: number } = {},
) => {
  const app = HOME_APPS.find(a => a.id === id)!;
  const size = opts.size ?? 48;
  if (id === 'calendar') {
    return (
      <div style={{ transform: `scale(${1 + (opts.pulse ?? 0) * 0.07})` }}>
        <div
          style={{
            boxShadow: opts.highlight
              ? '0 0 0 2.5px #fff, 0 0 18px rgba(255,59,48,0.55)'
              : undefined,
            borderRadius: size * 0.22,
          }}
        >
          <CalendarIconFace size={size} />
        </div>
      </div>
    );
  }
  if (id === 'todo') {
    return (
      <div style={{ transform: `scale(${1 + (opts.pulse ?? 0) * 0.07})` }}>
        <div
          style={{
            boxShadow: opts.highlight
              ? '0 0 0 2.5px #fff, 0 0 18px rgba(0,120,212,0.55)'
              : undefined,
            borderRadius: size * 0.22,
          }}
        >
          <TodoIconFace size={size} />
        </div>
      </div>
    );
  }
  return (
    <SquircleIcon
      background={app.color}
      size={size}
      emoji={app.emoji}
      highlight={opts.highlight}
      pulse={opts.pulse}
      highlightColor="rgba(255,255,255,0.55)"
    />
  );
};

type HomeScreenProps = {
  scrollY?: number;
  highlightId?: HomeAppId | null;
  pulse?: number;
};

/** Realistic iOS home screen with wallpaper, icon grid, and dock */
export const IosHomeScreen: React.FC<HomeScreenProps> = ({
  scrollY = 0,
  highlightId = null,
  pulse = 0,
}) => {
  const pageApps = HOME_APPS.slice(0, 12);
  const dock = [
    HOME_APPS.find(a => a.id === 'messages')!,
    HOME_APPS.find(a => a.id === 'safari')!,
    HOME_APPS.find(a => a.id === 'photos')!,
    HOME_APPS.find(a => a.id === 'mail')!,
  ];

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
      <div
        style={{
          padding: '6px 18px 0',
          transform: `translateY(${-scrollY}px)`,
        }}
      >
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: '16px 8px',
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
                  width: 64,
                }}
              >
                {renderHomeIcon(app.id, {
                  size: 48,
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

      {/* Dock */}
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
        {dock.map(app => (
          <div key={app.id}>{renderHomeIcon(app.id, { size: 46 })}</div>
        ))}
      </div>
    </div>
  );
};

/** Apple Messages — group thread about the trip */
export const MessagesAppScreen: React.FC<{ delay?: number }> = ({ delay = 0 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const messages = [
    { text: 'Wait which hotel did we book??', own: false, name: 'Sarah', d: 4 },
    { text: 'Check the other group chat 😅', own: true, d: 12 },
    { text: 'Can someone AirDrop the flight PDF?', own: false, name: 'Mike', d: 20 },
    { text: "I think it's in my Photos album…", own: true, d: 28 },
    { text: 'Or maybe Files → iCloud Drive?', own: false, name: 'Sarah', d: 36 },
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
        <div style={{ fontFamily, fontSize: 14, color: '#0A84FF', fontWeight: 400 }}>
          {'< Lists'}
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontFamily, fontSize: 13, fontWeight: 600, color: '#fff' }}>Bali Trip</div>
          <div style={{ fontFamily, fontSize: 9, color: '#8e8e93' }}>4 people · Messages</div>
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
      <div
        style={{
          position: 'absolute',
          bottom: 18,
          left: 10,
          right: 10,
          height: 32,
          borderRadius: 16,
          background: '#1c1c1e',
          border: '0.5px solid #3a3a3c',
          display: 'flex',
          alignItems: 'center',
          padding: '0 12px',
          fontFamily,
          fontSize: 12,
          color: '#8e8e93',
        }}
      >
        iMessage
      </div>
    </div>
  );
};

/** Apple Calendar — day agenda with trip events */
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
          Wed Mar 15
        </div>
        <div
          style={{ fontFamily, fontSize: 28, fontWeight: 700, color: '#fff', letterSpacing: -0.5 }}
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

/** iOS Photos (iCloud) — library grid */
export const PhotosAppScreen: React.FC<{ delay?: number }> = ({ delay = 0 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const tiles = [
    '#3d5a80',
    '#ee6c4d',
    '#98c1d9',
    '#293241',
    '#e0fbfc',
    '#ffb703',
    '#219ebc',
    '#023047',
    '#fb8500',
  ];

  return (
    <div style={{ width: '100%', height: '100%', background: '#000', position: 'relative' }}>
      <IosStatusBar />
      <div style={{ padding: '2px 16px 8px', display: 'flex', justifyContent: 'space-between' }}>
        <div style={{ fontFamily, fontSize: 14, color: '#0A84FF' }}>Albums</div>
        <div style={{ fontFamily, fontSize: 14, color: '#0A84FF' }}>Select</div>
      </div>
      <div style={{ padding: '0 16px 6px' }}>
        <div style={{ fontFamily, fontSize: 28, fontWeight: 700, color: '#fff' }}>Library</div>
        <div style={{ fontFamily, fontSize: 11, color: '#8e8e93', marginTop: 2 }}>
          iCloud Photos · 2,847 items
        </div>
      </div>
      <div
        style={{
          padding: '4px 2px',
          display: 'grid',
          gridTemplateColumns: '1fr 1fr 1fr',
          gap: 1.5,
        }}
      >
        {tiles.map((color, i) => {
          const p = spring({ frame, fps, delay: delay + 4 + i * 3, config: SPRING.snappy });
          return (
            <div
              key={i}
              style={{
                aspectRatio: '1',
                background: `linear-gradient(145deg, ${color}, ${color}88)`,
                opacity: interpolate(p, [0, 1], [0, 1]),
                transform: `scale(${interpolate(p, [0, 1], [0.92, 1])})`,
              }}
            />
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
        {[
          { t: 'Library', on: true },
          { t: 'For You', on: false },
          { t: 'Albums', on: false },
          { t: 'Search', on: false },
        ].map(tab => (
          <div
            key={tab.t}
            style={{
              fontFamily,
              fontSize: 9,
              fontWeight: tab.on ? 600 : 400,
              color: tab.on ? '#0A84FF' : '#8e8e93',
              textAlign: 'center',
            }}
          >
            {tab.t}
          </div>
        ))}
      </div>
    </div>
  );
};

/** iOS Files — iCloud Drive / Recents */
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
        {rows.map((r, i) => {
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
                {r.icon}
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
                  {r.name}
                </div>
                <div style={{ fontFamily, fontSize: 10, color: '#8e8e93' }}>{r.meta}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

/** Apple Mail — trip confirmation emails buried in inbox */
export const MailAppScreen: React.FC<{ delay?: number }> = ({ delay = 0 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const mails = [
    {
      from: 'Airbnb',
      subject: 'Your booking confirmation',
      preview: 'Villa Seminyak · Mar 15–20 · Confirmation…',
      time: 'Mon',
      unread: true,
    },
    {
      from: 'United Airlines',
      subject: 'Upcoming trip to Denpasar',
      preview: 'Confirmation #UA482910 · Check in opens…',
      time: 'Sun',
      unread: true,
    },
    {
      from: 'Sarah Chen',
      subject: 'Re: dinner reservations?',
      preview: 'Did anyone book Jimbaran yet or should I…',
      time: 'Sat',
      unread: false,
    },
  ];

  return (
    <div style={{ width: '100%', height: '100%', background: '#000' }}>
      <IosStatusBar />
      <div style={{ padding: '2px 16px 6px', display: 'flex', justifyContent: 'space-between' }}>
        <div style={{ fontFamily, fontSize: 14, color: '#0A84FF' }}>{'< Mailboxes'}</div>
        <div style={{ fontFamily, fontSize: 14, color: '#0A84FF' }}>Edit</div>
      </div>
      <div style={{ padding: '0 16px 8px' }}>
        <div style={{ fontFamily, fontSize: 28, fontWeight: 700, color: '#fff' }}>Inbox</div>
        <div style={{ fontFamily, fontSize: 11, color: '#8e8e93' }}>
          Updated Just Now · All Inboxes
        </div>
      </div>
      {mails.map((m, i) => {
        const p = spring({ frame, fps, delay: delay + 6 + i * 7, config: SPRING.snappy });
        return (
          <div
            key={i}
            style={{
              padding: '10px 16px',
              borderBottom: '0.5px solid #2c2c2e',
              display: 'flex',
              gap: 8,
              opacity: interpolate(p, [0, 1], [0, 1]),
            }}
          >
            <div
              style={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                background: m.unread ? '#0A84FF' : 'transparent',
                marginTop: 5,
                flexShrink: 0,
              }}
            />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <div
                  style={{
                    fontFamily,
                    fontSize: 13,
                    fontWeight: m.unread ? 700 : 500,
                    color: '#fff',
                  }}
                >
                  {m.from}
                </div>
                <div style={{ fontFamily, fontSize: 11, color: '#8e8e93' }}>{m.time}</div>
              </div>
              <div
                style={{
                  fontFamily,
                  fontSize: 12,
                  fontWeight: m.unread ? 600 : 400,
                  color: '#fff',
                  marginTop: 1,
                }}
              >
                {m.subject}
              </div>
              <div
                style={{
                  fontFamily,
                  fontSize: 11,
                  color: '#8e8e93',
                  marginTop: 1,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {m.preview}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

/** Microsoft To Do — distinctive blue branding vs Apple Reminders */
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
                transform: `translateY(${interpolate(p, [0, 1], [6, 0])}px)`,
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
        <div style={{ fontFamily, fontSize: 10, color: '#888', marginTop: 8, textAlign: 'center' }}>
          Only on your phone · Group can&apos;t see updates
        </div>
      </div>
    </div>
  );
};
