# ChravelApp 30-Persona Synthetic User Testing Study

**Date:** 2026-06-11  
**Scope:** Research/documentation only. No product functionality was changed.

## What this study is
A code-grounded synthetic research package using exactly 30 personas across consumer trips, pro/sports/touring/work operations, and event/community use cases. It stress-tests coverage gaps, UX failure modes, trust risks, and monetization traps for ChravelApp.

## What this study is not
This is **not real customer validation**. It does not prove demand, willingness to pay, retention, or investor traction. Synthetic persona quotes are fictional and are labeled `[SYNTHETIC QUOTE]`.

## How it was run
1. Read the existing 10-persona synthetic study and product ground-truth evidence.
2. Inspected route, onboarding, invite, billing, mobile/PWA, places, settings, and feature-tab source files.
3. Ran the local Vite app and confirmed the unauthenticated app HTML/PWA shell served at `http://127.0.0.1:8080/`.
4. Attempted Playwright desktop/mobile browser execution; it was blocked because Chromium is not installed in this container.
5. Labeled every finding as observed, simulated risk, or hypothesis.
6. Generated CSV and JSON artifacts for downstream analysis.

## Evidence labels
* `[OBSERVED]` — directly observed in app source, repo docs, local dev-server behavior, or prior ground-truth docs.
* `[SIMULATED RISK]` — plausible persona reaction based on observed app behavior/code/docs, not direct customer evidence.
* `[HYPOTHESIS]` — pricing, behavior, or product belief requiring real user validation.

## Deliverables
1. `README.md`
2. `30-persona-full-report.md`
3. `synthesis.md`
4. `persona-matrix.csv`
5. `feature-findings.csv`
6. `pricing-insights.csv`
7. `top-priority-fixes.md`
8. `real-beta-interview-questions.md`
9. `raw-synthetic-survey-responses.json`
10. `web-mobile-comparison.md`

## Key source evidence used
* [OBSERVED] Landing/marketing copy positions Chravel as replacing fragmented tools and includes use cases for celebrations, teams, communities, AI import, pricing, and FAQ (src/components/landing/sections/UseCasesSection.tsx; src/components/landing/sections/FAQSection.tsx; src/components/landing/sections/AiFeaturesSection.tsx).
* [OBSERVED] Onboarding is a 10-screen carousel covering chat, calendar, AI concierge, media, payments, places, polls, tasks, then CTA, with explicit Skip controls and Escape-to-skip support (src/components/onboarding/OnboardingCarousel.tsx:54-118,165-193,236-288).
* [OBSERVED] Invite join copy branches on require_approval and defaults to approval framing when invite data is missing; join preview shows trip name, destination, member count, type badge, expiration, and a centered card (src/pages/JoinTrip.tsx:100-127,857-925).
* [OBSERVED] Billing config defines Explorer/Frequent consumer tiers, Pro Starter/Growth/Enterprise, Trip Pass products, IAP requirements, and notes attendee caps are not fully enforced yet (src/billing/config.ts:55-91,100-179,195-210).
* [OBSERVED] The app has mobile-specific layout infrastructure, native bottom tab bar safe-area spacing, mobile trip tabs, and responsive settings panels (src/components/native/NativeTabBar.tsx; src/components/mobile/MobileTripTabs.tsx; src/components/settings/SettingsLayout.tsx).
* [OBSERVED] Places includes Basecamp/personal basecamp selectors, directions embed, saved trip links, and add-to-calendar behavior (src/components/places/BasecampsPanel.tsx; src/components/places/TripLinksDisplay.tsx).
* [OBSERVED] Trip surfaces include chat, itinerary/calendar, places, polls, tasks, payments, media, AI Concierge, settings, invites, and pro/event routes (src/components/TripTabs.tsx; src/pages/TripDetail.tsx; src/pages/ProTripDetail.tsx; src/pages/EventDetail.tsx).
* [OBSERVED] Local Vite dev server served http://127.0.0.1:8080/ and returned the app HTML with PWA/iOS meta tags; Playwright UI execution was blocked because Chromium was not installed in the container.
* [OBSERVED] Prior synthetic report identifies invite/account-wall friction, monetization-path gaps, hollow pro ops concerns, and disabled analytics as key risks (docs/research/synthetic-user-testing/REPORT.md; docs/research/synthetic-user-testing/evidence/product-ground-truth.md).
