# ChatGPT Co-Work — One-Shot External Cost-Containment Runbook

Paste the prompt below into ChatGPT Co-Work **after logging in** to every production provider in
separate tabs. Replace the three bracketed budget values first. Co-Work must never paste secrets into
chat, screenshots, notes, or source control.

## Values to fill before starting

- `[FOUNDER_MAX_MONTHLY_VARIABLE_SPEND_USD]`: the maximum survivable monthly variable spend.
- `[ALERT_EMAIL]`: founder/operator email that must receive every alert.
- `[SECOND_ALERT_CHANNEL]`: a second human-monitored destination.

Recommended thresholds are 25/50/75/90/100% notifications, graceful degradation at 70%, and an
app/vendor hard stop at 90% where the provider supports a true cap. Preserve 10% for recovery traffic.

## Copy-paste prompt

```text
You are operating production billing and security consoles for Chravel, a bootstrapped group-travel
coordination app. I am already logged into the relevant production accounts in open browser tabs.
Your objective is to reduce catastrophic variable-spend risk without disabling auth, existing trip
data, chat, calendar, tasks, polls, payments, exports, account deletion, webhook validation, or
entitlement repair.

INPUTS
- Maximum survivable monthly variable spend: [FOUNDER_MAX_MONTHLY_VARIABLE_SPEND_USD] USD
- Primary alert recipient: [ALERT_EMAIL]
- Second alert destination: [SECOND_ALERT_CHANNEL]
- Warning thresholds: 25%, 50%, 75%, 90%, 100%
- App degradation threshold: 70%
- Hard-stop target: 90% of survivable budget, never 100%

SAFETY RULES — NON-NEGOTIABLE
1. Never reveal, copy into chat, download into a shared folder, or screenshot any API key, JWT,
   service-role key, private key, password, recovery code, billing identifier, or full environment
   variable value. Secret evidence must show only the secret NAME and, where the console provides it,
   last-updated date.
2. Never delete a project, database, bucket, table, production deployment, user, domain, billing
   account, or active key. Never rotate/delete a key or delete an edge function without pausing and
   asking me for explicit confirmation with its name, observed 7-day usage, and rollback plan.
3. Do not increase any quota or upgrade any plan. Do not disable billing for the entire application.
4. Distinguish alerts from preventive caps. Never describe a Google Cloud budget alert as a hard cap.
5. If navigation labels differ, use the console's search/help and official documentation. Do not
   guess. Record the actual current label and URL (without secret query parameters).
6. Before every Save/Apply action, state: provider, setting, old value, proposed value, user impact,
   and rollback. For reversible alerts/restrictions/caps matching this prompt, proceed. For deletion,
   key rotation, plan changes, public/private storage changes, or a control that could break prod,
   stop for my confirmation.
7. Work one provider at a time. After each provider, verify, capture a redacted screenshot, and append
   a row to an evidence table: provider | control | old | new | verified time UTC | evidence file.
8. If a true hard cap is unavailable, say so plainly and configure the strongest available quota,
   prepaid limit, sampling cap, or alert. Never claim completion without reading the saved state back.

PHASE 0 — INVENTORY (READ-ONLY)
1. Identify open tabs for Google Cloud, Supabase, Lovable, OpenAI, Google AI/Gemini or Vertex AI,
   LiveKit, Vercel, Stream, Resend, PostHog, and Sentry. If a provider is absent or not used by the
   production project, mark it UNVERIFIED; do not invent an account.
2. In each console identify the production organization/project/workspace by visible name. Ask me to
   confirm the selected production scope once, before making changes.
3. Create a local redacted evidence folder named `chravel-cost-controls-YYYY-MM-DD`. Store screenshots
   and a Markdown checklist there; no secrets or exported raw credentials.

PHASE 1 — GOOGLE CLOUD / MAPS / VERTEX
1. Select the confirmed Chravel production project and its billing account.
2. Open Billing > Budgets & alerts. Create or update a monthly budget equal to the input maximum.
   Add actual-spend notifications at 25/50/75/90/100%, forecasted-spend notification where
   supported, [ALERT_EMAIL], and [SECOND_ALERT_CHANNEL]. Verify the saved thresholds.
3. Add a note to evidence: "Google budget notifications are alerts, not a usage hard stop."
4. Open APIs & Services > Enabled APIs & services. Record enabled Maps JavaScript, Places,
   Geocoding, Routes, Vertex AI, Speech, or other billable APIs. Flag enabled APIs with no known
   Chravel production caller; do not disable them without confirmation.
5. For each used Maps/Places/Geocoding API, open Quotas & System Limits. Record current daily and
   per-minute quotas. Propose conservative quotas derived from: 75 server Maps calls/user/day hard
   maximum and the founder budget. If the console cannot translate this safely to project quota,
   configure alerts only and mark CALCULATION REQUIRED rather than guessing.
6. Open Credentials. Confirm separate browser and server keys. For the browser key, propose exact
   production and approved-preview HTTP referrers and only required browser APIs. For the server key,
   confirm it is absent from browser restrictions/source and restricted to required web-service APIs
   plus the strongest supported server application restriction. Any restriction change requires my
   confirmation because a mistake can break production Maps.
7. Open Billing export. If a BigQuery billing export is already configured, verify detailed usage is
   enabled. If creating a dataset/export would add cost or require data-location choices, show the
   proposed configuration and ask first.
8. Save redacted screenshots of budget thresholds, API quota summaries, and key restriction TYPE/API
   list (never key values).

PHASE 2 — SUPABASE
1. Select the confirmed production organization/project. Open organization Billing/Usage/Spend Cap.
   Enable the available spend cap and alerts only after reading the console's exclusions/overage
   behavior. Record what the cap does NOT stop: egress, cached egress, storage, DB size, MAU,
   realtime, edge invocations, or other categories as displayed.
2. Configure 50/75/90% alerts for storage, egress, database size/compute, MAU, realtime, and Edge
   Functions wherever supported. Add both alert destinations.
3. Open Storage. Inventory every bucket: public/private, object-size limit, allowed MIME types, and
   policy presence. Do not change public/private state. Flag missing limits and propose changes for
   separate review.
4. Open Edge Functions and export/copy only the deployed FUNCTION NAMES and versions. Compare with the
   repository-backed list if available. For every suspected orphan, inspect 7-day invocations/logs,
   key dependencies, and last deployment. Produce a deletion wave proposal; do not delete yet.
5. Prioritize suspected legacy AI/voice proxies. For each, show name, auth setting, 7-day calls,
   secrets referenced (names only), and rollback/archive plan; ask me to approve deletion individually
   or as an explicit named batch.
6. Open Database/Cron Jobs. Verify rate-limit cleanup and retention jobs have recent successful runs.
   Capture failures but do not manually run destructive retention SQL.
7. Open Edge Functions/Secrets. Verify by NAME only that the required AI/Maps keys exist. Set
   `CONCIERGE_FREQUENT_MONTHLY_TOKEN_BUDGET` to a conservative positive value only after asking me to
   approve the exact token number. Never display existing values.
8. Verify feature flags `concierge_realtime_voice=false` and `cost_voice_realtime=false`. Do not enable
   realtime voice. After the repository deployment, verify `cost_voice_tts=true` and
   `cost_voice_stt=true`.
9. Confirm MFA is enabled for each production admin visible to me. Never expose recovery codes.

PHASE 3 — LOVABLE, OPENAI, GEMINI/VERTEX, LIVEKIT
For each provider actually billed by a production secret:
1. Select its production project/workspace and open Usage/Billing/Limits.
2. Record 30-day usage by project/model/key label without exporting secrets.
3. Set the lowest practical hard monthly project limit or prepaid ceiling at or below its allocated
   share of the 90% hard-stop budget. If only soft alerts exist, configure 50/75/90% notifications and
   mark NO TRUE HARD CAP.
4. Disable no model/project/key without confirmation. Identify unused keys and keys that may be
   reachable from orphan functions, then prepare a rotate-after-orphan-removal plan.
5. For LiveKit, record included minutes, concurrency, egress/recording exposure, overage behavior, and
   alert controls. Keep production realtime voice disabled in Chravel.
6. Verify with one provider usage screen that text/TTS/STT routes bill the intended account; do not
   generate test traffic until the repository voice controls are deployed.

PHASE 4 — VERCEL
1. Select the production Chravel team/project. Open Settings > Billing/Spend Management (or current
   equivalent).
2. Configure warnings at 50/75/90% and the strongest available maximum threshold below 90% of the
   allocated hosting budget. Prefer degrading optional functions/image optimization before core site
   availability when the plan supports this.
3. Record bandwidth, function duration/invocations, image optimization, build minutes, and recent
   spend velocity. Never disconnect the production domain or disable all deployments.
4. Verify recipients and capture redacted saved-state evidence.

PHASE 5 — STREAM
1. Select the production Stream app. Open Billing/Usage and record contracted MAU, messages,
   attachment storage/transfer, current usage, next tier boundary, and overage behavior.
2. Configure available usage/rate alerts before the tier boundary. Do not change chat permissions,
   retention, moderation, or production keys.
3. Flag any attachment or MAU dimension with no alert/cap as residual risk.

PHASE 6 — RESEND
1. Select the production workspace/domain and open Usage/Billing/Limits.
2. Configure the lowest practical daily sending limit and 50/75/90% alerts if supported. Preserve
   required auth/transactional delivery; keep nonessential notification email default-off.
3. Verify domain/DNS only read-only. Never rotate the API key during this run.

PHASE 7 — POSTHOG
1. Select the production project and open Billing & limits.
2. Set conservative event and session-replay limits. Reduce replay sampling rather than product
   availability; record current/new sample percentages.
3. Verify autocapture or an error loop cannot send unlimited replay/events. Do not expose recorded
   user content in evidence.

PHASE 8 — SENTRY
1. Select the production organization/project and open Subscription/Spend allocation.
2. Cap errors, transactions/spans, replays, profiles, and attachments where supported. Configure spike
   alerts and 50/75/90% usage notifications to both destinations.
3. Record current sampling and propose lower launch-week sampling if needed. Do not delete issues or
   releases.

PHASE 9 — CROSS-PROVIDER VERIFICATION AND HANDOFF
1. Read every saved control back from its console. A green check requires saved-state evidence, not a
   clicked Save button.
2. Produce a table with: provider, project/workspace, control, threshold, true hard cap YES/NO,
   exclusions, recipients verified, UTC timestamp, evidence filename, residual risk.
3. Produce a separate EXPLICIT APPROVAL queue for orphan deletions, key rotations, API disables,
   bucket policy/limit changes, and any control that risks production availability.
4. Calculate total allocated hard stops. They must not exceed 90% of
   [FOUNDER_MAX_MONTHLY_VARIABLE_SPEND_USD]. If they do, stop and show the mismatch.
5. Run a read-only launch drill checklist: voice flags off, alerts active, spend caps read back, no
   secrets exposed. Do not intentionally incur paid traffic or set thresholds to zero in production.
6. End with exactly: COMPLETED CONTROLS; UNVERIFIED/BLOCKED; APPROVALS NEEDED; TRUE HARD-CAP GAPS;
   EVIDENCE FILES; NEXT 24-HOUR CHECK; RETURN-TO-CODEX PROMPT.
7. Use this return prompt:
   "Review the external cost-control evidence and approval queue. Verify the voice migration and edge
   deployments, then implement the next single repo-owned P0 phase from
   docs/LAUNCH_COST_CONTAINMENT_AUDIT_2026-08-07.md without changing demo data."
```

## Repository deployment that Co-Work must not assume

The browser run does not deploy source. Before testing voice, a code operator must apply
`20260807120000_cost_usage_ledger_and_voice_controls.sql` and deploy `concierge-voice-tts`,
`concierge-stt`, `realtime-voice-session`, and `mint-realtime-token`. Never run `supabase db push` in
this repository; use the project's approved Lovable/Supabase migration workflow.
