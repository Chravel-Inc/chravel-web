#!/usr/bin/env node
/**
 * CI guardrail: fail if any known founder / admin email literal reappears in
 * source. The roster lives only in the SUPER_ADMIN_BOOTSTRAP_EMAILS secret and
 * the `public.super_admins` DB table.
 *
 * Extend DENYLIST when new admin emails are added to the secret.
 */
const { execSync } = require('node:child_process');

const DENYLIST = [
  'ccamechi@gmail.com',
  'christian@chravelapp.com',
  'phil@philquist.com',
  'darren.hartgee@gmail.com',
];

const IGNORE_GLOBS = [
  '!node_modules',
  '!scripts/qa/check-no-hardcoded-admin-emails.cjs',
  '!.git',
  '!dist',
  '!build',
];

let failed = false;
for (const email of DENYLIST) {
  const args = [
    'rg',
    '-n',
    '--fixed-strings',
    email,
    ...IGNORE_GLOBS.flatMap(g => ['-g', g.slice(1) === g ? g : g]),
  ];
  try {
    const out = execSync(
      `rg -n --fixed-strings ${JSON.stringify(email)} ${IGNORE_GLOBS.map(g => `-g '${g}'`).join(' ')}`,
      { stdio: ['ignore', 'pipe', 'ignore'], encoding: 'utf8' },
    );
    if (out.trim()) {
      console.error(`\n✗ Hardcoded admin email leaked into source: ${email}`);
      console.error(out);
      failed = true;
    }
  } catch (e) {
    // rg exits 1 when no matches — that's the pass case.
    if (e.status !== 1) {
      console.error(`ripgrep error scanning for ${email}:`, e.message);
      failed = true;
    }
  }
}

if (failed) {
  console.error(
    '\nAdmin emails must live only in the SUPER_ADMIN_BOOTSTRAP_EMAILS secret and the public.super_admins DB table.',
  );
  console.error('See docs/ops/super-admin-bootstrap.md.\n');
  process.exit(1);
}

console.log('✓ No hardcoded admin emails found.');
