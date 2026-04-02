# Chravel Remotion Design System

> Single source of truth for all visual tokens used across Chravel b-roll video compositions.
> Based on the production app's design system (`tailwind.config.ts`, `src/index.css`).

---

## 1. Brand Colors

### Primary Palette (Premium Dark/Gold)

| Token | Hex | Usage |
|-------|-----|-------|
| `background` | `#000000` | Pure black canvas background |
| `surface` | `#0f0f0f` | Card/panel backgrounds |
| `surfaceLight` | `#141414` | Elevated surfaces, gradients |
| `border` | `#1a1a1a` | Subtle card borders |
| `borderGold` | `#2a2010` | Gold-tinted borders (premium surfaces) |

### Gold Accent System

| Token | Hex | Usage |
|-------|-----|-------|
| `gold` | `#c49746` | Primary brand accent — CTAs, highlights, headings |
| `goldLight` | `#e8af48` | Warm glow, gradient endpoints, hover states |
| `goldPale` | `#feeaa5` | Lightest gold — sparkle effects, subtle highlights |
| `goldDark` | `#a07a32` | Dark gold — gradient shadows, pressed states |
| `bronze` | `#533517` | Deep bronze — shadows, depth accents |

### Gold Gradient

```
background: linear-gradient(135deg, #e8af48 0%, #c49746 50%, #a07a32 100%)
```

### Gold Glow Shadow

```
box-shadow: 0 8px 32px rgba(232, 175, 72, 0.35), 0 4px 16px rgba(196, 151, 70, 0.25)
```

### Text Colors

| Token | Hex | Usage |
|-------|-----|-------|
| `white` | `#ffffff` | Primary text, headings |
| `muted` | `#999999` | Secondary text, descriptions |
| `mutedLight` | `#666666` | Tertiary text, captions |

### Functional Colors

| Token | Hex | Usage |
|-------|-----|-------|
| `chatBlue` | `#007AFF` | iMessage-style chat bubbles (own messages) |
| `chatReceived` | `#1c1c1e` | Received message bubbles |
| `paymentGreen` | `#62D621` | Payment success, confirmed states |
| `paymentBg` | `#0a2617` | Payment section backgrounds |
| `destructive` | `#ef4444` | Error states, delete actions |
| `aiPurple` | `#8b5cf6` | AI/concierge accent (subtle) |

---

## 2. Typography

### Font Family

```
Primary: Inter (via @remotion/google-fonts/Inter)
Weights: 400 (Regular), 500 (Medium), 600 (SemiBold), 700 (Bold), 800 (ExtraBold)
```

### Video Typography Scale

| Token | Size | Weight | Letter Spacing | Usage |
|-------|------|--------|---------------|-------|
| `hero` | 96px | 800 | -0.02em | Logo text, hero moments |
| `heading` | 72px | 800 | -0.01em | Scene titles, key statements |
| `subheading` | 42px | 700 | 0 | Section titles, feature names |
| `body` | 28px | 400 | 0 | Descriptions, body copy |
| `bodyBold` | 28px | 700 | 0 | Emphasized body text |
| `caption` | 22px | 600 | 0.15em | Labels, section headers (uppercase) |
| `small` | 18px | 400 | 0 | Fine print, URLs, timestamps |
| `tiny` | 14px | 500 | 0 | UI mockup text inside phone frames |

### Phone UI Typography (inside device frames)

| Token | Size | Weight | Usage |
|-------|------|--------|-------|
| `phoneTitle` | 18px | 700 | Screen titles, nav headers |
| `phoneBody` | 14px | 400 | List items, message text |
| `phoneCaption` | 12px | 500 | Timestamps, labels |
| `phoneSmall` | 10px | 400 | Secondary info, badges |

---

## 3. Spacing & Layout

### Canvas

- **Resolution:** 1920 × 1080 (16:9 Full HD)
- **FPS:** 30
- **Safe area:** 80px padding from all edges for text content

### Spacing Scale

| Token | Value | Usage |
|-------|-------|-------|
| `xs` | 4px | Tight gaps inside phone UI |
| `sm` | 8px | Small gaps, icon padding |
| `md` | 16px | Standard gap between elements |
| `lg` | 24px | Card padding, section gaps |
| `xl` | 40px | Major section spacing |
| `2xl` | 64px | Scene-level padding |
| `3xl` | 80px | Canvas safe area |

### Phone Frame Dimensions

| Property | Value |
|----------|-------|
| Width | 280px (scaled to fit composition) |
| Height | 606px (19.5:9 iPhone 16 Pro ratio) |
| Border Radius | 48px (outer), 40px (screen) |
| Bezel Width | 4px |
| Notch Width | 120px |
| Notch Height | 34px |
| Status Bar Height | 44px |
| Home Indicator Height | 5px |

---

## 4. Border Radius

| Token | Value | Usage |
|-------|-------|-------|
| `sm` | 8px | Small buttons, badges |
| `md` | 12px | Input fields, small cards |
| `lg` | 16px | Buttons, medium cards |
| `xl` | 20px | Feature cards, panels |
| `2xl` | 24px | Large cards, modals |
| `full` | 9999px | Pills, avatars, circular elements |
| `phone` | 48px | Device frame outer radius |

---

## 5. Shadows

### Card Shadows (Dark Theme)

```
sm:  0 1px 3px rgba(0,0,0,0.3), 0 1px 2px rgba(0,0,0,0.24)
md:  0 4px 8px rgba(0,0,0,0.4), 0 2px 4px rgba(0,0,0,0.3)
lg:  0 8px 16px rgba(0,0,0,0.5), 0 4px 8px rgba(0,0,0,0.4)
xl:  0 12px 24px rgba(0,0,0,0.6), 0 6px 12px rgba(0,0,0,0.5)
```

### Gold Glow

```
primary:  0 8px 32px rgba(232,175,72,0.35), 0 4px 16px rgba(196,151,70,0.25)
subtle:   0 4px 16px rgba(232,175,72,0.15), 0 2px 8px rgba(196,151,70,0.10)
ring:     0 0 12px rgba(232,175,72,0.25), 0 0 4px rgba(196,151,70,0.15)
```

### Phone Frame Shadow

```
0 20px 60px rgba(0,0,0,0.8), 0 8px 24px rgba(0,0,0,0.6)
```

---

## 6. Animation Tokens

### Spring Configurations

| Name | Config | Usage |
|------|--------|-------|
| `smooth` | `{ damping: 200 }` | Default entrance — fade/slide |
| `snappy` | `{ damping: 20, stiffness: 200 }` | Quick interactions — taps, toggles |
| `bouncy` | `{ damping: 8, stiffness: 120 }` | Playful — confetti, celebrations |
| `gentle` | `{ damping: 200, mass: 2 }` | Large elements — phone frames, backgrounds |
| `elastic` | `{ damping: 12, stiffness: 150 }` | Buttons, scale pops |

### Timing Presets

| Name | Duration | Usage |
|------|----------|-------|
| `fast` | 8 frames (0.27s) | Micro-interactions |
| `normal` | 15 frames (0.5s) | Standard transitions |
| `slow` | 30 frames (1s) | Scene transitions |
| `dramatic` | 45 frames (1.5s) | Hero reveals |

### Stagger Pattern

For sequential element entrances:
```
delay: index * 6 frames (0.2s between each element)
```

### Easing Functions

- **Entrances:** `spring()` (never CSS ease-in-out)
- **Exits:** `Easing.out(Easing.cubic)`
- **Continuous:** `interpolate()` with `extrapolateRight: 'clamp'`

---

## 7. Component Patterns

### Device Frame (iPhone 16 Pro)

- Titanium-colored bezel: `#2a2a2e`
- Bezel gradient: `linear-gradient(135deg, #3a3a3e 0%, #1a1a1e 100%)`
- Screen background: `#000000`
- Dynamic Island: centered, pill-shaped, `#000000`
- Subtle reflection highlight on bezel edge
- Drop shadow for floating effect

### Feature Cards

- Background: `linear-gradient(135deg, #0f0f0f 0%, #141414 100%)`
- Border: `1px solid #1a1a1a`
- Border radius: 20px
- Padding: 28px 40px
- Icon container: 80×80px, radius 16px, `gold` at 8% opacity background
- Hover/active: gold border glow

### Tab Bar (Bottom Navigation)

- Background: `#0a0a0a` with `blur(20px)` visual effect
- Height: 80px
- 8 tabs: Chat, Calendar, Concierge, Media, Payments, Places, Polls, Tasks
- Active tab: gold icon + gold label
- Inactive tab: `#666666` icon + label
- Active indicator: gold dot below icon (4px diameter)

### Chat Bubbles

- Own messages: `#007AFF` (blue), right-aligned, white text
- Received messages: `#1c1c1e`, left-aligned, white text
- AI messages: `#1c1c1e` with subtle gold left border
- Border radius: 18px (with tail on appropriate corner)
- Max width: 70% of phone screen

### Notification Toasts

- Background: `#1a1a1a`
- Border: `1px solid #2a2a2a`
- Border radius: 12px
- Left accent: 3px gold bar
- Slide in from top with spring animation

---

## 8. Background Treatments

### Default (Dark Gradient)

```
background: radial-gradient(ellipse at 50% 30%, #0a0a0a 0%, #000000 70%)
```

### Gold Ambient

```
background: radial-gradient(circle at 50% 50%, rgba(196,151,70,0.08) 0%, transparent 60%)
layered on top of default
```

### Travel Map (Subtle)

- Very faint world map outline at 3-5% opacity
- Color: gold at low opacity
- Positioned center, scale to fill
- Optional slow pan/zoom animation

### Floating Particles

- 15-25 small circles (2-4px diameter)
- Color: gold at 10-20% opacity
- Float animation: slow random drift, 15-25s cycle
- Parallax depth layers (2-3 speeds)

---

## 9. End Card Pattern

Every composition ends with a 3-second end card:

1. **Frame 0-15:** Content fades out
2. **Frame 15-45:** Chravel logo scales in (spring, bouncy)
3. **Frame 30-60:** "Group Travel Made Easy" fades up below logo
4. **Frame 45-75:** `chravel.app` URL fades in
5. **Frame 60-90:** Subtle gold glow pulse on logo

### Logo Treatment

- Use `staticFile('chravel-logo.png')` from `public/`
- Scale: ~200px wide
- Centered on canvas
- Subtle gold radial glow behind

---

## 10. Composition Structure

Each b-roll composition follows this pattern:

```tsx
<AbsoluteFill style={{ background: COLORS.background }}>
  {/* Layer 1: Background treatment */}
  <TravelBackground variant="gradient" />
  
  {/* Layer 2: Main content (phone frames, UI, text) */}
  {/* ... scene-specific content ... */}
  
  {/* Layer 3: Text overlays */}
  {/* ... feature name, description ... */}
  
  {/* Layer 4: End card (last 3 seconds) */}
  <Sequence from={durationInFrames - 90}>
    <EndCard />
  </Sequence>
</AbsoluteFill>
```

### Duration Guidelines

- B-roll clips: 8-15 seconds (240-450 frames at 30fps)
- Scene transitions: 15 frames (0.5s) with fade or slide
- End card: 90 frames (3s) — included in total duration
- Content area: total - 90 frames for end card

---

## 11. Motion Design Principles

1. **All animation via `useCurrentFrame()` + `interpolate()`/`spring()`** — never CSS transitions
2. **Entrance pattern:** Elements start offset (20-40px) + transparent → spring to final position + opaque
3. **Stagger pattern:** Sequential elements delay by 6 frames each
4. **Camera moves:** Subtle parallax (background moves 50% of foreground speed)
5. **Phone frames float:** Gentle 6-8px vertical oscillation over 4-6 seconds
6. **Gold accents animate last:** After content settles, gold highlights/glows fade in
7. **Never static:** Even "settled" scenes should have subtle breathing (glow pulse, particle drift)

---

*Last updated: 2026-04-02 · Chravel Engineering Team*
