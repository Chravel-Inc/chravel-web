import { supabase } from '@/integrations/supabase/client';
// Reuse the shared edge-function error extractor (same OAuth error shape as Gmail).
import { extractFunctionErrorMessage } from '@/features/smart-import/api/gmailAuth';

export type GoogleCalendarAccount = {
  id: string;
  email: string;
  created_at: string;
  is_active: boolean;
  // token_expires_at is a safe TIMESTAMPTZ (not a credential) used for reconnect UX.
  // RLS on google_calendar_accounts_safe is row-scoped (auth.uid() = user_id); no
  // token values are exposed to the frontend.
  token_expires_at: string | null;
  last_synced_at: string | null;
};

export function resolveGoogleCalendarOAuthRedirectUri(): string | null {
  if (typeof window === 'undefined' || !window.location?.origin) {
    return null;
  }
  return `${window.location.origin}/api/google-calendar/oauth/callback`;
}

export const fetchGoogleCalendarAccounts = async (): Promise<GoogleCalendarAccount[]> => {
  // Query the safe view — token columns are never exposed. RLS is row-scoped.
  // Cast needed: the safe view is not in generated Supabase types (matches the
  // Gmail pattern, and keeps schema-drift static analysis from flagging it).
  const { data, error } = await (supabase.from as unknown as (table: string) => any)(
    'google_calendar_accounts_safe',
  )
    .select('id, email, created_at, token_expires_at, last_synced_at, is_active')
    .eq('is_active', true)
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);
  return (data || []) as unknown as GoogleCalendarAccount[];
};

export const connectGoogleCalendarAccount = async (): Promise<string> => {
  const redirectUri = resolveGoogleCalendarOAuthRedirectUri();
  if (import.meta.env.DEV && redirectUri) {
    // The backend allowlists redirect URIs via GOOGLE_CALENDAR_REDIRECT_URI +
    // GOOGLE_ADDITIONAL_REDIRECT_URIS. If this origin isn't registered there
    // (and in Google Cloud), the backend falls back to the default origin.
    console.info('[calendar-auth] requesting redirect_uri =', redirectUri);
  }
  try {
    // Ensure a fresh, non-expired session before invoking the edge function,
    // otherwise a stale JWT causes the function's auth.getUser() to 401.
    const { data: sessionData } = await supabase.auth.getSession();
    const session = sessionData?.session;
    if (!session) {
      throw new Error('You need to be signed in to connect a Google Calendar account.');
    }
    const expiresAtMs = session.expires_at ? session.expires_at * 1000 : 0;
    if (!expiresAtMs || expiresAtMs - Date.now() < 60_000) {
      const { error: refreshError } = await supabase.auth.refreshSession();
      if (refreshError) {
        throw new Error(
          'Your session expired. Please sign out and back in, then try connecting Google Calendar again.',
        );
      }
    }

    const { data, error } = await supabase.functions.invoke('calendar-auth/connect', {
      method: 'POST',
      body: redirectUri ? { redirectUri } : undefined,
    });

    if (error) {
      throw error;
    }

    return data.url;
  } catch (error: unknown) {
    if (import.meta.env.DEV) {
      console.error('Error initiating Google Calendar connect:', error);
    }
    const message = await extractFunctionErrorMessage(
      error,
      'Failed to initiate Google Calendar connection. Check OAuth setup and secrets.',
    );
    throw new Error(message);
  }
};

export const disconnectGoogleCalendarAccount = async (accountId: string): Promise<void> => {
  try {
    const { error } = await supabase.functions.invoke('calendar-auth/disconnect', {
      method: 'POST',
      body: { accountId },
    });

    if (error) {
      throw error;
    }
  } catch (error: unknown) {
    if (import.meta.env.DEV) {
      console.error('Error disconnecting Google Calendar account:', error);
    }
    const message = await extractFunctionErrorMessage(
      error,
      'Failed to disconnect Google Calendar account',
    );
    throw new Error(message);
  }
};

export const handleGoogleCalendarCallback = async (
  code: string,
  state: string,
): Promise<{ success: boolean; email?: string }> => {
  try {
    const { data, error } = await supabase.functions.invoke('calendar-auth/callback', {
      method: 'POST',
      body: { code, state },
    });

    if (error) {
      throw error;
    }

    return data;
  } catch (error: unknown) {
    if (import.meta.env.DEV) {
      console.error('Error completing Google Calendar connection:', error);
    }
    const message = await extractFunctionErrorMessage(
      error,
      'Failed to complete Google Calendar connection',
    );
    throw new Error(message);
  }
};
