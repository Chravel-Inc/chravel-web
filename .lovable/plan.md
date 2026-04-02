

# Move Exit Demo Button to Top-Left on Mobile

## Problem
On mobile/PWA, the "Exit Demo" button is fixed to the **bottom-right** corner (`bottom: 80px + safe-area-inset-bottom`, `right: 12px`), where it overlaps content and interferes with the bottom navigation bar.

## Fix
Change the mobile positioning from bottom-right to **top-left**, tucked just below the iOS status bar using `env(safe-area-inset-top)`.

## Change — `src/components/demo/ExitDemoButton.tsx`

**Line 38** — Swap Tailwind classes:
- From: `bottom-20 right-3`
- To: `top-0 left-3`

**Lines 41–46** — Update inline style for mobile:
```typescript
style={
  isMobile
    ? {
        top: 'calc(env(safe-area-inset-top, 0px) + 4px)',
        left: 'calc(12px + env(safe-area-inset-left, 0px))',
      }
    : undefined
}
```

This places the button immediately under the iPhone status bar/notch area, left-aligned, out of the way of content and bottom nav. Desktop positioning (`top-4 right-4`) is unchanged.

