#!/usr/bin/env node
const { spawnSync } = require('node:child_process');

const releaseGate = process.env.CHRAVEL_APPSTORE_RELEASE_GATE === '1';
const includeE2E = process.env.CHRAVEL_APPSTORE_INCLUDE_E2E === '1';
const includeScreenshots = process.env.CHRAVEL_APPSTORE_INCLUDE_SCREENSHOTS === '1';
const DEFAULT_STEP_TIMEOUT_MS = Number(process.env.CHRAVEL_APPSTORE_STEP_TIMEOUT_MS || 10 * 60 * 1000);

const steps = [
  ['validate-env', 'npm', ['run', 'validate-env'], { required: true }],
  ['qa:guardrails', 'npm', ['run', 'qa:guardrails'], { required: true }],
  ['permissions:drift', 'npm', ['run', 'permissions:drift'], { required: true }],
  ['iap:parity', 'npm', ['run', 'iap:parity'], { required: true }],
  ['iap:validate', 'npm', ['run', 'iap:validate'], { required: true }],
  ['lint:check', 'npm', ['run', 'lint:check'], { required: true }],
  ['typecheck', 'npm', ['run', 'typecheck'], { required: true }],
  ['test:run', 'npm', ['run', 'test:run'], { required: true }],
  ['build', 'npm', ['run', 'build'], { required: true }],
  ['qa:mobile-perf-budget', 'npm', ['run', 'qa:mobile-perf-budget'], { required: true }],
  ['qa:chat-production-readiness', 'npm', ['run', 'qa:chat-production-readiness'], { required: true }],
  ['test:e2e:smoke', 'npm', ['run', 'test:e2e:smoke'], { required: includeE2E }],
  ['test:e2e:concierge-device-smoke', 'npm', ['run', 'test:e2e:concierge-device-smoke'], { required: includeE2E }],
  ['screenshots:appstore:all', 'npm', ['run', 'screenshots:appstore:all'], { required: includeScreenshots }],
];

const results = [];
const startedAt = Date.now();

for (const [name, command, args, options] of steps) {
  const optional = !options.required;
  if (optional && releaseGate) {
    console.log(`\n⚠️  ${name} is configured as external/optional for this local gate.`);
    console.log('    Set CHRAVEL_APPSTORE_INCLUDE_E2E=1 or CHRAVEL_APPSTORE_INCLUDE_SCREENSHOTS=1 to make it required.');
  }

  console.log(`\n▶ ${name}: ${command} ${args.join(' ')}`);
  const stepStartedAt = Date.now();
  const child = spawnSync(command, args, {
    stdio: 'inherit',
    timeout: DEFAULT_STEP_TIMEOUT_MS,
    shell: process.platform === 'win32',
    env: {
      ...process.env,
      CHRAVEL_E2E_RELEASE_GATE: releaseGate ? '1' : process.env.CHRAVEL_E2E_RELEASE_GATE,
    },
  });
  const durationSeconds = ((Date.now() - stepStartedAt) / 1000).toFixed(1);
  const timedOut = child.error?.code === 'ETIMEDOUT';
  const status = child.status === 0 ? 'pass' : optional ? 'warn' : 'fail';
  results.push({
    name,
    status,
    durationSeconds,
    exitCode: timedOut ? 'timeout' : (child.status ?? 'signal'),
  });

  if (timedOut) {
    console.error(`\n⏱️  ${name} exceeded ${DEFAULT_STEP_TIMEOUT_MS / 1000}s timeout.`);
  }

  if (child.status !== 0 && !optional) {
    console.error(`\n❌ App Store release gate failed at ${name} after ${durationSeconds}s.`);
    printSummary(results, startedAt);
    process.exit(child.status || 1);
  }

  if (child.status !== 0 && optional) {
    console.warn(`\n⚠️  Optional App Store gate step ${name} failed after ${durationSeconds}s; continuing.`);
  }
}

printSummary(results, startedAt);
const failures = results.filter(result => result.status === 'fail');
process.exit(failures.length > 0 ? 1 : 0);

function printSummary(items, globalStartedAt) {
  console.log('\n=== App Store release gate summary ===');
  for (const item of items) {
    const icon = item.status === 'pass' ? '✅' : item.status === 'warn' ? '⚠️' : '❌';
    console.log(`${icon} ${item.name} (${item.durationSeconds}s, exit ${item.exitCode})`);
  }
  console.log(`Total: ${((Date.now() - globalStartedAt) / 1000).toFixed(1)}s`);
}
