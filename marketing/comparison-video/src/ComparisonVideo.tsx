import React from 'react';
import { AbsoluteFill, Sequence } from 'remotion';
import { ComparisonScene } from './ComparisonScene';
import { EndCard } from './EndCard';
import { FinalFrame } from './FinalFrame';
import { Intro } from './Intro';
import { COMPARISON_FRAMES, END_FRAMES, FINAL_FRAMES, FPS, INTRO_FRAMES } from './theme';

export const ComparisonVideo: React.FC = () => {
  return (
    <AbsoluteFill style={{ background: '#050505' }}>
      <Sequence durationInFrames={INTRO_FRAMES} premountFor={1 * FPS}>
        <Intro />
      </Sequence>
      <Sequence from={INTRO_FRAMES} durationInFrames={COMPARISON_FRAMES} premountFor={1 * FPS}>
        <ComparisonScene />
      </Sequence>
      <Sequence
        from={INTRO_FRAMES + COMPARISON_FRAMES}
        durationInFrames={FINAL_FRAMES}
        premountFor={1 * FPS}
      >
        <FinalFrame />
      </Sequence>
      <Sequence
        from={INTRO_FRAMES + COMPARISON_FRAMES + FINAL_FRAMES}
        durationInFrames={END_FRAMES}
        premountFor={1 * FPS}
      >
        <EndCard />
      </Sequence>
    </AbsoluteFill>
  );
};
