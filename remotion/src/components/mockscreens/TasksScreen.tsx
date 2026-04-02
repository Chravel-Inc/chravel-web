import { interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { loadFont } from '@remotion/google-fonts/Inter';
import { COLORS, SPRING } from '../../theme';
import { TabBar } from '../TabBar';

const { fontFamily } = loadFont('normal', {
  weights: ['400', '500', '600', '700'],
  subsets: ['latin'],
});

const TASKS = [
  { text: 'Book airport transfer', assignee: 'Sarah', done: true, delay: 10 },
  { text: 'Pack snorkel gear', assignee: 'Mike', done: true, delay: 16 },
  { text: 'Confirm restaurant reservation', assignee: 'You', done: false, delay: 22 },
  { text: 'Buy travel insurance', assignee: 'Alex', done: false, delay: 28 },
  { text: 'Share flight details', assignee: 'You', done: false, delay: 34 },
];

type TasksScreenProps = {
  animationDelay?: number;
};

export const TasksScreen: React.FC<TasksScreenProps> = ({ animationDelay = 0 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  return (
    <div
      style={{ width: '100%', height: '100%', background: COLORS.background, position: 'relative' }}
    >
      {/* Header */}
      <div style={{ padding: '8px 12px', borderBottom: `1px solid ${COLORS.border}` }}>
        <div style={{ fontFamily, fontSize: 12, fontWeight: 700, color: COLORS.white }}>
          ✅ Tasks
        </div>
        <div style={{ fontFamily, fontSize: 8, color: COLORS.muted, marginTop: 2 }}>
          2 of 5 complete
        </div>
      </div>

      {/* Task list */}
      <div style={{ padding: '6px 10px', display: 'flex', flexDirection: 'column', gap: 4 }}>
        {TASKS.map((task, i) => {
          const progress = spring({
            frame,
            fps,
            delay: animationDelay + task.delay,
            config: SPRING.smooth,
          });
          const opacity = interpolate(progress, [0, 1], [0, 1]);
          const x = interpolate(progress, [0, 1], [20, 0]);

          // Checkmark animation (slightly after entrance for incomplete tasks becoming complete)
          const checkProgress = task.done
            ? spring({
                frame,
                fps,
                delay: animationDelay + task.delay + 8,
                config: SPRING.snappy,
              })
            : 0;

          return (
            <div
              key={i}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '6px 8px',
                background: COLORS.surface,
                border: `1px solid ${COLORS.border}`,
                borderRadius: 8,
                opacity,
                transform: `translateX(${x}px)`,
              }}
            >
              {/* Checkbox */}
              <div
                style={{
                  width: 16,
                  height: 16,
                  borderRadius: 4,
                  border: task.done
                    ? `2px solid ${COLORS.paymentGreen}`
                    : `2px solid ${COLORS.mutedLight}`,
                  background: task.done ? `${COLORS.paymentGreen}20` : 'transparent',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                {task.done && (
                  <div
                    style={{
                      fontSize: 9,
                      color: COLORS.paymentGreen,
                      opacity: interpolate(
                        typeof checkProgress === 'number' ? checkProgress : 0,
                        [0, 1],
                        [0, 1],
                      ),
                      transform: `scale(${interpolate(
                        typeof checkProgress === 'number' ? checkProgress : 0,
                        [0, 1],
                        [0.5, 1],
                      )})`,
                    }}
                  >
                    ✓
                  </div>
                )}
              </div>

              {/* Task content */}
              <div style={{ flex: 1 }}>
                <div
                  style={{
                    fontFamily,
                    fontSize: 10,
                    fontWeight: 600,
                    color: task.done ? COLORS.mutedLight : COLORS.white,
                    textDecoration: task.done ? 'line-through' : 'none',
                  }}
                >
                  {task.text}
                </div>
                <div style={{ fontFamily, fontSize: 7, color: COLORS.muted }}>
                  Assigned to {task.assignee}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <TabBar activeTab="tasks" delay={animationDelay + 5} />
    </div>
  );
};
