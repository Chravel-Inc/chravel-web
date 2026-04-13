# stream-setup-permissions

One-time (and safely repeatable) setup for Stream channel-type grants used by Chravel.

## Concierge principal requirement

This setup flow **must** upsert the deterministic Stream service principal:

- `id`: `ai-concierge-bot`
- `name`: `AI Concierge`
- `role`: `admin`

Concierge channel flows depend on this principal existing in Stream before concierge channel usage.
Because this function uses Stream `upsertUser`, repeated executions remain idempotent.
