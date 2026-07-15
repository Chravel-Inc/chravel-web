# Systemic Hardening Phase 1 Map

This document records the Phase 1 predicate consolidation follow-up to `docs/anti-regression-hardening.md`.

## Consolidated predicates

| Predicate | Canonical source | Historical failure encoded |
| --- | --- | --- |
| OAuth/native auth return detection | `src/lib/nativeRoutingGuards.ts` → `isNativeAuthReturnPath` | Bare `/auth` is not OAuth; `/auth-callback`, `/auth?code=…`, and `/auth#access_token=…` are return paths. |
| Host/domain allowlist matching | `src/lib/nativeRoutingGuards.ts` → `hostMatchesAllowlistedDomain` / `urlHostMatchesAllowlistedDomain` | Reject suffix bypasses such as `evilsupabase.co`, `notsupabase.co`, and `chravel.app.evil.com`. |
| Deferred native route precedence | `src/lib/nativeRoutingGuards.ts` → `preferExistingDeferredPath` | Preserve richer notification routes over generic initial URLs during native cold-start races. |

## Files that previously reimplemented matching logic

| File | Previous pattern | Current state |
| --- | --- | --- |
| `src/utils/imageOptimization.ts` | Local exact/`.endsWith('.supabase.co')` and Unsplash checks. | Imports `urlHostMatchesAllowlistedDomain`. |
| `src/hooks/useTripCoverPhoto.ts` | Inline URL host parsing with Supabase/Unsplash `.endsWith()` checks. | Imports `urlHostMatchesAllowlistedDomain`. |
| `src/pages/Healthz.tsx` | Inline Lovable preview hostname `.endsWith()`. | Imports `hostMatchesAllowlistedDomain`. |
| `src/utils/env.ts` | Inline Lovable preview hostname `.endsWith()`. | Imports `hostMatchesAllowlistedDomain`. |
| `src/pages/AuthCallbackPage.tsx` | Inline `window.location.hash.includes('access_token')`. | Imports `isNativeAuthReturnPath` for session-bearing auth hash detection. |

## Guardrail

`npm run qa:native-routing-guards` scans `src/` and fails when a new host/domain `.endsWith()` comparison appears outside `src/lib/nativeRoutingGuards.ts`, or when auth-return matching is redefined inline instead of importing the canonical matcher. The command is wired into `npm run qa:guardrails`.

## Verification

- `npx vitest run src/lib/__tests__/nativeRoutingGuards.test.ts src/hooks/__tests__/useTripCoverPhoto.test.tsx`
- `npm run qa:native-routing-guards`
