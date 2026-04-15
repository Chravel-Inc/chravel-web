---
name: chravel-design-tools
description: Generate UI screens, images, and videos that match Chravel's premium dark/gold design system. Wraps Google Stitch, Nano Banana, Higgsfield, and Seedance 2 (EvoLink) MCP servers with brand-aware prompting. Triggers on "design tool", "generate UI", "generate image", "generate video", "create visual", "brand asset", "stitch", "nano banana", "higgsfield", "seedance".
---

# Chravel Design Tools

Generate design assets that match the Chravel brand. This skill provides design context to the four creative MCP servers configured in `.mcp.json`.

## Available Tools

| MCP Server | Capability | Use When |
|-----------|-----------|----------|
| **stitch** | Text-to-UI screen generation (HTML/CSS) | New page designs, screen mockups, UI exploration |
| **nano-banana** | AI image generation (Gemini) | App icons, hero images, backgrounds, marketing assets |
| **higgsfield** | Cinematic image + video generation | Promo videos, talking head clips, product demos |
| **evolink-media** | Video generation (Seedance 2.0 + 60 models) | Social media clips, feature previews, brand videos |

## Chravel Brand System

Always inject these design constraints when prompting any of the four tools.

### Color Palette

| Token | Hex | Usage |
|-------|-----|-------|
| Gold Primary | `#c49746` | Primary CTAs, brand accent, icon highlights |
| Gold Light | `#e8af48` | Hover states, warm glow effects |
| Gold Dark / Bronze | `#533517` | Dark accent, subtle borders |
| Gold Glow | `rgba(232, 175, 72, 0.3)` | Shadow/glow effects on CTAs |
| Background | `#000000` / `#030712` (gray-950) | App background — near-black |
| Card Surface | `#111827` (gray-900) | Cards, panels, modals |
| Card Border | `#1f2937` (gray-800) | Subtle borders |
| Text Primary | `#ffffff` | Headings, primary content |
| Text Secondary | `#9ca3af` (gray-400) | Descriptions, metadata |
| Text Tertiary | `#6b7280` (gray-500) | Captions, timestamps |
| Destructive | `#f87171` (red-400) | Errors, delete actions |
| Success | `#4ade80` (green-400) | Confirmations, status |

### Typography

- **Font family:** Inter (primary), SF Pro (iOS fallback)
- **Hero:** 64px / 900 weight / -0.03em tracking (desktop), 36px (mobile)
- **H1:** 40px / 700 / -0.01em (desktop), 32px (mobile)
- **H2:** 28px / 600 (desktop), 24px (mobile)
- **H3:** 24px / 600 (desktop), 20px (mobile)
- **Body:** 17px / 400 / 1.7 line-height (desktop), 16px (mobile)
- **Caption:** 14px / 500

### Component Patterns

- **Cards:** `bg-gray-900 border border-gray-800 rounded-xl p-4` with dramatic depth shadows
- **Primary buttons:** `bg-amber-500 hover:bg-amber-600 text-black font-medium rounded-lg` with gold glow shadow
- **Secondary buttons:** `bg-gray-800 hover:bg-gray-700 text-white rounded-lg`
- **Inputs:** `bg-gray-900 border border-gray-700 text-white rounded-lg`
- **Modals:** `bg-gray-900 border border-gray-800 rounded-2xl p-6`
- **Border radius:** 16-24px for containers, 8-12px for interactive elements

### Design Principles

1. **Dark-first** — near-black backgrounds, never bright or light themes
2. **Gold accent sparingly** — reserved for primary CTAs and brand moments, not decorative
3. **Dramatic depth** — heavy box shadows (`0 8px 24px rgba(0,0,0,0.6)`) create layered feel
4. **Premium travel aesthetic** — cinematic, aspirational, luxury positioning
5. **High contrast** — white text on dark surfaces, gold on black for CTAs
6. **Generous spacing** — 20px mobile gutters, 32px desktop, 24-32px card padding

## Per-Tool Prompting Guide

### Google Stitch (UI Screens)

When generating screens via the `stitch` MCP, always prepend this context to prompts:

> Design for a premium travel app called Chravel. Use a dark theme with near-black background (#030712), dark gray cards (#111827) with subtle borders (#1f2937), white text for headings, gray-400 for secondary text. Primary accent is warm metallic gold (#c49746) used only for CTAs and key interactive elements. Font is Inter. Border radius 16-24px for containers. Use dramatic box shadows for depth. The aesthetic is luxury travel meets modern fintech.

**Screen types to request:** mobile (390px width), tablet (768px), desktop (1280px).

### Nano Banana (Image Generation)

When generating images via the `nano-banana` MCP, always include these style directives:

> Style: premium, cinematic, dark moody atmosphere with warm gold accent lighting. Color palette: deep blacks, charcoal grays, warm gold (#c49746) highlights. Aesthetic: luxury travel brand, aspirational, editorial quality. Avoid bright colors, pastels, or flat design. Think: high-end travel magazine meets modern tech brand.

**Common use cases:**
- App Store screenshots backgrounds
- Hero section imagery
- Feature illustration backgrounds
- Marketing collateral

### Higgsfield (Cinematic Video)

When generating video via the `higgsfield` MCP:

- **Image generation (Soul model):** Use "cinematic, premium, dark environment with warm gold lighting, luxury travel aesthetic" as style keywords
- **Video generation (DoP model):** Request "smooth cinematic camera movement, warm gold color grading, dark moody atmosphere, premium brand feel"
- **Talking heads (Speak v2):** Use dark backgrounds with subtle gold rim lighting

### Seedance 2 / EvoLink (Video Generation)

When generating video via the `evolink-media` MCP:

> Cinematic premium travel brand video. Dark environment, warm golden hour lighting, smooth camera movements. Color grade: deep shadows, warm midtones with gold (#c49746) accent, clean highlights. Luxury aspirational feel — think high-end hotel brand film meets tech product video.

## Output Handling

- Generated images are saved locally — move to `public/` or upload to Supabase Storage as needed
- Generated HTML from Stitch should be adapted to use Chravel's Tailwind classes, not raw CSS
- Video outputs may need post-processing — check resolution and format compatibility
- All generated assets should be reviewed for brand consistency before use

## API Key Requirements

| Tool | Required Keys | Where to Get |
|------|--------------|-------------|
| Stitch | `STITCH_API_KEY` | Google AI Studio or `npx @_davideast/stitch-mcp init` |
| Nano Banana | `GEMINI_API_KEY` | Google AI Studio (aistudio.google.com) |
| Higgsfield | `HF_API_KEY` + `HF_SECRET` | cloud.higgsfield.ai/api-keys |
| EvoLink (Seedance 2) | `EVOLINK_API_KEY` | evolink.ai dashboard |

Keys are configured in `.mcp.json` (gitignored). See `.mcp.json.example` for the template.
