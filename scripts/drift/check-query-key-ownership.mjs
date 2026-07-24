#!/usr/bin/env node
// Query-key ownership control (drift category C.44 cache-key drift).
//
// Source of truth: src/lib/queryKeys.ts (the `tripKeys` factory). Every
// trip-scoped React Query key must come from that factory so invalidation is
// consistent across screens. This gate fails when a hand-written array literal
// re-declares a factory-owned key inline (e.g. ['tripTasks', tripId]) instead
// of calling tripKeys.tasks(tripId). Read-only.
//
// Only the DISTINCTIVE trip-scoped prefixes the factory owns are matched, so
// generic keys (e.g. ['trip', id]) and non-factory keys (feature-flag,
// notifications, proTrips) don't false-positive.

import { readFileSync, readdirSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, relative } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(__dirname, '..', '..');
const srcDir = join(repoRoot, 'src');
const factoryFile = join('src', 'lib', 'queryKeys.ts');

// Distinctive factory-owned key prefixes (from tripKeys in queryKeys.ts).
const OWNED_PREFIXES = [
  'tripTasks',
  'tripPolls',
  'pollComments',
  'pollCommentCounts',
  'tripMedia',
  'tripPlaces',
  'tripLinks',
  'tripPayments',
  'tripPaymentBalances',
  'paymentAttachments',
  'tripBroadcasts',
  'calendarEvents',
  'tripChat',
  'tripChatMessages',
  'tripChatThreads',
  'tripChatUnread',
  'tripRoster',
  'tripChannels',
  'tripAdmins',
  'tripRoles',
  'trip-members',
  'trip-member-meta',
  'eventAgenda',
  'eventLineup',
  'eventRsvps',
];
const INLINE_KEY_RE = new RegExp(`\\[\\s*['"](${OWNED_PREFIXES.join('|')})['"]\\s*,`);

function walk(dir, out = []) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const st = statSync(full);
    if (st.isDirectory()) {
      if (entry === '__tests__' || entry === 'node_modules') continue;
      walk(full, out);
    } else if (/\.(ts|tsx)$/.test(entry) && !/\.test\.(ts|tsx)$/.test(entry)) {
      out.push(full);
    }
  }
  return out;
}

// Strip comments so key names mentioned in prose don't count. Block comments
// are blanked (newlines preserved so line numbers stay accurate), then // line
// comments are trimmed. A `//` inside a string would over-trim, which is safe
// here (it can only cause a miss, never a false positive).
function stripComments(src) {
  const noBlock = src.replace(/\/\*[\s\S]*?\*\//g, m => m.replace(/[^\n]/g, ' '));
  return noBlock
    .split('\n')
    .map(line => {
      const idx = line.indexOf('//');
      return idx === -1 ? line : line.slice(0, idx);
    })
    .join('\n');
}

const violations = [];
for (const file of walk(srcDir)) {
  const rel = relative(repoRoot, file);
  if (rel === factoryFile) continue; // the factory itself defines the literals
  const code = stripComments(readFileSync(file, 'utf8'));
  code.split('\n').forEach((line, i) => {
    if (INLINE_KEY_RE.test(line)) {
      violations.push({ rel, line: i + 1, text: line.trim().slice(0, 100) });
    }
  });
}

console.log('=== Query-key ownership (tripKeys factory) ===');
if (violations.length === 0) {
  console.log('✅ No inline factory-owned query keys — all go through tripKeys.');
  process.exit(0);
}

console.log(`❌ ${violations.length} inline factory-owned query key(s) bypassing tripKeys:`);
for (const v of violations) {
  console.log(`   ${v.rel}:${v.line}  ${v.text}`);
}
console.log(
  '\nUse the tripKeys factory from src/lib/queryKeys.ts (e.g. tripKeys.tasks(tripId)) so ' +
    'invalidation stays consistent. If this is a genuinely new key, add it to the factory first.',
);
process.exit(1);
