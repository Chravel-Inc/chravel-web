---
name: browser-harness
description: Drive a real Chrome browser via Chrome DevTools Protocol for automation, scraping, testing, or UI verification. Use when a task needs actual browser interaction — clicking, screenshotting, navigating, executing JS in a live page — rather than HTTP fetches. Triggers on "open in browser", "screenshot the page", "click through", "scrape this site", "automate the browser", "drive Chrome", "CDP", "browser automation".
user-invocable: false
---

# browser-harness

Lightweight CDP bridge (~600 LOC of Python) that connects Claude directly to a running Chrome/Edge over a single WebSocket. Installed globally via `uv tool install -e ~/browser-harness`; invoked as `browser-harness` on `$PATH`.

## Invocation

```bash
browser-harness <<'PY'
# helpers pre-imported; daemon auto-starts
new_tab("https://example.com")
wait_for_load()
print(page_info())
PY
```

- No `cd`, no `uv run` — `browser-harness` is already on `$PATH`.
- **First navigation is `new_tab(url)`**, not `goto(url)`. `goto` runs in the user's active tab and clobbers their work.
- `run.py` calls `ensure_daemon()` before `exec`; don't start/stop manually.

## Core helpers (pre-imported)

Navigation: `new_tab(url)`, `goto(url)`, `wait_for_load()`
Interaction: `click(x, y)`, `screenshot()`, `js(...)`
Info: `page_info()`
Low-level: `cdp(domain, method, **params)`
Remote: `start_remote_daemon()`, `list_cloud_profiles()`, `list_local_profiles()`, `sync_local_profile()`

Read `~/browser-harness/helpers.py` (~195 lines) for the full surface.

## Browser target in this environment

**This sandbox is headless — there is no local Chrome.** Any call that expects a live browser (`page_info`, `goto`, `click`, `screenshot`) will fail with a CDP connection error unless you go remote.

Use cloud browser. Requires `BROWSER_USE_API_KEY` in the environment:

```bash
BU_NAME=work browser-harness <<'PY'
start_remote_daemon("work")                               # clean browser, no profile
# start_remote_daemon("work", profileName="my-work")      # reuse a logged-in cloud profile
# start_remote_daemon("work", proxyCountryCode="de")      # regional proxy
new_tab("https://example.com")
print(page_info())
PY
```

Free tier at `cloud.browser-use.com`: 3 concurrent browsers, no credit card. The daemon prints `liveUrl` so a human can watch.

For parallel sub-agents, give each a distinct `BU_NAME` — each gets its own isolated remote browser.

## Before inventing anything

Search `~/browser-harness/domain-skills/` first for the target domain.
If a specific mechanic is giving trouble (iframes, dialogs, downloads, drag-and-drop, dropdowns, cross-origin, profile sync, network requests, PDFs, cookies), check `~/browser-harness/interaction-skills/`.

## Reinstall / repair

If `command -v browser-harness` stops resolving:

```bash
cd ~/browser-harness && uv tool install -e . && uv sync
```

If the websocket is stale: `restart_daemon()` inside a harness invocation.

## Links

- Upstream: https://github.com/browser-use/browser-harness
- Local clone: `~/browser-harness`
- Canonical usage doc: `~/browser-harness/SKILL.md`
- Helpers: `~/browser-harness/helpers.py`
- Install notes: `~/browser-harness/install.md`
