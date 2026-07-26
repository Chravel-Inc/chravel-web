#!/usr/bin/env node
/**
 * Render all UseCaseReel Instagram compositions (1080×1920).
 * Usage: node scripts/render-use-case-reels.mjs [scriptId...]
 * Default: all scripts.
 */
import { spawnSync } from 'node:child_process';
import { mkdirSync, copyFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const outDir = join(root, 'out', 'usecase-reels');
const artifactDir = '/opt/cursor/artifacts/use-case-reels';

const ALL_IDS = [
  'concierge',
  'weddings',
  'group-trips',
  'families',
  'sports',
  'touring',
  'conferences',
  'local-clubs',
  'faith',
  'business',
];

const ids = process.argv.slice(2).length ? process.argv.slice(2) : ALL_IDS;

mkdirSync(outDir, { recursive: true });
mkdirSync(artifactDir, { recursive: true });

let failed = 0;
for (const id of ids) {
  const composition = `UseCaseReel-${id}`;
  const outFile = join(outDir, `chravel-${id}-reel.mp4`);
  console.log(`\n▶ Rendering ${composition} → ${outFile}`);
  const result = spawnSync(
    'npx',
    [
      'remotion',
      'render',
      'src/index.ts',
      composition,
      outFile,
      '--codec=h264',
      '--crf=18',
      '--jpeg-quality=95',
      '--concurrency=2',
    ],
    { cwd: root, stdio: 'inherit', env: process.env },
  );
  if (result.status !== 0) {
    console.error(`✖ Failed: ${composition}`);
    failed += 1;
    continue;
  }
  const artifactPath = join(artifactDir, `chravel-${id}-reel.mp4`);
  copyFileSync(outFile, artifactPath);
  console.log(`✓ Copied to ${artifactPath}`);

  // Poster still at the turn scene (~frame 280)
  const poster = join(artifactDir, `chravel-${id}-reel-poster.jpg`);
  spawnSync(
    'npx',
    [
      'remotion',
      'still',
      'src/index.ts',
      composition,
      poster,
      '--frame=280',
      '--image-format=jpeg',
      '--jpeg-quality=90',
    ],
    { cwd: root, stdio: 'inherit', env: process.env },
  );
}

console.log(`\nDone. ${ids.length - failed}/${ids.length} succeeded.`);
if (!existsSync(join(outDir, `chravel-${ids[0]}-reel.mp4`)) && failed === ids.length) {
  process.exit(1);
}
process.exit(failed ? 1 : 0);
