
# Fix: NativeTabBar Black Background in Light Mode

## Problem
The bottom tab bar (`NativeTabBar.tsx`, line 123) uses a hardcoded dark color `bg-[#1c1c1e]/95` — iOS system dark gray. This stays black regardless of light/dark mode.

## Changes

### 1. `src/index.css` — Add light mode override

Add a CSS override for the hardcoded NativeTabBar background:

```css
.light .bg-\[\#1c1c1e\]\/95 {
  background-color: hsl(0 0% 88% / 0.95);
}
```

This maps to the same light gray family used by other light-mode overrides (consistent with the tab bar, trip cards, etc.).

Also override the border color (currently `border-white/10` which is invisible in light mode):

```css
.light .border-white\/10 {
  border-color: rgba(0, 0, 0, 0.08);
}
```

And the inactive tab text (`text-white/60`) needs to be dark in light mode:

```css
.light .text-white\/60 {
  color: rgba(0, 0, 0, 0.5);
}
```

### 2. Verify gold-gradient-icon in light mode
The active tab icons use `gold-gradient-icon` — this should remain gold in both modes (no change needed).

## Files Changed

| File | Change |
|------|--------|
| `src/index.css` | Add `.light` overrides for `bg-[#1c1c1e]/95`, `border-white/10`, `text-white/60` |

## Risk
Low. CSS-only, scoped to `.light`. Dark mode untouched. No runtime behavior change.
