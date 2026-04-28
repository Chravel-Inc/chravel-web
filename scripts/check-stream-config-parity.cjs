#!/usr/bin/env node

const crypto = require('node:crypto');

const normalize = value => (typeof value === 'string' ? value.trim() : '');
const present = value => normalize(value).length > 0;
const digest = value => crypto.createHash('sha256').update(value).digest('hex').slice(0, 12);
const mask = value =>
  present(value) ? `${value.slice(0, 4)}…${value.slice(-4)} (${digest(value)})` : '(missing)';

const pick = (...keys) => {
  for (const key of keys) {
    const value = process.env[key];
    if (present(value)) {
      return { key, value: normalize(value) };
    }
  }
  return { key: keys[0], value: '' };
};

const frontend = {
  streamApiKey: pick('FRONTEND_VITE_STREAM_API_KEY', 'VITE_STREAM_API_KEY'),
  supabaseUrl: pick('FRONTEND_VITE_SUPABASE_URL', 'VITE_SUPABASE_URL'),
  supabaseAnonKey: pick('FRONTEND_VITE_SUPABASE_ANON_KEY', 'VITE_SUPABASE_ANON_KEY'),
};

const supabase = {
  streamApiKey: pick('SUPABASE_STREAM_API_KEY', 'STREAM_API_KEY'),
  streamApiSecret: pick('SUPABASE_STREAM_API_SECRET', 'STREAM_API_SECRET'),
  streamWebhookSecret: pick('SUPABASE_STREAM_WEBHOOK_SECRET', 'STREAM_WEBHOOK_SECRET'),
};

const streamDashboard = {
  webhookSecret: pick('STREAM_DASHBOARD_WEBHOOK_SECRET', 'STREAM_WEBHOOK_SECRET_DASHBOARD'),
  webhookSendsApiKey: pick('STREAM_WEBHOOK_SENDS_X_API_KEY', 'STREAM_WEBHOOK_X_API_KEY_ENABLED'),
  webhookApiKeyValue: pick('STREAM_WEBHOOK_X_API_KEY_VALUE'),
};

const results = [];
const warn = [];

const requireValue = (label, source) => {
  if (!present(source.value)) {
    results.push({ ok: false, label, detail: `${source.key} is missing` });
    return false;
  }
  return true;
};

const compareEqual = (label, left, right) => {
  const leftOk = requireValue(`${label} (left)`, left);
  const rightOk = requireValue(`${label} (right)`, right);
  if (!leftOk || !rightOk) return;

  const ok = left.value === right.value;
  results.push({
    ok,
    label,
    detail: `${left.key}=${mask(left.value)} | ${right.key}=${mask(right.value)}`,
  });
};

requireValue('Frontend VITE_SUPABASE_URL', frontend.supabaseUrl);
requireValue('Frontend VITE_SUPABASE_ANON_KEY', frontend.supabaseAnonKey);
requireValue('Supabase STREAM_API_SECRET', supabase.streamApiSecret);

compareEqual(
  'Frontend VITE_STREAM_API_KEY matches Supabase STREAM_API_KEY',
  frontend.streamApiKey,
  supabase.streamApiKey,
);
compareEqual(
  'Supabase STREAM_WEBHOOK_SECRET matches Stream Dashboard webhook secret',
  supabase.streamWebhookSecret,
  streamDashboard.webhookSecret,
);

const sendsApiKeyFlag = normalize(streamDashboard.webhookSendsApiKey.value).toLowerCase();
if (!present(sendsApiKeyFlag)) {
  warn.push(
    'Stream webhook x-api-key behavior cannot be confirmed (set STREAM_WEBHOOK_SENDS_X_API_KEY=true|false).',
  );
} else if (!['true', 'false'].includes(sendsApiKeyFlag)) {
  results.push({
    ok: false,
    label: 'Stream webhook x-api-key mode declaration',
    detail: `${streamDashboard.webhookSendsApiKey.key} must be true or false`,
  });
} else if (sendsApiKeyFlag === 'true') {
  compareEqual(
    'Stream webhook x-api-key value matches Supabase STREAM_API_KEY',
    streamDashboard.webhookApiKeyValue,
    supabase.streamApiKey,
  );
} else {
  warn.push(
    'Stream webhook configured to omit x-api-key header; webhook endpoint allows omission.',
  );
}

const passed = results.filter(result => result.ok).length;
const failed = results.filter(result => !result.ok).length;

console.log('=== Stream/Supabase/Frontend parity report ===');
for (const result of results) {
  const prefix = result.ok ? '✅' : '❌';
  console.log(`${prefix} ${result.label}`);
  console.log(`   ${result.detail}`);
}
for (const message of warn) {
  console.log(`⚠️  ${message}`);
}

console.log(`\nSummary: ${passed} passed, ${failed} failed, ${warn.length} warning(s).`);

if (failed > 0) {
  process.exit(1);
}
