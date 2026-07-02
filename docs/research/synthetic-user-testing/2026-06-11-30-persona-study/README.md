# ChravelApp 30-Persona Synthetic User Testing Study

**Date:** 2026-06-11  
**Package:** `docs/research/synthetic-user-testing/2026-06-11-30-persona-study/`  
**Prior work:** Builds on the 10-persona study (`../REPORT.md`, `../personas/`, `../evidence/product-ground-truth.md`) — does **not** overwrite it.

---

## What this study is

A structured **synthetic** research package simulating 30 diverse personas completing beta screener + interview surveys and walking realistic ChravelApp workflows (desktop web + mobile/PWA viewports). Findings are grounded in:

- Live browser sessions at `http://localhost:8080` (2026-06-11)
- Source code and audit corpus (`product-ground-truth.md`, `DEBUG_PATTERNS.md`, prior persona reports)
- PostHog state (zero events ingested — all funnel rates are hypothesis)

## Critical warning

**Synthetic testing is not customer validation.**

This package stress-tests coverage, UX failure modes, and monetization traps. It must **not** be cited as proof that customers want or will pay for Chravel. Every finding uses one of:

| Label | Meaning |
|-------|---------|
| `[OBSERVED]` | Verified in UI, browser session, codebase, console/network, or existing product docs |
| `[SIMULATED RISK]` | Plausible persona reaction inferred from observed UI/code — not verified with a real person |
| `[HYPOTHESIS]` | Product/pricing/behavior claim requiring real user validation |

Synthetic persona quotes are labeled `[SYNTHETIC QUOTE]`. No real customer quotes are invented.

## How it was run

1. Read prior 10-persona reports and `evidence/product-ground-truth.md`
2. Inspected repo: billing, invites, onboarding, Pro stubs, permission matrix
3. Started Vite dev server; desktop browser walkthrough (1280×800)
4. Attempted mobile viewport testing (390×844) — limited in cloud environment; mobile findings combine responsive code review + prior study + partial live test
5. Wrote 30 persona reports with evidence labels and conversion scores
6. Generated aggregate synthesis, CSV exports, and structured JSON survey responses

## Deliverables

| File | Description |
|------|-------------|
| `30-persona-full-report.md` | All 30 detailed persona reports (sections A–K each) |
| `synthesis.md` | Executive synthesis: heatmaps, priority matrix, investor readout |
| `persona-matrix.csv` | One row per persona — segment, scores, SKU, churn risk |
| `feature-findings.csv` | Feature-level findings across all personas |
| `pricing-insights.csv` | WTP, preferred model, CTA triggers per persona |
| `top-priority-fixes.md` | P0–P3 engineering/product fixes with code refs |
| `real-beta-interview-questions.md` | 20+ questions for real user validation |
| `raw-synthetic-survey-responses.json` | Structured screener + interview responses |
| `web-mobile-comparison.md` | Desktop vs mobile/PWA synthesis |

## Recommended next step

Run a **second pass** that converts P0/P1 items in `top-priority-fixes.md` into implementation tickets. Synthetic research only matters if it ships fixes.

## Evidence sources (canonical)

- `../evidence/product-ground-truth.md` — feature inventory, tiers, known issues
- `../evidence/posthog-funnel.md` — telemetry disabled state
- `../REPORT.md` — 10-persona synthesis (methodology benchmark)
- `src/billing/config.ts`, `src/pages/JoinTrip.tsx`, `src/utils/tripConverter.ts`, `src/components/onboarding/OnboardingCarousel.tsx`
