import type { UsagePlan } from './usagePolicy.ts';
import {
  CostReservationTracker,
  reserveCostUnits,
  type CostControlClient,
} from '../costControl.ts';

const APPROX_CHARS_PER_TOKEN = 4;
const ESTIMATED_IMAGE_TOKENS = 4_096;

export interface AiTextEstimateInput {
  systemInstruction: string;
  messages: Array<{ content: string }>;
  attachmentCount: number;
  maxOutputTokens: number;
}

/** Conservative provider-independent estimate without counting base64 payload bytes as text tokens. */
export function estimateAiTextTokens(input: AiTextEstimateInput): number {
  const textCharacters =
    input.systemInstruction.length +
    input.messages.reduce((sum, message) => sum + message.content.length, 0);
  const inputTokens = Math.ceil(textCharacters / APPROX_CHARS_PER_TOKEN);
  return Math.max(
    1,
    inputTokens +
      input.attachmentCount * ESTIMATED_IMAGE_TOKENS +
      Math.max(1, Math.ceil(input.maxOutputTokens)),
  );
}

export async function reserveAiTextBudget(
  client: CostControlClient,
  input: {
    userId: string;
    usagePlan: UsagePlan;
    monthlyTokenBudget: number;
    estimatedTokens: number;
    provider: string;
    model: string;
  },
): Promise<
  | { allowed: true; tracker: CostReservationTracker }
  | {
      allowed: false;
      code: 'AI_TEXT_BUDGET_EXHAUSTED' | 'AI_TEXT_COST_CONTROL_UNAVAILABLE';
      usedTokens: number;
      tokenBudget: number;
      resetAt?: string;
    }
> {
  const result = await reserveCostUnits(client, {
    userId: input.userId,
    feature: 'ai_text',
    provider: input.provider,
    units: input.estimatedTokens,
    // Preserve the existing monthly plan allowance: the canonical RPC requires both
    // windows, so daily uses the same ceiling rather than introducing a new product cap.
    dailyLimit: input.monthlyTokenBudget,
    monthlyLimit: input.monthlyTokenBudget,
    metadata: { model: input.model, usage_plan: input.usagePlan },
  });
  if (!result.allowed) {
    return {
      allowed: false,
      code:
        result.code === 'COST_BUDGET_EXHAUSTED'
          ? 'AI_TEXT_BUDGET_EXHAUSTED'
          : 'AI_TEXT_COST_CONTROL_UNAVAILABLE',
      usedTokens: result.monthlyUsed,
      tokenBudget: input.monthlyTokenBudget,
      resetAt: result.resetAt,
    };
  }
  return { allowed: true, tracker: new CostReservationTracker(client, result.reservation) };
}

export function buildAiTextCostRejectionResponse(
  corsHeaders: Record<string, string>,
  rejection: {
    code: 'AI_TEXT_BUDGET_EXHAUSTED' | 'AI_TEXT_COST_CONTROL_UNAVAILABLE';
    usedTokens: number;
    tokenBudget: number;
    resetAt?: string;
  },
): Response {
  const exhausted = rejection.code === 'AI_TEXT_BUDGET_EXHAUSTED';
  return new Response(
    JSON.stringify({
      response: exhausted
        ? '🚫 **Monthly AI budget reached**\n\nConcierge is resting for this usage period. Your trip tools are still available.'
        : "⚠️ **Unable to verify AI allowance**\n\nWe couldn't verify Concierge usage right now. Please try again in a moment.",
      usage: { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 },
      sources: [],
      success: false,
      error: exhausted ? 'token_budget_exceeded' : 'cost_control_unavailable',
      upgradeRequired: exhausted,
      code: rejection.code,
      retryable: !exhausted,
      reset_at: rejection.resetAt,
      budget: {
        usedTokens: rejection.usedTokens,
        tokenBudget: rejection.tokenBudget,
      },
    }),
    {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    },
  );
}
