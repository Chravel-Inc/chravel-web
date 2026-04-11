import { bundle } from '@remotion/bundler';
import { renderMedia, selectComposition, openBrowser } from '@remotion/renderer';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const compositionId = globalThis.process?.argv?.[2] || 'ProductLaunchV2';
const outputPath = globalThis.process?.argv?.[3] || '/mnt/documents/chravel-product-launch-v2.mp4';

globalThis.console?.log(`Bundling entry point...`);
const bundled = await bundle({
  entryPoint: path.resolve(__dirname, '../src/index.ts'),
  webpackOverride: config => config,
});

globalThis.console?.log(`Opening browser...`);
const browser = await openBrowser('chrome', {
  browserExecutable: globalThis.process?.env.PUPPETEER_EXECUTABLE_PATH ?? '/bin/chromium',
  chromiumOptions: {
    args: ['--no-sandbox', '--disable-gpu', '--disable-dev-shm-usage'],
  },
  chromeMode: 'chrome-for-testing',
});

globalThis.console?.log(`Selecting composition "${compositionId}"...`);
const composition = await selectComposition({
  serveUrl: bundled,
  id: compositionId,
  puppeteerInstance: browser,
});

globalThis.console?.log(
  `Rendering ${composition.durationInFrames} frames (${composition.durationInFrames / composition.fps}s)...`,
);
await renderMedia({
  composition,
  serveUrl: bundled,
  codec: 'h264',
  outputLocation: outputPath,
  puppeteerInstance: browser,
  muted: true,
  concurrency: 1,
});

globalThis.console?.log(`Done! Output: ${outputPath}`);
await browser.close({ silent: false });
