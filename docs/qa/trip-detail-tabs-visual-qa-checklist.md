# Trip Detail Tabs Visual QA Checklist

Use this checklist after any UI/theme changes that can affect trip detail surfaces.

## Scope
- Chat tab
- Calendar tab
- Payments tab
- Places tab
- Polls tab
- Tasks tab
- Create Trip modal
- Share Trip modal

## Environment Matrix
- Theme: Dark + Light
- Viewports: 390×844 (mobile), 768×1024 (tablet), 1440×900 (desktop)
- States per surface: loading, empty, success, and error (if available)

## Pass Criteria (all required)
1. **Contrast baseline (text/actions):**
   - Body and control text meets at least WCAG AA contrast (4.5:1 normal text, 3:1 large text/icon UI).
   - Primary actions, secondary actions, and interactive labels remain readable in both themes.
2. **No dark-on-dark controls in light mode:**
   - Button text/icons never blend into dark backgrounds on hover/focus/active.
   - Specifically validate Copy/Share actions in Invite + Share modals across default and hover states.
3. **No pure-white glare target:**
   - Large surfaces (cards, modal bodies, tab backgrounds) should avoid pure `#FFFFFF` fills for dominant areas.
   - Target off-white backgrounds (for example `hsl(0 0% 95-98%)`) to reduce glare on mobile.
4. **Tap target ergonomics:**
   - Interactive controls are at least 44×44px on mobile.
5. **State integrity:**
   - Loading/empty/error/success visuals are distinct and legible in both themes.

## Per-Surface Checklist

### 1) Chat tab
- [ ] Message text and metadata are readable in dark/light themes.
- [ ] Composer input, send button, and attachment controls meet contrast baseline.
- [ ] Hover/focus/pressed states do not invert into low-contrast combinations.

### 2) Calendar tab
- [ ] Event cards and date/time chips keep readable text at all viewport sizes.
- [ ] Empty-state and loading skeletons are visually distinct from background.

### 3) Payments tab
- [ ] Balance cards, settlement actions, and labels keep AA contrast.
- [ ] Positive/negative status colors remain legible in both themes.

### 4) Places tab
- [ ] Place cards, category chips, and action controls pass contrast checks.
- [ ] External link and map actions remain visually obvious on mobile.

### 5) Polls tab
- [ ] Poll choices, percentages, and vote buttons remain readable in both themes.
- [ ] Selected and unselected states are visually distinct.

### 6) Tasks tab
- [ ] Task rows, assignee chips, due dates, and completion states are readable.
- [ ] Checkbox/toggle states remain clear in dark/light themes.

### 7) Create Trip modal
- [ ] Form labels/placeholders/help text are readable.
- [ ] Primary submit + secondary cancel styles pass contrast and tap size checks.
- [ ] Modal surface does not present pure-white glare in light mode.

### 8) Share Trip modal
- [ ] Share action buttons (Copy/Share/Email/social) remain legible in dark/light.
- [ ] Preview link field text remains readable and not washed out.
- [ ] Hover/focus states avoid low-contrast pairings.

## Manual Verification Notes Template
- Date tested:
- Build/branch:
- Device + browser:
- Theme(s) verified:
- Surfaces tested:
- Failing items (if any):
- Screenshots/evidence:
