#!/usr/bin/env node
/**
 * Upload production sourcemaps to Sentry, then DELETE them from dist/ so they
 * are never deployed publicly. Inert unless all three env vars are present:
 *   SENTRY_AUTH_TOKEN, SENTRY_ORG, SENTRY_PROJECT
 * (vite.config.ts only emits hidden maps when SENTRY_AUTH_TOKEN is set, so
 * without the token this script finds nothing and exits 0.)
 *
 * Wire-up (owner, Vercel project settings): add the three env vars and set the
 * build command to `npm run build && node scripts/upload-sourcemaps.cjs`.
 * Uses npx @sentry/cli — no permanent dependency added.
 */
const { execSync } = require('child_process');
const { existsSync, readdirSync, unlinkSync, statSync } = require('fs');
const path = require('path');

const distDir = path.resolve(__dirname, '..', 'dist');

function findMaps(dir) {
  const out = [];
  for (const entry of readdirSync(dir)) {
    const full = path.join(dir, entry);
    if (statSync(full).isDirectory()) out.push(...findMaps(full));
    else if (entry.endsWith('.js.map')) out.push(full);
  }
  return out;
}

const { SENTRY_AUTH_TOKEN, SENTRY_ORG, SENTRY_PROJECT } = process.env;

if (!SENTRY_AUTH_TOKEN || !SENTRY_ORG || !SENTRY_PROJECT) {
  console.log('[sourcemaps] Sentry env not configured — skipping upload (nothing emitted).');
  process.exit(0);
}

if (!existsSync(distDir)) {
  console.error('[sourcemaps] dist/ not found — run the build first.');
  process.exit(1);
}

const maps = findMaps(distDir);
if (maps.length === 0) {
  console.log('[sourcemaps] no .js.map files in dist/ — nothing to upload.');
  process.exit(0);
}

const release =
  process.env.VERCEL_GIT_COMMIT_SHA || process.env.GITHUB_SHA || `local-${Date.now()}`;

try {
  execSync(`npx --yes @sentry/cli sourcemaps upload --release "${release}" "${distDir}"`, {
    stdio: 'inherit',
    env: process.env,
  });
} catch (error) {
  // Upload failure must not fail the deploy — but the maps must still never
  // ship. Fall through to deletion either way.
  console.error('[sourcemaps] upload failed:', error.message);
}

for (const map of maps) unlinkSync(map);
console.log(
  `[sourcemaps] uploaded ${maps.length} map(s) for release ${release}; deleted from dist/.`,
);
