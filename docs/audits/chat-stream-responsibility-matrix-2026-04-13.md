# Chat Responsibility Matrix (Stream vs Supabase)

## Goal
Minimize drift by assigning one clear owner per capability.

## Ownership Matrix

| Capability | Canonical Owner | Why |
|---|---|---|
| Message transport (send/deliver/realtime updates) | **Stream** | Stream websocket model is purpose-built for chat fanout and delivery semantics. |
| Channel message history pagination | **Stream** | Native channel query and event ordering, lower client complexity. |
| Typing indicators (chat channels) | **Stream** | Avoid duplicate presence systems and split state. |
| Reactions / thread replies | **Stream** | First-class feature support with stable SDK contract. |
| Unread counters / read markers | **Stream** | Single read state source via channel read status. |
| Trip/channel membership source of truth | **Supabase** | Business rules + RLS + trip role model live in DB. |
| Role/channel access policy | **Supabase** | Permission model tied to trip roles and channel_role_access tables. |
| User identity/authentication | **Supabase Auth** | Existing auth/session standard across app. |
| Notification ledger / preference checks | **Supabase** | Existing notification tables + per-user preference architecture. |
| Push/email/SMS dispatch | **Supabase Edge functions** | Existing secure secret boundary + delivery orchestration. |
| Webhook ingest idempotency | **Supabase Edge + DB** | Durable event dedupe (`webhook_events`) and internal integration point. |

## Required Hybrid Seams (kept intentionally)
1. **Membership sync seam**: Supabase decides who is allowed in a channel; Stream enforces channel membership for runtime chat delivery.
2. **Notification seam**: Stream emits message events; Supabase webhook transforms them into product-level notifications based on user prefs and trip context.
3. **Auth/token seam**: Supabase JWT is identity proof; Stream user token is chat transport credential minted server-side.

## Hybrid Rules to Prevent Drift
1. Never write trip/channel message rows directly to Supabase when Stream is configured.
2. Never derive authorization from Stream membership alone; Supabase role/permission tables remain authoritative.
3. Any edge function that depends on chat events must key off Stream webhook payload + Supabase authoritative membership lookup.
4. If a feature needs both systems, define explicit ownership per field/event and avoid duplicate "best effort" state stores.

## Current Delta Closed in this PR
- Frontend env contract is now strict (no baked Supabase fallback credentials).
- Direct metadata edge calls now use centralized public key export instead of local anon-key env assumptions.

## Remaining High-Impact Delta
- Move membership synchronization from client fire-and-forget into a server-side authoritative reconciliation path.
