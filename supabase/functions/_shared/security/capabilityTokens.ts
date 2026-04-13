import { SignJWT, jwtVerify } from 'https://deno.land/x/jose@v5.2.0/index.ts';

export interface CapabilityTokenPayload {
  user_id?: string;
  trip_id: string;
  allowed_tools: string[]; // e.g. ["addToCalendar", "createTask"] — wildcards are not permitted
  exp?: number;
}

/**
 * Lazily resolve the JWT secret. SUPABASE_JWT_SECRET is auto-injected by
 * Supabase at runtime — it cannot be added manually via the secrets dashboard
 * (the SUPABASE_ prefix is reserved). We defer the check so that edge
 * functions that never call tool-execution code don't crash on import.
 */
function getSecretKey(): Uint8Array {
  const secret = Deno.env.get('SUPABASE_JWT_SECRET');
  if (!secret) {
    throw new Error(
      'SUPABASE_JWT_SECRET is required — this value is auto-injected by Supabase at runtime. ' +
        'If missing, verify the function is deployed to the correct Supabase project.',
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
