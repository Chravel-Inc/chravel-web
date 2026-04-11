

## Revised Plan: Fix Hotel Photos + "Open in Maps"

### Issue 1: Hotel Photos Not Loading

**Root cause:** `fetchToImageResponse` uses `redirect: 'error'` (line 35). Google Places Photo API v1 returns a 302 redirect. The fetch throws on redirect, returning 500 to the browser.

**Fix (two layers of protection):**

1. **`supabase/functions/image-proxy/index.ts`** — Refactor `fetchToImageResponse` to accept a `redirectPolicy` parameter (default `'error'` for SSRF safety on generic URLs). In the placePhotoName code path:
   - Add `skipHttpRedirect=true` to upstream params (tells Google to return bytes directly)
   - Pass `redirect: 'follow'` as the redirect policy (safe because the upstream URL is hardcoded to `places.googleapis.com`, not user-controlled — no SSRF risk)
   - This means if `skipHttpRedirect` is ever ignored, the redirect still works

2. **No new env vars or API key scopes needed** — `skipHttpRedirect` is a standard Google Places Photo param, and `redirect: 'follow'` is a fetch option. The existing `GOOGLE_MAPS_API_KEY` already has Places Photo access.

3. **Rollback:** Revert the single file. The generic URL proxy path remains unchanged (`redirect: 'error'`).

**Verification:** After deploy, use `supabase--curl_edge_functions` to hit the image-proxy with a known `placePhotoName` and confirm HTTP 200 with `content-type: image/*`.

### Issue 2: "Open in Maps" Blocked

**Root cause:** Lovable preview runs in a sandboxed iframe missing `allow-popups`. Both `<a target="_blank">` and `window.open()` are blocked. This is a **preview-only limitation** — production (`chravel.app`) works correctly.

**Fix in `src/features/chat/components/PlaceResultCards.tsx`:**
- Replace `<a target="_blank">` with a `<button>` that attempts `window.open()`
- When blocked (returns `null`), copy URL to clipboard with inline feedback: **"Copied! Paste in your browser"** (not a generic toast — this will be the primary path in preview)
- On production where `window.open()` succeeds, the button behaves like the original link

**Testing note:** This fix cannot be verified in the Lovable preview. The clipboard fallback is the only working path in preview. Real navigation must be tested on `chravel.app`.

### Summary

| File | Change |
|------|--------|
| `supabase/functions/image-proxy/index.ts` | Add `skipHttpRedirect=true` + pass `redirect: 'follow'` for placePhotoName path only |
| `src/features/chat/components/PlaceResultCards.tsx` | `window.open()` + clipboard fallback with inline "Copied!" message |

**Deploy:** `image-proxy` edge function

**Verification steps:**
1. `curl` the image-proxy with a real `placePhotoName` → expect 200 + image bytes
2. In preview: confirm hotel photos render; confirm "Open in Maps" copies link with inline feedback
3. On production: confirm "Open in Maps" opens Google Maps in new tab

