# CHRAVEL PLATFORM ARCHITECTURE & SCALE CONSTITUTION
> **Date:** March 2026
> **Scope:** Full-platform scalability, concurrency, integrity, permissions, and reliability audit
> **Author:** Principal Distributed Systems Architect

---

## 1. Executive Summary

Chravel is transitioning from an ambitious coordination product to a rigid, production-grade platform. The current state represents a **58/100 readiness** for 100K-1M MAU scale.

The platform's **biggest structural risks** are located in:
1. **Shared-Write Concurrency:** The system relies too heavily on optimistic client-side UI updates combined with non-locking database writes (e.g., payment settlements double-crediting, poll vote/close races).
2. **Realtime Broadcast Storms:** High-density trips (100+ users) will saturate WebSocket connections and client CPU because of unbatched, unthrottled realtime push patterns.
3. **AI Cost Asymmetry & Mutation Safety:** AI capabilities operate on a per-trip quota rather than a per-user global quota, exposing the platform to Sybil-like cost attacks. AI mutations to shared state lack mandatory client-side confirmation loops.
4. **CORS & Edge Function Exposure:** Historically, wildcard CORS (`Access-Control-Allow-Origin: *`) across edge functions posed an isolation risk. While `_shared/cors.ts` now uses an allowlist via `getCorsHeaders(req)`, legacy static imports (`export const corsHeaders = getCorsHeaders()`) still fail to validate the `Origin` header dynamically per request, leaving a gap in origin validation for endpoints that have not yet migrated.

**Most Coherent Surfaces:**
- Domain separation between free, pro, and event trips.
- Core Supabase Auth session management.
- Baseline Row-Level Security (RLS) enforcement using `security_invoker = true`.

**Most Fragmented Surfaces:**
- Feature entitlement checks (split between client-side hardcoded lists and server-side logic).
- Idempotency guarantees (declared in types but unenforced by database unique constraints).
- Private object access inside shared trips (e.g., private basecamps, receipts).

---

## 2. Full Platform System Map

### Entities & Ownership Model
- **User Identity (`profiles`, `auth.users`):** The absolute root of trust. No system shall trust a client-provided `user_id`.
- **Trip Container (`trips`):** The primary data boundary. 90% of data is scoped here.
- **Organization (`organizations`):** The billing and B2B administration boundary. Cross-cuts trips.
- **Collaboration Objects (`trip_events`, `trip_tasks`, `trip_polls`, `trip_chat_messages`):** Shared state owned by the Trip, mutable by members based on role.

### Trust Boundaries
- **Client (React/Capacitor):** Zero trust. Can only propose state changes.
- **Edge Functions (Deno):** Medium trust. Must validate all JWTs, enforce rate limits, and sanitize inputs before interacting with external APIs or the database.
- **Database (Postgres):** High trust. Enforces RLS, foreign keys, unique constraints, and pessimistic locks.

### Realtime & Sync Boundaries
- **Realtime Channels:** Isolated by `trip_id`. Never subscribe globally.
- **Offline Sync:** Client-side queue -> Edge Function / RPC bulk resolution.

### AI Mutation Boundaries
- AI tools (`lovable-concierge`) are strictly barred from direct, unverified writes to shared state. They must return a `PendingActionEnvelope` for human confirmation.

### Scale Bottlenecks
- Unbatched N+1 queries for trip loading.
- Synchronous webhook processing without idempotency tables.
- Realtime presence thrashing on mobile focus/blur events.

---

## 3. Platform Invariants

These rules are non-negotiable and override any local feature requirements.

1. **Actor Attribution:** Every mutation must explicitly record the `auth.uid()` of the executing actor at the database level.
2. **Absolute Idempotency:** Every `POST`/`INSERT` operation MUST require an `idempotency_key`. The database MUST enforce uniqueness on `(idempotency_key, user_id)`.
3. **Shared-Write Locking:** Any operation modifying aggregate financial state, poll totals, or constrained inventory MUST use pessimistic locking (`SELECT ... FOR UPDATE`) in an RPC.
4. **Membership Truth:** Trip access is strictly gated by the `trip_members` table. Existence of a trip ID does not grant read access to metadata unless explicitly public.
5. **Duplicate Prevention:** Retries must be safe. Client-side optimistic UI must reconcile against server timestamps or versions, not just payload content.
6. **Deletion Semantics:** Soft deletes are prohibited unless explicitly required for compliance. Hard deletes with `CASCADE` are the platform standard to prevent orphaned data.
7. **Rate Limit by Default:** Every edge function must wrap its logic in `applyRateLimit()`.

---

## 4. Object Scope Constitution

Every object in Chravel belongs to one of these rigorous scopes:

1. **User-Private:** `profiles`, `user_entitlements`, `user_preferences`. Strictly `user_id = auth.uid()`.
2. **Trip-Shared (Public):** `trips` metadata, `trip_members` (basic info). Readable by all members.
3. **Trip-Shared (Restricted):** `trip_financials`, `trip_admin_logs`. Readable only by `role IN ('creator', 'admin')`.
4. **Channel-Scoped:** `trip_channels`, `trip_chat_messages`. Readable only by members assigned to the specific channel.
5. **Event-Wide:** `broadcasts`. Read-only for most; writeable by admins.
6. **Ephemeral:** `presence`, `typing_indicators`. Not persisted; flushed from memory.
7. **Durable:** `media_attachments`. Backed by storage; requires signed URLs.

---

## 5. Permission Model Constitution

- **Role Hierarchy:** `Creator` > `Admin` > `Member`.
- **Enforcement:** RLS policies are the sole source of truth for read/write access. UI-level disabled states are purely cosmetic.
- **Delegation:** `Creator` cannot be reassigned without a specialized, audited transfer RPC.
- **Enterprise Isolation:** Org admins cannot intrinsically read trip data unless explicitly added to the `trip_members` table. B2B role inheritance stops at the trip boundary.
- **Client-Side Entitlements:** Deprecated. All feature entitlement checks must resolve via the `check-subscription` edge function.

---

## 6. Concurrency + Mutation Constitution

1. **Optimistic Locking:** All collaborative text/document objects must implement a `version` column. Updates failing a `version = expected_version` check must be rejected.
2. **Pessimistic Locking:** All financial transactions (settlements, splits) must execute via an RPC that acquires a row-level lock.
3. **Array Mutations:** Avoid JSONB array mutations for shared state (e.g., attendees). Use junction tables (`trip_event_attendees`) to allow concurrent inserts without conflict.
4. **Queue Parallelism:** The offline sync service must parallelize independent domains but serialize mutations within the same domain (e.g., chat messages) to preserve order.

---

## 7. Access Funnel Constitution

1. **Invite Links:** Must use cryptographically secure generation (`crypto.getRandomValues()`). Minimum 10 characters (base64url).
2. **Rate Limiting:** Join attempts are hard-capped at 10 requests/minute/IP to prevent brute-forcing.
3. **Join Atomicity:** The transition from "invite valid" to "user joined" must happen in a single SQL transaction to prevent double-joins.
4. **Account Creation:** If joining requires account creation, the invite context must be stored securely in an HttpOnly cookie or secure session, not a raw URL parameter.

---

## 8. Realtime + Sync Constitution

1. **Connection Limits:** Maximum 10 concurrent realtime subscriptions per user. The client must implement LRU eviction for inactive tabs.
2. **Event Batching:** Server-to-client push events for chat must be batched in 100ms windows for trips > 50 users.
3. **Reconnect Backfill:** Clients must track the `last_event_timestamp` and perform a REST fetch for missed events upon WebSocket reconnection.
4. **Presence Debouncing:** Mobile presence broadcasts must be debounced by a minimum of 1000ms.

---

## 9. Scale-Tier Architecture Plan

**Stage A: 100-1K Users (Current)**
- Focus: Security hardening, removing wildcard CORS, fixing basic race conditions.
- Infra: Single Supabase instance, default connection pool.

**Stage B: 1K-10K Users**
- Focus: Idempotency enforcement, N+1 query elimination.
- Infra: Implement Redis/Vercel KV for hot queries (Places API, entitlements).

**Stage C: 10K-100K Users**
- Focus: Realtime batching, connection culling, read-replica deployment.
- Infra: Dedicated PgBouncer configuration, Edge caching for static assets.

**Stage D: 100K-1M+ Users**
- Focus: Database sharding by trip, multi-region deployment.
- Infra: Separate analytics cluster, dedicated AI inference queues.

---

## 10. Free vs Paid QoS Constitution

- **AI Limits:** Free users are strictly capped globally per month (e.g., 20 queries/month), tracked in `concierge_usage` (or a dedicated global limit table).
- **Rate Limiting:** Free tier API requests are throttled more aggressively (e.g., 30 req/min) compared to Pro (100 req/min).
- **Compute Priority:** Webhook processing and async queues prioritize Pro/Enterprise orgs during high load.
- **Storage:** Free tier is hard-capped at 500MB, enforced pre-flight on upload.

---

## 11. Dangerous Surface Ranking

1. **Payment Settlements (CRITICAL):**
   - *Risk:* Double-crediting due to race conditions.
   - *Rule:* Mandatory pessimistic locking.
2. **AI Tool Execution (HIGH):**
   - *Risk:* Prompt injection mutating shared state.
   - *Rule:* Human-in-the-loop confirmation (`PendingActionEnvelope`).
3. **Static CORS Imports in Edge Functions (HIGH):**
   - *Risk:* Static imports of `corsHeaders` evaluate once on cold start, failing to capture the request's dynamic `Origin` header and thereby bypassing the allowlist checks in `_shared/cors.ts`. This risks cross-site data exfiltration.
   - *Rule:* Strict origin validation via dynamic `getCorsHeaders(req)` invocation per request.
4. **Media Storage (MEDIUM):**
   - *Risk:* Public access to private trip media.
   - *Rule:* Signed URLs with 1-hour expiry.

---

## 12. Recommended Immediate Platform Changes

1. **Eradicate Static CORS Imports:** Replace the legacy `export const corsHeaders = getCorsHeaders();` pattern with per-request `getCorsHeaders(req)` in all edge functions to ensure dynamic origin validation against the allowlist.
2. **Remove Hardcoded Credentials:** Strip `FALLBACK_URL` and `FALLBACK_ANON_KEY` from `src/integrations/supabase/client.ts`.
3. **Lock Payment Logic:** Migrate `usePaymentSettlements.ts` logic to a Supabase RPC using `SELECT FOR UPDATE`.
4. **Secure AI Context:** Strip system-prompt delimiters from user-provided trip metadata.

---

## 13. Exact Platform Changes

- **Code Areas:**
  - `src/integrations/supabase/client.ts`
  - `supabase/functions/_shared/cors.ts`
  - `supabase/functions/create-checkout/index.ts`
  - `src/constants/admins.ts`
- **Schema Changes:**
  - Add `version` column to `trip_payment_requests`.
  - Add `idempotency_key` (UNIQUE) to `trip_chat_messages` and `trip_events`.
- **Migration Order:**
  1. Deploy Schema Migrations (non-breaking additions).
  2. Deploy Edge Functions (CORS fixes, checkout origin validation).
  3. Deploy Client (Hardcoded credential removal, admin fixes).
- **Rollback Plan:** Schema changes are additive; revert edge function code via git if origin validation fails.

---

## 14. Verification + Load Plan

- **Security Verification:** Use `curl` with a spoofed `Origin` header to verify edge functions reject cross-site requests.
- **Race Condition Verification:** Execute concurrent `POST` requests to the payment settlement RPC; verify only one succeeds and the others fail gracefully.
- **Load Plan:** Simulate 500 concurrent users writing to a single trip chat channel via K6; monitor WebSocket saturation and database CPU.

---

## 15. Platform Scorecard

- **Domain Model Coherence:** 85/100
- **Scope/Ownership Clarity:** 80/100
- **Authorization Model (RLS):** 90/100
- **Shared-Write Safety:** 40/100 *(Needs pessimistic locking)*
- **Idempotency/Deduplication:** 50/100 *(Declared but unenforced)*
- **Realtime Architecture:** 60/100 *(Functional but unbatched)*
- **Invite/Share/Join Safety:** 75/100
- **Media/Storage Robustness:** 40/100 *(Needs signed URLs)*
- **AI Cross-Surface Mutation Safety:** 30/100 *(Vulnerable to injection)*
- **Plan-Aware Traffic Shaping:** 50/100
- **Observability:** 40/100
- **Rollback Readiness:** 50/100
- **Production Readiness:** 58/100

**Overall Score: 58/100**
