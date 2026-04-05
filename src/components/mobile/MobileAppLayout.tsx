import React, { useEffect } from 'react';
import { useIsMobile } from '../../hooks/use-mobile';
import { MobileOptimizationService } from '../../services/mobileOptimizationService';
import { cn } from '@/lib/utils';

interface MobileAppLayoutProps {
  children: React.ReactNode;
  className?: string;
}

export const MobileAppLayout = ({ children, className }: MobileAppLayoutProps) => {
  const isMobile = useIsMobile();

  useEffect(() => {
    const initServices = async () => {
      try {
        await Promise.race([
          MobileOptimizationService.initializeMobileOptimizations().catch(err => {
            console.warn('Failed to initialize mobile optimizations:', err);
          }),
          new Promise(resolve => setTimeout(resolve, 2000)),
        ]);

        MobileOptimizationService.trackMobilePerformance();
      } catch (error) {
        console.warn('Mobile services initialization timed out or failed:', error);
      }
    };

    initServices().catch(() => {
      // ignore
    });
  }, [isMobile]);

  return (
    <div
      className={cn(
        'flex flex-col min-h-screen',
        isMobile ? 'bg-gray-900' : 'bg-background',
        className,
      )}
    >
      {/* Main Content Area - NO bottom padding, let individual pages handle safe-area */}
      <main
        className={cn('flex-1 bg-background')}
        style={
          isMobile
            ? {
                WebkitOverflowScrolling: 'touch',
                overscrollBehavior: 'contain',
              }
            : undefined
        }
      >
        {children}
      </main>
    </div>
  );
};
