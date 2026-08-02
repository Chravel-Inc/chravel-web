# ChravelApp 30-Persona Synthetic User Testing Study

**Original date:** 2026-06-11  
**Evidence refresh:** 2026-08-02 (weekly cron; rebased claims onto latest `main` after PR #867)  
**Prior refresh:** 2026-07-26  
**Package:** `docs/research/synthetic-user-testing/2026-06-11-30-persona-study/`  
**Prior work:** Builds on the 10-persona study (`../REPORT.md`, `../personas/`, `../evidence/product-ground-truth.md`) — does **not** overwrite it.

**Start here after August refresh:** [`REBASE-REFRESH-2026-08-02.md`](./REBASE-REFRESH-2026-08-02.md)  
**July archive:** [`REBASE-REFRESH-2026-07-26.md`](./REBASE-REFRESH-2026-07-26.md)

---

## What this study is

A structured **synthetic** research package simulating 30 diverse personas completing beta screener + interview surveys and walking realistic ChravelApp workflows (desktop web + mobile/PWA viewports).

**August 2 refresh:** Re-verified open P0/P1 claims against current source + live browser (landing, pricing, `/teams`, demo cards). Scores in `persona-matrix.csv`, priorities in `top-priority-fixes.md`, and synthesis averages were updated. Persona narrative voices in `30-persona-full-report.md` remain the June synthetic interviews with a re-verification addendum at the top — do not treat June-only `[OBSERVED]` citations as current without checking the delta docs.

Findings are grounded in:

- Live browser sessions (2026-06-11 original + 2026-08-02 refresh) + codebase inspection
- `../evidence/product-ground-truth.md` (includes 2026-08-02 delta header)
- July product audits + PR #867 landings (add-by-contact, day-sheet MVP, Seen-by roster, Remind)
- PostHog project typed events in code (prod funnel still not proven)

## Critical warning

**Synthetic testing is not customer validation.**

This package stress-tests coverage, UX failure modes, and monetization traps. It must **not** be cited as proof that customers want or will pay for Chravel. Every finding uses one of:

| Label | Meaning |
|-------|---------|
| `[OBSERVED]` | Verified in UI, browser session, codebase, console/network, or existing product docs |
| `[SIMULATED RISK]` | Plausible persona reaction inferred from observed UI/code — not verified with a real person |
| `[HYPOTHESIS]` | Product/pricing/behavior claim requiring real user validation |

Synthetic persona quotes are labeled `[SYNTHETIC QUOTE]`. No real customer quotes are invented. No real emails/phones — placeholders only.

Standalone CSV/JSON exports include `data_source` / disclaimer fields so rows cannot be mistaken for real respondent data when detached from this README.

## How the August refresh was run

1. Checked out study branch on current `main`
2. Re-verified each July-open P0/P1 claim against current source
3. Live UI sample: Vite `localhost:8080` desktop 1280×800 + mobile 390×844 (landing, pricing Trip Passes, `/teams`)
4. Updated ground-truth delta, synthesis, priority fixes, CSVs, web-mobile comparison
5. Documented closed vs open items in `REBASE-REFRESH-2026-08-02.md`

## Deliverables

| File | Description |
|------|-------------|
| `REBASE-REFRESH-2026-08-02.md` | **What changed since July** — closed bugs, open P0s, score deltas |
| `REBASE-REFRESH-2026-07-26.md` | July archive |
| `30-persona-full-report.md` | All 30 detailed persona reports (sections A–K) + re-verification addenda |
| `synthesis.md` | Executive synthesis (refreshed averages) |
| `persona-matrix.csv` | One row per persona — scores refreshed 2026-08-02 |
| `feature-findings.csv` | Feature-level findings across personas |
| `pricing-insights.csv` | WTP / CTA |
| `top-priority-fixes.md` | P0–P3 with ✅ closed items |
| `real-beta-interview-questions.md` | Real-user validation questions |
| `raw-synthetic-survey-responses.json` | Structured survey responses |
| `web-mobile-comparison.md` | Desktop vs mobile/PWA |

## Headline after August refresh (not validation)

| Metric | June | July 26 | August 2 |
|--------|------|---------|----------|
| Paid conversion (avg) | 2.7 | 3.5 | **3.7** |
| Invite (avg) | 5.1 | 4.9 | **5.3** |
| NPS (avg) | ~−10 | −5.8 | **−1.6** |

**Fixed since July:** add-by-contact (existing users), Pro day-sheet MVP, Seen-by roster, Payments Remind, Settings→PlusUpsell on paywall gates, ForTeams trial→Stripe helper, Smart Import taste = 5 account-wide.  
**Still blocking:** Guest itinerary, cold-invite viral loop, remaining Trip Pass hops, PostHog product funnel proof, ForTeams footer mailto + Calendly env, Pro settlement/medical CRUD.

## Recommended next step

Convert open P0 items in `top-priority-fixes.md` into implementation tickets. Synthetic research only matters if it ships fixes.
