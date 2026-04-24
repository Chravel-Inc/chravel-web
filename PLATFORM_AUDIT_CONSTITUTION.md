# CHRAVEL PLATFORM CONSTITUTION
> Date: 2026-04-24
> Scope: Full-platform scalability, concurrency, integrity, permissions, reliability, and growth-surface audit
> Status: Governing architecture and implementation plan for future work

## 1. Executive Summary

Chravel is **salvageable with staged hardening**, but it is **not yet operating under one enforceable platform model**. The stack is capable of supporting real production growth, but the current platform still relies on too many subsystem-local rules, fallback paths, and timing-sensitive behaviors.

The biggest platform-wide structural risks are:

1. **Authority drift across the same concept**
   - Membership, admin rights, role permissions, channel access, and event privileges are split across `trip_members`, `trip_admins`, `trip_roles`, `user_trip_roles`, `channel_members`, and client hooks.
   - Shared state semantics are partly encoded in RLS and partly implied in UI logic.

2. **Mixed mutation contracts**
   - Some shared objects use compare-and-swap RPCs and row locks.
   - Others still have direct `UPDATE` or fallback last-write-wins paths.
   - AI writes mix pending buffers, fast-path real writes, and client auto-confirm behavior.

3. **Messaging and channel model fragmentation**
   - There is one logical product concept called "chat/channels," but multiple storage and transport paths exist: Stream, `trip_chat_messages`, `channel_messages`, `trip_channels`, `channel_members`, and legacy docs that describe older shapes.

4. **Growth funnel truth is not fully atomic**
   - Invites, join requests, membership creation, invite consumption, and preview routing are safer than before, but they still behave like adjacent steps instead of a single authoritative state machine.

5. **Media and heavy payload rules are not uniform**
   - Multiple upload paths, multiple quota interpretations, private-bucket URLs stored as public URLs, and cleanup paths that do not align with object path conventions.

6. **QoS and degraded-mode policy are under-specified**
   - Chravel has rate limits and feature flags, but not a fully standardized per-plan resource policy or a product-wide degradation order for hot trips, hot events, or provider stress.

Where the current platform is coherent:

- Auth/session bootstrap and recovery in `src/hooks/useAuth.tsx`
- Server-driven invite preview/join validation in `supabase/functions/get-invite-preview/index.ts` and `supabase/functions/join-trip/index.ts`
- Versioned/shared-write hardening already present for parts of tasks, polls, calendar, and payments
- Stream chat reconnect/backfill logic in `src/hooks/stream/useStreamTripChat.ts`
- Runtime kill switches and canary guardrails around Stream rollout

Safest current surfaces:

- Auth/session lifecycle bootstrap
- Read-only trip preview/share surfaces
- Payment settlement RPC path
- Stream trip-chat reconnect recovery path

Most dangerous surfaces under scale and concurrency:

- AI Concierge shared-state mutations
- Chat + channels as a cross-surface system
- Invite/share/join funnel under growth and abuse
- Media uploads, attachments, and storage cleanup
- Shared structured writes (tasks, polls, calendar, basecamp, trip metadata)
- Account deletion and post-deletion attribution semantics

Bottom line:

- **Friend trips and small-group usage are supportable now.**
- **Pro trips are supportable only with disciplined server-side enforcement.**
- **Event-scale operation is not yet honest to promise without new moderation, fanout, and degraded-mode rules.**
- The architecture does **not** require a total rewrite, but a few areas do require **real redesign**, not incremental patches:
  - one canonical admin/permission model
  - one canonical messaging/channel model
  - one canonical AI mutation contract
  - one canonical invite-to-membership state machine

## 2. Full Platform System Map

### Core Entities and Authority Boundaries

| Domain | Canonical Tables / Functions | Scope | Current Notes |
|---|---|---|---|
| Identity | `auth.users`, `profiles`, `private_profiles`, `notification_preferences` | User-private | Auth is coherent; deletion and profile semantics are not fully aligned with user-facing docs. |
| Membership | `trip_members`, `trip_join_requests`, `trip_invites` | Trip-scoped | `trip_members` should be the single membership truth, but status handling is inconsistent across paths. |
| Trip control plane | `trips`, `trip_admins`, `trip_roles`, `user_trip_roles`, `channel_role_access` | Trip / admin-only | Admin authority is split between role strings, admin rows, and feature-permission JSON. |
| Channels | `trip_channels`, `channel_members`, Stream channel ids, legacy `channel_messages` | Channel-scoped | Channel identity is coherent enough for product use, but not yet platform-clean. |
| Messaging | Stream transport, `trip_chat_messages`, `channel_messages`, `notifications`, `message_read_receipts`, `message_reactions` | Trip / channel / user | Messaging is the most operationally hardened surface, but also the most fragmented. |
| Shared planning objects | `trip_tasks`, `task_status`, `trip_polls`, `trip_events`, `trip_links`, `trips.basecamp_*` | Trip-shared | Some objects use versioned RPCs; others still permit weaker fallback paths. |
| Media | `trip_media_index`, `trip_files`, Storage buckets `trip-media`, `trip-files`, `trip-covers` | Trip-shared / durable | Upload, preview, and cleanup contracts are not yet unified. |
| AI | `trip_pending_actions`, `ai_queries`, `concierge_usage`, `trip_artifacts`, `kb_*` tables | User-private + trip-shared staging | AI read surfaces are broad; AI write surfaces are not under one policy yet. |
| Billing / entitlements | `user_entitlements`, `organization_billing`, Stripe / RevenueCat edge functions | User / org | Entitlement normalization exists, but plan/QoS resolution still differs by surface. |
| Audit / safety | `admin_audit_logs`, `security_audit_log`, `webhook_events`, `feature_flags`, `app_settings` | Admin / platform | Audit exists but is uneven across mutation families. |

### Trip Types and Topology

- **Consumer trips**
  - Default social coordination container
  - More permissive collaboration
  - Lower moderation overhead
  - Simpler channel needs, often none

- **Pro trips**
  - Team / role / operator oriented
  - Require explicit role-based mutation and visibility rules
  - Channel hierarchy should inherit from role assignments and admin intent

- **Event trips**
  - Operationally closest to high-fanout environments
  - Need organizer/admin controls, moderated posting, attachment caps, and hot-room containment
  - Must not share the same realtime and permission assumptions as small social trips

### Data Flow Boundaries

| Boundary | Current Entry Points | Required Role |
|---|---|---|
| Browser / mobile client | `src/App.tsx`, `src/hooks/useAuth.tsx`, TanStack Query hooks | Untrusted proposer only |
| Edge functions | `join-trip`, `get-invite-preview`, `get-trip-preview`, `execute-concierge-tool`, `stream-webhook`, `create-trip`, `restore-trip`, `stream-ensure-membership` | Authoritative request gate |
| Database | RLS + RPC + constraints | Final source of truth |
| Messaging provider | Stream channels and webhooks | Transport, not business authority |
| Storage | Supabase Storage buckets | Durable blob plane, must follow DB metadata contract |

### Shared State Boundaries

- **User-private state**
  - `profiles`, `private_profiles`, `notification_preferences`, `secure_storage`, saved recommendations, private AI usage history
- **Trip-shared state**
  - `trips`, `trip_events`, `trip_tasks`, `trip_polls`, `trip_links`, `trip_payment_messages`, `trip_media_index`
- **Channel-shared state**
  - `trip_channels`, `channel_members`, Stream channel messages, legacy `channel_messages`
- **Admin-only control state**
  - `trip_admins`, `trip_roles`, `user_trip_roles`, moderation and audit tables
- **Ephemeral state**
  - typing, presence, upload progress, local draft state, offline queue items until committed

### Invite / Share Access Paths

- `src/hooks/useInviteLink.ts`
- `src/pages/JoinTrip.tsx`
- `src/pages/TripPreview.tsx`
- `supabase/functions/get-invite-preview/index.ts`
- `supabase/functions/join-trip/index.ts`
- `supabase/functions/get-trip-preview/index.ts`
- `supabase/functions/generate-invite-preview/index.ts`
- `unfurl/worker.ts`
- `vercel.json`

### Realtime Boundaries

- **Stream**
  - `src/hooks/stream/useStreamTripChat.ts`
  - `src/hooks/stream/useStreamProChannel.ts`
  - `src/services/stream/streamClient.ts`
  - `supabase/functions/stream-webhook/index.ts`

- **Supabase Realtime**
  - `src/hooks/useNotificationRealtime.ts`
  - `src/features/calendar/hooks/useCalendarRealtime.ts`
  - `src/hooks/useUserTripsRealtime.ts`
  - per-table fallback channels in task/poll/payment/media hooks

### AI Mutation Boundaries

- `supabase/functions/_shared/concierge/toolRegistry.ts`
- `supabase/functions/_shared/functionExecutor.ts`
- `supabase/functions/_shared/concierge/tripAccess.ts`
- `supabase/functions/execute-concierge-tool/index.ts`
- `src/hooks/usePendingActions.ts`
- `src/components/AIConciergeChat.tsx`

### Likely Scale Bottlenecks

1. Hot chat/channel fanout plus reconnect backfill
2. Invite preview/join spikes and notification fanout
3. Media upload + index + signed URL churn on popular trips/events
4. AI cost and mutation safety under bursty usage
5. Subscription/channel count explosion because realtime ownership is not centralized enough

## 3. Platform Invariants

These rules are non-negotiable. Every future feature must obey them.

1. **Membership truth**
   - An **active** `trip_members` row is the only authoritative proof that a user is part of a trip.
   - No feature may infer trip access from `trip_id`, invite possession, UI navigation, or cached local state alone.

2. **Trip-type truth**
   - `trips.trip_type` must be a closed server-side enum: `consumer`, `pro`, or `event`.
   - No parallel vocabulary such as `regular` may remain in load-bearing downstream systems.

3. **Admin truth**
   - Chravel must define one server-side helper for effective administrative authority over a trip.
   - UI role checks are advisory only.

4. **Scope truth**
   - Every object is one of: user-private, trip-shared, channel-scoped, event-wide, admin-only, ephemeral, or durable-media.
   - No object may change scope implicitly because of the screen it is rendered on.

5. **Actor attribution**
   - Every shared mutation must record who initiated it, by what path, and from what source surface.
   - Minimum envelope: `actor_user_id`, `actor_type`, `source_type`, `created_at`, `updated_at`.

6. **Mutation identity**
   - Every non-idempotent create or side-effecting command must have a stable `mutation_id` or `idempotency_key`.
   - Deduplication must be enforced on the authoritative table or transaction boundary, not only on staging rows.

7. **Retry safety**
   - Retrying the same mutation must either:
     - return the already-created authoritative record, or
     - be rejected as an already-processed duplicate,
     - but never create a second semantic result.

8. **Shared-write safety**
   - Shared structured objects must use one of:
     - compare-and-swap with version columns, or
     - transactional row locks,
     - depending on object family.
   - Silent last-write-wins is forbidden for multi-user shared state.

9. **Optimistic UI reconciliation**
   - The client may optimistically render, but the server remains authoritative.
   - All optimistic state must reconcile against server versions, timestamps, or mutation ids.

10. **Realtime correctness**
    - Any surface where missed events matter must implement reconnect backfill.
    - No load-bearing surface may assume websocket replay exists.

11. **Invite and membership atomicity**
    - Invite validation, join request creation, membership creation, and invite consumption must follow one documented state machine.
    - One user journey must consume invite capacity exactly once.

12. **Deletion semantics**
    - Account deletion, member leave, trip archive, message delete, and media delete are different actions and must never be conflated.
    - User-facing copy must match actual runtime behavior.

13. **Auditability**
    - All privileged operations and all cross-user AI mutations must generate auditable records.
    - Audit trails must be queryable by actor, trip, object, and outcome.

14. **Poor-connectivity safety**
    - Background/foreground transitions and offline recovery are first-class platform behaviors, not edge cases.

## 4. Object Scope Constitution

| Object class | Examples | Owner | Viewers | Editors | Mutation rules | Concurrency rules | Audit requirements | Deletion / archive rules |
|---|---|---|---|---|---|---|---|---|
| User-private | `profiles`, `private_profiles`, `notification_preferences`, private saved items | User | User, limited admin/support with explicit policy | User | Direct user mutation or dedicated account RPCs only | LWW allowed for preferences; account/security actions transactional | Auth event log + security audit for sensitive changes | Account deletion pipeline governs retention/anonymization |
| Trip-shared durable | `trips`, `trip_events`, `trip_tasks`, `trip_polls`, `trip_links`, `trip_payment_messages`, `trip_media_index` | Trip | Active trip members | Role-dependent by trip type | All writes must pass membership + role helper | Versioned CAS for structured docs; row locks for payments/inventory | Mutation log + admin audit for privileged edits | Archive removes from hot paths; content persists by policy |
| Channel-scoped durable | `trip_channels`, `channel_members`, Stream channel state, legacy `channel_messages` | Channel within trip | Channel members + trip admins | Channel members or moderators depending on mode | Channel membership must be inherited or explicitly granted server-side | Messaging is append-only + idempotent send; moderation serialized | Moderation audit required | Archiving a channel hides it without deleting history by default |
| Event-wide moderated | `broadcasts`, event agenda/lineup, event-wide notices | Event trip | Event attendees, scoped by product mode | Organizer/admin/moderator | Writes allowed only through event moderation policy | Append-only where possible; bulk edits must be transactional | Mandatory audit for broadcast/admin actions | Event archive retains history; public share surfaces become read-only |
| Admin-only control plane | `trip_admins`, `trip_roles`, `user_trip_roles`, `channel_role_access`, `admin_audit_logs` | Trip/org control plane | Effective admins only | Effective admins only | No direct client table writes; RPC or edge-only | Serialized transactional updates | Mandatory | Never soft-delete silently; retain audit trail |
| AI staging | `trip_pending_actions`, AI drafts, import previews | Initiating actor within trip | Initiator and authorized approvers | Initiator and authorized approvers only | No direct promotion without approval except explicitly whitelisted low-risk cases | Exact-once promotion from pending to authoritative row | Mandatory: actor, tool, session, approval actor | Expire stale rows; never become silent source of truth |
| Ephemeral | typing, presence, upload progress, local drafts, offline queue | Device/session | Relevant local user or channel participants | Device/session | Never source-of-truth | LWW or drop-on-reconnect acceptable | No audit unless promoted to durable action | Auto-expire; no long-term retention |
| Durable media blobs | Storage objects in `trip-media`, `trip-files`, `trip-covers` | Trip plus uploader attribution | Based on trip/channel/object policy | Uploaders and moderators per policy | Blob and DB index must commit under one contract | Upload idempotency and path determinism required | Upload/delete moderation events for privileged actions | Archive and deletion must clean both DB and storage |

## 5. Permission Model Constitution

### Canonical roles

Chravel should expose a normalized server-side permission model:

- **Owner / creator**
  - Ultimate authority for trip existence, primary admin transfer, destructive controls
- **Trip admin / organizer**
  - Can manage members, roles, channels, moderation, invites, and event-wide operations
- **Moderator**
  - Can moderate chat/channels/media but not alter billing or trip ownership
- **Collaborator / full member**
  - Can participate in allowed shared writes for that trip type
- **Read-only attendee**
  - Can view, react, RSVP, and consume updates, but cannot mutate structured shared objects
- **Requester / pending member**
  - Can view only public preview state and own join/request status

### Trip-type permission rules

| Action family | Consumer trip | Pro trip | Event trip |
|---|---|---|---|
| View trip content | Active members | Active members per role/channel | Attendees / members per event mode |
| Edit trip metadata | Owner, delegated admin | Owner/admin | Owner/admin |
| Create structured shared objects | Members by default | Role-permission based | Organizer/admin by default |
| Broadcast / announcements | Owner/admin | Owner/admin | Organizer/admin/moderator |
| Invite others | Members only if explicitly allowed by trip settings; default owner/admin | Admin/organizer only | Admin/organizer only |
| Create share links | Public preview links only through server policy | Admin/organizer only | Admin/organizer only |
| Moderate chat/media | Rare in consumer; owner/admin only | Admin/moderator | Admin/moderator |

### Channel model constitution

- Channels are **trip-local**, never cross-trip.
- Channel membership may be:
  - inherited from trip role grants,
  - explicitly granted through `channel_members`,
  - or both, but the server must publish one effective membership result.
- Channel posting permissions are separate from trip membership but must still respect trip moderation state.
- Announcement / read-only channels are allowed and must be enforced server-side.
- User-created channels are permitted only when the trip type and admin policy allow them.

### Explicit confirmation rules

Require explicit user confirmation for:

- AI-generated shared writes
- Bulk deletes / bulk status changes
- Broadcasts and notifications sent to other users
- Payment settlements and expense splits
- Destructive moderation actions
- Ownership transfer and account deletion

May auto-apply without confirmation:

- User-private preference changes
- Read receipts / typing / presence
- Safe retries of already-idempotent writes
- Low-risk client repair actions that do not alter shared business objects

### Server-side enforcement expectations

- Every permission boundary must exist in RLS or RPC/edge validation.
- Client hooks such as `useMutationPermissions`, `useRolePermissions`, and `useEventPermissions` are UX mirrors only.
- No path may rely on client email lists, route guards, or hidden buttons as true authorization.

## 6. Concurrency + Mutation Constitution

### Global mutation rules

1. Every mutation carries:
   - `mutation_id` or `idempotency_key`
   - `actor_user_id`
   - `actor_type` (`user`, `ai`, `system`, `webhook`)
   - `source_surface`
   - `trip_id` / `channel_id` where applicable

2. Retry behavior:
   - Retries must be exact-once at the business-object level.
   - Duplicate suppression belongs on the authoritative row or transaction, not only in the client or staging queue.

3. AI-triggered mutations:
   - Must follow the same idempotency, attribution, and audit rules as manual mutations.
   - Shared-state writes default to **pending approval**.

### Consistency policy by object family

| Object family | Consistency requirement | Allowed conflict policy |
|---|---|---|
| Membership, invites, join requests, role/admin changes | Strong | Transactional serialize; reject stale state |
| Payments, balances, settlement, quota counters | Strong | Row lock or equivalent transactional gate |
| Tasks, polls, calendar events, trip metadata, basecamp | Medium-strong | Versioned CAS with reject-and-refetch |
| Media index rows | Medium-strong | Upload idempotency + deterministic commit; no duplicate semantic object |
| Notifications, webhooks, audit/event logs | Append-only idempotent | Upsert or ignore duplicate event id |
| Reactions, read receipts, presence | Eventual | Deduped append/update acceptable |
| Search indices, embeddings, analytics projections | Eventual | Rebuild / reconcile allowed |

### Last-write-wins rule

Last-write-wins is explicitly allowed only for:

- user-private preferences
- ephemeral state
- derived caches and read models

It is explicitly forbidden for:

- trip metadata
- basecamp
- shared calendar/task/poll objects
- invite consumption
- payments / settlements
- moderation / admin changes

### Conflict handling

- Shared structured objects must fail with a conflict result when version mismatches.
- Clients must surface refetch-and-retry UX, not silently overwrite.
- Offline replay must preserve per-entity ordering and version intent.

## 7. Access Funnel Constitution

1. **Invite links**
   - Invite code existence does not imply trip access.
   - Public preview may expose only minimal metadata needed for conversion.
   - Link open does **not** consume invite capacity.

2. **Share links**
   - Share preview and interactive app navigation must use one canonical host contract.
   - OG/unfurl paths must never become the app’s interactive destination.

3. **Join flow**
   - Invite validation, membership check, request creation, and invite consumption must be one authoritative state machine.
   - A previously-left member must not be treated as already active.

4. **Account creation during invite acceptance**
   - Invite context must survive auth through a signed server-backed context, not only `localStorage` or URL parameters.
   - Same-origin and deep-link constraints must be explicit.

5. **Membership confirmation**
   - `trip_join_requests` is the only pending-access record.
   - `trip_members` is the only active-access record.
   - Approval must be idempotent and create/restore active membership exactly once.

6. **Duplicate join attempts**
   - Duplicate pending requests should return the existing request state, not create a new semantic request.
   - Duplicate approved joins should resolve to “already member.”

7. **Expired / invalid / abused links**
   - `inactive`, `expired`, `max_uses`, and `trip archived` are distinct error classes with stable server error codes.
   - Abuse controls apply by IP and by authenticated user depending on the surface.

8. **Wrong-trip / wrong-event routing prevention**
   - Client navigation must always derive the destination from server-validated trip type and invite context.
   - Public preview must not guess membership or access client-side.

## 8. Realtime + Sync Constitution

### Realtime scope rules

- **Stream is the canonical transport for chat-style messaging.**
- **Supabase Realtime is for lower-throughput structured data and per-user notification streams.**
- A trip/session must not accumulate uncontrolled parallel subscriptions for the same data family.

### Subscription rules

- Every `postgres_changes` subscription must filter by `trip_id`, `channel_id`, or `user_id`.
- Global unfiltered subscriptions are forbidden on hot tables.
- A shared trip realtime multiplexer should own per-trip non-chat subscriptions.

### Reconnect / backfill

- Loss-intolerant surfaces must backfill on:
  - websocket reconnect
  - foreground return
  - app cold start after stale session
- Backfill must dedupe against locally cached rows by stable server ids.

### Activity feed and unread rules

- Unread truth must be server-derived, not inferred from the current page window.
- Activity and notifications may be eventually consistent, but unread counters must reconcile to one authoritative server count.

### Hot room / hot event behavior

Event trips need explicit scale modes:

- **Default up to small event size**: moderated full participation
- **Medium event mode**: one attendee discussion channel plus organizer announcement channel
- **Large event mode**:
  - announcement channel default
  - attendee chat isolated or rate-limited
  - no typing indicators
  - no presence fanout
  - attachment uploads capped or organizer-only

### Multi-device consistency

- Server read markers, message ids, and versioned object updates are authoritative.
- Client caches may diverge transiently, but must reconcile on reconnect and foreground.

### What truly requires realtime

- Must be realtime:
  - trip chat
  - role channels
  - notifications
  - moderation outcomes
- Can be eventual:
  - media counts
  - search indices
  - analytics
  - AI usage dashboards
- Hybrid:
  - tasks, polls, calendar, payments via optimistic local updates + server reconciliation

## 9. Scale-Tier Architecture Plan

### Stage A: 100–1,000 active users

- Primary bottlenecks:
  - authority drift
  - invite accounting inconsistencies
  - mixed mutation contracts
  - missing load / synthetic / migration compatibility tests
- Required infra changes:
  - none beyond current managed stack, but runtime flags and dashboards must be standardized
- Required data integrity changes:
  - unify effective membership/admin helpers
  - remove silent LWW fallbacks on shared objects
  - make invite consumption semantics single-source
- Required rate limiting / QoS:
  - edge limits for all abuse-prone endpoints
  - per-user + per-IP join and AI limits
- Required observability:
  - request/mutation ids
  - chat, invite, AI, upload failure dashboards
- Surfaces that become risky first:
  - AI writes
  - join/share
  - media uploads
- Acceptable now but will fail later:
  - per-hook Supabase Realtime channels
  - client-side fallback throttles
  - legacy dual messaging stores

### Stage B: 1,000–10,000

- Primary bottlenecks:
  - per-trip subscription sprawl
  - media URL signing churn
  - Stream / Supabase membership drift
  - plan/QoS ambiguity
- Required infra changes:
  - staging environment
  - shared trip realtime multiplexer
  - stronger canary + rollback automation
- Required data integrity changes:
  - authoritative pending-only AI pipeline
  - media ingest contract with cleanup sweeps
  - target-table idempotency for all AI and webhook side effects
- Required rate limiting / QoS:
  - tier-aware AI, import, upload, broadcast, and export quotas
  - per-trip operational throttles for event hosts
- Required observability:
  - synthetic invite/join and chat probes
  - provider error budgets
- Surfaces that become risky first:
  - chat/channels on hot pro trips
  - invite spikes
  - OCR / AI / smart import cost surfaces
- Acceptable now but will fail later:
  - manual recovery for Stream membership drift
  - list-slice unread calculations

### Stage C: 10,000–100,000

- Primary bottlenecks:
  - event-scale fanout
  - notification storms
  - media ingest and signed URL volume
  - shared-object write amplification
- Required infra changes:
  - queue-backed notification and heavy-work pipelines
  - dedicated event-mode operational controls
  - archive-aware query and storage strategies
- Required data integrity changes:
  - per-entity ordered offline replay
  - backfill/reconciliation jobs for messaging memberships and media orphans
- Required rate limiting / QoS:
  - paid/admin priority lanes
  - degraded mode for free AI/import traffic
- Required observability:
  - hot-trip/hot-event dashboards
  - queue age and saturation alerts
- Surfaces that become risky first:
  - event chat
  - organizer broadcast/notification fanout
  - media comments and gallery views
- Acceptable now but will fail later:
  - “all tools” AI query classes
  - public preview endpoints without stronger abuse analytics

### Stage D: 100,000–1,000,000+

- Primary bottlenecks:
  - global shared infrastructure contention
  - messaging transport and media egress concentration
  - operational control-plane blast radius
- Required infra changes:
  - explicit hot-object isolation strategy
  - queued writes for some large event operations
  - possibly dedicated messaging / media service boundaries if hot-event load dominates
- Required data integrity changes:
  - partitioned history / archive strategy
  - stronger contract registry for downstream projections
- Required rate limiting / QoS:
  - hard per-plan resource classes
  - event-host reserved capacity
  - tenant or org fairness controls
- Required observability:
  - SLO-backed platform control room
  - provider cost and latency guardrails
- Surfaces that become risky first:
  - massive event chat
  - AI cost amplification
  - invite/share virality spikes
- Acceptable now but will fail later:
  - single control-plane assumptions
  - manual reconciliation of drift

## 10. Free vs Paid QoS Constitution

### Core rule

Free usage must never be able to materially degrade:

- paid trip operations
- organizer/admin actions
- Tier-0 auth, invite, membership, and core trip reads/writes

### Recommended resource classes

| Resource class | Free | Paid consumer | Pro / event admin |
|---|---|---|---|
| Auth, invite preview, join status | Full access, abuse-protected | Full access | Full access with highest protection |
| Core trip reads | Standard | Standard | Standard |
| Shared structured writes | Standard with anti-abuse caps | Standard | Reserved operational lane during degradation |
| AI text/tool calls | Lowest priority, strongest caps | Higher monthly budget and burst | Highest budget and queue priority |
| Smart import / OCR / heavy enrich | Serialized / throttled | Moderate concurrency | Reserved lanes for hosts/admins |
| Media uploads | Lowest concurrent upload budget | Higher concurrent upload budget | Highest concurrent and support escalation |
| Broadcast / notifications | Not available or heavily gated | Limited | Reserved host/admin capacity |

### Platform rules

1. AI, import, OCR, export, and media processing must be **plan-aware** queues or admission-controlled services.
2. Tier-0 paths are **never deprioritized** behind free-tier heavy work.
3. Organizers/admins on event/pro trips get reserved operational capacity for:
   - announcements
   - join moderation
   - critical structured writes
4. Free-tier degraded mode should:
   - shed AI first
   - delay imports/transcodes second
   - never block existing trip reads or approvals

## 11. Dangerous Surface Ranking

| Rank | Surface | Severity | Failure shape | Blast radius | Governing rule |
|---|---|---|---|---|---|
| 1 | AI Concierge shared mutations | Critical | Duplicate, unattributed, or unauthorized writes; broadcast-like side effects | Cross-object, cross-user | Shared AI writes default to pending approval with exact-once promotion |
| 2 | Chat + channels | Critical | Membership drift, missed backfill, split moderation/state rules | Hot trip / hot event / multi-device | One messaging authority, one channel authority, reconnect backfill mandatory |
| 3 | Invite / share / join funnel | Critical | Wrong routing, double consumption, invalid “already member,” mass abuse | Conversion, growth, membership integrity | One invite-to-membership state machine |
| 4 | Shared structured writes (`tasks`, `polls`, `calendar`, `basecamp`, trip metadata) | High | Silent overwrites, stale offline replay, inconsistent conflict semantics | Trip-scoped corruption | Versioned CAS or transactional locking only |
| 5 | Media uploads and storage | High | Broken previews, orphaned blobs, quota bypass, attachment failure at scale | Trip-scoped plus storage cost | One upload contract, one signing contract, one cleanup contract |
| 6 | Event trips | High | Fanout overload, participation chaos, moderation breakdown | Many users at once | Event-mode defaults must diverge from social trip defaults |
| 7 | Auth / account flows | Medium-high | Wrong redirect, hydration races, login/signup spikes | Whole-user session health | Signed auth context and Tier-0 SLOs |
| 8 | Notifications / unread | Medium | Wrong unread counts, alert storms, stale click routing | User trust, support burden | Server unread truth and deduped event delivery |
| 9 | Account deletion | Medium-high | User expects deletion; platform preserves anonymized/orphaned artifacts | Legal, trust, support | Runtime behavior and public policy copy must match exactly |

## 12. Recommended Immediate Platform Changes

1. Define and ship one **effective membership/admin helper** used by RLS, RPCs, and edge functions.
2. Convert AI shared-state writes to **pending-only by default**; remove fast-path real writes for non-trivial shared mutations.
3. Standardize a **mutation envelope** for all shared writes: actor, source, mutation id, idempotency key, timestamps.
4. Fix the **invite consumption model** so request creation and approval do not both count as invite uses.
5. Unify the **chat/channel domain model** and formally deprecate the legacy pieces that remain only for compatibility.
6. Replace dead or optional realtime hub behavior with one real **trip realtime multiplexer**.
7. Collapse media uploads to one **storage path + DB index + signed URL** contract.
8. Enforce **event-mode chat defaults** for large events: moderated participation, no typing/presence fanout, attachment restrictions.
9. Create one **plan/QoS resolver** consumed by trip creation, AI, imports, uploads, and billing-gated surfaces.
10. Align **account deletion docs and runtime** so users and operators understand what is deleted, anonymized, or orphaned.
11. Establish a platform **observability foundation**: request ids, mutation ids, invite/join dashboards, upload failure dashboards, AI spend alerts, load tests, and rollback runbooks.

## 13. Exact Platform Changes

### Code areas to modify

- Permissions / authority
  - `src/hooks/useMutationPermissions.ts`
  - `src/hooks/useRolePermissions.ts`
  - `src/hooks/useEventPermissions.ts`
  - `src/hooks/useTripChatMode.ts`
  - `supabase/functions/_shared/concierge/tripAccess.ts`

- Invite / join / preview
  - `src/pages/JoinTrip.tsx`
  - `src/pages/TripPreview.tsx`
  - `src/hooks/useInviteLink.ts`
  - `supabase/functions/join-trip/index.ts`
  - `supabase/functions/get-invite-preview/index.ts`
  - `supabase/functions/get-trip-preview/index.ts`
  - `supabase/functions/generate-invite-preview/index.ts`
  - `vercel.json`

- Messaging / realtime
  - `src/hooks/stream/useStreamTripChat.ts`
  - `src/hooks/stream/useStreamProChannel.ts`
  - `src/hooks/useNotificationRealtime.ts`
  - `src/hooks/useTripMembers.ts`
  - `src/services/offlineSyncService.ts`
  - `src/services/globalSyncProcessor.ts`

- AI mutation path
  - `supabase/functions/_shared/concierge/toolRegistry.ts`
  - `supabase/functions/_shared/functionExecutor.ts`
  - `supabase/functions/execute-concierge-tool/index.ts`
  - `src/hooks/usePendingActions.ts`
  - `src/components/AIConciergeChat.tsx`

- Media
  - `src/services/mediaService.ts`
  - `src/services/uploadService.ts`
  - `src/services/tripMediaUrlResolver.ts`
  - `src/hooks/useMediaManagement.ts`
  - `src/features/broadcasts/components/BroadcastComposer.tsx`
  - `src/services/archiveService.ts`
  - `supabase/functions/process-account-deletions/index.ts`

### Schema / index / policy changes

1. Add server helpers:
   - `is_effective_trip_member(...)`
   - `is_effective_trip_admin(...)`
   - `user_has_trip_feature_permission(...)`

2. Normalize `trip_type`:
   - add DB enum or CHECK constraint
   - migrate downstream `regular` values to `consumer`

3. Fix `trip_pending_actions` contract:
   - align `trip_id` type with `trips.id`
   - add generated types
   - restrict UPDATE/DELETE to initiator or authorized approver

4. Add idempotency on authoritative objects where missing:
   - shared AI-created tasks/events/polls
   - broadcasts / notifications
   - payment creation
   - invite approval consumption
   - media upload manifests

5. Tighten invite queries:
   - only surface invites that are active, unexpired, and under `max_uses`

6. Add event-mode operational policies:
   - large-event posting rules
   - attachment mode rules
   - optional attendee-lane caps

### Env / secret / infra changes

- Canonical URL envs:
  - `APP_BASE_URL`
  - `SITE_URL`
  - `UNFURL_BASE_URL`
- Plan/QoS envs:
  - AI RPM / monthly budgets by plan
  - import / OCR / upload concurrency caps by plan
  - LiveKit session creation caps
- Rollout envs:
  - canary thresholds
  - degradation mode flags

### Service boundaries to introduce or clean up

- **Permission authority layer**
  - one DB/RPC helper boundary for trip membership/admin/feature permissions
- **Invite funnel authority layer**
  - one service contract for invite validation, request creation, approval, and consumption
- **AI action authority layer**
  - one pending-to-authoritative executor
- **Media ingest authority layer**
  - one path from file acceptance to blob storage to index row to signed delivery
- **Realtime multiplexer**
  - one owner of non-chat trip subscriptions per session

### Migration order

1. Additive DB helpers, columns, and indexes
2. Generated types refresh
3. Edge function dual-read/dual-write rollout
4. Client updates to consume new authority helpers
5. Backfills / cleanup jobs
6. Remove legacy paths only after instrumentation confirms cutover

### Deployment order

1. Database additive migrations
2. Edge functions and RPC consumers
3. Web client
4. Canary / trusted cohort
5. Broad rollout
6. Cleanup migrations and legacy-path removal

### Rollback plan

- Prefer additive schema with feature-flagged code paths.
- Roll back behavior via:
  - runtime feature flag disable,
  - edge function redeploy,
  - web rollback,
  - forward-fix migration for data corrections.
- Do not rely on schema rollback for destructive data changes.

## 14. Verification + Load Plan

### Contract tests

- permission helper contract tests for effective membership/admin
- invite state machine contract tests
- AI pending-action promotion contract tests
- media ingest contract tests (blob + DB row + signed URL)

### Permission tests

- role-based create/update/delete for consumer/pro/event
- read-only event attendee enforcement
- channel posting restrictions
- admin-only operations
- private vs shared scope isolation

### Concurrency tests

- duplicate action replay with same idempotency key
- concurrent task/calendar/basecamp edits with stale versions
- AI + manual concurrent writes to same object
- join request duplicate races
- payment settlement double-submit and partial failure

### Realtime tests

- reconnect/backfill on websocket recovery
- background/foreground resume
- multi-device unread consistency
- hot room / hot event behavior
- subscription cleanup and reuse

### Funnel + access tests

- mass invite generation
- invite preview abuse rate limit
- signup/login from invite
- wrong-object route prevention
- expired / inactive / max-use links
- duplicate membership and rejoin-after-leave flows

### Media tests

- concurrent upload stress
- partial upload failure with cleanup
- signed URL refresh behavior
- orphan sweeps
- event-scale attachment restrictions

### Account lifecycle tests

- signup spike
- login spike
- password reset / password change
- delete request / cancel / executor behavior
- attribution retention after deletion

### Multi-user / hot-event tests

- 25-user, 100-user, and 500-user event chat simulations
- organizer broadcast under attendee churn
- AI + media + chat mixed load on same trip

### Free vs paid QoS tests

- free traffic cannot starve organizer/admin operations
- AI/import queue prioritization by plan
- degraded-mode activation under synthetic overload

### Local reproducibility

1. `npm run test:run`
2. focused Vitest suites for permission, invite, pending-action, and media contracts
3. local edge-function invocation tests for invite/join and AI tool paths

### Staging reproducibility

1. multi-user Playwright journeys for invite/join and chat reconnect
2. synthetic event-mode trip with elevated member count
3. provider-failure drills for Stream, AI, and Storage signing

### Success metrics

- zero duplicate authoritative rows for repeated mutation ids
- zero cross-trip access in permission suites
- no stale “already member” responses for left users
- no unsigned/private-media preview failures in covered surfaces
- reconnect backfill success rate above defined SLO
- invite funnel error-rate and conversion metrics stable after hardening

### Rollout guardrails

- canary first for messaging and AI changes
- no broad rollout without load-test pass and rollback toggle
- merge preflight + validate gates before each release unit

## 15. Platform Scorecard

| Domain | Score | Why it is below 95 |
|---|---:|---|
| Domain model coherence | 72 | Trip types are real, but authority is still split across too many tables and legacy paths. |
| Scope / ownership clarity | 68 | Shared vs channel vs user-private vs AI-staging boundaries are not yet enforced uniformly. |
| Authorization model | 74 | RLS is strong in places, but admin/role semantics are not one canonical server model. |
| Shared-write safety | 66 | Some object families use CAS/locks; others still fall back to LWW. |
| Idempotency / deduplication | 61 | Good pockets exist, but exact-once semantics are not universal on authoritative tables. |
| Realtime architecture | 73 | Stream chat is comparatively strong, but non-chat realtime ownership is still fragmented. |
| Invite / share / join safety | 70 | Validation is much better, but invite consumption and routing are not one atomic model yet. |
| Media / storage robustness | 63 | Private-bucket reality, multi-path uploads, and cleanup drift still create correctness risk. |
| AI cross-surface mutation safety | 52 | Pending buffers exist, but fast-path writes and broad pending-action permissions keep this unsafe. |
| Plan-aware traffic shaping | 58 | Limits exist, but QoS classes and reserved operational capacity are not standardized. |
| Observability | 62 | Good local runbooks and event instrumentation, but no complete cross-surface control-plane view. |
| Rollback readiness | 64 | Flags and canaries exist, but migration/data rollback still depends on forward-fix discipline. |
| Production readiness | 67 | Small-group production is credible; high-stakes pro/event scale is still under-governed. |

Interpretation:

- **95–100:** strong and launch-resilient
- **85–94:** decent but exposed
- **70–84:** fragile
- **below 70:** unsafe / not scale-ready

Current reality:

- Chravel is **fragile** as a full platform.
- Several critical subdomains remain **unsafe / not scale-ready** for hot events, growth-stage abuse, and broad AI mutation use.
- The next follow-up hardening prompts should be sequenced as:
  1. permission/admin authority unification
  2. AI mutation contract redesign
  3. invite/join state-machine hardening
  4. media ingest/storage contract unification
  5. messaging/channel model consolidation
