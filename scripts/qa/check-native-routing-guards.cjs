#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const repoRoot = path.resolve(__dirname, '..', '..');
const allowedEndsWithFiles = new Set([path.join(repoRoot, 'src/lib/nativeRoutingGuards.ts')]);
const ignoredDirs = new Set(['.git', 'node_modules', 'dist', 'coverage', '.vercel']);
const sourceExt = new Set(['.ts', '.tsx', '.js', '.jsx']);
const violations = [];

function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (ignoredDirs.has(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(full);
      continue;
    }
    if (sourceExt.has(path.extname(entry.name))) checkFile(full);
  }
}

function checkFile(file) {
  const text = fs.readFileSync(file, 'utf8');
  const rel = path.relative(repoRoot, file);
  const lines = text.split(/\r?\n/);

  lines.forEach((line, index) => {
    const hasHostContext =
      /(host|hostname|domain|origin|allowlist|supabase\.co|chravel\.app|vercel\.app)/i.test(line);
    if (line.includes('.endsWith(') && hasHostContext && !allowedEndsWithFiles.has(file)) {
      violations.push(
        `${rel}:${index + 1} uses .endsWith() in host/domain context; use hostMatchesAllowlistedDomain().`,
      );
    }
  });

  const isSharedGuardOrTest =
    rel === 'src/lib/nativeRoutingGuards.ts' ||
    rel === 'src/lib/__tests__/nativeRoutingGuards.test.ts';
  const looksLikeInlineAuthMatcher =
    /pathname\s*(?:===|!==)\s*['"]\/auth['"]/.test(text) ||
    /window\.location\.hash\.includes\(['"]access_token['"]\)/.test(text);

  if (
    !isSharedGuardOrTest &&
    looksLikeInlineAuthMatcher &&
    /callback|native|deferred|initial|oauth/i.test(text)
  ) {
    violations.push(
      `${rel} appears to redefine auth-return routing; import isNativeAuthReturnPath().`,
    );
  }
}

walk(path.join(repoRoot, 'src'));

if (violations.length) {
  console.error('Native routing guard violations found:');
  for (const violation of violations) console.error(`- ${violation}`);
  process.exit(1);
}

console.log('Native routing guard check passed.');
