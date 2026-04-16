import React from 'react';
import { RefreshCw } from 'lucide-react';

interface PullToRefreshIndicatorProps {
  isRefreshing: boolean;
  pullDistance: number;
  threshold: number;
}

export const PullToRefreshIndicator = ({
  isRefreshing,
  pullDistance,
  threshold,
}: PullToRefreshIndicatorProps) => {
  const progress = Math.min((pullDistance / threshold) * 100, 100);
  const opacity = Math.min(pullDistance / threshold, 1);

  return (
    <div
      className="absolute top-0 left-0 right-0 flex justify-center items-center transition-opacity"
      style={{
        transform: `translateY(${pullDistance}px)`,
        opacity: opacity,
        pointerEvents: 'none',
      }}
    >
      <div className="bg-black/80 backdrop-blur-sm rounded-full p-3 shadow-lg border border-white/10">
        {isRefreshing ? (
          <div className="w-5 h-5 animate-spin gold-gradient-spinner" />
        ) : (
          <RefreshCw
            size={20}
            className="text-gold-primary"
            style={{
              transform: `rotate(${progress * 3.6}deg)`,
            }}
          />
        )}
      </div>
    </div>
  );
};
