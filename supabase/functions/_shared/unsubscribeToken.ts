/**
 * Signed one-click unsubscribe tokens.
 *
 * Token = base64url(user_id) + "." + base64url(HMAC-SHA256(user_id))
 *
 * The MAC key is DERIVED from SUPABASE_SERVICE_ROLE_KEY with a fixed domain
 * separator (HKDF-style) rather than introducing a new secret: every edge
 * function already holds the service key, the derivation never exposes it,
 * and the token cannot be confused with any other signed artifact. Rotating
 * the service key invalidates previously-sent links, which is acceptable —
 * every outgoing email embeds a fresh token.
 */

const DOMAIN_SEPARATOR = 'chravel-unsubscribe-v1';

const encoder = new TextEncoder();

function base64UrlEncode(bytes: Uint8Array): string {
  let binary = '';
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function base64UrlDecode(input: string): Uint8Array | null {
  try {
    const padded = input.replace(/-/g, '+').replace(/_/g, '/');
    const binary = atob(padded + '='.repeat((4 - (padded.length % 4)) % 4));
    return Uint8Array.from(binary, c => c.charCodeAt(0));
  } catch {
    return null;
  }
}

async function deriveMacKey(): Promise<CryptoKey | null> {
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!serviceKey) return null;

  const rootKey = await crypto.subtle.importKey(
    'raw',
    encoder.encode(serviceKey),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const derived = await crypto.subtle.sign('HMAC', rootKey, encoder.encode(DOMAIN_SEPARATOR));
  return crypto.subtle.importKey('raw', derived, { name: 'HMAC', hash: 'SHA-256' }, false, [
    'sign',
    'verify',
  ]);
}

/** Returns a signed token for the user, or null if signing is unavailable. */
export async function createUnsubscribeToken(userId: string): Promise<string | null> {
  const key = await deriveMacKey();
  if (!key) return null;

  const payload = encoder.encode(userId);
  const mac = new Uint8Array(await crypto.subtle.sign('HMAC', key, payload));
  return `${base64UrlEncode(payload)}.${base64UrlEncode(mac)}`;
}

/** Returns the verified user id, or null for any malformed/forged token. */
export async function verifyUnsubscribeToken(token: string): Promise<string | null> {
  const parts = token.split('.');
  if (parts.length !== 2) return null;

  const payload = base64UrlDecode(parts[0]);
  const mac = base64UrlDecode(parts[1]);
  if (!payload || !mac) return null;

  const key = await deriveMacKey();
  if (!key) return null;

  const valid = await crypto.subtle.verify(
    'HMAC',
    key,
    mac.buffer as ArrayBuffer,
    payload.buffer as ArrayBuffer,
  );
  if (!valid) return null;

  const userId = new TextDecoder().decode(payload);
  // user ids are UUIDs; reject anything else defensively.
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userId)
    ? userId
    : null;
}
