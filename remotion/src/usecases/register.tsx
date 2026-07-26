import React from 'react';
import { Composition, Folder } from 'remotion';
import { UseCaseFilm, filmDuration } from './UseCaseFilm';
import { Anthem, ANTHEM_DURATION } from './Anthem';
import { SCENARIOS } from './scenarios';
import { DIMENSIONS } from './layout';
import { FPS } from '../theme';

/**
 * Registers every use-case film: 11 vertical + 11 square + 2 anthem cuts = 24.
 *
 * Composition ids are `UC-{index}-{slug}-{format}` so render output filenames sort in
 * the same order as the use-cases page.
 */
export const UseCaseCompositions: React.FC = () => (
  <>
    <Folder name="UseCases-Vertical">
      {SCENARIOS.map(s => (
        <Composition
          key={`v-${s.slug}`}
          id={`UC-${String(s.index).padStart(2, '0')}-${s.slug}-vertical`}
          component={UseCaseFilm}
          durationInFrames={filmDuration('vertical')}
          fps={FPS}
          width={DIMENSIONS.vertical.width}
          height={DIMENSIONS.vertical.height}
          defaultProps={{ slug: s.slug, format: 'vertical' as const }}
        />
      ))}
    </Folder>

    <Folder name="UseCases-Square">
      {SCENARIOS.map(s => (
        <Composition
          key={`s-${s.slug}`}
          id={`UC-${String(s.index).padStart(2, '0')}-${s.slug}-square`}
          component={UseCaseFilm}
          durationInFrames={filmDuration('square')}
          fps={FPS}
          width={DIMENSIONS.square.width}
          height={DIMENSIONS.square.height}
          defaultProps={{ slug: s.slug, format: 'square' as const }}
        />
      ))}
    </Folder>

    <Folder name="UseCases-Anthem">
      <Composition
        id="UC-Anthem-wide"
        component={Anthem}
        durationInFrames={ANTHEM_DURATION}
        fps={FPS}
        width={DIMENSIONS.wide.width}
        height={DIMENSIONS.wide.height}
        defaultProps={{ format: 'wide' as const }}
      />
      <Composition
        id="UC-Anthem-vertical"
        component={Anthem}
        durationInFrames={ANTHEM_DURATION}
        fps={FPS}
        width={DIMENSIONS.vertical.width}
        height={DIMENSIONS.vertical.height}
        defaultProps={{ format: 'vertical' as const }}
      />
    </Folder>
  </>
);
