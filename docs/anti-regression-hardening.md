# Anti-Regression Hardening Protocol

Use this checklist before and after debugging production regressions. It complements `DEBUG_PATTERNS.md`, `LESSONS.md`, and the merge preflight rules in `AGENTS.md`.

## Before writing code

1. Read `DEBUG_PATTERNS.md` and `LESSONS.md` for matching signatures.
2. Classify the bug into **one primary layer**:
   - UI containment
   - auth hydration
   - query/cache
   - RLS/embed
   - edge function
   - native routing
   - share/OG
   - Stream transport
3. Trace affected data end-to-end: DB column → generated/shared types → hook/service → prop/view model → render.
4. Search recent history for identical fixes:
   - `git log --oneline --since="30 days ago" -- <path>`
   - `rg "<symptom|function|queryKey|route>" DEBUG_PATTERNS.md LESSONS.md claude-progress.txt`
5. If the same bug class was fixed recently, explain why the prior fix did not close the root cause before patching.

## Mandatory invariants

- Auth session must be fully hydrated before auth-gated fetches; never flash false Trip Not Found.
- Loading, Not Found, and Empty are distinct UI states.
- Trip existence is not trip access; verify active `trip_members` before trip mutations.
- Demo mode mock data is never modified; authenticated behavior uses parallel data paths.
- One query key owns one data shape; prefetch and fetch paths must share the same mapper.
- Create/CTA buttons must not be disabled by unrelated list-query loading states.
- RLS-heavy PostgREST embeds must not sit on critical parent-list paths; fetch parents first and soft-fail related rows with timeouts.
- Every mutation trigger must explicitly choose Stream or legacy transport mode when both can exist.
- Concierge tools require five-file sync: registry → implementation → confirmation → renderer → voice.
- Native deferred routing must preserve richer pending notification paths over generic initial URLs.
- Native OAuth return detection is session-bearing only (`/auth-callback`, `/auth#…`, `/auth?code=…`); bare `/auth` is not OAuth.
- Mobile chat composers are `flex-shrink-0` siblings of scroll containers, never children inside them.
- Share/invite previews must render without a backing `trip_invites` row and use `cover_image_url` for OG when present.

## Mobile/PWA layout triage

Fix structure before padding. Before changing spacing, answer:

- Is the broken element inside a scrollable parent it should not be in?
- Is pull-to-refresh armed on `window.scrollY` inside a fixed shell?
- Is `safe-area-inset-bottom` applied more than once?
- Is keyboard offset applied while the keyboard is closed?

Target state: the message list scrolls, the composer stays pinned, and only the composer moves with the keyboard.

## Pre-PR verification checklist

- [ ] Repro established by a focused test or explicit manual steps.
- [ ] Root cause identified at the correct layer, not just a symptom.
- [ ] Regression test added for the exact failure mode when practical.
- [ ] `npm run lint:check`, `npm run typecheck`, and `npm run build` pass, or failures are documented as pre-existing/environmental.
- [ ] Adjacent flows checked: refresh, re-entry, role change, former member, mobile Safari/Capacitor where relevant.
- [ ] Schema changes: generated types updated and migration lint/verification completed.
- [ ] RLS changes: active member retains access and former member is denied.
- [ ] Share/OG changes: verify unfurls with and without cover photo.
- [ ] Native routing changes: test notification cold start, OAuth sign-in, and icon launch.

## Stop-and-investigate red flags

- The same bug class was fixed in the last 30 days.
- Infinite spinner has no visible error path.
- Behavior works for admins but not members.
- Behavior works on iPhone but not iPad.
- Concierge shows `undefined is not an object` or equivalent cache-shape errors.
- Push works in foreground but not on cold start.

## CI gates to add or enforce

- Unit: `isNativeAuthReturnPath` rejects bare `/auth`.
- Unit: `preferExistingDeferredPath` keeps richer notification paths.
- Unit: `mapAiQueryRowsToConciergeMessages` handles null/undefined content.
- Unit: `fetchTripRoles` avoids RLS-heavy embeds on critical paths.
- Integration: OG preview returns trip cover URL when `cover_image_url` is set.
- E2E smoke: cold-start notification routes to trip/chat on device.
- Contract: every `voiceToolDeclaration` has a `functionExecutor` case.
- Contract: query key → mapper function is 1:1 with no raw DB rows cached.
