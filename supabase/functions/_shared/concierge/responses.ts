import type { UsagePlan, TokenBudgetCheckResult } from './usagePolicy.ts';

export const buildTripLimitReachedResponse = (
  corsHeaders: Record<string, string>,
  usagePlan: UsagePlan,
): Response => {
  const limitMessage =
    usagePlan === 'free'
      ? "You've used all 5 Concierge queries for this trip."
      : "You've used all 10 Concierge queries for this trip.";
  return new Response(
    JSON.stringify({
      response: `🚫 **Trip query limit reached**\n\n${limitMessage}`,
      usage: { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 },
      sources: [],
      success: false,
      error: 'usage_limit_exceeded',
      upgradeRequired: true,
    }),
    {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    },
  );
};

export const buildMonthlyLimitReachedResponse = (
  corsHeaders: Record<string, string>,
  usagePlan: UsagePlan,
): Response => {
  const limitMessage =
    usagePlan === 'free'
      ? "You've reached your monthly Concierge limit of 20 queries. Upgrade to Explorer for 100/month or Frequent Chraveler for unlimited."
      : "You've reached your monthly Concierge limit. Upgrade your plan for more queries.";
  return new Response(
    JSON.stringify({
      response: `🚫 **Monthly limit reached**\n\n${limitMessage}`,
      usage: { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 },
      sources: [],
      success: false,
      error: 'monthly_limit_exceeded',
      upgradeRequired: true,
    }),
    {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    },
  );
};

export const buildUsageVerificationUnavailableResponse = (
  corsHeaders: Record<string, string>,
): Response =>
  new Response(
    JSON.stringify({
      response:
        "⚠️ **Unable to verify query allowance**\n\nWe couldn't verify your Concierge usage right now. Please try again in a moment.",
      usage: { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 },
      sources: [],
      success: false,
      error: 'usage_verification_unavailable',
    }),
    {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    },
  );

export const buildTokenBudgetReachedResponse = (
  corsHeaders: Record<string, string>,
  usagePlan: UsagePlan,
  budgetResult: TokenBudgetCheckResult,
): Response => {
  const budget = budgetResult.tokenBudget ?? 0;
  const used = budgetResult.usedTokens;
  const message =
    usagePlan === 'free'
      ? `You've reached your monthly AI token budget for the free plan (${used.toLocaleString()} of ${budget.toLocaleString()} tokens used). Upgrade to Explorer or Frequent Chraveler to keep chatting.`
      : `You've reached your monthly AI token budget (${used.toLocaleString()} of ${budget.toLocaleString()} tokens used). Upgrade your plan for more capacity.`;

  return new Response(
    JSON.stringify({
      response: `🚫 **Monthly AI budget reached**\n\n${message}`,
      usage: { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 },
      sources: [],
      success: false,
      error: 'token_budget_exceeded',
      upgradeRequired: true,
      budget: {
        usedTokens: used,
        tokenBudget: budget,
      },
    }),
    {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    },
  );
};
