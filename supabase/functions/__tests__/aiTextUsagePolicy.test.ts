import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const source = readFileSync(resolve(__dirname, '../_shared/concierge/usagePolicy.ts'), 'utf8');
const conciergeSource = readFileSync(resolve(__dirname, '../lovable-concierge/index.ts'), 'utf8');

describe('paid Concierge usage policy', () => {
  it('has a positive Frequent Chraveler monthly default', () => {
    expect(source).toContain("CONCIERGE_FREQUENT_MONTHLY_TOKEN_BUDGET') || 1_000_000");
  });

  it('fails closed when legacy usage verification errors', () => {
    expect(source).toContain('return { allowed: false, usedTokens: 0, tokenBudget };');
  });

  it('reserves before any routed text provider call and tracks provider invocation', () => {
    const costFlag = conciergeSource.indexOf("isFeatureEnabled('cost_ai_text', false)");
    const reservation = conciergeSource.indexOf('await reserveAiTextBudget(costClient');
    const routedFetch = conciergeSource.indexOf('const providerFetch: typeof fetch');
    const streamingBranch = conciergeSource.indexOf('if (useStreaming)');
    expect(costFlag).toBeGreaterThan(-1);
    expect(reservation).toBeGreaterThan(costFlag);
    expect(routedFetch).toBeGreaterThan(reservation);
    expect(streamingBranch).toBeGreaterThan(routedFetch);
    expect(conciergeSource).toContain('aiCostTracker?.markProviderInvoked()');
    expect(conciergeSource).toContain('await aiCostTracker?.finalizeFailure()');
  });

  it('records prompt and response tokens for both streaming and JSON responses', () => {
    expect(
      conciergeSource.match(/prompt_tokens: (streamUsage|usage)\.prompt_tokens/g),
    ).toHaveLength(2);
  });
});
