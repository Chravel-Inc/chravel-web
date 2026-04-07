import React, { useState } from 'react';
import { LogOut } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useIsMobile } from '@/hooks/use-mobile';
import { useDemoMode } from '@/hooks/useDemoMode';
import { ExitDemoModal } from './ExitDemoModal';

interface ExitDemoButtonProps {
  onNavigate?: () => void;
}

export const ExitDemoButton: React.FC<ExitDemoButtonProps> = ({ onNavigate }) => {
  const { isDemoMode } = useDemoMode();
  const [showModal, setShowModal] = useState(false);
  const isMobile = useIsMobile();

  if (!isDemoMode) return null;

  return (
    <>
      <AnimatePresence>
        <motion.button
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          transition={{ duration: 0.2 }}
          onClick={() => setShowModal(true)}
          aria-label="Exit demo mode"
          className={`
            fixed z-50 flex items-center justify-center gap-1
            px-1.5 py-0.5
            bg-background/80 backdrop-blur-sm
            border border-orange-500/30
            rounded-lg shadow-lg
            text-orange-600 dark:text-orange-400
            hover:bg-orange-500/10 hover:border-orange-500/50
            transition-colors duration-200
            text-[0.5625rem] font-medium
            ${isMobile ? 'top-0 left-3 min-h-[44px] min-w-[44px]' : 'top-4 left-4'}
          `}
          style={
            isMobile
              ? {
                  top: 'calc(env(safe-area-inset-top, 0px) + 4px)',
                  left: 'calc(12px + env(safe-area-inset-left, 0px))',
                }
              : undefined
          }
        >
          <LogOut size={8} />
          <span>Exit Demo</span>
        </motion.button>
      </AnimatePresence>

      <ExitDemoModal
        open={showModal}
        onOpenChange={setShowModal}
        onNavigate={onNavigate ?? (() => window.location.assign('/'))}
      />
    </>
  );
};
