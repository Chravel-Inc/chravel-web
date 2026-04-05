# TripChat.tsx Refactoring Strategy

To alleviate merge conflicts and reduce the file size of `TripChat.tsx` (which is currently over 1,000 lines), we will extract some discrete logic blocks into separate custom hooks.

The target file is `src/features/chat/components/TripChat.tsx`.

## Extractable Logic

1. **Reactions Logic**
   - The state `reactions` (`useState`)
   - The `handleReaction` function, which toggles reactions optimistically and hits Supabase (or Stream).
   - This can be extracted into `src/features/chat/hooks/useChatReactions.ts`.

2. **Read Receipts Logic**
   - The state `readStatusesByMessage` (`useState`)
   - The `subscribeToReadReceipts` usage (in a `useEffect`).
   - The unread message tracking logic (`markedMessageIdsRef`, `markReadTimerRef`, `ownMessageIdsRef`) and associated effects.
   - This can be extracted into `src/features/chat/hooks/useChatReadReceipts.ts`.

3. **Message Actions**
   - The `handleMessageEdit`, `handleMessageDelete` functions which talk to `useTripChat`.
   - Wait, `handleSendMessage` is already mostly delegated to `useTripChat` and `useChatComposer`. We can possibly extract edit/delete handlers into `useMessageActions.ts`.

## Execution Plan

Since we want to be surgical and safe:
1. Create `useChatReactions.ts`.
   - Pass in `demoMode.isDemoMode`, `user`, `liveMessages`, `toggleReaction` (from Stream/Supabase hook).
   - Return `{ reactions, handleReaction }`.
2. Modify `TripChat.tsx` to use `useChatReactions()`.
3. Verify functionality and build success.
