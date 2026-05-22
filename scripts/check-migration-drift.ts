#!/usr/bin/env node
/**
 * Migration Drift Gate
 *
 * Compares the timestamped migrations in supabase/migrations/ against the
 * versions actually applied to the linked Supabase project. Fails CI if any
 * local file is missing from supabase_migrations.schema_migrations — the
 * exact failure mode that broke poll voting (vote_on_poll_batch shipped to
 * main but never applied to prod).
 *
 * Requires two env vars in CI (mark both as repo secrets):
 *   SUPABASE_DRIFT_CHECK_URL          = https://<project-ref>.supabase.co
 *   SUPABASE_DRIFT_CHECK_SERVICE_KEY  = service-role JWT
 *
 * Behavior:
 *   - Env vars missing → warn + exit 0 (so forked PRs without secrets don't
 *     fail the build; the main-branch run is the gate that matters).
 *   - Unreachable RPC / network error → exit 2 (infra issue, not drift).
 *   - Drift detected → list each unapplied version + exit 1.
 *
 * Local use:
 *   SUPABASE_DRIFT_CHECK_URL=... SUPABASE_DRIFT_CHECK_SERVICE_KEY=... \
 *     npx tsx scripts/check-migration-drift.ts
 */

import * as fs from 'fs';
import * as path from 'path';
import { createClient } from '@supabase/supabase-js';

const MIGRATIONS_DIR = path.resolve(process.cwd(), 'supabase', 'migrations');

function readLocalVersions(): string[] {
  if (!fs.existsSync(MIGRATIONS_DIR)) {
    console.error(`[drift] migrations dir not found: ${MIGRATIONS_DIR}`);
    process.exit(2);
  }
  return fs
    .readdirSync(MIGRATIONS_DIR)
    .filter(f => /^\d{14}.*\.sql$/.test(f))
    .map(f => f.slice(0, 14))
    .sort();
}

async function readAppliedVersions(url: string, serviceKey: string): Promise<string[]> {
  const client = createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data, error } = await client.rpc('list_applied_migrations');
  if (error) {
    console.error('[drift] RPC list_applied_migrations failed:', error.message);
    process.exit(2);
  }
  const rows = (data ?? []) as Array<{ version: string }>;
  return rows.map(r => r.version).sort();
}

async function main() {
  const url = process.env.SUPABASE_DRIFT_CHECK_URL;
  const serviceKey = process.env.SUPABASE_DRIFT_CHECK_SERVICE_KEY;

  if (!url || !serviceKey) {
    console.warn(
      '[drift] SUPABASE_DRIFT_CHECK_URL / SUPABASE_DRIFT_CHECK_SERVICE_KEY not set — skipping (set both as CI secrets to enable the gate).',
    );
    process.exit(0);
  }

  const local = readLocalVersions();
  const applied = new Set(await readAppliedVersions(url, serviceKey));

  const unapplied = local.filter(v => !applied.has(v));

  if (unapplied.length === 0) {
    console.log(`[drift] OK — ${local.length}/${local.length} migrations applied.`);
    return;
  }

  console.error(
    `[drift] FAIL — ${unapplied.length} migration file(s) present in repo but NOT applied to the project:`,
  );
  for (const v of unapplied) {
    const file = fs.readdirSync(MIGRATIONS_DIR).find(f => f.startsWith(v));
    console.error(`   • ${file ?? v}`);
  }
  console.error(
    '\nApply them via `supabase db push` or the Supabase MCP apply_migration tool before merging.',
  );
  process.exit(1);
}

main().catch(err => {
  console.error('[drift] unexpected error:', err);
  process.exit(2);
});
