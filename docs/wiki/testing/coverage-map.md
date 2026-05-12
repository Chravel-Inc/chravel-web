# Coverage Map

> **Authoritative gap list:** [`TEST_GAPS.md`](../../../TEST_GAPS.md) at repo root tracks 17 specific gap areas.

## Headline

- **Test files:** 217 under `src/` (count via `find src -name "*.test.*" -o -name "*.spec.*"`)
- **Source files:** 1,105 `.ts/.tsx` under `src/`
- **Approximate file-level coverage:** ~12%

## Per-subsystem coverage (qualitative)

| Subsystem | Test presence | Notes |
|---|---|---|
| Chat | High (multiple `__tests__/` dirs in `src/features/chat/`) | Adapters, components, hooks, utils all have tests |
| Broadcasts | Some (`src/features/broadcasts/components/__tests__/`) | Mid coverage |
| Calendar | Some (`src/features/calendar/utils/__tests__/`) | Utils only — hooks gap |
| Concierge | Some (`src/features/concierge/hooks/__tests__/`) | Hooks covered; tool execution under-tested |
| Smart Import | Some (`src/features/smart-import/api/__tests__/`) | API surface tested |
| Billing / payments | Some (`src/billing/providers/__tests__/`) | Provider tests; mutation paths under-tested |
| Trips core | Low | Hook tests scattered in `src/hooks/__tests__/` (if present) |
| Auth | Medium | Critical path; specific `useAuth` mock guidance in `LESSONS.md` |
| Realtime | Low | 41 subscription files; few targeted tests |
| Edge functions | Variable | Some have inline tests in their dirs; coverage uneven |
| RLS / DB | Limited | Schema audit at `docs/ACTIVE/SCHEMA_AUDIT.md`; runtime policy tests not enumerated |

## Top documented gaps (from `TEST_GAPS.md`)

`TEST_GAPS.md` tracks 17 areas. Highlights known via `CLAUDE.md` "Test coverage ~12% file coverage" note:

- Trip preview CTA membership-and-join-request resolution
- Dashboard request cards vs request counters source-of-truth
- Pin/unpin chat mutations
- Transport-mode propagation in chat surfaces (Stream vs Supabase)
- Hook auth-dependency mocking (catch-as-you-add)
- AI renderer paths behind endpoint-level feature flags
- Lineup "replace import" hard-delete on transient insert failures (`DEBUG_PATTERNS.md`)

## How to add coverage

1. Read the relevant subsystem doc and pick a missing flow.
2. Write a failing test in the closest existing `__tests__/` directory.
3. Run `npm run test:run` to confirm it fails for the right reason.
4. (Optional) Run `npm run test:ui` for the interactive view.
5. Commit alongside any logic that closes the gap.
6. Update `TEST_GAPS.md` to remove the closed item.

## E2E

Playwright lives in `e2e/` — see [`e2e-strategy.md`](./e2e-strategy.md).

## Source Refs

- `TEST_GAPS.md` (repo root) — 17 tracked gaps
- 217 test files under `src/` (find at SHA `1e833665`)
- `CLAUDE.md` — coverage baseline note
- `LESSONS.md` — explicit useAuth mocks, etc.
- `DEBUG_PATTERNS.md` — patterns that should have regression tests
