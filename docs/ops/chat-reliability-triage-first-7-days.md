# Chat Reliability Daily Triage (First 7 Days Post-Merge)

This runbook defines the **daily triage dashboard** for the first seven days after a chat-reliability merge.

## Scope

Monitor these signals daily:

1. `message.send.failed`
2. `membership.recovery.attempt`
3. `webhook.dedupe.collision`
4. `chat.reconnect.backfill`
5. `chat.time_to_first_message`

## Event sources

- **PostHog client telemetry**
  - `message.send.failed`
  - `membership.recovery.attempt`
  - `chat.reconnect.backfill`
  - `chat.time_to_first_message`
- **Supabase DB + Edge logs**
  - `webhook.dedupe.collision` (logged and persisted as `webhook_events.event_type = 'stream:webhook_dedupe_collision'`)

## PostHog dashboard setup (daily, first 7 days)

Create dashboard: `Chat Reliability - 7 Day Triage - <merge-date>`

Global filters:
- Date range: **last 7 days**
- Interval: **daily**
- Optional filter: `deploy_sha = <merge SHA>`

Insights:

1. **Message send failures (count/day)**
   - Event: `message.send.failed`
   - Breakdown: `mode`

2. **Membership recovery attempts (count/day)**
   - Event: `membership.recovery.attempt`
   - Breakdown: `stage`

3. **Reconnect backfill fetched count (sum/day)**
   - Event: `chat.reconnect.backfill`
   - Aggregation: `sum(fetched_count)`
   - Breakdown: `trigger`

4. **Time-to-first-message p50/p95 (ms/day)**
   - Event: `chat.time_to_first_message`
   - Aggregations: `p50(duration_ms)`, `p95(duration_ms)`
   - Breakdown: `source`

## Supabase view for webhook dedupe collisions

Run daily:

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

Optional log query filter (Edge Function logs):
- `event = "webhook.dedupe.collision"`

## Daily triage checklist (D0–D6)

1. Confirm all four PostHog insights are populated.
2. Run the Supabase SQL query and record collision count.
3. Investigate any day where:
   - `message.send.failed` increases >2x prior day,
   - `membership.recovery.attempt` spikes without known outage,
   - `chat.time_to_first_message` p95 regresses >30% day-over-day,
   - `dedupe_collisions` > baseline.
4. Post summary in release thread with links/screenshots.

