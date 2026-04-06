# Email Notifications TestFlight Audit & Rollout Plan (2026-04-06)

## Scope
Answer three product questions with evidence from code:
1. **Who does email come from?**
2. **What is the actual email format/content for key notification types (broadcasts, trip invites, basecamp updates)?**
3. **Is this real or mock? If incomplete, should we harden it or remove it?**

## Current State (Evidence-Based)

### 1) Sender identity (From address)
- Email delivery is wired through SendGrid in `dispatch-notification-deliveries`.
- `from.email` is configured as `SENDGRID_FROM_EMAIL` with fallback `support@chravelapp.com`.
- `from.name` is `ChravelApp`.

**Implication:** In production, the exact sender is whichever value is set in the `SENDGRID_FROM_EMAIL` environment variable; fallback is `support@chravelapp.com`.

### 2) Is the toggle real or mock?
- The UI toggle writes `email_enabled` to `notification_preferences`.
- Notifications are inserted into `notifications` and auto-queued to `notification_deliveries` (push/email/sms rows) via DB trigger.
- Dispatcher enforces:
  - `email_enabled = true`
  - category eligibility (`isEmailEligible(...)`)
  - recipient has an email
  - SendGrid key exists and provider call succeeds.

**Conclusion:** The toggle is **not** a pure mock. It controls a live pipeline.

### 3) Which notification categories can email today?
Eligible categories are currently:
- broadcasts
- payments
- basecamp_updates
- calendar_events
- calendar_bulk_import
- join_requests
- tasks
- polls
- trip_invites

### 4) Email content format
The dispatcher maps categories to canonical content types and uses `_shared/notificationContentBuilder.ts`.

For the user-requested examples:
- **Broadcasts** -> `broadcast_posted`
  - Subject: `New Broadcast in <trip>`
  - Body copy: `<actor> posted an announcement ... Open ChravelApp to review.`
- **New Trip Invites** -> `trip_invite`
  - Subject: `Trip Invitation`
  - Body copy: `<actor> invited you to <trip> ... Open ChravelApp to respond.`
- **Basecamp Updates** -> `basecamp_updated`
  - Subject: `Basecamp Updated in <trip>`
  - Body copy: `The basecamp location has been updated ... Open ChravelApp for details.`

Template structure:
- HTML email (dark theme card)
- plain-text fallback
- CTA button: `Open in ChravelApp`
- footer with settings link

## Gaps / Risks Found
1. **No in-app “send test email” UX** (SMS has one) -> operational blind spot.
2. **No exposed last-email-delivery status in settings** -> hard to support/debug in TestFlight.
3. **Legacy/unknown notification `type` values fall back to raw title/message** (works, but can produce inconsistent tone/format).
4. **Deliverability dependency** on SendGrid config + verified sender domain; if env/config is wrong, toggle appears “on” but no user-visible diagnostics.

## Recommendation
**Do not remove the toggle. Keep it and harden it.**

Rationale:
- The backend architecture is already real and mostly production-grade (queued deliveries + retries + logging).
- Removing the toggle would reduce trust and disable a channel that’s useful for touring/pro users.
- Hardening cost is modest and high leverage.

## Hardened Rollout Plan (Minimal, Safe)

### Phase 1 — Visibility (1 PR)
- Add **“Send test email”** action in notification settings (parallel to test SMS).
- Show **last email status** using `notification_logs` (sent/failed + error excerpt).
- Add a short helper copy: “Email may take up to X minutes; check spam/promotions.”

### Phase 2 — Consistency (1 PR)
- Audit notification `type` strings emitted across server functions; map all active types to canonical categories/content types.
- Add tests for canonical mapping and fallback behavior.

### Phase 3 — Deliverability & Ops (1 PR + env/config)
- Verify SendGrid sender domain authentication (SPF/DKIM/DMARC) and final `SENDGRID_FROM_EMAIL` branding decision.
- Add dashboard alerting when email failure rate crosses threshold.

## Decision Framework: keep vs remove
Remove only if any of these are true:
1. You cannot maintain sender-domain deliverability (SPF/DKIM/DMARC).
2. You won’t invest in basic support tooling (test + status visibility).
3. Email channel is strategically out-of-scope.

Otherwise, keep and harden.

## Immediate verification checklist for TestFlight
1. Toggle Email ON in Settings.
2. Trigger one event from each target type (broadcast, trip invite, basecamp update).
3. Confirm rows in `notification_deliveries` with channel=`email` move from `queued` -> `sent` or `failed`.
4. Confirm matching `notification_logs` entry.
5. Confirm actual inbox delivery and sender identity.
