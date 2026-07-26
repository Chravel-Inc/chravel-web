#!/usr/bin/env node
/**
 * Renders every use-case brand film: 11 vertical + 11 square + 2 anthem cuts.
 *
 * Usage:
 *   node scripts/render-usecases.mjs                  # all 24
 *   node scripts/render-usecases.mjs vertical         # one format
 *   node scripts/render-usecases.mjs UC-02            # id prefix filter
 *
 * Browser: Remotion needs old-headless Chrome, which modern Chrome removed. This
 * resolves a chrome-headless-shell if one is already on the machine (Playwright ships
 * one) and otherwise lets Remotion download its own. Override with CHROME_SHELL.
 */
import { execFileSync } from 'node:child_process';
import { copyFileSync, existsSync, mkdirSync, readdirSync } from 'node:fs';
import path from 'node:path';

const OUT = 'out/usecases';
mkdirSync(OUT, { recursive: true });

/**
 * Sync brand photography into public/plates/stills.
 *
 * These are the fallback plates every composition renders against. They already live in
 * the app at src/assets/trip-covers, so they are copied at render time rather than
 * committed twice — 4MB of duplicate binaries in git would bloat every clone.
 */
const syncStills = () => {
  const dest = 'public/plates/stills';
  mkdirSync(dest, { recursive: true });
  const sources = [
    { dir: '../src/assets/trip-covers', match: f => /\.(jpg|webp|png)$/i.test(f) },
    { dir: '../src/assets', match: f => f === 'iu-memorial-stadium-cover.jpg' },
  ];
  let n = 0;
  for (const { dir, match } of sources) {
    if (!existsSync(dir)) continue;
    for (const file of readdirSync(dir).filter(match)) {
      copyFileSync(path.join(dir, file), path.join(dest, file));
      n++;
    }
  }
  console.log(`Synced ${n} still(s) into ${dest}`);
};

syncStills();

const findHeadlessShell = () => {
  if (process.env.CHROME_SHELL) return process.env.CHROME_SHELL;
  const root = process.env.PLAYWRIGHT_BROWSERS_PATH || '/opt/pw-browsers';
  if (!existsSync(root)) return null;
  const dir = readdirSync(root).find(d => d.startsWith('chromium_headless_shell'));
  if (!dir) return null;
  const bin = path.join(root, dir, 'chrome-linux', 'headless_shell');
  return existsSync(bin) ? bin : null;
};

const shell = findHeadlessShell();
if (shell) console.log(`Using headless shell: ${shell}`);
else console.log('No local headless shell found — Remotion will fetch its own.');

const filter = process.argv[2];

// Kept in sync with src/usecases/scenarios.ts + register.tsx.
const SLUGS = [
  'travel-concierge-client-portal',
  'wedding-guest-coordination-app',
  'group-travel-planning-app',
  'family-organization-app',
  'sports-team-travel-coordination',
  'music-tour-coordination',
  'conference-event-management-app',
  'local-clubs-meetups',
  'church-group-trip-coordination',
  'business-travel-coordination',
  'fraternities-sororities',
];

const ids = [];
SLUGS.forEach((slug, i) => {
  const n = String(i + 1).padStart(2, '0');
  ids.push(`UC-${n}-${slug}-vertical`, `UC-${n}-${slug}-square`);
});
ids.push('UC-Anthem-wide', 'UC-Anthem-vertical');

const targets = filter ? ids.filter(id => id.includes(filter)) : ids;
if (targets.length === 0) {
  console.error(`No compositions matched "${filter}".`);
  process.exit(1);
}

console.log(`Rendering ${targets.length} composition(s)…\n`);

let failed = 0;
targets.forEach((id, i) => {
  const outFile = path.join(OUT, `${id}.mp4`);
  console.log(`[${i + 1}/${targets.length}] ${id}`);
  const args = [
    'remotion',
    'render',
    'src/index.ts',
    id,
    outFile,
    '--codec=h264',
    // CRF 18 is visually lossless at these bitrates and survives Instagram's re-encode.
    '--crf=18',
    '--log=error',
  ];
  if (shell) args.push(`--browser-executable=${shell}`);

  try {
    execFileSync('npx', args, { stdio: 'inherit' });
  } catch {
    console.error(`  FAILED: ${id}`);
    failed++;
  }
});

console.log(`\nDone. ${targets.length - failed} succeeded, ${failed} failed. Output: ${OUT}/`);
process.exit(failed > 0 ? 1 : 0);
