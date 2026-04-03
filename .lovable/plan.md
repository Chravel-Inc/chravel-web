

# Fix Spinning Send Button + Build Errors

## Problem
After sending a message, the send button shows a spinning loader. This happens because `isTyping={isSendingMessage}` passes the mutation's pending state to the input component, which disables the button and shows a spinner while the DB insert completes. With optimistic updates already in place, this spinner is unnecessary and feels sluggish.

## Changes

### 1. Remove send button spinner — `src/features/chat/components/TripChat.tsx`
- Find the `AiChatInput` usage where `isTyping={isSendingMessage}` is passed
- Change to `isTyping={false}`
- The optimistic insert already makes the message appear instantly; the button should never spin

### 2. Fix build error — `src/components/dashboard/touchActivationConstraint.ts`
- Line 1: Change `TouchActivationConstraint` → `PointerActivationConstraint` (the correct export from `@dnd-kit/core`)
- Update the return type annotation on line 9 accordingly

### 3. Fix build error — `src/hooks/useDashboardJoinRequests.ts`
- Line 150: Change `data as JoinRequestRow[]` → `data as unknown as JoinRequestRow[]` to satisfy the intermediate cast requirement

## What is NOT touched
- Stream Chat integration (completely separate typing system)
- Supabase Presence typing indicators (separate system)
- No message logic, no channel config, no realtime handlers

## Risk
**LOW** — one prop change + two type-only fixes. Zero runtime behavior change beyond removing the spinner.

