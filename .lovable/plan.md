

# Fix: Inject All Trip Context Into Concierge System Prompt

## Root Cause

The `contextBuilder.ts` (903 lines) fetches comprehensive trip data — tasks, polls, calendar, payments, places, links, members, broadcasts — but `promptBuilder.ts` (138 lines) only injects 4 out of 14 context slices into the Gemini system prompt:

| Data | Fetched from DB? | Injected into prompt? |
|------|-------------------|----------------------|
| Trip metadata | Yes | Yes |
| Basecamps | Yes | Yes |
| User preferences | Yes | Yes |
| Calendar | Yes | Only first 5 events |
| **Tasks** | Yes | **No** |
| **Polls** | Yes | **No** |
| **Payments** | Yes | **No** |
| **Members** | Yes | **No** |
| **Places/Links** | Yes | **No** |
| **Broadcasts** | Yes | **No** |

So when a user asks "summarize my tasks" or "what time is dinner Friday?" (event #6+), Gemini has zero context to answer.

Second bug: `QUERY_CLASS_SLICES` for `poll_action` maps to `['metadata', 'members']` — it never fetches `polls`.

## Fix Plan

### 1. Expand `promptBuilder.ts` to inject all context slices

Add sections for each data type, with sensible limits to avoid token bloat:

- **Members** (all, compact): `MEMBERS: Alice (admin), Bob (member), ...`
- **Calendar** (all events, not just 5): full title + start/end + location
- **Tasks** (all): title, assignee, due date, completion status
- **Polls** (all): question, options with vote counts, status (active/closed)
- **Payments** (all): description, amount, paid by, settled status
- **Places/Links** (all saved places + links): name, address, category
- **Broadcasts** (recent 10): message, priority, author

Each section is only injected when the data exists (no empty headers).

### 2. Fix `poll_action` query class slices

In `contextBuilder.ts`, change:
```
poll_action: ['metadata', 'members']
```
to:
```
poll_action: ['metadata', 'members', 'polls']
```

### 3. Fix `task_action` to also include `polls` cross-reference (optional, skip)

Already correct — `task_action: ['metadata', 'tasks', 'members']`.

### 4. Remove calendar truncation to 5 events

Currently `calendarEvents.slice(0, 5)` — change to inject all events (up to ~50) so "what time is dinner Friday?" works even when there are many events.

## Files Changed

1. `supabase/functions/_shared/promptBuilder.ts` — expand `buildSystemPrompt` to inject tasks, polls, payments, members, places, links, broadcasts
2. `supabase/functions/_shared/contextBuilder.ts` — fix `poll_action` slice to include `'polls'`
3. Redeploy `lovable-concierge` edge function

## Risk

Low — additive prompt text only. Token usage will increase slightly but stays well within Gemini's 1M context window. The context slices are already fetched; we're just making them visible to the model.

