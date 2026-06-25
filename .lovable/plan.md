## Goal
Resolve both rejection items for v2.0(53) so the app can be resubmitted:
1. **2.1(a)** — "App goes back to login page after sign in with Apple" on iPhone 17 Pro Max / iOS 26.5.
2. **3.1.1** — App still contains paths to purchase digital subscriptions via mechanisms other than IAP.

What I can change is the web bundle the Capacitor / chravel-mobile WebView loads. The native Apple-bridge ships from the separate `chravel-mobile` repo, so the web fix has to be defense-in-depth on the WebView side.

---

## 1. Apple Sign-In loop fix (2.1a)

### Root cause (most likely)
Native `window.ChravelNative.signInWithApple` isn't in build 53, so `useAuth.signInWithApple` falls through to `supabase.auth.signInWithOAuth({ provider: 'apple' })` with `skipBrowserRedirect: true` and hands the URL to `openInstalledAuthBrowser`. Apple completes auth and redirects to `https://chravel.app/auth-callback#access_token=…`, but that hash is delivered to ASWebAuthenticationSession, never to the main WebView. The WebView reloads on the original `/auth` URL with no session → user is bounced to login.

### Changes (web side)
1. **`src/integrations/supabase/client.ts`** — set `auth.flowType: 'pkce'`. PKCE returns `?code=` (query) instead of `#access_token` (hash), survives the ASWeb round-trip better, and lets us `exchangeCodeForSession` explicitly.
2. **New `src/pages/AuthCallbackPage.tsx`** + wire it to `/auth-callback` in `src/App.tsx` (replace current `AuthPage` mount for that route).
   - On mount, if `?code=` or `#access_token` is present, call `supabase.auth.exchangeCodeForSession(window.location.href)` (PKCE) or rely on hash detection. Await `getSession()` with a short retry loop (up to ~3s).
   - On success → `navigate(returnTo, { replace: true })` (default `/`).
   - On failure → show clear error + "Try email instead" button that navigates to `/auth?mode=signin`. Never silently bounce back to login.
   - Read `returnTo` from query, validated like `AuthPage`.
3. **`src/hooks/useAuth.tsx` — `signInWithApple`** — when no native bridge AND `openInstalledAuthBrowser` returns `web-redirect` inside a native shell, surface the same "update Chravel" error already used for missing bridge, instead of silently `location.assign`-ing inside the WebView (which is the failure mode App Review saw).
4. **`src/components/AuthModal.tsx`** — make email/password the primary visual CTA above OAuth providers on iOS native shell, so App Review (and any user blocked by the OAuth flow) can complete sign-in. (No copy change to web.) Detection via `isNativeAuthSurface()` + iOS UA.

### Verification
- Build passes.
- Manual: hit `/auth-callback?code=fake` in dev — page shows error + fallback CTA (no infinite redirect).
- Manual on iOS Safari (best proxy we have without the binary): Email login flow works inside `/auth` and lands at `/`.

---

## 2. Remove all external-checkout entry points on iOS (3.1.1)

Today, iOS already blocks **consumer** Stripe checkout (`blockConsumerCheckoutOnIOS` in `ConsumerBillingSection.tsx`), but these paths are still reachable inside the native iOS WebView:

| Surface | Calls `create-checkout` and opens external Stripe URL |
|---|---|
| `src/components/conversion/PricingSection.tsx` | Trip Pass purchase, Pro CTA (visible to logged-out users on landing inside the WebView) |
| `src/components/conversion/TripPassModal.tsx` | Both Trip Pass tiers |
| `src/components/UpgradeModal.tsx` | All consumer + Pro tiers |
| `src/components/ProUpgradeModal.tsx` | Pro tier trial |
| `src/components/consumer/ConsumerBillingSection.tsx` → `handleUpgradeToProPlan` | Pro/Org plans (NOT gated today) |

### Changes
Introduce a single helper `isIOSNativeShell()` (already derivable from `detectNativeBillingPlatform(ua, isNativeWebView()) === 'ios'`) and gate every external-checkout button across the surfaces above:

- On iOS native shell, **hide** Trip Pass cards and replace the "Upgrade to …" CTAs with a disabled button labeled `Manage on chravel.app` (no external link, no `window.open`). Add a one-line note: *"Subscriptions are managed on chravel.app on the web."* No "tap here" — Apple flagged steering language.
- `PricingSection.tsx` — when iOS native shell, hide the "Trip Passes" tab entirely and replace `handlePassPurchase` / Pro CTAs with the same disabled state. The marketing pricing grid should still render for context, just without purchase actions.
- `TripPassModal.tsx`, `UpgradeModal.tsx`, `ProUpgradeModal.tsx` — when iOS, render an info state instead of the purchase button.
- `ConsumerBillingSection.tsx` `handleUpgradeToProPlan` — guard with `if (isNativeIOS) return;` and disable Pro upgrade buttons with the same label.

### Verification
- `rg "create-checkout"` and `rg "window.open\(.*url"` — confirm every hit in `src/components/**` is wrapped by the iOS guard.
- Build + typecheck pass.
- Manual (desktop browser with UA spoof to iOS WKWebView): every purchase button is disabled or hidden, no `create-checkout` invocations fire.

---

## Out of scope (explicit)
- Native `chravel-mobile` Expo shell changes (signing-in-with-Apple bridge, `openOAuthUrl`) — separate repo, separate submission. Recommend you also ship the native `signInWithApple` bridge in the next build; PKCE + AuthCallback page is the web-side belt to the native suspenders.
- RevenueCat IAP wiring on iOS (already implemented in `NativeSettings.tsx`). No change here.

## Rollback
All edits are additive guards + one new page; revert the four touched files and delete `AuthCallbackPage.tsx` to restore current behavior.

## Deferral footer
- **Fixed now:** PKCE flow, explicit `/auth-callback` page with retry + error fallback, native-bridge missing → friendly error (not silent redirect), all iOS external-checkout buttons hidden/disabled.
- **Discovered:** `handleUpgradeToProPlan` in `ConsumerBillingSection` had no iOS guard; `PricingSection` Trip Pass + Pro CTAs had no iOS guard.
- **Intentionally deferred:** native `chravel-mobile` Apple bridge ship — different repo.
- **Why deferred:** can't touch that repo from here; web-side PKCE+callback covers the failure mode independently.
- **Follow-up prompt:** *"In chravel-mobile, ship `window.ChravelNative.signInWithApple` using `expo-apple-authentication` and ensure `openOAuthUrl` reloads the callback URL in the main WebView so PKCE `exchangeCodeForSession` runs."*
- **Validation:** lint + typecheck + build; manual check of `/auth-callback?code=xxx` and every gated button.
- **Remaining launch blockers:** none from this branch; resubmit after native bridge ships if Apple repros.
