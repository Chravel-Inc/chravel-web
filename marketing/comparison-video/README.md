# ChravelApp Comparison Video

A 48-second product comparison video built with [Remotion](https://remotion.dev):
two iPhones side by side — **ChravelApp: One Trip Hub** (one trip workspace,
smooth swipes through Chat / Calendar / Concierge / Media / Polls / Tasks /
Files & Notes) vs. **Old Way: Too Many Apps** (Messages → close → home →
Calendar → AI assistant → Photos → Files → To-Do → back to Messages…).

The rendered video lives at `out/chravel-comparison.mp4` (1920x1080 @ 30fps).

## Structure

```
src/theme.ts             brand tokens (metallic gold #c49746) + all choreography timing
src/ComparisonVideo.tsx  master timeline: Intro → Comparison → Final frame → End card
src/ComparisonScene.tsx  two-phone layout, labels, progress chips
src/IPhoneFrame.tsx      realistic iPhone chassis + iOS status bar
src/left/                ChravelApp screen: tab panels + swipe engine
src/right/               "old way" screen: generic iOS apps, home grid, app-switch engine
src/FinalFrame.tsx       all-tabs-together vs. scattered-icons comparison
src/Intro.tsx, EndCard.tsx
```

This project is intentionally **outside** the main app's lint/typecheck/build
toolchain (like `codebase-atlas/`). It has its own `package.json` and
`tsconfig.json`.

## Commands

```bash
npm install
npm run studio   # live preview at localhost:3000
npm run render   # renders out/chravel-comparison.mp4
```

The render scripts pass `--browser-executable=/opt/pw-browsers/chromium
--chrome-mode=chrome-for-testing` for the Claude Code remote environment
(pre-installed Chromium, new headless mode). Locally you can drop both flags
and Remotion will use its own headless browser.

The Inter font is embedded as a base64 data URI (`src/interFontData.ts`) so
rendering never needs network access.

## Tweaking

- **Pacing** — every timing constant (swipe starts, app-switch cycle lengths,
  chip reveal frames) lives in `src/theme.ts`.
- **Tab content** — edit the panels in `src/left/tabs.tsx`.
- **The gauntlet order** — `APP_ORDER` in `src/right/OldWayScreen.tsx`.
- **Music** — no audio track is included; add one with Remotion's `<Audio>`
  in `src/ComparisonVideo.tsx` once a licensed track is chosen.
