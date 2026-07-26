# ChravelApp 30-Persona Synthetic User Testing Study

**Original date:** 2026-06-11  
**Evidence refresh:** 2026-07-26 (rebased onto latest `main`)  
**Package:** `docs/research/synthetic-user-testing/2026-06-11-30-persona-study/`  
**Prior work:** Builds on the 10-persona study (`../REPORT.md`, `../personas/`, `../evidence/product-ground-truth.md`) — does **not** overwrite it.

**Start here after July refresh:** [`REBASE-REFRESH-2026-07-26.md`](./REBASE-REFRESH-2026-07-26.md)

---

## What this study is

A structured **synthetic** research package simulating 30 diverse personas completing beta screener + interview surveys and walking realistic ChravelApp workflows (desktop web + mobile/PWA viewports).

**July 26 refresh:** Re-verified P0/P1 claims against current code + July product audits. Scores in `persona-matrix.csv`, priorities in `top-priority-fixes.md`, and synthesis averages were updated. Persona narrative voices in `30-persona-full-report.md` remain the June synthetic interviews with a re-verification addendum at the top — do not treat June-only `[OBSERVED]` citations as current without checking the delta doc.

Findings are grounded in:

- Live browser sessions + codebase inspection (`LIVE-UI-SESSION-2026-07-26.md`)
- `../evidence/product-ground-truth.md` (includes 2026-07-26 delta header)
- `docs/audits/CHRAVEL_PRODUCT_AUDIT_2026-07-25.md`
- `docs/audits/POST_DRIFT_FEATURE_AUDIT_2026-07-25.md`
- PostHog project `464040` (autocapture only — product funnel still hypothesis)

Standalone CSV/JSON rows include `data_source` / `study_id` / `refresh_date` metadata so detached exports cannot be mistaken for real respondent data.

## Critical warning

**Synthetic testing is not customer validation.**

This package stress-tests coverage, UX failure modes, and monetization traps. It must **not** be cited as proof that customers want or will pay for Chravel. Every finding uses one of:

| Label | Meaning |
|-------|---------|
| `[OBSERVED]` | Verified in UI, browser session, codebase, console/network, or existing product docs |
| `[SIMULATED RISK]` | Plausible persona reaction inferred from observed UI/code — not verified with a real person |
| `[HYPOTHESIS]` | Product/pricing/behavior claim requiring real user validation |

Synthetic persona quotes are labeled `[SYNTHETIC QUOTE]`. No real customer quotes are invented.

## How the July refresh was run

1. Rebased study branch onto latest `main`
2. Re-verified each June P0/P1 claim against current source + July audits
3. Updated ground-truth delta, synthesis, priority fixes, CSVs, web-mobile comparison
4. Documented closed vs open items in `REBASE-REFRESH-2026-07-26.md`

## Deliverables

| File | Description |
|------|-------------|
| `REBASE-REFRESH-2026-07-26.md` | **What changed since June** — closed bugs, open P0s, score deltas |
| `LIVE-UI-SESSION-2026-07-26.md` | Browser-observed landing / pricing / `/teams` / mobile viewport evidence |
| `30-persona-full-report.md` | All 30 detailed persona reports (sections A–K) + re-verification addendum |
| `synthesis.md` | Executive synthesis (refreshed averages) |
| `persona-matrix.csv` | One row per persona — scores refreshed 2026-07-26 |
| `feature-findings.csv` | Feature-level findings across personas |
| `pricing-insights.csv` | WTP / CTA (CTAs refreshed for Trip Pass + IAP) |
| `top-priority-fixes.md` | P0–P3 with ✅ closed June items |
| `real-beta-interview-questions.md` | Real-user validation questions |
| `raw-synthetic-survey-responses.json` | Structured survey responses |
| `web-mobile-comparison.md` | Desktop vs mobile/PWA (IAP status updated) |

## Headline after refresh (not validation)

| Metric | June | July 26 |
|--------|------|---------|
| Paid conversion (avg) | 2.7 | **3.5** |
| Invite (avg) | 5.1 | **4.9** |
| NPS (avg) | ~−10 | **−5.8** |

**Fixed:** IAP, Trip Pass at concierge, Pro placeholder tabs, settlement race, split enforcement, broadcast schema, Smart Import taste.  
**Still blocking:** Guest itinerary, invite-only growth, remaining settings-routed walls, marketing Pro mailto, product PostHog events, Pro ops CRUD.

## Recommended next step

Convert open P0 items in `top-priority-fixes.md` into implementation tickets. Synthetic research only matters if it ships fixes.
