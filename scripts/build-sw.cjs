const fs = require('fs');
const path = require('path');
const { injectManifest, copyWorkboxLibraries } = require('workbox-build');

const rootDir = path.resolve(__dirname, '..');
const distDir = path.join(rootDir, 'dist');

async function buildServiceWorker() {
  const { count, size, warnings } = await injectManifest({
    swSrc: path.join(rootDir, 'public', 'sw.js'),
    swDest: path.join(distDir, 'sw.js'),
    globDirectory: distDir,
    globPatterns: ['**/*.{html,js,css,woff2,woff,ttf,otf,eot,png,jpg,jpeg,svg,gif,webp,ico,json}'],
    maximumFileSizeToCacheInBytes: 8 * 1024 * 1024,
  });

  warnings.forEach(warning => console.warn('[SW]', warning));

  // copyWorkboxLibraries emits dist/workbox-vX.Y.Z/workbox-sw.js — there is no
  // /workbox-sw.js at the site root, so the placeholder importScripts path in
  // public/sw.js must be rewritten to the real versioned location or the SW
  // aborts install on its first line.
  const workboxDir = await copyWorkboxLibraries(distDir);
  const swDest = path.join(distDir, 'sw.js');
  const swSource = fs.readFileSync(swDest, 'utf8');
  const rewritten = swSource.replace(
    "importScripts('/workbox-sw.js')",
    `importScripts('/${workboxDir}/workbox-sw.js')`,
  );
  if (rewritten === swSource) {
    throw new Error(
      "[SW] Could not find importScripts('/workbox-sw.js') placeholder in dist/sw.js",
    );
  }
  fs.writeFileSync(swDest, rewritten);

  console.log(`[SW] Precached ${count} files (${size} bytes); workbox runtime at /${workboxDir}/`);
}

buildServiceWorker().catch(error => {
  console.error('[SW] Build failed:', error);
  process.exit(1);
});
