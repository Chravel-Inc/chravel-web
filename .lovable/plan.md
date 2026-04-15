

# Fix: Places Buttons — Match Tab Bar Style (Gray + Gold Ring)

## Problem
The "Set Your Location" and "Get Directions" buttons in the Places tab use solid amber/gold fills (`bg-amber-500`), creating a jarring visual mismatch with the rest of the UI. The tab bar buttons (Chat, Calendar, Places, etc.) use a subtle gray background with a signature gold ring border — these CTA buttons should follow the same pattern.

## Changes

### 1. "Set Your Location" button — `src/components/places/BasecampsPanel.tsx` (line 477)

**Current:** `bg-amber-500 hover:bg-amber-600 text-black`
**New:** Gray background + gold ring using existing `cta-gold-ring` class:
```
bg-gray-800/80 text-white cta-gold-ring hover:opacity-90 hover:scale-[1.01] active:scale-[0.99] transition-all
```
This gives it a dark button with gold ring in dark mode. The existing `.light .bg-gray-800\/80` override (from prior fixes) maps it to `hsl(0 0% 84%)` in light mode — matching the tab bar button shade. The `cta-gold-ring` class provides the signature gold gradient border in both modes.

### 2. "Get Directions" button — `src/components/places/DirectionsEmbed.tsx` (line 274-282)

**Current:** Uses default `<Button>` (which renders as the shadcn primary variant — likely amber/gold fill).
**New:** Override className to use the same gray + gold ring treatment:
```
className="w-full bg-gray-800/80 text-white cta-gold-ring hover:opacity-90 hover:scale-[1.01] active:scale-[0.99] transition-all border-0"
```

### 3. Light mode text protection — `src/index.css`

The `cta-gold-ring` buttons use `text-white`. The existing `.light .text-white` override turns this dark, which is correct for light mode (dark text on gray button). No additional CSS needed.

## Files Changed

| File | Change |
|------|--------|
| `src/components/places/BasecampsPanel.tsx` | "Set Your Location" button: amber fill → gray + gold ring |
| `src/components/places/DirectionsEmbed.tsx` | "Get Directions" button: default primary → gray + gold ring |

## Risk
Low. Two className changes. No runtime behavior change. Both dark and light modes benefit from existing overrides.

