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
| Fixed / gated in this branch | 9 |
| Quarantined (needs a human config.toml change) | 0 (DRIFT-01/02 now applied to config.toml) |
| Deferred (needs human review, not a code fix) | 0 (DRIFT-03 reconciled) |

**Update (this branch now also reconciles the src-level drift):** DRIFT-07
through DRIFT-11 — originally deferred — are now fixed and verified. Only the two
`config.toml` items (DRIFT-01/02) remain, because that file is hard-blocked by
the `protect-sensitive-files.sh` hook; and DRIFT-03 (public-endpoint review) is a
human judgment call, not a code change.

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
| Edge env vars | `.env.example` / `.env.production.example` | `check-env-coverage.ts` → `drift:env-coverage` | Strong (`--strict`; all documented — DRIFT-07 fixed) |
| Roles / permissions | `config/permission-matrix.json` | `check-permission-matrix-drift.mjs` → `permissions:drift` | Strong (all 3 artifacts — DRIFT-11 fixed) |
| Query keys | `src/lib/queryKeys.ts` (`tripKeys`) | `check-query-key-ownership.mjs` → `drift:query-keys` | Strong (consolidated + guard — DRIFT-08 fixed) |
| DAL boundary | `src/services/dal/`, `src/billing/checkout.ts` | `check-duplicate-service-wrappers.sh` → `lint:dal` | Improved (billing consolidated + guard — DRIFT-09 fixed) |
| Env presence | `scripts/validate-env.ts` manifest | `validate-env.ts --ci` | Good (external) |
| Billing / entitlements | `src/billing/config.ts` + store manifests | `validate-iap-parity.mjs` → `iap:parity` | Strong |
| Stream config | Stream dashboard + Supabase secrets | `check-stream-config-parity.cjs` → `ops:check-stream-parity` | External (skipped w/o creds) |
| Analytics events | `src/telemetry/types.ts` (`TelemetryEventMap`) | TypeScript compile-time | Strong |
| Routes | inline in `src/App.tsx` | none | Missing (DRIFT — see backlog) |
| Design tokens | `tailwind.config.ts` + `src/index.css` | none | Missing (backlog) |

---

## The unified gate: `npm run drift:check`

Read-only orchestrator (`scripts/drift-check.mjs`). Runs 8 local checks always,
and 2 external checks only when their credentials are present — otherwise it
reports them **skipped (not verified)** so it never falsely claims parity.

```
✅ Supabase schema ↔ generated types
✅ Migration integrity (duplicate timestamps / naming)
✅ Edge function ↔ config.toml auth parity
✅ Edge Deno.env vars documented (--strict)
✅ Permission matrix (frontend ↔ edge ↔ SQL)
✅ Duplicate service-wrapper (DAL boundary)
✅ Query-key ownership (tripKeys factory)
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
| `drift:query-keys` | Query keys must come from the `tripKeys` factory |
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
| DRIFT-01 | P1 | `revenuecat-webhook` missing `verify_jwt = false` | **Fixed** (config.toml) |
| DRIFT-02 | P2 | 5 orphaned `config.toml` blocks (no code) | **Fixed** (removed) |
| DRIFT-03 | P2 | 54 functions inherit `verify_jwt=true` implicitly | **Fixed** (3 public → false; rest correct) |
| DRIFT-04 | P2 | 23 duplicate migration timestamps | **Gated** (new ones blocked) |
| DRIFT-05 | P2 | Fragmented checks / missing CI coverage | **Fixed** |
| DRIFT-06 | P3 | `types.ts` no banner / regen not wired | **Fixed** (`db:types`) |
| DRIFT-07 | P2 | 36 undocumented edge env vars; parser ignored `# KEY` docs | **Fixed** (parser + docs + `--strict`) |
| DRIFT-08 | P2 | Query keys bypass the `tripKeys` factory | **Fixed** (consolidated + `drift:query-keys` guard) |
| DRIFT-09 | P2 | `create-checkout`/`customer-portal` invoked inline ×8 | **Fixed** (`src/billing/checkout.ts` + `lint:dal`) |
| DRIFT-10 | P3 | `validate-env.test.ts` never runs in vitest | **Fixed** (imports real specs + vitest glob) |
| DRIFT-11 | P3 | Permission-matrix `.sql` output not drift-checked | **Fixed** (checker covers all 3 artifacts) |

---

## External action checklist — ✅ APPLIED

`supabase/config.toml` is a protected file (the sensitive-file hook blocks the
agent's edits), and `verify_jwt` must not be flipped without tracing callers.
The changes below were reviewed with the human and applied directly to
`config.toml` (`push-client-config` and `mcp` were also identified as public and
declared `verify_jwt = false`):

| System | Change | Why | Risk | Verify |
|---|---|---|---|---|
| `supabase/config.toml` | Add `[functions.revenuecat-webhook]` `verify_jwt = false` | RevenueCat webhooks authenticate by shared secret, not JWT (DRIFT-01) | Low — endpoint already enforces `REVENUECAT_WEBHOOK_SECRET` | `npm run drift:functions` stops reporting it; send a RevenueCat test event |
| `supabase/config.toml` | Decide each of the 5 orphaned blocks: remove or restore code (DRIFT-02) | Config references non-existent functions | Low | `drift:functions` orphan list empties |
| `supabase/config.toml` (review) | Audit the webhook/public subset of the 54 no-config functions (`health`, `fetch-og-metadata`, `web-push-send`, `push-notifications`, `get-trip-detail`) (DRIFT-03) | Confirm intended JWT posture | Medium — trace callers first | Explicit blocks added where public access is required |

After any `config.toml` change, update
`scripts/drift/edge-function-parity-baseline.json` (remove the now-fixed entry)
so the gate confirms the reconciliation.

---

## Reconciled in this branch (DRIFT-07 – DRIFT-11)

All five originally-deferred findings were fixed and verified (typecheck + the
affected tests + `drift:check`), each as its own commit:

- **DRIFT-07** — aligned `check-env-coverage.ts` to the repo's `# KEY` comment-doc
  convention (false undocumented 61 → 36), documented the 36 truly-missing edge
  env vars, and enabled `--strict`.
- **DRIFT-08** — migrated every inline trip-scoped query key onto `tripKeys`
  (proven byte-identical no-ops; fixed one real optimistic-update key mismatch in
  `TripLinksDisplay`), and added the `drift:query-keys` ownership guard.
- **DRIFT-09** — consolidated `create-checkout` (×6) and `customer-portal` (×2)
  into `src/billing/checkout.ts` (behavior-preserving), and extended `lint:dal`
  to block new inline callers.
- **DRIFT-10** — made `validate-env.test.ts` import the real spec arrays (it had
  drifted) and run under vitest; guarded `validate-env.ts`'s CLI with an
  entry-point check, CLI output proven byte-identical.
- **DRIFT-11** — `check-permission-matrix-drift.mjs` now regenerates and diffs all
  three generated artifacts (2 `.ts` + the RLS `.sql`).

## Remaining backlog (not addressed here)

- **DRIFT-03** — human review of the 54 no-config functions' public/webhook
  subset (`health`, `fetch-og-metadata`, `web-push-send`, `push-notifications`,
  `get-trip-detail`): trace callers, add explicit `verify_jwt` blocks where public
  access is required. Not a mechanical fix.
- **Route registry** — routes are inline in `src/App.tsx`; no canonical registry.
- **Design-token lint** — no raw-color/spacing enforcement against
  `tailwind.config.ts` + `src/index.css`.

---

## Residual-risk register

| Risk | Prob. | Impact | Mitigation |
|---|---|---|---|
| ~~RevenueCat webhook stays JWT-gated~~ (RESOLVED) | — | — | Fixed: `[functions.revenuecat-webhook] verify_jwt=false` now in config.toml; deploy + send a RevenueCat test event to confirm end-to-end |
| External parity (Stream/env) unverified in this environment | High | Unknown provider drift | drift:check reports as skipped (not passing); enable via CI secrets |
| Billing consolidation touches payment components with thin test coverage | Low | Checkout regression | DRIFT-09 was a behavior-preserving mechanical extraction (helper replicates invoke+throw exactly); verified by typecheck, lint, UpgradeModal/SettingsMenu tests |
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
