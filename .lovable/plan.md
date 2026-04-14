

# Fix & Redeploy Concierge Edge Function

You've done your part rotating the key — I can fix the code issues and redeploy from here.

## Two Code Fixes + Deploy

### 1. Fix invalid flash model name
**File:** `supabase/functions/_shared/gemini.ts` line 63

`gemini-3.1-flash` → `gemini-3-flash-preview`

This is the primary reason both the direct Gemini path AND the Lovable fallback path fail. The Lovable gateway also rejects `gemini-3.1-flash` as an unknown model.

### 2. Fix `assignee_id` column reference
**File:** `supabase/functions/_shared/contextBuilder.ts` line 677

The `trip_tasks` table has no `assignee_id` column — assignments live in a separate `task_assignments` table. The query needs to either:
- Remove `assignee_id` from the select and join `task_assignments` for assignee info, OR
- Simply drop the column from the select and skip assignee resolution (simpler, non-breaking)

I'll take the simpler approach: remove `assignee_id` from the task query and assignee resolution logic since tasks use the `task_assignments` join table. This prevents the context builder from crashing.

### 3. Deploy
Redeploy `lovable-concierge` edge function with both fixes applied.

## Files Changed
1. `supabase/functions/_shared/gemini.ts` — fix default model name
2. `supabase/functions/_shared/contextBuilder.ts` — fix task query to not reference nonexistent column

## Risk
Low — config/query fix only. No logic changes. The model name fix immediately restores the fallback path, and the rotated API key restores the primary path.

