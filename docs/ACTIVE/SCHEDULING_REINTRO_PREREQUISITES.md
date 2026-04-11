# Scheduling Reintroduction Prerequisites (TODO)

## Goal
Safely reintroduce broadcast scheduling without duplicate sends, missed sends, silent queue failures, or unauthorized access.

## Preconditions (all required)

- [ ] **Idempotent worker path**
  - Delivery worker must enforce an idempotency key per scheduled broadcast execution (for retries/replays).
  - DB write path must be conflict-safe (single successful send transition) under concurrent worker attempts.
  - Retries must be safe to run multiple times with no duplicate user-visible sends.

- [ ] **Catch-up logic for downtime windows**
  - Worker must process overdue broadcasts (`scheduled_for <= now`) when service resumes.
  - Define an explicit max catch-up horizon and batch size to avoid thundering-herd behavior.
  - Record how stale sends are handled (send anyway vs skip with terminal status) and make behavior deterministic.

- [ ] **Queueing + monitoring + alerting**
  - Introduce an explicit queue/claim model (claim timeout + retry counter + dead-letter/failed state).
  - Add metrics at minimum: queue depth, processing latency, success rate, retry count, and overdue backlog.
  - Add operator alerts for backlog growth, repeated failures, and worker heartbeat loss.

- [ ] **Entitlement gate (plan/role checks)**
  - Scheduling UI and API paths must be gated by subscription entitlement + trip role permissions.
  - Enforce entitlement server-side (RLS / edge function guard), not only via client UI checks.
  - Add regression tests for allowed/denied plan tiers and role combinations.

## Definition of Done for Re-enable

- [ ] Automated tests cover duplicate-retry safety, catch-up behavior, and entitlement enforcement.
- [ ] Dry-run in staging with synthetic scheduled broadcasts shows zero duplicates and bounded backlog drain.
- [ ] Runbook exists for pause/resume, replay window, and incident handling.
- [ ] Feature gate can disable scheduling instantly without affecting immediate-send broadcasts.

## Rollout Note
Keep scheduling behind a kill switch until all preconditions are validated in staging and verified in production with live monitoring.
