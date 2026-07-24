#!/usr/bin/env node
// Edge-function ↔ config.toml parity control (drift category B.26–B.28).
//
// Two representations of the edge-function surface must agree:
//   1. supabase/functions/<name>/          — the code that exists
//   2. supabase/config.toml [functions.*]  — the deployed JWT gate
// A function with no [functions.*] block silently inherits verify_jwt = true.
// That is correct for authenticated functions but a BREAK for webhook / public
// endpoints, whose callers (Stripe, RevenueCat, Stream, preview crawlers) never
// send a Supabase JWT — the gateway rejects them before the function's own
// shared-secret check runs. config.toml is a protected file (edits require a
// human), so this gate DETECTS drift and points at the exact fix rather than
// applying it.
//
// Fails (exit 1) only on NEW, un-baselined drift:
//   - a config block that points at a function with no code (orphan), or
//   - a webhook/public-intent function missing an explicit verify_jwt = false.
// Pre-existing known items are quarantined in the baseline and reported (not
// hidden) with their required external action. Read-only.

import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(__dirname, '..', '..');
const functionsDir = join(repoRoot, 'supabase', 'functions');
const configPath = join(repoRoot, 'supabase', 'config.toml');
const baselinePath = join(__dirname, 'edge-function-parity-baseline.json');

const IGNORED_DIRS = new Set(['_shared', '__tests__']);

/** Parse `[functions.NAME]` blocks and their verify_jwt from config.toml. */
function parseConfig(text) {
  const blocks = new Map();
  let current = null;
  for (const raw of text.split('\n')) {
    const line = raw.trim();
    const header = line.match(/^\[functions\.([a-z0-9-]+)\]$/i);
    if (header) {
      current = header[1];
      blocks.set(current, { verifyJwt: undefined });
      continue;
    }
    const kv = line.match(/^verify_jwt\s*=\s*(true|false)\b/);
    if (kv && current) blocks.get(current).verifyJwt = kv[1] === 'true';
  }
  return blocks;
}

/** A function is "public intent" if its name or code says a non-JWT caller reaches it. */
function detectPublicIntent(name) {
  if (/-webhook$/.test(name)) return 'name ends in -webhook';
  const idx = join(functionsDir, name, 'index.ts');
  if (!existsSync(idx)) return null;
  const src = readFileSync(idx, 'utf8');
  if (/Deno\.env\.get\(\s*['"][A-Z0-9_]*WEBHOOK_SECRET['"]/.test(src)) {
    return 'reads a *_WEBHOOK_SECRET (shared-secret auth, not JWT)';
  }
  return null;
}

const config = parseConfig(readFileSync(configPath, 'utf8'));
const dirs = readdirSync(functionsDir, { withFileTypes: true })
  .filter(d => d.isDirectory() && !IGNORED_DIRS.has(d.name))
  .map(d => d.name)
  .sort();
const dirSet = new Set(dirs);

const baseline = existsSync(baselinePath)
  ? JSON.parse(readFileSync(baselinePath, 'utf8'))
  : { knownOrphanedConfigBlocks: [], knownPublicWithoutConfig: [] };
const knownOrphans = new Set(baseline.knownOrphanedConfigBlocks || []);
const knownPublic = new Set(baseline.knownPublicWithoutConfig || []);

// 1. Config blocks pointing at non-existent code.
const orphaned = [...config.keys()].filter(name => !dirSet.has(name)).sort();

// 2. Public-intent functions lacking an explicit verify_jwt = false.
const publicWithoutConfig = [];
for (const name of dirs) {
  const reason = detectPublicIntent(name);
  if (!reason) continue;
  const block = config.get(name);
  if (!block || block.verifyJwt !== false) {
    publicWithoutConfig.push({ name, reason, hasBlock: Boolean(block) });
  }
}

// 3. Informational: functions with no block (inherit verify_jwt = true).
const noConfig = dirs.filter(name => !config.has(name));

const newOrphans = orphaned.filter(n => !knownOrphans.has(n));
const newPublic = publicWithoutConfig.filter(p => !knownPublic.has(p.name));

const publicCount = [...config.values()].filter(b => b.verifyJwt === false).length;

console.log('=== Edge-function ↔ config.toml parity ===');
console.log(
  `${dirs.length} function dir(s), ${config.size} config block(s) ` +
    `(${publicCount} public/verify_jwt=false), ${noConfig.length} dir(s) inherit verify_jwt=true.`,
);

// Report quarantined-but-tracked items so they stay visible.
const quarantinedOrphans = orphaned.filter(n => knownOrphans.has(n));
const quarantinedPublic = publicWithoutConfig.filter(p => knownPublic.has(p.name));
if (quarantinedOrphans.length || quarantinedPublic.length) {
  console.log('\n⚠️  Tracked known drift (quarantined — requires a human config.toml change):');
  for (const n of quarantinedOrphans) {
    console.log(
      `   • orphaned config block [functions.${n}] — no code dir; remove the block or restore the function.`,
    );
  }
  for (const p of quarantinedPublic) {
    console.log(
      `   • ${p.name} — ${p.reason}; add [functions.${p.name}] verify_jwt = false to config.toml.`,
    );
  }
}

let failed = false;
if (newOrphans.length) {
  failed = true;
  console.log('\n❌ NEW orphaned config block(s) (declared, no code):');
  for (const n of newOrphans) console.log(`   [functions.${n}]`);
}
if (newPublic.length) {
  failed = true;
  console.log(
    '\n❌ NEW public/webhook function(s) missing verify_jwt = false (gateway will reject non-JWT callers):',
  );
  for (const p of newPublic) console.log(`   ${p.name} — ${p.reason}`);
}

if (failed) {
  console.log(
    '\nAdd the correct [functions.NAME] block to supabase/config.toml, or if intentional and ' +
      'already reconciled, add to scripts/drift/edge-function-parity-baseline.json with justification.',
  );
  process.exit(1);
}

console.log('\n✅ No new edge-function parity drift.');
process.exit(0);
