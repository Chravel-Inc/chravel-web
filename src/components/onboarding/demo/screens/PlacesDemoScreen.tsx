/**
 * Places Demo Screen — Saved places with base-camp highlight
 *
 * ~6s loop: header → hotel base camp → restaurant → museum → base camp glow → reset
 */

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { DemoPlaceCard } from '../primitives';
import { motion as motionPreset, LOOP_DURATION } from '../tokens';
import { MapPin } from 'lucide-react';

const slideUp = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  transition: motionPreset.slideIn,
};

export const PlacesDemoScreen = () => {
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

  return (
    <div className="flex flex-col h-full px-3 py-3 gap-2.5">
      <AnimatePresence>
        {/* Header */}
        {step >= 1 && (
          <motion.div key={`${cycle}-header`} {...slideUp} className="flex items-center gap-2 px-1">
            <MapPin className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-foreground">Your Places</span>
            <span className="text-[10px] text-muted-foreground ml-auto">3 saved</span>
          </motion.div>
        )}

        {/* Hotel base camp */}
        {step >= 2 && (
          <motion.div key={`${cycle}-place1`} {...slideUp}>
            <DemoPlaceCard
              emoji="🏨"
              name="Hotel Nikkō"
              tag="Base Camp"
              saved
              highlight={step >= 5}
            />
          </motion.div>
        )}

        {/* Restaurant */}
        {step >= 3 && (
          <motion.div key={`${cycle}-place2`} {...slideUp}>
            <DemoPlaceCard emoji="🍣" name="Sushi Saito" tag="Dinner Spot" saved />
          </motion.div>
        )}

        {/* Museum */}
        {step >= 4 && (
          <motion.div key={`${cycle}-place3`} {...slideUp}>
            <DemoPlaceCard emoji="🎯" name="National Art Museum" tag="Day 2" saved />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
