## Heads up: no build errors to fix

I re-ran `tsc --noEmit` and `npm run build` against `main` — both pass cleanly. The "build errors" I flagged in the previous turn were stale notes from the patch scripts left in the repo root (`patch_tripchat*.py`), not actual current failures. Nothing to fix on that front. If you'd rather I clean up those orphaned `patch_*.py` / `resolver3.js` scripts at the repo root as housekeeping, I can fold that in.

## What we're building

A **competitive comparison strip** on the landing page that visually proves the deck's core claim: *Chravel is the only product that does all 8 of these things in one place.* Today, `ReplacesGrid` shows category-by-category lists of apps Chravel replaces, but it never shows the punchline — that no competitor checks every box.

## Where it goes

Insert a new section **between Hero (Section 1) and Replaces (Section 2)** in `src/components/landing/FullPageLanding.tsx`. This makes it the first thing after the hero — the "switch moment" that motivates everything below it.

Section order becomes:
1. Hero
2. **Competitive Strip (new)**
3. What It Replaces (existing detailed grid)
4. How It Works
5. Use Cases → AI → Pricing → FAQ → Footer

## What the section looks like

A single comparison table. Rows = the 8 Chravel modules (reusing `CATEGORIES` from `ReplacesGridData.ts` so it stays in sync). Columns = Chravel + 5–6 representative competitors. Cells = ✓ (gold) or ✗ (muted). Only the Chravel column is fully ✓.

```text
                 Chravel  WhatsApp  Splitwise  Google Drive  TripIt  Notion  Slack
Chat              ✓         ✓          ✗            ✗           ✗        ✗      ✓
Calendar          ✓         ✗          ✗            ✗           ✓        ~      ✗
AI Concierge      ✓         ✗          ✗            ✗           ~        ~      ✗
Media             ✓         ~          ✗            ✓           ✗        ~      ~
Payments          ✓         ✗          ✓            ✗           ✗        ✗      ✗
Places            ✓         ✗          ✗            ✗           ✓        ✗      ✗
Polls             ✓         ~          ✗            ✗           ✗        ~      ✓
Tasks             ✓         ✗          ✗            ✗           ✗        ✓      ✓
```

(`~` = partial; rendered as a muted dot. We'll keep it conservative/defensible — no overclaiming.)

**Header copy** (deck-aligned):
- Eyebrow: "The only one"
- H2: "Eight tools. One trip. Zero tab-switching."
- Sub: "Every other app does one slice. Chravel does the whole trip."

**Mobile (≤ md)**: table collapses to a vertical "Chravel ✓ / Everyone else ✗" stack with the 8 module names — keeps the punchline without horizontal scroll on phones.

## Files

**New:**
- `src/components/conversion/CompetitiveComparison.tsx` — the section (table + mobile fallback). Pulls module names from `CATEGORIES` in `ReplacesGridData.ts` to stay DRY. Static competitor matrix defined inline as `as const`.
- `src/components/landing/sections/CompetitiveComparisonSection.tsx` — thin wrapper, matches the `ReplacesSection.tsx` pattern.

**Modified:**
- `src/components/landing/FullPageLanding.tsx` — lazy-import the new section, add a new `GRADIENTS.competitive` entry (subtle gold-on-black, `goldOverlay="mesh"`), insert `<FullPageLandingSection id="section-competitive">` between Hero and Replaces.

No changes to `ReplacesGridData.ts`, no new deps, no schema/edge-function work.

## Styling

Reuses existing premium gold tokens (`#c49746`, `#feeaa5`, `#533517`) per memory `style/premium-gold-design-system`. ✓ glyphs in gold; ✗ in `text-white/30`. Chravel column gets a subtle gold left border + slightly brighter row backgrounds to anchor the eye.

## Verification

- `npm run typecheck && npm run lint && npm run build` clean
- Visual check at 1244×734 (your current viewport) and at 375px width for mobile collapse
- Confirm StickyLandingNav still works (new section is inside the same scroll root)
- Confirm lazy-loading suspense fallback renders without layout shift

## Out of scope (deferred from prior recommendations)

Per your direction, skipping: hero copy rewrite, "Chaos Stack → Live Plan" visual, How-It-Works rewrite, Use Cases segmentation, tagline change. We can revisit any of those after this lands.
