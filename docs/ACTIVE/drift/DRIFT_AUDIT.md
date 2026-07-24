# ChravelApp Drift Audit & Control System

> Branch: `claude/chravelapp-drift-control-aby9qg`
> Machine-readable ledger: [`drift-ledger.json`](./drift-ledger.json)
> Run it: `npm run drift:check`

"Drift" = any unintended disagreement between two representations of the same
system (git ↔ live schema ↔ generated types ↔ config ↔ code ↔ external
providers). ChravelApp's product promise is a single synchronized source of
truth for every participant, so drift is a product risk, not just hygiene.

The repo already had **many** targeted checks (permission-matrix drift, Stream
parity, IAP parity, schema-drift, env validation, DAL guard, 12 `qa:*`
guardrails) — but they were **fragmented**: no single entry point, and two of
them (Stream + IAP parity) ran in **no CI workflow at all**. This work
consolidates them behind one gate and adds the two missing high-value checks
(edge-function↔config auth parity, migration integrity), without touching
production data or protected files.

---

## Executive summary

| | Count |
|---|---|
| Findings recorded | 11 |
| P1 (confirmed, user-facing) | 1 |
| P2 | 6 |
| P3 | 4 |
| Fixed / gated in this branch | 4 |
| Quarantined (needs a human config.toml change) | 2 |
| Deferred with paste-ready follow-ups | 5 |

**Highest-risk confirmed drift:** `revenuecat-webhook` has no `config.toml`
block, so a CLI deploy gates it with `verify_jwt = true` even though RevenueCat
authenticates with a shared-secret header, not a Supabase JWT — the gateway
would reject the webhook before the function's own check runs (**DRIFT-01**).
The fix is a one-block `config.toml` change; because `config.toml` is a
protected file, it is **detected and quarantined**, not auto-applied.

**No production database was touched.** No migration was edited. No
`verify_jwt` value was changed. External/credentialed comparisons that could not
be verified here are reported as **skipped**, never as passing.

---

## Source-of-truth matrix

| Concern | Canonical source | Drift check | Coverage |
|---|---|---|---|
| DB schema → TS types | `src/integrations/supabase/types.ts` (generated) | `check-schema-drift.ts` → `drift:schema` | Strong (column-level) |
| Applied migration order | `supabase/migrations/` (forward-only) | `check-migration-drift.mjs` → `drift:migrations` | **New** — blocks new collisions |
| Edge-function auth | `supabase/config.toml` | `check-edge-function-parity.mjs` → `drift:functions` | **New** — orphans + webhook gaps |
| Edge env vars | `.env.example` / `.env.production.example` | `check-env-coverage.ts` → `drift:env-coverage` | Good (non-strict in CI) |
| Roles / permissions | `config/permission-matrix.json` | `check-permission-matrix-drift.mjs` → `permissions:drift` | Strong (`.ts`; `.sql` gap — DRIFT-11) |
| Query keys | `src/lib/queryKeys.ts` (`tripKeys`) | `store-query-ownership-guard.cjs` (notifications only) | Weak (DRIFT-08) |
| DAL boundary | `src/services/dal/` | `check-duplicate-service-wrappers.sh` → `lint:dal` | Narrow (2 endpoints — DRIFT-09) |
| Env presence | `scripts/validate-env.ts` manifest | `validate-env.ts --ci` | Good (external) |
| Billing / entitlements | `src/billing/config.ts` + store manifests | `validate-iap-parity.mjs` → `iap:parity` | Strong |
| Stream config | Stream dashboard + Supabase secrets | `check-stream-config-parity.cjs` → `ops:check-stream-parity` | External (skipped w/o creds) |
| Analytics events | `src/telemetry/types.ts` (`TelemetryEventMap`) | TypeScript compile-time | Strong |
| Routes | inline in `src/App.tsx` | none | Missing (DRIFT — see backlog) |
| Design tokens | `tailwind.config.ts` + `src/index.css` | none | Missing (backlog) |

---

## The unified gate: `npm run drift:check`

Read-only orchestrator (`scripts/drift-check.mjs`). Runs 7 local checks always,
and 2 external checks only when their credentials are present — otherwise it
reports them **skipped (not verified)** so it never falsely claims parity.

```
✅ Supabase schema ↔ generated types
✅ Migration integrity (duplicate timestamps / naming)
✅ Edge function ↔ config.toml auth parity
✅ Edge Deno.env vars documented
✅ Permission matrix (frontend ↔ edge ↔ SQL)
✅ Duplicate service-wrapper (DAL boundary)
✅ IAP/billing parity (code ↔ ASC ↔ Play)
⏭️  Stream config parity            (skipped — Stream secrets not present)
⏭️  Required environment variables  (skipped — VITE_* env not present)
```

- The one mutating check (permission matrix regenerates files) is wrapped so any
  file it dirties that was clean before is **restored** — the orchestrator
  leaves the tree as it found it.
- Wired into CI via `.github/workflows/drift-check.yml` (PRs to `main`/`develop`,
  weekly cron, manual dispatch). External checks skip there too; map GitHub
  secrets into the step's `env:` to enable them.

### New npm scripts

| Script | Purpose |
|---|---|
| `drift:check` | Unified orchestrator (all checks) |
| `drift:functions` | Edge-function ↔ config.toml parity |
| `drift:migrations` | Migration integrity (duplicate timestamps) |
| `drift:schema` | Alias for `check-schema-drift.ts` (was CI-only) |
| `drift:env-coverage` | Alias for `check-env-coverage.ts` (was CI-only) |
| `db:types` | Canonical Supabase types regen (`--linked`) |

### Baselines (grandfathering, not hiding)

- `scripts/drift/migration-drift-baseline.json` — the 23 existing duplicate
  timestamps + 22 naming exceptions. Renaming applied migrations is unsafe, so
  they are frozen; **new** collisions fail. Regenerate deliberately with
  `node scripts/drift/check-migration-drift.mjs --update-baseline`.
- `scripts/drift/edge-function-parity-baseline.json` — the 5 orphaned config
  blocks + `revenuecat-webhook`, each with a required follow-up. These stay
  **visible** in every run (printed as tracked known drift); **new** drift fails.

---

## Findings (see `drift-ledger.json` for full evidence)

| ID | Sev | Title | Status |
|---|---|---|---|
| DRIFT-01 | P1 | `revenuecat-webhook` missing `verify_jwt = false` | Quarantined → external action |
| DRIFT-02 | P2 | 5 orphaned `config.toml` blocks (no code) | Quarantined → external action |
| DRIFT-03 | P2 | 54 functions inherit `verify_jwt=true` implicitly | Deferred (review subset) |
| DRIFT-04 | P2 | 23 duplicate migration timestamps | **Gated** (new ones blocked) |
| DRIFT-05 | P2 | Fragmented checks / missing CI coverage | **Fixed** |
| DRIFT-06 | P3 | `types.ts` no banner / regen not wired | **Fixed** (`db:types`) |
| DRIFT-07 | P2 | 2 undocumented VERTEX env vars (strict) | Deferred |
| DRIFT-08 | P2 | Query keys bypass the `tripKeys` factory | Deferred |
| DRIFT-09 | P2 | Components bypass the DAL boundary | Deferred |
| DRIFT-10 | P3 | `validate-env.test.ts` never runs in vitest | Deferred |
| DRIFT-11 | P3 | Permission-matrix `.sql` output not drift-checked | Deferred |

---

## External action checklist (cannot be done in code here)

`supabase/config.toml` is a protected file (the sensitive-file hook blocks
edits), and `verify_jwt` must not be flipped without tracing callers. These need
a human:

| System | Change | Why | Risk | Verify |
|---|---|---|---|---|
| `supabase/config.toml` | Add `[functions.revenuecat-webhook]` `verify_jwt = false` | RevenueCat webhooks authenticate by shared secret, not JWT (DRIFT-01) | Low — endpoint already enforces `REVENUECAT_WEBHOOK_SECRET` | `npm run drift:functions` stops reporting it; send a RevenueCat test event |
| `supabase/config.toml` | Decide each of the 5 orphaned blocks: remove or restore code (DRIFT-02) | Config references non-existent functions | Low | `drift:functions` orphan list empties |
| `supabase/config.toml` (review) | Audit the webhook/public subset of the 54 no-config functions (`health`, `fetch-og-metadata`, `web-push-send`, `push-notifications`, `get-trip-detail`) (DRIFT-03) | Confirm intended JWT posture | Medium — trace callers first | Explicit blocks added where public access is required |

After any `config.toml` change, update
`scripts/drift/edge-function-parity-baseline.json` (remove the now-fixed entry)
so the gate confirms the reconciliation.

---

## Deferred backlog — paste-ready follow-up prompts

**DRIFT-07 — env-coverage `--strict`:**
> Document `VERTEX_PROJECT_ID` and `VERTEX_SERVICE_ACCOUNT_KEY` as parseable
> `KEY=` entries in `.env.production.example` (they're used in
> `supabase/functions/_shared/fcmV1.ts`), then change `drift:env-coverage` and
> the drift-check orchestrator to run `check-env-coverage.ts --strict`. Confirm
> `npm run drift:check` stays green.

**DRIFT-08 — query-key factory enforcement:**
> Extend `src/lib/queryKeys.ts` (`tripKeys`) to cover the slices currently hand-
> written inline (tasks, links, places, broadcasts, pendingActions, feature
> flags, concierge usage, proTrips, events). Migrate the hooks in
> `src/hooks/` and `src/features/` off inline array keys, then generalize
> `scripts/qa/store-query-ownership-guard.cjs` into a lint that fails on inline
> trip-scoped keys. Keep invalidation behavior identical; verify with the
> existing tripKeys test.

**DRIFT-09 — DAL boundary lint:**
> Add an ESLint `no-restricted-syntax` rule (or extend
> `check-duplicate-service-wrappers.sh`) that flags `supabase.from(` /
> `supabase.functions.invoke(` inside `src/components/**`, with an allowlist for
> vetted exceptions. Migrate `CreateTripModal`, `ConsumerBillingSection`,
> `OutstandingPayments`, `TravelCompanySection` onto hooks/services first so the
> rule lands green.

**DRIFT-10 — run the env-validator test:**
> Add a vitest project/glob for `scripts/__tests__/**` (or a dedicated
> `test:scripts` script) so `validate-env.test.ts` actually executes, and wire
> it into CI. Confirm no OOM/perf impact on the sharded suite.

**DRIFT-11 — permission-matrix SQL drift:**
> Extend `scripts/check-permission-matrix-drift.mjs` to also regenerate and diff
> `supabase/sql/permission_matrix_allows.generated.sql`, failing on drift, so all
> three generated artifacts are covered.

**Backlog (no finding yet, noted for completeness):** route registry (routes are
inline in `src/App.tsx`), design-token lint (no raw-color rule).

---

## Residual-risk register

| Risk | Prob. | Impact | Mitigation |
|---|---|---|---|
| RevenueCat webhook stays JWT-gated until config.toml fixed | Med | Entitlement drift for iOS | DRIFT-01 quarantined + surfaced every run; external action listed |
| External parity (Stream/env) unverified in this environment | High | Unknown provider drift | drift:check reports as skipped (not passing); enable via CI secrets |
| Deferred src-level drift (query keys, DAL) persists | Med | Stale UI / inconsistent error handling | Paste-ready follow-ups above; both are detection-first, low-blast-radius |
| Live schema vs migrations not compared here (no DB creds) | High | Remote-only objects undetected | `supabase db diff --linked` in a secured CI job (future); `check-schema-drift` covers code↔types today |

---

## Agent guardrails (contribution rules)

For any coding agent (Lovable, Codex, Claude Code, Cursor) or human working here:

1. **Run `npm run drift:check` before finishing** any change to migrations, edge
   functions, `config.toml`, the permission matrix, env, or billing.
2. **Never edit an already-applied migration.** Add a forward migration.
   New migrations need a **unique** 14-digit timestamp (`drift:migrations`
   enforces it).
3. **New edge function → add its `[functions.NAME]` block to `config.toml`**
   with an explicit `verify_jwt`. Webhooks/public endpoints = `false`
   (`drift:functions` enforces the webhook case).
4. **After any DB migration, regenerate types** with `npm run db:types` (or the
   `--local` variant) and commit the result.
5. **Query keys come from `src/lib/queryKeys.ts`**, not inline arrays.
6. **Components use hooks/services**, not direct `supabase.*` calls.
7. **Don't silence a drift check by editing a baseline** unless you have
   reconciled the underlying drift; baselines grandfather *shipped* state only.
8. **Disclose external console changes** (Supabase/Vercel/Stream/Stripe/
   RevenueCat) in the PR — code can't make them, but the drift checks assume
   they were made.
