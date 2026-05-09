import { useState, useEffect } from 'react';
import { apiHealthCheck, HealthStatus } from '@/services/apiHealthCheck';

/**
 * Hook to monitor API health status and provide user notifications
 * @param enabled - Whether to actually run health checks (false in demo mode)
 */
export const useApiHealth = (enabled: boolean = true) => {
  const [conciergeStatus, setConciergeStatus] = useState<HealthStatus | null>(null);
  const [mapsStatus, setMapsStatus] = useState<HealthStatus | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    // Skip health checks if disabled (demo mode or unauthenticated)
    if (!enabled) {
      setIsInitialized(true);
      return;
    }

    let cancelled = false;
    let idleHandle: number | undefined;
    let timeoutHandle: number | undefined;

    const initializeHealthChecks = async () => {
      try {
        await apiHealthCheck.initialize();
        if (cancelled) return;

        // Get initial statuses
        const concierge = apiHealthCheck.getHealth('concierge');
        const maps = apiHealthCheck.getHealth('google_maps');

        setConciergeStatus(concierge);
        setMapsStatus(maps);
        setIsInitialized(true);
      } catch (error) {
        console.error('Failed to initialize health checks:', error);
      }
    };

    const kickoff = () => {
      if (cancelled) return;
      void initializeHealthChecks();
    };

    // Defer concierge + Maps probes until idle (or timeout) so they do not race
    // session restore + trip list fetches on cold start (installed shell / slow networks).
    if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
      idleHandle = window.requestIdleCallback(kickoff, { timeout: 3500 });
    } else {
      timeoutHandle = window.setTimeout(kickoff, 2500);
    }

    // Poll for status updates every 30 seconds
    const pollInterval = setInterval(() => {
      try {
        const concierge = apiHealthCheck.getHealth('concierge');
        const maps = apiHealthCheck.getHealth('google_maps');

        setConciergeStatus(concierge);
        setMapsStatus(maps);
      } catch (error) {
        console.error('Error polling health status:', error);
      }
    }, 30000);

    return () => {
      cancelled = true;
      if (
        idleHandle !== undefined &&
        typeof window !== 'undefined' &&
        'cancelIdleCallback' in window
      ) {
        window.cancelIdleCallback(idleHandle);
      }
      if (timeoutHandle !== undefined) {
        clearTimeout(timeoutHandle);
      }
      clearInterval(pollInterval);
      apiHealthCheck.stopPeriodicChecks();
    };
  }, [enabled]);

  const forceRecheck = async () => {
    try {
      await apiHealthCheck.recheckAll();
      setConciergeStatus(apiHealthCheck.getHealth('concierge'));
      setMapsStatus(apiHealthCheck.getHealth('google_maps'));
    } catch (error) {
      console.error('Error forcing health recheck:', error);
    }
  };

  return {
    conciergeStatus,
    mapsStatus,
    isInitialized,
    isAllHealthy: conciergeStatus?.status === 'healthy' && mapsStatus?.status === 'healthy',
    forceRecheck,
  };
};
