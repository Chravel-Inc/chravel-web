
## Root cause
`tailwind.config.ts` uses `darkMode: ['class']` (activates `dark:` only when `<html class="dark">`), but `useTheme.ts` never adds a `dark` class — it only adds a `light` class when light mode is on, and removes it for dark. So every `dark:` variant in `NativeTripTypeSwitcher.tsx` is permanently inert. The component's defaults are light (`bg-gray-100`, `text-black`, `bg-black/10`, etc.), which is what ships in the iOS/Android PWA shell.

The web version doesn't show the bug because the rest of the app uses semantic CSS variables / `.light` overrides — this Native component is the outlier that opted into Tailwind `dark:` variants.

## Fix (smallest, surgical)
Switch Tailwind's dark-mode strategy to be driven by the **absence of `.light`** rather than the presence of `.dark`. Two clean options:

**Option A (recommended) — invert the selector, no component edits:**
Change `tailwind.config.ts`:
```ts
darkMode: ['selector', 'html:not(.light)']
```
This makes every existing `dark:*` class active by default and correctly inactive when the user opts into light mode. Zero component changes. Matches existing app behavior (dark-first, light is the opt-in).

**Option B — keep config, sync the class in `useTheme`:**
In `useTheme.ts`, also add/remove `dark` alongside `light`. Safe but touches a hook used everywhere; bigger blast radius.

**Recommendation: Option A.** One-line config change, fixes this modal and any other `dark:`-using component instantly, no risk to existing `.light` overrides.

## Files changed
- `tailwind.config.ts` — line 4: `darkMode: ['selector', 'html:not(.light)']`

## Verification
- Native trip type switcher modal in dark mode (default) → dark surface (`#1c1c1e`), white text ✅
- Toggle to light mode in Settings → modal returns to light surface ✅
- Existing `.light` overrides in `index.css` still take precedence over `dark:` variants where both apply (Tailwind utilities are lower specificity than custom CSS unless `!important`) — spot-check after change.
- `npm run build` passes.

## Risk
**LOW.** Single config line. Worst case: a component that was using `dark:` *expecting* it to be inactive on dark would flip — but since the app is dark-first and `dark:` was never wired up, those styles were dead code. They become live and align with the dark theme the app already presents.

## Rollback
Revert the one-line config change.
