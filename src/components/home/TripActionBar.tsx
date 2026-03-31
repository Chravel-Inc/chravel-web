import React, { useState } from 'react';
import { Search } from 'lucide-react';
import { useDemoMode } from '@/hooks/useDemoMode';
import { useNotificationRealtime } from '@/hooks/useNotificationRealtime';
import { mockNotifications } from '@/mockData/notifications';
import { cn } from '@/lib/utils';

interface TripActionBarProps {
  onSettings: () => void;
  onCreateTrip: () => void;
  onSearch: (query: string) => void;
  onNotifications: () => void;
  className?: string;
  isNotificationsOpen?: boolean;
  setIsNotificationsOpen?: (open: boolean) => void;
  isSettingsActive?: boolean;
  isNotificationsActive?: boolean;
  isNewTripActive?: boolean;
  isSearchActive?: boolean;
  requireAuth?: boolean;
  onAuthRequired?: () => void;
}

export const TripActionBar = ({
  onSettings,
  onCreateTrip,
  onSearch,
  onNotifications: _onNotifications,
  className,
  isNotificationsOpen,
  setIsNotificationsOpen,
  isSettingsActive = false,
  isNotificationsActive = false,
  isNewTripActive = false,
  isSearchActive = false,
  requireAuth = false,
  onAuthRequired,
}: TripActionBarProps) => {
  const { isDemoMode } = useDemoMode();
  const [searchQuery, setSearchQuery] = useState('');

  const { unreadCount } = useNotificationRealtime();

  const displayUnreadCount = isDemoMode
    ? mockNotifications.filter(n => !n.read).length
    : unreadCount;

  return (
    <div
      className={cn(
        'bg-card/50 backdrop-blur-xl rounded-2xl p-1 shadow-lg grid grid-cols-4 w-full h-12 sm:h-16 gap-1 sm:gap-1.5 min-w-0',
        className,
      )}
    >
      {/* New Trip */}
      <button
        onClick={() => {
          if (requireAuth) {
            onAuthRequired?.();
          } else {
            onCreateTrip();
          }
        }}
        aria-label="Create New Trip"
        className={cn(
          'h-full flex items-center justify-center gap-2 px-2 sm:px-3 lg:px-4 py-0 rounded-xl transition-all duration-300 font-bold text-base tracking-wide whitespace-nowrap',
          isNewTripActive
            ? 'bg-gradient-to-r from-[hsl(45,95%,58%)] to-[hsl(45,90%,65%)] text-black shadow-lg shadow-primary/30'
            : 'text-white hover:text-foreground',
        )}
      >
        <span className="inline lg:hidden text-sm">+ Trip</span>
        <span className="hidden lg:inline text-base">New Trip</span>
      </button>

      {/* Alerts with Badge */}
      <button
        onClick={() => {
          if (requireAuth) {
            onAuthRequired?.();
          } else {
            setIsNotificationsOpen?.(!isNotificationsOpen);
            _onNotifications();
          }
        }}
        aria-label="Alerts"
        className={cn(
          'relative h-full w-full flex items-center justify-center gap-2 px-2 sm:px-3 lg:px-4 py-0 rounded-xl transition-all duration-300 font-bold text-base tracking-wide whitespace-nowrap',
          isNotificationsActive
            ? 'bg-gradient-to-r from-[hsl(45,95%,58%)] to-[hsl(45,90%,65%)] text-black shadow-lg shadow-primary/30'
            : 'text-white hover:text-foreground',
        )}
      >
        <span className="text-sm lg:text-base">Alerts</span>
        {displayUnreadCount > 0 && (
          <div className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold shadow-lg">
            {displayUnreadCount > 9 ? '9+' : displayUnreadCount}
          </div>
        )}
      </button>

      {/* Settings */}
      <button
        onClick={() => {
          onSettings();
        }}
        aria-label="Settings"
        className={cn(
          'h-full flex items-center justify-center gap-2 px-2 sm:px-3 lg:px-4 py-0 rounded-xl transition-all duration-300 font-bold text-base tracking-wide whitespace-nowrap min-w-0 overflow-hidden',
          isSettingsActive
            ? 'bg-gradient-to-r from-[hsl(45,95%,58%)] to-[hsl(45,90%,65%)] text-black shadow-lg shadow-primary/30'
            : 'text-white hover:text-foreground',
        )}
      >
        <span className="text-sm lg:text-base truncate">Settings</span>
      </button>

      {/* Search */}
      <div
        className={cn(
          'h-full flex items-center px-2 rounded-xl transition-all duration-300',
          isSearchActive
            ? 'bg-gradient-to-r from-[hsl(45,95%,58%)]/10 to-[hsl(45,90%,65%)]/10 ring-1 ring-primary/30'
            : '',
        )}
      >
        <div className="relative w-full h-full flex items-center py-2">
          <Search
            className={cn(
              'absolute left-2 top-1/2 -translate-y-1/2 pointer-events-none',
              isSearchActive ? 'text-primary' : 'text-muted-foreground',
            )}
            size={16}
          />
          <input
            type="text"
            placeholder="Search..."
            value={searchQuery}
            onChange={e => {
              setSearchQuery(e.target.value);
              onSearch(e.target.value);
            }}
            onFocus={() => onSearch(searchQuery)}
            className="w-full h-full pl-8 pr-2 bg-background/50 border border-border/50 rounded-lg text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 focus:bg-background/80 transition-all"
          />
        </div>
      </div>
    </div>
  );
};
