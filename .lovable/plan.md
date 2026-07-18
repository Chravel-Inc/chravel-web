## Problem

The Google sign-in flow hangs on the account-picker screen for the tester on the iOS build (TestFlight). Two symptoms are consistent with the same root cause:

1. **"Choose an account" screen never dismisses** after tapping their Google account (screenshot #2 / #3).
2. On an earlier attempt the button stayed on **"Redirecting…"** after they returned to the app (screenshot #1) — the session exchange never completed inside the WebView, so `AuthModal` never re-rendered as signed-in and email/password sign-in also fails because the app already holds a half-broken auth attempt.

## Root cause (high confidence, needs one verification step)

In `src/hooks/useAuth.tsx` (`signInWithGoogle`) the installed-app branch calls `openInstalledAuthBrowser(data.url)`. In `src/utils/installedAuthBrowser.ts` that helper **prefers `Capacitor.Plugins.Browser` first** (SFSafariViewController) and only falls back to `window.ChravelNative.openOAuthUrl` (ASWebAuthenticationSession) if Capacitor Browser is absent.

- SFSafariViewController **does not auto-dismiss on a callback URL** and does not hand Universal Links back to the same app when the app opened it — Google redirects to `https://chravel.app/auth-callback?code=…`, that page renders **inside SFSafariViewController**, and the outer WebView (which owns the PKCE `code_verifier` in localStorage) never runs `exchangeCodeForSession`. Result: infinite spinner on the Google page.
- The `redirectTo` for the native shell is currently `https://chravel.app/auth-callback` (`getOAuthRedirectUrl` in `src/hooks/auth/authHelpers.ts`) — a Universal Link, not the `chravel://auth-callback` custom scheme that ASWebAuthenticationSession needs to auto-close.
- The earlier "Redirecting…" state on the modal confirms the button loading flag is never cleared because `signInWithOAuth` returned without a session and no callback ever fired.

## Fix plan

**1. Prefer the ASWebAuthenticationSession bridge over SFSafariViewController.**
   - In `src/utils/installedAuthBrowser.ts`, reorder strategies: try `window.ChravelNative.openOAuthUrl` **first**, then Capacitor Browser, then web redirect. The native bridge closes automatically on the callback URL and hands the URL back to the WebView — this is exactly the flow the memory notes (`auth/pkce-flow-resilience`) call the reliable path.
   - Leave the `native-shell-missing-bridge` guard in place so we surface an actionable "update your app" message if neither bridge is present.

**2. Use the custom-scheme callback when using the native bridge.**
   - In `src/hooks/auth/authHelpers.ts` (`getOAuthRedirectUrl`), when `ChravelNative.isNative === true` **and** `ChravelNative.openOAuthUrl` is defined, return `chravel://auth-callback?…`. When only Capacitor Browser is present, keep `https://chravel.app/auth-callback` (Universal Link). Web path unchanged.
   - The chravel-mobile shell already documents both contracts in `src/utils/nativeBridge.ts`; no shell change required if `openOAuthUrl` is present.

**3. Clear the AuthModal loading state on all return paths.**
   - In `src/components/AuthModal.tsx`, ensure the Google button's `Redirecting…` state resets when `signInWithGoogle` resolves (success or error) **and** on `visibilitychange` back to the tab, so the user can retry if the OAuth window was dismissed without a session. Also disable duplicate-tap while pending.

**4. Add a hard timeout + user-visible recovery in `AuthCallbackPage`.**
   - It already fails fast after ~3s of polling. Extend the "Sign in with email" recovery button to also call `supabase.auth.signOut()` first, so a half-exchanged PKCE state (their "recognizes I've signed up but I can't get in" symptom) is wiped before they retry. This prevents the account-exists-but-no-session dead end.

**5. One verification step before shipping.**
   - Confirm with the chravel-mobile shell whether `window.ChravelNative.openOAuthUrl` is actually wired in the current TestFlight build. If it is **not** yet shipped, we need to (a) keep Capacitor Browser as fallback and (b) add a Capacitor `App.appUrlOpen` listener path that closes `Browser` and forwards the callback URL to the WebView. If `openOAuthUrl` is shipped, plan step 1+2 are sufficient.

## Files touched

- `src/utils/installedAuthBrowser.ts` — reorder strategies, prefer native bridge.
- `src/hooks/auth/authHelpers.ts` — return `chravel://auth-callback` when the native OAuth bridge is present.
- `src/hooks/useAuth.tsx` — no behavior change beyond the helpers above; verify error path returns clear the local loading state.
- `src/components/AuthModal.tsx` — reset Google button loading state on resolve + on tab re-focus; guard against double-tap.
- `src/pages/AuthCallbackPage.tsx` — sign out any partial session before the "Sign in with email" recovery button navigates away.

## Not in scope

- No changes to Supabase provider config, CORS, RLS, or Google Cloud Console.
- No change to the web (non-installed) Google flow — it works.
- No touching of the AASA file or Universal Link setup.

## Validation

- Unit: extend `src/hooks/__tests__/useAuth.test.tsx` to assert `redirectTo` is `chravel://auth-callback` when `ChravelNative.openOAuthUrl` is present and `https://chravel.app/auth-callback` otherwise.
- Unit: `src/pages/__tests__/AuthCallbackPage.test.tsx` — add a case that recovery button calls `signOut` before navigating to `/auth`.
- Manual (TestFlight): tap Google → account picker → select account → auth session dismisses automatically → app lands signed-in on the returnTo route. Retry after cancel should re-open the picker without a stuck spinner.
