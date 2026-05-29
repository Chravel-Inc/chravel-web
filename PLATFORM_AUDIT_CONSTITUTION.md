# CHRAVEL PLATFORM CONSTITUTION
> **Date:** 2026-05-29
> **Scope:** Full-platform scalability, concurrency, integrity, permissions, reliability, and scale-tier audit
> **Method:** Repo-grounded synthesis of schema, edge functions, client hooks/services, and 9 parallel audit agents

---

## 1. Executive Summary

Chravel is **salvageable with staged hardening**, but it is **not yet operating under one enforceable platform model**. The codebase already contains strong local fixes: RLS is broadly enabled, trip creation is server-mediated, Stream-based trip chat has reconnect backfill, several shared objects have versioned RPCs, and multiple scale/readiness constitutions already exist in the repo. The problem is that those rules are **not yet universal**.

The biggest platform-wide structural risks are:

1. **Permission fragmentation across four authorities**  
   Trip access and write permissions are currently split across `trip_members.role`, `trip_admins`, `user_trip_roles`/`trip_roles.feature_permissions`, and client-side `permissionMatrix.generated.ts`. That makes read-only mode, event attendee restrictions, pro viewer mode, and moderation rules inconsistent across surfaces.

2. **Mixed mutation models with no single platform contract**  
   Some shared objects use optimistic concurrency and versioned RPCs (`trip_events`, `trip_tasks`, `trip_polls`, basecamp). Others still use direct `.update()`/`.insert()` or offline replay paths that bypass those protections. Payment creation, link vote counting, some AI promotions, and several media flows are still partially luck-based under retry or concurrency.

3. **Hybrid realtime architecture with incomplete consolidation**  
   Main trip chat is now Stream-backed and relatively resilient; the rest of the product still fans out through many independent Supabase realtime subscriptions. There is no single trip-scoped realtime coordinator, reconnect behavior is inconsistent, and hot trip/event fanout is not capacity-governed.

4. **Invite/share/join truth drift**  
   Membership creation is now approval-gated, which is directionally correct, but invite preview, join request, approval, rejoin, and invite-use accounting are not fully coherent. Current code can mis-handle `status='left'`, double-count invite uses, and route users through stale or ambiguous preview/join states.

5. **AI cross-surface mutation safety is still inconsistent**  
   The registry, router, capability tokens, and idempotency store are good foundations, but the text path, bridge path, and agent path do not all obey the same confirmation, idempotency, or permission contract. Some AI writes fast-path into shared state, some create pending rows that cannot be confirmed, and destructive tools are effectively deadlocked.

6. **Free vs paid traffic shaping is mostly quota-based, not QoS-based**  
   There are some plan-aware quotas for AI/import/OCR, but almost no tier-aware request shaping, queue priority, hot-trip isolation, or reserved capacity for paid/event-critical flows. Free traffic can still contend with premium operational use on the same shared control plane.

Where the platform is relatively coherent today:

- **Core auth/session lifecycle** in `src/hooks/useAuth.tsx` is thoughtful and defensive, with session refresh, auth hydration, demo-mode separation, and some duplicate-account detection.
- **Trip creation** in `supabase/functions/create-trip/index.ts` is one of the cleaner server-side policy surfaces: trip type defaults, entitlement checks, and event/pro defaults are set on the server.
- **Main trip chat** in `src/hooks/stream/useStreamTripChat.ts` is one of the strongest runtime implementations in the repo: reconnect backfill, cursor-based recovery, membership recovery, and telemetry are all present.

Which surfaces are currently safest:

- Auth/session hydration and sign-in/out flows
- Basic trip creation and trip detail loading
- Main trip chat on the Stream-backed path
- Some shared-write flows that already use versioned RPCs: task toggles, calendar edits when the versioned path is used, poll voting

Which surfaces are most dangerous under scale or concurrency:

- AI Concierge writes across shared objects
- Invite/share/join/membership approval
- Pro/Event permissioning and read-only mode
- Media uploads, attachments, and gallery/file indexing
- Shared writes that still bypass the versioned/locked path
- Hot trip/event realtime fanout outside the main Stream chat path

Current likely limits, based on architecture rather than hope:

- **Friend-trip scale:** generally workable today for small groups and moderate write concurrency
- **Pro trip scale:** permission drift becomes visible as soon as viewer/editor/admin distinctions matter in real workflows
- **Event-scale trips:** hot events with large attendee populations are not yet safely supported as a platform default; the first breaks are likely notification fanout, realtime subscription sprawl, media upload contention, and moderation/read-only enforcement drift
- **AI scale:** cost exposure and duplicate-mutation risk become material well before classic infrastructure saturation

Bottom line:

- **100-1,000 active users:** achievable with immediate hardening
- **1,000-10,000:** achievable if permissioning, idempotency, realtime coordination, and kill-switch/QoS foundations are standardized now
- **10,000-100,000:** requires deliberate platform evolution, not more feature-local patches
- **100,000-1,000,000+:** some areas need deeper redesign, especially hot-event fanout, plan-aware traffic isolation, and cross-surface mutation orchestration

---

## 2. Full Platform System Map

### Major entities and ownership boundaries

**Identity / account root**
- `auth.users`
- `public.profiles`
- `public.user_roles`
- `public.user_entitlements`
- `public.notification_preferences`
- `public.user_preferences`
- Account lifecycle edges: `src/hooks/useAuth.tsx`, `src/components/consumer/ConsumerGeneralSettings.tsx`, account-deletion RPCs in `supabase/migrations/20260110000000_account_deletion_rpc.sql`, `supabase/functions/process-account-deletions/index.ts`, `supabase/functions/export-user-data/index.ts`

**Primary collaboration boundary: `trips`**
- Table: `public.trips`
- Trip type discriminator: `trips.trip_type`
- Current topologies:
  - `consumer`
  - `pro`
  - `event`
- Server defaults applied in `supabase/functions/create-trip/index.ts`
- Frontend route shells in `src/App.tsx`:
  - `/trip/:tripId`
  - `/tour/pro/:proTripId`
  - `/event/:eventId`
  - `/trip/:tripId/preview`
  - `/t/:tripId`

**Membership / role / admin model**
- `public.trip_members`
- `public.trip_admins`
- `public.trip_join_requests`
- `public.trip_invites`
- `public.trip_membership_audit_events`
- `public.trip_roles`
- `public.user_trip_roles`
- `public.channel_role_access`
- Related files:
  - `src/hooks/useRolePermissions.ts`
  - `src/hooks/useEventPermissions.ts`
  - `src/hooks/useMutationPermissions.ts`
  - `src/lib/permissionGuard.ts`
  - `src/lib/joinRequestMutations.ts`
  - `src/pages/JoinTrip.tsx`
  - `src/pages/TripPreview.tsx`
  - `supabase/functions/join-trip/index.ts`
  - `supabase/migrations/20260524093000_trip_membership_state_machine.sql`
  - `supabase/migrations/20260414000000_consolidate_channel_members.sql`

**Trip-shared object families**
- Calendar / itinerary:
  - `public.trip_events`
  - `public.calendar_event_mappings`
  - `public.calendar_sync_events`
  - Hooks/services: `src/features/calendar/hooks/useCalendarEvents.ts`, `src/services/calendarService.ts`, `src/services/calendarSyncService.ts`
- Tasks / work tracking:
  - `public.trip_tasks`
  - `public.task_status`
  - `public.task_assignments`
  - Hooks/services: `src/hooks/useTripTasks.ts`, `src/services/globalSyncProcessor.ts`
- Polls:
  - `public.trip_polls`
  - Hooks/services: `src/hooks/useTripPolls.ts`
- Places / links / basecamp:
  - `public.trip_places`
  - `public.trip_links`
  - `public.trip_base_camps`
  - `public.trip_personal_basecamps`
  - Services/hooks: `src/services/tripPlacesService.ts`, `src/hooks/useSaveToTripPlaces.ts`, `src/hooks/useTripBasecamp.ts`
- Payments:
  - `public.trip_payment_messages`
  - `public.payment_splits`
  - `public.payment_audit_log`
  - Services/hooks: `src/services/paymentService.ts`, `src/services/paymentBalanceService.ts`, `src/components/payments/PaymentsTab.tsx`
- Notifications:
  - `public.notifications`
  - `public.notification_deliveries`
  - `public.notification_logs`
  - Hooks/services: `src/hooks/useNotificationRealtime.ts`, `supabase/functions/dispatch-notification-deliveries/index.ts`

**Trip-shared chat / channel model**
- Legacy DB chat tables:
  - `public.trip_chat_messages`
  - `public.channel_messages`
  - `public.message_read_receipts`
  - `public.message_reactions`
- Channel tables:
  - `public.trip_channels`
  - `public.channel_members`
  - `public.channel_role_access`
- Stream-based chat services:
  - `src/hooks/stream/useStreamTripChat.ts`
  - `src/hooks/stream/useStreamProChannel.ts`
  - `src/services/stream/streamChannelFactory.ts`
  - `src/services/stream/streamMembershipSync.ts`
  - `supabase/functions/stream-join-channel/index.ts`
  - `supabase/functions/stream-ensure-membership/index.ts`
  - `supabase/functions/stream-reconcile-membership/index.ts`
  - `supabase/functions/stream-canary-guard/index.ts`

**Event-specific extensions**
- `public.event_rsvps`
- `public.event_agenda_items`
- `public.event_lineup_members`
- `public.event_tasks`
- Related files:
  - `src/components/events/EventDetailContent.tsx`
  - `src/components/events/LineupTab.tsx`
  - `src/components/events/AgendaModal.tsx`
  - `src/hooks/useEventAdmin.ts`
  - `src/hooks/useEventPermissions.ts`

**Media / storage / artifacts**
- Index tables:
  - `public.trip_media_index`
  - `public.trip_files`
  - `public.trip_artifacts`
- Buckets / storage paths:
  - `trip-media`
  - `trip-files`
  - `trip-covers`
- Related files:
  - `src/services/uploadService.ts`
  - `src/services/mediaService.ts`
  - `src/features/chat/hooks/useShareAsset.ts`
  - `src/hooks/useResolvedTripMediaUrl.ts`
  - `src/components/media/MediaTile.tsx`
  - `src/components/mobile/MobileUnifiedMediaHub.tsx`
  - `supabase/functions/file-upload/index.ts`
  - `supabase/functions/image-upload/index.ts`

**AI mutation and tooling plane**
- Shared registry and secure router:
  - `supabase/functions/_shared/concierge/toolRegistry.ts`
  - `supabase/functions/_shared/toolRouter.ts`
  - `supabase/functions/_shared/functionExecutor.ts`
  - `supabase/functions/_shared/security/capabilityTokens.ts`
  - `supabase/functions/_shared/concierge/tripAccess.ts`
- Edges:
  - `supabase/functions/lovable-concierge/index.ts`
  - `supabase/functions/execute-concierge-tool/index.ts`
- Pending-action buffer:
  - `public.trip_pending_actions`
  - `src/hooks/usePendingActions.ts`
- AI usage / idempotency:
  - `public.concierge_usage`
  - `public.concierge_tool_idempotency`

### Trust boundaries

**Zero-trust client**
- React / Vite / Capacitor shell in `src/`
- Client hooks and UX permissions are advisory only
- Client may propose mutations, never define authority

**Edge-function trust boundary**
- Supabase edge functions mediate:
  - trip creation
  - join flow
  - concierge execution
  - notifications
  - payments/billing
  - import/export
- This is where rate limits, capability tokens, service-role reads, and kill switches must live

**Database trust boundary**
- Postgres + RLS + RPCs are the final authority for:
  - membership
  - permissions
  - uniqueness
  - optimistic/pessimistic locking
  - audit tables

### Shared-state boundaries

**Trip-shared state**
- Most collaboration data is trip-scoped
- Canonical owner is the trip container, not the viewer shell
- Must not depend on whether the user reached the row through `/trip`, `/tour/pro`, or `/event`

**Channel-shared state**
- Channels are subordinate to a trip
- Visibility is inherited from trip membership, then narrowed by role/channel access
- Channel state must never become the source of truth for trip membership

**User-private state**
- Account data
- notification preferences
- personal basecamps
- some artifacts and imported material
- AI scratch/private planning state should live here, not in trip-shared tables

**Invite/share access paths**
- Current public access surfaces:
  - `get-invite-preview`
  - `get-trip-preview`
  - `generate-invite-preview`
  - `generate-trip-preview`
  - `share-preview`
- These must be treated as a separate trust boundary from trip membership

### Realtime boundaries

**Stream**
- Primary for main trip chat, pro channels, and some broadcast/chat delivery
- Best implemented in `src/hooks/stream/useStreamTripChat.ts`

**Supabase Realtime**
- Used across tasks, polls, calendar, payments, media, notifications, and membership state
- Currently fragmented into many hook-local channels rather than a trip-scoped coordinator

### AI mutation boundaries

- AI may read trip context and artifacts
- AI may propose trip-shared writes
- AI must not become a privileged actor that bypasses the human/member permission model
- AI writes must be attributable, idempotent, replay-safe, and permission-checked through the same server contract as manual writes

### Likely bottlenecks

1. **Permission resolution drift** across multiple client hooks and RLS/RPC helpers
2. **Supabase realtime channel sprawl** for hot trips/events
3. **Notification fanout** without priority lanes
4. **Invite/share/join request bursts** because the funnel is metadata-heavy and approval-based
5. **AI and voice cost spikes** because plan-aware quotas exist without coherent traffic shaping
6. **Media upload and signed URL N+1 behavior** on busy galleries

---

## 3. Platform Invariants

These are the non-negotiable rules all future features must obey.

1. **Trip membership is the only root of collaboration authority.**  
   No feature may infer trip access from route shape, invite preview, or org membership alone. Access resolves from active membership plus explicit public-preview rules.

2. **A trip’s topology is defined by `trips.trip_type`, not by UI shell.**  
   `consumer`, `pro`, and `event` are operational topologies, not branding variants. Route, permissions, chat mode, moderation, and default fanout must derive from the row, not the page.

3. **All shared mutations require server-side authorization at the action level.**  
   Client-side booleans from `useMutationPermissions`, `useRolePermissions`, `useEventPermissions`, or `permissionMatrix.generated.ts` are UX only.

4. **Every mutation must carry actor attribution from the authenticated session.**  
   No client-provided `user_id`, `creator_id`, `resolved_by`, `uploaded_by`, or `added_by` may be trusted without server verification.

5. **Every create-like mutation must be idempotent.**  
   Tasks, events, polls, expenses, pending actions, notifications, uploads, and AI tool executions must require an `idempotency_key` or equivalent dedupe contract that the database enforces.

6. **Every collaborative update must use explicit concurrency semantics.**  
   Allowed models are:
   - compare-and-swap with `version`
   - row-locked RPC / transaction
   - append-only immutable event
   - explicit eventual-consistency/LWW for ephemeral state only

7. **Last-write-wins is forbidden for shared durable objects unless explicitly justified.**  
   It is allowed only for ephemeral UI state, presence, typing, cache hints, and non-authoritative client markers.

8. **Invite preview and share preview are not authorization.**  
   Preview surfaces may render limited metadata, but they do not prove membership, admission, or edit rights.

9. **Membership transition truth is singular.**  
   Join request creation, approval, reactivation, removal, and account deletion cleanup must all converge on one authoritative membership state machine and audit trail.

10. **Approval-side effects are atomic.**  
   Approving a join request must create or reactivate membership, increment invite usage exactly once, emit audit events once, and notify once.

11. **Realtime recovery is mandatory.**  
   Any long-lived subscription must define reconnect/backfill behavior. No subscription may rely on “continuous socket uptime” as a correctness property.

12. **Offline replay must preserve correctness before convenience.**  
   Queue order, idempotency, and version safety outrank throughput. Independent domains may be parallelized; dependent writes may not.

13. **Shared vs private state must be explicit in schema and UI.**  
   Private user planning data, private AI scratch data, trip-shared state, channel-shared state, and admin-only data must not share tables or hooks without an explicit scope contract.

14. **Every dangerous feature must have a runtime kill switch.**  
   AI, voice, payments, realtime migrations, imports, and notification fanout may not depend only on build-time env flags.

15. **Free traffic must never be allowed to starve paid or event-critical flows.**  
   The platform must prefer protected capacity, queue priority, and rate partitioning over best-effort fairness.

16. **Every critical platform rule must exist in both documentation and executable enforcement.**  
   If a constitution rule is not reflected in RLS, RPCs, edge guards, CI, or tests, it is not real yet.

---

## 4. Object Scope Constitution

| Object class | Examples | Owner | Viewers | Editors | Mutation rules | Concurrency rules | Audit requirements | Delete/archive rules |
|---|---|---|---|---|---|---|---|---|
| **User-private** | `profiles`, `user_preferences`, `notification_preferences`, `user_entitlements`, private artifacts | User | The user, service-role jobs with explicit reason | User or privileged backend path | Never writable by trip peers; cannot be mutated through trip-scoped tools without explicit user intent | Mostly single-writer; LWW acceptable for profile cosmetics, not for entitlements | Actor + field-level audit for entitlements, deletion/export actions | Hard delete or compliance-specific erase/export contract |
| **User-private within trip** | `trip_personal_basecamps`, private artifacts, private AI scratch data | User within a trip | User; optionally admins for compliance only | User | Must not leak into trip-shared queries by default | Compare-and-swap if collaborative UI can touch it; otherwise single-writer | Actor, trip_id, scope, source_type | Hard delete on user request or account deletion; never treated as trip-shared |
| **Trip-shared durable** | `trip_events`, `trip_tasks`, `trip_polls`, `trip_links`, `trip_places`, shared expenses | Trip | Active trip members, filtered by trip type and feature visibility | Capability-based per trip type and role | All writes route through server authorization + idempotent create path | Compare-and-swap for updates; unique constraints for dedupe; locked RPCs for transactional updates | Actor, trip_id, object_id, source_type, mutation_id | Archive only where product explicitly supports archive; otherwise hard delete with audit trail |
| **Trip-shared restricted** | `trip_invites`, `trip_join_requests`, `trip_admins`, admin-only financial or moderation surfaces | Trip admins / organizers | Authorized operators only | Admin/organizer/owner only | No client-only enforcement; every mutation server-gated | Locked/transactional for admission and privilege changes | Mandatory audit row per action | Hard delete only when safe; otherwise immutable audit of removal |
| **Channel-scoped shared** | `trip_channels`, `channel_members`, channel messages, channel attachments | Parent trip + channel | Trip members with explicit channel access | Channel members; moderation by moderators/admins | Channel access derived from trip membership plus role/channel grants | Immutable append for messages; compare-and-swap for channel settings; locked membership changes when derived from roles | Actor, trip_id, channel_id, source | Deleting a channel archives it first; message deletions are moderated actions with audit |
| **Event-wide shared** | event agenda, lineup, RSVP, announcement channels, event tasks | Event trip | Depends on event mode (`attendee`, `read-only`, announcement-only) | Organizers/moderators by default; attendees only where explicitly allowed | Event-mode defaults are stricter than consumer/pro by default | Agenda/lineup/settings use compare-and-swap or locked RPCs; announcement fanout must be idempotent | Actor, event/trip_id, role at time of change | Archive with event; destructive deletes require organizer role |
| **Admin-only operational** | security logs, audit logs, deliverability queues, incident/degradation tables | Platform / service | Internal operators only | Service-role or explicitly privileged admins | Never client writable | Transactional updates; append-only where possible | Mandatory | Retention policy by ops/compliance |
| **Ephemeral** | presence, typing, draft composer state, transient unread hints | Session/device | Relevant live participants | Session/device | Never treated as source of truth | LWW/eventual consistency allowed; TTL required | Minimal telemetry only | Auto-expire; not restored from backups |
| **Durable media/storage** | `trip_media_index`, `trip_files`, `trip_artifacts`, storage objects | Trip or user-within-trip | Depends on scope + membership + signed URL resolution | Uploaders; moderators/admins per trip type | Canonical upload API only; path + metadata stored, not public URL as truth | Idempotent upload registration + compensating rollback on index failure | Actor, trip_id, upload_path, checksum/idempotency_key | Delete storage + index together; orphan sweeper required |

Additional governing rules:

- `event` tables are **extensions of the trip container**, not a separate tenancy root.
- `organization` is a billing/administration boundary, not an implicit data-access boundary.
- Every new table must declare its scope class and authoritative parent foreign key in its migration comments.

---

## 5. Permission Model Constitution

### Canonical effective roles

Chravel needs one **effective capability model** even if storage remains split across several tables.

Recommended effective roles by trip type:

| Trip type | Effective roles | Default behavior |
|---|---|---|
| `consumer` | `consumer_host`, `consumer_member` | Members can collaborate broadly; hosts/admins moderate |
| `pro` | `pro_admin`, `pro_editor`, `pro_viewer` | Viewer mode **must become** real and server-enforced |
| `event` | `event_organizer`, `event_moderator`, `event_attendee` | Read-only by default, relaxed only where intentionally enabled |

### Canonical role semantics

**`consumer_host`**
- Owner/creator/admin of a friend trip
- Can invite, approve, moderate, archive, change trip settings, manage broadcasts

**`consumer_member`**
- Full collaboration on most shared objects
- Cannot transfer ownership, change roles, or alter high-impact trip settings without host confirmation

**`pro_admin`**
- Can manage settings, invites, channels, moderation, lineup/agenda policy, basecamp, and privileged shared resources

**`pro_editor`**
- Can create/edit shared work objects explicitly granted by the trip’s permission matrix
- Cannot change trip governance, invites, or role mappings

**`pro_viewer`**
- Read-only by default
- May be allowed low-risk participation only where explicitly granted (for example reactions or RSVP-like actions), never by omission

**`event_organizer`**
- Event owner / lead operator
- Controls agenda, lineup, announcements, invite policy, moderation, and posting mode

**`event_moderator`**
- Can moderate chat, approve attendee writes where allowed, and manage certain operational channels
- Does not implicitly gain billing or full trip-admin rights

**`event_attendee`**
- Read-only or bounded-participation by default
- Can only post/upload/vote if the event mode explicitly enables it

### Read-only vs full-participation mode

Read-only mode must be a **server-enforced trip/event state**, not a UI convention.

Allowed platform-wide modes:

1. **Full collaboration**
2. **Announcements + bounded replies**
3. **Announcements only**
4. **Read-only operational freeze**

These modes must affect:

- main chat posting
- channel posting
- media upload
- task/poll/calendar creation
- join approval and invite issuance if the trip is operationally frozen

### Channel model constitution

- Channels are **trip-local**, never cross-trip
- Default channels are **admin-defined**, not user-proliferated by default
- Channel membership inherits from trip membership, then narrows by `channel_role_access` or explicit member inclusion
- Channel posting permissions are independent from channel visibility
- Announcement channels must be first-class, not improvised with client-side UI rules
- For event trips, attendee-created channels should be off by default

### Who can mutate what

| Surface | Consumer | Pro | Event |
|---|---|---|---|
| Main chat | Members, subject to trip mode | Based on effective role + trip/channel mode | Based on event mode; default stricter than consumer |
| Tasks | Members | Editors/Admins; viewers **must be** blocked server-side | Organizers/Moderators unless event explicitly opens attendee tasks |
| Polls | Members may create and vote | Editors/Admins create; viewers **must be** blocked; participation optional | Organizers create; attendee voting optional |
| Calendar | Members may create/edit | Editors/Admins; not viewers | Organizers/Moderators by default |
| Basecamp / trip metadata | Host/admin | Admin only | Organizer only |
| Invites / share issuance | Host/admin | Admin only | Organizer only |
| Channel creation / role mapping | N/A or host-only | Admin only | Organizer only |
| Media upload | Members by default | By role and upload mode | Default admin-only or bounded by event mode |

### Explicit confirmation requirements

Must require explicit confirmation:

- destructive AI actions
- bulk deletes
- trip metadata changes
- expense settlement / financial closure
- invite revoke / approval / role transfer
- account deletion

Can auto-apply if authorized and idempotent:

- chat send
- reaction toggle
- read receipt
- low-risk personal preference changes
- additive shared creates where the object family explicitly allows it

### Server-side enforcement expectations

Every shared mutation must resolve through one server capability function, e.g.:

`authorize_trip_action(user_id, trip_id, resource, action, context_json)`

That authority must be consumed by:

- RLS
- SECURITY DEFINER RPCs
- edge functions
- AI tool execution paths

If the capability function disagrees with the client permission matrix, the client is wrong.

---

## 6. Concurrency + Mutation Constitution

### Universal mutation rules

1. **Every mutation gets a durable mutation identifier**
   - `mutation_id` for audit/telemetry correlation
   - `idempotency_key` for replay safety on create-like or side-effecting operations

2. **Retries must be safe by design**
   - network retry, background replay, webhook retry, AI/tool retry, and double-clicks must not duplicate effects

3. **Concurrency model must be declared per object family**
   - immutable append
   - compare-and-swap with `version`
   - row-locked transaction
   - eventual-consistent ephemeral state

4. **Actor attribution is stored with the final write**
   - not just in the client event stream

5. **Every shared mutation produces an audit event or activity event**
   - unless the object family is explicitly low-risk and append-only

### Required mutation classes by object family

| Object family | Required mutation model | Notes |
|---|---|---|
| Membership, invite acceptance, role changes, notification claim, payments, quota counters | **Row-locked transactional RPC** | `FOR UPDATE`, uniqueness, exact-once side effects |
| Tasks, calendar events, agenda, lineup, trip settings, channel settings, shared metadata | **Compare-and-swap** | `version` column or equivalent |
| Chat messages, notifications, uploads, join requests, activity log rows | **Immutable append + idempotency** | Never edit in place unless moderation/admin path |
| Link saves, media registration, artifacts | **Idempotent create + uniqueness constraint** | Normalize keys / checksum / path uniqueness |
| Presence, typing, ephemeral drafts | **Eventually consistent / TTL** | Non-authoritative |

### Explicit rules

**Idempotency keys**
- Mandatory on:
  - `createTask`
  - `addToCalendar`
  - `createPoll`
  - `addExpense`
  - invite issuance / acceptance side effects
  - AI tool executions
  - upload registration
  - webhook processing
- Unique index scope must match blast radius:
  - typically `(trip_id, idempotency_key)` or `(user_id, idempotency_key)`

**Version checks**
- Mandatory on:
  - `trip_events`
  - `trip_tasks`
  - `trips` shared settings
  - basecamp / trip header / moderation settings
  - agenda/lineup/ordering surfaces
  - channel configuration

**Last-write-wins may be used only for**
- presence
- typing
- cached unread hints
- local draft state
- explicitly non-authoritative client telemetry state

**Merge / reject / serialize policy**

| Family | Policy |
|---|---|
| Shared text/chat messages | Append-only; dedupe by message idempotency key or provider message id |
| Shared task/event edits | Reject stale write; refetch; require user retry |
| Financial changes | Serialize in RPC; do not expose LWW |
| Bulk deletes | Preview then transactional commit |
| AI-written shared objects | Same rules as manual writes; AI does not get weaker rules |

**AI-triggered vs user-triggered handling**
- AI may not bypass confirmation or capability checks
- AI tool surfaces must use the same mutation RPCs/manual paths as users
- AI confirmation state must not create a second mutation path with weaker locking or different audit behavior

**Offline replay**
- Process independent domains separately
- Serialize dependent ops within a domain
- Queue op ID doubles as idempotency key when possible
- Never replay stale direct `.update()` onto a versioned table

---

## 7. Access Funnel Constitution

### Authoritative truth model

**Share preview**
- Share links and trip previews only grant limited metadata visibility
- They do not create or imply membership

**Invite**
- `trip_invites` is the only authority for admission tokens
- Invite status = active + not expired + within uses + not revoked

**Join request**
- `trip_join_requests` is the only authority for pending admission intent
- Duplicate join attempts must collapse onto one active request

**Membership**
- `trip_members` is the only authority for admitted collaboration access
- Approval must create or reactivate the membership row in the same transactional path

### Funnel rules

1. **Trip UUID previews must not leak reusable admission secrets to non-members.**  
   Non-members may see limited marketing/summary metadata. They must not receive raw reusable invite codes or privileged trip structure. If the preview needs to carry join context, it should use an opaque server-issued join capability that resolves into the canonical approval flow.

2. **Account creation during invite acceptance must preserve invite context through a single, canonical server- or storage-backed mechanism.**  
   Today’s `localStorage`/`sessionStorage` split is unacceptable.

3. **Approval flow is mandatory and consistent.**  
   If Chravel is approval-gated, every code path behaves that way; no hidden direct-join bypasses may remain.

4. **Duplicate joins are idempotent.**  
   Repeated join attempts for the same user and trip must return the same pending/member outcome without duplicating counters, notifications, or rows.

5. **Rejoin after leave is a first-class state transition.**  
   Approval must reactivate `status='left'`/inactive members instead of no-op conflict insertion.

6. **Invite usage is counted exactly once.**  
   Count at approval or at request creation, not both.

7. **Expired, inactive, max-use, and revoked invites fail closed with a typed reason.**

8. **Wrong-object routing is forbidden.**  
   Share links, invite links, and trip previews must resolve to the correct trip/event/pro shell through one canonical path resolver.

9. **Mass invite / mass join spikes must degrade safely.**  
   During spikes, admission requests may queue, but membership truth and notification dedupe must remain correct.

10. **Invite issuance is reusable and bounded.**  
   Opening the invite modal must not create endless active links; the platform reuses or rotates active invites intentionally.

---

## 8. Realtime + Sync Constitution

### Transport rules

1. **Chat delivery uses one transport per surface.**
   - Main trip chat: Stream
   - Pro channels: Stream
   - Broadcast delivery: choose one primary delivery plane and make the other metadata-only

2. **Non-chat trip data uses a trip-scoped realtime coordinator, not per-hook channel sprawl.**
   - tasks
   - polls
   - calendar
   - payments
   - members
   - media
   - join requests

3. **No unfiltered realtime subscriptions on shared tables except explicitly audited admin feeds.**

### Reconnect/backfill rules

Every long-lived subscription must implement:

1. server-side filter (`trip_id`, `user_id`, or `channel_id`)
2. last-seen cursor (`updated_at`, `created_at`, message id, sequence)
3. reconnect detection
4. backfill fetch on reconnect and foreground
5. deterministic dedupe on merge

`src/hooks/stream/useStreamTripChat.ts` is the current gold standard that other realtime surfaces should match.

### Activity feed / unread rules

- Chat unread derives from Stream read state or one canonical backend count, not mixed heuristics
- Notification unread derives from DB count + realtime delta, not optimistic-only state
- Activity feed is eventually consistent but monotonic: items may arrive late, not disappear/reappear arbitrarily

### Background / foreground rules

- On app foreground, trigger:
  - chat backfill
  - notification refresh
  - trip list refresh
  - offline queue flush if online
- Eventual consistency is acceptable for low-priority surfaces, but the policy must be explicit per surface

### Multi-device consistency

- Shared objects must converge via versioned or immutable server state
- Client mutation optimism must never be the durable source of truth
- If two devices act on the same shared object, the loser refetches and surfaces a conflict instead of silently winning

### Hot room / hot event behavior

Safe defaults for event-scale trips:

- announcement mode by default
- attendee posting opt-in, not assumed
- typing indicators off above moderate room size
- presence off or heavily sampled above moderate room size
- media upload mode defaults stricter than consumer trips
- background notifications prioritized over in-room ephemeral presence

### What needs realtime vs eventual consistency

**Realtime required**
- main chat
- direct join-request notifications to operators
- unread badges
- active moderation actions

**Eventual consistency acceptable**
- media galleries
- saved links/places
- some task/poll/calendar list refreshes
- exports and derived summaries

---

## 9. Scale-Tier Architecture Plan

### Stage A: 100–1,000 active users

**Primary bottlenecks**
- permission drift between UI and RLS
- invite/share/join inconsistencies
- duplicate upload paths
- uncoordinated realtime subscriptions

**Required infra changes**
- none beyond current single-project stack, but runtime kill switches must become real

**Required data integrity changes**
- unify membership transition truth
- eliminate direct-update bypasses on versioned tables
- enforce idempotency keys on all create-like shared writes

**Required rate limiting / QoS changes**
- edge rate limits on all public/authenticated edges
- voice caps
- AI global per-user caps in addition to per-trip caps

**Required observability**
- deploy markers
- journey SLIs for auth, trip open, join, chat send, AI response

**Surfaces that become risky first**
- invite/join
- AI writes
- media uploads
- pro/event permission surfaces

**Architecture choices acceptable now but will fail later**
- single shared notification queue without priority
- client-driven permission matrices
- per-hook realtime channels

### Stage B: 1,000–10,000

**Primary bottlenecks**
- hot-trip fanout
- notification backlog
- Supabase realtime subscription count
- service-role edge paths without coherent feature gates

**Required infra changes**
- shared trip realtime hub
- queue priority for notifications/deliveries
- caching layer for entitlements/rate counters if DB pressure rises

**Required data integrity changes**
- canonical capability resolver used by RLS, RPC, edge, and AI
- unified upload pipeline
- sequential offline replay per domain/trip

**Required rate limiting / QoS changes**
- plan-tiered RPM and queue priority
- per-trip/event burst protection
- broadcast and join surge controls

**Required observability**
- backlog age dashboards
- reconnect/error-rate dashboards
- AI cost telemetry by plan and trip

**Surfaces that become risky first**
- hot chat/broadcasts
- notifications
- event announcement fanout
- payment settlement concurrency

**Architecture choices acceptable now but will fail later**
- using env flags instead of runtime flags
- public preview edges returning broad trip metadata
- duplicate chat/media index models

### Stage C: 10,000–100,000

**Primary bottlenecks**
- event-scale fanout
- media signing and storage egress
- per-trip moderation
- AI/tool orchestration cost

**Required infra changes**
- queue/worker tiering
- stronger CDN/signed URL batching
- hot-trip/event operational modes
- possibly separate search/index workers from request path

**Required data integrity changes**
- complete removal of legacy duplicate mutation paths
- event-specific moderation and read-only modes as first-class server states
- formal activity/audit stream per shared mutation family

**Required rate limiting / QoS changes**
- reserved capacity for paid/event hosts
- trip/event burst budgets
- per-tool external API budgets

**Required observability**
- hot-event dashboards
- channel-level and trip-level saturation metrics
- synthetic event-day drills

**Surfaces that become risky first**
- event trips
- media-heavy channels
- notifications during live events
- AI under bursty collaborative use

**Architecture choices acceptable now but will fail later**
- no trip-level isolation boundaries
- per-tile signed URL generation
- permission resolution by multiple tables without compiled capability outputs

### Stage D: 100,000–1,000,000+

**Primary bottlenecks**
- control-plane concentration in one shared Supabase project
- regional fanout and egress
- plan-aware fairness on shared infra

**Required infra changes**
- regionalization strategy for hot traffic
- stronger queue partitioning / dedicated workers
- explicit service decomposition for high-cost AI, search, and fanout paths
- potentially trip/event partitioning for the hottest cohorts

**Required data integrity changes**
- formally versioned platform contracts for all mutation families
- immutable event/log streams for critical shared objects
- hard separation between control plane, data plane, and analytics plane

**Required rate limiting / QoS changes**
- per-tenant/event admission control
- reserved capacity pools
- automatic degradation policies

**Required observability**
- multi-region drills
- automated rollback or containment gates
- validated DR/restore cadence with objective acceptance checks

**Surfaces that become risky first**
- event-scale live collaboration
- cross-surface notification and media fanout
- AI/multimodal ingestion

**Architecture choices acceptable now but will fail later**
- single-region assumptions
- mixed authoritative data stores for chat/media/permissions
- no staging/prod separation for release validation

---

## 10. Free vs Paid QoS Constitution

### Core principle

Free usage may be generous, but it must never degrade premium, pro, enterprise, or event-host operational use.

### Required protections

**Per-plan request shaping**
- Free: lowest request budgets on AI, voice, imports, maps, and heavy uploads
- Paid: higher budgets plus lower queue delay for operational flows
- Enterprise/event-host: protected capacity for notifications, moderation, invites, and core trip operations

**Per-plan concurrency protections**
- Voice session creation must be tier-aware
- AI tool execution must be tier-aware
- Notification delivery priority must be tier-aware
- Hot event admins/organizers must retain control even when attendee traffic surges

**Queueing / degraded behavior**
- Under pressure:
  1. shed AI and non-critical enrichments first
  2. delay non-critical notifications
  3. reduce media throughput for free users
  4. preserve auth, trip open, join flow, admin moderation, and premium/event-core operations

**Feature-level rate limits**
- AI query and tool limits: global per user and per trip
- Voice sessions: per user and per day/hour
- Broadcast creation: per trip and per actor
- Invite generation and join attempts: per actor, per trip, and per IP
- Uploads: per plan storage and per-minute concurrency limits

**Resource isolation**
- Notification queues require priority class
- AI execution requires per-plan budget enforcement
- Heavy background jobs must not share unlimited concurrency with interactive tier-0 paths

**Abuse containment**
- Prevent Sybil-like multiplication of free AI capacity across many trips
- Prevent invite preview and join flow brute-force
- Prevent hot free trips from consuming operational lanes intended for paid or event-critical flows

---

## 11. Dangerous Surface Ranking

| Rank | Surface | Severity | Failure shape | Blast radius | Why it is risky | Governing rule |
|---|---|---|---|---|---|---|
| 1 | AI Concierge cross-surface mutations | **Critical** | duplicate writes, inconsistent confirmation, permission bypass by path drift | Trip-shared data corruption, cost amplification, trust loss | Three execution surfaces do not use one mutation contract | AI uses same capability, idempotency, and confirmation contract as manual writes |
| 2 | Invite/share/join/membership approval | **Critical** | approved-but-not-member, left-user rejoin failure, invite-use exhaustion, wrong preview/join routing | Admission boundary, trust, growth funnel | Multiple truth layers + status/reactivation drift | One authoritative admission pipeline with exact-once side effects |
| 3 | Pro/Event permission model | **High** | “viewer/read-only” is cosmetic; event attendee or pro viewer can still mutate some shared objects | Shared object integrity across pro/event trips | Permission sources are fragmented | One compiled server capability model |
| 4 | Payments / settlement / expense flows | **High** | double-create, double-settle, inconsistent splits | Financial correctness, trust, reconciliation | Some paths use locked RPCs; some still direct-update | Financial state only mutates in locked RPCs |
| 5 | Chat / channels / broadcasts under hot load | **High** | ReadChannel drift, reconnect gaps, duplicate/unbounded subscriptions, notification lag | Live event/pro coordination | Hybrid Stream + Supabase coordination incomplete | One transport per chat surface, trip-scoped subscription budget, reconnect/backfill everywhere |
| 6 | Shared writes: tasks, polls, calendar, basecamp | **High** | stale overwrites, offline replay corruption, assignment loss | Core collaboration data | Versioned path exists but is inconsistently used | All shared updates must use versioned or locked server paths |
| 7 | Media uploads / attachments / galleries | **High** | orphaned files, broken document links, quota drift, signed URL storms | Storage cost, UX trust, event performance | Multiple upload paths and incomplete index contracts | Canonical upload API + shared metadata contract |
| 8 | Notifications / fanout / queueing | **Medium-High** | stale unread state, backlog delay, free traffic starving paid/event flows | Broad user confusion during surges | FIFO queueing without priority; reconnect refresh gaps | Priority queues + reconnect cache invalidation |
| 9 | Auth/account lifecycle | **Medium** | duplicate account identity, session confusion, incomplete delete cleanup | User trust and compliance | Auth is relatively strong but account deletion and invite-linked signup are not fully end-to-end coherent | Account lifecycle uses one canonical delete/export/reassign policy |
| 10 | Account deletion / data export / storage cleanup | **Medium** | residual personal media/artifacts, incomplete cleanup | Compliance, trust | Storage path assumptions and mixed ownership | Account deletion must sweep DB + storage by authoritative ownership paths |

---

## 12. Recommended Immediate Platform Changes

These are the highest-leverage changes to make **now**, before deep feature-by-feature hardening.

1. **Consolidate permission enforcement into one compiled capability layer.**  
   Replace the current split across `trip_members.role`, `trip_admins`, `user_trip_roles`, and client matrices with one authoritative server capability resolver consumed by RLS, RPCs, edge functions, and AI tool routing.

2. **Standardize mutation/idempotency contracts across all shared object families.**  
   Require `idempotency_key` on all create-like shared writes and route all shared updates through versioned or locked RPCs, not direct `.update()`.

3. **Fix invite/share/join truth immediately.**  
   Repair rejoin/reactivation, invite use counting, preview leakage, and remove duplicate approval logic so membership transition truth becomes singular and auditable.

4. **Create a trip-scoped realtime coordinator.**  
   Replace per-hook Supabase channel sprawl with one trip realtime hub and extend reconnect/backfill rules beyond main trip chat.

5. **Unify media upload and attachment registration.**  
   One canonical upload service, one metadata contract, one delete/orphan policy, one quota path.

6. **Make runtime kill switches real on the server.**  
   `feature_flags` already exists; use it to gate AI, voice, payments, Stream migration, and heavy imports at edge entrypoints.

7. **Introduce plan-aware QoS, not just quotas.**  
   Add rate partitioning, queue priority, and protected capacity for paid/event-critical operations.

8. **Repair AI mutation parity before adding more tools.**  
   Text, bridge, and agent paths must share the same mutation contract; currently they do not.

9. **Make auditability universal.**  
   Membership transitions, AI writes, privileged moderation actions, and financial mutations must all emit durable audit rows with actor, trip, object, mutation id, and source.

10. **Upgrade rollout safety from documentation to execution.**  
   Staging, post-deploy smoke, alerting, and load verification need to become actual release gates, not just constitutions.

### Recommended follow-up hardening prompt sequence

1. **Prompt 1:** Permission model unification (`trip_members` + `trip_admins` + `user_trip_roles` → one capability resolver)
2. **Prompt 2:** Invite/share/join membership-state hardening
3. **Prompt 3:** AI mutation path unification and confirmation/idempotency repair
4. **Prompt 4:** Realtime coordinator and reconnect/backfill standardization
5. **Prompt 5:** Media/storage pipeline unification and orphan cleanup
6. **Prompt 6:** Plan-aware rate limiting, priority queues, and runtime kill-switch wiring
7. **Prompt 7:** Observability/load/staging/rollback operationalization

### Paste-ready follow-up issue plans

#### Issue 1: Unify trip permissions into one server capability resolver
- **Why this matters:** Pro/event viewer and attendee modes are still partially client fiction. This is the largest integrity and trust-boundary gap in the platform.
- **Files likely involved:** `src/hooks/useMutationPermissions.ts`, `src/hooks/useRolePermissions.ts`, `src/hooks/useEventPermissions.ts`, `src/lib/permissionGuard.ts`, `src/types/permissionMatrix.generated.ts`, RLS/RPC helpers around `can_manage_trip_content`, `is_active_trip_member`, and channel access.
- **Current risk:** Users with nominally read-only roles can still mutate some shared objects; UI and server disagree about real permissions.
- **Recommended fix:** Introduce one capability function/resolver for `(user, trip, resource, action)` and make RLS, RPCs, edges, and the client consume generated outputs from that single source.
- **Acceptance criteria:** Viewer/attendee restrictions are enforced server-side; no mutation succeeds solely because the UI forgot to hide it; the client matrix matches server outcomes for representative consumer/pro/event cases.
- **Test plan:** Role matrix contract tests, RLS tests, and multi-surface permission tests for tasks, polls, calendar, media, channels, invites, and moderation.
- **Rollback plan:** Keep schema additive; fall back to previous policies behind a feature flag or view while validating parity.
- **Launch-blocking:** Yes.

#### Issue 2: Repair invite/share/join membership truth
- **Why this matters:** Invite previews, join requests, approvals, rejoin-after-leave, and invite-use counting currently drift. This breaks the admission boundary and user trust.
- **Files likely involved:** `src/pages/JoinTrip.tsx`, `src/pages/TripPreview.tsx`, `src/hooks/useInviteLink.ts`, `src/lib/joinRequestMutations.ts`, `supabase/functions/join-trip/index.ts`, approval RPC migrations, membership audit tables.
- **Current risk:** Approved users can still fail to rejoin; invite-use counters can exhaust early; preview and join context can disagree.
- **Recommended fix:** Make approval/reactivation the singular membership transition path, count invite use exactly once, and normalize pending-invite context storage.
- **Acceptance criteria:** Duplicate joins are idempotent, rejoin after leave works, preview never leaks reusable secrets, and approval emits one membership, one audit event, and one invite-use increment.
- **Test plan:** Join/rejoin E2E, duplicate join race tests, approval idempotency tests, preview vs join routing tests.
- **Rollback plan:** Ship additive schema and keep old approval path fenced until the new one is verified; forward-fix data counters if needed.
- **Launch-blocking:** Yes.

#### Issue 3: Unify AI mutation paths and confirmation semantics
- **Why this matters:** Text, bridge, and agent tool execution currently disagree about pending vs fast-path writes, idempotency, and confirm behavior.
- **Files likely involved:** `supabase/functions/lovable-concierge/index.ts`, `supabase/functions/execute-concierge-tool/index.ts`, `supabase/functions/_shared/functionExecutor.ts`, `supabase/functions/_shared/toolRouter.ts`, `supabase/functions/_shared/concierge/toolRegistry.ts`, `src/hooks/usePendingActions.ts`, `agent/`.
- **Current risk:** Duplicate writes, unconfirmable pending actions, destructive-tool deadlocks, and inconsistent permission enforcement for AI-generated mutations.
- **Recommended fix:** Collapse onto one execution path, declare one execution contract per tool (`direct`, `preview`, `pending_confirm`, `destructive_confirm`), and route every shared-state write through the same permissioned/idempotent server path.
- **Acceptance criteria:** All mutating tools have one execution contract, one confirm path, one idempotency story, and one permission gate across every AI surface.
- **Test plan:** Tool registry parity tests, pending-confirm coverage tests, duplicate execution tests, AI/manual concurrency tests.
- **Rollback plan:** Keep new path behind runtime flag; revert to read-only AI mode if mutation parity fails.
- **Launch-blocking:** Yes for AI writes; no for AI read-only features.

#### Issue 4: Create a real trip-scoped realtime coordinator
- **Why this matters:** Per-hook realtime subscriptions create hidden scale ceilings and inconsistent reconnect behavior.
- **Files likely involved:** `src/hooks/useNotificationRealtime.ts`, `src/hooks/useUserTripsRealtime.ts`, `src/hooks/useTripTasks.ts`, `src/hooks/useTripPolls.ts`, `src/hooks/stream/useStreamTripChat.ts`, `src/hooks/stream/useStreamProChannel.ts`, `src/services/offlineSyncService.ts`, any trip realtime hub module added.
- **Current risk:** Hot trips/events will hit subscription sprawl, stale caches on reconnect, and inconsistent cross-device state.
- **Recommended fix:** One trip-scoped realtime hub for non-chat tables plus mandatory reconnect/backfill policy for every long-lived live surface.
- **Acceptance criteria:** Non-chat trip data uses shared trip channels/coordinator; reconnect refresh is standardized; channel counts per active trip are bounded.
- **Test plan:** Reconnect/backfill tests, subscription-budget tests, multi-device consistency tests, hot-room simulations.
- **Rollback plan:** Keep old per-hook subscriptions behind a temporary fallback toggle during rollout.
- **Launch-blocking:** Yes for event-scale modes.

#### Issue 5: Unify media upload, indexing, and cleanup
- **Why this matters:** Media currently uses multiple upload paths with different metadata, quotas, and rollback behavior.
- **Files likely involved:** `src/services/uploadService.ts`, `src/services/mediaService.ts`, `src/features/chat/hooks/useShareAsset.ts`, `src/components/media/*`, `src/components/mobile/MobileUnifiedMediaHub.tsx`, media/storage edge functions and migrations.
- **Current risk:** Broken document links, orphaned storage objects, quota undercounting, and event-scale upload pain.
- **Recommended fix:** One canonical upload API that stores path-based metadata, performs compensating cleanup on index failure, and applies the same quota/auth rules everywhere.
- **Acceptance criteria:** Chat uploads, gallery uploads, event uploads, and file attachments land in one consistent metadata model and delete cleanly.
- **Test plan:** Upload/delete round-trip tests for every media class, orphan cleanup tests, signed URL load tests.
- **Rollback plan:** Keep old upload entrypoints callable behind a temporary feature flag while the canonical path is verified.
- **Launch-blocking:** Yes for media-heavy events and production file attachments.

#### Issue 6: Add plan-aware QoS and queue priority
- **Why this matters:** Current limits are mostly quota-based; free traffic can still contend with paid/event-critical operations.
- **Files likely involved:** rate-limit helpers, AI/voice edges, notification queue claim logic, billing/entitlement policy files, runtime feature flags.
- **Current risk:** Premium/event operations can be degraded by free-tier burst traffic, especially during AI/voice or notification storms.
- **Recommended fix:** Tier-aware RPM limits, queue priority, protected capacity for organizers/admins, and runtime kill switches on expensive surfaces.
- **Acceptance criteria:** Paid/event-critical flows keep lower queue latency and better survivability under mixed-plan load.
- **Test plan:** QoS load tests with mixed free/paid cohorts, queue priority verification, voice/session cap tests.
- **Rollback plan:** Thresholds and priorities are config-driven; revert config before code if a tier policy misfires.
- **Launch-blocking:** Yes for scale beyond small-group usage.

#### Issue 7: Operationalize observability, staging, and rollback gates
- **Why this matters:** The repo has many constitutions and helpers, but too few are enforced as production gates.
- **Files likely involved:** CI workflows, `src/telemetry/*`, `src/services/errorTracking.ts`, `supabase/functions/_shared/featureFlags.ts`, staging/smoke/load scripts and docs.
- **Current risk:** Broken or under-observed changes can still reach production without a realistic staging or post-deploy health gate.
- **Recommended fix:** Add staging, runtime flag coverage checks, post-deploy smoke, priority dashboards/alerts, and load tests for hot-trip/event scenarios.
- **Acceptance criteria:** Production deploys have meaningful preflight, smoke, and rollback criteria; critical kill switches are live on both client and server paths.
- **Test plan:** CI/staging exercises, smoke scripts, alert route tests, synthetic load runs.
- **Rollback plan:** Use staged rollouts and feature flags first; revert deploys only after confirming flag-based containment is insufficient.
- **Launch-blocking:** Yes for pro/event reliability claims.

---

## 13. Exact Platform Changes

### Code areas to modify

**Permission / capability layer**
- `src/lib/permissionGuard.ts`
- `src/hooks/useMutationPermissions.ts`
- `src/hooks/useRolePermissions.ts`
- `src/hooks/useEventPermissions.ts`
- `src/types/permissionMatrix.generated.ts`
- any edge authorization helpers that explain permissions without enforcing them

**Invite / join / preview**
- `src/pages/JoinTrip.tsx`
- `src/pages/TripPreview.tsx`
- `src/hooks/useInviteLink.ts`
- `src/lib/joinRequestMutations.ts`
- `supabase/functions/join-trip/index.ts`
- remove or fence duplicate approval path in `supabase/functions/approve-join-request/index.ts`

**Realtime / sync**
- `src/hooks/stream/useStreamTripChat.ts`
- `src/hooks/stream/useStreamProChannel.ts`
- `src/hooks/useNotificationRealtime.ts`
- `src/hooks/useUserTripsRealtime.ts`
- `src/services/offlineSyncService.ts`
- `src/services/globalSyncProcessor.ts`
- shared trip realtime hub to replace the current per-hook subscription drift

**Media / storage**
- `src/services/uploadService.ts`
- `src/services/mediaService.ts`
- `src/features/chat/hooks/useShareAsset.ts`
- `src/hooks/useResolvedTripMediaUrl.ts`
- `src/components/media/*`
- `src/components/mobile/MobileUnifiedMediaHub.tsx`
- `supabase/functions/file-upload/index.ts`

**AI / mutation safety**
- `supabase/functions/lovable-concierge/index.ts`
- `supabase/functions/execute-concierge-tool/index.ts`
- `supabase/functions/_shared/functionExecutor.ts`
- `supabase/functions/_shared/toolRouter.ts`
- `supabase/functions/_shared/concierge/toolRegistry.ts`
- `src/hooks/usePendingActions.ts`
- agent tooling under `agent/`

**QoS / rollout / flags**
- `src/lib/featureFlags.ts`
- `supabase/functions/_shared/featureFlags.ts`
- edge functions for AI, voice, payments, imports, maps, notifications
- CI/workflow files implementing smoke/load/staging gates

### Schema / index / policy changes

1. **Membership**
   - Normalize active/inactive membership semantics and ensure every approval/reactivation path uses them
   - Update approval RPC to `ON CONFLICT DO UPDATE` for rejoin/reactivation
   - Add/expand audit logging on membership transitions

2. **Permissions**
   - Add or replace with a capability function/materialized resolver that maps `(user, trip, resource, action)` to allow/deny
   - Regenerate permission outputs from one source

3. **Mutations**
   - Add missing `idempotency_key` unique constraints for payment creation and other create-like shared writes still missing them
   - Extend `version` columns or equivalent optimistic concurrency to remaining shared settings surfaces

4. **Media**
   - Ensure `trip_media_index` stores authoritative uploader/path metadata
   - Backfill `uploaded_by` and `upload_path` consistently
   - Add storage-orphan reconciliation workflow

5. **Notifications / queues**
   - Add priority to `notification_deliveries`
   - Add queue-age and failure telemetry tables if not already present

6. **Feature flags**
   - Seed missing runtime flags used by code (for example canary keys actually referenced)

### Env / secret / infra changes

- Create or validate a real staging environment
- Ensure runtime feature flag lookups are available to the critical edge surfaces
- Add secrets/plan limits for voice and heavy AI features
- Add post-deploy smoke configuration and alert routing

### Service boundaries to introduce or clean up

1. **Capability service boundary**  
   One capability decision surface for trip actions

2. **Mutation service boundary**  
   One canonical mutation API per object family

3. **Realtime coordinator boundary**  
   One trip-scoped Supabase realtime hub for non-chat data

4. **Upload boundary**  
   One canonical upload/registration/delete pipeline

5. **AI execution boundary**  
   One shared secure execution path for text, bridge, and agent surfaces

### Migration order

1. Additive schema changes first
   - audit tables
   - idempotency keys
   - version columns
   - queue priority columns
   - capability outputs/tables

2. Server-side logic second
   - RPCs
   - edge functions
   - feature-flag gates
   - permission resolver usage

3. Client migrations third
   - switch hooks/services to new RPCs and coordinators
   - move upload paths
   - remove duplicate approval / upload / mutation paths

4. Backfill and cleanup last
   - rehydrate missing metadata
   - reconcile membership rows
   - delete dead paths and outdated docs/tests

### Deployment order

1. Database migrations
2. Edge functions / workers
3. Web client
4. Canary / staged validation
5. Full rollout

### Rollback plan

- Keep all early schema changes additive
- Release new server and client paths behind runtime feature flags where practical
- Roll back client/edge behavior first; use forward-fix migrations for data-path corrections
- Do not attempt destructive rollback of membership or financial migrations; use audited forward repair

---

## 14. Verification + Load Plan

### Contract tests

- Permission contract tests: capability resolver vs RLS vs client expectation
- Route/shell contract tests: same trip row resolves to the same effective surface regardless of entry route
- AI tool contract tests: registry → router → executor → confirm path parity

### Permission tests

- role-based create/update/delete across consumer/pro/event
- read-only mode enforcement
- channel posting restrictions
- admin-only operations
- private vs shared scope isolation

### Concurrency tests

- duplicate actions with identical `idempotency_key`
- retry after partial failure
- concurrent task/calendar edits with stale `version`
- AI + manual concurrent writes to same event/task
- same shared payment settled twice
- invite acceptance duplicates
- rejoin after leave / approve twice
- offline replay ordering within a trip/domain

### Realtime tests

- reconnect/backfill for:
  - trip chat
  - pro channels
  - broadcasts
  - notifications
  - calendar/tasks/polls if realtime-driven
- background/foreground refresh
- multi-device sync convergence
- subscription cleanup and channel-count budgets
- hot room/hot event behavior

### Funnel + access tests

- mass invite send
- mass join spikes
- invalid/expired/revoked link paths
- wrong-object route prevention
- duplicate membership prevention
- invite preview vs trip preview metadata boundaries

### Media tests

- concurrent upload stress across chat + media hub
- upload success with DB index failure rollback
- orphan cleanup verification
- signed URL auth correctness
- event-scale attachment load
- file/document attachment round-trip from chat to gallery/files tab

### Account lifecycle tests

- signup spike
- login spike
- password change/reset
- account deletion and cleanup
- duplicate provider-account handling
- attribution preservation after account deletion where legally required

### Multi-user / hot-event tests

- 50+ attendee announcement mode
- organizer/moderator controls under load
- notification queue backlog behavior
- read-only mode activation during simulated saturation

### Free vs paid QoS tests

- rate-limit partitioning by plan
- queue priority ordering
- free-user AI saturation without degrading paid/event host flow
- voice caps by plan

### Local reproducibility steps

1. Run `npm run dev`
2. Open two or more browser sessions with different users
3. Exercise:
   - join flow
   - concurrent task/event edits
   - chat reconnect by toggling network
   - offline queue replay
   - media upload/delete round-trip

### Staging reproducibility steps

1. Run seeded multi-user scenarios against staging
2. Replay invite/join bursts
3. Run hot-trip message bursts
4. Simulate provider degradation and feature-flag disablement

### Synthetic load plan

- Chat burst on one hot trip
- Invite/join burst on one trip/event
- Notification backlog growth
- Media upload burst on event trip
- AI/voice burst by mixed free and paid cohorts

### Success metrics before/after

- lower conflict-free overwrite rate on shared objects
- zero duplicate settlement / duplicate join / duplicate AI mutation events
- lower reconnect data-gap rate
- lower membership repair incidents
- lower media orphan count
- tier-aware queue latency under mixed plan load

---

## 15. Platform Scorecard

| Area | Score | Why it is below 95 |
|---|---:|---|
| Domain model coherence | 76 | Strong central trip container, but trip type, event extensions, channel types, and duplicated object families are still partially encoded in UI and parallel tables |
| Scope / ownership clarity | 68 | Private vs trip-shared vs channel-shared boundaries exist but are inconsistently represented in tables, hooks, and upload paths |
| Authorization model | 69 | RLS is widespread, but effective permissions are split across `trip_members`, `trip_admins`, `user_trip_roles`, and client-only matrices |
| Shared-write safety | 63 | Versioned/locked RPCs exist for some families, but not all writers use them; offline replay and AI promotions still bypass safe paths |
| Idempotency / deduplication | 60 | Good primitives exist, especially for concierge and some sync/webhook surfaces, but create-like shared writes are not uniformly protected |
| Realtime architecture | 65 | Main trip chat is solid; everything else is still fragmented across many Supabase listeners with uneven reconnect/backfill behavior |
| Invite / share / join safety | 64 | Approval-gated design is correct, but preview leakage, rejoin/reactivation drift, and invite-use accounting are still inconsistent |
| Media / storage robustness | 55 | Duplicate upload paths, broken document linkage, signed URL N+1, and incomplete orphan cleanup keep this well below launch-resilient |
| AI cross-surface mutation safety | 44 | Registry/router/token work is strong, but execution paths are inconsistent and confirmation/idempotency parity is incomplete |
| Plan-aware traffic shaping | 41 | Quotas exist, but QoS isolation, tier-aware RPM, queue priority, and protected capacity are largely absent |
| Observability | 58 | Good telemetry scaffolding and docs exist, but many events are unwired and release/alerting discipline is not fully operationalized |
| Rollback readiness | 62 | Web rollback and docs are decent; staging, kill-switch coverage, post-deploy smoke, and forward-fix data repair still need stronger execution |
| Production readiness | 61 | Chravel can support current product usage with care, but it is not yet constitutionally ready for hot events, broad pro adoption, or agent-heavy mutation scale |

### Interpretation

- **95–100 = strong and launch-resilient**
- **85–94 = decent but exposed**
- **70–84 = fragile**
- **below 70 = unsafe / not scale-ready**

By that rubric, Chravel is:

- **fragile** on domain model coherence alone
- **unsafe / not scale-ready** on scope/ownership clarity, authorization, shared-write safety, idempotency/deduplication, realtime architecture, invite/share/join safety, media/storage robustness, AI cross-surface mutation safety, plan-aware traffic shaping, observability, rollback readiness, and overall production readiness

The architecture does **not** need to be thrown away. It does need to stop accumulating new feature-local rules until the platform contracts above become the mandatory default.
