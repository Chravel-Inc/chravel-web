# Claude Code branch-first workflow

This repo is configured so Claude Code creates a dedicated worktree and feature branch for new implementation work.

## Start work
Run:

```bash
claude --worktree
```

## Rules
- Start each new feature, fix, or update in its own worktree.
- Do your edits and commits in that branch, not on `main`.
- Merge to `main` through a pull request.

## Useful checks
See your current branch:

```bash
git branch --show-current
```

See worktrees:

```bash
git worktree list
```
