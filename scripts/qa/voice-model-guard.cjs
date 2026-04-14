#!/usr/bin/env node
/* eslint-disable no-console */
const fs = require('node:fs');
const path = require('node:path');

const repoRoot = path.resolve(__dirname, '..', '..');

const SCAN_DIRS = [
  'agent/src',
  'src',
  'supabase/functions',
  '.github/workflows',
  '.env.example',
  '.env.production.example',
  'agent/.env.example',
  'docs/ops/LIVEKIT_VOICE_READINESS_RUNBOOK.md',
];

const TEXT_EXTENSIONS = new Set([
  '.ts',
  '.tsx',
  '.js',
  '.cjs',
  '.mjs',
  '.json',
  '.md',
  '.yml',
  '.yaml',
  '.toml',
  '.example',
]);

const CANONICAL_MODEL = 'gemini-live-2.5-flash-native-audio';
const LEGACY_MODELS = [
  'gemini-3.1-flash-live-preview',
  'gemini-2.5-flash-native-audio-preview-12-2025',
];

const deprecatedPatterns = [
  /media_chunks/g,
  /mediaChunks/g,
  /realtime_input\.media_chunks/g,
  /generateReply\(/g,
  /generate_reply\(/g,
];

const modelLiteralPattern = /gemini-(?:live-[a-z0-9.-]+|3\.1-flash-live-preview)/g;

function listFiles(entry) {
  const absolute = path.join(repoRoot, entry);
  if (!fs.existsSync(absolute)) return [];
  const stat = fs.statSync(absolute);
  if (stat.isFile()) return [absolute];

  const out = [];
  const stack = [absolute];
  while (stack.length) {
    const current = stack.pop();
    const children = fs.readdirSync(current, { withFileTypes: true });
    for (const child of children) {
      if (child.name === 'node_modules' || child.name === 'dist' || child.name === '.git') continue;
      const full = path.join(current, child.name);
      if (child.isDirectory()) stack.push(full);
      else out.push(full);
    }
  }
  return out;
}

function shouldScan(filePath) {
  if (filePath.includes('__tests__')) return false;
  const ext = path.extname(filePath);
  if (TEXT_EXTENSIONS.has(ext)) return true;
  return /\.env(\..+)?\.example$/.test(filePath);
}

const files = SCAN_DIRS.flatMap(listFiles).filter(shouldScan);
const errors = [];
const modelUsage = new Map();

for (const file of files) {
  const rel = path.relative(repoRoot, file).replaceAll('\\\\', '/');
  const text = fs.readFileSync(file, 'utf8');

  for (const pattern of deprecatedPatterns) {
    const m = text.match(pattern);
    if (m) {
      errors.push(`${rel}: deprecated pattern detected (${pattern})`);
    }
  }

  for (const legacy of LEGACY_MODELS) {
    if (text.includes(legacy)) {
      errors.push(`${rel}: deprecated/experimental model string present (${legacy})`);
    }
  }

  const models = text.match(modelLiteralPattern) || [];
  for (const model of models) {
    if (!modelUsage.has(model)) modelUsage.set(model, []);
    modelUsage.get(model).push(rel);
  }
}

const modelKeys = [...modelUsage.keys()];
const conflictingModels = modelKeys.filter(model => model !== CANONICAL_MODEL);
if (conflictingModels.length > 0) {
  for (const model of conflictingModels) {
    const filesForModel = modelUsage.get(model) || [];
    errors.push(
      `conflicting realtime voice model literal found: ${model} in ${[...new Set(filesForModel)].join(', ')}`,
    );
  }
}

const canonicalSource = path.join('agent', 'src', 'voiceModel.ts');
if (
  !files.some(file => path.relative(repoRoot, file).replaceAll('\\\\', '/') === canonicalSource)
) {
  errors.push('canonical voice model source file missing: agent/src/voiceModel.ts');
}

if (errors.length > 0) {
  console.error('Voice stack guard failed:\n');
  for (const err of errors) console.error(`- ${err}`);
  process.exit(1);
}

console.log('voice-model-guard: OK');
console.log(`canonical model: ${CANONICAL_MODEL}`);
