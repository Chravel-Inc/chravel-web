

# Fix Trip Card Dark Shadow Corners in Light Mode

## Problem
The TripCard's `shadow-lg` and `hover:shadow-2xl` use default Tailwind shadows (black with ~10-25% opacity). In light mode, these dark shadows create visible angular artifacts at the card corners — especially noticeable on hover when `scale-[1.02]` enlarges the card. The effect looks like "fitting a round thing in a square box."

## Root Cause
Line 400 in `src/components/TripCard.tsx`:
```
shadow-lg md:shadow-black/20 hover:shadow-2xl
```
Tailwind's `shadow-lg` = `0 10px 15px rgb(0 0 0 / 0.1), 0 4px 6px rgb(0 0 0 / 0.1)` — the spread creates visible dark corners on a light background. The `md:shadow-black/20` compounds this.

## Fix

### 1. `src/index.css` — Add light-mode shadow overrides for trip cards

Add these rules to the light-mode utility overrides section:

```css
/* Trip card shadows — soften for light backgrounds */
.light .shadow-lg {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.06);
}
.light .shadow-black\/20 {
  box-shadow: none;
}
.light .hover\:shadow-2xl:hover {
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
}
```

This replaces the heavy dark shadows with subtle, softer ones that won't create visible corner artifacts on the light gray background. The shadows become barely-there elevation hints instead of dark splotches.

### 2. Scope
- Applies globally to all trip card types (consumer, pro, event) since they all use the same `TripCard` component
- Works across all viewports (mobile, tablet, desktop) because the CSS overrides apply universally under `.light`
- No component file changes needed — CSS-only fix

### Technical Details
- The `.light` class overrides intercept Tailwind utility classes and replace their computed values
- `shadow-black/20` override removes the extra desktop shadow entirely in light mode (unnecessary on light backgrounds)
- The softer shadow values (6-8% opacity vs 10-25%) eliminate the visible corner contrast

