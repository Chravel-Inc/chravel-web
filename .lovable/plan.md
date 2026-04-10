
Goal: restore concierge requests in preview and confirm dictation remains free.

What I found
- Dictation paywall is already removed in source: `src/components/AIConciergeChat.tsx` passes `isVoiceEligible={true}` into `AiChatInput`. The lock icon only appears when `VoiceButton` receives `isEligible={false}`, so if you still saw a lock, the preview was likely stale/cached rather than the current code path.
- The remaining failure is CORS, not request parsing. Console and network traces show both the concierge health ping and the real concierge POST fail with browser-level `Failed to fetch`.
- The active browser origin is `https://20feaa04-0946-4c68-a68d-0eb88cc1b9c4.lovableproject.com`.
- Shared CORS in `supabase/functions/_shared/cors.ts` allows `chravel.app`, localhost, and `.lovable.app`, but not the active `.lovableproject.com` origin. That means the browser blocks the edge-function response before `lovable-concierge` can process the request.

Implementation plan
1. Fix the shared CORS allowlist
   - File: `supabase/functions/_shared/cors.ts`
   - Add the exact active preview origin `https://20feaa04-0946-4c68-a68d-0eb88cc1b9c4.lovableproject.com` using `ADDITIONAL_ALLOWED_ORIGINS` (preferred) or an exact-code fallback.
   - Do not add wildcard `.lovableproject.com`.

2. Add regression tests
   - File: `supabase/functions/_shared/__tests__/cors.security.test.ts`
   - Add coverage that:
     - allows the exact approved `.lovableproject.com` origin
     - rejects unrelated `https://evil.lovableproject.com`
   - Keep unauthorized shared-host origins blocked.

3. Redeploy the affected edge functions
   - Minimum: `lovable-concierge` and `google-maps-proxy`
   - Reason: the concierge request and startup health checks both depend on the shared CORS helper.

4. Improve diagnostics for next time
   - Files: `src/services/conciergeGateway.ts`, optionally `src/services/apiHealthCheck.ts`
   - Mirror the existing `tripService` pattern so raw `Failed to fetch` becomes a clearer preview-origin/CORS diagnostic for engineers while keeping user-facing messaging simple.

5. Verify end-to-end
   - Hard refresh the preview after deploy.
   - Confirm the dictation button is unlocked.
   - Confirm `ping` to `lovable-concierge` succeeds from the preview.
   - Re-run the same “add these flights to my calendar” request and confirm it no longer falls back to “Sorry, I encountered an error processing your request.”
   - Confirm `Access-Control-Allow-Origin` echoes the preview origin.

Technical note
- There is a separate security inconsistency in the current repo: tests say random `*.lovable.app` origins should be rejected, but runtime code still contains a `.lovable.app` suffix matcher. I’ll keep this fix surgical and avoid widening CORS further; if needed, I can follow with a separate hardening pass to move all preview access to exact env-managed origins only.
