# Chravel Code Wiki — Index

> **Auto-generated, file-grounded knowledge layer for `chravel-web`.**
> **Generated:** 2026-05-12 · **Git SHA:** `1e833665` · **Branch:** `claude/code-wiki-generator-YIV8v`

Every section below cites real file paths with line ranges. If a citation does not resolve, file an issue and re-run regen (see `REGEN.md`).

For an LLM-grounded chat session, load **[`SEARCH.md`](./SEARCH.md)** — a single concatenated file optimized for retrieval-augmented Q&A.

---

## How to read this wiki

1. New to the codebase? Start at [`overview/01-what-is-chravel.md`](./overview/01-what-is-chravel.md) → [`overview/04-onboarding-day-one.md`](./overview/04-onboarding-day-one.md).
2. Investigating a bug? Open the relevant subsystem in [`subsystems/`](./subsystems/) — every section has a Known Risks block that cross-links [`RISKS.md`](./RISKS.md).
3. Planning a change? Read the relevant architecture file in [`architecture/`](./architecture/) before touching code.
4. Need a diagram? Every architecture/subsystem doc embeds Mermaid; standalone sources live in [`diagrams/`](./diagrams/).
5. Pitching the codebase? [`deck/deck.md`](./deck/deck.md) is paste-ready for gamma.app/create.

---

## Sections

### Overview
- [01 — What is Chravel](./overview/01-what-is-chravel.md)
- [02 — Stack at a Glance](./overview/02-stack-at-a-glance.md)
- [03 — Repo Map](./overview/03-repo-map.md)
- [04 — Day-One Onboarding](./overview/04-onboarding-day-one.md)

### Architecture
- [01 — System Architecture](./architecture/01-system-architecture.md)
- [02 — Routing](./architecture/02-routing.md)
- [03 — State Management](./architecture/03-state-management.md)
- [04 — Data Model / ER](./architecture/04-data-model-er.md)
- [05 — Auth & RLS](./architecture/05-auth-and-rls.md)
- [06 — Edge Functions](./architecture/06-edge-functions.md)
- [07 — Realtime Channels](./architecture/07-realtime-channels.md)
- [08 — Deployment Topology](./architecture/08-deployment-topology.md)

### Subsystems
- [Chat & Broadcasts](./subsystems/chat-broadcasts.md)
- [Calendar](./subsystems/calendar.md)
- [Places & Links](./subsystems/places-and-links.md)
- [AI Concierge](./subsystems/ai-concierge.md)
- [Polls](./subsystems/polls.md)
- [Tasks](./subsystems/tasks.md)
- [Payments](./subsystems/payments.md)
- [Media](./subsystems/media.md)
- [Events & Viral Loop](./subsystems/events-and-viral-loop.md)
- [Pro / Enterprise Tiers](./subsystems/pro-enterprise-tiers.md)

### Integrations
- [Stripe](./integrations/stripe.md)
- [RevenueCat](./integrations/revenuecat.md)
- [Google Maps](./integrations/google-maps.md)
- [Firebase (FCM)](./integrations/firebase.md)
- [Sentry](./integrations/sentry.md)
- [PostHog](./integrations/posthog.md)
- [Gemini / Vertex / Lovable API](./integrations/gemini-lovable-api.md)
- [Capacitor Mobile Bridge](./integrations/capacitor-mobile-bridge.md) — *stub; native shell lives in `chravel-mobile` sister repo*

### Platform
- [PWA](./platform/pwa.md)
- [Capacitor / iOS](./platform/capacitor-ios.md) — *stub; see `chravel-mobile`*
- [Performance](./platform/performance.md)

### Testing
- [Vitest Setup](./testing/vitest-setup.md)
- [Coverage Map](./testing/coverage-map.md)
- [E2E Strategy](./testing/e2e-strategy.md)

### Diagrams (source `.mmd`)
- [System Architecture](./diagrams/system-architecture.mmd)
- [Auth Sequence](./diagrams/auth-sequence.mmd)
- [Trip Creation Sequence](./diagrams/trip-creation-sequence.mmd)
- [Chat Realtime Sequence](./diagrams/chat-realtime-sequence.mmd)
- [Payments / Stripe Sequence](./diagrams/payments-stripe-sequence.mmd)
- [AI Concierge Sequence](./diagrams/ai-concierge-sequence.mmd)
- [Component Tree — App Shell](./diagrams/component-tree-app-shell.mmd)
- [Component Tree — Trip Detail](./diagrams/component-tree-trip-detail.mmd)
- [Data Flow — Trips](./diagrams/data-flow-trips.mmd)
- [ER Diagram](./diagrams/er-diagram.mmd)
- [Deployment Topology](./diagrams/deployment-topology.mmd)

### Deck
- [Outline (27 slides)](./deck/deck-outline.md)
- [Gamma-ready Markdown](./deck/deck.md)

### Operations
- [REGEN.md](./REGEN.md) — how to regenerate this wiki and what triggers staleness
- [CHANGELOG.md](./CHANGELOG.md) — append-only regeneration log
- [RISKS.md](./RISKS.md) — field-drift register, RLS gaps, dead code, deferred fixes

---

## Companion repos
- **`chravel-mobile`** — Capacitor v8 iOS/Android shell. Wraps the same React app for native distribution. This wiki documents the web/PWA shell only.

## Cross-links to existing docs
The wiki cross-references rather than duplicates these resources:
- [`CLAUDE.md`](../../CLAUDE.md) — engineering manifesto & hard constraints
- [`docs/ACTIVE/DEVELOPER_HANDBOOK.md`](../ACTIVE/DEVELOPER_HANDBOOK.md)
- [`docs/ACTIVE/AUTHENTICATION_SETUP.md`](../ACTIVE/AUTHENTICATION_SETUP.md)
- [`docs/ACTIVE/AUTHORIZATION_AUDIT.md`](../ACTIVE/AUTHORIZATION_AUDIT.md)
- [`docs/ACTIVE/SCHEMA_AUDIT.md`](../ACTIVE/SCHEMA_AUDIT.md)
- [`docs/ACTIVE/CODEBASE_MAP.md`](../ACTIVE/CODEBASE_MAP.md)
- [`docs/ACTIVE/ENVIRONMENT_SETUP_GUIDE.md`](../ACTIVE/ENVIRONMENT_SETUP_GUIDE.md)
- [`docs/ADRs/`](../ADRs/) — Architecture Decision Records
- [`docs/ios/`](../ios/) — iOS feature guides (companion docs to `chravel-mobile`)
