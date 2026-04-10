# PR #164 Rebase Runbook (Terminal + GitHub)

## Why your command failed

You ran `git fetch origin main` from your home folder (`~`), not from inside a cloned Git repository. That is why Git returned:

```text
fatal: not a git repository (or any of the parent directories): .git
```

## Terminal steps (safe, copy/paste)

### 1) Go to your local repo root

```bash
cd ~/path/to/chravel-web
pwd
ls -a | grep .git
```

Expected: `pwd` points at your repo and `.git` exists.

### 2) Confirm branch + clean working tree

```bash
git status
git branch --show-current
```

If you have uncommitted work:

```bash
git add -A && git commit -m "wip: save local state before rebase"
# OR
git stash push -u -m "pre-rebase"
```

### 3) Fetch latest main

```bash
git fetch origin main
```

### 4) Rebase your PR branch onto main

```bash
git checkout <your-pr-branch>
git rebase origin/main
```

### 5) If conflicts appear, resolve each file

Find conflicted files:

```bash
git status
```

Open each conflicted file, remove conflict markers (`<<<<<<<`, `=======`, `>>>>>>>`), keep intended final code, then:

```bash
git add <resolved-file>
```

Continue:

```bash
git rebase --continue
```

If another conflict appears, repeat until done.

If needed:

```bash
git rebase --abort
```

### 6) Push rebased branch

```bash
git push --force-with-lease origin <your-pr-branch>
```

Use `--force-with-lease` (not plain `--force`) to avoid clobbering teammates.

## GitHub (external) steps

1. Open PR #164.
2. Confirm conflict warning is gone.
3. Re-run checks (or click re-run if required).
4. Reply on each open review thread with the resolution summary.
5. Mark review threads as resolved.
6. Merge once checks are green and branch is up to date.

## Quick conflict triage order for this PR

If these files conflict first, resolve in this order:

1. `macos/Sources/ChravelMacCore/Supabase/SupabaseRESTClient.swift`
2. `macos/Sources/ChravelMacApp/Core/Workspace/TripWorkspaceCoordinator.swift`
3. `macos/Sources/ChravelMacApp/Features/Navigation/AppShellView.swift`
4. `macos/Tests/ChravelMacCoreTests/SupabaseChatRepositoryTests.swift`
5. `macos/Tests/ChravelMacCoreTests/SupabaseTripRepositoryTests.swift`
6. `macos/README.md`
7. `claude-progress.txt`

This order minimizes logic regressions (core runtime first, tests second, docs/logs last).
