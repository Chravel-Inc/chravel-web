

# Fix Trip Card Text Colors in Light Mode

## Problems
1. **Location and date text turns black** in light mode — they use `text-white/80` which gets overridden to `rgba(0,0,0,0.8)` by the global `.light .text-white\/80` rule. The existing `.light .dark-section .text-white` protection doesn't cover `text-white/80`.
2. **Title turns gold on hover** via `group-hover:gold-gradient-text` — removing this per request.

## Fix

### 1. `src/components/TripCard.tsx` — Two changes

**Line 422** — Remove `group-hover:gold-gradient-text` from the title:
```
- text-white group-hover:gold-gradient-text transition-all duration-300
+ text-white transition-all duration-300
```

**Lines 468, 473** — Change location and date from `text-white/80` to `text-white`:
```
- text-white/80
+ text-white
```

### 2. `src/index.css` — Add dark-section protection for `text-white/80`

Add to the existing dark-section rules:
```css
.light .dark-section .text-white\/80 {
  color: rgba(255, 255, 255, 0.8);
}
```

This ensures any future `text-white/80` inside dark-section areas also stays white-ish in light mode.

## Scope
- All trip types (consumer, pro, event) use `TripCard.tsx`
- All viewports (mobile, tablet, desktop)
- Dark mode unaffected

