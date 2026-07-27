#!/usr/bin/env node
/**
 * Delivery-grade encodes of the use-case films.
 *
 * The renders in out/usecases are CRF 18 masters — visually lossless, and the right
 * source to re-encode from later. They are also large: the 75s anthem lands at ~51 MiB,
 * over the upload ceilings that Instagram, TikTok, X and most chat tools enforce.
 *
 * This pass transcodes each master to a capped-bitrate delivery copy in
 * out/usecases-social. It reads the finished MP4 rather than re-rendering, so it takes
 * seconds instead of repeating a ~20-minute render, and the masters stay untouched.
 *
 * Usage:
 *   node scripts/encode-social.mjs            # all masters
 *   node scripts/encode-social.mjs Anthem     # filename substring filter
 */
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';

const SRC = 'out/usecases';
const OUT = 'out/usecases-social';

/** Most platforms and upload endpoints cap around here. */
const LIMIT_MIB = 30;

const findFfmpeg = () => {
  if (process.env.FFMPEG) return process.env.FFMPEG;
  const root = 'node_modules/@remotion';
  if (!existsSync(root)) return null;
  // Prefer the gnu build; the musl binary will not exec on a glibc host.
  const dirs = readdirSync(root)
    .filter(d => d.startsWith('compositor-'))
    .sort((a, b) => (a.includes('musl') ? 1 : 0) - (b.includes('musl') ? 1 : 0));
  for (const d of dirs) {
    const bin = path.join(root, d, 'ffmpeg');
    if (existsSync(bin)) return bin;
  }
  return null;
};

const ffmpeg = findFfmpeg();
if (!ffmpeg) {
  console.error('No ffmpeg found. Set FFMPEG=/path/to/ffmpeg.');
  process.exit(1);
}

if (!existsSync(SRC)) {
  console.error(`No masters at ${SRC}. Run "npm run render:usecases" first.`);
  process.exit(1);
}

mkdirSync(OUT, { recursive: true });

const filter = process.argv[2];
const masters = readdirSync(SRC)
  .filter(f => f.endsWith('.mp4'))
  .filter(f => !filter || f.includes(filter))
  .sort();

if (masters.length === 0) {
  console.error(filter ? `No masters matched "${filter}".` : `No .mp4 files in ${SRC}.`);
  process.exit(1);
}

const mib = bytes => bytes / 1024 / 1024;

console.log(`Encoding ${masters.length} file(s) with ${ffmpeg}\n`);

let failed = 0;
let oversize = 0;

masters.forEach((file, i) => {
  const from = path.join(SRC, file);
  const to = path.join(OUT, file);
  const before = mib(statSync(from).size);

  process.stdout.write(
    `[${i + 1}/${masters.length}] ${file.padEnd(50)} ${before.toFixed(1)} MiB → `,
  );

  try {
    execFileSync(
      ffmpeg,
      [
        '-y',
        '-i',
        from,
        '-c:v',
        'libx264',
        '-profile:v',
        'high',
        '-preset',
        'slow',
        // CRF 24 with a hard 3 Mbps ceiling: at 75s that lands well under the limit,
        // and on this mostly-graphic content the difference from CRF 18 is negligible.
        '-crf',
        '24',
        '-maxrate',
        '3M',
        '-bufsize',
        '6M',
        // Required by some mobile and Safari decoders; 4:2:0 8-bit is the safe baseline.
        '-pix_fmt',
        'yuv420p',
        // Force limited (TV) range. Without this ffmpeg inherits the master's full range
        // and tags the output yuvj420p, which players and re-encoders disagree about —
        // the failure mode is lifted blacks, and this whole design is deep black and gold.
        '-vf',
        'scale=out_range=tv',
        '-color_range',
        'tv',
        '-colorspace',
        'bt709',
        '-color_primaries',
        'bt709',
        '-color_trc',
        'bt709',
        // Move the moov atom to the front so the file starts playing before it is
        // fully downloaded.
        '-movflags',
        '+faststart',
        '-an',
        to,
      ],
      { stdio: ['ignore', 'ignore', 'pipe'] },
    );

    const after = mib(statSync(to).size);
    const flag = after > LIMIT_MIB ? `  ⚠ still over ${LIMIT_MIB} MiB` : '';
    if (after > LIMIT_MIB) oversize++;
    console.log(`${after.toFixed(1)} MiB  (-${(100 - (after / before) * 100).toFixed(0)}%)${flag}`);
  } catch (err) {
    console.log('FAILED');
    console.error(
      String(err.stderr ?? err)
        .split('\n')
        .slice(-4)
        .join('\n'),
    );
    failed++;
  }
});

console.log(
  `\nDone. ${masters.length - failed} encoded, ${failed} failed` +
    (oversize > 0 ? `, ${oversize} still over ${LIMIT_MIB} MiB` : '') +
    `. Output: ${OUT}/`,
);
console.log('Masters in out/usecases are unchanged — use those for archival and re-encodes.');

process.exit(failed > 0 ? 1 : 0);
