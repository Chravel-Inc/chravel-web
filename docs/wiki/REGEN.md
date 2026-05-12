# Wiki Regeneration Protocol

This wiki is regeneratable from a single prompt. It is **not** hand-maintained.

## What triggers regeneration

Any of the following should trigger a fresh regen pass:

1. Schema change — anything in `supabase/migrations/**`.
2. Edge function added or renamed — new directory under `supabase/functions/**`.
3. Type surface change — anything in `src/types/**`.
4. Dependency change — `package.json` `dependencies` or `devDependencies` modified.
5. New top-level directory under `src/`.
6. New subsystem (any new folder under `src/features/**`).
7. New env var referenced from `import.meta.env` or `process.env`.
8. New CI workflow under `.github/workflows/**`.
9. Manual: `npm run wiki:regen` (script TBD — see Open Items).

## How to regenerate

1. Open Claude Code in this repo on a fresh branch (e.g. `chore/wiki-regen-<date>`).
2. Paste the original wiki generation prompt (lives in branch history under `claude/code-wiki-generator-YIV8v`, or re-author per the structure documented in `docs/wiki/INDEX.md`).
3. The agent runs the full pipeline: Phase 0 inventory → wiki sections → diagrams → SEARCH.md → deck → RISKS.md sweep → validation.
4. Diff against current `docs/wiki/`. Resolve drift section-by-section.
5. Append a new entry to [`CHANGELOG.md`](./CHANGELOG.md) with timestamp, git SHA, and a one-line description of what changed.

## What to NOT regenerate

The following are **preserved** across regenerations and must not be overwritten:

1. `RISKS.md` entries marked `**Status:** accepted` — these are conscious decisions, not stale findings.
2. Hand-edited sections inside any wiki MD file wrapped in:
   ```html
   <!-- HUMAN -->
   ... text the team has added by hand ...
   <!-- /HUMAN -->
   ```
   The regen agent must detect these markers and copy their contents into the new file before overwriting.
3. `CHANGELOG.md` — append-only. Never rewrite history.

## Optional automation (not yet wired)

- **GitHub Action:** on push to `main` touching any trigger path, open an auto-PR with the wiki diff. Implementer can adopt or close.
- **Pre-commit hook:** if any file under `supabase/migrations/` is staged, warn if `docs/wiki/architecture/04-data-model-er.md` is **not** also staged.
- **`npm run wiki:regen` script:** would shell out to Claude Code with the prompt and apply the diff non-interactively. Currently manual.

## Deck regeneration

`docs/wiki/deck/deck.md` is regenerated each pass and is **Gamma-paste-ready**:

1. Open [gamma.app/create](https://gamma.app/create).
2. Choose "Paste in text" or equivalent import path.
3. Paste the full contents of `deck/deck.md`.
4. Gamma renders the `---` separators as slide breaks and the embedded Mermaid as diagrams.
5. The `pptx` artifact is intentionally not generated in this pipeline; export from Gamma if needed (no `python-pptx` is installed in the regen environment).

## Diagram validation

Every `.mmd` file under `docs/wiki/diagrams/` is validated post-regen via:

```bash
for f in docs/wiki/diagrams/*.mmd; do
  npx -y @mermaid-js/mermaid-cli mmdc -i "$f" -o /tmp/$(basename "$f" .mmd).svg
done
```

A diagram that fails to parse must be rewritten before the regen commit lands.

## Open items for future passes

- Wire `npm run wiki:regen` as a real script.
- Wire the GitHub Action for trigger-path detection.
- Expand the field-drift sweep beyond the top-10 entity scope captured in `RISKS.md`.
- Consider auto-generating `deck.pptx` once `python-pptx` is added to the dev environment.
