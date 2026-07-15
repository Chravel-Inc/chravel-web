import React from 'react';
import { Composition } from 'remotion';
import { ComparisonVideo } from './ComparisonVideo';
import { FPS, TOTAL_FRAMES } from './theme';

export const RemotionRoot: React.FC = () => {
  return (
    <Composition
      id="ComparisonVideo"
      component={ComparisonVideo}
      durationInFrames={TOTAL_FRAMES}
      fps={FPS}
      width={1920}
      height={1080}
    />
  );
};
