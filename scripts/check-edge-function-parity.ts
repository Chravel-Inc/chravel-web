#!/usr/bin/env node
/**
 * Edge Function Parity Checker
 *
 * Validates that every [functions.X] entry in supabase/config.toml has a
 * corresponding implementation directory under supabase/functions/X/.
 *
 * NOTE: The reverse direction (functions on disk without a config block) is
 * NOT a violation — Supabase only requires explicit [functions.X] blocks for
 * functions that override defaults (e.g. verify_jwt = false). Functions that
 * use defaults can omit their config block entirely.
 *
 * Why: stale config.toml entries that reference non-existent functions
 * silently break deploys, mislead architecture reviews, and create "ghost"
 * features. See audit finding R-013 (gemini-voice-session / gemini-voice-proxy).
 *
 * To intentionally exclude a function (e.g. externally-deployed agents),
 * add its name to EXTERNAL_DEPLOY_ALLOWLIST below with a one-line reason.
 *
 * Usage:
 *   npx tsx scripts/check-edge-function-parity.ts
 *
 * Exit codes:
 *   0 = parity verified
 *   1 = drift detected
 */

import * as fs from 'fs';
import * as path from 'path';

const CONFIG_PATH = path.resolve(process.cwd(), 'supabase/config.toml');
const FUNCTIONS_DIR = path.resolve(process.cwd(), 'supabase/functions');

/**
 * Functions referenced by config.toml or other code but intentionally NOT
 * implemented in this repo (e.g. deployed from a separate repo / agent host).
 *
 * Format: { name: reason }
 */
const EXTERNAL_DEPLOY_ALLOWLIST: Record<string, string> = {
  // (intentionally empty — add entries here with a clear justification)
};

/**
 * Directories under supabase/functions/ that are NOT edge functions
 * (shared modules, tests, fixtures).
 */
const NON_FUNCTION_DIRS = new Set(['_shared', '_tests', '_fixtures', 'tests']);

function parseConfigFunctions(configText: string): string[] {
  const names: string[] = [];
  const re = /^\[functions\.([a-zA-Z0-9_-]+)\]/gm;
  let match: RegExpExecArray | null;
  while ((match = re.exec(configText)) !== null) {
    names.push(match[1]);
  }
  return names;
}

function listDiskFunctions(dir: string): string[] {
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir, { withFileTypes: true })
    .filter(d => d.isDirectory())
    .map(d => d.name)
    .filter(name => !NON_FUNCTION_DIRS.has(name) && !name.startsWith('.'))
    .filter(name => {
      const indexTs = path.join(dir, name, 'index.ts');
      return fs.existsSync(indexTs);
    });
}

function main(): void {
  if (!fs.existsSync(CONFIG_PATH)) {
    console.error(`❌ Missing ${CONFIG_PATH}`);
    process.exit(1);
  }

  const configText = fs.readFileSync(CONFIG_PATH, 'utf8');
  const configFunctions = new Set(parseConfigFunctions(configText));
  const diskFunctions = new Set(listDiskFunctions(FUNCTIONS_DIR));
  const allowlist = new Set(Object.keys(EXTERNAL_DEPLOY_ALLOWLIST));

  const inConfigNotOnDisk: string[] = [];
  for (const name of configFunctions) {
    if (!diskFunctions.has(name) && !allowlist.has(name)) {
      inConfigNotOnDisk.push(name);
    }
  }

  if (inConfigNotOnDisk.length > 0) {
    console.error('❌ Functions declared in config.toml but missing on disk:');
    for (const name of inConfigNotOnDisk) {
      console.error(`   - [functions.${name}]  (expected supabase/functions/${name}/index.ts)`);
    }
    console.error(
      '\n   Fix: either implement the function, remove the config entry, or add to EXTERNAL_DEPLOY_ALLOWLIST with justification.',
    );
    process.exit(1);
  }

  console.log(
    `✅ Edge function parity verified: all ${configFunctions.size} config.toml entries have implementations on disk (${diskFunctions.size} total functions).`,
  );
}

main();
