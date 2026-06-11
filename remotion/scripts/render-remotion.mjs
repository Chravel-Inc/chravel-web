import { bundle } from '@remotion/bundler';
import { renderMedia, selectComposition, openBrowser } from '@remotion/renderer';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const outArg = process.argv[2] || '/mnt/documents/chravel-homepage-demo-60.mp4';
const compId = process.argv[3] || 'HomepageHeroDemo60';

console.log(`[render] bundling…`);
const bundled = await bundle({
  entryPoint: path.resolve(__dirname, '../src/index.ts'),
  webpackOverride: (c) => c,
});

console.log(`[render] launching chromium…`);
const browser = await openBrowser('chrome', {
  browserExecutable: process.env.PUPPETEER_EXECUTABLE_PATH ?? '/bin/chromium',
  chromiumOptions: {
    args: ['--no-sandbox', '--disable-gpu', '--disable-dev-shm-usage'],
  },
  chromeMode: 'chrome-for-testing',
});

console.log(`[render] selecting composition ${compId}…`);
const composition = await selectComposition({
  serveUrl: bundled,
  id: compId,
  puppeteerInstance: browser,
});

console.log(`[render] rendering ${composition.durationInFrames} frames -> ${outArg}`);
await renderMedia({
  composition,
  serveUrl: bundled,
  codec: 'h264',
  outputLocation: outArg,
  puppeteerInstance: browser,
  muted: true,
  concurrency: 2,
  crf: 23,
  onProgress: ({ progress }) => {
    if (Math.round(progress * 100) % 10 === 0) {
      process.stdout.write(`  ${Math.round(progress * 100)}%\n`);
    }
  },
});

await browser.close({ silent: false });
console.log(`[render] done -> ${outArg}`);
