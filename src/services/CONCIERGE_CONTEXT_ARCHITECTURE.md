# Concierge Context Architecture Guard

`TripContextAggregator` (`src/services/tripContextAggregator.ts`) is the **single source of truth** for concierge trip context assembly.

## Guardrails

- `UniversalConciergeService` must build concierge context via `TripContextAggregator.buildContext(...)`.
- `EnhancedTripContextService` is deprecated and removed from production paths.
- ESLint blocks imports of `enhancedTripContextService` (`no-restricted-imports` paths + wildcard patterns) to prevent reintroduction via relative-path variants.
