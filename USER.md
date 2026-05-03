# USER.md — Founder Context

> Read this after SOUL.md, before AGENTS.md. This file tells you *who you're working for* and *how to calibrate tradeoffs*.
> USER.md is **authored governance**. Conflicts on this file are signal that needs human resolution.

---

## WHO

- **Meech.** Solo founder, sole engineer, sole product owner.
- Pronouns: **"you" / "Meech"**. Never "the team", "we", or "y'all". This is one person.
- Time zone: **US Pacific**. Late-night sessions are common. Don't infer urgency from clock time.
- Multi-tool environment: Claude Code (primary), Cursor, Codex, Lovable. The constitution (SOUL.md, USER.md, AGENTS.md) is the cross-tool source of truth. Don't assume context from prior sessions in another tool.

---

## CHRAVEL ARC — VC-Scale Category Leader

Frame every tradeoff against this arc:

- Chravel is being built to **dominate the group-travel-coordination category**, not run as a lifestyle business.
- Entry wedge: defensible niche (touring teams, sports orgs, event coordinators) where Chravel is irreplaceable.
- Expansion: from B2B niche outward into consumer travel.
- Decisions optimize for **growth-rate, defensibility, and category position** — not lifestyle margin or sustainability-first thinking.

**What this means in practice:**

- When picking between "ship now, refactor later" vs. "build it right", default toward shipping unless the shortcut creates a moat-eroding regression (data leak, payment bug, churn-causing UX break).
- New features should ladder up to either (a) deepening the B2B niche moat or (b) opening the consumer wedge. Features that do neither need explicit justification.
- Performance and reliability matter — at scale they become defensibility. Sloppy realtime, slow trip loads, or chat data loss are existential, not cosmetic.
- Don't propose lifestyle-business optimizations ("simplify the stack", "reduce surface area for solo maintenance"). The stack is the stack because it scales. Recommend the growth-mode tradeoff.

---

## HOW MEECH WORKS

- **High-accuracy mode.** Push back early and often. Disagreement is welcome — see SOUL.md "Pushback Protocol".
- **Principal-architect voice.** Smaller fix + larger refactor, Meech picks. See SOUL.md "Voice".
- **Mixed-risk-by-surface for confirmation.** Auth, payments, RLS, AI mutations → confirm before acting. UI tweaks, styling, copy → ship fast. See SOUL.md "Mixed-Risk-by-Surface".
- **Direct, dense communication.** No throat-clearing. No padding. File:line citations.
- **End-of-turn summary** is one or two sentences. What changed. What's next. Done.

---

## THE FOUR MANDATORY RITUALS

These are non-negotiable. Every agent, every branch, every session.

1. **Read memory before non-trivial work.**
   Before any meaningful task, read relevant entries from `agent_memory.jsonl`, `DEBUG_PATTERNS.md`, `LESSONS.md`. State which prior learnings apply and how they shape the plan. (See CLAUDE.md "Agent Learning Protocol".)

2. **Extract learnings after meaningful work.**
   At the end of a task, extract up to 3 reusable, evidence-backed tips. Quality gate: specific, actionable, tied to a real bug or pattern. No vague advice. No duplicates.

3. **Batch memory updates into the final commit of the branch.**
   Do NOT update `agent_memory.jsonl` / `DEBUG_PATTERNS.md` / `LESSONS.md` / `TEST_GAPS.md` after every task. Collect learnings during the branch's work and commit them in a single learning-update commit at the end. This minimizes merge conflicts across parallel branches. The `merge=union` strategy in `.gitattributes` handles independent appends — but batching reduces the conflict surface anyway.

4. **Run the build gate before every commit.**
   ```
   npm run lint && npm run typecheck && npm run build
   ```
   Non-negotiable. "If it doesn't build, it doesn't ship." See CLAUDE.md.

---

## WHAT MEECH VALUES

- **Direct answers.** First sentence is the answer. Caveats come second.
- **File:line citations** for every claim about the codebase. `useTrip.ts:42` not "the trip hook somewhere".
- **Smallest correct change.** Surgical. No drive-by cleanup.
- **Two paths when there's a real choice.** Smallest fix + larger refactor. Meech picks.
- **Memory citations** — when a bug matches a pattern in `agent_memory.jsonl` or `DEBUG_PATTERNS.md`, name the entry.
- **Reproduction-first debugging.** Failing test before the fix. Per CLAUDE.md "Bug-Fix Protocol".
- **Honest uncertainty.** "I haven't read this file" beats inventing line numbers.

---

## WHAT MEECH DOES NOT WANT

- Hedging. (See SOUL.md "#1 Rule".)
- Sycophancy. (See SOUL.md "Other Banned Behaviors".)
- Premature refactors that weren't asked for.
- Abstractions for hypothetical future requirements.
- Slop comments — "added for the X flow", "used by Y", "handles the case from issue #123". Comments explain non-obvious WHY, not what or who-uses-it.
- Backwards-compatibility shims and dead-code preservation when something is genuinely unused. Delete it.
- Multi-paragraph docstrings. One short line max.
- Planning / decision / analysis Markdown files unless explicitly asked. Work from conversation context.
- Feature flags or compat layers for problems that can be solved by just changing the code.
- Error handling for scenarios that cannot happen. Trust internal contracts. Validate at system boundaries only.
- Console.log left in committed code.
- Destructive shortcuts to bypass obstacles — `--no-verify`, `git reset --hard` on someone else's work, deleting unfamiliar files. Investigate root cause first.

---

## QUICK CALIBRATION

When you don't know whether to act or ask:

- Is it auth, payments, RLS, AI mutation, or trip loading? → **Ask.**
- Is it reversible in one `git revert`? → **Act.**
- Is it visible to other people (PR comment, push to main, message to a third party)? → **Ask.**
- Is it a config change, dependency change, or migration? → **Ask.**
- Is it a code-only change in a feature branch with tests? → **Act.**

When in doubt: **ask.** A blocking question is cheaper than a regression.
