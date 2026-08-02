# Semantic Merge Debt Audit — 2026-08-02

Audit date: 2026-08-02  
Branch: `cursor/semantic-merge-debt-audit-3176`  
Base: `main` @ `220efb904`  
Prior audits: [`docs/semantic-merge-debt-audit-2026-05-31.md`](../semantic-merge-debt-audit-2026-05-31.md) (on `main`); Jul 26 re-audit on branch `cursor/semantic-merge-debt-audit-69a3` @ `8655c1e45` (PR #863 — **not merged to main**)  
Related recent work: synthetic-study P0 wave (#867), Concierge conversation-mode hide (#875), SMS/Twilio teardown, notifications Alerts deep-dive

Method: re-verify every Critical/High from the Jul 26 audit against current `main`; parallel subsystem exploration (payments/queryKeys, chat/calendar/permissions, Pro/Event/auth/push); direct source confirmation of every claim below. No product code changed in this pass — documentation-only.

Classification vocabulary:

| Class | Meaning |
|-------|---------|
| **Actual bug** | Confirmed incorrect behavior or silent no-op today |
| **Likely merge-debt smell** | Competing implementations coexist; intermittent or latent failure |
| **Optional cleanup** | Dead/zombie code or docs drift; low user risk if left alone |

Remediation timing:

| Timing | Meaning |
|--------|---------|
| **Fix now** | Production-risk; ship before related feature work |
| **Phase 1** | Critical cleanup batch |
| **Phase 2** | Architecture consolidation |
| **Phase 3** | Dead code / type cleanup |
| **Later** | Guardrails / hygiene after ownership is clear |

---

## Executive Summary

Overall assessment: **Regressed since July.** The Jul 26 score was **64/100**. None of the seven “still open Critical/High” items from that audit were closed. Two **new actual bugs** landed on top: (1) dashboard search navigates Pro trips to a non-existent `/pro-trip/:id` route while the rest of the app uses `/tour/pro/:id`, and (2) TripChat client-mirrors broadcasts *and* `stream-webhook` dual-writes them, but the client omits `metadata.stream_message_id`, so webhook idempotency misses the client row → duplicate `broadcasts` / notifications / search rows.

Severity score: **71 / 100**. Higher is worse (0–20 clean · 21–40 manageable · 41–65 material · 66–85 high-risk · 86–100 systemic). Score rose ~7 points because new silent production bugs appeared while the prior High backlog stayed open. The debt profile is still **partial migrations preserved by “accept both”**, concentrated at ownership boundaries: payments cache, permissions, notifications fanout, Pro/Event detail loading, Stream chat cutover debris.

Confidence level: **High** for Critical/High findings (verified in source with file:line evidence). Medium for some Medium smells where runtime repro was not available in this environment.

### Top 10 highest-risk areas

1. **Pro search navigation 404** — `Index.handleSearchTripSelect` → `/pro-trip/${id}`; App routes only `/tour/pro/:proTripId`. **NEW Actual bug.**
2. **Broadcast dual-write race** — client `recordBroadcastMirror` (no `stream_message_id`) + webhook insert (idempotent on that key) → duplicates. **NEW Actual bug.**
3. **Payments cache shape collision** — `usePayments` array vs `MobileTripPayments` `{payments, balanceSummary}` on the same `tripKeys.payments` key. **Still Critical.**
4. **Calendar permission dual-gate** — UI `useRolePermissions` (broad member allowlist) vs mutations `useMutationPermissions` / RPC. **Still High.**
5. **Calendar bulk-import push bypass** — client → `web-push-send` skips prefs/queue; AI `source_type` values also miss DB skip list → double fanout. **Still High + worsened.**
6. **Orphan `tripKeys.lineup`** — factory `eventLineup` vs live `event-lineup` (agenda-bug twin). **Still High.**
7. **Pro/Event detail list-find** — `userTrips.find` instead of `getTripById`; Event pages still lack `authLoading` gate. **Still High.**
8. **Authenticated shells seed from `generateTripMockData`** — real trip context gets mock basecamp/calendar/links. **Still High.**
9. **Dual entitlement stacks** — `useSubscription` (DB) vs `useConsumerSubscription` (edge). **Still High.**
10. **Permission SoT fanout** — RPC + role matrix + event organizer heuristics + inline `trip_admins` + Pro tab `user.proRole`. **Still High.**

---

## Status vs July 26 2026 audit

| Jul 26 finding | Status (2026-08-02) |
|----------------|---------------------|
| Payments dual cache shape | **Still open** — `paymentCacheUtils` still documents both shapes |
| Calendar UI vs mutation dual-gate | **Still open** — broader: desktop `useCalendarManagement` also bypasses mutation guard |
| Orphan `tripKeys.lineup` | **Still open** — identical strings |
| Pro/Event detail list-find | **Still open** — Pro added `authLoading`; Event did not |
| Broadcast dual contracts | **Partially improved** for trip UI classification; **worsened** with client+webhook double mirror |
| Calendar bulk import → `web-push-send` | **Still open** + AI source_type skip mismatch |
| `generateTripMockData` on auth shells | **Still open** |
| Dual entitlement hooks | **Still open** |
| Concierge settle/addExpense misses `paymentBalances` | **Still open** |
| ChannelChatView unused adapter | **Still open** (import present, inline mapper used) |
| chatAnalysisService → `trip_chat_messages` | **Still open** |
| MessageActions default `transportMode='legacy'` | **Still open** |
| `['events']` invalidate with no owner | **Still open** |
| FEATURE_LIMITS vs FREEMIUM_LIMITS | **Still dual** (parity-tested) |
| google-tts zombie | **Still present** (no SPA caller) |
| TripChat `transportMode="stream"` | **Still fixed** — do not re-flag |
| Orphaned `tripKeys.chat*` / agenda key | **Still fixed** — do not re-flag |
| `useTripMembers` wraps query | **Still fixed** — do not re-flag |

---

## Findings

### 1. Dashboard Pro search navigates to a non-existent route

1. **Title:** Index Pro search → `/pro-trip/:id` 404  
2. **Severity:** Critical  
3. **Category:** UI/UX conflict debt / actual bug / “accept both” route strings  
4. **Files involved:**
   - `src/pages/Index.tsx` (~655) — `navigate(\`/pro-trip/${tripId}\`)`
   - `src/App.tsx` (465–473) — routes `/tour/pro/:proTripId` (+ legacy `/tour/pro-:proTripId`)
   - Every other Pro entrypoint (`ProTripCard`, `NativePushRouter`, `NotificationsDialog`, `ArchivePage`, `JoinTrip`, `OrganizationDashboard`) uses `/tour/pro/...`
   - `src/pages/__tests__/IndexProTripNavigation.test.tsx` — only asserts mock IDs *could* form a canonical URL; **never imports Index**
5. **Why this looks like merge debt:** Canonical route was consolidated to `/tour/pro/:id` (with a redirect helper and route-order tests), but search selection kept an older `/pro-trip/` string. The “navigation test” was written against mock data strings, not the handler — classic accept-current-test + accept-incoming-route without wiring them.
6. **Exact conflicting logic:** Search select path ≠ App route table ≠ every other Pro deep link.
7. **User-facing risk:** Selecting a Pro trip from home search lands on a blank/404 route. Silent breakage for Pro users who search.
8. **Engineering risk:** Tests green while production path is wrong; future route renames won’t catch this string.
9. **Recommended fix:** Change Index to `navigate(\`/tour/pro/${tripId}\`)`. Rewrite the test to import/assert `handleSearchTripSelect` (or a extracted `resolveTripPath(tripType, id)` helper used by Index).
10. **Fix now or later:** **Fix now.**

---

### 2. Broadcast mirror: client + webhook both insert, idempotency broken

1. **Title:** Duplicate broadcast rows / notification fanout  
2. **Severity:** Critical  
3. **Category:** Conflicting side effects / “accept both” dual-write / actual bug  
4. **Files involved:**
   - `src/features/chat/components/TripChat.tsx` (~674–684) — after Stream send, calls `recordBroadcastMirror`
   - `src/services/broadcastMirrorService.ts` — inserts `{trip_id, created_by, message, priority, is_sent}` **without** `metadata.stream_message_id`; comment still claims “stream-webhook stays mention-only”
   - `supabase/functions/stream-webhook/index.ts` (~228–257) — dual-writes broadcasts when Stream message is broadcast; idempotent via `.contains('metadata', { stream_message_id })`
   - `supabase/functions/stream-webhook/broadcastFanout.ts` — builds row *with* `stream_message_id`
5. **Why this looks like merge debt:** Two branches each “fixed” missing fanout: client mirror (with stale “webhook is mention-only” comment) and webhook dual-write (newer). Accept-both left both paths live; only the webhook path sets the idempotency key.
6. **Exact conflicting logic:** Client insert has no `stream_message_id` → webhook lookup misses it → second insert → `notify_on_broadcast` can fire twice (fanout_event_key may or may not dedupe depending on key shape/timing).
7. **User-facing risk:** Duplicate Alerts/push for the same broadcast; duplicate search/export rows; “Seen by” / ack maps keyed by stream id may miss the client-only row.
8. **Engineering risk:** Comments lie about the architecture; next engineer will “fix” the wrong side.
9. **Recommended fix:** Pick **one** writer. Prefer webhook (already idempotent on stream id). Delete client `recordBroadcastMirror` for Stream sends *or* make client write `metadata.stream_message_id` and have webhook treat that as the sole SoT check. Update the service comment. Add an integration test: one Stream broadcast → exactly one `broadcasts` row.
10. **Fix now or later:** **Fix now.**

---

### 3. Payments share one query key with two incompatible cache shapes

1. **Title:** Desktop/mobile payments cache shape collision  
2. **Severity:** Critical  
3. **Category:** Conflicting state management / “accept both” architectural regression  
4. **Files involved:**
   - `src/hooks/usePayments.ts` — `PaymentMessage[]`
   - `src/components/mobile/MobileTripPayments.tsx` — `{ payments, balanceSummary }`
   - `src/lib/paymentCacheUtils.ts` — explicitly “Handles both cache shapes”
5. **Why this looks like merge debt:** Unchanged since Jul 26. Dual-shape helpers are a merge bandage, not a design.
6. **Exact conflicting logic:** Same `tripKeys.payments(tripId)`, different runtime types; optimistic helpers branch on `Array.isArray` vs `{payments}` and no-op on mismatch.
7. **User-facing risk:** Missing/stale payments after create/settle; balance summary vanishing after desktop↔mobile navigation.
8. **Engineering risk:** Mutations must know which surface wrote the cache; tests green on one shape.
9. **Recommended fix:** Canonicalize to `PaymentMessage[]` + `tripKeys.paymentBalances`. Route mobile through `usePayments`. Delete dual-shape branches.
10. **Fix now or later:** **Fix now.**

---

### 4. Calendar UI permissions disagree with mutation permissions

1. **Title:** Calendar chrome vs mutation dual-gate  
2. **Severity:** High  
3. **Category:** Conflicting permission gating / duplicate logic paths  
4. **Files involved:**
   - `GroupCalendar.tsx` / `MobileGroupCalendar.tsx` — `useRolePermissions`
   - `useRolePermissions.ts` (~187–203) — member + null `featurePermissions` → hard-coded allowlist including delete
   - `useCalendarEvents.ts` — `useMutationPermissions`
   - `useCalendarManagement.ts`, `CreateEventModal`, `CalendarEventModal`, `TripLinksDisplay`, `chatContentParser`, `globalSyncProcessor` — direct `calendarService` calls that skip the unified client guard
5. **Why this looks like merge debt:** RPC mutation guard was layered on without retiring role-hook chrome or consolidating all writers.
6. **Exact conflicting logic:** UI may show Import/Edit when RPC denies (or reverse). Multiple write islands bypass `useMutationPermissions` entirely.
7. **User-facing risk:** Buttons then write fails; capable users blocked; Pro/Event role boundaries especially fragile.
8. **Engineering risk:** Every calendar UX change must remember ≥2 permission systems + N write islands.
9. **Recommended fix:** Drive chrome from `useMutationPermissions`. Route all writes through one hook/service gate. Parity test: UI gate ≡ mutation gate for consumer/pro/event.
10. **Fix now or later:** **Fix now** (Phase 1).

---

### 5. Calendar bulk import bypasses notification prefs + AI source_type double-fanout

1. **Title:** Push delivery multi-home + import source_type skip mismatch  
2. **Severity:** High  
3. **Category:** Conflicting side effects / API contract drift  
4. **Files involved:**
   - `calendarService.sendBulkImportNotification` → `notificationService.sendPushNotification` → `web-push-send` (no `notification_preferences` check)
   - Canonical: notifications INSERT → queue → `dispatch-notification-deliveries` → send-push/web-push (prefs-aware)
   - DB trigger skip list: `gmail_import` / `bulk_import` / `import` only
   - Concierge smart import uses `source_type: 'ai_concierge_import'` (also `ai_extracted`, `ai_concierge` allowed in calendarService)
5. **Why this looks like merge debt:** Client bulk-push path survived after queued delivery was built. AI source types were added without updating the trigger skip list — accept-both of old aggregate push + new per-event fanout.
6. **Exact conflicting logic:** Bulk Gmail path: direct push (may ignore prefs). AI import path: per-event DB fanout *plus* possible aggregate client push.
7. **User-facing risk:** Spam notifications; users who disabled calendar alerts still get web push; AI imports notify N+1 times.
8. **Engineering risk:** Three delivery homes (`web-push-send`, `send-push` stubbing web, `push-notifications` for email) diverge under prefs/mute changes.
9. **Recommended fix:** Delete client bulk `web-push-send`. Extend trigger skip list to AI import source_types OR write one aggregate notification via `create-notification`. Make `send-push` own web or delete the stub.
10. **Fix now or later:** **Fix now** (Phase 1).

---

### 6. Orphan lineup query key (agenda-bug twin)

1. **Title:** `tripKeys.lineup` does not match live cache  
2. **Severity:** High  
3. **Category:** API/cache contract drift / actual bug class  
4. **Files involved:**
   - `src/lib/queryKeys.ts` — `lineup: (tripId) => ['eventLineup', tripId]`
   - `src/hooks/useEventLineup.ts` / `LineupTab.tsx` — `['event-lineup', eventId]`
5. **Why this looks like merge debt:** Identical class to the fixed agenda orphan. Factory never rewired.
6. **Exact conflicting logic:** Factory invalidations no-op; live code uses inline kebab key.
7. **User-facing risk:** Stale lineup after mutations that invalidate via factory; silent until someone routes Concierge/import through `tripKeys.lineup`.
8. **Engineering risk:** Repeats the agenda outage pattern.
9. **Recommended fix:** Same as agenda fix — factory returns live key; callers use factory only; add drift assertion.
10. **Fix now or later:** **Fix now** (Phase 1) — small, high leverage.

---

### 7. Pro/Event detail still resolve trips via list-find

1. **Title:** Pro/Event detail list-find + Event auth-hydration gap  
2. **Severity:** High  
3. **Category:** Duplicate logic paths / data flow inconsistency / actual bug class  
4. **Files involved:**
   - `ProTripDetailDesktop.tsx` / `MobileProTripDetail.tsx` — `userTrips.find(... trip_type === 'pro')` (+ Pro now gates `authLoading`)
   - `EventDetail.tsx` / `MobileEventDetail.tsx` — `userTrips.find(... trip_type === 'event')`; loading only `demoModeLoading || tripsLoading` — **no `authLoading`**
   - Consumer: `useTripDetailData` → `tripService.getTripById` (correct pattern)
5. **Why this looks like merge debt:** Consumer detail was hardened; Pro/Event kept list-derived rows. Partial migrate + accept both.
6. **Exact conflicting logic:** Deep link / invite / slow list hydration → false Not Found. Event worse than Pro (no auth gate).
7. **User-facing risk:** “Event/Trip Not Found” flash or hard fail for valid members; demo contamination risk if list empty during auth.
8. **Engineering risk:** Three detail loaders for one entity family.
9. **Recommended fix:** Route Pro/Event through `useTripDetailData` (or typed siblings). Gate Event on `authLoading`. Delete list-find.
10. **Fix now or later:** **Fix now** (Phase 1).

---

### 8. Authenticated trip shells still seed from `generateTripMockData`

1. **Title:** Demo scaffolding injected into real trip context  
2. **Severity:** High  
3. **Category:** Demo contamination / data flow inconsistency  
4. **Files involved:**
   - `TripDetailDesktop.tsx` / `MobileTripDetail.tsx` — `generateTripMockData(trip)` for basecamp/calendar/links/broadcasts context
   - `tripPlacesService.ts` — also calls it for links
5. **Why this looks like merge debt:** Demo-first shell never fully replaced with real fetches for every tab context field.
6. **Exact conflicting logic:** Authenticated UI may render mock itinerary/links when real queries are empty/slow.
7. **User-facing risk:** Fake places/calendar bleed into real trips; Concierge/context pollution.
8. **Engineering risk:** Violates “demo mode is sacred / parallel real paths” invariant.
9. **Recommended fix:** Gate mock generation behind `isDemoTrip` / demo mode only. Real shells use real hooks exclusively.
10. **Fix now or later:** **Fix now** (Phase 1).

---

### 9. Dual entitlement read stacks

1. **Title:** `useSubscription` vs `useConsumerSubscription`  
2. **Severity:** High  
3. **Category:** Multiple sources of truth / API contract drift  
4. **Files involved:**
   - `useSubscription.ts` — direct `user_entitlements` / `profiles`
   - `useConsumerSubscription.tsx` — edge `check-subscription`
   - Mixed callers: cover photo / voice prefs / calendars / cards use one; billing UI uses the other
5. **Why this looks like merge debt:** Edge entitlement check was added without deleting the DB reader.
6. **Exact conflicting logic:** Webhook lag / cache TTL → one hook says paid, the other free.
7. **User-facing risk:** Upsell shown to paid users; premium features gated inconsistently.
8. **Engineering risk:** Every paid gate must pick a side; parity tests only cover limit maps, not hook agreement.
9. **Recommended fix:** Single hook (prefer edge SoT for Stripe truth). Make the other a thin re-export or delete.
10. **Fix now or later:** **Phase 1–2.**

---

### 10. Concierge payment invalidation + direct RPC bypass

1. **Title:** Concierge expenses skip balance invalidation and paymentService guards  
2. **Severity:** High  
3. **Category:** Conflicting side effects / type-safety erosion  
4. **Files involved:**
   - `conciergeInvalidation.ts` — `settleExpense`/`addExpense` → only `tripKeys.payments`
   - `usePendingActions.ts` — `(supabase.rpc as any)('create_payment_with_splits_v2', …)` bypasses `paymentService`
5. **Why this looks like merge debt:** Concierge write path was bolted beside the payments service instead of calling it.
6. **Exact conflicting logic:** Dialogs invalidate payments+balances; Concierge only payments. RPC cast skips split-limit / custom-amount validation.
7. **User-facing risk:** Stale “you owe / owed” after Concierge expense; invalid splits possible if edge validation differs.
8. **Engineering risk:** Two payment creators; casts hide schema drift.
9. **Recommended fix:** Concierge calls `paymentService`; invalidate both keys; delete `as any` RPC.
10. **Fix now or later:** **Fix now** (Phase 1).

---

### 11. Permission source-of-truth fanout

1. **Title:** Five+ permission systems coexist  
2. **Severity:** High  
3. **Category:** Architectural regression / inconsistent permission gating  
4. **Files involved:**
   - `useMutationPermissions` (RPC + fallbacks)
   - `useRolePermissions` (matrix + email super-admin bypass)
   - `useEventPermissions` / `useProTripAdmin` / `useTripAdmins`
   - `ProTabContent` — `user?.proRole` / `user?.permissions`
   - `useEventTasks` — UI-only gate; RLS differs (`trip_members.role='admin'` vs `trip_admins`)
5. **Why this looks like merge debt:** Each product surface (consumer/pro/event) grew its own gate; none retired the others.
6. **Exact conflicting logic:** Same user can be allowed in chrome, denied by RPC/RLS, or reverse.
7. **User-facing risk:** Invisible actions, failed writes, privilege confusion on Pro/Event.
8. **Engineering risk:** Security reviews cannot name one SoT.
9. **Recommended fix:** Declare RPC `get_trip_mutation_permissions` (+ typed Pro/Event variants) as SoT for UI *and* mutations. Delete email super-admin client bypass from role hook. Event tasks must use mutation permissions.
10. **Fix now or later:** **Phase 2** (start Event tasks + calendar in Phase 1).

---

### 12. Stream chat adapter / transport debris

1. **Title:** Dead adapters + legacy default landmine  
2. **Severity:** Medium  
3. **Category:** Dead/zombie code / “accept both” migration  
4. **Files involved:**
   - Live: `streamMessageViewModel` (TripChat)
   - Dead runtime: `messageMapper` (`streamMessageToChravel`) — tests only
   - `ChannelChatView` imports `mapStreamMessagesToChannelMessages` but inlines a richer copy
   - `MessageActions` default `transportMode = 'legacy'`; `chatService` throws `STREAM_CANONICAL_TRANSPORT`
   - `chatAnalysisService.analyzeChatMessagesForPayment` still SELECTs `trip_chat_messages`
5. **Why this looks like merge debt:** Stream cutover kept legacy fallbacks “just in case.”
6. **Exact conflicting logic:** New callers that forget `transportMode` hit legacy throw; payment-from-chat analysis silently empty for Stream-only trips.
7. **User-facing risk:** Broken message actions on any surface missing the prop; Concierge/payment parse from chat returns nothing.
8. **Engineering risk:** Two UI message shapes (trip vs pro channel); comments claim adapters that aren’t used.
9. **Recommended fix:** Default `transportMode='stream'`. Delete or quarantine `messageMapper`. Make ChannelChatView call the adapter (or delete adapter). Point payment chat analysis at Stream history API.
10. **Fix now or later:** **Phase 2** (payment analysis Medium-High — bump if product uses it).

---

### 13. Orphan `['events']` invalidations + converter `@ts-nocheck`

1. **Title:** Ghost events key + loose trip converters  
2. **Severity:** Medium  
3. **Category:** Cache drift / type-safety erosion  
4. **Files involved:**
   - Invalidators: `useUserTripsRealtime`, `useDeleteTrip`, `joinRequestMutations`, `tripCoverInvalidation`
   - No `useQuery({ queryKey: ['events'] })` owner
   - `tripConverter.ts` — `@ts-nocheck`; `useProTrips.mapSupabaseTripToProTripData` duplicates `convertSupabaseTripToProTrip`
   - `tripCoverResolver` still accepts many legacy cover field aliases
5. **Why this looks like merge debt:** Events list was folded into `useTrips` filter; invalidations never updated. Converters kept every historical field name.
6. **Exact conflicting logic:** No-op invalidations; Pro list vs detail converters can disagree on `title`/`name`.
7. **User-facing risk:** Stale event cards until trips query refreshes by other means; cover/title flicker.
8. **Engineering risk:** `@ts-nocheck` hides real shape drift permanently.
9. **Recommended fix:** Invalidate `tripKeys` / trips list only. One Pro converter. Remove `@ts-nocheck` incrementally.
10. **Fix now or later:** **Phase 3** (events key: Phase 1 tiny fix).

---

### 14. Limits / flags / TTS zombies

1. **Title:** Dual limit maps, dark flags, zombie edge functions  
2. **Severity:** Low–Medium  
3. **Category:** Dead code / feature-flag masking / optional cleanup  
4. **Files involved:**
   - `FEATURE_LIMITS` vs `FREEMIUM_LIMITS` (parity-tested)
   - `broadcast-scheduling-enabled` checked in `unifiedMessagingService` / AdminDashboard but not seeded
   - Seeded `realtime_voice` vs client `concierge_realtime_voice`
   - `google-tts` edge function with no SPA caller (`concierge-voice-tts` is live)
5. **Why this looks like merge debt:** Partial feature ships left flags/functions behind.
6. **Exact conflicting logic:** Dark flag forever-off; wrong flag name means seed doesn’t control the client.
7. **User-facing risk:** Low today (flags fail closed / unused TTS).
8. **Engineering risk:** Ops flip the wrong flag; deploy surface includes dead functions.
9. **Recommended fix:** Single limits module; delete or seed scheduling flag; align voice flag names; archive `google-tts`.
10. **Fix now or later:** **Phase 3 / Later.**

---

## Pattern-Level Diagnosis

Recurring bad-merge patterns:

1. **Accept both on migrations** — Stream chat, notifications delivery, entitlements, payments mobile/desktop, calendar permissions. New path ships; old path remains “for safety.”
2. **Factory vs inline query keys** — agenda was fixed; lineup still broken; `['events']` orphan remains. Drift checks catch some, not all.
3. **UI chrome vs mutation/RLS disagree** — role matrix allowlist vs RPC vs RLS vs Pro tab local permissions.
4. **Adapter bandages** — `paymentCacheUtils` dual shapes, cover field alias soup, snake/camel chat fields, `@ts-nocheck` converters.
5. **Stale comments as contracts** — `broadcastMirrorService` still claims webhook is mention-only while webhook dual-writes.
6. **Tests that assert the wrong layer** — Index Pro navigation test never touches Index.

Main issue class: **duplicated logic + architectural drift at ownership boundaries**, not dead-code volume. Worst subsystems: **Payments, Notifications/Broadcasts, Calendar/Permissions, Pro/Event detail loading, Stream chat cutover debris.**

---

## Root-Cause Hypothesis

Structurally:

1. **Accept both too often** during Stream, billing, and query-key consolidations — especially when one side was “already in production.”
2. **Partial migrations** — consumer detail hardened; Pro/Event left on list-find. Agenda key fixed; lineup twin left. Prefs-aware queue built; client `web-push-send` left.
3. **Branch-by-branch drift** — feature branches each “fixed fanout” (client mirror *and* webhook) without a single ownership doc.
4. **Unresolved ownership** — who owns trip detail loading? who owns notifications delivery? who owns payment cache shape? No single module answers.
5. **Inconsistent refactors** — `tripKeys` factory adopted unevenly; mobile payments never rebased onto `usePayments`.
6. **Lovable + agent parallel commits on `main`** — short branches help, but concurrent “fixes” to the same seam (broadcasts, SMS teardown restore) still produce dual paths (see Jul 30 `should_send` clobber/restore).

---

## Surgical Cleanup Plan

### Phase 1 — Critical production-risk (do first)

| # | Fix | Effort | Collapses |
|---|-----|--------|-----------|
| 1 | Index Pro search → `/tour/pro/:id` + real test | XS | Route SoT |
| 2 | Broadcast: single writer + `stream_message_id` idempotency | S | Client vs webhook |
| 3 | Payments: one cache shape; mobile uses `usePayments` | M | Dual cache + dual-shape utils |
| 4 | `tripKeys.lineup` → live `event-lineup` + drift assert | XS | Agenda-class bug |
| 5 | Concierge payment invalidation + route via `paymentService` | S | Stale balances / RPC cast |
| 6 | Stop client bulk `web-push-send`; align AI `source_type` skip list | S | Push multi-home |
| 7 | Pro/Event detail → `getTripById` / `useTripDetailData`; Event `authLoading` | M | List-find Not Found |
| 8 | Gate `generateTripMockData` to demo only | S | Demo contamination |
| 9 | Calendar chrome → `useMutationPermissions` | M | Dual-gate |

### Phase 2 — Architecture consolidation

- Single entitlement hook
- Permission SoT: RPC for all mutation chrome (Event tasks included)
- Stream: default `transportMode='stream'`; ChannelChatView uses adapter; payment chat analysis → Stream
- Delete `broadcastMirrorService` *or* webhook path (after Phase 1 choice)
- Unify Pro trip converters; remove one of `mapSupabaseTripToProTripData` / `convertSupabaseTripToProTrip`

### Phase 3 — Dead code and type cleanup

- Delete runtime-dead `messageMapper` (keep tests only if valuable as fixtures)
- Remove `['events']` invalidations
- Strip `@ts-nocheck` from `tripConverter` incrementally
- Archive `google-tts`; align/remove dark flags (`broadcast-scheduling-enabled`, `realtime_voice` alias)
- Collapse FEATURE_LIMITS / FREEMIUM_LIMITS after callers migrate

### Phase 4 — Guardrails (see below)

---

## Guardrails

Concrete prevention:

1. **CI: route string inventory** — fail if `/pro-trip/` (or other retired prefixes) appear outside redirects/tests that intentionally assert absence.
2. **CI: query-key drift** — extend existing drift scripts so every `tripKeys.*` factory entry must equal the live `useQuery` key (lineup would fail today). Ban orphan invalidations (`['events']`).
3. **CI: cache shape typing** — type `tripKeys.payments` data as `PaymentMessage[]` in a shared module; `setQueryData` helpers refuse unknown shapes (delete dual-shape branches).
4. **PR checklist (merge conflicts):**
   - [ ] Did you accept both? If yes, name the single SoT that remains.
   - [ ] UI gate and mutation/RLS gate are the same function.
   - [ ] No second writer for the same row/table without an idempotency key.
   - [ ] No new `as any` RPC / `@ts-nocheck` without a tracking issue.
   - [ ] Demo helpers cannot run on authenticated IDs.
5. **Conflict resolution workflow:** prefer *delete one side* over adapters. Adapters require an expiry comment + ticket.
6. **Architectural conventions:**
   - Trip detail loading: only `useTripDetailData` / `tripService.getTripById`
   - Notifications: only queue + `dispatch-notification-deliveries`
   - Payments cache: only `usePayments` + `paymentBalances`
   - Broadcasts table: only one writer (document in `broadcastMirrorService` / webhook — not both)
7. **Lint:** ban `transportMode` default legacy (require explicit prop or flip default); ban imports of `chatService` outside the canonical transport shim; ban `generateTripMockData` outside demo packages.
8. **Type strictness:** treat `@ts-nocheck` and `(supabase.rpc as any)` as merge-debt markers — CI count must not increase.

---

## Minimum refactors that collapse the most debt

If only three consolidations ship this month:

1. **Notification/Broadcast ownership** — one broadcast writer + one push delivery path → kills findings 2, 5, and half of 14.
2. **Payments ownership** — one cache shape + Concierge via `paymentService` → kills findings 3 and 10.
3. **Detail-loading ownership** — Pro/Event use consumer’s `getTripById` pattern + mock data demo-gated → kills findings 7 and 8; enables permission SoT work on a stable trip entity.

---

## Validation completed

- Static verification of every Critical/High claim against current `main` (`220efb904`)
- Parallel explore agents on payments/queryKeys, chat/calendar/permissions, Pro/Event/auth/push
- Cross-checked Jul 26 open list — **0 Critical/High closures**
- Confirmed prior fixed items remain fixed (TripChat stream transportMode, chat keys, agenda key, members wrap)
- No product code modified; no runtime/e2e in this pass

## Remaining launch blockers (from this audit)

1. Pro search 404 (`/pro-trip/`)
2. Broadcast duplicate fanout
3. Payments dual cache shape
4. Calendar dual-gate + bulk push bypass
5. Pro/Event list-find Not Found (esp. Event auth hydration)
6. Mock data on authenticated shells

---

## Fixed now / Discovered / Deferred

Per DEFERRAL_DISCIPLINE (audit-only run):

1. **Fixed now:** Nothing in product code — this pass is documentation.
2. **Discovered:** Pro search route bug; broadcast client+webhook duplicate insert; AI import source_type skip mismatch; Event missing `authLoading`; Concierge RPC bypass of `paymentService`.
3. **Intentionally deferred:** Implementing Phase 1 fixes (out of audit scope for this cron; prior automation also shipped docs-only).
4. **Why deferral was necessary:** Cron mission is detect/explain/plan; changing production paths without targeted repro tests would violate bug-fix protocol.
5. **Paste-ready follow-ups:** see Phase 1 table rows 1–9 above (each is a self-contained prompt).
6. **Validation completed:** source-verified as above.
7. **Remaining launch blockers:** listed in prior section.
