import { SignJWT, jwtVerify } from 'https://deno.land/x/jose@v5.2.0/index.ts';

export interface CapabilityTokenPayload {
  user_id?: string;
  trip_id: string;
  allowed_tools: string[]; // e.g. ["*"] or ["addToCalendar", "createTask"]
  exp?: number;
}

/**
 * Lazily resolve the JWT secret. Throws at call-time (not import-time)
 * so that text-only concierge responses still work when the secret is missing.
 */
function getSecretKey(): Uint8Array {
  const secret = Deno.env.get('SUPABASE_JWT_SECRET');
  if (!secret) {
    throw new Error(
      'SUPABASE_JWT_SECRET is required — capability tokens cannot be signed without it. ' +
        'Set this secret in Supabase Dashboard > Edge Functions > Secrets.',
    );
  }
  return new TextEncoder().encode(secret);
}

export async function generateCapabilityToken(
  payload: Omit<CapabilityTokenPayload, 'exp'>,
  expiresInSeconds = 300,
): Promise<string> {
  const secretKey = getSecretKey();

  const jwt = await new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${expiresInSeconds}s`)
    .sign(secretKey);

  return jwt;
}

export async function verifyCapabilityToken(token: string): Promise<CapabilityTokenPayload> {
  const secretKey = getSecretKey();

  try {
    const { payload } = await jwtVerify(token, secretKey);
    return payload as unknown as CapabilityTokenPayload;
  } catch (err) {
    throw new Error(
      `Invalid or expired capability token: ${err instanceof Error ? err.message : String(err)}`,
    );
  }
}
