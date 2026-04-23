#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const repoRoot = path.resolve(__dirname, '../..');
const matrixPath = path.join(repoRoot, 'qa/journeys/chat-production-readiness.json');

function fail(message) {
  console.error(`❌ ${message}`);
  process.exit(1);
}

if (!fs.existsSync(matrixPath)) {
  fail(`Chat readiness matrix not found at ${path.relative(repoRoot, matrixPath)}`);
}

let matrix;
try {
  matrix = JSON.parse(fs.readFileSync(matrixPath, 'utf8'));
} catch (error) {
  fail(`Chat readiness matrix is invalid JSON: ${error.message}`);
}

if (!Array.isArray(matrix.checks) || matrix.checks.length === 0) {
  fail('Chat readiness matrix must contain checks[] with at least one entry');
}

const testFiles = [];
for (const check of matrix.checks) {
  if (!check?.id || !check?.name) {
    fail('Each chat readiness check must define id and name');
  }

  if (!Array.isArray(check.testFiles) || check.testFiles.length === 0) {
    fail(`Check ${check.id} must include at least one test file`);
  }

  for (const relativeFile of check.testFiles) {
    const filePath = path.join(repoRoot, relativeFile);
    if (!fs.existsSync(filePath)) {
      fail(`Missing test file for ${check.id}: ${relativeFile}`);
    }

    const source = fs.readFileSync(filePath, 'utf8');
    const hasSkip = /(?:describe|test|it)\.skip\s*\(/.test(source) || /test\.fixme\s*\(/.test(source);
    if (hasSkip) {
      fail(`Skipped/fixme tests are not allowed in readiness gate file: ${relativeFile}`);
    }

    testFiles.push(relativeFile);
  }
}

const uniqueTestFiles = [...new Set(testFiles)];

console.log(`▶ Running chat production readiness gate (${matrix.checks.length} checks, ${uniqueTestFiles.length} files)`);

const vitest = spawnSync(
  'npx',
  ['vitest', 'run', ...uniqueTestFiles],
  {
    cwd: repoRoot,
    stdio: 'inherit',
    env: process.env,
  },
);

if (vitest.status !== 0) {
  fail('Chat production readiness gate failed. Keep chat feature freeze in place.');
}

console.log('✅ Chat production readiness gate passed. Chat feature freeze can be lifted.');
