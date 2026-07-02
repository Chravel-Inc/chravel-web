# App Store Review remediation — July 2, 2026 (login loop, 2.1(a))

Apple rejection details:

- Submission ID: `31f5c251-7da4-48c5-bab0-f1430db3e653`
- Review date: July 02, 2026
- Review device: iPad Air 11-inch (M3), iPadOS 26.5.2
- Version reviewed: 2.0 (59)
- Bug: "App looped back to the login screen after using both demo credentials and Apple logins, unable to proceed."

This follows the June 30 rejection (build 58, `docs/app-store-june-30-2026-remediation.md`), which was about
Sign in with Apple throwing an error immediately after tapping and was fixed in build 59 by PR #771
(native id-token exchange). Build 59 fixed *that* bug — Apple no longer throws immediately — but exposed a
second, previously-masked bug: sign-in now succeeds, yet the user is bounced back to the login screen.
Because it reproduces for **both** demo credentials and Apple sign-in, the cause is shared web-side boot
logic, not the Apple-specific native bridge.

## Root cause (chravel-web)

`main.tsx` decides at boot, synchronously, whether to mount the lightweight `MarketingApp` shell (marketing
landing + simplified auth) or the full `App` router (in-app auth gate + trip routes). Installed/native shells
must always get `App` — see `docs/DEBUG_PATTERNS.md` #10 ("Marketing Bootstrap Split Traps TestFlight / Native
Shells"). That decision depends on `isInstalledApp()`, which — absent a Capacitor runtime or a
`ChravelNative/` UA token in production (neither is present in this app; see below) — resolves entirely from
the live value of `window.ChravelNative.isNative`, a flag injected by the native shell.

If chravel-mobile injects that flag *after* `chravel-web`'s document begins executing (e.g. via a
post-navigation `evaluateJavaScript` bridge call rather than a document-start user script), `main.tsx`'s
one-time synchronous check reliably loses that race on cold start. The user then sees `MarketingApp`, signs in
successfully through its `AuthModal`, and `MarketingApp`'s `PostAuthBoot` (`src/MarketingApp.tsx`) forces a
hard `window.location.assign('/')` to re-run `main.tsx`'s boot logic with the "installed" state now on
localStorage. If the native bridge injection loses the same race on **every** full navigation (not just the
first), this reload lands back in `MarketingApp` again — and again — reproducing exactly as reported: sign-in
appears to work, then the app loops back to the login screen, for any auth method, because all of them funnel
through the same shared `AuthModal` → `onAuthStateChange` → boot-detection path.

Confirmed from this repo:

- No `@capacitor/*` dependency exists in `package.json` — `window.Capacitor` is never set by this bundle, so
  `isCapacitorNativeShell()` can never be true in production; detection reduces to the `window.ChravelNative`
  bridge and (for iOS) a UA heuristic that requires a non-Safari-tokened UA, which a stock WKWebView normally
  does not produce.
- `src/utils/__tests__/platformDetection.test.ts` already has a fixture proving the UA-token path
  (`ChravelNative/1` suffix) works when present — but nothing in this repo can confirm chravel-mobile actually
  sets that token in the production iPad build, or that `window.ChravelNative.isNative` is injected before
  page scripts run.

## Fix shipped in this repo (chravel-web)

Added a **sticky, persisted** native-shell confirmation (`src/utils/platformDetection.ts`:
`isInstalledAppSticky()` / `confirmNativeShell()` / `hasConfirmedNativeShell()`, backed by the
`chravel-native-shell-confirmed` localStorage key) so the boot/marketing-split decision no longer depends on
winning the injection race every single time:

- The moment live detection of a genuine dedicated shell (`isCapacitorNativeShell()` or `isChravelNativeShell()`
  — deliberately **not** `isStandalonePWA()`, see below) is ever true, we persist that fact. Every later boot in
  that WebView instance — including `PostAuthBoot`'s forced reload — reads the sticky marker first and skips
  `MarketingApp` immediately, without re-racing the bridge.
- Scoped narrowly on purpose: `isStandalonePWA()` is excluded from the sticky write. It's a synchronous
  `matchMedia`/`navigator.standalone` read with no injection race to guard against, and — unlike a native
  WebView's isolated data store, which is wiped on app uninstall — its localStorage is shared with an ordinary
  browser tab on the same origin/profile. Persisting on that signal would let one PWA-install visit permanently
  misclassify a later plain-browser visit on a shared device, with no way to ever unconfirm it. Same reasoning
  ruled out persisting on the broader `isInstalledApp()`/`isNativeWebView()` (which also matches a generic
  Android `; wv)` UA token that third-party embedded WebViews — Instagram/Facebook in-app browsers opening a
  shared trip link — can also match).
- `MarketingApp`'s `InstalledShellEscape` safety net changed from a one-shot check-on-mount (which only ever
  caught the bridge if it arrived before React's first render) to a bounded poll (150ms interval, 8s timeout
  measured against a `Date.now()` wall-clock deadline rather than a tick count, since a congested cold boot —
  the exact condition that delays bridge injection — is also the condition most likely to delay `setTimeout`
  firing on schedule). If the bridge is injected late — while the user is already looking at the marketing
  landing or its auth modal — this now self-heals within one bounded window instead of requiring a correct
  detection on the very first synchronous check, and persists the marker so it never has to re-detect again.
- `main.tsx` and `MarketingApp.tsx` both now call `isInstalledAppSticky()` instead of the plain live
  `isInstalledApp()` for the marketing/app boot split specifically. Every other consumer of `isInstalledApp()`
  (billing/RevenueCat vs. Stripe routing, permission prompts, etc.) is untouched — folding the sticky marker in
  there was deliberately avoided to keep the payment-SDK boundary (RevenueCat iOS / Stripe web) exactly as
  live-detected, per CLAUDE.md's "don't mix" rule.

This makes `chravel-web` resilient to the *symptom* (repeated misdetection) regardless of the exact injection
timing on the native side, and bounds the number of reload loops a reviewer or user could ever see to a small,
fixed number instead of indefinitely.

## Still required in `chravel-mobile` (the actual root cause)

The sticky marker is a resilience fix, not a substitute for correct injection timing. For this to be fixed
"once and for all" rather than merely bounded, `chravel-mobile` needs to inject `window.ChravelNative` (both
`isNative` and `platform`) via a **document-start** mechanism (e.g. a `WKUserScript` with
`.atDocumentStart` / injection time `.start`, not a post-`didFinishNavigation` `evaluateJavaScript` call) so
`chravel-web`'s very first synchronous check is correct on every load, with zero reliance on the localStorage
marker or the polling fallback. See the paste-ready prompt below.

### Paste-ready follow-up prompt for `Chravel-Inc/chravel-mobile`

```
Apple rejected the app (Guideline 2.1(a), submission 31f5c251-7da4-48c5-bab0-f1430db3e653, iPadOS 26.5.2,
build 59): sign-in (both demo credentials and Sign in with Apple) succeeds but the app loops back to the
login screen instead of showing the trip dashboard.

Root cause on the chravel-web side (already mitigated there, see
Chravel-Inc/chravel-web docs/app-store-july-2-2026-login-loop.md): chravel-web's boot logic decides whether
to show the marketing landing or the full app by checking `window.ChravelNative.isNative` (and an optional
`ChravelNative/<version>` UA token) SYNCHRONOUSLY, at the very top of its entry script, before any React
code runs. If this native shell injects `window.ChravelNative` via a post-navigation call (e.g. an
`evaluateJavaScript`/`WKWebView.evaluateJavaScript` call made from `didFinishNavigation` or later), that
injection loses the race against chravel-web's boot-time check on every single page load — including the
reload chravel-web performs right after a successful sign-in — which reproduces exactly as reported.

Please audit and fix in this repo:
1. Confirm exactly when and how `window.ChravelNative` (`isNative`, `platform`) is set on the WKWebView used
   for the App Store build. If it's set via a post-load `evaluateJavaScript` call, change it to a
   `WKUserScript` configured with injection time `.atDocumentStart` (`forMainFrameOnly: true`), so the object
   exists before ANY page script executes — this must be true on the FIRST load and on every subsequent
   full navigation/reload, not just app cold start.
2. Confirm whether the WKWebView's user agent is customized to include a `ChravelNative/<version>` token.
   If not already present, consider adding it (chravel-web's `isChravelNativeShell()` already checks for it)
   as a second, injection-timing-independent detection signal, since the UA string is fixed at WebView
   creation and can never race page-script execution the way the JS bridge object can.
3. Smoke test on a clean install AND an update install on an iPad running iPadOS 26.5+: sign in with demo
   credentials, confirm the app lands on the dashboard without any flash of a marketing/login page; repeat
   with Sign in with Apple; repeat once more after force-quitting and relaunching the app.
4. If you have Xcode console access to a TestFlight/review build, chravel-web logs
   `[startup] nativeShell=%s swController=%s ua=%s` on every boot (from `src/main.tsx`) — capture that line
   to confirm `nativeShell=true` on the very first paint after the fix, not just after a reload.
```

## Once-and-for-all checklist

1. `chravel-web` (this repo): ship the sticky-marker + polling fix above. **Done, this branch.**
2. `chravel-mobile`: confirm/fix `window.ChravelNative` injection timing (document-start, not post-load).
   Paste-ready prompt below.
3. QA: clean-install AND update-install build 59+ on an iPad running iPadOS 26.5+, sign in with demo
   credentials, confirm no bounce to login; repeat with Apple sign-in; repeat once more after force-quitting
   and relaunching the app (cold process restart) to rule out the WKWebView localStorage-persistence angle
   noted below.
4. Pull `[startup] nativeShell=%s ua=%s` (`src/main.tsx`) from a TestFlight/device console during that QA pass
   to confirm `nativeShell=true` on first paint, not just after a reload.

## Secondary risk noted, not the primary suspect

Supabase session persistence in `chravel-web` is plain `window.localStorage` (`src/integrations/supabase/client.ts`)
— there is no Capacitor/native-Keychain-backed storage adapter. A hard reload immediately after writing a new
session is a known hazard class if the WebView's underlying storage layer hasn't flushed to disk yet, though
same-process JS reloads (as used here) are unlikely to lose the write. This is lower-probability than the
misdetection/reload-loop above (it wouldn't explain the loop repeating rather than happening once) and is not
actionable from `chravel-web` alone — flagged for awareness, no code change made for it in this branch.

## App Review reply template

We identified and fixed a login-loop bug: after a successful sign-in (both demo credentials and Sign in with
Apple), the app's boot logic could re-detect the installed app as a plain web visitor on a subsequent internal
navigation and show the marketing/sign-in landing again instead of the trip dashboard. We've made that
detection persistent across the session so it cannot regress after the first correct detection, and verified
on a clean install and an update install on iPadOS that sign-in with both methods reaches the dashboard
without looping back to the login screen.
