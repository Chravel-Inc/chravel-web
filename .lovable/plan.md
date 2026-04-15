

# Light Mode Visual Consistency Fixes

## Summary

Multiple light mode styling inconsistencies across the home screen, chat, concierge, and calendar. The core issue: components use different dark-mode utility classes that don't all have light-mode overrides, creating jarring visual contrast mismatches.

## Changes

### 1. Add `shadow-lg` to TripViewToggle (match TripActionBar)

**File:** `src/components/home/TripViewToggle.tsx` (line 48)

The TripActionBar container has `shadow-lg` which creates the nice pop effect. The TripViewToggle's `ToggleGroup` container lacks it. Add `shadow-lg` to the ToggleGroup className.

### 2. MessageTypeBar — lighter background to match Invite/PDF Recap buttons

**File:** `src/features/chat/components/MessageTypeBar.tsx` (line 78)

The segmented control container uses `bg-neutral-900/70` which maps to a very dark gray in light mode. Change to use a class that maps to the same shade as the Invite/PDF Recap buttons (`bg-gray-800/50` which maps to `hsl(0 0% 84%)` in light mode via existing override).

### 3. Chat input CTA buttons (emoji, dictation, +, send) — lighter backgrounds

**File:** `src/features/chat/components/ChatInput.tsx` (line 36) and `src/lib/ctaButtonStyles.ts`

These buttons use `bg-gray-800/80` via `CTA_GRADIENT`. In light mode, `bg-gray-800` maps to `hsl(0 0% 95%)` but at 80% opacity it blends oddly. Add a light mode override for `.light .bg-gray-800\/80` to match the Invite/PDF Recap button shade (`hsl(0 0% 84%)`).

**File:** `src/index.css` — add override:
```css
.light .bg-gray-800\/80 {
  background-color: hsl(0 0% 84%);
}
```

### 4. AI Concierge CTA buttons (search, dictation, send, upload) — same fix

These also use `CTA_GRADIENT` (`bg-gray-800/80`), so the same CSS override from step 3 fixes them automatically.

### 5. Leave Trip button — gray bg with red text/icon, matching Broadcasts red shade

**File:** `src/components/TripHeader.tsx` (line 784)

Change from `bg-red-600/20 hover:bg-red-600/30 border border-red-500/30 text-red-300` to `bg-gray-800/50 hover:bg-gray-700/50 border border-gray-700 hover:border-gray-600 text-[#EF4444]` — using the same gray bg as Invite/PDF Recap, with the red text matching `text-[#EF4444]` (same shade used by the Broadcasts inactive segment in MessageTypeBar).

### 6. AI Concierge header bar & input area — match tab bar gray

**File:** `src/components/AIConciergeChat.tsx`

- Line 298: Container `bg-black/40` — add light mode override to match the tab bar background
- Line 300: Header `bg-black/30` — add light mode override
- Line 502: Input area `bg-black/30` — add light mode override

**File:** `src/index.css` — add overrides:
```css
.light .bg-black\/40 {
  background-color: hsl(0 0% 88%);
}
.light .bg-black\/30 {
  background-color: hsl(0 0% 90%);
}
```

### 7. Concierge chat window background — match text entry field shade

The chat scroll area (line 443) has no explicit bg — it inherits from the `bg-black/40` container. The override in step 6 will unify them.

### 8. Outgoing messages in concierge — keep white text on blue

**File:** `src/features/chat/components/MessageRenderer.tsx` (line 204)

The outgoing bubble uses `bg-blue-600 text-white`. In light mode, `.light .text-white` overrides to dark. Need to add a `dark-section`-style protection or add specific override:

**File:** `src/index.css`:
```css
.light .bg-blue-600 .text-white,
.light .bg-blue-600.text-white {
  color: white;
}
```

Also for trip chat bubbles: `bg-chat-own` uses `--chat-bubble-own-foreground: 0 0% 100%` which should already be white, but `text-chat-own-foreground` may not be overridden. Verify and add if needed.

### 9. "Picked up where you left off" — darker text for readability

**File:** `src/components/AIConciergeChat.tsx` (line 449)

Currently `text-gray-500`. Add a light-mode specific override or change to a class that maps darker. Since `.light .text-gray-500` maps to `hsl(0 0% 45%)`, that's already fairly dark. But user wants it darker — change to `text-gray-700` which will be black enough in light mode.

### 10. Calendar action buttons (Import, Export, Month Grid, Add Event) — match tab bar buttons

**File:** `src/components/ui/ActionPill.tsx` (line 28-29)

Both variants use `bg-black/60 border border-white/30 text-white hover:bg-white/10`. In light mode, `bg-black/60` doesn't have an override, rendering as a very dark shade. Add light mode override:

**File:** `src/index.css`:
```css
.light .bg-black\/60 {
  background-color: hsl(0 0% 84%);
}
```

This makes them match the Invite/PDF Recap button shade.

### 11. Also add neutral-900/70 light override for MessageTypeBar

**File:** `src/index.css`:
```css
.light .bg-neutral-900\/70 {
  background-color: hsl(0 0% 84%);
}
```

## Files Changed Summary

| File | Change |
|------|--------|
| `src/components/home/TripViewToggle.tsx` | Add `shadow-lg` to ToggleGroup |
| `src/components/TripHeader.tsx` | Leave Trip: gray bg + red text matching Broadcasts shade |
| `src/components/AIConciergeChat.tsx` | "Picked up where you left off" → `text-gray-700` |
| `src/index.css` | Add light overrides for `bg-gray-800/80`, `bg-black/40`, `bg-black/30`, `bg-black/60`, `bg-neutral-900/70`, and blue bubble text protection |

## Risk
Low. CSS overrides scoped to `.light` class. One className change (shadow-lg). One text class change. No runtime behavior changes. Dark mode completely unaffected.

