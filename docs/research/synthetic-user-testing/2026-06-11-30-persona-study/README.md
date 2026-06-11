# ChravelApp 30-Persona Synthetic User Testing Study — 2026-06-11

## What this is

A structured synthetic research study: 30 distinct personas (10 consumer, 10 pro/work, 10
events/communities) each "complete" the beta screener and full interview survey, walk the live web
and mobile/PWA UI, attempt realistic task workflows, and react to pricing. Per-persona reports plus
an aggregate synthesis turn the results into product, growth, and engineering input.

It builds on the 2026-06-09 10-persona study one directory up
(`../REPORT.md`, `../evidence/product-ground-truth.md`) and re-verifies its findings against current
code — most of its headline monetization/UX defects were fixed in commit `3cd1c2a` (2026-06-10);
see `evidence-delta.md`.

## ⚠️ This is synthetic, not customer validation

Synthetic personas are useful for **coverage, assumption stress-testing, and finding plausible UX
failure modes**. They are **not real customer evidence**. Nothing in this study proves that
customers want or will pay for anything. All quotes are fabricated persona voice, clearly labeled
[SYNTHETIC QUOTE]. All scores (activation, NPS, willingness-to-pay) are synthetic estimates. The
study's job is to sharpen what we **ask real users** — see `real-beta-interview-questions.md` —
and to surface code-grounded defects worth fixing regardless of validation.

## Evidence labels (used on every finding)

- **[OBSERVED]** — directly observed in the running app UI (screenshots in `screenshots/`),
  console/network logs, the codebase (file:line), repo docs, or prior audits.
- **[SIMULATED RISK]** — plausible persona reaction grounded in observed UI/code behavior, but not
  directly observed from a real person.
- **[HYPOTHESIS]** — product/pricing/behavior hypothesis that requires real-user validation.

## How it was run

1. **Ground-truth refresh** — the prior study's findings re-verified against current `main`
   (`evidence-delta.md` Part 1).
2. **Live UI harvest** — Playwright-driven Chromium against a local dev server at desktop
   (1440×900) and mobile (390×844, touch) viewports: marketing landing, SEO page, auth screens,
   and the full demo-mode app (consumer trip, two pro trips, one event; every tab). 82 screenshots
   + console/network logs (`harvest.mjs`, `harvest2.mjs`, `screenshots/`).
3. **Environment limitation (disclosed):** the sandbox blocks all external network including
   `*.supabase.co`, so **authenticated flows (real signup, trip CRUD, invite joins, AI concierge
   responses, payments) could not be live-tested**. An isolated Supabase branch was created for
   that purpose and deleted after the platform's migration replay failed (itself a finding — R6 in
   `evidence-delta.md`). Authenticated-flow findings are code-grounded and labeled accordingly.
   Re-running step 2 from an environment that allowlists `supabase.co` (against an isolated branch,
   never production) would upgrade those findings to [OBSERVED].
4. **Persona simulation** — 30 persona agents, each grounded in the ground truth + delta + live
   evidence, produced the screener, survey, walkthroughs, findings table, scores, and fixes.
   Conflicting persona opinions are reported as conflicts, not averaged.
5. **Synthesis + validation** — aggregate analysis; CSV/JSON deliverables machine-validated;
   persona counts and section completeness checked.

No real emails or phone numbers appear anywhere; contacts are `*@example.com` placeholders.
No product code was changed by this study.

## Deliverables

| File | Contents |
|---|---|
| `README.md` | This file |
| `evidence-delta.md` | Ground-truth delta since 2026-06-09 + live-harvest evidence log |
| `30-persona-full-report.md` | All 30 detailed persona reports (sections A–K each) |
| `synthesis.md` | Executive synthesis: signals/risks/wins, segment matrix, feature heatmap, web-vs-mobile, onboarding, pricing, priority matrix, quotes, beta questions, investor readout |
| `persona-matrix.csv` | One row per persona |
| `feature-findings.csv` | One row per feature finding per persona |
| `pricing-insights.csv` | Persona × pricing model × WTP × CTA reactions |
| `top-priority-fixes.md` | P0/P1/P2/P3 engineering & product fixes |
| `real-beta-interview-questions.md` | Top questions to ask actual users next |
| `raw-synthetic-survey-responses.json` | Structured screener + survey responses, all 30 personas |
| `web-mobile-comparison.md` | Desktop web vs mobile/PWA comparison |
| `screenshots/` + `harvest.mjs`, `harvest2.mjs` | Live UI evidence + reproducible harness |
