/**
 * Concierge Demo Screen — AI travel assistant conversation
 *
 * ~6s loop: user query → typing → rich response card → save action → follow-up chips → reset
 */

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { DemoBubble, DemoConciergeCard, DemoChip } from '../primitives';
import { motion as motionPreset, LOOP_DURATION, concierge } from '../tokens';
import { cn } from '@/lib/utils';

const slideUp = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  transition: motionPreset.slideIn,
};

export const ConciergeDemoScreen = () => {
  const [cycle, setCycle] = useState(0);
  const [step, setStep] = useState(0);

  const resetAndLoop = useCallback(() => {
    setStep(0);
    setCycle(c => c + 1);
  }, []);

  useEffect(() => {
    const timers = [
      setTimeout(() => setStep(1), 500), // user message
      setTimeout(() => setStep(2), 1200), // typing indicator
      setTimeout(() => setStep(3), 2000), // AI response card
      setTimeout(() => setStep(4), 3500), // save action
      setTimeout(() => setStep(5), 4500), // follow-up chips
      setTimeout(resetAndLoop, LOOP_DURATION * 1000),
    ];
    return () => timers.forEach(clearTimeout);
  }, [cycle, resetAndLoop]);

  return (
    <div className="flex flex-col h-full px-3 py-3 gap-2 relative">
      <AnimatePresence>
        {/* User query */}
        {step >= 1 && (
          <motion.div key={`${cycle}-query`} {...slideUp} className="flex flex-col">
            <DemoBubble variant="own" text="Find the best sushi near our hotel" />
          </motion.div>
        )}

        {/* Typing indicator */}
        {step >= 2 && step < 3 && (
          <motion.div
            key={`${cycle}-typing`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={motionPreset.micro}
            className="flex items-center gap-2 self-start"
          >
            <div
              className={cn(
                'w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-[9px] font-bold text-white',
                concierge.avatar,
              )}
            >
              CA
            </div>
            <div className="flex items-center gap-1 px-3 py-2 bg-muted rounded-2xl">
              <motion.span
                className="w-1.5 h-1.5 rounded-full bg-muted-foreground/50"
                animate={{ opacity: [0.3, 1, 0.3] }}
                transition={{ duration: 1, repeat: Infinity, delay: 0 }}
              />
              <motion.span
                className="w-1.5 h-1.5 rounded-full bg-muted-foreground/50"
                animate={{ opacity: [0.3, 1, 0.3] }}
                transition={{ duration: 1, repeat: Infinity, delay: 0.2 }}
              />
              <motion.span
                className="w-1.5 h-1.5 rounded-full bg-muted-foreground/50"
                animate={{ opacity: [0.3, 1, 0.3] }}
                transition={{ duration: 1, repeat: Infinity, delay: 0.4 }}
              />
            </div>
          </motion.div>
        )}

        {/* AI response card */}
        {step >= 3 && (
          <motion.div
            key={`${cycle}-response`}
            initial={{ opacity: 0, y: 16, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={motionPreset.slideIn}
          >
            <DemoConciergeCard
              query="Find the best sushi near our hotel"
              title="Sushi Saito"
              rating="⭐ 4.8 · Omakase"
              bullets={[
                'Intimate 8-seat counter experience',
                'Reservations required 2 weeks ahead',
              ]}
              linkText="View on Google Maps"
              saveLabel={step >= 4 ? '✓ Saved to Explore' : 'Save to Trip'}
              onSaveState={step >= 4 ? 'saved' : 'idle'}
            />
          </motion.div>
        )}

        {/* Follow-up action chips */}
        {step >= 5 && (
          <motion.div
            key={`${cycle}-chips`}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={motionPreset.slideIn}
            className="flex items-center gap-1.5 flex-wrap"
          >
            <DemoChip label="Add to calendar" variant="action" />
            <DemoChip label="Find more nearby" variant="action" />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
