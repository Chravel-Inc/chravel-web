#!/usr/bin/env node

const { execSync } = require('node:child_process');

const baseline = Number(process.env.ESLINT_WARNING_BASELINE || '1293');

const runEslint = () => {
  try {
    execSync('npx eslint . --format json -o eslint-report.json', { stdio: 'inherit' });
    return 0;
  } catch (error) {
    if (typeof error.status === 'number') {
      return error.status;
    }
    throw error;
  }
};

const status = runEslint();
const fs = require('node:fs');
const reportPath = 'eslint-report.json';
const report = JSON.parse(fs.readFileSync(reportPath, 'utf8'));
const totals = report.reduce(
  (acc, file) => {
    acc.warnings += file.warningCount || 0;
    acc.errors += file.errorCount || 0;
    return acc;
  },
  { warnings: 0, errors: 0 },
);

if (totals.errors > 0) {
  console.error(`\n❌ ESLint errors detected: ${totals.errors}.`);
  report.forEach(file => {
    if (file.errorCount > 0) {
      console.error(`\nFile: ${file.filePath}`);
      file.messages.forEach(msg => {
        if (msg.severity === 2) {
          console.error(
            `  [ERROR] Line ${msg.line}:${msg.column} - ${msg.message} (${msg.ruleId})`,
          );
        }
      });
    }
  });
  fs.unlinkSync(reportPath);
  process.exit(1);
}

if (totals.warnings > baseline) {
  console.error(
    `\n❌ ESLint warning budget exceeded: ${totals.warnings} warnings (baseline ${baseline}).`,
  );
  console.error(
    'Reduce warnings or explicitly ratchet the baseline in CI when intentionally accepted.',
  );
  fs.unlinkSync(reportPath);
  process.exit(1);
}

fs.unlinkSync(reportPath);
console.log(`\n✅ ESLint warnings within budget: ${totals.warnings}/${baseline}.`);
process.exit(status === 0 ? 0 : 1);
