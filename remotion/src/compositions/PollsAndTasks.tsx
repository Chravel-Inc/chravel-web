import {
  AbsoluteFill,
  Sequence,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import { loadFont } from '@remotion/google-fonts/Inter';
import { COLORS, SPRING, TIMING, FPS } from '../theme';
import { PhoneFrame } from '../components/PhoneFrame';
import { TravelBackground } from '../components/TravelBackground';
import { EndCard } from '../components/EndCard';
import { PollsScreen } from '../components/mockscreens/PollsScreen';
import { TasksScreen } from '../components/mockscreens/TasksScreen';
import { NotificationPop } from '../components/NotificationPop';

const { fontFamily } = loadFont('normal', {
  weights: ['400', '600', '700', '800'],
  subsets: ['latin'],
});

export const POLLS_TASKS_DURATION = 12 * FPS; // 360 frames

/** Scene: Polls & Tasks — create poll with live voting, assign tasks with notifications */
export const PollsAndTasks: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Title
  const titleProgress = spring({ frame, fps, delay: 5, config: SPRING.smooth });

  // Phone transition (polls → tasks crossfade around frame 160)
  const transitionProgress = interpolate(frame, [150, 180], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <AbsoluteFill>
      <TravelBackground variant="gradient" />

      {/* Title overlay */}
      <div
        style={{
          position: 'absolute',
          top: 80,
          left: 100,
          opacity: interpolate(titleProgress, [0, 1], [0, 1]),
          transform: `translateY(${interpolate(titleProgress, [0, 1], [20, 0])}px)`,
        }}
      >
        <div style={{ fontFamily, fontSize: 42, fontWeight: 800, color: COLORS.white }}>
          Decide Together.
        </div>
        <div style={{ fontFamily, fontSize: 42, fontWeight: 800, color: COLORS.gold }}>
          Get It Done.
        </div>
        <div
          style={{ fontFamily, fontSize: 20, fontWeight: 400, color: COLORS.muted, marginTop: 12 }}
        >
          Polls for decisions. Tasks for action.
        </div>
      </div>

      {/* Polls phone (fades out) */}
      <div style={{ opacity: 1 - transitionProgress }}>
        <PhoneFrame scale={0.9} x={80} y={20} delay={10} float={false}>
          <PollsScreen animationDelay={15} />
        </PhoneFrame>
      </div>

      {/* Tasks phone (fades in) */}
      <div style={{ opacity: transitionProgress }}>
        <PhoneFrame scale={0.9} x={80} y={20} delay={0} float={false}>
          <TasksScreen animationDelay={160} />
        </PhoneFrame>
      </div>

      {/* Floating notification pops */}
      <div style={{ position: 'absolute', right: 140, top: 300 }}>
        <NotificationPop text="Sarah voted: Beach day 🏖️" icon="📊" delay={70} />
      </div>
      <div style={{ position: 'absolute', right: 160, top: 370 }}>
        <NotificationPop text="Mike completed: Pack snorkel gear" icon="✅" delay={200} />
      </div>
      <div style={{ position: 'absolute', right: 120, top: 440 }}>
        <NotificationPop text="Reminder: Confirm restaurant reservation" icon="🔔" delay={230} />
      </div>

      {/* End card */}
      <Sequence from={POLLS_TASKS_DURATION - TIMING.endCard}>
        <EndCard />
      </Sequence>
    </AbsoluteFill>
  );
};
