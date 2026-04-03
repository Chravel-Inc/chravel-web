

# Replace Create Trip Screenshot on Landing Page

## What
Replace the old navy-blue "Create New Trip" screenshot in the marketing landing page with the new black/gray/gold design screenshot that matches the current app aesthetic.

## Change

### 1. Copy uploaded image to project
- Copy `user-uploads://IMG_4045.jpg` to `src/assets/app-screenshots/create-trip-modal-v3.png`

### 2. Update import in `src/components/landing/sections/ProblemSolutionSection.tsx`
- **Line 4**: Change import from `create-trip-modal-v2.png` to `create-trip-modal-v3.png`

That's it — the new image flows into both desktop and mobile views automatically since both reference the same `createNewTrip` variable.

## Risk
**LOW** — asset swap only, no logic change.

