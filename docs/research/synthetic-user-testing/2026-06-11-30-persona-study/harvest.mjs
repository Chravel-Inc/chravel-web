/* Evidence harvest for the 2026-06-11 30-persona synthetic study.
 * Drives the local Vite dev server (no external network — *.supabase.co is
 * blocked by the sandbox allowlist, so any supabase request failure below is
 * an ENVIRONMENT artifact, not a product defect).
 * Usage: node harvest.mjs <desktop|mobile>
 */
import { chromium } from 'playwright-core';
import fs from 'node:fs';
import path from 'node:path';

const MODE = process.argv[2] || 'desktop';
const BASE = 'http://localhost:8080';
const OUT =
  '/home/user/chravel-web/docs/research/synthetic-user-testing/2026-06-11-30-persona-study/screenshots';
const LOG = [];
let stepNo = 0;

const viewport = MODE === 'mobile' ? { width: 390, height: 844 } : { width: 1440, height: 900 };
const ctxOpts =
  MODE === 'mobile'
    ? {
        viewport,
        hasTouch: true,
        isMobile: true,
        deviceScaleFactor: 3,
        userAgent:
          'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1',
      }
    : { viewport, deviceScaleFactor: 1 };

const browser = await chromium.launch({
  executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
  args: ['--no-sandbox'],
});
const context = await browser.newContext(ctxOpts);
const page = await context.newPage();

const consoleErrors = [];
const failedRequests = [];
page.on('console', msg => {
  if (msg.type() === 'error' || msg.type() === 'warning') {
    consoleErrors.push({ step: stepNo, type: msg.type(), text: msg.text().slice(0, 400) });
  }
});
page.on('pageerror', err =>
  consoleErrors.push({ step: stepNo, type: 'pageerror', text: String(err).slice(0, 400) }),
);
page.on('requestfailed', req =>
  failedRequests.push({
    step: stepNo,
    url: req.url().slice(0, 200),
    failure: req.failure()?.errorText,
  }),
);

async function snap(slug, note) {
  stepNo += 1;
  const file = `${MODE}-${String(stepNo).padStart(2, '0')}-${slug}.png`;
  try {
    await page.screenshot({
      path: path.join(OUT, file),
      fullPage: slug.includes('landing') || slug.includes('seo'),
    });
  } catch (e) {
    LOG.push({ step: stepNo, slug, error: `screenshot failed: ${e.message}` });
    return;
  }
  LOG.push({
    step: stepNo,
    slug,
    file,
    url: page.url(),
    title: await page.title().catch(() => ''),
    note,
  });
  process.stdout.write(`✓ ${file}\n`);
}

async function go(url, waitMs = 2500) {
  await page.goto(BASE + url, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(waitMs);
}

async function clickText(texts, note) {
  for (const t of texts) {
    const loc = page.getByText(t, { exact: false }).first();
    try {
      if (await loc.isVisible({ timeout: 1200 })) {
        await loc.click({ timeout: 3000 });
        await page.waitForTimeout(1500);
        return true;
      }
    } catch {
      /* try next selector */
    }
  }
  LOG.push({ step: stepNo, note: `clickText miss: ${texts.join('|')} (${note || ''})` });
  return false;
}

try {
  // 1. Marketing landing
  await go('/', 4000);
  await snap('landing', 'Unauthenticated marketing landing, full page');

  // 2. Pricing section (scroll target on landing)
  for (const sel of ['#pricing', 'text=Pricing']) {
    try {
      await page.locator(sel).first().scrollIntoViewIfNeeded({ timeout: 2000 });
      break;
    } catch {
      /* try next */
    }
  }
  await page.waitForTimeout(800);
  await snap('pricing-viewport', 'Pricing section as scrolled into view');

  // 3. SEO landing page
  await go('/trip-planner', 3000);
  await snap('seo-trip-planner', 'SEO landing page /trip-planner');

  // 4. Auth — sign in and sign up
  await go('/auth', 2500);
  await snap('auth-signin', 'Auth page default (sign in)');
  await go('/auth?mode=signup', 2500);
  await snap('auth-signup', 'Auth page signup mode');

  // 5. Demo mode entry -> dashboard
  await go('/demo', 4500);
  await snap('demo-dashboard', 'App-preview demo dashboard after /demo redirect');

  // 6. Consumer demo trip (bachelorette, id 4) + tab walk
  await go('/demo/trip/4', 4000);
  await snap('demo-trip-overview', 'Consumer demo trip 4 (bachelorette) initial view');
  const tabs = ['Chat', 'Calendar', 'Places', 'Payments', 'Tasks', 'Polls', 'Media', 'Concierge'];
  for (const tab of tabs) {
    const ok = await clickText([tab], `trip tab ${tab}`);
    if (ok) await snap(`demo-trip-tab-${tab.toLowerCase()}`, `Trip tab: ${tab}`);
  }

  // 7. Pro demo trip + Team/Broadcasts
  await go('/tour/pro/beyonce-cowboy-carter-tour', 4500);
  await snap('demo-pro-overview', 'Pro demo trip (touring) initial view');
  for (const tab of ['Team', 'Broadcasts', 'Schedule', 'Calendar', 'Chat']) {
    const ok = await clickText([tab], `pro tab ${tab}`);
    if (ok) await snap(`demo-pro-tab-${tab.toLowerCase()}`, `Pro tab: ${tab}`);
  }

  // 8. Corporate pro demo trip (single overview)
  await go('/tour/pro/eli-lilly-c-suite-retreat-2026', 4000);
  await snap('demo-pro-corporate', 'Pro demo trip (corporate retreat) overview');

  // 9. Event demo
  await go('/event/netflix-joke-fest-2026', 4500);
  await snap('demo-event-overview', 'Event demo (festival) initial view');
  for (const tab of ['Agenda', 'Lineup', 'Broadcasts', 'Chat']) {
    const ok = await clickText([tab], `event tab ${tab}`);
    if (ok) await snap(`demo-event-tab-${tab.toLowerCase()}`, `Event tab: ${tab}`);
  }

  // 10. Invite join page (no token -> error UX; supabase blocked = env artifact)
  await go('/join/DEMO123', 4000);
  await snap(
    'join-invalid-token',
    'Join page with unknown token (backend unreachable in sandbox — error state UX only)',
  );

  // 11. Demo off escape hatch back to marketing
  await go('/demo?off=1', 3500);
  await snap('demo-off-landing', 'Landing after demo mode disabled');
} finally {
  fs.writeFileSync(
    path.join(OUT, `${MODE}-harvest-log.json`),
    JSON.stringify({ mode: MODE, viewport, steps: LOG, consoleErrors, failedRequests }, null, 2),
  );
  await browser.close();
}
process.stdout.write(
  `DONE ${MODE}: ${LOG.length} log entries, ${consoleErrors.length} console errors, ${failedRequests.length} failed requests\n`,
);
