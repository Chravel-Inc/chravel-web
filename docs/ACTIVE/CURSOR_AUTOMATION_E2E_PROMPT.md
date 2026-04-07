# Cursor Automation Prompt — Scheduled Staging E2E + Artifacts + Slack

Use this prompt in Cursor Automations to run deterministic validation using the in-repo GitHub Actions workflow (`.github/workflows/scheduled-e2e-staging.yml`).

## Recommended automation trigger

- **Primary:** Daily cron (morning health check).
- **Secondary:** Manual run from Slack for incident triage.

## Prompt to use in Cursor Automation

```text
You are operating in the Chravel repository.

Goal:
Run scheduled staging verification and report results to Slack with links to artifacts.

Hard constraints:
1) Do not modify app code.
2) Trigger only `.github/workflows/scheduled-e2e-staging.yml`.
3) Use staging URL and fixture auth secrets configured in GitHub Actions Secrets.
4) On completion, summarize pass/fail, failing specs, and artifact locations.
5) If failures occur, include first actionable suspect category: auth, onboarding, chat/realtime, or environment/secrets.

Execution steps:
1) Dispatch the workflow:
   - workflow: `scheduled-e2e-staging.yml`
   - ref: `main`
   - inputs:
     - `notify_slack: true`
     - `target_url: <leave empty unless override is requested>`
     - `grep: <leave empty for full chromium run>`
2) Wait for workflow completion.
3) Parse job summary + Playwright JSON/JUnit artifacts.
4) Post a threaded Slack reply with:
   - status icon (✅/❌)
   - target URL
   - run URL
   - failing test file(s) and test name(s)
   - whether trace/video exists for failures
   - immediate next action recommendation

Output format:
- One concise executive summary paragraph.
- Then bullets under:
  - Result
  - Failures (if any)
  - Artifacts
  - Next action

Failure handling:
- If dispatch fails due to permissions, report exact missing permission.
- If secrets are missing, report the missing secret names and stop.
- Never fabricate pass/fail signals.
```

## GitHub Secrets required by the workflow

- `E2E_STAGING_BASE_URL`
- `E2E_VITE_SUPABASE_URL`
- `E2E_VITE_SUPABASE_ANON_KEY`
- `E2E_VITE_GOOGLE_MAPS_API_KEY`
- `E2E_TEST_EMAIL`
- `E2E_TEST_PASSWORD`
- `CI_SLACK_WEBHOOK_URL`


## How to trigger the workflow

### Option A: GitHub UI (fastest)

1. Go to **GitHub → Actions → Scheduled E2E Staging**.
2. Click **Run workflow**.
3. Choose branch `main`.
4. Optional inputs:
   - `target_url`: override staging URL for this run only
   - `grep`: run a subset of tests
   - `notify_slack`: `true` to send Slack summary
5. Click **Run workflow** and open the run details page to monitor status/artifacts.

### Option B: GitHub CLI

```bash
gh workflow run scheduled-e2e-staging.yml --ref main
```

With optional overrides:

```bash
gh workflow run scheduled-e2e-staging.yml --ref main \
  -f target_url=https://staging.chravel.app \
  -f grep=@smoke \
  -f notify_slack=true
```

List recent runs:

```bash
gh run list --workflow scheduled-e2e-staging.yml --limit 5
```

## V1 flow coverage recommendation

For high-signal daily checks, start with stable core journeys first:

1. Auth login (fixture account)
2. Dashboard load and trip open
3. Chat send + render confirmation
4. Concierge open/send/render loop

Use `--grep` in manual dispatch for focused triage runs; keep daily runs broad enough to detect integration drift.
