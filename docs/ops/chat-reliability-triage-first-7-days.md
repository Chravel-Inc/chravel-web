# Chat Reliability Triage Runbook (First 24–72 Hours + Day 4–7)

This runbook defines the **post-rollout monitoring and containment protocol** for Stream-backed chat surfaces after enabling a new release.

## Scope

Monitor these signals first for **hourly checks in the first 24–72 hours**, then continue **daily through day 7**:

1. Stream send failures (`message.send.failed`)
2. Stream ReadChannel permission/membership failures (`membership.recovery.attempt` with failure outcomes)
3. Stream webhook failures (`stream-webhook` 401/500 responses)
4. Webhook dedupe collisions (`webhook.dedupe.collision`)
5. Reconnect backfill reliability (`chat.reconnect.backfill`)
6. Chat time-to-first-message (`chat.time_to_first_message`)

## Event and log sources

- **PostHog client telemetry**
  - `message.send.failed`
  - `membership.recovery.attempt`
  - `chat.reconnect.backfill`
  - `chat.time_to_first_message`
- **Supabase Edge Function logs**
  - `stream-webhook` 401/500 responses
  - `webhook.dedupe.collision`
- **Supabase DB (`webhook_events`)**
  - `event_type = 'stream:webhook_dedupe_collision'`

## Rollback toggle (keep ready at all times)

Primary rollback control for Stream-dependent rollout:

- Feature flag key: `stream_changes_canary`
- Disable path: Supabase `feature_flags.enabled = false` for that key (or invoke `stream-canary-guard` manual disable path)
- Effect: Stream canary cohort is halted; Stream-dependent surfaces stay gated while investigation proceeds.

Use rollback when error budget is exceeded (see thresholds below).

## Dashboard setup

Create dashboard: `Chat Reliability - 72h + 7d - <merge-date>`

Global filters:
- Date range: `last 7 days`
- Interval:
  - First 72h: `hourly`
  - Day 4–7: `daily`
- Optional filter: `deploy_sha = <merge SHA>`

Insights:

1. **Message send failures (count)**
   - Event: `message.send.failed`
   - Breakdown: `mode`, `trip_id`

2. **ReadChannel recovery failures (count)**
   - Event: `membership.recovery.attempt`
   - Filter: failure-only outcome/stage values
   - Breakdown: `stage`, `reason_code`

3. **Reconnect backfill fetched count (sum)**
   - Event: `chat.reconnect.backfill`
   - Aggregation: `sum(fetched_count)`
   - Breakdown: `trigger`

4. **Time-to-first-message p50/p95 (ms)**
   - Event: `chat.time_to_first_message`
   - Aggregations: `p50(duration_ms)`, `p95(duration_ms)`
   - Breakdown: `source`

## Required SQL/log checks

### A) Webhook dedupe collisions (daily)

```sql
select
  date_trunc('day', processed_at) as day,
  count(*) as dedupe_collisions
from webhook_events
where event_type = 'stream:webhook_dedupe_collision'
  and processed_at >= now() - interval '7 days'
group by 1
order by 1 asc;
```

### B) Stream webhook 401/500 response codes (hourly in first 72h, then daily)

```sql
select
  date_trunc('hour', created_at) as hour_bucket,
  status_code,
  count(*) as requests
from edge_function_logs
where function_name = 'stream-webhook'
  and status_code in (401, 500)
  and created_at >= now() - interval '72 hours'
group by 1, 2
order by 1 asc, 2 asc;
```

> If your project does not expose `edge_function_logs` via SQL, run the equivalent filter in Supabase Logs UI (`function_name=stream-webhook`, status in `401,500`).

## First 24–72h incident thresholds and actions

Run this loop hourly until 72h stability:

1. Review all signals across **trip chat, pro chat, reactions, mentions, and threads**.
2. Trigger immediate containment if any are true:
   - sustained or accelerating `message.send.failed`,
   - repeated ReadChannel recovery failures,
   - recurring webhook 401/500s,
   - correlated spikes across multiple chat surfaces.
3. If triggered, disable `stream_changes_canary` and post incident note with:
   - start time,
   - affected surfaces,
   - top error signatures,
   - mitigation status.
4. Resume rollout only after rates stabilize and root-cause fix is validated.

## Day 4–7 expansion gate

Expand rollout only when **all** are stable:

- Stream send failure trend is flat or improving.
- ReadChannel failures are isolated/non-recurring.
- Stream webhook 401/500 counts are at or near baseline.
- No regression in trip/pro chat surfaces, reactions, mentions, and threads.

## Verification checklist (D0–D6)

1. Confirm PostHog insights are populated for all reliability signals.
2. Run SQL/log checks for webhook dedupe collisions and webhook 401/500s.
3. Compare surface-level health for trip, pro, reactions, mentions, and threads.
4. If any threshold is breached, execute rollback toggle and open incident thread.
5. Post summary with dashboards + log snippets in release thread.
