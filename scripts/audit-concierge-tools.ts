#!/usr/bin/env node
/**
 * Concierge Tool 5-File Sync Audit
 *
 * Adding a new AI concierge tool requires synchronized changes across 5 places
 * (see agent_memory.jsonl entry #26). Missing one causes silent failures:
 *   - "Works in text but not voice"
 *   - "Confirm card appears but no data is written"
 *   - "Tool exists in registry but is never loaded by the classifier"
 *
 * This script statically verifies the cross-file invariants. Run in CI to
 * prevent drift.
 *
 * Files audited:
 *   1. supabase/functions/_shared/concierge/toolRegistry.ts
 *        - ALL_TOOL_DECLARATIONS (single source of truth)
 *        - MUTATING_TOOL_NAMES
 *        - QUERY_CLASS_TOOLS
 *   2. supabase/functions/_shared/functionExecutor.ts
 *        - case '<toolName>': blocks
 *   3. supabase/functions/_shared/voiceToolDeclarations.ts
 *        - (auto-derived from registry via getToolsForVoice — sanity check only)
 *   4. src/hooks/usePendingActions.ts
 *        - switch (action.tool_name) handler for pending-buffer writes
 *
 * Exit codes:
 *   0 = all invariants hold (warnings may be present)
 *   1 = hard violation — missing executor case, dead declaration, etc.
 */

import * as fs from 'fs';
import * as path from 'path';

const REPO = process.cwd();
const TOOL_REGISTRY = path.join(REPO, 'supabase/functions/_shared/concierge/toolRegistry.ts');
const FUNCTION_EXECUTOR = path.join(REPO, 'supabase/functions/_shared/functionExecutor.ts');
const VOICE_DECLS = path.join(REPO, 'supabase/functions/_shared/voiceToolDeclarations.ts');
const USE_PENDING_ACTIONS = path.join(REPO, 'src/hooks/usePendingActions.ts');

function read(p: string): string {
  if (!fs.existsSync(p)) {
    console.error(`❌ Missing required file: ${path.relative(REPO, p)}`);
    process.exit(1);
  }
  return fs.readFileSync(p, 'utf8');
}

// ---------------------------------------------------------------------------
// Parsers (string-scan; the source files are stable enough that a real TS AST
// is not required for these specific patterns)
// ---------------------------------------------------------------------------

function parseDeclaredTools(src: string): string[] {
  // Matches:  name: 'toolName',  (inside ALL_TOOL_DECLARATIONS objects)
  const re = /^\s{4}name:\s*'([a-zA-Z0-9_]+)'/gm;
  const names: string[] = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(src)) !== null) names.push(m[1]);
  return names;
}

function parseMutatingTools(src: string): string[] {
  const start = src.indexOf('MUTATING_TOOL_NAMES');
  if (start === -1) return [];
  const blockEnd = src.indexOf(']);', start);
  if (blockEnd === -1) return [];
  const block = src.slice(start, blockEnd);
  return [...block.matchAll(/'([a-zA-Z0-9_]+)'/g)].map(m => m[1]);
}

function parseQueryClassTools(src: string): Set<string> {
  // Anchor on the actual const declaration, not the JSDoc reference above it.
  const start = src.indexOf('const QUERY_CLASS_TOOLS');
  if (start === -1) return new Set();
  const blockEnd = src.indexOf('\n};', start);
  if (blockEnd === -1) return new Set();
  const block = src.slice(start, blockEnd);
  // 'all' is the sentinel value for trip_summary — not a tool name.
  const SENTINELS = new Set(['all']);
  return new Set(
    [...block.matchAll(/'([a-zA-Z0-9_]+)'/g)].map(m => m[1]).filter(name => !SENTINELS.has(name)),
  );
}

function parseExecutorCases(src: string): string[] {
  const re = /^\s{4}case\s+'([a-zA-Z0-9_]+)'\s*:\s*\{/gm;
  const names: string[] = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(src)) !== null) names.push(m[1]);
  return names;
}

function parsePendingBufferWriters(src: string): Set<string> {
  // Tools whose executor case body contains an insert to trip_pending_actions.
  // Bucket each case body, then within each body check whether the case both
  // references trip_pending_actions AND calls .insert() or .upsert().
  // Pure .select() / .update() / .delete() on the table are not "pending writes"
  // for the purposes of memory #25 (only inserts spawn confirm cards).
  const lines = src.split('\n');
  const bodies = new Map<string, string[]>();
  let currentCase: string | null = null;
  let depth = 0;
  for (const line of lines) {
    const caseMatch = line.match(/^\s{4}case\s+'([a-zA-Z0-9_]+)'\s*:\s*\{/);
    if (caseMatch) {
      currentCase = caseMatch[1];
      depth = 1;
      bodies.set(currentCase, []);
      continue;
    }
    if (currentCase) {
      bodies.get(currentCase)!.push(line);
      for (const ch of line) {
        if (ch === '{') depth++;
        else if (ch === '}') depth--;
      }
      if (depth <= 0) currentCase = null;
    }
  }
  const writers = new Set<string>();
  for (const [name, body] of bodies) {
    const joined = body.join('\n');
    const touchesTable = joined.includes("'trip_pending_actions'");
    const inserts = /\.insert\s*\(|\.upsert\s*\(/.test(joined);
    if (touchesTable && inserts) writers.add(name);
  }
  return writers;
}

function parsePendingActionHandlerCases(src: string): Set<string> {
  // Inside usePendingActions.ts there's `switch (action.tool_name) { case '...': ... }`
  // We collect every `case 'X':` between the first switch and its matching close.
  const switchIdx = src.indexOf('switch (action.tool_name)');
  if (switchIdx === -1) return new Set();
  // Heuristic: find the *first* "default:" after the switch — that's the end of the
  // primary execute switch.
  const defaultIdx = src.indexOf('default:', switchIdx);
  const block = src.slice(switchIdx, defaultIdx === -1 ? src.length : defaultIdx);
  return new Set([...block.matchAll(/case\s+'([a-zA-Z0-9_]+)'/g)].map(m => m[1]));
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

function main(): void {
  const registrySrc = read(TOOL_REGISTRY);
  const executorSrc = read(FUNCTION_EXECUTOR);
  const voiceSrc = read(VOICE_DECLS);
  const pendingSrc = read(USE_PENDING_ACTIONS);

  const declared = parseDeclaredTools(registrySrc);
  const declaredSet = new Set(declared);
  const mutating = new Set(parseMutatingTools(registrySrc));
  const queryClassTools = parseQueryClassTools(registrySrc);
  const executorCases = parseExecutorCases(executorSrc);
  const executorSet = new Set(executorCases);
  const pendingWriters = parsePendingBufferWriters(executorSrc);
  const pendingHandlerCases = parsePendingActionHandlerCases(pendingSrc);

  // Voice declarations are auto-derived; just sanity-check the import is wired.
  const voiceWired = voiceSrc.includes("from './concierge/toolRegistry.ts'");

  const errors: string[] = [];
  const warnings: string[] = [];

  // (A) Every declared tool must have an executor case.
  for (const name of declared) {
    if (!executorSet.has(name)) {
      errors.push(
        `[A] Tool '${name}' is declared in toolRegistry.ts but has no case in functionExecutor.ts. Calls will fail at runtime.`,
      );
    }
  }

  // (B) Every executor case must correspond to a declared tool.
  for (const name of executorCases) {
    if (!declaredSet.has(name)) {
      errors.push(
        `[B] Executor case '${name}' has no declaration in toolRegistry.ts. The case is dead code (model can never invoke it).`,
      );
    }
  }

  // (C) Every QUERY_CLASS_TOOLS reference must be a real declared tool.
  for (const name of queryClassTools) {
    if (!declaredSet.has(name)) {
      errors.push(
        `[C] QUERY_CLASS_TOOLS references '${name}' but no such tool is declared. This typo silently breaks tool selection.`,
      );
    }
  }

  // (D) Voice path must be wired to the registry (no inline duplicate declarations).
  if (!voiceWired) {
    errors.push(
      `[D] voiceToolDeclarations.ts is not importing from concierge/toolRegistry.ts. The voice path has likely drifted — re-derive via getToolsForVoice().`,
    );
  }

  // (W1) Tools that write to trip_pending_actions must have a confirm-handler case.
  for (const name of pendingWriters) {
    if (!pendingHandlerCases.has(name)) {
      warnings.push(
        `[W1] '${name}' inserts into trip_pending_actions but has no case in usePendingActions.ts. Confirm card may appear and silently produce no data (see agent_memory.jsonl #25).`,
      );
    }
  }

  // (W2) Tools in MUTATING_TOOL_NAMES that aren't reachable from any query class.
  // (Excludes universals; flagged purely as a discoverability hint.)
  for (const name of mutating) {
    if (!queryClassTools.has(name)) {
      // trip_summary uses 'all', so the tool is still reachable there — soft warning only.
      warnings.push(
        `[W2] Mutating tool '${name}' is not in any QUERY_CLASS_TOOLS subset (only reachable via trip_summary 'all'). Verify this is intentional.`,
      );
    }
  }

  // (W3) Declared tools not referenced by any query class and not 'all'-fallback only.
  for (const name of declared) {
    if (!queryClassTools.has(name)) {
      // Don't double-report mutating tools (W2 already covers them).
      if (!mutating.has(name)) {
        warnings.push(
          `[W3] Tool '${name}' is declared but not listed in any QUERY_CLASS_TOOLS subset. Only loaded under trip_summary ('all') fallback.`,
        );
      }
    }
  }

  console.log(
    `Concierge tool audit: ${declared.length} declared · ${executorCases.length} executor cases · ${queryClassTools.size} query-class refs · ${pendingWriters.size} pending-buffer writers · ${pendingHandlerCases.size} confirm-handler cases · ${mutating.size} mutating · voice-wired: ${voiceWired}`,
  );

  if (warnings.length > 0) {
    console.warn('\n⚠️  Warnings:');
    for (const w of warnings) console.warn(`   ${w}`);
  }

  if (errors.length > 0) {
    console.error('\n❌ Hard violations:');
    for (const e of errors) console.error(`   ${e}`);
    process.exit(1);
  }

  console.log('\n✅ All hard invariants hold.');
}

main();
