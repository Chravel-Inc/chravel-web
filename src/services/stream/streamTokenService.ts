/**
 * Stream Token Service
 *
 * Fetches and caches Stream user tokens from the stream-token edge function.
 * Handles token refresh before expiry.
 */

import {
  supabase,
  SUPABASE_PROJECT_URL,
  SUPABASE_PUBLIC_ANON_KEY,
} from '@/integrations/supabase/client';

interface StreamTokenResponse {
  token: string;
  userId: string;
  apiKey: string;
}

let cachedToken: StreamTokenResponse | null = null;
let tokenFetchedAt: number | null = null;

/** Token is considered stale after 20 hours (refreshed well before 24h expiry) */
const TOKEN_TTL_MS = 20 * 60 * 60 * 1000;

/** Clear cached token (call on auth state change) */
export function clearStreamTokenCache(): void {
  cachedToken = null;
  tokenFetchedAt = null;
}

/**
 * Fetch a Stream user token for the currently authenticated user.
 * Returns cached token if still fresh, otherwise fetches a new one.
 */
export async function getStreamToken(): Promise<StreamTokenResponse> {
  // Return cached token if still fresh
  if (cachedToken && tokenFetchedAt && Date.now() - tokenFetchedAt < TOKEN_TTL_MS) {
    return cachedToken;
  }

  const { data: sessionData } = await supabase.auth.getSession();
  const accessToken = sessionData?.session?.access_token;

  if (!accessToken) {
    throw new Error('No active Supabase session — cannot fetch Stream token');
  }

  const response = await fetch(`${SUPABASE_PROJECT_URL}/functions/v1/stream-token`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      apikey: SUPABASE_PUBLIC_ANON_KEY,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({}),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Stream token fetch failed (${response.status}): ${body}`);
  }

  const data: StreamTokenResponse = await response.json();
  cachedToken = data;
  tokenFetchedAt = Date.now();

  return data;
}
