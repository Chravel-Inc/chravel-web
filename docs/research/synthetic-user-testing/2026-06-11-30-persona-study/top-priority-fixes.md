# Top Priority Fixes

## Evidence grounding note

[OBSERVED] priority claims cite the browser/source/doc evidence summarized in `README.md` and `synthesis.md`: landing/auth demo walkthrough, `JoinTrip.tsx`, `permissionMatrix.generated.ts`, billing config/entitlements, Smart Import source, payments source plus prior product-ground-truth risk register, and mobile route/navigation source. Synthetic persona impact remains [SIMULATED RISK] until real beta testing.

| Priority | Feature | Problem | Segments affected | Evidence labels | Severity | Revenue impact | Effort | Suggested owner | Recommended next action |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| P0 | Invite / join | Invitees do not get enough value before account/signup friction; guest has limited/zero access | All 30; strongest for family, weddings, events, youth sports | [OBSERVED] + [SIMULATED RISK] | 5 | High | M | Product + Frontend + Backend | Ship account-light read-only itinerary preview and conditional approval copy. |
| P0 | Payments | Money trust is fragile; consumer split model fails corporate/reimbursement use cases; prior docs flag settlement risk | Consumers with deposits, corporate, sports, events | [OBSERVED] + [SIMULATED RISK] | 5 | High | M | Backend + Product | Add idempotent settlement and clarify no-money-movement handoff; design reimbursement/company-payer model. |
| P0 | Pro/Event trust | Pro ops/value promises must not exceed real trip functionality | Sports, touring, corporate, production, executive | [OBSERVED] | 5 | High | M | Product + Frontend | Hide/label stubbed real-trip surfaces and align marketing claims with shipped capability. |
| P1 | Pricing / Trip Pass | Best-fit Trip Pass/Event Pass moments are not consistently placed at in-product value limits | Consumer/event personas | [OBSERVED] + [SIMULATED RISK] | 4 | High | S | Growth + Frontend | Mount Trip Pass/Event Pass CTAs at Smart Import, media, PDF/export, AI, and payment moments. |
| P1 | Smart Import | Import is a magic moment but needs trust, preview, and duplicate confidence | All high-complexity trips | [OBSERVED] + [SIMULATED RISK] | 4 | High | M | AI + Frontend + Backend | Use one free taste, source preview, duplicate warnings, and clear confirm/commit flow. |
| P1 | Notifications | No per-trip mute/batching risks opt-out before urgent messages | Groups >10, events, sports | [OBSERVED] + [SIMULATED RISK] | 4 | Medium | M | Backend + Mobile | Add per-trip mute, digest batching, urgent priority lane. |
| P1 | Broadcasts / roles | Professional buyers need server-enforced targeting and per-recipient acknowledgments | Pro/events | [OBSERVED] + [SIMULATED RISK] | 5 | High | L | Backend + Frontend | Recipient tables, ack roster, role-filtered fanout, integration tests. |
| P2 | Mobile in-trip discoverability | Browser pass showed mobile landing works but demo did not expose full in-trip bottom-tab flow | Mobile-heavy personas | [OBSERVED] + [HYPOTHESIS] | 3 | Medium | M | Design + Mobile | Run authenticated mobile E2E; make invite/calendar/AI/payments one-thumb reachable. |
| P2 | Places / Basecamp | Single-basecamp model strains multi-city trips and tours | Luxury, touring, international | [OBSERVED] + [SIMULATED RISK] | 3 | Medium | M | Product + Frontend | Add per-leg/date-range basecamps and map context. |
| P2 | AI trust | Text AI is core value; voice/dictation framing and hallucination controls need clarity | AI-positive and AI-skeptical segments | [OBSERVED] + [SIMULATED RISK] | 4 | High | M | AI + Product | Source links, confidence, confirm-before-write, honest voice label. |
| P3 | Media positioning | Some users love centralized media; others already have shared albums | Consumers/events | [SIMULATED RISK] | 2 | Medium | S | Product + Growth | Position media as trip-context memory layer, not generic album replacement. |
| P3 | Onboarding survey | Survey can segment well but risks feeling too long before value | All new users | [OBSERVED] + [HYPOTHESIS] | 3 | Medium | S | Product + Design | Ask 3-5 pre-demo questions; ask detailed monetization questions after first value. |
| Later | Conference-scale event app | 1,000-person conference needs scale/segmentation beyond current wedge | Large conferences | [SIMULATED RISK] | 3 | Medium | L | Product | Do not chase full conference-app replacement until smaller event loop proves retention. |
| Later | Full OTA/booking workflows | Travel booking aggregation adds licensing/compliance complexity | All | [HYPOTHESIS] | 2 | Low | L | Product | Keep coordination thesis; avoid booking engine expansion. |

## Paste-ready implementation-ticket pass

1. Turn each P0/P1 row into a GitHub issue with acceptance criteria, owner, and test plan.
2. Start with invite/account-light preview and Trip Pass limit-wall placement because they serve the largest number of personas.
3. Treat payments, Pro/Event roles, and notifications as trust-critical work requiring source-level tests and manual mobile validation.
