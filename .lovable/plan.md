

# Fix: Pointy Shadow Corners on TripViewToggle (My Trips / Pro / Events)

## Why This Happens

Both the left bar (`TripViewToggle`) and right bar (`TripActionBar`) use the same classes: `bg-card/50 backdrop-blur-xl rounded-2xl shadow-lg`. The difference is that `TripViewToggle` renders through a **Radix ToggleGroup primitive**, which creates an additional compositing layer. In light mode, the semi-transparent `bg-card/50` combined with `backdrop-blur-xl` creates a WebKit rendering bug where the blur layer doesn't clip properly to `rounded-2xl` — the blur bleeds past the border-radius, making the shadow corners appear square/pointy.

The `TripActionBar` (right side) uses a plain `<div>`, which doesn't trigger the same compositing issue, so its corners render smoothly.

## Fix

### `src/components/home/TripViewToggle.tsx` (line 48)

Add `overflow-hidden isolate` to the ToggleGroup className. This forces WebKit to create a proper stacking context that respects the border-radius clip on the backdrop-blur layer.

**Before:**
```
bg-card/50 backdrop-blur-xl rounded-2xl p-1 shadow-lg grid ...
```

**After:**
```
bg-card/50 backdrop-blur-xl rounded-2xl p-1 shadow-lg overflow-hidden isolate grid ...
```

### `src/index.css` — Safety net for all light-mode rounded containers with backdrop-blur

Add a general light-mode fix so any other `rounded-2xl` + `backdrop-blur-xl` combos don't exhibit the same bug:

```css
.light .rounded-2xl.backdrop-blur-xl {
  -webkit-transform: translateZ(0);
  isolation: isolate;
}
```

## Files Changed

| File | Change |
|------|--------|
| `src/components/home/TripViewToggle.tsx` | Add `overflow-hidden isolate` to ToggleGroup |
| `src/index.css` | Add light-mode GPU compositing fix for rounded+blur combos |

## Risk
Low. `overflow-hidden` is appropriate here (content is fully contained). `isolate` is a CSS containment hint with no visual side effects. Dark mode unaffected.

