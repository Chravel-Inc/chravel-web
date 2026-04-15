import React from 'react';
import { ToggleGroup, ToggleGroupItem } from '../ui/toggle-group';
import { useIsMobile } from '../../hooks/use-mobile';
import { ScrollFadeContainer } from './ScrollFadeContainer';
import { cn } from '@/lib/utils';

interface TripViewToggleProps {
  viewMode: string;
  onViewModeChange: (value: string) => void;
  showRecsTab?: boolean;
  recsTabDisabled?: boolean;
  className?: string;
  requireAuth?: boolean;
  onAuthRequired?: () => void;
}

export const TripViewToggle = ({
  viewMode,
  onViewModeChange,
  showRecsTab = false,
  recsTabDisabled = false,
  className,
  requireAuth = false,
  onAuthRequired,
}: TripViewToggleProps) => {
  const _isMobile = useIsMobile();
  const baseTabClasses =
    'justify-self-center h-full transition-all duration-300 px-2 sm:px-3 lg:px-4 py-0 rounded-xl font-bold text-sm md:text-base tracking-wide whitespace-nowrap flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2';
  const statefulTabClasses =
    'data-[state=on]:bg-background data-[state=on]:border data-[state=on]:border-gold-primary/60 data-[state=on]:text-foreground data-[state=on]:shadow-ring-glow data-[state=off]:text-muted-foreground hover:text-foreground hover:bg-muted/70';

  return (
    <div className={cn('w-full', className)}>
      <ScrollFadeContainer className="h-full contents md:contents lg:block">
        <ToggleGroup
          type="single"
          value={viewMode}
          onValueChange={value => {
            if (value) {
              // If auth is required for protected tabs, trigger auth modal
              if (requireAuth && ['myTrips', 'tripsPro', 'events'].includes(value)) {
                onAuthRequired?.();
                return;
              }
              onViewModeChange(value);
            }
          }}
          className={`bg-card/50 backdrop-blur-xl rounded-2xl p-1 shadow-lg grid ${showRecsTab ? 'grid-cols-4' : 'grid-cols-3'} h-12 sm:h-16 gap-0.5 sm:gap-1`}
        >
          <ToggleGroupItem
            value="myTrips"
            aria-label="My Trips"
            className={cn(
              baseTabClasses,
              statefulTabClasses,
              'overflow-hidden text-ellipsis min-w-0',
            )}
          >
            <span className="inline lg:hidden truncate">Trips</span>
            <span className="hidden lg:inline truncate">My Trips</span>
          </ToggleGroupItem>
          <ToggleGroupItem
            value="tripsPro"
            aria-label="Pro"
            className={cn(baseTabClasses, statefulTabClasses)}
          >
            Pro
          </ToggleGroupItem>
          <ToggleGroupItem
            value="events"
            aria-label="Events"
            className={cn(baseTabClasses, statefulTabClasses)}
          >
            Events
          </ToggleGroupItem>
          {showRecsTab && (
            <ToggleGroupItem
              value="travelRecs"
              aria-label="Recs"
              disabled={recsTabDisabled}
              title={
                recsTabDisabled ? 'Enable Demo Mode to access Travel Recommendations' : undefined
              }
              className={cn(
                baseTabClasses,
                statefulTabClasses,
                recsTabDisabled &&
                  'opacity-40 cursor-not-allowed hover:bg-transparent hover:text-muted-foreground',
              )}
              onClick={e => {
                if (recsTabDisabled) {
                  e.preventDefault();
                  e.stopPropagation();
                }
              }}
            >
              Recs
            </ToggleGroupItem>
          )}
        </ToggleGroup>
      </ScrollFadeContainer>
    </div>
  );
};
