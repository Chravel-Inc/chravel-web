🎯 **What:** The code health issue addressed
Removed unused, commented-out variable `allRead` from `src/features/chat/components/ReadReceipts.tsx`.

💡 **Why:** How this improves maintainability
Commented-out code causes clutter and confusion for developers. Removing dead code keeps the codebase clean, improving readability and maintainability.

✅ **Verification:** How you confirmed the change is safe
Ran lint checks and typechecks, verified that unit tests related to read receipts still pass (`bun x vitest src/features/chat/hooks/__tests__/useChatReadReceipts.test.tsx`).

✨ **Result:** The improvement achieved
A cleaner codebase with less dead/commented-out code, adhering to better code health practices without modifying functional behavior.
