# RLS Audit — trip_files, trip-media, trip_events
**Date:** 2026-05-17 · **Scope:** Smart Import + manual write paths vs trip-membership RLS · **Method:** live `pg_policies` snapshot + edge-function source trace.

---

## 1. Executive Summary

All three audited surfaces enforce trip membership at the DB layer via `EXISTS … trip_members` subqueries or the `is_trip_member()` helper. Every edge-function write path that uses `service_role` (and therefore bypasses RLS) performs an explicit `trip_members` precheck or runs the write through a user-JWT-scoped client first. **No critical bypass found.** Six lower-severity findings documented below (F1–F6); two are intentional product decisions (calendar shared-edit, trip-covers public read), four are hardening opportunities.

There is **no `trip_media` table**. Media flows through `public.trip_files` (DB row), `public.trip_media_index` (search/index row), and storage buckets `trip-media` + `chat-media`. All four are audited here.

---

## 2. Policy Contracts (frozen snapshot)

### 2.1 `public.trip_events` — RLS ON, no FORCE
| Op | Policy | Rule |
|---|---|---|
| SELECT | Allow viewing calendar events | `trip_member(trip_id, auth.uid())` OR `trips.created_by = auth.uid()` |
| INSERT | Allow calendar event creation | `auth.uid() = created_by` **AND** (`trip_member` OR `creator`) |
| UPDATE | Allow calendar event updates | `trip_member` OR `creator` (USING + WITH CHECK identical) |
| DELETE | Allow calendar event deletion | `trip_member` OR `creator` |

**Invariant:** any trip member can read/write/delete any event; INSERT additionally pins `created_by` to caller.

### 2.2 `public.trip_files` — RLS ON, no FORCE
| Op | Policy | Roles | Rule |
|---|---|---|---|
| SELECT | Members can read trip_files | authenticated | `trip_member` OR `uploaded_by = auth.uid()` |
| INSERT | Owners can insert trip_files | authenticated | `auth.uid() = uploaded_by` **AND** `is_trip_member(auth.uid(), trip_id)` |
| UPDATE | Owners can update trip_files | **public** | `auth.uid() = uploaded_by` |
| DELETE | Owners can delete trip_files | **public** | `auth.uid() = uploaded_by` |

### 2.3 `public.trip_media_index` — RLS ON, no FORCE
| Op | Policy | Roles | Rule |
|---|---|---|---|
| SELECT/INSERT/UPDATE/DELETE | Members can {view,insert,update,delete} trip media | **public** | `EXISTS(trip_members where trip_id matches AND user_id = auth.uid())` |

INSERT WITH CHECK present; UPDATE has no WITH CHECK (only USING) — trip_id can be moved to another member-trip undetected.

### 2.4 Storage bucket `trip-media` (private bucket)
| Op | Rule |
|---|---|
| SELECT | `bucket='trip-media' AND (folder[1]='trip-covers' OR trip_member of folder[1])` |
| INSERT | same |
| UPDATE | `bucket AND trip_member of folder[1]` (no trip-covers carve-out) |
| DELETE | `bucket AND trip_member of folder[1]` |

Plus public SELECT for `trip-covers/*` (intentional, for OG share previews).

### 2.5 Storage bucket `chat-media` (private bucket)
| Op | Rule |
|---|---|
| SELECT/INSERT | `bucket AND trip_member of folder[1]` |
| DELETE | `bucket AND folder[2] = auth.uid()` (owner-only) |
| UPDATE | **missing** — all updates blocked |

---

## 3. Write-Path Inventory

| Function | Target | Client | Pre-write membership check | `created_by` / `uploaded_by` source | Verdict |
|---|---|---|---|---|---|
| `calendar-sync` | `trip_events` (insert/update/delete) | service_role | ✅ explicit `trip_members` lookup before any mutation | `userId` from verified JWT | ✅ safe |
| `confirm-reservation-draft` | `trip_events` (insert) | user-JWT (anon key + Authorization) | ✅ `verifyTripMembership(user.id, draft.tripId)` | `user.id` from `auth.getUser()` | ✅ safe; RLS would catch a bypass anyway |
| Manual UI → `calendarService.createEvent` → `trip_events` | user-JWT via `@/integrations/supabase/client` | RLS-enforced | n/a (RLS) | client sets `created_by = auth.uid()` | ✅ safe |
| `file-upload` | `trip_files` (insert) + `trip-media` storage | service_role | ✅ user-scoped client checks `trip_members` before service-role write | `uploaded_by: userId` from `auth.getUser(token)` | ✅ safe |
| `file-ai-parser` | `trip_files` (update) | service_role | ✅ explicit `trip_members` lookup against `fileRow.trip_id` | n/a (update only) | ✅ safe |
| `document-processor` | `trip_files` (update, multi-step) | service_role + user-scoped | ✅ **two-layer** check (service-role filter + user-scoped RLS probe) | n/a (update) | ✅ safe (defense in depth) |
| `artifact-ingest` | `trip_files` / kb_* | service_role | ✅ explicit `trip_members` lookup | derived from authed user | ✅ safe |
| `ai-ingest` | reads `trip_files`; writes only `kb_documents` / `kb_chunks` | service_role | ❌ no explicit `trip_members` check on read path | n/a | ⚠️ low: read-only into RAG, but allows authenticated callers to seed embeddings for any trip's files — see F5 |
| `gmail-import-worker` | `gmail_import_jobs`, `smart_import_candidates` (NOT direct events/files); event creation happens later via `confirm-reservation-draft` | mixed | scoped per-row via `user_id = user.id`; final event write goes through `confirm-reservation-draft` | `user.id` from authed client | ✅ safe (event creation gated downstream) |

All eight Smart Import / calendar write paths attribute records to the authenticated caller (no system UUIDs, no client-provided `created_by`/`uploaded_by`).

### Storage path convention check
Every upload site prefixes object keys with `<trip_id>/…` (verified for `file-upload` and chat upload helpers), satisfying `storage.foldername(name)[1] = trip_id`. Cover-photo writes use `trip-covers/<file>` to hit the public-read carve-out by design.

---

## 4. Findings

| ID | Severity | Surface | Finding |
|---|---|---|---|
| **F1** | Info (intentional) | `trip_events` UPDATE/DELETE | Any trip member can edit or delete any event, even ones they didn't create. Conflicts with `AUDIT_STRUCTURED_OBJECTS.md` (`created_by OR is_trip_admin`). `docs/_archive/root/CALENDAR_EVENT_CREATION_FIX.md` documents this as the **shared-calendar product model**. Keep as-is; document the divergence. |
| **F2** | Low | `trip_files` UPDATE/DELETE | Policies granted to role `public` instead of `authenticated`. Functionally identical because the `auth.uid() = uploaded_by` predicate blocks anon, but inconsistent with sibling policies. Normalize to `authenticated`. |
| **F3** | Low | `trip_files` | No admin/moderation override on UPDATE/DELETE — trip admins cannot remove a member's uploaded file. Add `OR is_trip_admin(auth.uid(), trip_id)`. |
| **F4** | Low | `chat-media` bucket | No UPDATE policy → all updates blocked. Likely intentional (chat media is immutable), but should be made explicit with a deny-by-default comment or a no-op policy with `using (false)` for audit clarity. |
| **F5** | Low | `ai-ingest` | Reads `trip_files` via service_role without an explicit `trip_members` precheck. The function is gated by `requireAuth` so anonymous callers are blocked, but any authenticated user can trigger RAG ingestion of any trip's files. Add a membership check mirroring `file-ai-parser`. |
| **F6** | Low | `trip_media_index` UPDATE | USING clause covers source trip, but missing WITH CHECK → an authenticated member of trip A AND trip B could move a row from trip A to trip B (or vice versa). Add `WITH CHECK` mirroring USING. |

No High/Critical findings.

---

## 5. Risk Table (Likelihood × Impact, 1–5)

| ID | L | I | Score | Notes |
|---|---|---|---|---|
| F1 | 5 | 2 | 10 | Product-accepted shared-edit model |
| F2 | 5 | 1 | 5 | Cosmetic — anon still blocked by `auth.uid()` |
| F3 | 2 | 2 | 4 | Missing moderation, not a leak |
| F4 | 1 | 1 | 1 | Updates already blocked |
| F5 | 2 | 2 | 4 | Authenticated callers only; cross-trip RAG seeding |
| F6 | 1 | 2 | 2 | Requires membership in both trips |

---

## 6. Proposed Remediation (queued — NOT applied)

Single optional migration draft. Will be staged separately for explicit approval per Deferral Discipline.

```sql
-- F2: normalize grantee
DROP POLICY IF EXISTS "Owners can update trip_files" ON public.trip_files;
DROP POLICY IF EXISTS "Owners can delete trip_files" ON public.trip_files;

-- F3: add admin moderation override
CREATE POLICY "Owners or admins can update trip_files"
  ON public.trip_files FOR UPDATE TO authenticated
  USING (auth.uid() = uploaded_by OR public.is_trip_admin(auth.uid(), trip_id))
  WITH CHECK (auth.uid() = uploaded_by OR public.is_trip_admin(auth.uid(), trip_id));

CREATE POLICY "Owners or admins can delete trip_files"
  ON public.trip_files FOR DELETE TO authenticated
  USING (auth.uid() = uploaded_by OR public.is_trip_admin(auth.uid(), trip_id));

-- F6: harden trip_media_index UPDATE
DROP POLICY IF EXISTS "Members can update trip media" ON public.trip_media_index;
CREATE POLICY "Members can update trip media"
  ON public.trip_media_index FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM trip_members m WHERE m.trip_id = trip_media_index.trip_id AND m.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM trip_members m WHERE m.trip_id = trip_media_index.trip_id AND m.user_id = auth.uid()));

-- F4: explicit deny on chat-media UPDATE (documentation)
-- (storage.objects already lacks the policy; add a comment-only no-op for audit clarity)
COMMENT ON TABLE storage.objects IS 'chat-media bucket: UPDATE intentionally has no policy (immutable). See docs/AUDIT_RLS_TRIP_OBJECTS.md F4.';
```

F5 (ai-ingest) is a code fix, not a migration:
```ts
// In supabase/functions/ai-ingest/index.ts, after requireAuth and before reading trip_files:
const { data: membership } = await supabase
  .from('trip_members').select('user_id')
  .eq('trip_id', tripId).eq('user_id', auth.user.id).maybeSingle();
if (!membership) return new Response(JSON.stringify({ error: 'Not a trip member' }), { status: 403, headers });
```

F1 requires no change (product decision).

---

## 7. Test Plan (per policy)

Run as Postgres with `SET LOCAL request.jwt.claim.sub = '<uuid>'` to simulate each principal.

| Scenario | trip_events | trip_files | trip_media_index | trip-media bucket |
|---|---|---|---|---|
| anon | deny all | deny all | deny all | deny all (except trip-covers SELECT) |
| member, not creator/uploader | full CRUD | SELECT only | full CRUD | full CRUD on `<trip_id>/*` |
| member who is uploader/creator | full CRUD | full CRUD | full CRUD | full CRUD |
| non-member | deny all | deny all | deny all | deny all |
| admin, non-creator | full CRUD on events | SELECT only (until F3) | full CRUD | full CRUD |

Recommended fixture: extend `src/__tests__/security_audit_structured_objects.test.ts` with file/media cases.

---

## 8. Out of Scope (follow-ups, not silently dropped)

1. Apply remediation migration (separate approval).
2. Re-evaluate F1 if product moves calendar to owner/admin-gated edits.
3. Audit `kb_documents`, `kb_chunks`, `trip_chat_messages`, payment tables (separate engagements).
4. Add automated regression test asserting every Smart Import edge function performs a `trip_members` precheck before service-role writes.

---

## Deferral Footer

1. **Fixed now:** Documentation only — no code/DB change in this pass (audit-only request).
2. **Discovered:** F1–F6 above.
3. **Intentionally deferred:** F2, F3, F4, F5, F6 remediations — pending separate approval per repo rules ("Require explicit user approval before executing ANY user-facing layout/UI changes" extends to RLS changes touching write paths).
4. **Why deferral:** All findings are low/info severity; bundling the migration with the audit would violate single-purpose-commit policy and ship untested RLS changes alongside a read-only audit.
5. **Follow-up prompts (paste-ready):**
   - *"Apply the remediation migration drafted in docs/AUDIT_RLS_TRIP_OBJECTS.md §6 (F2+F3+F6) and add membership precheck to ai-ingest (F5). Include the test matrix from §7 as Vitest cases."*
   - *"Add a CI check that greps every supabase/functions/*/index.ts for service_role usage without an adjacent trip_members lookup and fails the build."*
6. **Validation:** Live `pg_policies` snapshot taken 2026-05-17; edge-function source verified at HEAD. No app behavior changed.
7. **Remaining launch blockers:** None from this audit.
