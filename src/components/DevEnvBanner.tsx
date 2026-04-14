import { isUsingEnvVars } from '@/integrations/supabase/client';

/**
 * Development-only banner shown when Supabase env vars are not configured.
 */
export function DevEnvBanner() {
  // Only show in development and when env vars are missing
  if (import.meta.env.PROD || isUsingEnvVars) {
    return null;
  }

  return (
    <div className="fixed top-0 left-0 right-0 z-[9999] bg-amber-500 text-amber-950 text-xs text-center py-1 px-2 font-medium">
      ⚠️ Missing Supabase env config. Set VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY (or
      legacy VITE_SUPABASE_ANON_KEY).
    </div>
  );
}
