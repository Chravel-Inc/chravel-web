# Lovable sync prompt

Paste the block below into Lovable. It asks Lovable to (A) implement the
database functions the app calls but that are missing from the database, and
(B) make sure Lovable-only migrations already live in the DB are committed to
the GitHub repo. Everything an agent could safely apply via the Supabase MCP has
already been applied (security hardening, payment settlement, channel counts,
event-version RPC, web-push helpers); this prompt covers only what needs
Lovable's knowledge of the current schema.

Context for you (not for Lovable): background and rationale are in
`docs/MIGRATION_SYNC.md`.

---

```
Our app calls several Postgres RPCs that are MISSING from the database (they were
written in old repo migrations that never applied to our Lovable-managed DB).
Please create idempotent migrations (CREATE OR REPLACE, IF NOT EXISTS) for the
ones below, matching them to our CURRENT schema, and apply them. Use SECURITY
DEFINER with `SET search_path = public`. For each, grant EXECUTE only to the
role that actually calls it (client-facing = authenticated; edge/server-internal
= service_role) and never to anon or PUBLIC. If a function already exists or the
feature was intentionally removed, skip it and tell me which.

1. Google Places caching + Maps quota (called from the maps/places code):
   - get_places_cache(cache_key text) — read a cached Places API response.
   - set_places_cache(cache_key text, payload jsonb, ttl) — upsert a cached response.
   - record_api_usage(...) — record a Google Maps/Places API call for quota.
   - get_daily_usage(...) / get_hourly_usage(...) — return current usage counts.
   Use the existing google_places_cache and google_maps_api_usage tables.

2. OCR rate limiting (called from the OCR/import code):
   - check_ocr_rate_limit(p_user_id uuid, ...) — returns whether the user is under
     their OCR limit.
   - increment_ocr_usage(p_user_id uuid) — records one OCR use.
   Create an ocr_rate_limits table if it does not exist.
   IMPORTANT: these must derive the user from auth.uid() (never trust a passed-in
   user_id for a different user), or be service_role-only.

3. Artifact similarity search (called from the trip-artifacts code):
   - find_similar_artifacts(...) and search_trip_artifacts(...) — over the existing
     trip_artifacts / trip_embeddings tables. Confirm the vector setup first.

4. Notification helpers (called from the notification pipeline):
   - redact_pii_from_text(input text) returns text — strips emails/phones/etc.
   - should_suppress_email(p_user_id uuid, ...) returns boolean — respects the
     user's notification preferences. Derive the user from auth.uid() or make it
     service_role-only.

5. Permission resolver — DO NOT deploy unless you confirm it is intended:
   can_trip_actor_for_user, get_trip_mutation_permissions, permission_matrix_allows,
   and the platform_permission_resolver_mutation_log table were deliberately shelved
   (the app falls back to is_trip_admin / has_coordinator_capability today). Only
   build these if we are actually adopting the resolver; otherwise skip.

After creating these, also confirm that these Lovable-authored migrations, which
are already applied in our database but have NO file in the GitHub repo, get
committed to supabase/migrations so the repo history is complete:
  waitlist, waitlist_email_unique_index, waitlist_revoke_anon_access,
  waitlist_admin_access_and_super_admins, ensure_notification_delivery_fanout,
  revert_broken_fanout_trigger, notification_fanout_prod_schema_push_only,
  security_hardening_admin_audit_logs, fix_trips_rls_infinite_recursion_conditional,
  add_list_applied_migrations_rpc, security_privacy_hardening_pass_part1_rpcs,
  security_privacy_hardening_pass_part2_policies,
  security_privacy_payment_splits_null_trip_type.

Please name every new migration file with an underscore after the timestamp
(YYYYMMDDHHMMSS_descriptive_name.sql), make each idempotent, and report back the
list of functions you created vs. skipped.
```
