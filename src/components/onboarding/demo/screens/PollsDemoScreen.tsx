/**
 * Polls Demo Screen — Group decision-making with live voting
 *
 * ~6s loop: header → Poll A (bachelorette city) → Poll B (Vegas budget)
 *         → Poll C (creation animation) → summary badge → reset
 */

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { DemoPollCard } from '../primitives';
import { motion as motionPreset, LOOP_DURATION } from '../tokens';
import { BarChart3 } from 'lucide-react';

const slideUp = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  transition: motionPreset.slideIn,
};

export const PollsDemoScreen = () => {
  const [cycle, setCycle] = useState(0);
  const [step, setStep] = useState(0);

  const resetAndLoop = useCallback(() => {
    setStep(0);
    setCycle(c => c + 1);
  }, []);

  useEffect(() => {
    const timers = [
      setTimeout(() => setStep(1), 500),
      setTimeout(() => setStep(2), 1200),
      setTimeout(() => setStep(3), 2500),
      setTimeout(() => setStep(4), 3800),
      setTimeout(() => setStep(5), 4800),
      setTimeout(resetAndLoop, LOOP_DURATION * 1000),
    ];
    return () => timers.forEach(clearTimeout);
  }, [cycle, resetAndLoop]);

  return (
    <div className="flex flex-col h-full px-3 py-3 gap-2.5">
      <AnimatePresence>
        {/* Header */}
        {step >= 1 && (
          <motion.div key={`${cycle}-header`} {...slideUp} className="flex items-center gap-2 px-1">
            <BarChart3 className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-foreground">Group Polls</span>
            <span className="text-[10px] text-muted-foreground ml-auto">2 active</span>
          </motion.div>
        )}

        {/* Poll A: Bachelorette city */}
        {step >= 2 && (
          <motion.div key={`${cycle}-pollA`} {...slideUp}>
            <DemoPollCard
              question="Which city for the bachelorette party?"
              options={[
                { text: 'Miami', votes: 5 },
                { text: 'Nashville', votes: 3 },
                { text: 'Costa Rica', votes: 7 },
                { text: 'Paris', votes: 2 },
              ]}
              totalVotes={17}
            />
          </motion.div>
        )}

        {/* Poll B: Vegas budget */}
        {step >= 3 && (
          <motion.div key={`${cycle}-pollB`} {...slideUp}>
            <DemoPollCard
              question="Max budget for Vegas?"
              options={[
                { text: '$1,500', votes: 2 },
                { text: '$2,500', votes: 6 },
                { text: '$5,000', votes: 4 },
                { text: '$10,000', votes: 1 },
              ]}
              totalVotes={13}
            />
          </motion.div>
        )}

        {/* Poll C: Creation animation — compact "new poll" card */}
        {step >= 4 && (
          <motion.div
            key={`${cycle}-pollC`}
            initial={{ opacity: 0, y: 12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={motionPreset.slideIn}
            className="bg-white/5 border border-white/10 border-dashed rounded-xl p-3 space-y-2"
          >
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
              <span className="text-[10px] text-primary font-medium">Creating poll…</span>
            </div>
            <motion.p
              className="text-xs font-semibold text-foreground"
              initial={{ width: 0 }}
              animate={{ width: 'auto' }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
            >
              Best brunch spot Saturday?
            </motion.p>
            <div className="flex gap-1.5">
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/10 text-muted-foreground">
                The Terrace
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/10 text-muted-foreground">
                Cafe Merienda
              </span>
            </div>
          </motion.div>
        )}

        {/* Summary badge */}
        {step >= 5 && (
          <motion.div
            key={`${cycle}-summary`}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={motionPreset.micro}
            className="flex items-center gap-1.5 px-1"
          >
            <span className="text-[10px] text-green-400">✓ 30 votes across 3 polls</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
