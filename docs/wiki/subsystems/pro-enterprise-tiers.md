# Pro / Enterprise Tiers

## Purpose
B2B surface for tour managers, event coordinators, and sports teams. Per-organization seats, role-based channels, custom roles, billing aggregated at the org level.

## Entry Points
| File | Purpose |
|---|---|
| `src/pages/OrganizationsHub.tsx` | List user's orgs |
| `src/pages/OrganizationDashboard.tsx` | Single-org dashboard |
| `src/pages/AcceptOrganizationInvite.tsx` | Accept org invite |
| `src/pages/ProTripDetail.tsx`, `ProTripDetailDesktop.tsx`, `MobileProTripDetail.tsx` | Pro trip surface |
| `src/hooks/useTripRoles.ts` | Role assignment |
| `src/hooks/useTripAdmins.ts` | Admin list |
| `src/hooks/useRoleAssignments.ts` | Bulk role assign |
| `src/hooks/useBulkRoleAssignment.ts` | Bulk operations |
| `src/services/roleChannelService.ts` | Role channel CRUD |
| `src/services/mockRolesService.ts` | Mock roles (demo) |

## Pro role enum (from `useAuth.tsx:74-87`)
`admin | staff | talent | player | crew | security | medical | producer | speakers | guests | coordinators | logistics | press`

## Permission model (memory #8)
- **Consumer trips** — open by default (any member can mutate most resources).
- **Pro trips** — role-based (`user_trip_roles` + `trip_roles` + `role_channel_access`).
- **Event trips** — organizer-only mutations.

A unified permission guard hook (`LESSONS.md`) is the right pattern for any shared mutation hook serving multiple trip types.

## Data Flow
**Invite a teammate:**
1. Admin in `OrganizationDashboard` → `invite-organization-member` edge function.
2. Edge sends email + writes `organization_invites`.
3. Recipient lands on `/accept-invite/:token` → `accept-organization-invite` edge function.
4. Membership row in `organization_members` (status='active').
5. `useAuth.tsx:311-323` reads it on next session refresh; `User.organizationId` populated.

**Set roles on a trip:**
1. Admin in pro trip → role picker → `useRoleAssignments.assign` or `useBulkRoleAssignment.assignMany`.
2. Writes to `user_trip_roles` and/or `trip_roles`.
3. Role-gated channels (`role_channels` + `channel_role_access`) gain new visibility.
4. Stream channel membership reconciled by `stream-reconcile-membership`.

## State Touched
- **Zustand:** `useEntitlementsStore` — `isOrgPro` boolean
- **TanStack Query:** `tripKeys.roster(tripId)`, `tripKeys.tripAdmins(tripId)`, `tripKeys.tripRoles(tripId)`, `tripKeys.channels(tripId)`

## Tables & RLS
| Table | Read | Write | Notes |
|---|---|---|---|
| `organizations` | org members | org admins | |
| `organization_members` | org members | org admins | |
| `organization_invites` | issuer + target | issuer | |
| `organization_billing` | org admins | service (Stripe) | |
| `pro_trip_organizations` | org members + trip members | service | Links pro trips to orgs |
| `user_trip_roles` | trip members | trip admins | |
| `trip_roles` | trip members | trip admins | |
| `trip_admins` | trip members | trip admins (bootstrap = creator) | |
| `role_templates` | service | service | Seeded |
| `role_channels` + `channel_role_access` + `role_channel_messages` | role members | role members + admins | |

## Edge Functions Used
- `invite-organization-member`
- `accept-organization-invite`
- `link-trip-to-organization`
- `stream-reconcile-membership` (sync Stream when roles change)
- `stream-setup-permissions` (initial setup)

## Demo vs Authenticated
- Demo pro role data uses `mockRolesService.ts`.
- Memory #27: mock-ID trip path disables consumer features that pro trips shouldn't see.

## Mobile / PWA / Capacitor considerations
- `MobileProTripDetail.tsx` provides a mobile-optimized layout.
- Role pickers must be touch-friendly.

## Known Risks
- Memory #19: **DB → RLS → hook → UI.** Never trust client-side role claims. The `useAuth.transformUser` enriches `proRole` from server data; client surfaces must consume that, not local overrides.
- Memory #8: cross-trip-type mutations need a unified permission guard.
- The `switchRole` dev-only escape hatch (`useAuth.tsx:1323-1351`) must remain dev-gated.
- Org billing is at the org level; do not mix with individual subscription tier.

## Source Refs
- `src/pages/OrganizationsHub.tsx`, `OrganizationDashboard.tsx`, `AcceptOrganizationInvite.tsx`
- `src/pages/ProTripDetail.tsx`, `ProTripDetailDesktop.tsx`, `MobileProTripDetail.tsx`
- `src/hooks/useTripRoles.ts`, `useTripAdmins.ts`, `useRoleAssignments.ts`, `useBulkRoleAssignment.ts`
- `src/services/roleChannelService.ts`, `mockRolesService.ts`
- `supabase/functions/{invite-organization-member,accept-organization-invite,link-trip-to-organization,stream-reconcile-membership,stream-setup-permissions}/`
- `src/hooks/useAuth.tsx:300-323, 386-410, 1323-1351`
- `agent_memory.jsonl` #8, #19, #27
- `LESSONS.md` — unified permission guard hook
