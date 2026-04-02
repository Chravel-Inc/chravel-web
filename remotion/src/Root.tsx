import { Composition, Folder } from 'remotion';
import { ChravelLaunch } from './ChravelLaunch';
import { TripCreationFlow, TRIP_CREATION_DURATION } from './compositions/TripCreationFlow';
import { LiveSharedCalendar, LIVE_CALENDAR_DURATION } from './compositions/LiveSharedCalendar';
import { AIConciergeAction, AI_CONCIERGE_DURATION } from './compositions/AIConciergeAction';
import { PaymentSplit, PAYMENT_SPLIT_DURATION } from './compositions/PaymentSplit';
import { MediaVault, MEDIA_VAULT_DURATION } from './compositions/MediaVault';
import { PollsAndTasks, POLLS_TASKS_DURATION } from './compositions/PollsAndTasks';
import { TabNavigationHero, TAB_NAV_DURATION } from './compositions/TabNavigationHero';
import { BeforeAfterChaos, BEFORE_AFTER_DURATION } from './compositions/BeforeAfterChaos';
import { BRollOverlay, BROLL_OVERLAY_DURATION } from './compositions/BRollOverlay';

const FPS = 30;
const WIDTH = 1920;
const HEIGHT = 1080;

export const RemotionRoot = () => {
  return (
    <>
      {/* Original launch video */}
      <Composition
        id="ChravelLaunch"
        component={ChravelLaunch}
        durationInFrames={FPS * 60}
        fps={FPS}
        width={WIDTH}
        height={HEIGHT}
      />

      {/* B-Roll Clips */}
      <Folder name="BRoll">
        <Composition
          id="TripCreationFlow"
          component={TripCreationFlow}
          durationInFrames={TRIP_CREATION_DURATION}
          fps={FPS}
          width={WIDTH}
          height={HEIGHT}
        />
        <Composition
          id="LiveSharedCalendar"
          component={LiveSharedCalendar}
          durationInFrames={LIVE_CALENDAR_DURATION}
          fps={FPS}
          width={WIDTH}
          height={HEIGHT}
        />
        <Composition
          id="AIConciergeAction"
          component={AIConciergeAction}
          durationInFrames={AI_CONCIERGE_DURATION}
          fps={FPS}
          width={WIDTH}
          height={HEIGHT}
        />
        <Composition
          id="PaymentSplit"
          component={PaymentSplit}
          durationInFrames={PAYMENT_SPLIT_DURATION}
          fps={FPS}
          width={WIDTH}
          height={HEIGHT}
        />
        <Composition
          id="MediaVault"
          component={MediaVault}
          durationInFrames={MEDIA_VAULT_DURATION}
          fps={FPS}
          width={WIDTH}
          height={HEIGHT}
        />
        <Composition
          id="PollsAndTasks"
          component={PollsAndTasks}
          durationInFrames={POLLS_TASKS_DURATION}
          fps={FPS}
          width={WIDTH}
          height={HEIGHT}
        />
        <Composition
          id="TabNavigationHero"
          component={TabNavigationHero}
          durationInFrames={TAB_NAV_DURATION}
          fps={FPS}
          width={WIDTH}
          height={HEIGHT}
        />
        <Composition
          id="BeforeAfterChaos"
          component={BeforeAfterChaos}
          durationInFrames={BEFORE_AFTER_DURATION}
          fps={FPS}
          width={WIDTH}
          height={HEIGHT}
        />
        <Composition
          id="BRollOverlay"
          component={BRollOverlay}
          durationInFrames={BROLL_OVERLAY_DURATION}
          fps={FPS}
          width={WIDTH}
          height={HEIGHT}
          defaultProps={{
            videoFile: undefined,
          }}
        />
      </Folder>
    </>
  );
};
