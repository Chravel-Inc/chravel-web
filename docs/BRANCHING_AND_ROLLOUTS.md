# Branching, Lovable Sync & Feature Rollouts

> **Who this is for:** the founder and anyone (or any AI tool — Claude Code, Cursor,
> Codex, Lovable) working in this repo who needs to know *how we ship without breaking
> production*. Written to be read top-to-bottom once, then used as a reference.
>
> **The one-sentence version:** Do risky work on a **short-lived branch**, merge it to
> `main` **hidden behind a feature flag**, then **flip the flag on** for a growing slice
> of users. Branches isolate work; **flags decide who sees a feature.**

---

## TL;DR — the mental model

There are two *completely different* things people mix up:

| | **Deploying code** | **Releasing a feature** |
|---|---|---|
| Question it answers | "Is the code on the server?" | "Can a user see/use it?" |
| Controlled by | **branches → PR → merge to `main`** | **feature flags** |
| Reversible by | reverting a commit (slow, messy) | flipping a flag off (**≤60s, no redeploy**) |
| Targets *users*? | No | **Yes** — internal testers → % of users → everyone |

**You never roll a feature out to a subset of users with a branch.** A branch is invisible
to your users (and to Lovable) until it's merged, and once it's merged *everyone* on
`main` has the code. To reach *some* users, you merge the code **turned off**, then turn it
on for the group you choose. That's what feature flags are for, and you already have them.

---

## Part 1 — Branches vs. `main`, in plain English

- **`main`** is the single source of truth. In this repo, **merging to `main` deploys
  straight to production** on Vercel — there is no approval gate. `main` is also what
  **Lovable's two-way sync reads and writes** (more on that in Part 3). So `main` is
  *live and shared*. Treat every merge to it as "this is now in front of real users."

- **A branch** is your own private copy of the code. You can change anything on it without
  touching `main`, production, or Lovable. Nobody else sees your branch's changes until you
  merge them.

- **A Pull Request (PR)** is the request to merge your branch into `main`. Opening a PR
  runs all the automated checks (see Part 5) and gives you a **Vercel preview URL** — a
  live, throwaway copy of the whole app built from *your branch* — so you can click around
  and test before anything reaches production.

- **Merging** the PR moves your changes into `main` → deploys to production.

```
  main ──●───────●─────────────●────►  (production, live, synced with Lovable)
          \                   /
 feature/  ●──●──●  (your work; a PR opens a preview URL) ──► merge
```

**Why this is safer than committing to `main` directly:** your half-finished work never
touches production, the checks catch mistakes before merge, and the preview URL lets you
*see* the change working first.

---

## Part 2 — The workflow to use (every time)

This is trunk-based development: **many short-lived branches, one trunk (`main`).** It's the
model that fits this repo's reality (single production database, Lovable on `main`, auto-deploy).

### Step by step

```bash
# 1. Start from the latest main — always.
git checkout main
git pull origin main

# 2. Create a short-lived branch. Use the repo's naming convention:
#    feature/  fix/  docs/  refactor/  chore/     (see CONTRIBUTING.md)
git checkout -b feature/trip-timeline-v2

# 3. Do the work (in Cursor / Codex / Claude Code). Commit as you go.
git add -A
git commit -m "feat: add v2 trip timeline behind flag"

# 4. Push and open a PR to main.
git push -u origin feature/trip-timeline-v2
#    → open the PR on GitHub. CI runs. Vercel posts a preview URL on the PR.

# 5. Test on the preview URL. Get CI green.

# 6. Merge the PR → deploys to production (but the feature is still hidden; see Part 4).

# 7. Delete the branch. Start the next piece of work from a fresh `main` again.
```

### The rule that makes this work with Lovable: **keep branches short**

Aim to open and merge a branch within **hours to a couple of days**, not weeks. The reason is
Part 3: Lovable is constantly committing to `main`, so the longer your branch lives, the more
it drifts from `main` and the more painful the merge becomes — especially in shared files like
database migrations and `src/integrations/supabase/types.ts`.

If a piece of work is genuinely large, **split it into several small merges, each hidden
behind the same flag.** Ship the plumbing first (flag off, nobody sees it), then the UI, then
turn it on. This is far safer than one giant branch that sits open for two weeks.

---

## Part 3 — Working with Lovable's two-way GitHub sync

This is the part that's unique to your setup, and it's the reason "just use branches like a
normal team" isn't the whole story.

### What Lovable actually does

- **Lovable is bound to `main`.** Per `README.md`: *"Changes made via Lovable will be committed
  automatically to this repo"* and *"Pushed changes will also be reflected in Lovable."* That
  sync is with the **`main` branch only.**
- **Lovable applies its own database migrations directly to your one production database.**
  See `docs/MIGRATION_SYNC.md`. There is a single production Supabase project and **no separate
  staging or per-branch database** — so every schema change is global and immediate.

### What that means for you (the rules)

1. **Think of Lovable as a teammate who commits directly to `main` at any time.** You can't
   see their work-in-progress; you just get their commits landing on `main`.

2. **A branch that isn't merged is invisible to Lovable.** Lovable only knows `main`. If you
   build something on `feature/…` and then open Lovable, Lovable has no idea your branch
   exists and will happily edit the *old* version of those files on `main`. When you later
   merge, you get a conflict.

3. **Pull `main` before *and* after a Lovable session.**
   ```bash
   git checkout main && git pull origin main   # before you start branch work
   # …later, after prompting Lovable…
   git checkout main && git pull origin main   # pick up what Lovable committed
   ```

4. **Don't prompt Lovable to edit the same files you have open in a long-running branch.**
   They'll both change the same lines on `main` and collide. Pick one tool per area at a time.

5. **Database migrations are global — respect the naming split.** Automation tells the two
   apart by filename (`docs/MIGRATION_SYNC.md`):
   - **Agent** migrations (you, via Claude Code / Cursor / Codex): `YYYYMMDDHHMMSS_slug.sql`
     (**underscore** + words). Applied by CI on merge to `main`.
   - **Lovable** migrations: `YYYYMMDDHHMMSS-<uuid>.sql` (**dash + UUID**). Already applied by
     Lovable to the prod DB before you ever see the file.
   - **Never run `supabase db push`** — the two histories are divergent and it will try to
     replay ~450 migrations against a DB that already has them. `docs/MIGRATION_SYNC.md`
     explains why in detail.
   - Because there's no branch database, **write migrations so they're safe to be live in
     production even while the feature is flagged off** — idempotent DDL (`CREATE ... IF NOT
     EXISTS`, `CREATE OR REPLACE`, `DROP ... IF EXISTS`, `ON CONFLICT`). Adding an unused table
     or column ahead of a feature is fine; it just sits there until you flip the flag.

### Why not a long-lived `develop`/staging branch?

Two of your docs (`docs/CI_CD_SETUP.md`, `docs/ACTIVE/RELEASE_ENGINEERING_CONSTITUTION.md`)
describe a `develop` branch and a staging environment. **Neither exists today** — the
Constitution literally marks staging *"TO CREATE."* And a long-lived `develop` branch running
in parallel with Lovable is actively harmful: Lovable keeps committing to `main`, so `develop`
would drift further from reality every day and become a merge nightmare. **Stick with
short-lived branches → `main`.** If you later want a true staging environment, that's a
deliberate project — see Part 6.

---

## Part 4 — Rolling a feature out to a subset of users

This is the capability you actually asked for, and it's a **feature-flag** job, not a branching
job. Here's how it works and what you have today.

### What you already have

- **A flags table:** `public.feature_flags` (`key`, `enabled`, `rollout_percentage`,
  `description`, …). Anyone can *read* flags; only the service role can *change* them.
- **A client hook:** `src/lib/featureFlags.ts` →
  ```tsx
  import { useFeatureFlag } from '@/lib/featureFlags';

  function TripTimeline() {
    const showV2 = useFeatureFlag('trip_timeline_v2', false); // default OFF
    return showV2 ? <TimelineV2 /> : <TimelineV1 />;
  }
  ```
  It's cached for 60 seconds, so a flag change reaches users within ~1 minute — **no redeploy.**
- **A server-side helper:** `supabase/functions/_shared/featureFlags.ts` → `isFeatureEnabled()`,
  which **fails closed** (defaults to *off*) so a database blip can't accidentally re-enable a
  killed feature.
- **A real per-user rollout example:** `src/services/stream/streamCanary.ts`. This is the one
  place that already does true gradual rollout correctly — read it as the reference pattern.

### The rollout ladder

**1. Merge the code with the flag OFF.** Seed the flag in your migration (this is the standard
pattern — see `supabase/migrations/*_seed_*_flag.sql`):

```sql
-- migration: 20260724120000_seed_trip_timeline_v2_flag.sql
INSERT INTO public.feature_flags (key, enabled, rollout_percentage, description)
VALUES ('trip_timeline_v2', false, 0, 'New trip timeline UI — gated rollout')
ON CONFLICT (key) DO NOTHING;
```

Now the code is in production, but every user still sees the old version.

**2. Turn it on for internal testers only.** The `streamCanary.ts` pattern gates on a *cohort*
first (`isTrustedStreamCanaryUser`): internal email domains (`chravel.app`, `chravelapp.com`,
`meechyourgoals.com`) plus admin/staff roles. You dogfood it while real users see nothing.

**3. Turn it on for a small percentage of everyone**, then ramp: 10% → 50% → 100%. The correct
way to do this is the **per-user hash** from `streamCanary.ts`:

```ts
// deterministic: the SAME user is always in or out, no flicker between page loads
const bucket = simpleHash(`${flagKey}:${user.id}`) % 100;
const isIn = bucket < rollout_percentage;
```

**4. Roll back instantly if something's wrong** — just flip the flag off. No revert, no
redeploy, effective within 60 seconds:

```sql
UPDATE public.feature_flags SET enabled = false WHERE key = 'trip_timeline_v2';
```

### Two hooks — pick the right one

- **`useFeatureFlag('key', false)`** — a **kill switch**. Its `rollout_percentage` is hashed on
  the *flag key, not the user*, so anything below 100 is all-or-nothing across your whole user
  base. Use it for on/off gating of a feature for **everyone**.
- **`useGradualFeature('key', user)`** — a **true per-user rollout** (see
  `src/lib/featureFlags.ts`). It grants the feature to a **cohort allowlist** first (email
  domains in `cohort_domains`, specific ids in `cohort_user_ids`), then to a deterministic slice
  of everyone else via `hash(key:userId) % 100 < rollout_percentage` — so a user's membership is
  stable across page loads and a sub-100% actually splits the audience. Fails closed (off while
  loading / if the flag is unreachable). There's a matching `isFeatureEnabledForUser(key, user)`
  for edge functions.

```tsx
import { useGradualFeature } from '@/lib/featureFlags';
import { useAuth } from '@/hooks/useAuth';

function TripTimeline() {
  const { user } = useAuth();
  const showV2 = useGradualFeature('trip_timeline_v2', user);
  return showV2 ? <TimelineV2 /> : <TimelineV1 />;
}
```

Seed the cohort when you seed the flag, e.g. to dogfood internally at 0% public rollout:

```sql
INSERT INTO public.feature_flags (key, enabled, rollout_percentage, cohort_domains, description)
VALUES ('trip_timeline_v2', true, 0,
        ARRAY['chravel.app','chravelapp.com','meechyourgoals.com'],
        'New trip timeline UI — gated rollout')
ON CONFLICT (key) DO NOTHING;
```

### How to flip flags — the admin screen

Super admins can manage flags at **`/admin/feature-flags`** (gated by `InternalAdminRoute`):
toggle `enabled` and set `rollout_percentage` per flag, with changes taking effect in ~60s. The
screen writes through the `feature-flags-admin` edge function, which **verifies super-admin
status server-side** and mutates with the service role (the table's RLS blocks direct client
writes). You can still change flags directly with SQL (Supabase Dashboard → SQL Editor, or the
Supabase MCP) when you need to — e.g. to edit `cohort_domains` / `cohort_user_ids`, which the
screen doesn't edit.

---

## Part 5 — What the automated checks do (so you trust the merge)

Opening a PR to `main` runs these automatically (from `.github/workflows/`). You don't have to
memorize them — just know that a green PR has already been checked for the things that
historically break this app:

- **CI** (`ci.yml`): lint, typecheck, production build, unit tests, a PR-only end-to-end smoke
  test, **schema drift** (your code can't reference a DB column that doesn't exist), env
  coverage, and **migration lint** (migrations must be idempotent and correctly named).
- **Secret Scan** + **CodeQL:** no leaked keys, no known security bugs.
- **Deploy Safety** + **Merge Conflict Check:** flags risky changes (migrations, edge functions,
  billing, auth) and warns about conflicts before you merge.
- **Auto-format:** fixes formatting on the PR automatically.

Migrations and edge functions only deploy **on merge to `main`** (never from a branch/preview),
so a preview URL is safe to share — it can't change production behavior on its own. *(Note: a
preview build still talks to the **production** Supabase database unless environment variables
are scoped per-environment in the Vercel dashboard, so don't do destructive data testing on a
preview.)*

---

## Part 6 — Future upgrades (not built yet — decide when you want them)

Each of these is optional and independent. None is required for the workflow above to work.

### A. Generalize per-user rollout into a reusable hook ✅ *(shipped)*
Done — `useGradualFeature(key, user)` / `isFeatureEnabledForUser(key, user)` and the
`/admin/feature-flags` screen now exist (see Part 4). The `feature_flags` table gained
`cohort_domains` / `cohort_user_ids`, and the resolver has unit-test coverage
(`src/lib/__tests__/featureFlags.test.ts`). Remaining nice-to-haves: wire the
`stream-canary-guard` auto-rollback controller to arbitrary flags, and let the admin screen edit
cohort arrays (today they're set via SQL).

### B. Adopt PostHog feature flags / experiments *(for real A/B testing)*
PostHog is already connected (analytics only today). Its native feature flags give
dashboard-driven percentage rollout, cohort targeting, and A/B experiments with statistical
significance — no bucketing code to maintain. Use PostHog for *product experiments*, keep the
Supabase flags for *instant kill switches*.

> **Paste-ready prompt:** *"Wire PostHog feature flags into the app. Add a `usePostHogFlag(key)`
> hook that reads flags via the already-initialized PostHog client (`src/telemetry/providers/
> posthog.ts`), loads flags on identify, and falls back safely when PostHog is unavailable.
> Document when to use PostHog flags (experiments/A-B) vs. Supabase `feature_flags` (kill
> switches). Don't remove the existing Supabase flag system."*

### C. Stand up a real staging environment *(bigger project)*
A separate Supabase project + a Vercel "staging" environment + a `develop` branch, so a full
copy of the app can be exercised before `main`. This is the only way to test migrations without
touching production data — but it's meaningful setup, ongoing cost, and requires deciding how
Lovable (which is pinned to `main`) fits in. Treat as a dedicated initiative, not a quick task.

---

## Appendix — Quick reference card

```
Start work:     git checkout main && git pull && git checkout -b feature/<name>
Ship it:        push branch → open PR → CI green + test preview → merge to main
Hide it:        wrap in useFeatureFlag('<key>', false); seed flag OFF in the migration
Release it:     internal cohort → 10% → 50% → 100%   (per-user hash pattern)
Roll back:      UPDATE feature_flags SET enabled=false WHERE key='<key>';   (≤60s)
Lovable:        it owns main — pull main before/after; keep branches short; never db push
Migrations:     agent = _underscore.sql (CI applies) · Lovable = -uuid.sql (already applied)
```

**Related docs:** `CLAUDE.md` (§ Branching & Release Workflow), `docs/MIGRATION_SYNC.md`
(the repo ↔ Lovable ↔ DB sync deep-dive), `CONTRIBUTING.md` (branch naming, commit style),
`src/services/stream/streamCanary.ts` (the working per-user rollout example).
