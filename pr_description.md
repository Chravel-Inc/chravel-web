Title: 🧹 Code Health: Implement scaffold for Google Play Billing provider

Description:

🎯 **What:** The `src/billing/providers/index.ts` file previously had a TODO to implement the `GooglePlayProvider`, and temporarily returned a stub implementation for Android devices with `BILLING_FLAGS.GOOGLE_BILLING_ENABLED`. This PR introduces the missing `GooglePlayProvider` class (`src/billing/providers/google.ts`) and updates the factory to return the newly implemented provider rather than the `androidBillingUnavailableProvider`.

💡 **Why:** By implementing a mirrored structure to `AppleIAPProvider` for Android, the code aligns cleanly with the repository's `BillingProvider` interface strategy, clearing out a tech debt TODO and structuring the app to be fully prepared for Android native execution implementations.

✅ **Verification:** Verified by checking types with `bun run typecheck`, running formatting checks with `npx prettier --check` (which passed successfully on the changed files), running the billing tests via `bun x vitest src/billing` which passed cleanly, and manually verifying the implementation matched the expected interface.

✨ **Result:** A fully formed Android scaffolding solution mirroring iOS that allows proper feature flags to gate Google Play functionality once native API connections are built without needing to rebuild the interface logic inside `src/billing/providers/index.ts`.
