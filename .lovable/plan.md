

## Product Launch Video v2 — Real Screenshots + chravel.app branding

### Overview
Build a new ~30-second product launch video using real app screenshots (both mobile and web desktop) embedded in the Remotion composition. Fix the `chravel.com` → `chravel.app` domain issue. Also fix the `PendingTripCard.tsx` build error as a prerequisite.

### Prerequisites (fix build error)
**File: `src/components/trip/PendingTripCard.tsx`**
- Remove duplicate `ctaVariant` on line 26 and duplicate `ctaVariant` on line 47
- Remove duplicate `disabledCta` on line 48 and the `const disabledCta` redeclaration on line 50

### Video Architecture

**Duration:** 30 seconds at 30fps = 900 frames (keeps within 600s render timeout)

**Assets to copy into `remotion/public/screenshots/`:**
- Mobile: 8 screenshots from `appstore/screenshots/iPhone-6.7/` (raw simulator captures)
- Web: Capture 4 desktop screenshots from chravel.app using browser tools, save into the remotion public folder

**Scene breakdown (7 scenes):**

| # | Scene | Duration | Content |
|---|-------|----------|---------|
| 1 | Logo Reveal | 3s (90f) | Reuse existing `LogoReveal` component |
| 2 | "Group Travel Made Easy" text | 3s (90f) | Reuse `TextReveal` with updated copy |
| 3 | Web Dashboard Showcase | 5s (150f) | Desktop screenshot in a browser frame mockup showing the trip dashboard — establishes "this is a real app" |
| 4 | Mobile Feature Carousel | 8s (240f) | Cycle through 4 mobile screenshots (Chat, Calendar, AI Concierge, Expense Splitting) in a PhoneFrame, each showing for ~2s with slide transitions |
| 5 | Web + Mobile Side-by-Side | 5s (150f) | Desktop screenshot on left, phone on right — shows cross-platform story |
| 6 | Mobile Feature Carousel 2 | 4s (120f) | Cycle through remaining 4 screenshots (Maps, Media, Polls, Home) |
| 7 | CTA / End Card | 4s (120f) | Updated `CallToAction` with `chravel.app` + EndCard |

**Total with transitions:** ~900 frames (30s)

### New Components to Create

1. **`remotion/src/compositions/ProductLaunchV2.tsx`** — Main composition orchestrating all scenes
2. **`remotion/src/components/BrowserFrame.tsx`** — Desktop browser window mockup (dark chrome, address bar showing `chravel.app`, rounded corners, shadow) to display web screenshots
3. **`remotion/src/components/ScreenshotShowcase.tsx`** — Displays a screenshot inside either a PhoneFrame or BrowserFrame with entrance animation
4. **`remotion/src/components/ScreenshotCarousel.tsx`** — Cycles through multiple screenshots with slide transitions, showing a label for each feature

### Modifications

- **`remotion/src/components/CallToAction.tsx`** — Change `chravel.com` to `chravel.app` (line 139)
- **`remotion/src/Root.tsx`** — Register the new `ProductLaunchV2` composition

### Screenshot Capture Strategy

Since screenshots can't be directly saved from browser tools to the filesystem, I'll use a Python script to:
1. Copy the existing mobile screenshots from `appstore/screenshots/iPhone-6.7/` into `remotion/public/screenshots/mobile/`
2. For web screenshots, I'll take screenshots via the browser of the live `chravel.app` site and save them to `remotion/public/screenshots/web/`

Alternatively, since chravel.app loads correctly in the browser, I can use `fetch_website` with screenshot format to capture web pages.

### Render Process

Use the existing remotion setup with the programmatic render script pattern:
1. Copy mobile screenshots to `remotion/public/screenshots/`
2. Capture web screenshots to `remotion/public/screenshots/`
3. Build all components
4. Render via `cd remotion && node scripts/render-remotion.mjs` targeting the new composition
5. Output to `/mnt/documents/chravel-product-launch-v2.mp4`

### Key Differences from Previous Video
- **Real screenshots** instead of mock UI components drawn in code
- **Both web desktop and mobile** versions shown
- **`chravel.app`** consistently used everywhere (fixes the `.com` bug)
- **Shorter** (30s vs 60s) — punchier, more focused
- **Browser frame** for web screenshots adds credibility
- Same Chravel dark/gold design language throughout

### Technical Notes
- Screenshots referenced via `staticFile('screenshots/mobile/01-home-dashboard.png')` etc.
- `<Img>` component from Remotion ensures assets load before rendering
- No `backdropFilter` (sandbox constraint)
- `muted: true` in render script (sandbox ffmpeg constraint)
- `concurrency: 1` for stability

