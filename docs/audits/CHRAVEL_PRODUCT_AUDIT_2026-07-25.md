# Chravel — Comprehensive Product Audit & Feature Inventory

> Date: 2026-07-25 · Branch: `claude/feature-audit-fixes-gvjks5`
> Scope: full feature inventory + evidence-backed answers to product/UX/growth
> questions on membership, permissions, identity, and scale. Companion to the
> code-level `POST_DRIFT_FEATURE_AUDIT_2026-07-25.md` (feature functionality scores).

## Executive summary

Chravel is a group-travel/touring/events app with **one `trips` table discriminated by
`trip_type` (`consumer` | `pro` | `event`)** and three parallel UI surfaces. The
feature set is broad and largely functional. This audit answers the membership,
permissions, identity, and scale questions directly, and surfaces a short list of
**real defects** (most notably: the invite link is the *single* growth funnel for real
trips with **no fallback if it breaks**, org-invite email is **never actually sent**, and
a self-"leave" button calls the wrong RPC and **errors**).

**Highest-leverage findings**
1. **Growth is single-threaded on the invite link.** For real trips it is the *only* way
   in, always request-to-join, and there is **no phone/email backup and no server-side
   recovery** if a link expires/breaks. This is the #1 scale/retention risk.
2. **Org invites are silently broken** — no email is sent and the accept URL uses a stale
   hardcoded domain, while the UI claims "Invitation sent."
3. **A self-removal UI path errors** because it calls `remove_trip_member_safe` (which
   rejects self) instead of `leave_trip`.

---

## 1. Master feature inventory

### 1.1 Trip types (the core axis)
Single `trips` table, `trip_type ∈ {consumer, pro, event}` (`src/utils/tripConverter.ts:49`,
`supabase/functions/create-trip/index.ts:91`).

| Dimension | Consumer | Pro (Tour) | Event |
|---|---|---|---|
| Route | `/trip/:id` | `/tour/pro/:id` | `/event/:id` |
| Tabs | Chat, Calendar, Concierge, Media, Payments, Places, Polls, Tasks | + **Team** (roster/roles) | **Agenda, Line-up, Admin** + Calendar/Chat/Media/Polls/Tasks; **no** Payments/Places/Concierge |
| Feature gating | all-on (`useFeatureToggle.ts:41`) | `enabled_features` + role-based | `enabled_features`, admin-toggleable |
| Permissions | flat "consumer open" | role-based (admin/edit/view) | binary organizer/attendee |
| Chat default | everyone | everyone | **broadcasts** (`create-trip:178`) |
| Media upload | everyone | everyone | **admin_only** (`create-trip:179`) |
| Limits | unlimited | `free_pro_trip_limit` | `free_event_limit` |

### 1.2 Features (what each does)
- **Chat** — Stream/GetStream-backed (not Supabase); channels, reactions, read receipts, threads, broadcasts (a *mode* inside chat, default for events). `src/features/chat/**`.
- **Calendar** — `tripKeys.calendar`; Google Calendar OAuth + sync; Gmail import feed. `src/features/calendar/**`.
- **Concierge** — Gemini text (`lovable-concierge`) + realtime voice; write-tools buffered through pending actions. `src/features/concierge/**`. (Consumer/pro only — not events.)
- **Media** — `UnifiedMediaHub` with sub-tabs **All / Photos / Videos / Files / Chat Links**. Photos=`image`, Videos=`video`, Files=`document` *or* image tagged schedule/receipt/ticket. Auto-ingests chat uploads. `trip_media_index`.
- **Trip links — Chat vs Explore (two tables, deliberate):**
  - **Chat Links** = `trip_link_index`, auto-extracted from messages + manual adds, shown under **Media → Chat Links** (OG metadata). `MediaUrlsPanel.tsx`.
  - **Explore** = `trip_links`, curated planning links with categories/voting/reorder/add-to-calendar, shown under **Places → Explore**. `TripLinksDisplay.tsx`, `tripLinksService.ts`.
  - Bridge: "Save to Explore" promotes chat→explore, **consumer trips only** (`allowPromoteToTripLink`).
- **Basecamps** — shared **Trip Base Camp** + per-user **Personal Base Camp**, under **Places → Base Camps**; drives distance-from-basecamp on places. `useTripBasecamp`, `usePersonalBasecamp`, tables `trip_base_camps`/`trip_personal_base_camps`. Setting the trip basecamp is admin/organizer-gated.
- **Polls** — `CommentsWall` ("Polls & Comments"), options/votes/comments. `useTripPolls`.
- **Payments / expense splitting** — split types `equal | custom | percentage`; balances, outstanding, history; payment-proof attachments; Venmo/PayPal deep links. Sign-in required. `PaymentsTab.tsx`, `paymentService`, `paymentBalanceService`.
- **Explore / Places + Maps** — trip places, Google Places + OSM fallback, directions embed. `PlacesSection.tsx`, `tripPlacesService`.
- **Travel Wallet** — (Settings) **loyalty programs** (airline/hotel/rental, tiers) **+ payment methods** (how others settle up with you). `TravelWallet.tsx`, `loyaltyProgramService`.
- **Agenda / Line-up** (events) — sessions (`event_agenda_items`, versioned optimistic-concurrency RPC) + auto-populated speaker line-up. `useEventAgenda`, `LineupTab`.
- **Admin tab** (events) — organizer-only event settings. Pro equivalent is the **Team** tab (`RolesView`/`RoleManager`).

### 1.3 Routes (grouped)
Trip detail (`/trip/:id`, `/trip/:id/preview`, `/t/:id`), pro (`/tour/pro/:id`), event
(`/event/:id`); auth (`/auth`, `/auth-callback`, `/reset-password`, `/delete-account`);
join (`/join/:token`, `/j/:token`, `/accept-invite/:token`); settings (`/profile`,
`/settings`, `/archive`, `/settings/subscription`); org (`/organizations`,
`/organization/:id`); admin (`/admin/*`, `/recs`, `/advertiser`); demo (`/demo/*`); plus
marketing/SEO/legal. Full table: `src/App.tsx:351–860`.

---

## 2. Membership & growth (invite / join)

### Q: Is the trip invite link the ONLY way to join a trip?
**Yes, for real consumer/pro/event trips.** The shareable invite link (`/join/:token`, its
`/j/:token` slug redirect, and `?invite=<code>` recovery) is the single user-facing entry,
and it **always creates an approval request** — never a direct join
(`supabase/functions/join-trip/index.ts:334` hardcodes `requiresApproval = true`). The only
other code that inserts into `trip_members` is trip creation, the `approve_join_request`
RPC, and a **demo-only** auto-join (`ensure_trip_membership`, text IDs 1–12 only). There is
**no admin "add a person" control** anywhere. Organization/enterprise invites are a
*separate* email-token system that lands in `organization_members`, not trips.

### Q: How does invite/join differ across regular vs pro vs event?
Approval is **always required for all three** — the difference is only:
- **Who can mint a link:** consumer = any member; pro/event = creator or `trip_admins`
  (`src/hooks/useInviteLink.ts:149-186`).
- **Who approves:** consumer = any active member (notifies all members); pro/event = creator
  or admins only (`join-trip/index.ts:522-555`).

### Q: Backup — add a user by phone/email if they have an account?
**No, not for trips.** The email/SMS buttons in `useInviteLink.resendInvite` just pre-fill a
`mailto:`/`sms:` with the *same* `/join/:token` link — no account lookup, no server call. If
the link is broken, they do nothing. **Email-based invitation exists only for organizations**
(matching-email token accept into `organization_members`, `pro` role) — and even that is
partly broken (see bugs). **No phone-identity add exists anywhere.**

### Q: What happens if links break at scale?
**No server-side fallback.** Link mechanics themselves are robust — optional 7-day expiry,
optional `max_uses` (counted on *approval*), capacity gating by the creator's plan
(`is_trip_at_member_capacity`), collision-safe 8-char codes with UUID fallback + a DB unique
constraint, and a thorough "no dead ends" invalid-state UX (`src/types/inviteErrors.ts`:
expired/inactive/full/rejected-cooldown/account-mismatch each have a titled recovery CTA).
**But** every recovery CTA ultimately says "ask the organizer for a new link," and the
organizer's only tool is `regenerateInviteToken`. Combined with no phone/email backize, a
broken/expired link at scale = **manual re-share is the only recovery**. This is the primary
growth-resilience gap.

---

## 3. Permissions & admin

### Q: How does an admin remove a user?
`CollaboratorsModal` (remove button gated by `canRemove`, admins-only for others) →
`useTripMembersQuery.removeMember` → `remove_trip_member_safe(p_trip_id, p_user_id)` RPC
(`SECURITY DEFINER`; actor is `auth.uid()`, not client-supplied; rejects removing the
creator/owner; hard-deletes the `trip_members` row + logs a notification).
**Default admin = the trip creator** (auto-inserted into `trip_admins` for pro/event at
creation; consumer authority is via `created_by` + the `consumer_member` matrix).

### Q: Should users be able to remove OTHER users (like iMessage/WhatsApp)?
**Today: no** — removal is creator/admin-only on both client and RLS, for *all* trip types.
(The "consumer open" model applies to *approving joins*, not removal.)

**Recommendation:** keep removal admin-gated as the default — it's the right call for
**pro/event** (organizer-run) trips. For **consumer** trips, Chravel's model is closer to a
group thread, and the iMessage/WhatsApp norm is instructive: iMessage lets **any** member
remove others (often chaotic); WhatsApp restricts removal to **admins**, but *any* member can
be promoted to admin. The WhatsApp model is the better fit — **keep removal admin-only, but
make promoting a consumer member to admin a first-class, low-friction action** so a group
isn't stuck when the creator is inactive. (Note `leave_trip` already auto-promotes the
longest-tenured member if the creator leaves — the manual-promote UX should mirror that.)
Avoid the iMessage "anyone removes anyone" model — it invites griefing in larger trips.

### Q: Self-removal (`leave_trip`) — can the creator leave?
**Yes.** `leave_trip` is a **soft delete** (`status='left'`), separate from removal. If the
creator leaves with others remaining, the **longest-tenured active member is auto-promoted**
to admin; if the **last** member leaves, the trip is **archived** (not deleted). Backed by an
RLS UPDATE policy allowing a user to set only their own row to `left`.

### Q: Admin UX — pro vs event
- **Pro = role-based.** `TeamTab → RolesView`; `RoleManager` + `CreateRoleDialog` create named
  roles (each optionally spawning a private channel), assign members, and promote/demote
  admins. Permission levels **admin / edit / view** map to feature-permission objects; role
  cap `MAX_ROLES_PER_TRIP`.
- **Event = organizer-binary.** `useEventPermissions` collapses everyone to `isOrganizer` vs
  attendee; all create/edit/delete gates are simply `isOrganizer`, chat/media open to all.
  No view/edit/admin gradient.

### Permission model source of truth
A generated matrix kept in **three parallel copies** that must stay in sync:
`config/permission-matrix.json` (canonical) → `src/types/permissionMatrix.generated.ts`
(client) → `permission_matrix_allows()` SQL (server). Resources: tasks/polls/calendar/
basecamp/links. Roles: `super_admin`/`demo`/`pro_admin`/`event_organizer` (full),
`consumer_member` (r/w/d, no admin), `consumer_guest` (none), `pro_editor`/`pro_viewer`/
`pro_coordinator`, `event_attendee` (read-only). Resolved server-side by
`resolve_trip_permission_role`; consumed by `useMutationPermissions` (server RPC first,
client fallback).

---

## 4. Identity & account lifecycle

- **No `@username`/handle exists.** Identity is a **`real_name` / `display_name` /
  `name_preference`** triad on `profiles` (+ a computed `resolved_display_name` view).
  Resolution: `resolveDisplayName.ts` (prefer resolved → display → real → first+last →
  "Former Member" sentinel). Display-name changes are **rate-limited to twice per 30 days**.
- **Account creation** — Supabase email/password + OTP; profile upserted on first sign-in;
  reachable from Auth, Join, Demo, Preview flows. `useAuth.tsx`, `AuthModal`.
- **Account deletion** — immediate (App-Store-compliant, `{confirmation:'DELETE'}` → server
  JWT-authorized) via `DeleteAccountDialog` / public `/delete-account`; schema also supports a
  scheduled path (`deletion_requested_at`/`deletion_scheduled_for`). Data export available.
- **Archiving** — `is_archived` (+ separate `is_hidden`); `restore-trip` edge fn handles
  `TRIP_LIMIT_REACHED`; creator-vs-member delete paths (`useDeleteTrip` / `tripDeletionService`).

---

## 5. Confirmed bugs & divergences

| # | Severity | Bug | Location | Fix |
|---|---|---|---|---|
| 1 | High (growth) | Org invite **email never sent** — UI toasts "Invitation sent" but no sender is invoked | `invite-organization-member/index.ts` + `InviteMemberModal.tsx:53` | Wire `send-email-with-retry`; make the toast reflect real delivery |
| 2 | High | Org invite accept URL uses **stale hardcoded `lovableproject.com` domain** | `invite-organization-member/index.ts:110` | Derive origin from request/`APP_URL` env **(fixing now)** |
| 3 | Med | Self-"Leave trip" button calls `remove_trip_member_safe` → **errors** (RPC rejects self) | `CollaboratorsModal.tsx:237` + `useTripMembersQuery.ts:394` | Route self-row to `leave_trip` **(fixing now)** |
| 4 | Med (latent) | `admin_scope='coordinator'` **ignored** everywhere — any `trip_admins` row = full `pro_admin` incl. member removal | `useTripMembersQuery.ts:263`, `remove_trip_member_safe:51`, `resolve_trip_permission_role:178` | Check scope in removal + role resolution (behind disabled `pro_coordinator_role` flag today) |
| 5 | Low | `archiveService` maps `consumer`→`'standard'` while all else uses `'consumer'` → wrong archived counts | `archiveService.ts:105` | Use `'consumer'` **(fixing now)** |
| 6 | Low | Two live `leave_trip` definitions with differing admin-cleanup/notify logic | migrations `20260705020000` vs `20260218001` | Confirm deployed version; consolidate |
| 7 | Low | Pro member default role differs client (`pro_viewer`) vs server (`pro_editor`) — fallback path only | `useMutationPermissions.ts:165` vs resolver `:203` | Align the client fallback default |

---

## 6. Prioritized recommendations

1. **Close the growth-resilience gap (highest leverage).** The invite link is the sole funnel
   with no fallback. Add (a) an **admin "add member by account (email)"** path for real trips
   — look up an existing `profiles` row by email and create a pre-approved join request/
   membership; and (b) fix org-invite email delivery (#1/#2). This directly answers "what
   happens if links break at scale."
2. **Make consumer member→admin promotion first-class** (the WhatsApp model) so trips aren't
   stuck when the creator is inactive; keep removal admin-only.
3. **Fix the self-leave contract bug (#3)** and the `archiveService` mislabel (#5) — safe now.
4. **Decide coordinator scope (#4)** before enabling the `pro_coordinator_role` flag, or it
   silently grants full admin (including member removal).
5. **Consolidate the permission-matrix triple-copy** risk with the existing drift check
   (already covered by `permissions:drift`), and confirm the single live `leave_trip`.

---

## Deferral Discipline footer

1. **Fixed now (this branch):** archiveService `consumer` label (#5), self-leave RPC routing
   (#3), org-invite stale domain (#2). Plus the earlier post-drift functional fixes + the
   Settings/Tasks and (in progress) Trip/Cover/Invite query-key consolidation.
2. **Discovered:** invite link is the sole, fallback-less growth funnel; org-invite email
   never sent; coordinator scope ignored; no `@username`; dual `leave_trip`; pro default-role
   client/server mismatch.
3. **Intentionally deferred:** org-invite email delivery wiring; a backup join-by-account
   (email/phone) path; coordinator-scope enforcement; `leave_trip` consolidation.
4. **Why deferral was necessary:** these touch critical growth/auth paths and (email delivery,
   deployed-`leave_trip` version) need runtime/infra confirmation not available in-container;
   the user scoped this run to the *safe* fixes.
5. **Follow-up prompts:** "Wire `send-email-with-retry` into `invite-organization-member` and
   make delivery status truthful in `InviteMemberModal`." · "Add an admin 'add member by
   email' path for real trips that looks up `profiles` and creates a pre-approved
   membership." · "Enforce `admin_scope='coordinator'` in `remove_trip_member_safe` and
   `resolve_trip_permission_role` before enabling `pro_coordinator_role`."
6. **Validation:** feature inventory + flows traced end-to-end by three exploration agents
   with file:line evidence; safe fixes verified by typecheck + targeted tests.
7. **Remaining launch blockers:** none purely functional; the growth-resilience gap (#1) is
   the top pre-scale product risk.
