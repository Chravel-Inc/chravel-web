/* Evidence harvest pass 2 — deep walk of demo-mode surfaces.
 * Enters the consumer trip via the dashboard View button (demo store context),
 * walks all in-trip tabs, opens Create Trip + Alerts, and fills the pro/event
 * tab gaps from pass 1. Usage: node harvest2.mjs <desktop|mobile>
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
  if (msg.type() === 'error') consoleErrors.push({ step: stepNo, text: msg.text().slice(0, 300) });
});
page.on('pageerror', err =>
  consoleErrors.push({ step: stepNo, type: 'pageerror', text: String(err).slice(0, 300) }),
);
page.on('requestfailed', req =>
  failedRequests.push({
    step: stepNo,
    url: req.url().slice(0, 160),
    failure: req.failure()?.errorText,
  }),
);

async function snap(slug, note) {
  stepNo += 1;
  const file = `${MODE}2-${String(stepNo).padStart(2, '0')}-${slug}.png`;
  try {
    await page.screenshot({ path: path.join(OUT, file) });
    LOG.push({ step: stepNo, slug, file, url: page.url(), note });
    process.stdout.write(`✓ ${file}\n`);
  } catch (e) {
    LOG.push({ step: stepNo, slug, error: e.message });
  }
}

async function tryClick(locator, note, waitMs = 1500) {
  try {
    await locator.click({ timeout: 3500 });
    await page.waitForTimeout(waitMs);
    return true;
  } catch (e) {
    LOG.push({ step: stepNo, note: `miss: ${note}` });
    return false;
  }
}

try {
  // Enter demo mode, land on dashboard
  await page.goto(BASE + '/demo', { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(4500);

  // Consumer trip via View button on first card
  const viewBtn = page.getByRole('button', { name: 'View', exact: true }).first();
  const viewLink = page.getByText('View', { exact: true }).first();
  if (
    (await tryClick(viewBtn, 'dashboard View button')) ||
    (await tryClick(viewLink, 'dashboard View text'))
  ) {
    await page.waitForTimeout(2500);
    await snap('consumer-trip-chat', 'Consumer demo trip after View click (default tab)');
    for (const tab of ['Calendar', 'Concierge', 'Media', 'Payments', 'Places', 'Polls', 'Tasks']) {
      const ok = await tryClick(
        page.getByText(tab, { exact: true }).first(),
        `consumer tab ${tab}`,
      );
      if (ok) await snap(`consumer-tab-${tab.toLowerCase()}`, `Consumer trip tab: ${tab}`);
    }
    // Chat sub-views: Broadcasts / Pinned / Channels segmented control
    await tryClick(page.getByText('Chat', { exact: true }).first(), 'back to Chat tab');
    for (const sub of ['Broadcasts', 'Pinned', 'Channels']) {
      const ok = await tryClick(
        page.getByText(sub, { exact: true }).first(),
        `chat subview ${sub}`,
      );
      if (ok) await snap(`consumer-chat-${sub.toLowerCase()}`, `Chat subview: ${sub}`);
    }
    // Invite modal from trip header
    const okInvite = await tryClick(
      page.getByText('Invite', { exact: true }).first(),
      'Invite button',
    );
    if (okInvite) {
      await snap('consumer-invite-modal', 'Invite modal from trip header');
      await page.keyboard.press('Escape');
      await page.waitForTimeout(800);
    }
  }

  // Back to dashboard: Create Trip modal + Alerts
  await page.goto(BASE + '/?from=demo', { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(3000);
  const okNew = await tryClick(
    page.getByText('New Trip', { exact: false }).first(),
    'New Trip button',
  );
  if (okNew) {
    await snap('create-trip-modal', 'Create Trip modal (consumer default)');
    const okPro = await tryClick(
      page.getByText('Pro', { exact: true }).first(),
      'Pro trip type toggle',
      1000,
    );
    if (okPro) await snap('create-trip-pro', 'Create Trip modal with Pro type selected');
    await page.keyboard.press('Escape');
    await page.waitForTimeout(800);
  }
  const okAlerts = await tryClick(
    page.getByText('Alerts', { exact: false }).first(),
    'Alerts nav item',
  );
  if (okAlerts) {
    await snap('alerts-dialog', 'Notifications/Alerts dialog');
    await page.keyboard.press('Escape');
    await page.waitForTimeout(500);
  }

  // Pro trip: remaining tabs from pass 1 gaps
  await page.goto(BASE + '/tour/pro/beyonce-cowboy-carter-tour', {
    waitUntil: 'domcontentloaded',
    timeout: 30000,
  });
  await page.waitForTimeout(4000);
  for (const tab of ['Concierge', 'Media', 'Payments', 'Places', 'Polls', 'Tasks', 'Team']) {
    const ok = await tryClick(page.getByText(tab, { exact: true }).first(), `pro tab ${tab}`);
    if (ok) await snap(`pro-tab-${tab.toLowerCase()}`, `Pro trip tab: ${tab}`);
  }
  await tryClick(page.getByText('Chat', { exact: true }).first(), 'pro back to Chat');
  for (const sub of ['Broadcasts', 'Channels']) {
    const ok = await tryClick(
      page.getByText(sub, { exact: true }).first(),
      `pro chat subview ${sub}`,
    );
    if (ok) await snap(`pro-chat-${sub.toLowerCase()}`, `Pro chat subview: ${sub}`);
  }
  const okRecap = await tryClick(
    page.getByText('PDF Recap', { exact: false }).first(),
    'PDF Recap button',
  );
  if (okRecap) {
    await snap('pro-pdf-recap', 'PDF Recap flow from pro trip header');
    await page.keyboard.press('Escape');
  }

  // Event: remaining surfaces
  await page.goto(BASE + '/event/netflix-joke-fest-2026', {
    waitUntil: 'domcontentloaded',
    timeout: 30000,
  });
  await page.waitForTimeout(4000);
  for (const tab of ['Lineup', 'Broadcasts', 'Tasks', 'Polls', 'Team', 'Calendar']) {
    const ok = await tryClick(page.getByText(tab, { exact: true }).first(), `event tab ${tab}`);
    if (ok) await snap(`event-tab-${tab.toLowerCase()}`, `Event tab: ${tab}`);
  }
} finally {
  fs.writeFileSync(
    path.join(OUT, `${MODE}-harvest2-log.json`),
    JSON.stringify({ mode: MODE, viewport, steps: LOG, consoleErrors, failedRequests }, null, 2),
  );
  await browser.close();
}
process.stdout.write(
  `DONE ${MODE} pass2: ${LOG.length} entries, ${consoleErrors.length} console errors\n`,
);
