# Scheduled E2E workflow and Cursor automation

This document describes how Chravel runs **nightly end-to-end tests** in CI, how to **optionally notify Slack**, and how to use a **detailed agent prompt** (Cursor / Codex) to extend coverage or triage failures—without treating the LLM as a substitute for Playwright.

## What already exists in this repo

| Piece | Location / behavior |
|--------|----------------------|
| Playwright config | `playwright.config.ts` — `baseURL` from `PLAYWRIGHT_TEST_BASE_URL`, CI uses built `dist` + preview via `PLAYWRIGHT_SKIP_BUILD=1` |
| Smoke E2E on PRs | `.github/workflows/ci.yml` → job `e2e-smoke` → `npm run test:e2e:smoke` |
| Full E2E on `main` + nightly + manual | Same workflow → job `e2e-full` → `npm run test:e2e` |
| Nightly schedule | `ci.yml` `on.schedule` cron `20 7 * * *` (UTC) — adjust in YAML if you want a different wall-clock time |
| Artifacts | Playwright report + junit/json under `test-results/` uploaded as `playwright-full-report` (30-day retention on full suite) |
| Suite map | `e2e/README.md` |

**Important:** Nightly E2E runs against a **local preview** of the built app in the runner (`localhost:8080`), not automatically against production Vercel. Testing a **deployed** URL is a separate workflow (see below).

## Optional: Slack notification after nightly E2E

1. Create an **Incoming Webhook** for your workspace (Slack app or legacy incoming webhook).
2. In the GitHub repo: **Settings → Secrets and variables → Actions → New repository secret**
   - Name: `SLACK_E2E_WEBHOOK_URL`
   - Value: the webhook URL
3. On the next scheduled or `workflow_dispatch` run of **E2E Full**, the workflow posts a short pass/fail message with a link to the GitHub Actions run.

If the secret is **not** set, the notify step is skipped (no failure).

## Running E2E against a deployed URL (staging / preview)

Set `PLAYWRIGHT_TEST_BASE_URL` to the full origin (e.g. `https://your-preview.vercel.app`) and **disable** the auto web server unless you still want a local server:

- Today `playwright.config.ts` always defines `webServer`. For URL-only runs you typically add a separate npm script or env flag (e.g. `PLAYWRIGHT_NO_WEB_SERVER=1`) and gate `webServer` in config—**do that in a follow-up** if you need scheduled tests against Vercel every night.
- Ensure `VITE_*` / Supabase keys used at **build time** for that deploy match the backend you intend to test (RLS, auth redirects, OAuth callbacks).

## Cursor / Codex: detailed automation prompt (copy-paste)

Use this as the **body** of a Cursor Automation or as a Codex task template. Replace the bracketed placeholders once.

```markdown
You are working in the Chravel monorepo (React + TypeScript, Vite, Supabase, Playwright E2E).

## Goal
[Pick one:]
- A) Triage the latest failing nightly E2E: summarize root cause, point to files, suggest minimal fix.
- B) Add a new Playwright spec for [journey: e.g. sign-in → open trip → send chat message] with stable selectors.
- C) Propose a second workflow that runs E2E against [STAGING_URL] on a schedule.

## Constraints
- Do not weaken RLS, auth, or security.
- Prefer `data-testid` or role-based selectors; avoid brittle CSS.
- Reuse patterns from `e2e/fixtures/` and existing specs under `e2e/` and `e2e/specs/`.
- After code changes, run: `npm run lint && npm run typecheck && npm run build` before commit.
- For E2E locally: `npm run test:e2e:smoke` (fast) or `npm run test:e2e` (full).

## Context to paste when reporting a failure
- Link to the GitHub Actions run for workflow "CI", job "E2E Full (main/nightly)".
- First failing test name and file path from the log.
- Whether failure is flaky (passes on retry) or deterministic.

## Deliverables
1. Short diagnosis (symptom → layer: UI vs React Query vs Supabase vs RLS vs env).
2. Concrete code or YAML changes with file paths.
3. How a human verifies the fix (commands + optional manual steps).

## Repo facts (do not contradict)
- E2E config: `playwright.config.ts`; tests live under `e2e/`.
- CI: `.github/workflows/ci.yml` — `e2e-full` runs full suite on main, schedule, and workflow_dispatch.
- Optional Slack: repository secret `SLACK_E2E_WEBHOOK_URL`.
```

## How this differs from “Devin-style” daily video

- **Determinism:** Playwright specs + CI are the source of truth; the agent summarizes and extends them.
- **Video / trace:** Playwright can record **video** and **traces** (see `playwright.config.ts` `trace` / `video`). Artifacts are in the uploaded `test-results/` artifact; share the **Actions run URL** in Slack.
- **Cursor Automations:** Use triggers (cron, PR, Slack) to run a **repeatable** instruction set that checks out the repo, runs tests or edits specs, and posts results—still backed by the same YAML and npm scripts.

## Maintenance

- Keep `e2e/README.md` aligned with real spec files (see governance rules there).
- If nightly noise is too high, narrow `e2e-full` with a dedicated npm script (e.g. `test:e2e:nightly`) that targets tier-0 paths only—prefer that over disabling CI.
