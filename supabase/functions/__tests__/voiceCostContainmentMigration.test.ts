import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const sql = readFileSync(
  resolve(__dirname, '../../migrations/20260807120000_cost_usage_ledger_and_voice_controls.sql'),
  'utf8',
);

describe('voice cost containment migration', () => {
  it('serializes reservation checks to prevent concurrent overshoot', () => {
    expect(sql).toContain('pg_advisory_xact_lock');
    expect(sql).toContain('v_daily + p_units > p_daily_limit');
    expect(sql).toContain('v_monthly + p_units > p_monthly_limit');
    expect(sql).toContain("status IN ('reserved', 'committed')");
  });

  it('restricts mutation RPCs to trusted edge-function service role calls', () => {
    expect(sql).toContain("auth.role() <> 'service_role'");
    expect(sql).toContain('FROM PUBLIC, anon, authenticated');
    expect(sql).toContain('TO service_role');
  });

  it('seeds independent server-side voice cost kill switches', () => {
    expect(sql).toContain("('cost_voice_tts', true");
    expect(sql).toContain("('cost_voice_stt', true");
    expect(sql).toContain("('cost_voice_realtime', false");
  });
});
