# Migration Sync: Repo ↔ Lovable ↔ Database

Chravel's schema is edited from **two** places — **Lovable** and **coding agents**
(Claude Code / Codex / Cursor). They apply migrations differently, which is why
migrations have historically "slipped through the cracks." This document explains
the two migration origins, the drift they cause, the automation that fixes it,
and the rules for keeping repo, Lovable, and the database in sync.

Deep-dive performed 2026-07-24 against prod `jmjiyekmxwsxkfnqwyaa` (ChravelApp).

---

## The two migration origins

| | **Lovable** | **Agent** (Claude / Codex / Cursor) |
|---|---|---|
| Filename | `YYYYMMDDHHMMSS-<uuid>.sql` (dash + UUID) | `YYYYMMDDHHMMSS_<slug>.sql` (underscore + words) |
| Applied to DB? | **Yes, automatically** by Lovable | **No** — only if the agent runs it, or CI does |
| Recorded in `schema_migrations`? | Yes (name = `version_uuid`, version off by ~3s) | Only when applied |
| Committed to repo? | Yes, via Lovable's GitHub sync | Yes, by the agent |

**The gap:** an agent writes a `_slug.sql` migration and commits it, but nothing
applies it to the database. Lovable never sees it (different tool); the Supabase
CLI can't `db push` it (the history is divergent — see below). So the file sits
in the repo, unapplied, until someone notices.

## Two drift directions (both confirmed)

1. **Repo → not DB** (agent gaps). ~230 agent files; a subset genuinely never ran.
   Fixed this pass: all security migrations, payment settlement
   (`atomic_settlement_rpcs`), `get_channel_member_counts`,
   `update_event_with_version`, web-push helpers, and the PUBLIC-grant
   corrective. See "Known remaining gaps" for the rest.

2. **DB → not repo** (Lovable-only, never committed). Applied in the DB but with
   **no repo file**:
   `waitlist`, `waitlist_email_unique_index`, `waitlist_revoke_anon_access`,
   `waitlist_admin_access_and_super_admins`, `ensure_notification_delivery_fanout`,
   `revert_broken_fanout_trigger`, `notification_fanout_prod_schema_push_only`,
   `security_hardening_admin_audit_logs`, `fix_trips_rls_infinite_recursion_conditional`,
   `add_list_applied_migrations_rpc`, `security_privacy_hardening_pass_part1_rpcs`,
   `security_privacy_hardening_pass_part2_policies`,
   `security_privacy_payment_splits_null_trip_type`.
   These are live in prod but missing from the repo's history.

## Why not `supabase db push`?

Lovable records migrations under its own version keys (a few seconds off the file
timestamp), so `db push` compares local file versions against
`schema_migrations.version`, sees ~450 "unapplied," and tries to replay the whole
history against a database that already has it. That is unsafe (recreates dropped
objects, fails on non-idempotent DDL). Object-existence is also an unreliable
oracle — most "missing" objects are *superseded/renamed*, not gaps.

---

## The automation: `deploy-migrations.yml`

On push to `main` touching `supabase/migrations/**`, the workflow applies **only
the migration files added in that push, and only the AGENT ones**:

- **Skips** `YYYYMMDDHHMMSS-<uuid>.sql` files — Lovable already applied those.
- For each `YYYYMMDDHHMMSS_<slug>.sql` file: if its version/name isn't already in
  `schema_migrations`, run it via `psql` and record it. Anything already recorded
  (e.g. applied via the Supabase MCP) is skipped.

This sidesteps the divergent-history problem entirely — it never tries to replay
the backlog, only the new file in front of it.

### One-time setup to enable it
1. Repo **variable** `MIGRATIONS_AUTOAPPLY = true` (master switch; inert until set).
2. Repo **secret** `SUPABASE_DB_URL` = the Session-pooler connection string from
   Supabase → Connect (includes the password).

Run it manually first (`workflow_dispatch`, `dry_run = true`) to preview.

---

## Rules going forward

- **Agents** must name migrations `YYYYMMDDHHMMSS_descriptive_slug.sql` (underscore),
  write them **idempotently** (`CREATE OR REPLACE`, `IF NOT EXISTS`,
  `DROP ... IF EXISTS`, `ON CONFLICT`) — a re-run must be a no-op — and pass
  `npx tsx scripts/lint-migrations.ts`. On merge to `main`, CI applies them.
- **Lovable** changes keep flowing through Lovable's own apply + GitHub sync.
  Nothing to do — but see the reverse-drift note below.
- **Never** hand-apply an agent migration to prod *and* leave it unrecorded — the
  MCP `apply_migration` records it; a raw `execute_sql` does not.
- **Reverse drift**: when Lovable makes a change, confirm the generated
  `-<uuid>.sql` file lands in the repo (Lovable's GitHub sync). The 13 Lovable-only
  migrations listed above predate this check and should be back-filled into the
  repo (see `docs/LOVABLE_SYNC_PROMPT.md`).

## Known remaining gaps (app-referenced RPCs still missing)

Left unapplied on purpose — their defining migrations are old/multi-purpose and
carry schema-drift risk, so they belong to Lovable (which knows the live schema)
rather than a blind replay. See `docs/LOVABLE_SYNC_PROMPT.md` for the prompt.

| Feature | Missing fns | Notes |
|---|---|---|
| Permission resolver (shelved) | `can_trip_actor_for_user`, `get_trip_mutation_permissions`, `permission_matrix_allows` | intentionally not deployed; app has fallbacks — decide before deploying |
| Google Maps cache/quota | `get_places_cache`, `set_places_cache`, `get_daily_usage`, `get_hourly_usage`, `record_api_usage` | caching/quota optimization |
| OCR limits | `check_ocr_rate_limit`, `increment_ocr_usage` | needs `ocr_rate_limits` table |
| Artifact search | `find_similar_artifacts`, `search_trip_artifacts` | needs embeddings/vector verification |
| Notifications/PII | `redact_pii_from_text`, `should_suppress_email` | notification filtering |
