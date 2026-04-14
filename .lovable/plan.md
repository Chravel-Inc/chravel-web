

# Fix: Cover Photo Permissions + Build Errors

## Cover Photo Permission Issue

**Root cause:** The error toast "Upload blocked by trip permissions" comes from `TripCoverPhotoUpload.tsx` line 122-125, triggered when the storage upload throws an error containing "policy" or "permission". 

The storage upload goes to the `trip-covers` bucket. Migration `20260413000000` created this bucket with correct member-only RLS policies (any trip member can insert/update/delete). However, there are **two potential causes** for the permission error:

1. **Migration not applied:** If the `trip-covers` bucket was never created in production, `uploadTripCoverBlob` uploads to a non-existent bucket, which Supabase returns as a policy error.
2. **Conflicting old policies:** Earlier migrations (`20260403121000`, `20260407120000`, `20260315000004`) created policies on `trip-media` bucket that used `can_upload_media_to_trip()` — which checks `media_upload_mode`. The `20260413000000` migration drops `"Trip members can upload trip covers"` but the `20260315000004` enforced policy on `trip-media` with the `can_upload_media_to_trip` check might still be active for old paths.

**Fix:** The client code in `TripCoverPhotoUpload.tsx` line 122-125 incorrectly attributes ALL policy/permission errors to "media upload settings." Since cover photos use the `trip-covers` bucket (not subject to `media_upload_mode`), this toast is misleading. Change the error message to be accurate, and ensure a new migration guarantees the `trip-covers` bucket exists with correct policies (idempotent).

Additionally, the `updateCoverPhoto` in `useTripCoverPhoto.ts` checks `data` after the `.update()` — if RLS on `trips` table blocks the update, it returns "You don't have permission." We need to verify the `trips` UPDATE RLS policy allows any member to update `cover_image_url`.

## Build Errors (4 separate issues)

### 1. `check-subscription/index.ts` — broken imports (line 18-28)
Lines 18-22 have a duplicate import from `entitlementSelection.ts` and lines 24-28 are bare statements outside any import block. Fix: merge into one correct import block.

### 2. `create-trip/index.ts` — undefined `entitlement` variable (line 85)
`entitlement` is referenced but never fetched. Need to add the entitlement query before line 82.

### 3. `export-trip/index.ts` — `PdfUsageGateRow` type constraint error (lines 149, 293)
`interface` types don't satisfy `Record<string, unknown>` because they lack an index signature. Fix: add `[key: string]: unknown` to both interfaces, or change the generic constraint.

### 4. `usePdfExportUsage.ts` — same `Record<string, unknown>` constraint + unknown RPC names
Same interface constraint issue. The RPC names `get_trip_pdf_export_usage` and `increment_trip_pdf_export_usage` aren't in the generated types. Fix: use `.rpc()` with type assertion, and fix the interface constraint.

## Plan

### Files to change:

1. **`src/components/TripCoverPhotoUpload.tsx`** — Remove misleading "media upload settings" toast. Replace with generic "Upload failed — please try again" since cover photos are not governed by `media_upload_mode`.

2. **`supabase/functions/check-subscription/index.ts`** — Fix broken import block: merge duplicate `entitlementSelection.ts` imports, wrap `entitlementState.ts` imports in proper `import { ... } from` syntax.

3. **`supabase/functions/create-trip/index.ts`** — Add entitlement fetch query (from `user_entitlements` table) before line 82 so `entitlement` is defined.

4. **`supabase/functions/export-trip/index.ts`** — Add index signature `[key: string]: unknown` to `PdfUsageGateRow` and `PdfUsageIncrementRow`, or change `normalizeRpcRow` constraint to `Record<string, unknown>` cast internally.

5. **`src/hooks/usePdfExportUsage.ts`** — Same fix: add index signatures to `PdfUsageRpcRow` and `IncrementPdfUsageRpcRow`. For unknown RPC names, cast through `supabase.rpc(... as any, ...)`.

6. **New migration** — Idempotent migration ensuring `trip-covers` bucket exists with correct policies (safety net if previous migration wasn't applied).

7. **Redeploy** affected edge functions: `check-subscription`, `create-trip`, `export-trip`.

## Risk
Low-medium. Import fixes are syntax-only. Cover photo toast change is cosmetic. The idempotent migration uses `ON CONFLICT DO NOTHING` and `IF NOT EXISTS`. The `create-trip` entitlement fetch is additive.

