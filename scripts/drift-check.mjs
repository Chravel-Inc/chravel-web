#!/usr/bin/env node
// Unified drift-control entry point:  npm run drift:check
//
// Orchestrates the repository's deterministic drift/parity checks behind one
// command. Read-only by default. Distinguishes three outcomes so it never
// falsely claims parity when it could not actually compare:
//   PASS  — the two representations agree
//   FAIL  — confirmed drift (exit 1)
//   SKIP  — an EXTERNAL comparison whose credentials/secrets are unavailable
//           (e.g. Stream dashboard, live env) — reported, never counted as pass
//
// Each check names its canonical source of truth. The one check that
// regenerates files (permission matrix) is wrapped so any file it dirties that
// was clean beforehand is restored — the orchestrator leaves the tree as it
// found it.
//
// Flags: --json (machine-readable summary), --skip-external (force-skip creds).

import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(__dirname, '..');

const JSON_OUT = process.argv.includes('--json');
const FORCE_SKIP_EXTERNAL = process.argv.includes('--skip-external');

const hasEnv = (...names) => names.some(n => (process.env[n] || '').trim().length > 0);

const CHECKS = [
  {
    id: 'schema-types',
    title: 'Supabase schema ↔ generated types',
    sot: 'src/integrations/supabase/types.ts (generated)',
    cmd: ['npx', 'tsx', 'scripts/check-schema-drift.ts'],
  },
  {
    id: 'migrations',
    title: 'Migration integrity (duplicate timestamps / naming)',
    sot: 'supabase/migrations/ (forward-only history)',
    cmd: ['node', 'scripts/drift/check-migration-drift.mjs'],
  },
  {
    id: 'edge-functions',
    title: 'Edge function ↔ config.toml auth parity',
    sot: 'supabase/config.toml',
    cmd: ['node', 'scripts/drift/check-edge-function-parity.mjs'],
  },
  {
    id: 'env-coverage',
    title: 'Edge Deno.env vars documented',
    sot: '.env.example / .env.production.example',
    cmd: ['npx', 'tsx', 'scripts/check-env-coverage.ts'],
  },
  {
    id: 'permission-matrix',
    title: 'Permission matrix (frontend ↔ edge ↔ SQL)',
    sot: 'config/permission-matrix.json',
    cmd: ['node', 'scripts/check-permission-matrix-drift.mjs'],
    restoreIfDirtied: [
      'src/types/permissionMatrix.generated.ts',
      'supabase/functions/_shared/permissionMatrix.generated.ts',
      'supabase/sql/permission_matrix_allows.generated.sql',
    ],
  },
  {
    id: 'dal-wrappers',
    title: 'Duplicate service-wrapper (DAL boundary)',
    sot: 'src/services/dal/',
    cmd: ['bash', 'scripts/check-duplicate-service-wrappers.sh'],
  },
  {
    id: 'iap-parity',
    title: 'IAP/billing parity (code ↔ ASC ↔ Play)',
    sot: 'src/billing/config.ts + store product manifests',
    cmd: ['node', 'scripts/validate-iap-parity.mjs'],
  },
  {
    id: 'stream-parity',
    title: 'Stream config parity (frontend ↔ edge ↔ dashboard)',
    sot: 'Stream dashboard + Supabase secrets',
    cmd: ['node', 'scripts/check-stream-config-parity.cjs'],
    external: () =>
      hasEnv(
        'VITE_STREAM_API_KEY',
        'FRONTEND_VITE_STREAM_API_KEY',
        'SUPABASE_STREAM_API_KEY',
        'STREAM_API_KEY',
      ),
    externalHint: 'set Stream env (SUPABASE_STREAM_API_SECRET, STREAM_DASHBOARD_WEBHOOK_SECRET, …)',
  },
  {
    id: 'env-presence',
    title: 'Required environment variables present',
    sot: 'scripts/validate-env.ts manifest',
    cmd: ['npx', 'tsx', 'scripts/validate-env.ts', '--ci'],
    external: () => hasEnv('VITE_SUPABASE_URL', 'FRONTEND_VITE_SUPABASE_URL'),
    externalHint: 'provide the VITE_* frontend env (usually only set in CI/Vercel)',
  },
];

function gitClean(file) {
  const r = spawnSync('git', ['status', '--porcelain', '--', file], {
    cwd: repoRoot,
    encoding: 'utf8',
  });
  return r.status === 0 && r.stdout.trim() === '';
}

function runCheck(check) {
  if (check.external) {
    if (FORCE_SKIP_EXTERNAL || !check.external()) {
      return { status: 'SKIP', reason: check.externalHint || 'external credentials unavailable' };
    }
  }

  const cleanBefore = (check.restoreIfDirtied || []).filter(gitClean);
  const [bin, ...args] = check.cmd;
  const r = spawnSync(bin, args, { cwd: repoRoot, encoding: 'utf8' });
  // Restore any file this check dirtied that was clean before (stay read-only).
  for (const file of cleanBefore) {
    if (!gitClean(file)) {
      spawnSync('git', ['checkout', '--', file], { cwd: repoRoot });
    }
  }
  const output = `${r.stdout || ''}${r.stderr || ''}`.trim();
  return { status: r.status === 0 ? 'PASS' : 'FAIL', output, code: r.status };
}

const results = [];
for (const check of CHECKS) {
  const res = runCheck(check);
  results.push({ ...check, ...res });
  const icon = res.status === 'PASS' ? '✅' : res.status === 'SKIP' ? '⏭️ ' : '❌';
  console.log(`${icon} ${check.title}`);
  console.log(`     source of truth: ${check.sot}`);
  if (res.status === 'SKIP') console.log(`     skipped: ${res.reason}`);
  if (res.status === 'FAIL' && res.output) {
    console.log(
      res.output
        .split('\n')
        .map(l => `     │ ${l}`)
        .join('\n'),
    );
  }
  console.log('');
}

const pass = results.filter(r => r.status === 'PASS').length;
const fail = results.filter(r => r.status === 'FAIL');
const skip = results.filter(r => r.status === 'SKIP');

console.log('─'.repeat(64));
console.log(
  `Drift check: ${pass} passed · ${fail.length} failed · ${skip.length} skipped (external)`,
);
if (skip.length) {
  console.log(
    `Skipped (not verified — credentials unavailable): ${skip.map(s => s.id).join(', ')}`,
  );
}
if (fail.length) {
  console.log(`FAILED: ${fail.map(f => f.id).join(', ')}`);
}

if (JSON_OUT) {
  console.log(
    JSON.stringify(
      {
        pass,
        fail: fail.map(f => f.id),
        skip: skip.map(s => s.id),
        results: results.map(r => ({ id: r.id, status: r.status })),
      },
      null,
      2,
    ),
  );
}

process.exit(fail.length > 0 ? 1 : 0);
