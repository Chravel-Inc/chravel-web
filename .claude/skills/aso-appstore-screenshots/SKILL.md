---
name: aso-appstore-screenshots
description: Generate polished App Store marketing screenshots with device frames, benefit headlines, and Chravel's premium dark/gold branding. Adapted from adamlyttleapps/claude-skill-aso-appstore-screenshots.
user-invocable: true
---

# ASO App Store Screenshots

Generate high-converting App Store screenshots for Chravel by composing marketing overlays on raw simulator screenshots.

## Prerequisites

- Python 3 with Pillow: `pip install Pillow`
- Raw screenshots in `appstore/screenshots/iPhone-6.7/` (run `npm run screenshots:appstore` to capture)

## Quick Start

Run the full pipeline:

```bash
python appstore/scripts/generate_marketing_screenshots.py
```

This will:
1. Generate the device frame template (if not already created)
2. Compose all 8 marketing screenshots with benefit headlines
3. Generate a side-by-side showcase preview

Output goes to `appstore/screenshots/marketing/iPhone-6.7/`.

## Workflow

### Phase 1: Benefit Discovery

Analyze Chravel's codebase to identify the top benefits that resonate with travelers. Each benefit starts with a strong action verb:

| # | Verb | Descriptor | Feature |
|---|------|------------|---------|
| 1 | PLAN | YOUR NEXT ADVENTURE | Trip dashboard |
| 2 | CHAT | WITH YOUR GROUP | Group messaging |
| 3 | ORGANIZE | EVERY DETAIL | Calendar/itinerary |
| 4 | ASK | YOUR AI TRAVEL GUIDE | AI concierge |
| 5 | SPLIT | EXPENSES EFFORTLESSLY | Expense splitting |
| 6 | DISCOVER | AMAZING PLACES | Maps & places |
| 7 | SHARE | TRIP MEMORIES | Media gallery |
| 8 | DECIDE | TOGETHER | Group polls |

### Phase 2: Screenshot Pairing

Each benefit maps to a raw simulator screenshot from `appstore/screenshots/iPhone-6.7/`. Good screenshots show:
- Rich, populated data (not empty states)
- Clear feature demonstration
- No debug UI or placeholder content

### Phase 3: Generation

The `compose_screenshot.py` script creates each marketing screenshot:

```bash
python appstore/scripts/compose_screenshot.py \
  --bg "#0A0A0A" \
  --verb "PLAN" \
  --desc "YOUR NEXT ADVENTURE" \
  --screenshot appstore/screenshots/iPhone-6.7/01-home-dashboard.png \
  --output appstore/screenshots/marketing/iPhone-6.7/01-plan.png
```

Options:
- `--bg` — Background hex color
- `--verb` — Action verb headline (white, large)
- `--desc` — Descriptor text (gold #c49746, below verb)
- `--text-color` — Override headline color (default: white)
- `--desc-color` — Override descriptor color (default: Chravel gold)

### Phase 4: Showcase

Generate a side-by-side preview:

```bash
python appstore/scripts/showcase.py \
  --screenshots img1.png img2.png img3.png \
  --output appstore/screenshots/marketing/showcase.png \
  --label "Chravel — Travel Together"
```

## Chravel Brand Palette

| Color | Hex | Usage |
|-------|-----|-------|
| Near-black | `#0A0A0A` | Primary background |
| Dark bronze | `#1A1207` | Warm background variant |
| Dark navy | `#0D1117` | Cool background variant |
| Dark amber | `#170D06` | Rich background variant |
| Gold primary | `#c49746` | Descriptor text, accents |
| Gold glow | `#e8af48` | Highlights |
| White | `#FFFFFF` | Action verb headlines |

## Output Specs

- **Dimensions:** 1290 × 2796 px (iPhone 6.7" / 15 Pro Max)
- **Format:** PNG (RGB)
- **App Store compliant:** Yes — ready for App Store Connect and TestFlight

## Scripts Reference

| Script | Purpose |
|--------|---------|
| `appstore/scripts/generate_frame.py` | Creates device frame template |
| `appstore/scripts/compose_screenshot.py` | Composes single marketing screenshot |
| `appstore/scripts/showcase.py` | Generates side-by-side preview |
| `appstore/scripts/generate_marketing_screenshots.py` | Batch orchestrator for all screenshots |

## Customizing

To change benefits, edit the `SCREENSHOTS` list in `generate_marketing_screenshots.py`. Each entry has:
- `raw` — source screenshot filename
- `out` — output filename
- `verb` — action verb headline
- `desc` — descriptor text
- `bg` — background hex color
