import { useEffect, useRef } from 'react';
import { Capacitor } from '@capacitor/core';
import { useApiHealth } from '@/hooks/useApiHealth';
import { useDemoMode } from '@/hooks/useDemoMode';
import { useAuth } from '@/hooks/useAuth';
import { useStreamClient } from '@/hooks/stream/useStreamClient';

/**
 * Hide the native splash screen once the app is ready.
 * Uses dynamic import so @capacitor/splash-screen is only loaded on native.
 */
function hideNativeSplash(): void {
  if (!Capacitor.isNativePlatform()) return;
  import('@capacitor/splash-screen')
    .then(({ SplashScreen }) => SplashScreen.hide())
    .catch(() => {});
}

/**
 * AppInitializer - Runs API health checks on app startup
 * Skips health checks in demo mode to prevent "offline" noise
 */
export const AppInitializer = ({ children }: { children: React.ReactNode }) => {
  const { isDemoMode } = useDemoMode();
  const { user, isLoading } = useAuth();

  // Only run health checks for authenticated users NOT in demo mode
  const shouldRunHealthChecks = user && !isDemoMode;
  useApiHealth(shouldRunHealthChecks);

  // Initialize Stream Chat client when any Stream feature flag is enabled
  useStreamClient();

  // Hide native splash screen once auth hydration completes (or after safety timeout)
  const splashHidden = useRef(false);
  useEffect(() => {
    if (!isLoading && !splashHidden.current) {
      splashHidden.current = true;
      hideNativeSplash();
    }
  }, [isLoading]);

  // Safety fallback: hide splash after 4s even if auth is still loading
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!splashHidden.current) {
        splashHidden.current = true;
        hideNativeSplash();
      }
    }, 4000);
    return () => clearTimeout(timer);
  }, []);

  // CSP violation monitoring with error safety
  useEffect(() => {
    try {
      const handleCSPViolation = (e: SecurityPolicyViolationEvent) => {
        try {
          console.warn('[CSP] Blocked:', {
            directive: e.violatedDirective,
            blockedURI: e.blockedURI,
            effectiveDirective: e.effectiveDirective,
            disposition: e.disposition,
          });
        } catch (error) {
          console.error('[CSP] Error handling violation:', error);
        }
      };

      window.addEventListener('securitypolicyviolation', handleCSPViolation);
      return () => {
        try {
          window.removeEventListener('securitypolicyviolation', handleCSPViolation);
        } catch (error) {
          console.error('[CSP] Error removing listener:', error);
        }
      };
    } catch (error) {
      console.error('[AppInitializer] Error setting up CSP monitoring:', error);
    }
  }, []);

  return <>{children}</>;
};
