#!/usr/bin/env node
/**
 * Short looping previews for the gallery page.
 *
 * The gallery has to be a single self-contained HTML file (artifact CSP blocks every
 * external host), so each clip is inlined as a data: URI. The 24 delivery encodes total
 * 82 MiB — ~113 MiB as base64 — which is far too large for one page. These 5-second
 * previews come to roughly 5 MiB total instead.
 *
 * Sampled from ~55% into each film, which lands in the resolution/payoff stretch. A
 * preview cut from the head would show three seconds of someone looking tired; from the
 * middle it shows the product and the brand.
 */
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';

const SRC = 'out/usecases-social';
const OUT = 'out/previews';

/** Seconds of preview per film. */
const CLIP = 5;
/** Fraction into the film to start from. */
const AT = 0.55;

const findBin = name => {
  const root = 'node_modules/@remotion';
  if (!existsSync(root)) return null;
  // The musl build will not exec on a glibc host — deprioritise it.
  const dirs = readdirSync(root)
    .filter(d => d.startsWith('compositor-'))
    .sort((a, b) => (a.includes('musl') ? 1 : 0) - (b.includes('musl') ? 1 : 0));
  for (const d of dirs) {
    const bin = path.join(root, d, name);
    if (existsSync(bin)) return bin;
  }
  return null;
};

const ffmpeg = process.env.FFMPEG || findBin('ffmpeg');
const ffprobe = process.env.FFPROBE || findBin('ffprobe');
if (!ffmpeg || !ffprobe) {
  console.error('ffmpeg/ffprobe not found. Set FFMPEG and FFPROBE.');
  process.exit(1);
}

if (!existsSync(SRC)) {
  console.error(`No encodes at ${SRC}. Run "npm run render:usecases:social" first.`);
  process.exit(1);
}

mkdirSync(OUT, { recursive: true });

const duration = file =>
  parseFloat(
    execFileSync(ffprobe, [
      '-v',
      'error',
      '-show_entries',
      'format=duration',
      '-of',
      'csv=p=0',
      file,
    ])
      .toString()
      .trim(),
  );

const files = readdirSync(SRC)
  .filter(f => f.endsWith('.mp4'))
  .sort();
const mib = b => b / 1024 / 1024;

console.log(`Building ${files.length} preview(s)\n`);

let total = 0;
let failed = 0;

files.forEach((file, i) => {
  const from = path.join(SRC, file);
  const to = path.join(OUT, file);
  const start = Math.max(0, duration(from) * AT);

  process.stdout.write(`[${i + 1}/${files.length}] ${file.padEnd(50)}`);

  try {
    execFileSync(
      ffmpeg,
      [
        '-y',
        // -ss before -i seeks fast; re-encoding after means the cut is still frame-exact.
        '-ss',
        String(start.toFixed(2)),
        '-i',
        from,
        '-t',
        String(CLIP),
        '-c:v',
        'libx264',
        '-profile:v',
        'baseline',
        '-preset',
        'slow',
        '-crf',
        '33',
        // Long edge 480. -2 keeps the other axis even, which libx264 requires.
        '-vf',
        'scale=-2:480:force_original_aspect_ratio=decrease,scale=trunc(iw/2)*2:trunc(ih/2)*2',
        '-pix_fmt',
        'yuv420p',
        '-color_range',
        'tv',
        '-movflags',
        '+faststart',
        '-an',
        to,
      ],
      { stdio: ['ignore', 'ignore', 'pipe'] },
    );
    const size = statSync(to).size;
    total += size;
    console.log(`${(size / 1024).toFixed(0)} KB`);
  } catch (err) {
    console.log('FAILED');
    console.error(
      String(err.stderr ?? err)
        .split('\n')
        .slice(-3)
        .join('\n'),
    );
    failed++;
  }
});

console.log(
  `\nDone. ${files.length - failed} previews, ${mib(total).toFixed(1)} MiB total ` +
    `(~${(mib(total) * 1.37).toFixed(1)} MiB as base64).`,
);
process.exit(failed > 0 ? 1 : 0);
