#!/usr/bin/env node
/**
 * RLS Coverage Check
 *
 * Every table created in the `public` schema must have Row Level Security enabled in the same
 * migration tree. Without RLS, a table is readable and writable by any client holding the
 * publishable key — the policies written for it are inert, which is worse than having none,
 * because the migration reads as if the table were protected.
 *
 * This exists because that failure actually shipped: 20250115000000_broadcast_enhancements.sql
 * creates `public.broadcast_views`, writes three policies for it, and then enables RLS on
 * `public.broadcasts` instead — a copy-paste slip no reviewer caught and no test could catch.
 *
 * Usage:
 *   npx tsx scripts/check-rls-coverage.ts
 *
 * Exit codes:
 *   0 = every public table created in migrations enables RLS
 *   1 = at least one table is missing ENABLE ROW LEVEL SECURITY
 */

import * as fs from 'fs';
import * as path from 'path';

const MIGRATIONS_DIR = path.resolve(process.cwd(), 'supabase/migrations');

/**
 * Tables that intentionally never enable RLS. Keep this empty unless there is a documented
 * reason; a deny-all table should still ENABLE ROW LEVEL SECURITY (that is what makes it
 * deny-all) rather than be listed here.
 */
const ALLOWLIST = new Set<string>();

interface TableRef {
  table: string;
  file: string;
  line: number;
}

// CREATE TABLE [IF NOT EXISTS] [public.]name — ignores CREATE TEMP/UNLOGGED and other schemas.
const CREATE_TABLE = /^\s*CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?(?:public\.)?"?([a-z0-9_]+)"?/i;
// ALTER TABLE [public.]name ENABLE ROW LEVEL SECURITY
const ENABLE_RLS =
  /^\s*ALTER\s+TABLE\s+(?:ONLY\s+)?(?:public\.)?"?([a-z0-9_]+)"?\s+ENABLE\s+ROW\s+LEVEL\s+SECURITY/i;
// DROP TABLE [IF EXISTS] [public.]name — a table dropped later needs no RLS.
const DROP_TABLE = /^\s*DROP\s+TABLE\s+(?:IF\s+EXISTS\s+)?(?:public\.)?"?([a-z0-9_]+)"?/i;
// Skip other schemas explicitly (storage.objects, auth.users, ...).
const QUALIFIED_OTHER_SCHEMA = /\b(?:auth|storage|extensions|realtime|vault|cron|graphql)\s*\./i;

function main(): void {
  if (!fs.existsSync(MIGRATIONS_DIR)) {
    console.error(`  Migrations directory not found: ${MIGRATIONS_DIR}`);
    process.exit(1);
  }

  const files = fs
    .readdirSync(MIGRATIONS_DIR)
    .filter(f => f.endsWith('.sql'))
    .sort();

  const created = new Map<string, TableRef>();
  const rlsEnabled = new Set<string>();
  const dropped = new Set<string>();

  for (const file of files) {
    const lines = fs.readFileSync(path.join(MIGRATIONS_DIR, file), 'utf-8').split('\n');

    lines.forEach((rawLine, index) => {
      const line = rawLine.split('--')[0];
      if (!line.trim()) return;

      const createMatch = line.match(CREATE_TABLE);
      if (createMatch && !QUALIFIED_OTHER_SCHEMA.test(line)) {
        const table = createMatch[1].toLowerCase();
        // Keep the first creation site — that is where the missing ALTER belongs.
        if (!created.has(table)) {
          created.set(table, { table, file, line: index + 1 });
        }
        dropped.delete(table);
      }

      const rlsMatch = line.match(ENABLE_RLS);
      if (rlsMatch) rlsEnabled.add(rlsMatch[1].toLowerCase());

      const dropMatch = line.match(DROP_TABLE);
      if (dropMatch && !QUALIFIED_OTHER_SCHEMA.test(line)) dropped.add(dropMatch[1].toLowerCase());
    });
  }

  const missing: TableRef[] = [];
  for (const [table, ref] of created) {
    if (rlsEnabled.has(table)) continue;
    if (dropped.has(table)) continue;
    if (ALLOWLIST.has(table)) continue;
    missing.push(ref);
  }

  missing.sort((a, b) => a.table.localeCompare(b.table));

  console.log('\n  RLS Coverage Check');
  console.log(`  ${created.size} public tables created across ${files.length} migrations`);
  console.log(`  ${rlsEnabled.size} tables enable RLS\n`);

  if (missing.length === 0) {
    console.log('  Every public table enables Row Level Security.\n');
    return;
  }

  console.log(`  [ERROR] ${missing.length} table(s) created without ENABLE ROW LEVEL SECURITY:\n`);
  for (const ref of missing) {
    console.log(`    public.${ref.table}`);
    console.log(`      created at ${ref.file}:${ref.line}`);
    console.log(
      `      fix: ALTER TABLE public.${ref.table} ENABLE ROW LEVEL SECURITY;  (plus policies)\n`,
    );
  }
  console.log(
    '  A table without RLS is readable and writable by any client with the publishable key,\n' +
      '  and any policies written for it are inert.\n',
  );
  process.exit(1);
}

main();
