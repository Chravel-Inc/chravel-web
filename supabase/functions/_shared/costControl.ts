export type CostFeature = 'voice_tts' | 'voice_stt' | 'voice_realtime' | 'ai_text';
export type VoiceCostFeature = Exclude<CostFeature, 'ai_text'>;

interface RpcResult {
  data: unknown;
  error: { message?: string } | null;
}

export interface CostControlClient {
  rpc(name: string, params: Record<string, unknown>): PromiseLike<RpcResult>;
}

interface ReservationRow {
  allowed?: boolean;
  reservation_id?: string | null;
  reason?: string | null;
  daily_reset_at?: string;
  monthly_reset_at?: string;
  daily_used?: number;
  monthly_used?: number;
}

export interface VoiceReservation {
  id: string;
  userId: string;
}

export interface CostReservation extends VoiceReservation {
  estimatedUnits: number;
}

export type VoiceReservationResult =
  | { allowed: true; reservation: VoiceReservation }
  | {
      allowed: false;
      code: 'VOICE_BUDGET_EXHAUSTED' | 'VOICE_COST_CONTROL_UNAVAILABLE';
      resetAt?: string;
    };

export type CostReservationResult =
  | {
      allowed: true;
      reservation: CostReservation;
      dailyUsed: number;
      monthlyUsed: number;
    }
  | {
      allowed: false;
      code: 'COST_BUDGET_EXHAUSTED' | 'COST_CONTROL_UNAVAILABLE';
      resetAt?: string;
      dailyUsed: number;
      monthlyUsed: number;
    };

export async function reserveCostUnits(
  client: CostControlClient,
  input: {
    userId: string;
    feature: CostFeature;
    provider: string;
    units: number;
    dailyLimit: number;
    monthlyLimit: number;
    metadata?: Record<string, unknown>;
  },
): Promise<CostReservationResult> {
  const estimatedUnits = Math.ceil(input.units);
  try {
    const { data, error } = await client.rpc('reserve_cost_units', {
      p_user_id: input.userId,
      p_feature: input.feature,
      p_provider: input.provider,
      p_units: estimatedUnits,
      p_daily_limit: input.dailyLimit,
      p_monthly_limit: input.monthlyLimit,
      p_metadata: input.metadata ?? {},
    });
    if (error) {
      return {
        allowed: false,
        code: 'COST_CONTROL_UNAVAILABLE',
        dailyUsed: 0,
        monthlyUsed: 0,
      };
    }
    const row = (Array.isArray(data) ? data[0] : data) as ReservationRow | null;
    const dailyUsed = Number(row?.daily_used ?? 0);
    const monthlyUsed = Number(row?.monthly_used ?? 0);
    if (!row?.allowed || !row.reservation_id) {
      return {
        allowed: false,
        code: 'COST_BUDGET_EXHAUSTED',
        resetAt:
          row?.reason === 'daily_budget_exhausted' ? row.daily_reset_at : row?.monthly_reset_at,
        dailyUsed,
        monthlyUsed,
      };
    }
    return {
      allowed: true,
      reservation: { id: row.reservation_id, userId: input.userId, estimatedUnits },
      dailyUsed,
      monthlyUsed,
    };
  } catch {
    return {
      allowed: false,
      code: 'COST_CONTROL_UNAVAILABLE',
      dailyUsed: 0,
      monthlyUsed: 0,
    };
  }
}

export async function finalizeCostUnits(
  client: CostControlClient,
  reservation: CostReservation,
  options: { actualUnits?: number; release?: boolean } = {},
): Promise<void> {
  await finalizeVoiceCost(client, reservation, options);
}

/**
 * Tracks whether a paid provider was contacted. A failure releases the reservation
 * only when no provider invocation began; ambiguous/upstream failures commit the
 * conservative estimate because the vendor may still bill them.
 */
export class CostReservationTracker {
  private providerInvoked = false;
  private finalized = false;

  constructor(
    private readonly client: CostControlClient,
    readonly reservation: CostReservation,
  ) {}

  markProviderInvoked(): void {
    this.providerInvoked = true;
  }

  async finalizeSuccess(actualUnits: number): Promise<void> {
    if (this.finalized) return;
    this.finalized = true;
    await finalizeCostUnits(this.client, this.reservation, {
      actualUnits: actualUnits > 0 ? actualUnits : this.reservation.estimatedUnits,
    });
  }

  async finalizeFailure(): Promise<void> {
    if (this.finalized) return;
    this.finalized = true;
    await finalizeCostUnits(this.client, this.reservation, {
      actualUnits: this.reservation.estimatedUnits,
      release: !this.providerInvoked,
    });
  }
}

export async function reserveVoiceCost(
  client: CostControlClient,
  input: {
    userId: string;
    feature: VoiceCostFeature;
    provider: string;
    units: number;
    dailyLimit: number;
    monthlyLimit: number;
    metadata?: Record<string, unknown>;
  },
): Promise<VoiceReservationResult> {
  const result = await reserveCostUnits(client, input);
  if (!result.allowed) {
    return {
      allowed: false,
      code:
        result.code === 'COST_BUDGET_EXHAUSTED'
          ? 'VOICE_BUDGET_EXHAUSTED'
          : 'VOICE_COST_CONTROL_UNAVAILABLE',
      resetAt: result.resetAt,
    };
  }
  return {
    allowed: true,
    reservation: { id: result.reservation.id, userId: result.reservation.userId },
  };
}

export async function finalizeVoiceCost(
  client: CostControlClient,
  reservation: VoiceReservation,
  options: { actualUnits?: number; release?: boolean } = {},
): Promise<void> {
  await client.rpc('finalize_cost_units', {
    p_reservation_id: reservation.id,
    p_user_id: reservation.userId,
    p_actual_units:
      options.actualUnits == null ? null : Math.max(0, Math.ceil(options.actualUnits)),
    p_release: options.release === true,
  });
}

export function voiceErrorResponse(
  code:
    | 'VOICE_FEATURE_DISABLED'
    | 'VOICE_RATE_LIMITED'
    | 'VOICE_BUDGET_EXHAUSTED'
    | 'VOICE_COST_CONTROL_UNAVAILABLE'
    | 'VOICE_UPSTREAM_TIMEOUT'
    | 'VOICE_REQUEST_CANCELLED',
  cors: Record<string, string>,
  options: { status?: number; resetAt?: string } = {},
): Response {
  const status =
    options.status ??
    (code === 'VOICE_RATE_LIMITED' || code === 'VOICE_BUDGET_EXHAUSTED' ? 429 : 503);
  const retryAfter = options.resetAt
    ? Math.max(1, Math.ceil((Date.parse(options.resetAt) - Date.now()) / 1000))
    : undefined;
  return new Response(
    JSON.stringify({
      error: 'Voice is paused right now. Continue by typing.',
      code,
      retryable: code !== 'VOICE_FEATURE_DISABLED' && code !== 'VOICE_BUDGET_EXHAUSTED',
      reset_at: options.resetAt,
    }),
    {
      status,
      headers: {
        ...cors,
        'Content-Type': 'application/json',
        ...(retryAfter ? { 'Retry-After': String(retryAfter) } : {}),
      },
    },
  );
}

export async function fetchWithTimeout(
  input: RequestInfo | URL,
  init: RequestInit,
  timeoutMs: number,
  requestSignal?: AbortSignal,
): Promise<Response> {
  const controller = new AbortController();
  const abort = () => controller.abort(requestSignal?.reason);
  if (requestSignal?.aborted) abort();
  else requestSignal?.addEventListener('abort', abort, { once: true });
  const timeout = setTimeout(
    () => controller.abort(new DOMException('Timed out', 'TimeoutError')),
    timeoutMs,
  );
  try {
    return await fetch(input, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timeout);
    requestSignal?.removeEventListener('abort', abort);
  }
}
