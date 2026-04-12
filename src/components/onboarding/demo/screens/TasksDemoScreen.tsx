/**
 * Tasks Demo Screen — Shared responsibilities with assignment & completion
 *
 * ~6s loop: header → Task A (soccer registration) → Task B (snacks)
 *         → Task C (e-visa, completed) → Task A completes → header updates → reset
 */

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { DemoTaskRow } from '../primitives';
import { motion as motionPreset, LOOP_DURATION } from '../tokens';
import { ListChecks } from 'lucide-react';

const slideUp = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  transition: motionPreset.slideIn,
};

export const TasksDemoScreen = () => {
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
      setTimeout(() => setStep(3), 2200),
      setTimeout(() => setStep(4), 3200),
      setTimeout(() => setStep(5), 4200),
      setTimeout(resetAndLoop, LOOP_DURATION * 1000),
    ];
    return () => timers.forEach(clearTimeout);
  }, [cycle, resetAndLoop]);

  const pendingCount = step >= 5 ? 1 : 2;
  const doneCount = step >= 5 ? 2 : 1;

  return (
    <div className="flex flex-col h-full px-3 py-3 gap-2.5">
      <AnimatePresence>
        {/* Header */}
        {step >= 1 && (
          <motion.div key={`${cycle}-header`} {...slideUp} className="flex items-center gap-2 px-1">
            <ListChecks className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-foreground">Trip Tasks</span>
            <span className="text-[10px] text-muted-foreground ml-auto">
              {pendingCount} pending · {doneCount} done
            </span>
          </motion.div>
        )}

        {/* Task A: Soccer registration — completes at step 5 */}
        {step >= 2 && (
          <motion.div key={`${cycle}-taskA`} {...slideUp}>
            <DemoTaskRow
              title="Complete registration for Spring League"
              completed={step >= 5}
              assignee={{ initial: 'C', color: 'bg-blue-600', name: 'Coach Carter' }}
              dueLabel="Due Apr 15"
            />
          </motion.div>
        )}

        {/* Task B: Tara bringing snacks */}
        {step >= 3 && (
          <motion.div key={`${cycle}-taskB`} {...slideUp}>
            <DemoTaskRow
              title="Tara is bringing the snacks"
              assignee={{ initial: 'T', color: 'bg-orange-500', name: 'Tara' }}
              highlight
            />
          </motion.div>
        )}

        {/* Task C: E-visa & passport (already completed) */}
        {step >= 4 && (
          <motion.div key={`${cycle}-taskC`} {...slideUp}>
            <DemoTaskRow
              title="Upload e-visa & passport copies"
              completed
              assignee={{ initial: 'A', color: 'bg-blue-500', name: 'Alex' }}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
