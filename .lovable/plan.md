

# Fix: Light Mode Visual Issues on Home Screen + Trip Cards

## Issues to Fix (4 items)

### 1. Dark corner shadows on "My Trips / Pro / Events" toggle bar
**Cause:** `TripViewToggle.tsx` line 48 applies `shadow-lg` to the ToggleGroup container. On light backgrounds, this creates visible dark shadow artifacts at the rounded corners.
**Fix:** Remove `shadow-lg` from the ToggleGroup className, or replace with a very subtle shadow (`shadow-sm`).

### 2. Trip title text is black while location/dates are white on cover photo
**Cause:** The CSS override `.light .text-white { color: hsl(0 0% 10%); }` catches the trip title (`text-white` on line 422 of TripCard.tsx), turning it black. But location/dates use `text-white/80` (line 468, 473), which has NO light-mode override — so they stay white. Text on the cover photo overlay should always be white regardless of theme.
**Fix:** Wrap the cover photo section (the `relative h-32 md:h-48` div) in a `dark-section` class. The existing `.light .dark-section .text-white` rule already preserves white text inside `.dark-section`. This keeps all cover text white on the dark gradient overlay.

### 3. Button contrast too harsh — buttons too dark against light cards
**Cause:** Buttons use `bg-gray-800/50` which in light mode inherits the `.light .bg-gray-800` override (`hsl(0 0% 95%)`) at 50% opacity. But the card itself uses `bg-white/5` which maps to `rgba(0,0,0,0.06)` — nearly transparent over the page background (`hsl(0 0% 80%)`). The result: buttons appear as solid dark gray blocks against a near-white card.
**Fix:** Add light-mode-specific overrides in `index.css`:
- `.light .bg-white\/5` → lighter card background (e.g. `rgba(0,0,0,0.03)` or a solid light gray like `hsl(0 0% 88%)`)
- `.light .bg-gray-800\/50` → lighter button background (e.g. `hsl(0 0% 84%)`) — just slightly darker than the card
- `.light .hover\:bg-gray-700\/50:hover` → matching hover state

### 4. "People / Days / Places" labels are white, hard to read
**Cause:** `CardStatItem.tsx` uses `text-white/60` for labels and `text-white` (bold) for numbers. In light mode, `text-white` → black (via override), but `text-white/60` has no override — stays as white at 60% opacity, nearly invisible on light backgrounds.
**Fix:** Add `.light .text-white\/60` and `.light .text-white\/80` overrides in `index.css` to map to dark text with appropriate opacity (e.g. `rgba(0,0,0,0.6)` and `rgba(0,0,0,0.8)`).

## Files to Change

1. **`src/components/home/TripViewToggle.tsx`** — Remove `shadow-lg` from ToggleGroup className (line 48)
2. **`src/components/TripCard.tsx`** — Add `dark-section` class to the cover photo container div (line 405)
3. **`src/index.css`** — Add light mode overrides for:
   - `.light .text-white\/60` → `rgba(0,0,0,0.6)`
   - `.light .text-white\/80` → `rgba(0,0,0,0.8)`
   - `.light .bg-white\/5` → lighter card bg
   - `.light .bg-gray-800\/50` → lighter button bg
   - `.light .hover\:bg-gray-700\/50:hover` → lighter hover

## Note
The user's message got cut off at "then when you're in the chat window in light mode" — once they share the rest, we can address that too.

## Risk
Low. CSS-only changes for light mode + one className addition. No runtime behavior change. Dark mode untouched.

