# Dead Code Audit — 2026-06-07

Periodic forensic audit + surgical cleanup pass. Proof-driven; no speculative deletions.

## 1. Executive Summary

| Metric | Before (knip) | After cleanup | Notes |
|--------|---------------|---------------|-------|
| Unused files (knip) | 285 | ~230 | Many remain as framework entry points (api/, remotion/, supabase/functions/, scripts/) |
| Unused dependencies | 2 | 0 in `src/` scope | Removed `embla-carousel-react`, `@revenuecat/purchases-js` |
| Lines removed (this pass) | — | **9,309** | 71 files touched |
| Safe removals implemented | — | **54 files** | Low + medium risk, proof-verified |
| Deferred (external/product confirmation) | — | **~8 areas** | See §6 |

**Benefits:** ~9.3K LOC removed, 2 unused npm packages dropped, duplicate utilities eliminated, orphaned UI/settings/notifications subtrees removed, dead broadcast UI scaffold removed (service layer kept), clearer billing hook surface.

---

## 2. Audit Table (implemented removals)

| ID | Category | File / Symbol | Why Dead | Proof | Impact | Action | Risk | External? |
|----|----------|---------------|----------|-------|--------|--------|------|-----------|
| D01 | Component | `DevEnvBanner.tsx` | Never mounted | `rg DevEnvBanner src/` → self only | None | Remove | Low | N |
| D02 | Component | `LinkCard.tsx` | Superseded by inline `LinkCard` in `MediaUrlsPanel` | 0 imports | None | Remove | Low | N |
| D03 | Component | `SearchResults.tsx` | Orphan | 0 imports | None | Remove | Low | N |
| D04 | Component | `home/EmptyState.tsx` | Orphan | 0 imports | None | Remove | Low | N |
| D05 | Component | `media/MediaItem.tsx` | Orphan | 0 imports | None | Remove | Low | N |
| D06 | Component | `EmergencyBroadcast.tsx` | Never routed | 0 imports; PRD reference only | None | Remove | Low | N |
| D07 | Component | `payments/PaymentMessage.tsx` | Type used; component unused | `PaymentMessage` type from `types/payments` used; component 0 imports | None | Remove component | Low | N |
| D08 | Duplicate | `mobile/MobileTeamMemberCard.tsx` | Duplicate of root `MobileTeamMemberCard` | Only root imported in `OrganizationDashboard` | None | Remove duplicate | Low | N |
| D09 | Utility | `utils/demoMode.ts` | Superseded | `demoModeStore` + `demoModeService` canonical | None | Remove | Low | N |
| D10 | Types | `types/enterprise.ts` | Superseded | 0 imports; `proCategories` + `consumer` types live | None | Remove | Low | N |
| D11 | Service | `googleMapsService.ts` | Superseded | `googlePlacesNew.ts` + loader used | None | Remove | Low | N |
| D12 | Service | `contextCacheService.ts` | Orphan | 0 imports/tests | None | Remove | Low | N |
| D13 | Service | `calendarSync.ts` | Superseded | `calendarSyncService.ts` canonical | None | Remove | Low | N |
| D14 | Dev tool | `lib/egressLogger.ts` | DevTools-only, never wired | 0 production imports | None | Remove | Low | N |
| D15 | Hook | `useOrientation.ts` | Superseded | `useOrientationTransition` used in `NativeTabBar` | None | Remove | Low | N |
| D16–20 | UI primitive | `ui/{breadcrumb,carousel,chart,pagination,sidebar}.tsx` | shadcn scaffolds never adopted | 0 `@/components/ui/*` imports | Smaller tree-shake surface | Remove | Low | N |
| D21–22 | AI config | `ai/{aiFeatureConfig,types}.ts` | Orphan | 0 imports | None | Remove | Low | N |
| D23 | Barrel | `lib/adapters/index.ts` | Unused barrel | Direct `paymentAdapter` imports used | None | Remove | Low | N |
| D24–26 | Settings | `settings/{ProfileSection,NotificationsSection,AvatarUpload}` | Superseded by `ConsumerProfileSection` etc. | 0 external imports | None | Remove | Low | N |
| D27–30 | Notifications | `notifications/{EnableNotificationsButton,IOSPushInstructions,NotificationPreferences,index}` | Superseded by `ConsumerNotificationsSection` | 0 production imports | None | Remove | Low | N |
| D31 | Hook | `useUnifiedEntitlements.ts` | Superseded | `useConsumerSubscription` + `entitlementsStore` canonical; 0 external imports | None | Remove | Medium | N |
| D32 | Hook | `useRevenueCatSubscription.ts` | Orphan | Only dead `subscription/index` re-exported | Enables dep removal | Remove | Medium | N |
| D33–34 | Subscription UI | `subscription/{SubscriptionPaywall,index}` + test | Test-only surface | `featurePaywall.ts` is live path | None | Remove | Low | N |
| D35–36 | Wrapper | `SmartImport.tsx` + test | Production uses `SmartImportGmail`/`Review` directly | Only test imported wrapper | None | Remove | Low | N |
| D37–38 | Mobile nav | `MobileBottomNav` + test | Never mounted in app shell | Test-only | None | Remove | Low | N |
| D39–40 | Payment processors | `paymentProcessors/{stripeProcessor,types}` | Stub scaffold | 0 imports | None | Remove | Medium | N |
| D41–44 | Stream barrel | `stream/{index,streamUserSync,mappers/*}` | Dead re-export chain | 0 `@/services/stream` imports | None | Remove | Low | N |
| D45–46 | Billing hooks | `billing/hooks/{useBilling,useEntitlements}` | Scaffold never wired | 0 imports; providers kept | None | Remove | Medium | N |
| D47 | Feature tree | `features/broadcasts/**` (14 files) | UI never routed | 0 external imports; `broadcastService` + edge fns kept | None (service layer intact) | Remove UI | Medium | N |
| D48 | Hook | `useStreamBroadcasts` + test | Only consumed by dead broadcasts UI | Cascade from D47 | None | Remove | Medium | N |
| D49–50 | Smart import | `ArtifactImportDropzone` + `useArtifactIngest` | Dead chain | 0 external imports | None | Remove | Low | N |
| D51–52 | Calendar | `GoogleCalendarSync` + test | Test-only component | Not wired in settings | None | Remove | Medium | N |
| D53 | Export | `formatCurrency` in `constants/currencies.ts` | Duplicate | `currencyService.formatCurrency` is canonical | None | Remove export | Low | N |
| D54–55 | Dependencies | `embla-carousel-react`, `@revenuecat/purchases-js` | Only dead files imported | knip + manual `rg` | Smaller bundle/audit surface | `npm uninstall` | Low | N |

---

## 3. Intentionally Kept (false positives / deferred)

| Item | Why kept |
|------|----------|
| `src/services/broadcastService.ts` | Live service + tests; edge functions `broadcasts-*` still deployed |
| `src/billing/providers/**` | IAP scaffold documented for App Store; tests pass; not wired to UI yet — product decision |
| `api/*.ts`, `remotion/**`, `supabase/functions/**` | Framework entry points knip cannot resolve |
| `public/sw.js`, `public/firebase-messaging-sw.js` | Build/runtime entry points |
| `useWebPush.ts` | Used by `ConsumerNotificationsSection` |
| `components/ui/table.tsx` | Used by `SeoDashboard` |
| `unifiedMessagingService`, `recommendationService` | Live admin/recs paths |

---

## 4. Cleanup Plan (executed)

1. Delete leaf orphan components/hooks/utils (D01–D23)
2. Delete superseded settings/notifications subtree (D24–D30)
3. Delete dead entitlement/subscription hooks (D31–D34)
4. Delete test-only wrappers (D35–D38)
5. Delete dead service scaffolds (D39–D46)
6. Delete unrouted `features/broadcasts/` UI (D47–D48) — **keep** `broadcastService`
7. Delete smart-import/calendar dead chains (D49–D52)
8. Prune duplicate export + npm deps (D53–D55)
9. Verify: `npm run typecheck && npm run lint:check && npm run build`

---

## 5. External Steps (not executed — require ops/product)

1. **Broadcasts UI removal:** Confirm product no longer plans standalone Broadcasts tab; backend (`broadcasts-create/fetch/react` edge functions, DB tables) remains live.
2. **Billing providers scaffold:** Wire `getBillingProvider()` into checkout or delete scaffold after native IAP ships in chravel-mobile.
3. **RevenueCat web SDK:** Docs reference web billing via `purchases-js`; removed because only dead hook imported it. Re-add when web IAP is implemented.
4. **knip config:** Add `knip.json` with entry points for `api/`, `remotion/`, `supabase/functions/`, `scripts/` to reduce false positives (~230 flagged files).

---

## 6. Verification

```bash
npm run typecheck   # ✅
npm run lint:check  # ✅ 0 errors (336 warnings baseline)
npm run build       # ✅
npm run test:run -- src/billing src/services/__tests__/broadcastService.test.ts  # ✅ 31 tests
```

**Rollback:** `git revert <commit-sha>` restores all deleted files and dependencies.

---

## 7. Follow-up (next pass)

- Add `knip.json` entry configuration
- Triage remaining ~397 unused exports (many are public API / edge shared modules)
- Consolidate `utils/errorTracking.ts` vs `services/errorTracking.ts`
- Wire or delete `billing/providers` scaffold after product sign-off
- Batch-delete knip-flagged scripts only after CI reference check
