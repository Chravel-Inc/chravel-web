# Chravel Brand Kit

The local, source-of-truth brand kit. This is the in-repo companion to the Pika
**Build-a-Brand** skill (prompt in [`../PIKA_FOUNDER_KIT.md`](../PIKA_FOUNDER_KIT.md)).

| File | What it is |
|---|---|
| `brand-guidelines.html` | Open in a browser — the full visual + verbal identity reference (palette, type, voice, taglines, the mark explained). |
| `brand-sheet.png` | One-page brand sheet (logo + palette + type + voice). Shareable still. |
| `palette.png` | Color system as labeled swatches with exact hexes. |
| `logo-primary.png` | Canonical primary lockup (gold mark on near-black). |
| `icon.png` | App-icon mark. |

## Regenerate

```bash
python3 appstore/scripts/generate_brand_kit.py
```

Deterministic — locks every value to Chravel's premium dark/gold tokens. Edit the
token block at the top of the script to change the system in one place.

## Tokens (do not drift)

| Token | Hex | Use |
|---|---|---|
| Near-black | `#0A0A0A` | Primary background — dark-first, always |
| Warm / Cool / Rich dark | `#1A1207` / `#0D1117` / `#170D06` | Surface variants |
| Gold | `#c49746` | Primary brand — CTAs + marks, used sparingly |
| Gold glow | `#e8af48` | Highlight / hover / glow |
| White | `#FFFFFF` | Headlines + primary text |
| Gray | `#9CA3AF` | Secondary text |

> Gold is reserved for primary CTAs and brand elements — never a full background,
> never on bright surfaces. Source of truth: `.claude/skills/chravel-design-language/SKILL.md`.

## Want AI-generated marks (vector logo variants, inverted/mono lockups)?

The deterministic kit here uses the existing flat-on-dark logo. For freshly
generated vector marks and inverted/mono lockups, run the **Build-a-Brand** prompt
in `../PIKA_FOUNDER_KIT.md` from a Pika-connected claude.ai chat, then drop the
outputs back into this folder.
