import { interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { loadFont } from '@remotion/google-fonts/Inter';
import { COLORS, SPRING } from '../../theme';

const { fontFamily } = loadFont('normal', {
  weights: ['400', '500', '600', '700'],
  subsets: ['latin'],
});

/** Shared layout chrome for "old way" apps */
const AppChrome: React.FC<{
  title: string;
  accent: string;
  children: React.ReactNode;
  delay?: number;
}> = ({ title, accent, children, delay = 0 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const entrance = spring({ frame, fps, delay, config: SPRING.smooth });

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        background: '#000000',
        position: 'relative',
        opacity: interpolate(entrance, [0, 1], [0, 1]),
      }}
    >
      <div
        style={{
          padding: '10px 14px 8px',
          borderBottom: '1px solid #1c1c1e',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
        }}
      >
        <div
          style={{
            width: 8,
            height: 8,
            borderRadius: '50%',
            background: accent,
            boxShadow: `0 0 8px ${accent}80`,
          }}
        />
        <div style={{ fontFamily, fontSize: 13, fontWeight: 700, color: '#fff' }}>{title}</div>
      </div>
      {children}
    </div>
  );
};

export const MessagesAppScreen: React.FC<{ delay?: number }> = ({ delay = 0 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const messages = [
    { text: 'Wait which hotel did we book??', own: false, d: 6 },
    { text: 'Check the other group chat', own: true, d: 14 },
    { text: 'Can someone send the flight PDF?', own: false, d: 22 },
    { text: 'I think Sarah has it in Photos…', own: true, d: 30 },
  ];

  return (
    <AppChrome title="Bali Trip 🌴" accent="#34C759" delay={delay}>
      <div style={{ padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: 8 }}>
        {messages.map((m, i) => {
          const p = spring({
            frame,
            fps,
            delay: delay + m.d,
            config: SPRING.snappy,
          });
          return (
            <div
              key={i}
              style={{
                alignSelf: m.own ? 'flex-end' : 'flex-start',
                maxWidth: '82%',
                background: m.own ? COLORS.chatBlue : '#1c1c1e',
                borderRadius: 14,
                padding: '7px 10px',
                opacity: interpolate(p, [0, 1], [0, 1]),
                transform: `translateY(${interpolate(p, [0, 1], [8, 0])}px)`,
              }}
            >
              <div style={{ fontFamily, fontSize: 11, color: '#fff', lineHeight: 1.3 }}>
                {m.text}
              </div>
            </div>
          );
        })}
      </div>
      <div
        style={{
          position: 'absolute',
          bottom: 12,
          left: 10,
          right: 10,
          height: 28,
          borderRadius: 14,
          background: '#1c1c1e',
          display: 'flex',
          alignItems: 'center',
          padding: '0 12px',
          fontFamily,
          fontSize: 10,
          color: '#8e8e93',
        }}
      >
        iMessage
      </div>
    </AppChrome>
  );
};

export const CalendarAppScreen: React.FC<{ delay?: number }> = ({ delay = 0 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const events = [
    { time: '9:00', title: 'Flight to Bali', color: '#FF3B30' },
    { time: '14:30', title: 'Hotel check-in', color: '#007AFF' },
    { time: '19:00', title: 'Dinner?? (not sure)', color: '#FF9500' },
  ];

  return (
    <AppChrome title="Calendar" accent="#FF3B30" delay={delay}>
      <div style={{ padding: '10px 12px' }}>
        <div
          style={{ fontFamily, fontSize: 11, fontWeight: 600, color: '#8e8e93', marginBottom: 8 }}
        >
          Sat, Mar 15
        </div>
        {events.map((e, i) => {
          const p = spring({
            frame,
            fps,
            delay: delay + 8 + i * 8,
            config: SPRING.snappy,
          });
          return (
            <div
              key={i}
              style={{
                display: 'flex',
                gap: 8,
                marginBottom: 8,
                opacity: interpolate(p, [0, 1], [0, 1]),
                transform: `translateX(${interpolate(p, [0, 1], [12, 0])}px)`,
              }}
            >
              <div style={{ fontFamily, fontSize: 10, color: '#8e8e93', width: 36 }}>{e.time}</div>
              <div
                style={{
                  flex: 1,
                  background: '#1c1c1e',
                  borderLeft: `3px solid ${e.color}`,
                  borderRadius: 6,
                  padding: '6px 8px',
                  fontFamily,
                  fontSize: 11,
                  color: '#fff',
                  fontWeight: 500,
                }}
              >
                {e.title}
              </div>
            </div>
          );
        })}
      </div>
    </AppChrome>
  );
};

export const AiAssistantAppScreen: React.FC<{ delay?: number }> = ({ delay = 0 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const reply = spring({ frame, fps, delay: delay + 18, config: SPRING.smooth });

  return (
    <AppChrome title="AI Assistant" accent="#AF52DE" delay={delay}>
      <div style={{ padding: '12px' }}>
        <div
          style={{
            alignSelf: 'flex-end',
            background: '#2c2c2e',
            borderRadius: 12,
            padding: '8px 10px',
            marginBottom: 10,
            fontFamily,
            fontSize: 11,
            color: '#fff',
          }}
        >
          Best restaurants near our hotel in Bali?
        </div>
        <div
          style={{
            background: '#1c1c1e',
            borderRadius: 12,
            padding: '8px 10px',
            opacity: interpolate(reply, [0, 1], [0, 1]),
            transform: `translateY(${interpolate(reply, [0, 1], [8, 0])}px)`,
            fontFamily,
            fontSize: 11,
            color: '#e5e5ea',
            lineHeight: 1.35,
          }}
        >
          Here are a few ideas — but I don&apos;t know your hotel, budget, or group prefs…
        </div>
        <div
          style={{
            marginTop: 12,
            fontFamily,
            fontSize: 9,
            color: '#8e8e93',
            fontStyle: 'italic',
          }}
        >
          No trip context · Starts from scratch every time
        </div>
      </div>
    </AppChrome>
  );
};

export const PhotosAppScreen: React.FC<{ delay?: number }> = ({ delay = 0 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const tiles = ['#3a5a40', '#1d3557', '#6d597a', '#bc6c25', '#457b9d', '#e9c46a'];

  return (
    <AppChrome title="Photos" accent="#FF2D55" delay={delay}>
      <div
        style={{
          padding: 10,
          display: 'grid',
          gridTemplateColumns: '1fr 1fr 1fr',
          gap: 4,
        }}
      >
        {tiles.map((color, i) => {
          const p = spring({
            frame,
            fps,
            delay: delay + 6 + i * 4,
            config: SPRING.snappy,
          });
          return (
            <div
              key={i}
              style={{
                aspectRatio: '1',
                borderRadius: 4,
                background: `linear-gradient(145deg, ${color}, ${color}99)`,
                opacity: interpolate(p, [0, 1], [0, 1]),
                transform: `scale(${interpolate(p, [0, 1], [0.85, 1])})`,
              }}
            />
          );
        })}
      </div>
      <div
        style={{
          padding: '4px 12px',
          fontFamily,
          fontSize: 9,
          color: '#8e8e93',
        }}
      >
        Buried in Camera Roll · Hard to share with group
      </div>
    </AppChrome>
  );
};

export const FilesAppScreen: React.FC<{ delay?: number }> = ({ delay = 0 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const files = [
    { name: 'Screenshot 284.png', folder: 'Recents' },
    { name: 'flight_conf_FINAL.pdf', folder: 'Downloads' },
    { name: 'booking copy 2.pdf', folder: 'On My iPhone' },
  ];

  return (
    <AppChrome title="Files" accent="#007AFF" delay={delay}>
      <div style={{ padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: 6 }}>
        {files.map((f, i) => {
          const p = spring({
            frame,
            fps,
            delay: delay + 8 + i * 7,
            config: SPRING.snappy,
          });
          return (
            <div
              key={i}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '8px',
                background: '#1c1c1e',
                borderRadius: 8,
                opacity: interpolate(p, [0, 1], [0, 1]),
              }}
            >
              <div style={{ fontSize: 14 }}>📁</div>
              <div>
                <div style={{ fontFamily, fontSize: 11, color: '#fff', fontWeight: 500 }}>
                  {f.name}
                </div>
                <div style={{ fontFamily, fontSize: 8, color: '#8e8e93' }}>{f.folder}</div>
              </div>
            </div>
          );
        })}
        <div style={{ fontFamily, fontSize: 9, color: '#8e8e93', marginTop: 6 }}>
          Where was that document again?
        </div>
      </div>
    </AppChrome>
  );
};

export const TodoAppScreen: React.FC<{ delay?: number }> = ({ delay = 0 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const tasks = [
    { text: 'Book airport transfer', done: false },
    { text: 'Split Airbnb deposit', done: false },
    { text: 'Confirm dinner reservation', done: true },
  ];

  return (
    <AppChrome title="Reminders" accent="#FFCC00" delay={delay}>
      <div style={{ padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: 8 }}>
        {tasks.map((t, i) => {
          const p = spring({
            frame,
            fps,
            delay: delay + 8 + i * 7,
            config: SPRING.snappy,
          });
          return (
            <div
              key={i}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                opacity: interpolate(p, [0, 1], [0, 1]),
                transform: `translateY(${interpolate(p, [0, 1], [6, 0])}px)`,
              }}
            >
              <div
                style={{
                  width: 14,
                  height: 14,
                  borderRadius: '50%',
                  border: `2px solid ${t.done ? '#FFCC00' : '#636366'}`,
                  background: t.done ? '#FFCC00' : 'transparent',
                }}
              />
              <div
                style={{
                  fontFamily,
                  fontSize: 11,
                  color: t.done ? '#8e8e93' : '#fff',
                  textDecoration: t.done ? 'line-through' : 'none',
                }}
              >
                {t.text}
              </div>
            </div>
          );
        })}
        <div style={{ fontFamily, fontSize: 9, color: '#8e8e93', marginTop: 8 }}>
          Only on your phone · Group can&apos;t see it
        </div>
      </div>
    </AppChrome>
  );
};

export type HomeAppIcon = {
  id: string;
  label: string;
  color: string;
  emoji: string;
};

export const HOME_APPS: HomeAppIcon[] = [
  { id: 'messages', label: 'Messages', color: '#34C759', emoji: '💬' },
  { id: 'calendar', label: 'Calendar', color: '#FF3B30', emoji: '📅' },
  { id: 'ai', label: 'Assistant', color: '#AF52DE', emoji: '✨' },
  { id: 'photos', label: 'Photos', color: '#FF2D55', emoji: '🖼️' },
  { id: 'files', label: 'Files', color: '#007AFF', emoji: '📁' },
  { id: 'todo', label: 'Reminders', color: '#FFCC00', emoji: '✅' },
  { id: 'maps', label: 'Maps', color: '#64D2FF', emoji: '🗺️' },
  { id: 'notes', label: 'Notes', color: '#FFD60A', emoji: '📝' },
  { id: 'mail', label: 'Mail', color: '#5AC8FA', emoji: '✉️' },
  { id: 'wallet', label: 'Wallet', color: '#BF5AF2', emoji: '💳' },
  { id: 'safari', label: 'Safari', color: '#0A84FF', emoji: '🧭' },
  { id: 'settings', label: 'Settings', color: '#8E8E93', emoji: '⚙️' },
];

type HomeScreenProps = {
  scrollY?: number;
  highlightId?: string | null;
  pulse?: number;
};

export const HomeScreen: React.FC<HomeScreenProps> = ({
  scrollY = 0,
  highlightId = null,
  pulse = 0,
}) => {
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        background: 'linear-gradient(180deg, #0b1220 0%, #1a1030 55%, #0a0a12 100%)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'radial-gradient(circle at 30% 20%, rgba(100,140,255,0.18), transparent 45%), radial-gradient(circle at 80% 70%, rgba(180,80,200,0.12), transparent 40%)',
        }}
      />
      <div
        style={{
          padding: '8px 14px 0',
          transform: `translateY(${-scrollY}px)`,
        }}
      >
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: '14px 10px',
            paddingTop: 8,
          }}
        >
          {HOME_APPS.map(app => {
            const isHighlight = highlightId === app.id;
            const scale = isHighlight ? 1 + pulse * 0.08 : 1;
            return (
              <div
                key={app.id}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 4,
                  transform: `scale(${scale})`,
                }}
              >
                <div
                  style={{
                    width: 42,
                    height: 42,
                    borderRadius: 10,
                    background: `linear-gradient(145deg, ${app.color}, ${app.color}cc)`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 18,
                    boxShadow: isHighlight
                      ? `0 0 0 2px #fff, 0 0 16px ${app.color}aa`
                      : '0 4px 10px rgba(0,0,0,0.35)',
                  }}
                >
                  {app.emoji}
                </div>
                <div
                  style={{
                    fontFamily,
                    fontSize: 8,
                    color: '#fff',
                    fontWeight: 500,
                    textAlign: 'center',
                  }}
                >
                  {app.label}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
