## Diagnosis

The hero MP4 itself is fine: H.264 1920×1080, 60s, 1.15 Mbps, faststart-muxed, 8.3 MB. The **poster renders** because the file loads — but the video element's autoplay silently fails on desktop browsers and in the Lovable preview iframe.

Three concrete causes:

1. **No `play()` promise handling in `HeroSection.tsx`.** `<video autoplay>` returns a rejected promise from its internal `play()` when blocked. `onError` only fires for load/decode failures, not autoplay rejections — so the poster sits there forever with no signal. Mobile Safari/Chrome are more permissive with muted + `playsInline` autoplay, which is why mobile "works".
2. **Lovable preview iframe lacks `allow="autoplay"`.** That permission is set by Lovable's outer wrapper, not by our code, so we can't fix it inside the iframe — but we *can* give visitors a way to start it manually.
3. **No user-interaction fallback.** When autoplay is denied, there's currently no UI for the visitor to start playback.

## Fix (single file: `src/components/landing/sections/HeroSection.tsx`)

1. Add `videoRef` and a `useEffect` that calls `videoRef.current.play()` explicitly with `.catch()`.
2. Add an `autoplayBlocked` state. On `.play()` rejection, overlay a translucent centered play-button on top of the still-rendered `<video>` (poster visible). One click invokes `play()` again under user gesture — guaranteed to satisfy autoplay policy.
3. Trigger the first play attempt via `IntersectionObserver` when the hero scrolls into view (handles tab-switch and slow first-paint cases where the autoplay heuristic has already decided).
4. Retry once on the video's `canplay` event if the initial attempt failed before metadata loaded.
5. Keep existing `onError` → poster-only fallback for true file/decode failures (unchanged behavior for 404s).

## Verify

1. `npm run typecheck` passes.
2. Update `HeroSection.video.test.tsx` to:
   - assert `videoRef.current.play()` is invoked on mount/intersection
   - assert the play-button overlay renders when the play promise rejects
   - keep the existing onError → poster fallback assertion
3. Manual: open desktop preview, desktop published URL, and mobile. Confirm:
   - Desktop published: video autoplays on scroll-in (or shows click-to-play if browser blocks).
   - Lovable preview iframe: poster + play overlay; one click starts it.
   - Mobile: autoplays as today (no regression).
4. Visit `/?sw=off` once if a stale service worker is suspected (rare; current preview console doesn't show one).

## Out of scope (surfaced, not fixed)

- The Lovable preview iframe's missing `allow="autoplay"` — that's controlled by Lovable's outer page, not us. The click-to-play overlay is the correct in-iframe mitigation.
- Re-encoding the MP4 / adding WebM source — the bytes already arrive fine; the problem is the play decision, not download.

## Risk

LOW. One component file + its matching test. No deps, no schema, no auth/RLS, no asset regeneration.