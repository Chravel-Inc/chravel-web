# PostHog project API key rotation + Vercel env

Use after removing the hardcoded `phc_` fallback from `src/telemetry/service.ts`.

## Why

The project API key (`phc_…`) is a **write-only** ingest token. It is safe to ship in the browser **only** when you control rotation after exposure. It was previously hardcoded in the client bundle; rotate it and inject via `VITE_POSTHOG_API_KEY`.

## A) Human instructions

### 1. Rotate the PostHog project API key

1. Open [ChravelApp project settings](https://us.posthog.com/project/464040/settings/project-details) (org ChravelApp).
2. Scroll to **Danger zone**.
3. Click **Reset project API key**.
4. Confirm. The old `phc_` token is invalidated immediately.
5. Copy the **new** project API key.

API alternative (personal API key with `project:write`):

```bash
curl -X PATCH \
  -H "Authorization: Bearer $POSTHOG_PERSONAL_API_KEY" \
  https://us.posthog.com/api/organizations/019cdcbb-e66a-0000-20e0-22005483a3a3/projects/464040/reset_token/
```

Response includes the new `api_token`.

### 2. Set Vercel env (production + preview)

1. Open the Chravel Vercel project → **Settings → Environment Variables**.
2. Set:
   - `VITE_POSTHOG_API_KEY` = `<new phc_…>`
   - `VITE_POSTHOG_HOST` = `https://us.i.posthog.com` (if not already set)
3. Apply to **Production** and **Preview**.
4. Redeploy the latest production/preview deployment (env is baked at build time for Vite).

### 3. Verify

1. Load production → DevTools Network → confirm PostHog `/i/v0/e` (or similar) requests succeed with the new key.
2. In PostHog Live events, confirm events arrive after a page view.
3. Confirm the old key returns ingest rejection (optional: send a test capture with the old token).

## B) AGENTIC BROWSER SCRIPT

```
1. Navigate to https://us.posthog.com/project/464040/settings/project-details
2. Sign in if prompted (ChravelApp org).
3. Scroll to Danger zone.
4. Click "Reset project API key" → confirm dialog.
5. Copy the new api_token value shown.
6. Open a new tab → Vercel dashboard for chravel-web (or Chravel production project).
7. Go to Settings → Environment Variables.
8. Add or edit VITE_POSTHOG_API_KEY for Production and Preview = pasted token.
9. Ensure VITE_POSTHOG_HOST=https://us.i.posthog.com exists.
10. Deployments → … on latest Production → Redeploy (clear build cache optional).
11. Open https://chravel.app (or production URL), hard refresh, confirm PostHog network calls 200.
```

## Notes

- Do **not** commit the new key to git.
- Rotating without updating Vercel first causes a telemetry outage until redeploy.
- Cloud Agent Vercel MCP requires desktop IDE auth; this runbook is the fallback when MCP is `needsAuth`.
