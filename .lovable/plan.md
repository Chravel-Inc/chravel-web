## Problem
The marketing landing page is rendering with light-mode elements (light grays, dark text on dark backgrounds) because the global `html.light` class set by `useTheme` remaps Tailwind classes like `.text-white` and `.bg-black` via `src/index.css`. The landing was designed for dark-only and must be immune to the user's app theme preference.

## Fix (single file)

**`src/components/landing/FullPageLanding.tsx`**

Add one `useEffect` at the top of the `FullPageLanding` component that:
1. On mount: snapshots whether `<html>` currently has the `light` class, then removes it.
2. On unmount: restores the previous state.

```tsx
useEffect(() => {
  const root = document.documentElement;
  const wasLight = root.classList.contains('light');
  root.classList.remove('light');
  return () => {
    if (wasLight) root.classList.add('light');
  };
}, []);
```

That's it. ~7 lines.

## Why this works
- `localStorage.theme` is never touched, so the user's saved Light/Dark preference is preserved for the authenticated app.
- When they navigate into the app (logged in), `useTheme` re-reads localStorage and reapplies `light` automatically.
- Landing's existing dark gradients, `text-white`, and gold tokens render exactly as designed — no CSS, copy, layout, or token edits.

## Out of scope
- No edits to `useTheme`, `index.css`, section components, gradients, copy, or any other file.
- No changes to chat / dashboard / build-error files.

## Verification
1. Toggle Settings → Appearance → Light. Log out → visit `/`:
   - Hero "Group travel made easy" renders white on dark.
   - All section headings and body copy render light on dark gradients.
   - Use-case cards (touring artists, bachelor parties, weddings, community groups) keep dark backgrounds + readable white text.
2. Log back in → app returns to Light mode (preference preserved).
3. `npm run typecheck && npm run lint && npm run build` pass.

## Risk / Rollback
- **Risk:** LOW — one effect, one file, scoped to mount lifecycle.
- **Rollback:** delete the added `useEffect` block.
