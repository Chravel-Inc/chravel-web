# Root Technical Debt Triage — 2026-04-04

## Scope
Audit root-level technical-debt candidates surfaced in the repo screenshot and classify each as:
- Keep (active/in-use)
- Keep but constrain/document
- Remove (safe)

## Evidence Summary

### `core` (35 MB apparent size at repo root)
- `readelf -h core` identifies this as `Type: CORE (Core file)` (Linux process crash dump), not source code or app asset.
- `git log -- core` shows it was introduced during a broad merge/import commit, not as a purposeful feature artifact.
- No runtime/package/build references point to this file.
- **Conclusion:** Safe to remove. This file does not help app runtime, App Store screenshots, or Fastlane.

### Is `core` related to App Store screenshots or Fastlane?
- App Store screenshot generation is wired to:
  - `npm run screenshots:appstore` → `scripts/capture-appstore-screenshots.ts`
  - `npm run screenshots:marketing` → `appstore/scripts/generate_marketing_screenshots.py`
- Fastlane screenshot upload uses `ios-release/fastlane/Fastfile` and `ios-release/fastlane/Deliverfile` paths under `appstore/screenshots`.
- None of these flows reference `core`.
- **Conclusion:** `core` is unrelated to screenshot tooling and unrelated to Fastlane release automation.

### `optimizer/`
- Referenced by `package.json` script `optimize` (`npx tsx optimizer/cli/index.ts`).
- Contains TypeScript source, tests, and docs under a coherent tool structure.
- **Conclusion:** Keep. It is active tooling, not random clutter.

### `tmp/`
- Explicitly referenced by Ralph loop skill docs/templates for loop status/history files.
- `.gitignore` intentionally keeps only `.gitkeep` entries and ignores ephemeral outputs.
- **Conclusion:** Keep (already constrained correctly).

### `claude-progress.txt`
- Required by AGENTS anti-goldfish protocol and referenced by local helper scripts.
- **Conclusion:** Keep.

### `jules-scratch/`
- Only self-referential Playwright scratch files; no imports or build wiring.
- **Conclusion:** Safe to remove.

### `fix-conflict-1.sh`
- No references in repo.
- **Conclusion:** Safe to remove.

### `test_write.txt`
- No references in repo.
- **Conclusion:** Safe to remove.

## Action Taken
- Removed: `core`, `jules-scratch/`, `fix-conflict-1.sh`, `test_write.txt`.
- Added `.gitignore` guards for crash dumps and scratch directory recurrence (`core`, `core.*`, `jules-scratch/`).
- Removed stale `CLAUDE.md` debt bullet that listed `core` as unknown.

## Risk Assessment
- Runtime risk: **Low** (removed files are not imported or invoked by app/build scripts).
- Developer workflow risk: **Low** (kept required `optimizer/`, `tmp/`, and `claude-progress.txt`).
- App Store / Fastlane risk: **None** (screenshot + upload paths unchanged).

## Rollback
- `git revert <this-commit-sha>` restores removed artifacts and docs exactly.
