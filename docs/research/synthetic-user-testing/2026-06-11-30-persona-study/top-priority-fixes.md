# Top Priority Fixes — 30-Persona Synthetic Study

**Reminder:** These priorities are synthetic, code-grounded research outputs. They are not customer evidence. Use them to create implementation tickets, then validate with real users and product analytics.

## P0 — Trust-breaking bugs / activation blockers

| Feature | Problem | Persona segments affected | Evidence labels | Severity | Revenue impact | Effort | Suggested owner | Recommended next action |
|---|---|---|---|---:|---|---|---|---|
| Invite / join | Invitees may not see value before account creation; join/approval framing must be unmistakable. | All 30, especially youth sports, family, college, event groups | [OBSERVED], [SIMULATED RISK] | 5 | High | M | Growth / Frontend | Build guest/invite preview with “what you’ll get” before signup; keep require-approval copy branched and test direct-join vs request-join states. |
| Payments | Any split/settlement ambiguity or money error is an instant trust-breaker. | Consumer celebration trips, youth sports, bachelor/bachelorette, pro/event reimbursements | [SIMULATED RISK], [OBSERVED prior] | 5 | High | M | Backend / Frontend | Audit expense creation, split calculation, settlement idempotency, and free-limit handling before using payments as a paid trigger. |
| Smart Import | Import errors, duplicate extraction, or hallucinated structure can poison the “saves time” promise. | All segments, strongest in pro/events/advisors/international trips | [HYPOTHESIS], [SIMULATED RISK] | 5 | High | L | AI / Backend / Frontend | Add preview, confidence labels, source snippets, duplicate detection, undo, and “needs review” states before automated writes. |
| Privacy / permissions | Youth, school, executive, pro, and event workflows need clear visibility/edit controls. | Youth sports, school, exec assistants, pro teams, large events | [OBSERVED], [SIMULATED RISK] | 5 | High | M | Product / Frontend | Add a plain-English role matrix in invite/settings and validate guest/member/admin capabilities against actual permission rules. |

## P1 — Revenue unlocks

| Feature | Problem | Persona segments affected | Evidence labels | Severity | Revenue impact | Effort | Suggested owner | Recommended next action |
|---|---|---|---|---:|---|---|---|---|
| Pricing / upgrade | Trip Pass vs subscription vs Pro/Event plan is not naturally tied to value moments. | All paid-capable personas | [OBSERVED], [SIMULATED RISK], [HYPOTHESIS] | 4 | High | M | Product / Growth | Map limits to contextual CTAs after success: import completed, invite group joined, payment split cap, active trip cap, export request. |
| Pro operations | Pro personas require real broadcast, roles, roster/logistics, audit, and export depth before paid trust. | Sports ops, touring, corporate, film, concierge, luxury advisors | [OBSERVED prior], [SIMULATED RISK] | 4 | High | L | Product / Backend / Frontend | Scope Pro MVP around run-sheet import, role channels, broadcast/read receipt, and PDF recap before selling deeper enterprise. |
| Event organizer tools | Large groups need attendee segmentation, broadcast, moderation, and schedule-change control. | Wedding planners, conferences, festivals, church/school, rush | [SIMULATED RISK] | 4 | High | L | Product / Frontend / Backend | Turn Events into a focused organizer console instead of generic “big trip” UI. |
| PDF / recap / export | Organizers need shareable, offline, stakeholder-safe artifacts. | Youth sports, schools, weddings, pro teams, advisors, corporate | [HYPOTHESIS], [SIMULATED RISK] | 4 | Medium | M | Frontend | Build an MVP export for itinerary + places + tasks + expenses + emergency notes. |

## P2 — Retention improvements

| Feature | Problem | Persona segments affected | Evidence labels | Severity | Revenue impact | Effort | Suggested owner | Recommended next action |
|---|---|---|---|---:|---|---|---|---|
| Notifications | Critical updates compete with chatter; users may mute the app at OS level. | All, especially parents/events/pro ops | [SIMULATED RISK] | 4 | Medium | M | Frontend / Backend | Add per-trip mute, critical broadcast, daily digest, and role-based notification defaults. |
| Calendar / itinerary | Schedule-change pressure is the highest-frequency live-trip workflow. | All 30 | [OBSERVED], [SIMULATED RISK] | 4 | Medium | M | Frontend | Improve edit history, changed-item highlights, and “notify affected people” CTA. |
| Invitee empty state | New members need a clear first action after joining. | Consumer and events | [SIMULATED RISK] | 4 | Medium | S | Growth / Frontend | After join, route to itinerary/overview with “3 things to check” instead of a blank or chat-only landing. |
| Media | Media is retention-positive for some leisure/event personas but bloat for others. | Consumer/events/luxury vs pro ops | [SIMULATED RISK] | 3 | Low | M | Product | Keep upload/viewing solid; avoid heavy media editor until real usage supports it. |

## P3 — UX polish

| Feature | Problem | Persona segments affected | Evidence labels | Severity | Revenue impact | Effort | Suggested owner | Recommended next action |
|---|---|---|---|---:|---|---|---|---|
| Onboarding | Ten screens teach the modules but risk delaying first value. | Mobile-first consumers, college, price-sensitive planners | [OBSERVED], [SIMULATED RISK] | 3 | Medium | S | Product / Design | Replace one-size onboarding with 4–6 segmentation questions and a skippable live demo/import path. |
| Mode selection | Regular Trips vs Pro Trips vs Events is meaningful internally but may be unclear to first-time users. | All, especially hybrid use cases | [SIMULATED RISK] | 3 | Medium | S | Product / Growth | Use examples and defaults based on role/group size instead of exposing abstract mode choice first. |
| Mobile forms/modals | Live-trip use needs thumb-friendly, short, resumable input. | iOS/Android personas | [OBSERVED], [SIMULATED RISK] | 3 | Medium | M | Design / Frontend | Audit create/invite/import/payment modals in 390px and 430px viewports; reduce fields and add save-draft behavior. |
| Copy precision | Marketing breadth is strong, but credibility depends on not over-claiming AI/pro ops. | Investors, pro buyers, trust-sensitive users | [OBSERVED], [SIMULATED RISK] | 3 | Medium | S | Product Marketing | Label beta/coming-soon capabilities and avoid claiming synthetic findings as customer proof. |

## Later — Nice-to-have / not MVP

| Feature | Reason to defer | Evidence labels | Suggested revisit trigger |
|---|---|---|---|
| Full booking aggregation | Pulls Chravel toward OTA/licensing/compliance instead of coordination. | [HYPOTHESIS] | Only revisit after coordination workflows have retention and a clear legal/commercial strategy. |
| AI autonomous booking/payment actions | High trust, money, and liability risk. | [HYPOTHESIS] | Revisit only after AI suggestions/import accuracy are validated and approval UX is mature. |
| Complex media editor | Media value is polarized and existing shared albums are entrenched. | [SIMULATED RISK] | Revisit when real usage shows media is a top retention driver. |
| Deep white-label client portal | Luxury/advisor demand is plausible but unvalidated. | [HYPOTHESIS] | Revisit after 5–10 real advisor/client interviews and willingness-to-pay tests. |
