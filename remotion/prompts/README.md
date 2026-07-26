# Chravel brand video system — 11 use cases

Eleven cinematic films, one per use-case scenario, for Instagram and social.
Each renders at **9:16 (24s)** and **1:1 (15s)**, plus a **75s brand anthem** in 16:9 and
9:16. Twenty-four compositions total.

## How it works

The films are **hybrid**. Two halves, split along the line that decides quality:

| Half                                    | Produced by                                       | Why                                                                                                  |
| --------------------------------------- | ------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| Typography, UI, logos, titles, the edit | **Remotion** (React, rendered)                    | Real font rasterization and real product screenshots. Pixel-perfect, never garbled, always on-brand. |
| Live-action human footage               | **AI video models**, driven by these prompt packs | Photoreal people at a cost and speed a shoot cannot match.                                           |

**No text is ever sent to a video model.** That is the architectural decision behind the
whole system: every title, label, and CTA is drawn by Remotion in real Inter, and every
AI plate is generated deliberately text-free. Garbled AI lettering is structurally
impossible here rather than something to be checked for afterwards.

## The films render today

`Plate` falls back to real brand photography from `public/plates/stills` whenever a clip
is missing, with a slow Ken Burns push and the same grade. So all 24 compositions produce
finished, presentable videos right now, before a single frame of AI footage exists. Each
clip you generate upgrades one beat in place — a manifest edit, no code change.

## Structure of every film

| #   | Scene      | Beat                              | Source                          |
| --- | ---------- | --------------------------------- | ------------------------------- |
| 1   | Cold open  | The chaos, in one line            | `scenario.before`               |
| 2   | Escalation | Three fast cuts stacking the pain | `featureMap[].pain`             |
| 3   | The turn   | Gold sweep, the brand arrives     | —                               |
| 4   | Resolution | Real product UI doing the work    | `featureMap[].solution`         |
| 5   | Payoff     | The human moment bought back      | `scenario.after`                |
| 6   | Lockup     | Wordmark, badge, CTA              | `scenario.badge`, `cta.heading` |

The square cut drops scene 2 — at 15 seconds the hook has to reach the product fast.

All copy is transcribed verbatim from `src/lib/useCases.ts` and
`src/components/landing/sections/UseCasesSection.tsx`. The site already frames every
scenario as before → after → badge, which is a finished three-act structure; these films
give it a camera rather than inventing new positioning. No new product claims.

## Files

```
00-STYLE-BIBLE.md         the look: camera, lensing, lighting, grade, skin
00-CHARACTER-BIBLE.md     14 recurring people, with verbatim prompt fragments
00-NEGATIVE-PROMPTS.md    the blocks that kill AI text and the plastic look
00-WORKFLOW.md            still-first pipeline, seeds, culling, drop-in
01..11-*.md               per-scenario shot lists and prompts
```

Read the four bibles before any scenario pack. They are not preamble — the negative
blocks and the still-first workflow are what separate usable footage from slop.

## Rendering

```bash
cd remotion
npm install
npm run render:usecases              # all 24 → out/usecases/
npm run render:usecases:vertical     # 11 x 9:16
npm run render:usecases:square       # 11 x 1:1
npm run render:usecases:anthem       # 2 anthem cuts
npm run studio                       # visual review
```

Remotion needs old-headless Chrome, which current Chrome removed. The render script finds
a `chrome-headless-shell` automatically (Playwright ships one) and otherwise lets Remotion
fetch its own. Override with `CHROME_SHELL=/path/to/headless_shell`.

## Adding footage

1. Generate per the scenario pack and `00-WORKFLOW.md`.
2. Drop the trimmed clip in `public/plates/clips/`.
3. Add its filename to that scenario's plate in `src/usecases/scenarios.ts`.
4. Re-render that composition.

Keep the `still` entry — it stays as the poster and the fallback.
