# Vitest Setup

## Versions
| Package | Version | Source |
|---|---|---|
| `vitest` | 4.0.18 | `package.json:154` |
| `@vitest/coverage-v8` | 4.0.18 | `package.json:147` |
| `@vitest/ui` | 4.0.18 | `package.json:148` |
| `@testing-library/react` | 14.3.1 | `package.json:146` |
| `@testing-library/dom` | 10.4.1 | `package.json:145` |
| `@testing-library/jest-dom` | 6.6.3 | `package.json:85` |
| `@testing-library/user-event` | 14.6.1 | `package.json:86` |
| `happy-dom` | 20.0.11 | `package.json:110` |
| `jsdom` | 27.4.0 | `package.json:149` |
| `fake-indexeddb` | 6.2.5 | `package.json:107` |

## Config
- `vitest.config.ts` at repo root.
- Uses Vite plugin pipeline directly (`@vitejs/plugin-react-swc`).
- Mix of `happy-dom` and `jsdom` environments (per-test override where needed).
- `fake-indexeddb` registers globally for IndexedDB-using tests (offline queue, idb consumers).

## Running tests

| Script | Behavior |
|---|---|
| `npm run test` | Watch mode |
| `npm run test:run` | Single run |
| `npm run test:run:ci` | CI: reporter=dot, coverage enabled |
| `npm run test:coverage` | Local coverage |
| `npm run test:ui` | Vitest UI |

## Where tests live

- `src/__tests__/` — root-level integration tests (security audits, etc.)
- `src/<feature>/**/__tests__/` — co-located with the module
- 217 `*.test.*` / `*.spec.*` files under `src` at SHA `1e833665`

Known co-located test directories:
- `src/billing/providers/__tests__/`
- `src/features/broadcasts/components/__tests__/`
- `src/features/calendar/utils/__tests__/`
- `src/features/chat/adapters/__tests__/`
- `src/features/chat/components/__tests__/`
- `src/features/chat/hooks/__tests__/`
- `src/features/chat/utils/__tests__/`
- `src/features/concierge/hooks/__tests__/`
- `src/features/smart-import/api/__tests__/`

## Test conventions (from `CLAUDE.md` / `LESSONS.md`)

- When a hook gains an auth dependency, **add explicit `useAuth` mocks immediately** to its tests (`LESSONS.md`).
- Tests should fail for the real reason before the fix is implemented (`CLAUDE.md` bug-fix protocol).
- Critical paths must have test coverage; gaps tracked in `TEST_GAPS.md`.

## Coverage

- Reporter: V8 via `@vitest/coverage-v8`.
- File coverage estimated ~12% at SHA `1e833665` (217 tests vs 1,105 source files).
- Coverage map at [`coverage-map.md`](./coverage-map.md).

## Source Refs

- `vitest.config.ts`
- `package.json:21-25, 107, 110, 145-149, 154`
- 217 files matching `*.test.*` / `*.spec.*` under `src`
- `CLAUDE.md` — bug-fix protocol
- `LESSONS.md` — explicit useAuth mocks; test gap tracking
- `TEST_GAPS.md` — 17 tracked test gaps
