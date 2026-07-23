import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { crypto } from 'https://deno.land/std@0.177.0/crypto/mod.ts';
import { encryptToken, decryptToken } from '../_shared/gmailTokenCrypto.ts';
import { getCorsHeaders } from '../_shared/cors.ts';

// Google Calendar OAuth connection (Scope A: connect / callback / disconnect).
// Mirrors gmail-auth exactly, storing AES-GCM-encrypted tokens in
// google_calendar_accounts. Reuses the shared Google OAuth app
// (GOOGLE_CLIENT_ID/SECRET, OAUTH_STATE_SIGNING_SECRET) with a dedicated
// CALENDAR_TOKEN_ENCRYPTION_KEY so calendar and gmail token stores stay isolated.

const GOOGLE_CLIENT_ID = Deno.env.get('GOOGLE_CLIENT_ID') ?? '';
const GOOGLE_CLIENT_SECRET = Deno.env.get('GOOGLE_CLIENT_SECRET') ?? '';
const CALENDAR_TOKEN_ENCRYPTION_KEY = Deno.env.get('CALENDAR_TOKEN_ENCRYPTION_KEY') ?? '';
const OAUTH_STATE_SIGNING_SECRET = Deno.env.get('OAUTH_STATE_SIGNING_SECRET') ?? '';
const MAX_CALENDAR_ACCOUNTS = 3;

const DEFAULT_REDIRECT_URI =
  Deno.env.get('GOOGLE_CALENDAR_REDIRECT_URI') ||
  'https://chravel.app/api/google-calendar/oauth/callback';
const ADDITIONAL_REDIRECT_URIS = (Deno.env.get('GOOGLE_ADDITIONAL_REDIRECT_URIS') ?? '')
  .split(',')
  .map(uri => uri.trim())
  .filter(Boolean);

function getAllowedRedirectUris(): string[] {
  return [DEFAULT_REDIRECT_URI, ...ADDITIONAL_REDIRECT_URIS];
}

function getValidatedRedirectUri(candidate?: string): string {
  if (!candidate) return DEFAULT_REDIRECT_URI;
  return getAllowedRedirectUris().includes(candidate) ? candidate : DEFAULT_REDIRECT_URI;
}

// SECURITY: corsHeaders is computed per-request from the validated origin.
let _corsHeaders: Record<string, string> = getCorsHeaders();

function errorResponse(message: string, status: number, detail?: string): Response {
  console.error(`[calendar-auth] ${message}`, detail ? `| ${detail}` : '');
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { ..._corsHeaders, 'Content-Type': 'application/json' },
  });
}

function bytesToBase64Url(bytes: Uint8Array): string {
  return btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

function base64UrlToBytes(value: string): Uint8Array {
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/');
  const padded = normalized + '='.repeat((4 - (normalized.length % 4)) % 4);
  return Uint8Array.from(atob(padded), c => c.charCodeAt(0));
}

async function signState(payload: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(OAUTH_STATE_SIGNING_SECRET),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const signature = new Uint8Array(
    await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(payload)),
  );
  return bytesToBase64Url(signature);
}

async function verifyState(payload: string, signature: string): Promise<boolean> {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(OAUTH_STATE_SIGNING_SECRET),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['verify'],
  );
  return await crypto.subtle.verify(
    'HMAC',
    key,
    base64UrlToBytes(signature).buffer as ArrayBuffer,
    new TextEncoder().encode(payload),
  );
}

function validateGoogleConfig(): string | null {
  if (!GOOGLE_CLIENT_ID) return 'GOOGLE_CLIENT_ID secret is not set.';
  if (!GOOGLE_CLIENT_SECRET) return 'GOOGLE_CLIENT_SECRET secret is not set.';
  if (!CALENDAR_TOKEN_ENCRYPTION_KEY) return 'CALENDAR_TOKEN_ENCRYPTION_KEY secret is not set.';
  if (!OAUTH_STATE_SIGNING_SECRET) return 'OAUTH_STATE_SIGNING_SECRET secret is not set.';
  return null;
}

serve(async req => {
  _corsHeaders = getCorsHeaders(req);

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: _corsHeaders });
  }

  try {
    const configError = validateGoogleConfig();
    if (configError) return errorResponse(configError, 503);

    const url = new URL(req.url);
    const action = url.pathname.split('/').pop();

    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? '';
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

    const supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: req.headers.get('Authorization')! } },
    });

    const {
      data: { user },
      error: userError,
    } = await supabaseClient.auth.getUser();

    if (userError || !user) return errorResponse('Unauthorized', 401);

    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    // ── CONNECT: initiate Google Calendar OAuth flow ──
    if (action === 'connect') {
      const { count } = await adminClient
        .from('google_calendar_accounts')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id);

      if ((count ?? 0) >= MAX_CALENDAR_ACCOUNTS) {
        return errorResponse(
          `You can connect up to ${MAX_CALENDAR_ACCOUNTS} Google Calendar accounts. Remove one before adding another.`,
          400,
        );
      }

      const body = await req.json().catch(() => ({}));
      const requestedRedirectUri =
        body && typeof body === 'object' && typeof body.redirectUri === 'string'
          ? body.redirectUri
          : undefined;
      const redirectUri = getValidatedRedirectUri(requestedRedirectUri);

      // PKCE code_verifier (32 random bytes, base64url)
      const verifierBytes = new Uint8Array(32);
      crypto.getRandomValues(verifierBytes);
      const codeVerifier = bytesToBase64Url(verifierBytes);

      const challengeBytes = await crypto.subtle.digest(
        'SHA-256',
        new TextEncoder().encode(codeVerifier),
      );
      const codeChallenge = bytesToBase64Url(new Uint8Array(challengeBytes));

      const nonce = bytesToBase64Url(crypto.getRandomValues(new Uint8Array(32)));
      const payloadObj = {
        uid: user.id,
        nonce,
        exp: Date.now() + 10 * 60 * 1000, // 10 min expiry
        code_verifier: codeVerifier,
        redirect_uri: redirectUri,
      };
      const payload = bytesToBase64Url(new TextEncoder().encode(JSON.stringify(payloadObj)));
      const signature = await signState(payload);

      const oauthUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
      oauthUrl.searchParams.set('client_id', GOOGLE_CLIENT_ID);
      oauthUrl.searchParams.set('redirect_uri', redirectUri);
      oauthUrl.searchParams.set('response_type', 'code');
      oauthUrl.searchParams.set(
        'scope',
        'https://www.googleapis.com/auth/calendar.readonly https://www.googleapis.com/auth/userinfo.email',
      );
      oauthUrl.searchParams.set('access_type', 'offline');
      oauthUrl.searchParams.set('prompt', 'consent');
      oauthUrl.searchParams.set('state', `${payload}.${signature}`);
      oauthUrl.searchParams.set('code_challenge', codeChallenge);
      oauthUrl.searchParams.set('code_challenge_method', 'S256');

      console.log(
        `[calendar-auth] Connect initiated for user ${user.id}, redirect_uri=${redirectUri}`,
      );

      return new Response(JSON.stringify({ url: oauthUrl.toString() }), {
        headers: { ..._corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // ── CALLBACK: exchange code for tokens ──
    if (action === 'callback') {
      const { code, state } = await req.json();
      if (!code || !state || typeof state !== 'string' || !state.includes('.')) {
        return errorResponse('Missing code or state', 400);
      }

      const dotIndex = state.lastIndexOf('.');
      const payloadB64 = state.substring(0, dotIndex);
      const signature = state.substring(dotIndex + 1);

      const signatureValid = await verifyState(payloadB64, signature);
      if (!signatureValid) return errorResponse('Invalid state signature', 403);

      let decodedState: { uid: string; exp: number; code_verifier?: string; redirect_uri?: string };
      try {
        decodedState = JSON.parse(new TextDecoder().decode(base64UrlToBytes(payloadB64)));
      } catch {
        return errorResponse('Invalid state payload', 403);
      }

      if (decodedState.uid !== user.id) return errorResponse('State UID mismatch', 403);
      if (Date.now() > decodedState.exp) return errorResponse('OAuth state expired', 403);

      const redirectUri = getValidatedRedirectUri(decodedState.redirect_uri);

      const tokenParams: Record<string, string> = {
        code,
        client_id: GOOGLE_CLIENT_ID,
        client_secret: GOOGLE_CLIENT_SECRET,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      };
      if (decodedState.code_verifier) tokenParams.code_verifier = decodedState.code_verifier;

      const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams(tokenParams),
      });

      if (!tokenResponse.ok) {
        return errorResponse('Token exchange failed', 500, await tokenResponse.text());
      }

      const tokenData = await tokenResponse.json();

      const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
        headers: { Authorization: `Bearer ${tokenData.access_token}` },
      });

      if (!userInfoResponse.ok) {
        return errorResponse('Failed to fetch Google user info', 500);
      }

      const userInfo = await userInfoResponse.json();

      const encryptedAccessToken = await encryptToken(
        tokenData.access_token,
        CALENDAR_TOKEN_ENCRYPTION_KEY,
      );
      const refreshTokenRaw = tokenData.refresh_token;
      const encryptedRefreshToken = refreshTokenRaw
        ? await encryptToken(refreshTokenRaw, CALENDAR_TOKEN_ENCRYPTION_KEY)
        : null;

      // Preserve an existing refresh_token if Google omits one on re-consent.
      const { data: existing } = await adminClient
        .from('google_calendar_accounts')
        .select('refresh_token')
        .eq('user_id', user.id)
        .eq('google_user_id', userInfo.id)
        .maybeSingle();

      const refreshTokenToStore = encryptedRefreshToken || existing?.refresh_token || null;

      const { error: dbError } = await adminClient.from('google_calendar_accounts').upsert(
        {
          user_id: user.id,
          google_user_id: userInfo.id,
          email: userInfo.email,
          refresh_token: refreshTokenToStore,
          access_token: encryptedAccessToken,
          scopes: tokenData.scope ? tokenData.scope.split(' ') : [],
          token_expires_at:
            typeof tokenData.expires_in === 'number'
              ? new Date(Date.now() + (tokenData.expires_in - 60) * 1000).toISOString()
              : null,
          is_active: true,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id, google_user_id' },
      );

      if (dbError) {
        if (dbError.code === '42P01' || dbError.message?.includes('google_calendar_accounts')) {
          return errorResponse(
            'Google Calendar tables not found. Apply the google_calendar_accounts migration.',
            503,
            dbError.message,
          );
        }
        return errorResponse('Failed to save account', 500, dbError.message);
      }

      console.log(`[calendar-auth] Successfully connected ${userInfo.email} for user ${user.id}`);
      return new Response(JSON.stringify({ success: true, email: userInfo.email }), {
        headers: { ..._corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // ── DISCONNECT: revoke tokens and remove account ──
    if (action === 'disconnect') {
      const { accountId } = await req.json();
      if (!accountId) return errorResponse('Missing accountId', 400);

      const { data: account, error: fetchError } = await adminClient
        .from('google_calendar_accounts')
        .select('email, refresh_token, access_token')
        .eq('id', accountId)
        .eq('user_id', user.id)
        .single();

      if (fetchError || !account) return errorResponse('Account not found', 404);

      const refreshToken = await decryptToken(account.refresh_token, CALENDAR_TOKEN_ENCRYPTION_KEY);
      const accessToken = await decryptToken(account.access_token, CALENDAR_TOKEN_ENCRYPTION_KEY);
      const tokenToRevoke = refreshToken || accessToken;

      if (tokenToRevoke) {
        try {
          await fetch(
            `https://oauth2.googleapis.com/revoke?token=${encodeURIComponent(tokenToRevoke)}`,
            {
              method: 'POST',
              headers: { 'Content-type': 'application/x-www-form-urlencoded' },
            },
          );
        } catch (revokeErr) {
          console.warn(
            '[calendar-auth] Token revocation failed (proceeding with deletion):',
            revokeErr,
          );
        }
      }

      const { error: deleteError } = await supabaseClient
        .from('google_calendar_accounts')
        .delete()
        .eq('id', accountId)
        .eq('user_id', user.id);

      if (deleteError) return errorResponse('Failed to delete account', 500, deleteError.message);

      console.log(`[calendar-auth] Disconnected account ${accountId} for user ${user.id}`);
      return new Response(JSON.stringify({ success: true }), {
        headers: { ..._corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return errorResponse('Not found', 404);
  } catch (error: unknown) {
    console.error('[calendar-auth] Unexpected error:', error);
    return new Response(
      JSON.stringify({ error: 'An internal error occurred. Please try again later.' }),
      {
        status: 500,
        headers: { ..._corsHeaders, 'Content-Type': 'application/json' },
      },
    );
  }
});
