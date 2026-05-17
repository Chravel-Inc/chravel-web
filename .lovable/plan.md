# RLS Audit Plan: trip_files, trip-media, trip_events

## Scope
Audit current policy contracts and verify Smart Import (`ai-ingest`, `artifact-ingest`, `file-upload`, `file-ai-parser`, `gmail-import-worker`, `calendar-sync`, `confirm-reservation-draft`, `document-processor`) and manual UI paths all conform to trip-membership RLS. Note: there is no `trip_media` table — media is split between `public.trip_files` (DB rows), `public.trip_media_index` (index), and storage buckets `trip-media` + `chat-media`. Audit will cover all three.

## Deliverables
1. `docs/AUDIT_RLS_TRIP_OBJECTS.md` — policy contract reference + findings + risk table.
2. List of mismatches between policy expectations and edge-function write paths (no code changes in plan mode; remediation migrations proposed but not applied).
3. Optional follow-up migration draft (only if gaps found) staged for explicit approval.

## Current Policy Snapshot (verified live)

### `public.trip_events` — RLS ON
| Op | Policy | Rule |
|---|---|---|
| SELECT | Allow viewing calendar events | trip_member OR trip creator |
| INSERT | Allow calendar event creation | `auth.uid() = created_by` AND (trip_member OR creator) |
| UPDATE | Allow calendar event updates | trip_member OR creator (both USING + WITH CHECK) |
| DELETE | Allow calendar event deletion | trip_member OR creator |

⚠️ **Gap**: UPDATE/DELETE allow ANY trip member to mutate ANY event — no ownership/admin gate. Conflicts with `AUDIT_STRUCTURED_OBJECTS.md` standard (`created_by = auth.uid() OR is_trip_admin`). Calendar-fix doc intentionally chose shared model; flag as deliberate divergence.

### `public.trip_files` — RLS ON
| Op | Policy | Rule |
|---|---|---|
| SELECT | Members can read trip_files | trip_member OR uploaded_by self |
| INSERT | Owners can insert | `auth.uid() = uploaded_by` AND `is_trip_member(auth.uid(), trip_id)` |
| UPDATE | Owners can update | `auth.uid() = uploaded_by` (role: public) |
| DELETE | Owners can delete | `auth.uid() = uploaded_by` (role: public) |

⚠️ **Gaps**:
- UPDATE/DELETE granted to `public` role instead of `authenticated` (cosmetic; anon still blocked by `auth.uid()`).
- No admin override — trip admins cannot moderate files.
- SELECT policy is consistent with trip-membership invariant (good).

### `public.trip_media_index` — needs verification
Currently no policies returned in initial query (table exists). Audit must enumerate and report enable/policy state.

### Storage: `trip-media` bucket
| Op | Rule |
|---|---|
| SELECT | bucket=`trip-media` AND (folder[1]=`trip-covers` OR trip_member of folder[1]) |
| INSERT | same |
| UPDATE | bucket AND trip_member of folder[1] |
| DELETE | bucket AND trip_member of folder[1] |

✅ Path convention `<trip_id>/...` enforced. `trip-covers/...` is public-read by design.

### Storage: `chat-media` bucket
| Op | Rule |
|---|---|
| SELECT/INSERT | bucket AND trip_member of folder[1] |
| DELETE | bucket AND folder[2] = `auth.uid()` (owner-only) |
| UPDATE | ❌ missing |

⚠️ **Gap**: no UPDATE policy → updates blocked entirely (likely intentional, document it).

## Audit Steps (read-only)
1. **Enumerate `trip_media_index` policies + RLS state** via `pg_policies` and `pg_class.relrowsecurity`.
2. **Trace every write path** to the three tables/buckets:
   - `ai-ingest`, `artifact-ingest`, `file-upload`, `file-ai-parser`, `document-processor`, `receipt-parser`, `enhanced-ai-parser`, `message-parser`, `image-upload` → `trip_files` / `trip-media`.
   - `gmail-import-worker`, `calendar-sync`, `confirm-reservation-draft`, manual `CalendarEventModal`/`CreateEventModal`/`useCalendarEvents` → `trip_events`.
   For each: confirm whether it uses user-JWT client (RLS applies) or service-role (RLS bypassed); if service-role, verify membership is checked in code before insert/update.
3. **Verify `created_by` / `uploaded_by` attribution**: Smart Import must set these to the calling user, not a system UUID, or RLS-applying clients will reject inserts and service-role inserts will lose auditability.
4. **Path convention check** for storage uploads: every Smart Import code path must prefix object keys with `<trip_id>/...` to satisfy `storage.foldername(name)[1] = trip_id`.
5. **Membership-bypass check**: search for any edge function querying `trip_files`/`trip_events` with service-role and missing an `is_trip_member` precheck.
6. **Cross-check against `AUDIT_STRUCTURED_OBJECTS.md`** standard and reconcile divergences (calendar shared-edit model is intentional — record it explicitly).

## Findings Document Structure
```
docs/AUDIT_RLS_TRIP_OBJECTS.md
  1. Executive summary
  2. Policy contracts (tables above, frozen)
  3. Write-path inventory (function → table → auth mode → membership check)
  4. Findings:
     - F1: trip_events UPDATE/DELETE not owner/admin gated (intentional)
     - F2: trip_files UPDATE/DELETE grantee = public (cosmetic)
     - F3: trip_files no admin moderation
     - F4: chat-media no UPDATE policy
     - F5: any Smart Import service-role gaps discovered in step 5
     - F6: trip_media_index policy state (TBD step 1)
  5. Risk table (Likelihood × Impact)
  6. Proposed remediations (each as separate optional migration, gated on user approval)
  7. Test plan (SQL scenarios per policy: member, non-member, creator, admin, anon)
```

## Out of Scope (will be listed as follow-ups, not silently dropped)
- Actually applying any RLS migrations (requires separate approval per Deferral Discipline).
- Re-architecting calendar to owner/admin gating (product decision).
- Auditing `kb_documents`, `kb_chunks`, `trip_chat_messages`, payment tables (separate audits already exist or out of this request).

## Approval Gate
After plan approval I will: run the read-only audit (DB queries + code reads), write `docs/AUDIT_RLS_TRIP_OBJECTS.md`, and return the findings with proposed migration SQL queued for a second approval before any DB change.
