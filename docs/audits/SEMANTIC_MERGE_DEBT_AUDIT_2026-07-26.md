# Semantic Merge Debt Audit — 2026-07-26

Audit date: 2026-07-26  
Branch: `cursor/semantic-merge-debt-audit-69a3`  
Base: `main` @ `7ad2370fb`  
Prior audit: [`docs/semantic-merge-debt-audit-2026-05-31.md`](../semantic-merge-debt-audit-2026-05-31.md)  
Related recent work: post-drift feature audit (2026-07-25), query-key consolidation (#848/#858), Stream chat cutover, billing tier remap

Method: static end-to-end flow tracing across chat, trip detail, permissions, payments, calendar, notifications, concierge, and entitlements; parallel subsystem exploration; direct source verification of every Critical/High claim. No product code changed in this pass.

Classification vocabulary used below:

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

Overall assessment: **Improved since May, still tangled at the ownership boundaries.** The May 2026 audit scored **78/100**. Since then the team closed several Critical items (Pro Growth checkout tier remap, TripChat Stream `transportMode`, orphaned `tripKeys.chat*`, agenda key parity, members hook wrapping TanStack Query). What remains is not random style debt — it is a recurring pattern of **partial migrations preserved by “accept both”**: UI chrome and mutation paths disagree, desktop and mobile share a query key with incompatible cache shapes, Pro/Event detail still resolves trips from the dashboard list, and Stream chat still carries dual broadcast field contracts plus dead adapters.

Severity score: **64 / 100**. Higher is worse (0–20 clean · 21–40 manageable · 41–65 material · 66–85 high-risk · 86–100 systemic). Score dropped ~14 points from May because confirmed revenue/chat Criticals were fixed, but multiple **silent functional bugs** remain (payments cache shape collision, lineup key orphan, calendar permission dual-gate, bulk-import push bypass, Pro/Event list-find Not Found).

Confidence level: **High** for Critical/High findings (verified in source). Medium for some Medium/Low smells where runtime repro was not possible in this environment.

### Top 10 highest-risk areas

1. **Payments cache shape collision** — `usePayments` and `MobileTripPayments` share `tripKeys.payments(tripId)` with array vs `{payments, balanceSummary}` shapes.
2. **Calendar permission dual-gate** — UI uses `useRolePermissions.canPerformAction` (broad member allowlist); mutations use `useMutationPermissions` / RPC.
3. **Orphan `tripKeys.lineup`** — factory returns `['eventLineup', …]`; live cache is `['event-lineup', …]` (same class as the fixed agenda bug).
4. **Pro/Event detail list-find** — detail pages resolve the trip from `useTrips()` list membership instead of `getTripById`, risking false Not Found on deep links/invites.
5. **Broadcast field contract dualism** — trip sends `message_type`/`privacy_mode`; pro channels send `isBroadcast`; history search filters only `message_type`.
6. **Push delivery multi-home** — calendar bulk import bypasses notification fanout/prefs via client `web-push-send`; legacy `push-notifications` still invoked for email.
7. **Authenticated trip shells still seed tab context from `generateTripMockData`** — demo scaffolding injects into real trip context.
8. **Dual entitlement stacks** — `useSubscription` (direct DB) vs `useConsumerSubscription` (`check-subscription` edge) disagree under webhook lag.
9. **Stream chat adapter debris** — dead `messageMapper`, unused pro channel adapter import, `MessageActions` default `transportMode='legacy'`.
10. **Permission / membership ownership still fragmented** — RPC mutation perms + client role matrix + event organizer string heuristics + inline `trip_admins` checks.

---

## Status vs May 2026 audit

| May finding | Status (2026-07-26) |
|-------------|---------------------|
| Pro checkout `pro-growing` vs `pro-growth` | **Fixed** — `SUBSCRIPTION_TIER_MAP.growing → 'pro-growth'` + parity tests; legacy `STRIPE_PRODUCTS['pro-growing']` alias kept intentionally |
| Trip members three sources of truth | **Partially fixed** — `useTripMembers` now wraps `useTripMembersQuery`; detail still dual-mounts for actions; Pro/Event still separate |
| Trip detail / prefetch key drift | **Improved** via `tripKeys` consolidation; residual off-factory keys remain (see post-drift audit) |
| Stream edit/delete defaulting to legacy | **Fixed on TripChat** (`transportMode="stream"`); component **defaults still `'legacy'`** — landmine |
| AI pending-action triple orchestration | **Improved / still layered** — shell mounts `usePendingActions`; dual tool naming remains |
| Billing five client read paths | **Improved** — `billing/checkout.ts` extraction; dual entitlement hooks remain |
| Demo mode multi-flag heuristics | Still present (intentional + fragile) |
| `generateTripMockData` on authenticated detail | **Still open** |
| Mobile media dual-table delete | Partially addressed in later media work; not re-audited as Critical here |
| Orphan `tripKeys.chat*` / agenda key | **Fixed** (2026-07-25) |

---

## Findings

### 1. Payments share one query key with two incompatible cache shapes

1. **Title:** Desktop/mobile payments cache shape collision  
2. **Severity:** Critical  
3. **Category:** Conflicting state management / “accept both” architectural regression / performance  
4. **Files involved:**
   - `src/hooks/usePayments.ts` — cache value = `PaymentMessage[]`
   - `src/components/mobile/MobileTripPayments.tsx` — cache value = `{ payments, balanceSummary }`
   - `src/lib/paymentCacheUtils.ts` — defensive dual-shape optimistic helpers
   - `src/lib/queryKeys.ts` — shared `tripKeys.payments(tripId)`
5. **Why this looks like merge debt:** Desktop consolidated onto `usePayments` (array). Mobile kept a parallel TanStack query that packs balances into the same key. `paymentCacheUtils` was then written to tolerate both — classic “accept both + adapter bandage.”
6. **Exact conflicting logic:** Same key, different runtime types. Navigating desktop ↔ mobile (or responsive remount) can overwrite the cache with the other shape. Optimistic helpers branch on `Array.isArray` vs `{payments}` and silently no-op when shape mismatches expectations.
7. **User-facing risk:** Missing/stale payments after create/settle; balance summary vanishing; flicker or empty list after cross-surface navigation.
8. **Engineering risk:** Every payment mutation must know which surface wrote the cache. Tests green on one shape while production hits the other.
9. **Recommended fix:** Canonicalize `tripKeys.payments` to `PaymentMessage[]`. Put balances exclusively on `tripKeys.paymentBalances(tripId, userId)`. Route `MobileTripPayments` through `usePayments` + the balances query. Delete dual-shape branches in `paymentCacheUtils`.
10. **Fix now or later:** **Fix now.**

---

### 2. Calendar UI permissions disagree with calendar mutation permissions

1. **Title:** Calendar chrome vs mutation dual-gate  
2. **Severity:** High  
3. **Category:** Conflicting permission gating / duplicate logic paths  
4. **Files involved:**
   - `src/components/GroupCalendar.tsx` / `MobileGroupCalendar` — `useRolePermissions().canPerformAction('calendar', …)`
   - `src/hooks/useRolePermissions.ts` — member + null `featurePermissions` → broad allowlist including `can_create_events` / `can_edit_events` / `can_delete_events`
   - `src/hooks/useMutationPermissions.ts` — server RPC `get_trip_mutation_permissions`, fallback to permission matrix
   - `src/hooks/useCalendarEvents.ts` (mutation path)
5. **Why this looks like merge debt:** Server RPC mutation guard was added without retiring the Pro-era role hook from calendar chrome — both paths survived.
6. **Exact conflicting logic:** UI may show Import/Edit when RPC would deny (or hide actions the server allows). Consumer members with null `featurePermissions` get a hard-coded allowlist in `canPerformAction`.
7. **User-facing risk:** Buttons visible then write fails; or capable users cannot import/edit. Especially painful on Pro/Event role boundaries.
8. **Engineering risk:** Every calendar UX change must remember two permission systems. Tests mock one and miss the other.
9. **Recommended fix:** Drive calendar chrome exclusively from `useMutationPermissions` (or a thin selector over the same RPC). Delete consumer default allowlist from calendar call sites. Add a parity test: UI gate ≡ mutation gate for consumer/pro/event fixtures.
10. **Fix now or later:** **Fix now** (Phase 1).

---

### 3. Orphan lineup query key (agenda-bug twin)

1. **Title:** `tripKeys.lineup` does not match live cache  
2. **Severity:** High  
3. **Category:** API/cache contract drift / actual bug class  
4. **Files involved:**
   - `src/lib/queryKeys.ts` — `lineup: (tripId) => ['eventLineup', tripId]`
   - `src/hooks/useEventLineup.ts` — live `queryKey = ['event-lineup', eventId]`
   - `src/components/events/LineupTab.tsx` — invalidates `['event-lineup', eventId]`
5. **Why this looks like merge debt:** Identical failure mode to the fixed agenda orphan (`eventAgenda` vs `event-agenda`). Factory renamed; callers kept kebab string. Comment on `tripKeys.agenda` already documents this class.
6. **Exact conflicting logic:** Any invalidation via `tripKeys.lineup(...)` is a no-op against the live cache.
7. **User-facing risk:** Stale lineup after concierge/import/mutations that use the factory.
8. **Engineering risk:** Drift guards can pass if they only check factory existence, not call-site parity.
9. **Recommended fix:** Point `tripKeys.lineup` at `['event-lineup', id]` **or** migrate callers to the factory in the same commit. Add a parity test mirroring the agenda fix.
10. **Fix now or later:** **Fix now** (one-line / lockstep; proven bug class).

---

### 4. Pro/Event detail still resolves trips via dashboard list-find

1. **Title:** Pro/Event detail existence ≡ list membership  
2. **Severity:** High  
3. **Category:** Duplicate logic paths / architectural regression / data flow inconsistency  
4. **Files involved:**
   - `src/pages/ProTripDetailDesktop.tsx` — `userTrips.find(t => t.id === proTripId && t.trip_type === 'pro')`
   - `src/pages/MobileProTripDetail.tsx` — same pattern
   - `src/pages/EventDetail.tsx` / `MobileEventDetail.tsx` — same for events
   - Contrast: `src/hooks/useTripDetailData.ts` + `tripService.getTripById` (consumer path)
5. **Why this looks like merge debt:** Consumer detail was migrated to auth-gated dedicated fetch. Pro/Event shells kept the older list-find approach (“accept current” on those pages while consumer took incoming).
6. **Exact conflicting logic:** Detail existence requires presence in `['trips', userId, isDemoMode]` list query, not a membership-aware detail fetch.
7. **User-facing risk:** False Trip/Event Not Found after invite/deep link before list refetch; stale header fields; unnecessary full-list load for one page.
8. **Engineering risk:** Consumer and Pro/Event diverge on every trip-detail bugfix.
9. **Recommended fix:** Port Pro/Event detail onto `useTripDetailData` / `getTripById` (or a typed pro/event variant). Keep converters for view models only.
10. **Fix now or later:** **Phase 1** (launch-risk for invite/deep-link flows).

---

### 5. Stream broadcast field contract is dual and inconsistently filtered

1. **Title:** Trip vs pro broadcast schema dualism  
2. **Severity:** High (Critical for broadcast history correctness)  
3. **Category:** API contract drift / “accept both”  
4. **Files involved:**
   - Trip send: `src/services/stream/streamMessagePayload.ts` — `privacy_mode`, `message_type`
   - Pro send: Stream pro channel path — `{ isBroadcast: true }`
   - UI: `src/features/chat/adapters/streamMessageViewModel.ts` — OR of `message_type === 'broadcast' \|\| privacy_mode === 'broadcast'`
   - History: `src/services/stream/streamMessageSearch.ts` — `fetchTripBroadcastHistory` filters **only** `{ message_type: { $eq: 'broadcast' } }`
   - Pro UI: `ChannelChatView` maps broadcast → `messageType: 'system'`
5. **Why this looks like merge debt:** Two broadcast schemas survived Stream migration; view-model OR-patched the UI instead of normalizing the write path. Comment in view-model admits prior tab/badge split.
6. **Exact conflicting logic:** Broadcasts tab history can miss `privacy_mode`-only messages; pro “broadcasts” render as system messages; unread selectors use yet another predicate set.
7. **User-facing risk:** Empty/incomplete Broadcasts tab; badge counts disagree with tab contents; pro announcements look like system noise.
8. **Engineering risk:** Every new chat feature must remember three markers (`message_type`, `privacy_mode`, `isBroadcast`).
9. **Recommended fix:** Canonical write contract: always set `message_type: 'broadcast'` (and optionally `privacy_mode: 'broadcast'` for unread). Normalize pro sends. Update search filter + unread selectors to one predicate. Migrate historical dual-tagged messages if needed via a one-shot Stream backfill/script.
10. **Fix now or later:** **Phase 1.**

---

### 6. Push / notification delivery still multi-homed

1. **Title:** Notification fanout bypassed by calendar bulk import + legacy email entrypoint  
2. **Severity:** High  
3. **Category:** Conflicting side effects / zombie paths  
4. **Files involved:**
   - Canonical: `notifications` INSERT → delivery queue → `dispatch-notification-deliveries` → `send-push` / `web-push-send`
   - Bypass: `src/services/calendarService.ts` → `sendBulkImportNotification` → `notificationService.sendPushNotification` → `web-push-send`
   - Zombie: `notificationService` still invokes `push-notifications` for email
5. **Why this looks like merge debt:** Fanout migration + SMS removal + native push never collapsed to one path; calendar import kept a client shortcut “for spam prevention” that skips prefs/dedupe.
6. **Exact conflicting logic:** Bulk import skips queue, preference gates, and fanout dedupe keys. Email still hits a separate edge function.
7. **User-facing risk:** Missed/duplicate push; muted trips still notified; native vs web divergence.
8. **Engineering risk:** Preference toggles lie; hard to reason about delivery SLOs.
9. **Recommended fix:** Enqueue one aggregated `calendar_bulk_import` notification through the fanout table. Delete client direct `web-push-send` for this path. Retire or quarantine `push-notifications` email entrypoint behind the same queue.
10. **Fix now or later:** **Phase 1.**

---

### 7. Authenticated trip detail still seeds context from demo mock generator

1. **Title:** `generateTripMockData` on real trip shells  
2. **Severity:** High  
3. **Category:** Demo contamination / architectural regression  
4. **Files involved:**
   - `src/pages/TripDetailDesktop.tsx` — `mockData = generateTripMockData(tripWithUpdatedData)` then feeds `tripContext` (calendar/broadcasts/links…)
   - `src/pages/MobileTripDetail.tsx` — same
   - `src/data/tripsData.ts` — generator
5. **Why this looks like merge debt:** Demo scaffolding was never fully peeled from authenticated shells after TanStack trip detail landed. Real members were merged into participants (“Phase 3”) while mock itinerary/broadcasts/links remain in context.
6. **Exact conflicting logic:** Authenticated trips can still surface mock-derived tab context fields alongside real member data.
7. **User-facing risk:** Ghost itinerary/links/broadcasts on empty real trips; demo contamination regressions (zero-tolerance invariant).
8. **Engineering risk:** Tab components cannot trust context; every new tab must re-check demo vs auth.
9. **Recommended fix:** Split demo and auth context builders. Auth path: empty/real fetches only. Demo path: mock generator behind `isDemoMode` exclusively.
10. **Fix now or later:** **Phase 1** (critical-path / demo invariant).

---

### 8. Dual entitlement read stacks

1. **Title:** `useSubscription` vs `useConsumerSubscription` disagree  
2. **Severity:** Medium–High  
3. **Category:** Multiple sources of truth / API drift  
4. **Files involved:**
   - `src/hooks/useSubscription.ts` — direct `user_entitlements` / profiles via `resolveEffectiveEntitlement`
   - `src/hooks/useConsumerSubscription.tsx` — `check-subscription` edge
   - Callers: cover gen (`useGenerateCoverPhoto`), voice/settings, calendar paywall, storage quota, archived trips
5. **Why this looks like merge debt:** Edge-reconciled provider was added without deleting the direct DB hook. Both remain “correct enough” under different lag assumptions.
6. **Exact conflicting logic:** Cover/voice may think user is paid while Settings/calendar paywall still shows free (or reverse) during webhook lag.
7. **User-facing risk:** Wrong upgrade prompts; gated features inconsistently available.
8. **Engineering risk:** Every paywall must pick a hook; no single entitlement SoT on the client.
9. **Recommended fix:** Make `useConsumerSubscription` (edge-reconciled) the sole client SoT. Demote `useSubscription` to a deprecated thin wrapper or delete after migrating callers.
10. **Fix now or later:** **Phase 2** (unless a concrete paywall bug is reported — then Fix now).

---

### 9. Permission ownership still fragmented across hooks

1. **Title:** Multiple permission oracles for the same trip  
2. **Severity:** High  
3. **Category:** Conflicting state management / inconsistent permission gating  
4. **Files involved:**
   - `useMutationPermissions` — RPC primary + client matrix fallback
   - `useRolePermissions` — effect-loaded feature permissions + default allowlist
   - `useEventPermissions` — organizer via role name strings
   - `useProTripAdmin` / `useTripAdmins` / `useTripMembers.canRemoveMembers` — inline `trip_admins` / creator checks
   - `useSuperAdmin` / email bypass on some paths only
5. **Why this looks like merge debt:** Server resolvers landed without a hard cutover. Fallbacks and parallel admin hooks were preserved.
6. **Exact conflicting logic:** Buttons enabled that mutations reject (or reverse); Pro coordinator vs full-admin confusion; super-admin bypass inconsistently applied.
7. **User-facing risk:** Broken Team/Roles/calendar/tasks UX after role changes; intermittent “permission denied” toasts.
8. **Engineering risk:** Permission bugs are non-reproducible across surfaces.
9. **Recommended fix:** Collapse reads to `get_trip_mutation_permissions` + `get_trip_admin_permissions`. Delete client matrix fallbacks once RPC coverage is universal. One `canRemoveMembers` implementation.
10. **Fix now or later:** **Phase 1–2** (calendar dual-gate is the urgent slice).

---

### 10. Stream chat adapter debris + legacy defaults

1. **Title:** Dead messageMapper / unused pro adapter / legacy transport defaults  
2. **Severity:** Medium–High  
3. **Category:** Dead/zombie code / landmine defaults  
4. **Files involved:**
   - `src/services/stream/adapters/mappers/messageMapper.ts` — only used by its tests; typo type `ChrravelChatMessage`
   - Live path: `src/features/chat/adapters/streamMessageViewModel.ts`
   - `src/components/pro/channels/ChannelChatView.tsx` — imports `mapStreamMessagesToChannelMessages` but maps inline
   - `MessageItem` / `MessageBubble` / `MessageActions` — default `transportMode = 'legacy'`
   - `src/features/chat/hooks/useChatReadReceipts.ts` — Stream `markRead` + Postgres `message_read_receipts` fallback
   - `src/services/chatAnalysisService.ts` — `analyzeChatMessagesForPayment` still SELECTs `trip_chat_messages`
5. **Why this looks like merge debt:** Stream cutover kept kill-switch adapters and “safety” fallbacks. Jul 13 chat/voice conflict recomposition notes in `claude-progress.txt` match dual field contracts.
6. **Exact conflicting logic:** Three Stream→UI mapping responsibilities; read receipts can write Stream IDs into unused Postgres table during channel-null races; payment chat analysis reads a deprecated table (currently only exercised by tests — PaymentInput uses other helpers).
7. **User-facing risk:** Missed `transportMode` on a new caller → legacy mutation failure toast; sticky unread around channel switch; payment-from-chat analysis no-ops if re-enabled.
8. **Engineering risk:** Fixes land in the wrong adapter; false confidence from mapper tests that do not run in production.
9. **Recommended fix:** Delete or quarantine `messageMapper`. Wire `ChannelChatView` to one mapper. Default `transportMode` to `'stream'` (or require explicit). Kill Postgres read-receipt fallback when Stream is configured. Delete or retarget `analyzeChatMessagesForPayment`.
10. **Fix now or later:** **Phase 2** for adapters/defaults; **Phase 1** if any non-TripChat surface still omits `transportMode`.

---

### 11. Concierge payment invalidation misses balances

1. **Title:** Concierge settle/add invalidates payments list but not balances  
2. **Severity:** Medium  
3. **Category:** Partial migration / cache contract drift  
4. **Files involved:**
   - `src/lib/conciergeInvalidation.ts` — payments → `[tripKeys.payments(tripId)]` only
   - `src/hooks/usePendingActions.ts` — same pattern for payment tools
   - Contrast: `usePayments` / settle dialogs invalidate `paymentBalances` too
5. **Why this looks like merge debt:** Balance query was split onto its own key; concierge invalidation was only half-updated.
6. **Exact conflicting logic:** After Concierge creates/settles a payment, list may refresh while outstanding balance summary stays stale.
7. **User-facing risk:** User thinks settlement did not apply until manual refresh/navigation.
8. **Engineering risk:** Same class of bug as agenda/lineup orphans.
9. **Recommended fix:** Always invalidate `tripKeys.paymentBalances(tripId, userId)` alongside payments for payment tool classes.
10. **Fix now or later:** **Phase 1.**

---

### 12. Orphan `['events']` invalidations

1. **Title:** Dead events list invalidations  
2. **Severity:** Medium  
3. **Category:** Dead code / false confidence  
4. **Files involved:**
   - `src/hooks/useUserTripsRealtime.ts`
   - `src/hooks/useDeleteTrip.ts`
   - `src/lib/tripCoverInvalidation.ts`
   - `src/lib/joinRequestMutations.ts`
5. **Why this looks like merge debt:** Events never got their own list query; Index filters `trip_type === 'event'` from trips. Invalidations for `['events']` were left behind.
6. **Exact conflicting logic:** No owning `useQuery` for `['events']`.
7. **User-facing risk:** Low direct — but engineers believe events refreshed when they did not.
8. **Engineering risk:** Masks the real need to invalidate `['trips', userId, …]`.
9. **Recommended fix:** Remove `['events']` invalidations; ensure trips-list keys are invalidated instead. Optionally add `tripKeys.events` only if a real events list query is introduced.
10. **Fix now or later:** **Phase 3.**

---

### 13. Dual Pro trip mappers / list loaders

1. **Title:** `useProTrips` mapper vs `tripConverter` vs Index filter  
2. **Severity:** Medium  
3. **Category:** Duplicate transformers / multiple sources of truth  
4. **Files involved:**
   - `src/hooks/useProTrips.ts` — `mapSupabaseTripToProTripData`
   - `src/utils/tripConverter.ts` — `convertSupabaseTripToProTrip` (`@ts-nocheck`)
   - `src/pages/Index.tsx` — filters pro/events from `useTrips`
5. **Why this looks like merge debt:** Dashboard derives Pro/Events from `useTrips`; parallel `useProTrips` list exists for cards/admin with a different mapper.
6. **Exact conflicting logic:** Category/cover/archive fields can drift between card and detail.
7. **User-facing risk:** Card shows different cover/category than detail after schema renames.
8. **Engineering risk:** Every schema field needs two mapper updates.
9. **Recommended fix:** One converter module; Index and Pro lists share it; delete the duplicate mapper.
10. **Fix now or later:** **Phase 2** (pair with Pro detail getTripById migration).

---

### 14. PaymentMethod camel/snake dual interface

1. **Title:** Payment method field alias frozen into the type  
2. **Severity:** Medium  
3. **Category:** Type-safety erosion / API contract drift  
4. **Files involved:**
   - `src/types/payments.ts` — `type`/`method_type`, `displayName`/`display_name`, etc.
   - `src/services/paymentBalanceService.ts` — emits both
5. **Why this looks like merge debt:** Half-finished camelCase migration preserved both spellings in the exported type.
6. **Exact conflicting logic:** Callers may read the wrong alias → blank Venmo/Zelle handles.
7. **User-facing risk:** Missing payment handles in settle UI.
8. **Engineering risk:** TypeScript cannot catch wrong-field reads when both are optional.
9. **Recommended fix:** Canonical camelCase app type; one adapter at the DB boundary; delete snake aliases from UI types.
10. **Fix now or later:** **Phase 3** (escalate if settle UI blanks are observed).

---

### 15. Concierge dual action naming (`addToCalendar` vs `add_to_calendar`)

1. **Title:** Tool registry camelCase vs pending-action snake_case  
2. **Severity:** Medium  
3. **Category:** Contract drift / latent bug  
4. **Files involved:**
   - `PendingActionCard` — `addToCalendar`
   - `functionExecutor` / `ConciergeActionCard` / `PENDING_ACTION_TYPES` — `add_to_calendar`
   - Tool registry + `usePendingActions`
5. **Why this looks like merge debt:** Intentional dual contract that behaves like “accept both” under merges; easy to wire the wrong key.
6. **Exact conflicting logic:** Success cards can render null (`if (!config) return null`) when the wrong key lands.
7. **User-facing risk:** Concierge “added to calendar” card disappears after tool success.
8. **Engineering risk:** Every new tool needs dual registration — already a known 5-file sync invariant.
9. **Recommended fix:** Single canonical action type string; adapter only at the DB/edge boundary; expand the existing parity test.
10. **Fix now or later:** **Phase 2.**

---

### 16. Zombie edge functions and legacy billing aliases

1. **Title:** `google-tts`, `push-notifications`, legacy `pro-growing` alias, `create_payment_with_splits` v1 types  
2. **Severity:** Low–Medium  
3. **Category:** Dead/zombie code / optional cleanup  
4. **Files involved:**
   - `supabase/functions/google-tts` — no SPA callers; live TTS is `concierge-voice-tts`
   - `push-notifications` — still invoked for email from `notificationService`
   - `src/constants/stripe.ts` — `STRIPE_PRODUCTS['pro-growing']` alias (parity-tested)
   - Generated types still list `create_payment_with_splits` v1 while clients use `_v2`
5. **Why this looks like merge debt:** Provider/migrations cut over without retiring old entrypoints from deploy surface / types.
6. **Exact conflicting logic:** Ops/docs can wire the dead path; types advertise revoked RPCs.
7. **User-facing risk:** Low if unused; High if someone rewires TTS/email incorrectly.
8. **Engineering risk:** Deploy inventory lies.
9. **Recommended fix:** Mark zombies HTTP 410 or remove from deploy set; keep billing alias until Stripe dashboard cleanup; drop v1 from generated types after DB revoke confirmation.
10. **Fix now or later:** **Phase 3** (except email path — fold into Phase 1 push consolidation).

---

### 17. Cover field alias resolver + `@ts-nocheck` converters

1. **Title:** Cover/title alias glue and nocheck converters  
2. **Severity:** Low–Medium  
3. **Category:** Type-safety erosion / mapping layers  
4. **Files involved:**
   - `src/lib/tripCoverResolver.ts`
   - `src/utils/tripConverter.ts` (`@ts-nocheck`)
   - Multiple services with `@ts-nocheck` for schema drift
5. **Why this looks like merge debt:** Adapters absorb schema renames (`cover_image_url` / `cover_photo_url` / `coverPhotoUrl` / …) instead of one canonical shape.
6. **Exact conflicting logic:** Paths that set only one alias can show wrong/missing covers.
7. **User-facing risk:** Wrong cover on card vs detail.
8. **Engineering risk:** `@ts-nocheck` hides real contract breaks.
9. **Recommended fix:** Canonical DB column + generated types; resolver becomes a thin migration shim then dies; remove `@ts-nocheck` file by file.
10. **Fix now or later:** **Phase 3.**

---

### 18. FEATURE_LIMITS vs FREEMIUM_LIMITS dual maps

1. **Title:** Dual quota maps kept in parity by tests  
2. **Severity:** Low  
3. **Category:** Duplicate logic / optional cleanup  
4. **Files involved:**
   - `src/billing/entitlements.ts` — `FEATURE_LIMITS`
   - `src/utils/featureTiers.ts` — `FREEMIUM_LIMITS`
   - `src/billing/__tests__/pricingParity.test.ts`
5. **Why this looks like merge debt:** Two product-era limit tables; parity tests prevent drift but do not collapse ownership.
6. **Exact conflicting logic:** Storage/events/AI limits must be updated in two places.
7. **User-facing risk:** Low while parity tests stay green; High if someone updates only one map.
8. **Engineering risk:** Ongoing merge conflict magnet.
9. **Recommended fix:** Single limits module; both call sites import it.
10. **Fix now or later:** **Phase 3.**

---

## Findings by subsystem (minimum collapse set)

| Subsystem | Collapse to one SoT | Findings |
|-----------|---------------------|----------|
| **Payments** | `usePayments` + `paymentBalances` key; kill dual cache shape | #1, #11, #14 |
| **Permissions** | `get_trip_mutation_permissions` (+ admin RPC) for UI and mutations | #2, #9 |
| **Query keys** | Factory ≡ live key (lineup now; events invalidations next) | #3, #12 |
| **Trip detail** | `getTripById` / `useTripDetailData` for consumer+pro+event; no mock seed on auth | #4, #7, #13 |
| **Chat/Stream** | One broadcast contract; one mapper; stream defaults | #5, #10 |
| **Notifications** | Fanout queue only | #6, #16 |
| **Entitlements** | `useConsumerSubscription` only | #8, #18 |
| **Concierge** | One action-type string; complete invalidation sets | #11, #15 |

---

## Pattern-Level Diagnosis

Recurring bad merge patterns:

1. **Accept both + adapter bandage** — dual cache shapes (`paymentCacheUtils`), dual broadcast markers (view-model OR), dual payment method fields, dual entitlement hooks.
2. **Partial migration freeze** — consumer detail modernized; Pro/Event left on list-find; calendar UI left on old permission hook after RPC landed.
3. **Factory/call-site drift** — agenda fixed; lineup still broken; orphan `['events']` invalidations.
4. **Kill-switch debris** — Stream legacy transport defaults, Postgres read-receipt fallback, dead `messageMapper`, zombie edge functions.
5. **Demo scaffolding leakage** — `generateTripMockData` still in authenticated shells.
6. **Desktop/mobile fork** — payments and some permission/UX paths diverge by surface instead of sharing hooks.

Main issue class: **duplicated logic + architectural drift at ownership boundaries**, not dead-code volume. Subsystems most affected: **Payments, Permissions/Calendar, Chat/Stream, Pro/Event trip detail, Notifications.**

---

## Root-Cause Hypothesis

Structurally, this debt accumulated because:

1. **Trunk-based merges into production `main` with Lovable two-way sync** create frequent conflict surfaces; agents and humans often preserve both sides to “keep green.”
2. **Migrations are layered (Stream over Supabase chat, RPC perms over client matrix, edge entitlements over DB reads)** without hard cutover PRs that delete the old path in the same merge.
3. **Desktop vs mobile were fixed independently**, so “accept both” produced dual implementations sharing keys/types.
4. **Query-key renames** (camel → kebab) were applied unevenly — proven by agenda fix vs lineup miss.
5. **Ownership boundaries are unclear** — who owns members? payments cache? broadcast schema? permissions for calendar chrome? Without a single owner, merges reintroduce the second path.
6. **Type bandaids** (`as any`, `@ts-nocheck`, optional dual fields) let incompatible shapes compile together, hiding semantic conflicts until runtime.

This is not evidence of a single bad merge — it is a systemic resolution habit: **preserve legacy + ship replacement**, then add adapters until both appear intentional.

---

## Surgical Cleanup Plan

### Phase 1 — Critical production-risk fixes (do first)

1. Canonicalize payments cache shape; route mobile through `usePayments` + `paymentBalances`.
2. Fix `tripKeys.lineup` ↔ `event-lineup` parity + test.
3. Calendar chrome ← `useMutationPermissions` only.
4. Concierge payment invalidation includes balances.
5. Broadcast write/read contract normalization (trip + history search).
6. Stop seeding authenticated trip context from `generateTripMockData`.
7. Calendar bulk-import notifications via fanout only.

### Phase 2 — Architecture consolidation

1. Pro/Event detail → `getTripById` / shared detail hook.
2. Collapse permission reads to server RPCs; delete client allowlist fallbacks from critical UI.
3. Entitlements: sole SoT = `useConsumerSubscription`.
4. Chat: delete dead mappers; default `transportMode='stream'`; kill Postgres read-receipt fallback when Stream configured.
5. One Pro trip converter; delete duplicate mapper.
6. Concierge action-type string unification.

### Phase 3 — Dead code and type cleanup

1. Remove orphan `['events']` invalidations.
2. Retire/410 `google-tts`; fold email off `push-notifications`.
3. Delete `analyzeChatMessagesForPayment` or retarget to Stream.
4. Collapse `FEATURE_LIMITS` / `FREEMIUM_LIMITS`.
5. Remove PaymentMethod snake aliases; burn down `@ts-nocheck` converters.
6. Doc drift: AGENTS.md LiveKit reference, voice path docs.

### Phase 4 — Guardrails to prevent recurrence

See next section. Land CI + review checklist **in the same window as Phase 1** so cleanup does not regress.

---

## Guardrails

### Lint / CI

1. **Query-key parity CI** — extend `drift:query-keys` to assert every `tripKeys.*` factory value equals the live `useQuery` key (catch lineup-class bugs).
2. **Ban dual cache shapes** — lint or unit test: `tripKeys.payments` value type is `PaymentMessage[]` only.
3. **No new `@ts-nocheck`** in `src/` (eslint override deny-list).
4. **Import ban** — forbid `chatService` / `legacyMessageMutations` outside explicitly allowlisted kill-switch modules (expand existing eslint boundary).
5. **Duplicate symbol sniff** — CI script flags near-duplicate exports (`mapSupabaseTripToProTripData` vs `convertSupabaseTripToProTrip`).

### Type strictness

1. One canonical app type per entity; adapters only at DB/Stream boundaries.
2. No optional dual fields (`displayName?` + `display_name?`) on UI-facing types.
3. Typed RPC wrappers for `get_trip_mutation_permissions`, `get_trip_admin_permissions`, etc.

### Architectural conventions

1. **One hook owns one query key.** Desktop and mobile must share the hook, not re-declare `useQuery` with the same key.
2. **UI gates must use the same permission oracle as mutations.**
3. **Cutover PRs delete the old path** (or feature-flag it OFF with a removal date) — “adapter for both” requires an explicit TODO + issue link (Deferral Discipline carve-out).
4. **Demo data never enters authenticated context builders.**

### PR review checklist (merge-debt specific)

- [ ] Did this PR add a second path for an existing responsibility? If yes, which path dies?
- [ ] Any new query key — is it only constructed via `tripKeys` / feature factories?
- [ ] Desktop and mobile share the same hook for this data?
- [ ] Permission UI gate ≡ mutation gate?
- [ ] Stream/custom field writes use the canonical contract (no new aliases)?
- [ ] Conflict resolution: document `current` / `incoming` / `both` / `manual recomposition` with rationale (already in AGENTS.md §4E).

### Merge conflict resolution workflow

1. Run `npm run merge:preflight` before and after resolution.
2. Prefer **manual recomposition** over accept-both when both sides touch ownership boundaries (query keys, permissions, chat transport, entitlements, payments cache).
3. After accept-both: immediately schedule a cutover issue using the Follow-Up Issue Plan template — do not leave dual paths unmarked.
4. Add a regression test that fails if the discarded path is reintroduced.

---

## Distilled backlog (paste-ready priorities)

### Fix now / Phase 1 follow-ups

**Title:** Canonicalize `tripKeys.payments` cache shape  
**Why this matters:** Desktop/mobile overwrite each other’s cache; optimistic updates can silently no-op.  
**Files:** `usePayments.ts`, `MobileTripPayments.tsx`, `paymentCacheUtils.ts`, payments tests  
**Current risk:** Silent missing/stale payments and balances.  
**Recommended fix:** Array-only payments key; balances on `paymentBalances`; mobile uses `usePayments`.  
**Acceptance criteria:** One shape in cache; mobile+desktop create/settle/refetch green; dual-shape branches deleted.  
**Test plan:** Unit tests for cache utils + hook integration desktop/mobile.  
**Rollback plan:** `git revert` of the consolidation commit.  
**Launch-blocking?** Yes for payments reliability.

**Title:** Fix `tripKeys.lineup` orphan (agenda twin)  
**Why this matters:** Factory invalidations no-op; stale lineup after writes.  
**Files:** `queryKeys.ts`, `useEventLineup.ts`, `LineupTab.tsx`  
**Current risk:** Stale event lineup UI.  
**Recommended fix:** Align factory and callers; parity test.  
**Acceptance criteria:** `tripKeys.lineup(id)` === live query key; invalidation refreshes UI.  
**Test plan:** Mirror agenda key parity test.  
**Rollback plan:** Revert one-line key change.  
**Launch-blocking?** No for consumer; Yes before Event lineup-dependent release.

**Title:** Calendar UI uses `useMutationPermissions`  
**Why this matters:** Buttons and writes disagree.  
**Files:** `GroupCalendar.tsx`, `MobileGroupCalendar.tsx`, `useRolePermissions.ts`, `useMutationPermissions.ts`  
**Current risk:** False enable/disable of import/edit.  
**Recommended fix:** Single RPC-backed gate for chrome + mutations.  
**Acceptance criteria:** Parity test consumer/pro/event.  
**Test plan:** Permission fixture matrix.  
**Rollback plan:** Revert UI hook swap.  
**Launch-blocking?** Yes for Pro calendar reliability.

---

## Merge Preflight Report

- **Base branch:** `main`
- **Branch:** `cursor/semantic-merge-debt-audit-69a3`
- **Scope of this PR:** documentation audit only (no product code)
- **Dry-run:** run `npm run merge:preflight` before push
- **Residual merge risks:** low — docs-only; possible overlap with other docs/audit PRs on `docs/AUDIT_INDEX.md`

---

## Validation Notes

Verified directly in source for Critical/High claims:

- Payments dual cache shapes on `tripKeys.payments`
- `tripKeys.lineup` vs `['event-lineup', …]`
- `SUBSCRIPTION_TIER_MAP.growing === 'pro-growth'` (May Critical fixed)
- TripChat `transportMode="stream"`; Message* defaults still `'legacy'`
- Pro detail `userTrips.find(...)`
- `generateTripMockData` on authenticated desktop/mobile trip detail
- Calendar `canPerformAction` default allowlist
- `fetchTripBroadcastHistory` filters only `message_type`
- `sendBulkImportNotification` → `web-push-send`
- Dead `messageMapper` (test-only imports)
- Concierge invalidation misses `paymentBalances`

Not runtime-reproduced in this environment: authenticated Playwright journeys, live Stream broadcast backfill counts, Stripe checkout click-path (covered by unit parity tests).

---

## Deferral Discipline Footer

1. **Fixed now:** N/A (audit-only PR). Report supersedes May findings with current status.
2. **Discovered:** Payments cache shape collision; lineup orphan; calendar dual-gate; Pro/Event list-find; broadcast dual contract; push bypass; mock context on auth trips; entitlement dual stack; concierge balance invalidation gap.
3. **Intentionally deferred (product fixes):** All code remediations — this automation delivers the audit + prioritized plan, not the Phase 1 patches.
4. **Why deferral was necessary:** Cron audit mission is diagnose + document + guardrail plan; mixing Phase 1 code would expand blast radius without dedicated test matrix per subsystem.
5. **Follow-up prompts:** See Distilled backlog above (three paste-ready Phase 1 issues).
6. **Validation completed:** Source verification of Critical/High claims; cross-check against May 2026 audit + 2026-07-25 post-drift audit.
7. **Remaining launch blockers (from this audit):** Payments cache collision; calendar permission dual-gate; authenticated mock-context seeding; Pro/Event invite deep-link Not Found risk. Lineup orphan is Event-path blocking. Broadcast history incompleteness is chat-path blocking for Broadcasts tab trust.
