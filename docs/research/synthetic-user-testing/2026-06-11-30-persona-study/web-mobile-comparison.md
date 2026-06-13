# Web vs Mobile / PWA Comparison

## Evidence
* [OBSERVED] Local Vite dev server served http://127.0.0.1:8080/ and returned the app HTML with PWA/iOS meta tags; Playwright UI execution was blocked because Chromium was not installed in the container.
* [OBSERVED] The app has mobile-specific layout infrastructure, native bottom tab bar safe-area spacing, mobile trip tabs, and responsive settings panels (src/components/native/NativeTabBar.tsx; src/components/mobile/MobileTripTabs.tsx; src/components/settings/SettingsLayout.tsx).
* [OBSERVED] Onboarding is a 10-screen carousel covering chat, calendar, AI concierge, media, payments, places, polls, tasks, then CTA, with explicit Skip controls and Escape-to-skip support (src/components/onboarding/OnboardingCarousel.tsx:54-118,165-193,236-288).
* [OBSERVED] Invite join copy branches on require_approval and defaults to approval framing when invite data is missing; join preview shows trip name, destination, member count, type badge, expiration, and a centered card (src/pages/JoinTrip.tsx:100-127,857-925).
* [OBSERVED] Billing config defines Explorer/Frequent consumer tiers, Pro Starter/Growth/Enterprise, Trip Pass products, IAP requirements, and notes attendee caps are not fully enforced yet (src/billing/config.ts:55-91,100-179,195-210).

## Desktop web
* Strength: setup/import/pricing/admin space.
* Issue: pro/event workflows need denser operational controls.

## Mobile/PWA
* Strength: PWA/iOS shell and native tab-bar affordances exist.
* Issue: live-trip tasks need shorter forms, fewer modals, clearer thumb-reachable CTAs, and real-device deep-link/push verification.

## Bottom line
[SIMULATED RISK] Web is strongest for organizers and professional coordinators; mobile is decisive for invitees and live-trip adoption. Prioritize invite preview, import preview, mute/digest, and guest value on mobile before heavier admin polish.
