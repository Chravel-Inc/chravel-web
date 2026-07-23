import { describe, expect, it } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';

/**
 * 2026-07-23 — Former-member access hardening.
 *
 * `leave_trip()` is a soft delete: it keeps the `trip_members` row and sets
 * `status = 'left'`. Any edge function that verifies caller membership with a bare
 * `.eq('user_id', …)` (and no status filter) therefore still treats a departed
 * member as active — because the `trip_members` SELECT policy
 * "Users can view their trip memberships" (USING auth.uid() = user_id) returns the
 * caller's own row regardless of status, and service-role clients bypass RLS entirely.
 *
 * The fix routes every caller-authorization gate through the active-status filter
 * `.or('status.is.null,status.eq.active')`, matching `is_active_trip_member`
 * (status IS NULL covers legacy rows created before the column existed).
 *
 * These tests (1) prove the filter landed in each fixed function and (2) act as a
 * standing guardrail: any NEW single-row `trip_members` caller check that omits the
 * status filter fails CI unless explicitly justified in ALLOWLIST below.
 */

const repoRoot = resolve(__dirname, '../../../..');
const read = (path: string) => readFileSync(resolve(repoRoot, path), 'utf8');

const STATUS_FILTER = ".or('status.is.null,status.eq.active')";

// Every function whose caller-authorization gate was hardened in this pass.
const FIXED_FUNCTIONS = [
  'supabase/functions/stream-join-channel/index.ts',
  'supabase/functions/calendar-sync/index.ts',
  'supabase/functions/ai-answer/index.ts',
  'supabase/functions/ai-search/index.ts',
  'supabase/functions/ai-ingest/index.ts',
  'supabase/functions/artifact-search/index.ts',
  'supabase/functions/artifact-ingest/index.ts',
  'supabase/functions/enhanced-ai-parser/index.ts',
  'supabase/functions/document-processor/index.ts',
  'supabase/functions/update-location/index.ts',
  'supabase/functions/generate-embeddings/index.ts',
  'supabase/functions/receipt-parser/index.ts',
  'supabase/functions/process-receipt-ocr/index.ts',
  'supabase/functions/export-trip/index.ts',
  'supabase/functions/web-push-send/index.ts',
  'supabase/functions/stream-moderation-action/index.ts',
  'supabase/functions/create-notification/index.ts',
  'supabase/functions/_shared/concierge/tripAccess.ts',
  'supabase/functions/_shared/validation.ts',
  'supabase/functions/_shared/functionExecutor.ts',
];

/**
 * Intentional exceptions — a single-row trip_members caller check that omits the
 * status filter here is CORRECT. Each entry MUST carry a justification; adding a new
 * one is a deliberate security decision, not a convenience.
 */
const ALLOWLIST: Record<string, string> = {
  // Fallback arm of `fetchTripMemberAccessRow`: the PRIMARY query selects `status`
  // and the caller evaluates it; this arm only runs if the status column is missing
  // (legacy DB). Status-aware at the helper level.
  'supabase/functions/get-trip-preview/index.ts': 'status-aware helper with legacy-column fallback',
  'supabase/functions/join-trip/index.ts': 'status-aware helper with legacy-column fallback',
  // Reconciliation must let a just-departed user trigger their own Stream removal; it
  // only syncs Stream membership to trip_members and can never grant data access.
  'supabase/functions/stream-reconcile-membership/index.ts': 'membership reconciliation semantics',
};

describe('former-member access hardening (2026-07-23)', () => {
  it('adds the active-status filter to every hardened caller-authorization gate', () => {
    for (const file of FIXED_FUNCTIONS) {
      const src = read(file);
      expect(src, `${file} must gate membership on active status`).toContain(STATUS_FILTER);
    }
  });

  it('leaves no single-row trip_members caller check without a status filter (guardrail)', () => {
    const functionsDir = resolve(repoRoot, 'supabase/functions');

    const walk = (dir: string): string[] => {
      const out: string[] = [];
      for (const entry of readdirSync(dir, { withFileTypes: true })) {
        const full = resolve(dir, entry.name);
        if (entry.isDirectory()) out.push(...walk(full));
        else if (entry.name.endsWith('.ts') && !entry.name.endsWith('.test.ts')) out.push(full);
      }
      return out;
    };

    // Matches a `.from('trip_members') … .single()/.maybeSingle()` chain.
    const chainRe = /from\(\s*['"]trip_members['"]\s*\)[\s\S]*?\.(maybeSingle|single)\s*\(/g;

    const violations: string[] = [];
    for (const absPath of walk(functionsDir)) {
      const rel = absPath.slice(repoRoot.length + 1);
      if (rel in ALLOWLIST) continue;
      const src = readFileSync(absPath, 'utf8');
      let match: RegExpExecArray | null;
      while ((match = chainRe.exec(src)) !== null) {
        const chain = match[0];
        const isPerUserCheck = /\.eq\(\s*['"]user_id['"]/.test(chain);
        const hasStatusFilter = /status/.test(chain);
        if (isPerUserCheck && !hasStatusFilter) {
          const line = src.slice(0, match.index).split('\n').length;
          violations.push(`${rel}:${line}`);
        }
      }
    }

    expect(
      violations,
      `Status-blind trip_members caller check(s) found. Add ${STATUS_FILTER} (or route through ` +
        `verifyTripMembership), or justify via ALLOWLIST:\n${violations.join('\n')}`,
    ).toEqual([]);
  });
});
