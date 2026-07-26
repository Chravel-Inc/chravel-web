import React from 'react';
import { AbsoluteFill, Sequence } from 'remotion';
import { COLORS } from '../theme';
import { ColdOpen } from './scenes/ColdOpen';
import { Escalation } from './scenes/Escalation';
import { TheTurn } from './scenes/TheTurn';
import { Resolution } from './scenes/Resolution';
import { Payoff } from './scenes/Payoff';
import { Lockup } from './scenes/Lockup';
import { getScenario } from './scenarios';
import type { Format } from './types';

/**
 * The six-scene spine, shared by every use-case film.
 *
 * The square cut is not a re-edit of the vertical — it is this same component with a
 * different `format`, which drops the escalation entirely and compresses the rest.
 * One structure, one place to fix anything.
 */
interface SceneTiming {
  coldOpen: number;
  escalation: number;
  turn: number;
  resolution: number;
  payoff: number;
  lockup: number;
}

const TIMINGS: Record<Format, SceneTiming> = {
  // 24s @ 30fps = 720
  vertical: { coldOpen: 90, escalation: 90, turn: 90, resolution: 180, payoff: 150, lockup: 120 },
  // 15s @ 30fps = 450. Escalation is cut: at 15s the hook has to reach the product fast.
  square: { coldOpen: 75, escalation: 0, turn: 60, resolution: 150, payoff: 75, lockup: 90 },
  // 20s @ 30fps = 600
  wide: { coldOpen: 80, escalation: 70, turn: 70, resolution: 160, payoff: 110, lockup: 110 },
};

export const filmDuration = (format: Format): number => {
  const t = TIMINGS[format];
  return t.coldOpen + t.escalation + t.turn + t.resolution + t.payoff + t.lockup;
};

export const UseCaseFilm: React.FC<{ slug: string; format: Format }> = ({ slug, format }) => {
  const scenario = getScenario(slug);
  const t = TIMINGS[format];

  // Running offset so scenes stay adjacent when one is zero-length.
  let at = 0;
  const place = (len: number) => {
    const from = at;
    at += len;
    return { from, durationInFrames: len };
  };

  const coldOpen = place(t.coldOpen);
  const escalation = place(t.escalation);
  const turn = place(t.turn);
  const resolution = place(t.resolution);
  const payoff = place(t.payoff);
  const lockup = place(t.lockup);

  return (
    <AbsoluteFill style={{ backgroundColor: COLORS.background }}>
      <Sequence {...coldOpen}>
        <ColdOpen
          scenario={scenario}
          format={format}
          durationInFrames={coldOpen.durationInFrames}
        />
      </Sequence>

      {t.escalation > 0 && (
        <Sequence {...escalation}>
          <Escalation
            scenario={scenario}
            format={format}
            durationInFrames={escalation.durationInFrames}
          />
        </Sequence>
      )}

      <Sequence {...turn}>
        <TheTurn scenario={scenario} format={format} durationInFrames={turn.durationInFrames} />
      </Sequence>

      <Sequence {...resolution}>
        <Resolution
          scenario={scenario}
          format={format}
          durationInFrames={resolution.durationInFrames}
        />
      </Sequence>

      <Sequence {...payoff}>
        <Payoff scenario={scenario} format={format} durationInFrames={payoff.durationInFrames} />
      </Sequence>

      <Sequence {...lockup}>
        <Lockup scenario={scenario} format={format} durationInFrames={lockup.durationInFrames} />
      </Sequence>
    </AbsoluteFill>
  );
};
