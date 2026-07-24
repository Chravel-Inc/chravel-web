#!/usr/bin/env node
// Migration-integrity drift control.
//
// Source of truth: the ordered set of files in supabase/migrations/. Two files
// that share a timestamp prefix apply in a nondeterministic order, so a clean
// bootstrap can diverge from what production actually ran (drift category A.4 /
// A.5). This gate REJECTS *new* duplicate timestamps while grandfathering the
// ones that already shipped — renaming an already-applied migration is unsafe
// (it changes history), so we freeze today's collisions in a baseline and only
// fail when a branch introduces a fresh one.
//
// Read-only. Exit 1 only on un-baselined duplicates. `--update-baseline`
// rewrites the baseline from the current tree (run intentionally, review diff).

import { readFileSync, writeFileSync, readdirSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(__dirname, '..', '..');
const migrationsDir = join(repoRoot, 'supabase', 'migrations');
const baselinePath = join(__dirname, 'migration-drift-baseline.json');

const UPDATE = process.argv.includes('--update-baseline');
const TIMESTAMP_RE = /^\d{14}_/;

/** Leading numeric run of a migration filename = its ordering key. */
function timestampPrefix(file) {
  const m = file.match(/^(\d+)/);
  return m ? m[1] : null;
}

function loadBaseline() {
  if (!existsSync(baselinePath)) {
    return { knownDuplicateTimestamps: [], knownNamingExceptions: [] };
  }
  return JSON.parse(readFileSync(baselinePath, 'utf8'));
}

function collect() {
  const files = readdirSync(migrationsDir)
    .filter(f => f.endsWith('.sql'))
    .sort();

  const byPrefix = new Map();
  const namingViolations = [];
  for (const file of files) {
    const prefix = timestampPrefix(file);
    if (!TIMESTAMP_RE.test(file)) namingViolations.push(file);
    if (!prefix) continue;
    if (!byPrefix.has(prefix)) byPrefix.set(prefix, []);
    byPrefix.get(prefix).push(file);
  }

  const duplicateTimestamps = [...byPrefix.entries()]
    .filter(([, group]) => group.length > 1)
    .map(([prefix]) => prefix)
    .sort();

  return { fileCount: files.length, duplicateTimestamps, namingViolations };
}

const { fileCount, duplicateTimestamps, namingViolations } = collect();

if (UPDATE) {
  const baseline = {
    _comment:
      'Grandfathered migration-integrity exceptions. Do NOT add new entries by hand — ' +
      'they are only acceptable because these migrations already shipped and renaming ' +
      'an applied migration would rewrite history. Regenerate with ' +
      '`node scripts/drift/check-migration-drift.mjs --update-baseline`.',
    knownDuplicateTimestamps: duplicateTimestamps,
    knownNamingExceptions: namingViolations,
  };
  writeFileSync(baselinePath, JSON.stringify(baseline, null, 2) + '\n');
  console.log(
    `[migration-drift] Baseline written: ${duplicateTimestamps.length} duplicate timestamp(s), ` +
      `${namingViolations.length} naming exception(s) grandfathered.`,
  );
  process.exit(0);
}

const baseline = loadBaseline();
const knownDup = new Set(baseline.knownDuplicateTimestamps || []);
const knownNaming = new Set(baseline.knownNamingExceptions || []);

const newDuplicates = duplicateTimestamps.filter(p => !knownDup.has(p));
const newNaming = namingViolations.filter(f => !knownNaming.has(f));

console.log('=== Migration-integrity drift ===');
console.log(`Scanned ${fileCount} migration file(s).`);
console.log(
  `Grandfathered: ${knownDup.size} duplicate timestamp(s), ${knownNaming.size} naming exception(s).`,
);

if (newDuplicates.length === 0 && newNaming.length === 0) {
  console.log('✅ No new duplicate timestamps or naming violations.');
  process.exit(0);
}

if (newDuplicates.length > 0) {
  console.log(`\n❌ ${newDuplicates.length} NEW duplicate migration timestamp(s):`);
  for (const prefix of newDuplicates) {
    console.log(
      `   ${prefix} — collides; migrations at this prefix apply in nondeterministic order.`,
    );
  }
  console.log(
    '   Fix: give the new migration a unique 14-digit timestamp prefix (do NOT rename applied ones).',
  );
}
if (newNaming.length > 0) {
  console.log(
    `\n❌ ${newNaming.length} NEW migration filename(s) not matching YYYYMMDDHHMMSS_slug.sql:`,
  );
  for (const file of newNaming) console.log(`   ${file}`);
}
console.log(
  '\nIf these are intentional and already applied, run --update-baseline and justify in the PR.',
);
process.exit(1);
