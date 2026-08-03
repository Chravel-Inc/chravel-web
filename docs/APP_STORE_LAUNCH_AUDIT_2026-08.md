# App Store Launch Audit — Security & Functionality

**Date:** 2026-08-02
**Scope:** Full pre-launch review of every core feature — chat, media, polls, tasks, calendar,
places & base camps, Explore, trip creation & cover photos, settings/account, AI concierge, the
invite flow (links, email, phone), and auth/super-admin — across both axes the launch cares about:
**(A) can any user's data or messages leak or be tampered with**, and **(B) does each feature work
as intended, including edge cases** ("what happens if someone adds/does X?").

**Method.** One deep-audit agent per feature read the actual code and migration SQL and diffed against
the repo's prior audits (reporting only still-live issues). Every RLS/policy claim that mocked tests
cannot prove was then verified **read-only against the production database** (`pg_policies`,
`pg_proc` grants, storage bucket config, `get_advisors`, view definitions). Findings are labeled
**CONFIRMED-LIVE**, **REFUTED**, or **needs-verify** accordingly. Mocked Vitest cannot prove RLS or
realtime behavior, so the live-DB pass is the authoritative layer for data-security claims.

---

## Remediation status (updated 2026-08-02)

**All 14 launch blockers below have been fixed on `claude/app-store-security-audit-e7u7og`,**
along with the P2 set and most of P3. Each fix shipped as its own reviewed commit with the build
gate (`lint && typecheck && build`), the migration linter, and related tests green.

Fixed: B1–B14; invite itinerary/poll gating; add-by-contact rate limit; poll active-member gate;
calendar version guard + RPC/RLS authz parity + all-day date + fetch-cap warning; media MIME
allowlist, size cap and file-upload repair; SSRF hardening (image-proxy, enhanced-ai-parser);
link-scheme XSS; concierge confirm-gating + preference-bypass; quiet hours (plus a **live
`should_send_notification` crash on `mentions`** found during verification); base-camp mirror
trigger; dead `addTripMember` removal; cover-photo orphan cleanup; task due-date/title guards;
and the DB hardening sweep (definer view, anon revokes, invite-code oracle).

**Not code — still needs a human:** enable *Leaked Password Protection* in the Supabase Auth
dashboard.

**Deliberately deferred, with reasons:**
- **`task_status` direct-write assignment gate.** A member can mark *themselves* complete on a task
  they were not assigned. Within-trip, no data exposure, and closing it means restructuring the
  policy set on the write path that two P1s were just fixed in — the regression risk outweighs the
  benefit this close to launch.
- **`options_locked_at` poll freeze.** Recorded but never enforced. Enforcing it would *change
  product behavior* (no adding options after the first vote); the alternative is dropping the
  column. That is a product call, not a bug fix.
- **Server-side `user_blocks` enforcement.** Blocking is currently a client-side message filter.
  Real enforcement means muting/banning at the Stream layer and deciding whether blocks are
  symmetric — a product decision with real UX consequences.
- **Non-consensual add-by-contact.** A matched user is added to a trip immediately with no accept
  step. Rate-limited now, but changing it to an invite/accept flow is a product decision.

## Executive summary

**Overall verdict: the security foundation is genuinely strong; the launch risk is concentrated in a
set of fixable feature-logic bugs — not in data isolation.** The scariest theoretical issues turned
out to be false alarms against the live database. But several core features are partially broken or
abusable in ways real users (or a curious attacker) will hit on day one, and a few of them are Apple
review requirements. None is an active data breach, but the highest-severity items should be fixed
before launch.

**What's rock-solid (verified against prod):**
- **No trip-membership privilege escalation.** The `trip_members` table has *no* UPDATE or INSERT
  policy live — members physically cannot promote themselves to admin or add themselves to a trip.
  (The risky policy the migration history hinted at is not actually deployed.)
- **Supabase's own security scanner is clean** on every classic leak check: no tables with RLS
  disabled, no exposed auth users, no orphaned policies, no `user_metadata` in policies.
- **Message isolation holds.** Chat runs on Stream; tokens are identity-only and reads are gated by
  channel membership, the webhook is HMAC-verified, and no author can be impersonated.
- **Write-gating is sound** across profiles, invites, polls, tasks, events, basecamps, media, and the
  concierge's pending-action buffer — every mutating RPC re-derives the actor from `auth.uid()` and
  rejects a spoofed user id; every write table pins `created_by/user_id = auth.uid()`.
- **OAuth tokens are walled off** (Google/Gmail token tables block all client reads), SSRF defenses
  on the main scrapers are DNS-rebinding-safe, all three payment webhooks verify signatures, CORS is
  an exact-match allowlist, and no secrets are hardcoded.
- **The AI concierge cannot cross tenants** — every AI mutation is re-authorized server-side with the
  caller's real identity and forced trip scope; the model can't forge privilege or reach another
  trip's data.
- **Explore is safely hidden** (super-admin/demo-only, mock data) and universal search is RLS-scoped.

**What must be fixed (ranked launch-blockers):** see the table below. The headline items: leaving a
trip does not actually revoke chat access; the chat moderation endpoint can ban any user app-wide;
the invite email function is an authenticated open relay; anonymous polls have no vote deduplication;
group/multi-assignee tasks fail to save; Block User is broken; account deletion leaves some PII; and
super-admin authorization diverges between the database and the edge functions.

**False alarms (verified NOT issues — don't spend time on these):** trip-member self-escalation;
payment tables "missing policies" (those tables don't exist); data-export hard-failure; concierge
pending-action ownership; the legacy insecure task RPC overload; the basecamp realtime channel-name
"mismatch."

---

## Launch blockers (P1 — fix before or in the launch window)

| # | Feature | Finding | Evidence | Status |
|---|---------|---------|----------|--------|
| B1 | Chat | **Leaving a trip does not revoke chat access.** `stream-reconcile-membership` loads expected members with no `status` filter, so a `status='left'` member is never pruned (and is re-added); `stream-token` never re-checks membership. A user who leaves keeps reading/posting in that private chat. | `stream-reconcile-membership/index.ts:255-258`; soft-delete `leave_trip` (`20260705020000`) | code-confirmed |
| B2 | Chat | **Moderation endpoint applies global bans + cross-trip deletes.** It only checks the *caller* owns `body.tripId`, then calls app-global `stream.banUser/shadowBan/deleteMessage` with no check the target/message belong to that trip. Any user creates a trip, then bans any victim app-wide. | `stream-moderation-action/index.ts:122-151` | code-confirmed |
| B3 | Invite | **Authenticated open email relay.** Any signed-in user can call `send-email-with-retry` with arbitrary recipients, subject, and raw HTML, from `noreply@chravel.app`, with no rate limit and no sender↔recipient check. Phishing + domain-reputation risk. | `send-email-with-retry/index.ts:43-225` | code-confirmed |
| B4 | Auth | **Super-admin authorization diverges.** RLS uses the revocable, audited `public.super_admins` table, but edge functions authorize super-admins by email against the `SUPER_ADMIN_EMAILS` env var. A DB revocation does not cut edge access; anyone whose account email matches a listed admin gains edge super-admin. | `_shared/superAdmins.ts:37-43`; callers `create-trip`, `get-trip-detail`, `restore-trip`, `check-subscription`, `lovable-concierge` | code-confirmed |
| B5 | Auth | **`get-trip-detail` lets a super-admin read any trip with no audit.** `isSuperAdmin || hasAccess` bypasses membership and returns the full trip row for any id, writing no `admin_audit_logs` entry. (Blast radius of B4.) | `get-trip-detail/index.ts:96-112` | code-confirmed |
| B6 | Calendar | **`undo_calendar_import_batch` bypasses the Pro/Event calendar gate.** SECURITY DEFINER, checks only active membership or creator — any attendee can `force_delete_edited` and wipe a shared event schedule (including others' edits). Reopens the hole `20260723140000` closed for direct deletes. | migration `20260713174500:42-56` | code-confirmed |
| B7 | Calendar | **`calendar-sync` edge function lets any member delete any event.** Uses the service-role client (RLS bypassed) with only a membership check. `delete_event` lets any active attendee delete any event on a Pro/Event trip. (Its create/update paths are already dead — they write a `metadata` column that doesn't exist.) | `calendar-sync/index.ts:49-260`; `trip_events.metadata` absent (verified) | CONFIRMED-LIVE (schema) |
| B8 | Cover photos | **AI cover generation always fails.** `generate-trip-cover` selects columns `title, category` that don't exist on `trips` (they're `name`, `categories`); every generation returns "Trip not found". Feature has never worked. | `generate-trip-cover/index.ts:167`; live `trips` cols verified | **CONFIRMED-LIVE** |
| B9 | Polls | **Anonymous polls have zero vote deduplication.** The `voters` array (the sole dedup source) is only written for non-anonymous polls, so on an anonymous poll every click increments the tally, single-select is bypassed, and votes can't be removed. Ballot-stuffing. | migration `20260218020000:174-176` | code-confirmed |
| B10 | Places | **Basecamp save reports success on failure.** The client ignores the RPC's `{success:false}` envelope, so an authorization denial shows "Basecamp saved!" while the DB is unchanged (reverts on the next refetch). | `basecampService.ts:405-429` | code-confirmed |
| B11 | Tasks | **Group/multi-assignee task creation fails.** New tasks default to group mode (all members selected); the client bulk-inserts `task_status` rows for *other* users, which the self-scoped RLS policy rejects — the task is created and everyone is notified, but with zero completion rows and an error toast. | `useTripTasks.ts:668-706`; `task_status` self-only policy verified | **CONFIRMED-LIVE** |
| B12 | Tasks | **Editing a task collides and assignees can't be removed.** `task_assignments` has only INSERT/SELECT policies (no UPDATE/DELETE), so the edit path's delete is a no-op and the re-insert hits a duplicate-key error — editing even a title throws; unassigning is impossible. | `useTripTasks.ts:913-937`; `task_assignments` policies verified | **CONFIRMED-LIVE** |
| B13 | Settings | **Block User is broken (Apple 1.2 safety requirement).** `user_blocks` foreign keys target `profiles.id` (a random UUID), but the code inserts `auth.uid()` (= `profiles.user_id`); those differ for ~116/117 users, so the insert fails the FK. Blocking an abuser silently errors. | `userSafetyService.ts:70-91`; FK + `id≠user_id` verified (117 rows, 1 match) | **CONFIRMED-LIVE** |
| B14 | Settings | **Account deletion leaves PII (Apple data-deletion requirement).** Anonymize omits `real_name` and `job_title` (both exist and can still surface a deleted user's real name to co-members); the immediate delete path skips push-token tables and ~15 other PII tables the cron path clears, and targets a non-existent `push_subscriptions` table. | `delete-account/index.ts:150-214`; columns + FK verified | CONFIRMED-LIVE (schema) |

---

## P2 — serious but narrower

- **Invite / add-by-contact** (`add-trip-member-by-contact`): distinct `USER_NOT_FOUND` vs success responses form an email/phone→account **enumeration oracle**; a hit adds the person as an active member immediately (no accept step); no rate limit. Fix: uniform response, rate limit, invite/accept step.
- **Invite preview** (`get-invite-preview`, no auth): returns up to 8 itinerary rows (title/time/location) and 5 poll questions for any valid code. Product decision — gate itinerary/polls behind auth if unintended.
- **Polls** vote RPCs accept `status='left'` members (no active-status filter, unlike `append_poll_option`) → a removed member can still skew a group vote.
- **Calendar**: optimistic version-concurrency is silently disabled on the primary edit path (last-write-wins); `update_event_with_version` authz contradicts the RLS gate (consumer members and coordinators are rejected via the versioned path).
- **Media — no MIME allowlist on `trip-media`** (verified `allowed_mime_types=null`): an active member can upload `text/html`/`image/svg+xml` and it's served with that content-type from the storage origin (stored-XSS on `*.supabase.co`, cross-origin from the app). Fix: set an image/video allowlist on the bucket + force safe content-type.
- **Media — storage quota is client-only** (verified `file_size_limit=null`): a direct `.upload()` bypasses all tier limits; the quota key is read from client-controlled metadata. Fix: enforce in an edge function / bucket `file_size_limit`.
- **Media — file import is broken**: `file-upload` returns a public URL for a `trip-files` bucket that **doesn't exist** (verified), so smart/calendar file import fails; writer/reader column names also mismatch.
- **Media / Calendar SSRF hardening**: `image-proxy` and `enhanced-ai-parser` use string-prefix host checks (no DNS re-resolution), unlike the rebinding-safe shared validator. Fix: route both through `validateExternalUrlBeforeFetch`.
- **Places — stored XSS via `javascript:` link URL**: saved link URLs aren't scheme-checked and render as `<a href>`; a member can save a `javascript:` link that executes on another member's click. Fix: allowlist `http(s)` on save + render.
- **Places — dual basecamp schema staleness**: Pro-trip header and the export read the legacy `trips.basecamp_*` columns while the panel writes `trip_base_camps`; a 2nd camp, a deletion, or a failed legacy mirror shows a wrong/missing base camp on those surfaces.
- **Concierge F1**: `createBroadcast` (fans out to every member) and `settleExpense` (irreversible) are **not confirmation-gated**, so a prompt-injection payload fed back through trip-content search could trigger them. Fix: add both to the confirmation allowlist.
- **Concierge F2**: the `tripContext` request body is trusted verbatim, letting a crafted request inject `userPreferences` and bypass the premium-preferences paywall (own-session only, not cross-tenant). Fix: drop/strip client `tripContext`.
- **Settings — Quiet Hours never enforced** server-side (`should_send_notification` ignores the columns) → notifications 24/7 despite the setting.
- **Settings — blocking is client-side-only** (a local message filter); a second device or the blocked user still sees/sends. Fix: enforce `user_blocks` server-side both directions.
- **Explore — `artifact-search`/`ai-search`** use the service-role client with a manual membership check; isolation now depends entirely on the RPC bodies strictly filtering `p_trip_id`.

## P3 — polish / hardening (representative)

- **DB hardening (verified live):** `billing_webhook_ops_dashboard` is a SECURITY DEFINER view readable by anon/authenticated (exposes only aggregate webhook-failure counts, no PII — but it's the advisor's one ERROR); `check_invite_code_exists` is still anon-executable (a revoke migration exists but hasn't been applied to prod); leaked-password protection is disabled in Auth settings; `super_admins`/`entitlement_audit_log`/`webhook_events` are discoverable (rows still RLS-gated) via the anon GraphQL key (part of a ~118-table anon-exposure sweep).
- **Cover photos:** replacing a cover orphans the old (public) storage object; the public `trip-covers` bucket allows anon object enumeration; server accepts an arbitrary `cover_image_url`.
- **Polls:** `options_locked_at` freeze is recorded but never enforced; `remove_vote` ignores closed/expired state; no server-side poll-option validation.
- **Tasks:** `task_status` direct writes bypass the assignment gate + version; `task_assignments` INSERT has no role/assignee-membership check (notification-spam vector); due-date picker disables "today"; no server-side title length check.
- **Calendar:** `update_event_with_version` declares a UUID trip_id but the column is `text` (throws on non-UUID ids); all-day events render one day early for negative-UTC viewers; `getTripEvents` silently truncates at 1000 rows; Google Calendar sync is a connection-only stub (flag off — don't advertise it).
- **Auth:** `tripService.addTripMember` is dead code that would fail closed (delete or route via RPC); client admin UI is unlocked from an email env var (UX-only).
- **Concierge:** auto-confirm churns on the `bulkDeleteCalendarEvents` preview row; `config.systemPrompt` full-override is gated on the same env super-admin divergence; SSRF DNS-rebinding TOCTOU.
- **Explore:** the `allowDemoPreview` gate is client-only and self-activatable (but leaks only mock data — keep the demo⇔mock invariant).

---

## Live-database verification ledger (read-only, production)

**Confirmed-live problems:** AI-cover column mismatch (B8); `task_status` self-only policy (B11); `task_assignments` missing UPDATE/DELETE (B12); `user_blocks` FK → `profiles.id` with `id≠user_id` (B13); `trip-media` bucket has no MIME allowlist and no size limit; `trip-files`/`receipts`/`user-data-exports` buckets don't exist (broken file import); `trip_events.metadata` missing + `trip_id` is `text` (calendar bugs); `billing_webhook_ops_dashboard` DEFINER view readable by anon/authenticated; `check_invite_code_exists` still anon-executable; leaked-password protection off.

**Refuted (false alarms):** `trip_members` privilege escalation (no UPDATE/INSERT policy live); payment tables "missing policies" (tables don't exist); data-export hard-fail (`email`/`phone` are granted to `authenticated`); concierge pending-action ownership (resolve policy pins `user_id=auth.uid()` live); legacy 3-arg `toggle_task_status` (not deployed); basecamp realtime channel-name divergence (both bindings fire; redundant, not broken).

**Verified solid:** Supabase security advisor clean on all leak checks; profiles/profiles_public write-gating and PII gating; `gmail_accounts` OAuth-token lockdown; `trip_pending_actions` insert pinning; `trip-media` private + member-gated; all mutating RPCs `auth.uid()`-derived.

---

## Recommended fix sequencing

1. **Before submission (safety + store requirements):** B13 Block User, B14 account-deletion PII, B2 moderation scope, B1 chat leave-revocation, B3 email relay. These are Apple-review-visible or abuse-prone.
2. **Launch window (core features + integrity):** B11/B12 tasks, B9 poll dedup, B10 basecamp save, B6/B7 calendar delete-gating, B4/B5 super-admin reconciliation, B8 AI cover (or keep its flag off).
3. **Fast-follow:** the P2 set (add-by-contact oracle + rate limits, media MIME/quota, SSRF hardening, stored-XSS link scheme, concierge gating, quiet-hours).
4. **Hardening sweep:** the P3 DB items (DEFINER view lockdown, anon revoke sweep, leaked-password toggle) — low regression risk, batchable into one migration.

Each fix should ship as the smallest correct change at the right layer (a targeted migration for RLS/RPC items; an edge-function or client change otherwise), with a reproduction test, and — for the RLS items — re-verified with the same `pg_policies` query used here. Because merging to `main` auto-deploys to production, these should go through the normal migration review + CI drift gates before merge.

---

*Prepared by an automated multi-agent audit (12 per-feature agents with adversarial verification) plus
read-only production-database confirmation. Prior audit docs in `docs/` were treated as potentially
stale and re-verified against current code and the live schema.*
