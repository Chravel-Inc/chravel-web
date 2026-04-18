/**
 * App Store Screenshot Capture Script
 *
 * Deterministic Playwright-based pipeline that captures fully-hydrated screenshots
 * from the Chravel app in demo mode. Supports iPhone 6.7" and iPad Pro 12.9".
 *
 * Run:
 *   npm run screenshots:appstore                    # all devices
 *   npm run screenshots:appstore -- --device=iphone # iPhone only
 *   npm run screenshots:appstore -- --device=ipad   # iPad only
 *   npm run screenshots:appstore -- --only=03-calendar-itinerary  # single shot
 *
 * Prerequisites:
 *   1. Chromium available (npx playwright install chromium, or system Chromium)
 *   2. App built and preview server running, OR network access to chravel.app
 *      Default: http://localhost:4173 (start with: npm run preview -- --port 4173)
 *
 * Environment:
 *   SCREENSHOT_BASE_URL  — override base URL (default: http://localhost:4173)
 *   CHROMIUM_PATH        — override Chromium binary path
 */

import { chromium, type Page, type Browser } from 'playwright';
import * as fs from 'fs';
import * as path from 'path';

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

const BASE_URL = process.env.SCREENSHOT_BASE_URL || 'http://localhost:4173';
const OUTPUT_BASE = path.join(process.cwd(), 'appstore', 'screenshots');
const REPORT_PATH = path.join(OUTPUT_BASE, 'capture-report.json');

// Chromium binary discovery: env > well-known paths > Playwright default
const CHROMIUM_CANDIDATES = [
  process.env.CHROMIUM_PATH,
  '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
  '/opt/pw-browsers/chromium-1208/chrome-linux/chrome',
].filter(Boolean) as string[];

function findChromium(): string | undefined {
  for (const p of CHROMIUM_CANDIDATES) {
    if (fs.existsSync(p)) return p;
  }
  return undefined;
}

// Device viewport specs (App Store required resolutions)
const IPHONE_67 = { width: 1290, height: 2796 };
const IPAD_129 = { width: 2048, height: 2732 };

// ---------------------------------------------------------------------------
// Screenshot definitions with trip diversity
// ---------------------------------------------------------------------------

interface ShotDef {
  name: string;
  tripPath: string;
  tab: string | null;
  fallbackTrips?: string[]; // alternate trip paths if primary has weak data
}

const IPHONE_SHOTS: ShotDef[] = [
  { name: '01-home-dashboard', tripPath: '/demo', tab: null },
  { name: '02-trip-chat', tripPath: '/trip/1', tab: 'chat' },
  {
    name: '03-calendar-itinerary',
    tripPath: '/trip/5',
    tab: 'calendar',
    fallbackTrips: ['/trip/2', '/trip/8'],
  },
  {
    name: '04-ai-concierge',
    tripPath: '/trip/8',
    tab: 'concierge',
    fallbackTrips: ['/trip/4', '/trip/2'],
  },
  {
    name: '05-expense-splitting',
    tripPath: '/trip/4',
    tab: 'payments',
    fallbackTrips: ['/trip/1', '/trip/8'],
  },
  {
    name: '06-maps-places',
    tripPath: '/trip/3',
    tab: 'places',
    fallbackTrips: ['/trip/2', '/trip/5'],
  },
  {
    name: '07-media-gallery',
    tripPath: '/trip/5',
    tab: 'media',
    fallbackTrips: ['/trip/1', '/trip/6'],
  },
  {
    name: '08-polls-voting',
    tripPath: '/trip/6',
    tab: 'polls',
    fallbackTrips: ['/trip/3', '/trip/4'],
  },
];

const IPAD_SHOTS: ShotDef[] = [
  { name: '01-home-dashboard', tripPath: '/demo', tab: null },
  { name: '02-trip-chat', tripPath: '/trip/4', tab: 'chat', fallbackTrips: ['/trip/1', '/trip/2'] },
  {
    name: '03-calendar-itinerary',
    tripPath: '/trip/8',
    tab: 'calendar',
    fallbackTrips: ['/trip/2', '/trip/4'],
  },
  {
    name: '04-maps-places',
    tripPath: '/trip/2',
    tab: 'places',
    fallbackTrips: ['/trip/3', '/trip/5'],
  },
];

// ---------------------------------------------------------------------------
// Tab-specific readiness selectors
// Each tab must have at least one of these selectors visible (with real content)
// before the screenshot is considered ready.
// ---------------------------------------------------------------------------

const TAB_READY_SELECTORS: Record<string, string[]> = {
  chat: [
    '[class*="message"]', // chat message elements
    '[class*="chat-bubble"]',
    '[data-message-id]',
  ],
  calendar: [
    '[class*="calendar-grid"]',
    '[class*="fc-"]', // FullCalendar
    'table', // calendar table grid
    '[class*="event-card"]',
  ],
  concierge: [
    '[class*="concierge"]',
    '[class*="ai-message"]',
    'textarea', // concierge input area
    '[class*="chat-input"]',
  ],
  payments: ['[class*="payment"]', '[class*="expense"]', '[class*="split"]', '[class*="balance"]'],
  places: ['[class*="place-card"]', '[class*="places"]', '[class*="map"]', '[class*="MapView"]'],
  media: ['[class*="media"]', '[class*="gallery"]', '[class*="upload"]', 'img[src*="supabase"]'],
  polls: ['[class*="poll"]', '[class*="vote"]', '[class*="comment"]', '[class*="CommentsWall"]'],
};

// ---------------------------------------------------------------------------
// Readiness helpers
// ---------------------------------------------------------------------------

/** Wait until no skeleton/loading indicators are visible */
async function waitForNoSkeletons(page: Page, timeout = 15000): Promise<void> {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    const hasLoading = await page.evaluate(() => {
      // Check for animate-pulse (Tailwind skeleton class)
      const pulseEls = document.querySelectorAll('.animate-pulse');
      // Check for spinner
      const spinnerEls = document.querySelectorAll('.animate-spin, [class*="spinner"]');
      // Check for "Loading..." text in a small container (not in body text generally)
      const loadingLabels = document.querySelectorAll('p, span, div');
      let hasLoadingText = false;
      loadingLabels.forEach(el => {
        const text = el.textContent?.trim();
        if (text === 'Loading...' || text === 'Loading') {
          // Only count if the element is visible and small (a loading indicator, not content)
          const rect = el.getBoundingClientRect();
          if (rect.width > 0 && rect.height > 0 && rect.height < 100) {
            hasLoadingText = true;
          }
        }
      });
      return pulseEls.length > 0 || spinnerEls.length > 0 || hasLoadingText;
    });

    if (!hasLoading) return;
    await page.waitForTimeout(300);
  }
  // Don't throw — log warning, some pages may have persistent subtle animations
  console.warn('    ⚠ Skeleton/loading indicators still present after timeout');
}

/** Wait for the tab button to show as active via data-active attribute */
async function waitForTabActive(page: Page, tabId: string, timeout = 10000): Promise<boolean> {
  try {
    await page.waitForSelector(`[data-tab="${tabId}"][data-active="true"]`, {
      state: 'visible',
      timeout,
    });
    return true;
  } catch {
    // Fallback: check if any button with matching text has the active styling
    try {
      const label = tabId.charAt(0).toUpperCase() + tabId.slice(1);
      await page.waitForSelector(`button:has-text("${label}")`, {
        state: 'visible',
        timeout: 3000,
      });
      return true;
    } catch {
      return false;
    }
  }
}

/** Wait for tab-specific content to be rendered */
async function waitForTabContent(page: Page, tabId: string, timeout = 20000): Promise<boolean> {
  const selectors = TAB_READY_SELECTORS[tabId];
  if (!selectors || selectors.length === 0) return true;

  const start = Date.now();
  while (Date.now() - start < timeout) {
    for (const sel of selectors) {
      try {
        const count = await page.locator(sel).count();
        if (count > 0) {
          const visible = await page.locator(sel).first().isVisible();
          if (visible) return true;
        }
      } catch {
        // selector may not match, continue
      }
    }

    // Also check body text for tab-indicative content as a fallback
    const bodyText = await page.locator('body').textContent();
    if (
      tabId === 'calendar' &&
      (bodyText?.includes('Sun') || bodyText?.includes('Mon') || bodyText?.includes('Add Event'))
    )
      return true;
    if (
      tabId === 'concierge' &&
      (bodyText?.includes('Ask') ||
        bodyText?.includes('concierge') ||
        bodyText?.includes('What can I help'))
    )
      return true;
    if (
      tabId === 'payments' &&
      (bodyText?.includes('Balance') ||
        bodyText?.includes('expense') ||
        bodyText?.includes('payment') ||
        bodyText?.includes('Add Expense'))
    )
      return true;
    if (
      tabId === 'places' &&
      (bodyText?.includes('place') || bodyText?.includes('Add Place') || bodyText?.includes('map'))
    )
      return true;
    if (
      tabId === 'media' &&
      (bodyText?.includes('Upload') ||
        bodyText?.includes('photo') ||
        bodyText?.includes('media') ||
        bodyText?.includes('album'))
    )
      return true;
    if (
      tabId === 'polls' &&
      (bodyText?.includes('poll') ||
        bodyText?.includes('vote') ||
        bodyText?.includes('Create Poll'))
    )
      return true;
    if (tabId === 'chat' && (bodyText?.includes('message') || bodyText?.includes('Type a')))
      return true;

    await page.waitForTimeout(500);
  }
  return false;
}

/**
 * Wait for a visible trip-cover context (hero cover on trip detail, or trip card cover on dashboard)
 * and ensure matched image(s) have finished loading/decoding before capture.
 */
async function waitForCoverPhotoContext(page: Page, timeout = 15000): Promise<boolean> {
  const started = Date.now();

  while (Date.now() - started < timeout) {
    const status = await page.evaluate(() => {
      const inViewport = (el: Element): boolean => {
        const rect = el.getBoundingClientRect();
        return (
          rect.width > 0 && rect.height > 0 && rect.bottom > 0 && rect.top < window.innerHeight
        );
      };

      const loaded = (img: HTMLImageElement): boolean =>
        Boolean(img.src) && img.complete && img.naturalWidth > 0 && img.naturalHeight > 0;

      // Trip detail: hero cover image in TripHeader
      const heroImgs = Array.from(
        document.querySelectorAll<HTMLImageElement>('[data-trip-section="hero"] img'),
      );
      const heroVisibleLoaded = heroImgs.some(img => inViewport(img) && loaded(img));
      if (heroVisibleLoaded) return { ok: true, kind: 'hero' };

      // Dashboard: trip card thumbnails/covers
      const dashboardCovers = Array.from(
        document.querySelectorAll<HTMLImageElement>(
          'img[alt*="trip" i], img[alt*="cover" i], [data-testid*="trip"] img, [class*="TripCard"] img, [class*="trip-card"] img',
        ),
      );
      const dashboardVisibleLoaded = dashboardCovers.some(img => inViewport(img) && loaded(img));
      if (dashboardVisibleLoaded) return { ok: true, kind: 'dashboard' };

      return { ok: false, kind: 'none' };
    });

    if (status.ok) {
      return true;
    }

    await page.waitForTimeout(250);
  }

  return false;
}

/**
 * Full readiness pipeline for a tab screenshot:
 * 1. Click the tab
 * 2. Verify tab is active
 * 3. Wait for skeletons to clear
 * 4. Wait for tab-specific content
 * 5. Micro-settle for font/image rendering
 */
async function navigateToTabAndWaitReady(page: Page, tabId: string): Promise<boolean> {
  // Click the tab via dispatchEvent — Playwright's native .click() is intercepted
  // by Radix TooltipTrigger asChild wrapper, preventing React's onClick from firing.
  const clicked = await page.evaluate((id: string) => {
    const btn = document.querySelector(`[data-tab="${id}"]`);
    if (!btn) return false;
    btn.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
    return true;
  }, tabId);

  if (!clicked) {
    console.error(`    ✗ Could not find tab button for "${tabId}"`);
    return false;
  }

  // Wait for tab to become active
  await page.waitForTimeout(500);
  const isActive = await waitForTabActive(page, tabId);
  if (!isActive) {
    console.warn(`    ⚠ Tab "${tabId}" may not be active (data-active check failed)`);
  }

  // Wait for skeletons/loading to clear
  await waitForNoSkeletons(page);

  // Wait for tab content to appear
  const hasContent = await waitForTabContent(page, tabId);
  if (!hasContent) {
    console.warn(`    ⚠ Tab "${tabId}" content readiness check timed out`);
    return false;
  }

  // Micro-settle for font/image rendering stabilization
  await page.waitForTimeout(800);
  return true;
}

// ---------------------------------------------------------------------------
// Navigation helpers
// ---------------------------------------------------------------------------

async function enableDemoMode(page: Page): Promise<void> {
  await page.goto(`${BASE_URL}/demo`, { waitUntil: 'domcontentloaded', timeout: 30000 });
  // Wait for redirect to home after demo mode activates
  try {
    await page.waitForURL(url => url.pathname === '/' || url.pathname.includes('from=demo'), {
      timeout: 15000,
    });
  } catch {
    // May already be on home
  }
  await page.waitForTimeout(2000);

  // Verify demo mode is active
  const body = await page.locator('body').textContent();
  if (body?.includes('Please Log In') || body?.includes('You need to be signed in')) {
    throw new Error('Demo mode did not activate — still on login screen');
  }
  console.log('  ✓ Demo mode activated');
}

async function navigateToTrip(page: Page, tripPath: string): Promise<void> {
  if (tripPath === '/demo') return; // already on dashboard

  await page.goto(`${BASE_URL}${tripPath}`, { waitUntil: 'domcontentloaded', timeout: 20000 });
  // Wait for trip header to render (trip name, cover photo area)
  await page.waitForTimeout(2000);

  // Verify we're not on an error page
  const body = await page.locator('body').textContent();
  if (body?.includes('Trip Not Found') || body?.includes('not found')) {
    throw new Error(`Trip at ${tripPath} returned "Not Found"`);
  }

  // Deterministic baseline for captures: ensure we always shoot from top-of-page.
  await page.evaluate(() => window.scrollTo(0, 0));
}

// ---------------------------------------------------------------------------
// Screenshot capture with fallback trips
// ---------------------------------------------------------------------------

interface CaptureResult {
  name: string;
  device: string;
  status: 'success' | 'warning' | 'failed';
  tripUsed: string;
  tab: string | null;
  dimensions?: string;
  error?: string;
}

async function captureShot(
  page: Page,
  shot: ShotDef,
  outputDir: string,
  device: string,
  expectedDims: { width: number; height: number },
): Promise<CaptureResult> {
  const tripsToTry = [shot.tripPath, ...(shot.fallbackTrips || [])];
  let lastError = '';

  for (const tripPath of tripsToTry) {
    try {
      // Navigate to trip
      await navigateToTrip(page, tripPath);

      let ready = true;
      if (shot.tab) {
        ready = await navigateToTabAndWaitReady(page, shot.tab);
      } else {
        // Dashboard — just wait for skeletons to clear
        await waitForNoSkeletons(page);
        await page.waitForTimeout(1000);
      }

      // Always capture from the top so trip cover context is visible in final image.
      await page.evaluate(() => window.scrollTo(0, 0));

      const hasCoverContext = await waitForCoverPhotoContext(page);
      if (!hasCoverContext) {
        lastError = `Cover photo context did not render for ${tripPath}`;
        console.warn(`    ⚠ ${shot.name}: ${lastError}, trying next trip...`);
        continue;
      }

      // Verify no auth gate
      const body = await page.locator('body').textContent();
      if (body?.includes('Please Log In') || body?.includes('You need to be signed in')) {
        lastError = 'Auth gate detected';
        continue;
      }

      // Capture
      const outPath = path.join(outputDir, `${shot.name}.png`);
      await page.screenshot({ path: outPath, fullPage: false });

      // Validate dimensions
      const stat = fs.statSync(outPath);
      const dimStr = `${expectedDims.width}x${expectedDims.height}`;

      const result: CaptureResult = {
        name: shot.name,
        device,
        status: ready ? 'success' : 'warning',
        tripUsed: tripPath,
        tab: shot.tab,
        dimensions: dimStr,
      };

      if (!ready) {
        result.error = `Tab "${shot.tab}" content may not be fully loaded`;
      }

      const icon = ready ? '✓' : '⚠';
      console.log(
        `  ${icon} ${shot.name}.png (${device}) — trip: ${tripPath} [${(stat.size / 1024).toFixed(0)}KB]`,
      );
      return result;
    } catch (e) {
      lastError = e instanceof Error ? e.message : String(e);
      console.warn(`    ⚠ ${shot.name}: trip ${tripPath} failed (${lastError}), trying next...`);
    }
  }

  // All trips failed
  console.error(`  ✗ ${shot.name}: ALL trip candidates failed. Last error: ${lastError}`);
  return {
    name: shot.name,
    device,
    status: 'failed',
    tripUsed: 'none',
    tab: shot.tab,
    error: lastError,
  };
}

// ---------------------------------------------------------------------------
// CLI argument parsing
// ---------------------------------------------------------------------------

function parseArgs(): { device: 'iphone' | 'ipad' | 'all'; only?: string } {
  const args = process.argv.slice(2);
  let device: 'iphone' | 'ipad' | 'all' = 'all';
  let only: string | undefined;

  for (const arg of args) {
    if (arg.startsWith('--device=')) {
      const val = arg.split('=')[1];
      if (val === 'iphone' || val === 'ipad' || val === 'all') device = val;
    }
    if (arg.startsWith('--only=')) {
      only = arg.split('=')[1];
    }
  }
  return { device, only };
}

// ---------------------------------------------------------------------------
// Main capture pipeline
// ---------------------------------------------------------------------------

async function captureScreenshots(): Promise<void> {
  const { device, only } = parseArgs();
  const executablePath = findChromium();

  console.log(`\n📸 Chravel App Store Screenshot Capture`);
  console.log(`   Base URL: ${BASE_URL}`);
  console.log(`   Device: ${device}`);
  if (only) console.log(`   Only: ${only}`);
  if (executablePath) console.log(`   Chromium: ${executablePath}`);
  console.log('');

  const launchOptions: Record<string, unknown> = {
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu'],
  };
  if (executablePath) {
    launchOptions.executablePath = executablePath;
  }

  const browser: Browser = await chromium.launch(launchOptions);
  const results: CaptureResult[] = [];

  try {
    // --- iPhone 6.7" ---
    if (device === 'iphone' || device === 'all') {
      console.log('─── iPhone 6.7" (1290×2796) ───');

      const ctx = await browser.newContext({
        ignoreHTTPSErrors: true,
        userAgent:
          'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
      });
      const page = await ctx.newPage();
      await page.setViewportSize(IPHONE_67);

      await enableDemoMode(page);

      const shots = only ? IPHONE_SHOTS.filter(s => s.name === only) : IPHONE_SHOTS;
      for (const shot of shots) {
        const dir = path.join(OUTPUT_BASE, 'iPhone-6.7');
        fs.mkdirSync(dir, { recursive: true });
        const result = await captureShot(page, shot, dir, 'iPhone 6.7"', IPHONE_67);
        results.push(result);
      }

      await page.close();
      await ctx.close();
      console.log('');
    }

    // --- iPad Pro 12.9" ---
    if (device === 'ipad' || device === 'all') {
      console.log('─── iPad Pro 12.9" (2048×2732) ───');

      const ctx = await browser.newContext({
        ignoreHTTPSErrors: true,
        userAgent:
          'Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
      });
      const page = await ctx.newPage();
      await page.setViewportSize(IPAD_129);

      await enableDemoMode(page);

      const shots = only ? IPAD_SHOTS.filter(s => s.name === only) : IPAD_SHOTS;
      for (const shot of shots) {
        const dir = path.join(OUTPUT_BASE, 'iPad-Pro-12.9');
        fs.mkdirSync(dir, { recursive: true });
        const result = await captureShot(page, shot, dir, 'iPad Pro 12.9"', IPAD_129);
        results.push(result);
      }

      await page.close();
      await ctx.close();
      console.log('');
    }
  } finally {
    await browser.close();
  }

  // Write capture report
  const report = {
    timestamp: new Date().toISOString(),
    baseUrl: BASE_URL,
    device,
    results,
    summary: {
      total: results.length,
      success: results.filter(r => r.status === 'success').length,
      warning: results.filter(r => r.status === 'warning').length,
      failed: results.filter(r => r.status === 'failed').length,
    },
  };
  fs.writeFileSync(REPORT_PATH, JSON.stringify(report, null, 2));

  // Print summary
  console.log('═══ Capture Summary ═══');
  console.log(`  Total: ${report.summary.total}`);
  console.log(`  ✓ Success: ${report.summary.success}`);
  if (report.summary.warning > 0) console.log(`  ⚠ Warning: ${report.summary.warning}`);
  if (report.summary.failed > 0) console.log(`  ✗ Failed: ${report.summary.failed}`);
  console.log(`  Report: ${REPORT_PATH}`);
  console.log('');

  if (report.summary.failed > 0) {
    console.error('Some screenshots failed to capture. Review the report and retry.');
    process.exit(1);
  }
}

captureScreenshots().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
