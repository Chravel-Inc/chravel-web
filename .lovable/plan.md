

## Changes

### 1. `src/components/todo/TaskFilters.tsx` — unify All/Open/Completed buttons
The three buttons currently render the same shape (rounded-full, px-3, py-2), but the active "Completed" button visually stands out due to the blue fill making it appear larger/heavier. The screenshot shows they're actually all identical pill shapes — what differs is just the active color. The user's perception of "different shapes" likely comes from the blue active state being visually dominant.

Looking again at the screenshot: All and Open look like dark circles with no visible text padding, while Completed is a wider blue pill. The cause: `text-slate-300` on `bg-slate-700` has very low contrast — the text "All" and "Open" is barely visible, making the buttons read as round dots rather than pills.

**Fix:** Standardize all three to the active "Completed" pill shape and ensure text is always readable. Use consistent `min-w` so each button has the same width regardless of label length, brighter inactive text color, and use the gold accent (per Chravel design system) instead of blue for the active state.

- Replace inactive `bg-slate-700 text-slate-300` → `bg-gray-800/80 text-white border border-gray-700`
- Replace active `bg-blue-600 text-white` → `bg-gradient-to-r from-amber-500 to-amber-600 text-black` (matches gold design language)
- Add `min-w-[88px]` and `justify-center` so all three pills are the same width
- Keep `rounded-full px-4 py-2 min-h-[44px] text-xs font-medium`

### 2. `src/components/places/BasecampsPanel.tsx` line 388 — match Trip Base Camp button to Personal
Replace the amber-filled Trip Base Camp button with the same gray + gold-ring treatment used by Personal Base Camp on line 477.

- Old: `bg-amber-500 hover:bg-amber-600 text-black py-1.5 px-3 rounded-lg transition-colors flex items-center justify-center gap-2 text-xs font-medium min-h-[44px]`
- New: `bg-gray-800/80 text-white cta-gold-ring py-1.5 px-3 rounded-lg transition-all flex items-center justify-center gap-2 text-xs font-medium min-h-[44px] hover:opacity-90 hover:scale-[1.01] active:scale-[0.99]`

## Risk
**LOW** — pure styling. No logic changes, no prop changes, no data flow.

## Verification
- Tasks tab: confirm All/Open/Completed are identical pill shapes & widths; active uses gold not blue.
- Places > Base Camps: Trip Base Camp button visually matches Personal Base Camp button (gray with gold ring).
- Both desktop and mobile widths render correctly.

