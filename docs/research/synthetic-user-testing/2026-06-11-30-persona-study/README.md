# ChravelApp 30-Persona Synthetic User Testing Study

**Study package date:** 2026-06-11  
**Generated/run date:** 2026-06-28  
**Scope:** Research/documentation only; no product code changes.

## What this study is

This is a code-grounded synthetic user testing package using exactly 30 diverse personas across consumer trips, Pro/sports/touring/work logistics, and events/large communities. It stress-tests whether Chravel reduces group-travel fragmentation across chat, calendar, places, AI, polls, tasks, payments, media, Smart Import, Regular Trips, Pro Trips, and Events.

## What this study is not

This is **not real customer evidence**. It does not contain real customer quotes, real analytics, or real willingness-to-pay data. Persona reactions and quotes are synthetic and must be validated with beta users before being used in fundraising or product claims.

## How it was run

1. Inspected prior synthetic-user-testing docs under `docs/research/synthetic-user-testing/`.
2. Read the prior product-ground-truth and persona-report style benchmark.
3. Ran the local Vite app at `http://localhost:8080` using browser tools.
4. Tested unauthenticated landing, auth modal, demo dashboard, pricing, console, and mobile viewport.
5. Inspected source paths for routes, onboarding, create/invite, tabs, pricing, AI limits, Smart Import taste, mobile navigation, and Pro/Event gaps.
6. Generated 30 persona reports, CSVs, JSON survey responses, synthesis, priority fixes, interview questions, and web/mobile comparison.

## Evidence label definitions

- **[OBSERVED]** — directly observed in the app UI, browser session, source code, console, network behavior, existing product docs, or repo files.
- **[SIMULATED RISK]** — plausible persona reaction based on observed UI/code behavior, but not directly observed from a real person.
- **[HYPOTHESIS]** — product, pricing, or behavior hypothesis requiring real user validation.

## Important warning

Do not present synthetic feedback as customer feedback. Do not present synthetic scores as funnel data. Use this package to prioritize beta interviews, instrumentation, and implementation tickets.

## Deliverables

- `30-persona-full-report.md` — all 30 detailed persona reports.
- `synthesis.md` — aggregate synthesis and investor-grade readout.
- `persona-matrix.csv` — one row per persona.
- `feature-findings.csv` — one row per feature finding per persona.
- `pricing-insights.csv` — pricing model and CTA reactions.
- `top-priority-fixes.md` — P0/P1/P2/P3 product and engineering fixes.
- `real-beta-interview-questions.md` — top real-user validation questions.
- `raw-synthetic-survey-responses.json` — structured synthetic screener/survey responses.
- `web-mobile-comparison.md` — desktop web vs mobile/PWA comparison.
