import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const sql = readFileSync(
  resolve(__dirname, '../../migrations/20260807130000_extend_cost_ledger_for_ai_text.sql'),
  'utf8',
);

describe('AI text cost containment migration', () => {
  it('extends the canonical ledger narrowly for ai_text', () => {
    expect(sql).toContain("'voice_realtime', 'ai_text'");
    expect(sql).toContain(
      "p_feature NOT IN ('voice_tts', 'voice_stt', 'voice_realtime', 'ai_text')",
    );
    expect(sql).toContain("VALUES ('cost_ai_text', true");
  });

  it('serializes estimated-unit reservations before checking both windows', () => {
    expect(sql).toContain('pg_advisory_xact_lock');
    expect(sql).toContain('v_daily + p_units > p_daily_limit');
    expect(sql).toContain('v_monthly + p_units > p_monthly_limit');
    expect(sql).toContain("status IN ('reserved', 'committed')");
  });

  it('keeps reservation mutation service-role only', () => {
    expect(sql).toContain("auth.role() <> 'service_role'");
    expect(sql).toContain('FROM PUBLIC, anon, authenticated');
    expect(sql).toContain('TO service_role');
  });

  it('backfills current-month legacy usage so deployment does not reset allowances', () => {
    expect(sql).toContain("'legacy_concierge_usage'");
    expect(sql).toContain('FROM public.concierge_usage');
    expect(sql).toContain('coalesce(prompt_tokens, 0) + coalesce(response_tokens, 0)');
  });
});
