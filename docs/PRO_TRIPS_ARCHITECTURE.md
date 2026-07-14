# Pro Trips — Architecture Deep Dive

> Audience: engineers onboarding onto the Pro Trips surface (enterprise tier:
> college programs, professional sports teams, touring productions).
> Generated from a full-codebase audit (July 2026). File references are
> anchors, not guarantees — verify before relying on line numbers.

## 1. What makes a trip "pro"

The single discriminator is **`trips.trip_type`** ∈ `'consumer' | 'pro' | 'event'`
(default `consumer`). It is set at creation by the `create-trip` edge function,
which also seeds per-type defaults:

| trip_type | enabled_features | chat_mode | media_upload_mode |
|---|---|---|---|
| consumer | chat, calendar, concierge, media, payments, places, polls, tasks | everyone | everyone |
| pro | consumer set **+ team** | everyone | everyone |
| event | agenda, calendar, chat, concierge, lineup, media, polls, tasks | broadcasts | admin_only |

A secondary classifier applies only to pro trips: the **pro category**
(`touring | sports | work | school | productions | celebrations | other`),
stored in the `trips.categories` JSONB as `{type:'pro_category', value}` and
configured in `src/types/proCategories.ts` (per-category roles, available tabs,
terminology). Read it via `convertSupabaseTripToProTrip`
(`src/utils/tripConverter.ts`) or the same JSONB lookup — there is **no
`pro_trip_category` column**.

The client-side god-object is `ProTripData` (`src/types/pro.ts`).

## 2. Permission model (three subsystems)

Pro trips carry three overlapping permission layers. Know which one you are in.

### 2a. Trip admins — `trip_admins`
Server-authoritative admin grants with a `permissions` JSONB
(`can_manage_roles`, `can_manage_channels`, `can_designate_admins`, plus
coordinator capabilities) and `admin_scope ∈ 'full' | 'coordinator'`.
Resolution: RPC `get_trip_admin_permissions` → hook
`src/hooks/useProTripAdmin.ts` (`isAdmin`, `adminScope`, `hasPermission()`).
The **coordinator** scope (logistics-only admin) is fully built server-side but
ships behind the disabled feature flag `pro_coordinator_role`.

### 2b. Custom per-trip roles — `trip_roles` + `user_trip_roles`
Dynamic roles created per trip (max 10, `roleUtils.ts`), each with
`permission_level ∈ 'view'|'edit'|'admin'` and a `feature_permissions` JSONB.
One **primary** role per user per trip (partial unique index). All mutations go
through RPCs (`create_trip_role`, `assign_trip_role`, `delete_trip_role`,
`leave_trip_role`) which re-check trip-creator-or-admin server-side. Hooks:
`useTripRoles`, `useRolePermissions`, `useRoleAssignments`,
`useBulkRoleAssignment`.

### 2c. Static permission matrix — `permissionMatrix.generated.ts`
Build-time matrix (`pro_admin/pro_editor/pro_viewer/pro_coordinator` …) used by
`useMutationPermissions` / `permissionGuard` for shared mutation gating.
⚠️ Its role vocabulary does **not** map 1:1 onto 2a/2b — do not mix them.

### RLS ground rules
- `can_manage_trip_content(user, trip)`: consumer → any active member;
  pro/event → **trip admins only**. Applied to events, broadcasts, todos,
  expenses, bookings, invites.
- `can_access_channel`: admin/creator, explicit `channel_members` row, or role
  grant.
- Audit triggers: `prevent_self_role_escalation`, `audit_role_changes`,
  `audit_trip_admins` → `security_logs`.

## 3. Channels

**Model:** channels are *derived from roles*. Creating a role auto-creates a
private channel (trigger `auto_create_channel_for_role`); assigning the role
auto-populates `channel_members` (sync triggers) and the Stream projection
(`stream-ensure-membership`, `stream-reconcile-membership` edge functions).
There is no manual join; deleting a role archives its channel.

**Transport:** channel *lists* come from Supabase (`trip_channels` via
`channelService.getAccessibleChannels`); channel *messages* live exclusively in
Stream (`useStreamProChannel`, channel type `chravel-channel:channel-{id}`).
The legacy Supabase message path (`channel_messages`, `roleChannelService`) is
disabled whenever Stream is configured (`streamTransportGuards.ts`) and throws
`STREAM_CANONICAL_TRANSPORT` on send.

**Member counts** come from one SQL function,
`get_channel_member_counts(p_trip_id)` (role-derived ∪ explicit members,
DISTINCT users, archived excluded) — applied to both the admin and member
branches of `getAccessibleChannels`. Do not add bespoke counting queries.

**Realtime:** `useRoleChannels` subscribes to `trip_channels` and
`user_trip_roles` (filtered by `trip_id`) and silently refetches on change; if
the active channel disappears (archived/deleted/role removed), it is evicted
with a toast. `channel_members` needs no subscription — it is only mutated
alongside those two tables.

**Unread:** `useChannelUnreadCounts` (Stream `queryChannels` seed + client
event ledger — never `watch()`); `ChannelChatView` marks the open channel read
via `useChatReadReceipts`.

**UI:** desktop pro trips render a persistent rail (`ChatSidebar`) inside the
Chat tab — sections Messages/Broadcasts/Pinned plus the channel list with
unread badges. Mobile keeps the `MessageTypeBar` pill bar; the Channels pill
opens `MobileChannelSheet` (bottom sheet). Consumer/event trips are untouched
(pill bar + popover only, no channels).

**Leaving:** "Leave role" — membership is role-derived, so leaving removes the
user from the role and every channel it grants. The action is hidden on
multi-role channels (`required_role_id` null).

## 4. Broadcasts (three paths — know which one you touch)

1. **In-chat broadcast flag** (canonical UI path): a flagged Stream message in
   the trip channel. UI gate: consumer → any member; pro/event → admins only
   (`canSendBroadcast`, TripChat).
2. **`broadcasts` table**: written directly by the concierge
   (`functionExecutor`, user JWT → RLS-gated) and by `unifiedMessagingService`.
3. **`broadcasts-create` edge function**: deployed but has **no first-party
   callers**; it enforces the same trip-type policy server-side (service role
   bypasses RLS, so the check lives in the function).

## 5. Entitlements

Four layers, from display to enforcement:
1. `src/billing/config.ts` — products/tiers (`free, explorer,
   frequent-chraveler, pro-starter, pro-growth, pro-enterprise`) and
   entitlement grants (`pro_trip_creation`, `channels_enabled`,
   `roles_enabled`, `roster_management`, …).
2. `src/billing/entitlements.ts` — `FEATURE_LIMITS` per tier.
3. `useSubscription` — normalized `user_entitlements` reads (`isOrgPro`,
   `isEnterprise`, …).
4. **Server truth**: `_shared/tripEntitlementPolicy.ts`
   (`evaluateTripCreationPermission`) — free tier gets one "taste-test" pro
   trip (`profiles.free_pro_trips_used`), explorer none, frequent-chraveler
   one, pro-* unlimited.

Organizations (`organizations`, `organization_members`, seat model,
`pro_trip_organizations` linkage) are a parallel acquisition path.
⚠️ Org tiers (`starter/growing/enterprise/enterprise-plus`) and billing tiers
(`pro-starter/pro-growth/pro-enterprise`) are **different vocabularies** with
no adapter — do not compare them directly.

## 6. Page shells

- Route `/tour/pro/:proTripId` → `ProTripDetail` (viewport fork) →
  `ProTripDetailDesktop` / `MobileProTripDetail`.
- Desktop tabs: `ProTabsConfig.tsx` (`getVisibleTabs` — category + role +
  permission + demo gating; placeholder tabs finance/medical/compliance/
  sponsors are demo-only by design). Mobile tabs:
  `MobileTripTabs.getTabsForVariant` — a **second config** (ids diverge:
  `ai-chat` vs `concierge`). Unification is a tracked follow-up.
- Not-found states are reason-aware (`ProTripNotFound` with
  `auth_required / pending_approval / no_access / not_found`) and shared by
  both shells. Loading gates include `useAuth().isLoading` — `useTrips` is
  disabled until auth hydrates, so skipping that gate re-introduces the
  "Trip Not Found flash" regression.
- Desktop header (`ProTripDetailHeader`) carries the action bar: Inbox toggle,
  gold Invite (auth-aware), Settings — wired to the modals in
  `ProTripDetailDesktop` (`TripDetailModals`).

## 7. Invariants (do not regress)

1. Trip existence ≠ trip access; RLS cannot distinguish them — not-found copy
   must hedge.
2. All role/channel/admin mutations go through RPCs that re-check authority
   server-side; client checks are cosmetic.
3. Channel messages are Stream-only on real trips; never re-enable the legacy
   Supabase message path alongside it.
4. Pro/event broadcasts are admin-only at every layer (UI, RLS, edge
   function).
5. Demo mode must keep working with `MockRolesService` / demo channel data —
   every channels/roles hook branches on demo first.
6. `useChannelUnreadCounts` must never call `watch()`/`stopWatching()` —
   `useStreamProChannel` owns the watched-channel lifecycle.
