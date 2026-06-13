# ChravelApp 30-Persona Synthetic User Testing Synthesis
## 1. Executive Summary
### 10 strongest signals
1. [SIMULATED RISK] One-home-for-trip coordination is clear to organizer personas.
2. [SIMULATED RISK] Onboarding covers the right core modules and has skip paths.
3. [SIMULATED RISK] Invite preview contains useful trip context and can be a strong viral surface.
4. [SIMULATED RISK] Smart Import is the most cross-segment value hypothesis.
5. [SIMULATED RISK] Calendar/itinerary is universally legible as core value.
6. [SIMULATED RISK] Places/Basecamp resonates when addresses and confirmations matter.
7. [SIMULATED RISK] Polls/tasks create clear organizer relief for medium/high complexity groups.
8. [SIMULATED RISK] Media is retention-positive for leisure/events but not universal.
9. [SIMULATED RISK] Pro/event personas reveal a real roles/broadcast/audit opportunity.
10. [SIMULATED RISK] Trip Pass/per-trip pricing maps better than monthly for many casual planners.
### 10 biggest risks
1. [SIMULATED RISK] Synthetic WTP is not real WTP.
2. [SIMULATED RISK] Invite/account friction can kill group adoption.
3. [SIMULATED RISK] Pricing limits and CTAs risk appearing before value.
4. [SIMULATED RISK] AI/Smart Import trust can break quickly if inaccurate.
5. [SIMULATED RISK] Payments errors would be severe trust-breakers.
6. [SIMULATED RISK] Professional personas need real ops depth, not marketing claims.
7. [SIMULATED RISK] Large events need segmentation/broadcast controls beyond generic trip chat.
8. [SIMULATED RISK] Mobile modals/forms may be too heavy under live-trip pressure.
9. [SIMULATED RISK] Notification defaults can drive OS-level muting.
10. [SIMULATED RISK] Media may be bloat for users already committed to shared albums/Dropbox.
### 10 fastest wins
1. [OBSERVED/SIMULATED RISK] Shorten first-run to live demo/import before signup.
2. [OBSERVED/SIMULATED RISK] Make invite preview show value before account creation.
3. [OBSERVED/SIMULATED RISK] Add role/permission plain-English explainer.
4. [OBSERVED/SIMULATED RISK] Expose Trip Pass at natural post-value limits.
5. [OBSERVED/SIMULATED RISK] Create Smart Import preview with confidence and undo.
6. [OBSERVED/SIMULATED RISK] Add per-trip mute/digest controls.
7. [OBSERVED/SIMULATED RISK] Improve pricing copy by segment/use case.
8. [OBSERVED/SIMULATED RISK] Add export/recap CTA for organizers.
9. [OBSERVED/SIMULATED RISK] Clarify Regular vs Pro vs Events mode selection.
10. [OBSERVED/SIMULATED RISK] Add real beta interview instrumentation and PostHog validation before claims.
### 5 strategic product bets
1. [HYPOTHESIS] Smart Import as activation wedge.
2. [HYPOTHESIS] Invitee preview as viral loop.
3. [HYPOTHESIS] Trip Pass for casual high-chaos groups.
4. [HYPOTHESIS] Pro/event roles + broadcast for paid ops.
5. [HYPOTHESIS] Recap/PDF/export for retention and client-facing value.
### 5 things not to build yet
1. [HYPOTHESIS] Full OTA booking aggregation.
2. [HYPOTHESIS] Deep white-label portal before client validation.
3. [HYPOTHESIS] Complex media editor.
4. [HYPOTHESIS] AI autonomous booking/payment execution.
5. [HYPOTHESIS] Large enterprise compliance suite before Pro workflows are real.
## 2. Persona Segment Matrix
| Persona | Segment | Mode tested | Platform | Group size | Primary pain | Loved most | Hated most | Likelihood to use | WTP | Best SKU | Top requested feature | Biggest churn risk |
|---|---|---|---|---|---|---|---|---:|---|---|---|---|
| Dana Miller | Consumer / Personal Trips | Regular Trips | iOS | 16+ | invite adoption and chasing replies | one trip home for calendar, links, chat, and decisions | account/permissions/pricing ambiguity before group value is obvious | 6 | $20-50 per trip | Team tournament pass | smart import + invite clarity | parallel-channel fallback |
| Marisol Vega | Consumer / Personal Trips | Pro Trips | mixed | 16+ | invite adoption and chasing replies | one trip home for calendar, links, chat, and decisions | account/permissions/pricing ambiguity before group value is obvious | 6 | $49-199/mo org-paid | Pro Starter / org plan | smart import + invite clarity | parallel-channel fallback |
| Tori Bennett | Consumer / Personal Trips | Regular Trips | iOS | 9-15 | invite adoption and chasing replies | one trip home for calendar, links, chat, and decisions | account/permissions/pricing ambiguity before group value is obvious | 7 | $20-50 per trip | Trip Pass | smart import + invite clarity | parallel-channel fallback |
| Marcus Reed | Consumer / Personal Trips | Regular Trips | iOS | 5-8 | invite adoption and chasing replies | one trip home for calendar, links, chat, and decisions | account/permissions/pricing ambiguity before group value is obvious | 7 | $20-50 per trip | Trip Pass | smart import + invite clarity | parallel-channel fallback |
| Priya Shah | Consumer / Personal Trips | Events | mixed | 16+ | invite adoption and chasing replies | one trip home for calendar, links, chat, and decisions | account/permissions/pricing ambiguity before group value is obvious | 6 | $20-50 per trip | Event pass | smart import + invite clarity | parallel-channel fallback |
| Linda Brooks | Consumer / Personal Trips | Regular Trips | Android | 16+ | invite adoption and chasing replies | one trip home for calendar, links, chat, and decisions | account/permissions/pricing ambiguity before group value is obvious | 5 | Nothing/free | Free tier | smart import + invite clarity | parallel-channel fallback |
| Jalen Carter | Consumer / Personal Trips | Regular Trips | iOS | 9-15 | invite adoption and chasing replies | one trip home for calendar, links, chat, and decisions | account/permissions/pricing ambiguity before group value is obvious | 5 | Nothing/free | Free tier | smart import + invite clarity | parallel-channel fallback |
| Camille Laurent | Consumer / Personal Trips | Regular Trips | iOS | 5-8 | invite adoption and chasing replies | one trip home for calendar, links, chat, and decisions | account/permissions/pricing ambiguity before group value is obvious | 7 | $49-199/mo org-paid | Frequent Chraveler | smart import + invite clarity | parallel-channel fallback |
| Evan Kim | Consumer / Personal Trips | Regular Trips | mixed | 5-8 | invite adoption and chasing replies | one trip home for calendar, links, chat, and decisions | account/permissions/pricing ambiguity before group value is obvious | 6 | $20-50 per trip | Trip Pass | smart import + invite clarity | parallel-channel fallback |
| Nina Torres | Consumer / Personal Trips | Regular Trips | iOS | 5-8 | invite adoption and chasing replies | one trip home for calendar, links, chat, and decisions | account/permissions/pricing ambiguity before group value is obvious | 7 | $49-199/mo org-paid | Frequent Chraveler | smart import + invite clarity | parallel-channel fallback |
| Greg Wallace | Pro / Sports / Touring / Work | Pro Trips | Desktop-first | 16+ | operational trust, roles, and auditability | one trip home for calendar, links, chat, and decisions | account/permissions/pricing ambiguity before group value is obvious | 6 | Enterprise/client-billable | Enterprise | roles/broadcast/audit controls | parallel-channel fallback |
| Alicia Grant | Pro / Sports / Touring / Work | Pro Trips | Desktop-first | 16+ | operational trust, roles, and auditability | one trip home for calendar, links, chat, and decisions | account/permissions/pricing ambiguity before group value is obvious | 6 | Enterprise/client-billable | Enterprise | roles/broadcast/audit controls | parallel-channel fallback |
| Monique Ellis | Pro / Sports / Touring / Work | Pro Trips | mixed | 16+ | operational trust, roles, and auditability | one trip home for calendar, links, chat, and decisions | account/permissions/pricing ambiguity before group value is obvious | 6 | $49-199/mo org-paid | Pro Starter / org plan | smart import + invite clarity | parallel-channel fallback |
| Tom Nguyen | Pro / Sports / Touring / Work | Pro Trips | Desktop-first | 16+ | operational trust, roles, and auditability | one trip home for calendar, links, chat, and decisions | account/permissions/pricing ambiguity before group value is obvious | 6 | $49-199/mo org-paid | Pro Starter / org plan | smart import + invite clarity | parallel-channel fallback |
| Rae Jenkins | Pro / Sports / Touring / Work | Pro Trips | iOS | 5-8 | operational trust, roles, and auditability | one trip home for calendar, links, chat, and decisions | account/permissions/pricing ambiguity before group value is obvious | 6 | $49-199/mo org-paid | Frequent Chraveler | smart import + invite clarity | parallel-channel fallback |
| Devon Hart | Pro / Sports / Touring / Work | Pro Trips | mixed | 16+ | operational trust, roles, and auditability | one trip home for calendar, links, chat, and decisions | account/permissions/pricing ambiguity before group value is obvious | 6 | Enterprise/client-billable | Enterprise | roles/broadcast/audit controls | parallel-channel fallback |
| Sofia Mendes | Pro / Sports / Touring / Work | Pro Trips | Desktop-first | 16+ | operational trust, roles, and auditability | one trip home for calendar, links, chat, and decisions | account/permissions/pricing ambiguity before group value is obvious | 6 | $49-199/mo org-paid | Pro Starter / org plan | smart import + invite clarity | parallel-channel fallback |
| Harper Lewis | Pro / Sports / Touring / Work | Events | Desktop-first | 16+ | operational trust, roles, and auditability | one trip home for calendar, links, chat, and decisions | account/permissions/pricing ambiguity before group value is obvious | 6 | Enterprise/client-billable | Enterprise | roles/broadcast/audit controls | parallel-channel fallback |
| Elaine Chen | Pro / Sports / Touring / Work | Pro Trips | iOS | 2-4 | operational trust, roles, and auditability | one trip home for calendar, links, chat, and decisions | account/permissions/pricing ambiguity before group value is obvious | 6 | Enterprise/client-billable | Enterprise | smart import + invite clarity | parallel-channel fallback |
| Omar Siddiq | Pro / Sports / Touring / Work | Pro Trips | Desktop-first | 9-15 | operational trust, roles, and auditability | one trip home for calendar, links, chat, and decisions | account/permissions/pricing ambiguity before group value is obvious | 7 | Enterprise/client-billable | White-label/client plan | smart import + invite clarity | parallel-channel fallback |
| Bethany Cole | Events / Large Groups / Communities | Events | mixed | 16+ | large-group broadcast, privacy, and schedule-change control | one trip home for calendar, links, chat, and decisions | account/permissions/pricing ambiguity before group value is obvious | 7 | Enterprise/client-billable | White-label/client plan | smart import + invite clarity | parallel-channel fallback |
| Victor Huang | Events / Large Groups / Communities | Events | Desktop-first | 16+ | large-group broadcast, privacy, and schedule-change control | one trip home for calendar, links, chat, and decisions | account/permissions/pricing ambiguity before group value is obvious | 5 | Enterprise/client-billable | Enterprise | roles/broadcast/audit controls | parallel-channel fallback |
| Maya Patel | Events / Large Groups / Communities | Events | iOS | 9-15 | large-group broadcast, privacy, and schedule-change control | one trip home for calendar, links, chat, and decisions | account/permissions/pricing ambiguity before group value is obvious | 6 | $20-50 per trip | Event pass | smart import + invite clarity | parallel-channel fallback |
| Andre Williams | Events / Large Groups / Communities | Events | Android | 16+ | large-group broadcast, privacy, and schedule-change control | one trip home for calendar, links, chat, and decisions | account/permissions/pricing ambiguity before group value is obvious | 5 | Nothing/free | Free tier | smart import + invite clarity | parallel-channel fallback |
| Cole Whitman | Events / Large Groups / Communities | Events | iOS | 16+ | large-group broadcast, privacy, and schedule-change control | one trip home for calendar, links, chat, and decisions | account/permissions/pricing ambiguity before group value is obvious | 5 | $49-199/mo org-paid | Frequent Chraveler | smart import + invite clarity | parallel-channel fallback |
| Pastor Grace Evans | Events / Large Groups / Communities | Events | Android | 16+ | large-group broadcast, privacy, and schedule-change control | one trip home for calendar, links, chat, and decisions | account/permissions/pricing ambiguity before group value is obvious | 6 | $49-199/mo org-paid | Pro Starter / org plan | smart import + invite clarity | parallel-channel fallback |
| Rachel Stein | Events / Large Groups / Communities | Events | Desktop-first | 16+ | large-group broadcast, privacy, and schedule-change control | one trip home for calendar, links, chat, and decisions | account/permissions/pricing ambiguity before group value is obvious | 5 | $49-199/mo org-paid | Pro Starter / org plan | smart import + invite clarity | parallel-channel fallback |
| Kyle Romano | Consumer / Personal Trips | Regular Trips | iOS | 9-15 | large-group broadcast, privacy, and schedule-change control | one trip home for calendar, links, chat, and decisions | account/permissions/pricing ambiguity before group value is obvious | 6 | $20-50 per trip | Trip Pass | smart import + invite clarity | parallel-channel fallback |
| Serena Dubois | Pro / Sports / Touring / Work | Pro Trips | Desktop-first | 2-8 | operational trust, roles, and auditability | one trip home for calendar, links, chat, and decisions | account/permissions/pricing ambiguity before group value is obvious | 7 | Enterprise/client-billable | White-label/client plan | smart import + invite clarity | parallel-channel fallback |
| Anika Müller | Consumer / Personal Trips | Regular Trips | mixed | 9-15 | large-group broadcast, privacy, and schedule-change control | one trip home for calendar, links, chat, and decisions | account/permissions/pricing ambiguity before group value is obvious | 7 | $20-50 per trip | Trip Pass | smart import + invite clarity | parallel-channel fallback |
## 3. Feature Heatmap
| Feature | Consumer | Pro/Sports/Touring/Work | Events/Communities |
|---|---|---|---|
| Chat | Moderate pull | Moderate pull | Moderate pull |
| Broadcast | Strong pull | Strong pull | Strong pull |
| Calendar | Strong pull | Strong pull | Strong pull |
| Places | Moderate pull | Moderate pull | Moderate pull |
| Polls | Moderate pull | Moderate pull | Moderate pull |
| Tasks | Moderate pull | Moderate pull | Moderate pull |
| Smart Import | Strong pull | Strong pull | Strong pull |
| AI Concierge | Moderate pull | Moderate pull | Moderate pull |
| Payments | Strong pull | Moderate pull | Moderate pull |
| Media | Moderate pull | Low pull | Moderate pull |
| PDF export / recap | Strong pull | Strong pull | Strong pull |
| Invite links | Strong pull | Strong pull | Strong pull |
| Roles/permissions | Negative / bloat | Strong pull | Strong pull |
| Notifications | Strong pull | Strong pull | Strong pull |
| Mobile navigation | Strong pull | Strong pull | Strong pull |
| Pricing / upgrade | Moderate pull | Moderate pull | Moderate pull |
## 4. Web vs Mobile Synthesis
* **Web strengths:** [OBSERVED] More room for setup, pricing comprehension, admin/pro planning, imports, and matrix views.
* **Web issues:** [SIMULATED RISK] Desktop-first pro users need denser run-sheet/admin workflows than consumer cards.
* **Mobile strengths:** [OBSERVED] PWA/iOS metadata, native tab-bar safe-area work, and mobile-specific trip tabs support mobile use.
* **Mobile issues:** [SIMULATED RISK] Long setup/import/payment forms risk modal fatigue under live-trip pressure.
* **PWA/native wrapper risks:** [HYPOTHESIS] Deep links, notification permissions, and offline/import recovery need real-device tests.
* **Mobile-first fixes:** invite preview, shorter onboarding, one-tap mute, import preview/undo, large tap targets.
* **Desktop/admin fixes:** roles matrix, broadcast/read receipts, PDF/run-sheet export, bulk import, audit trail.
## 5. Onboarding + Survey Synthesis
[OBSERVED] The carousel teaches core modules and can be skipped. [SIMULATED RISK] Casual and college users skip if it delays group setup; pro/event users tolerate segmentation if it improves mode/role defaults. Ask only 4-6 questions before demo: role, group size, trip/event type, timing urgency, current tools, and professional responsibility. Ask pricing/AI trust/media questions after users experience value. Recommended final onboarding survey length: 5 required questions plus optional follow-up.
## 6. Pricing + Monetization Synthesis
| Segment | Preferred model | Likely price range | Trigger moment | Objection | Fix |
|---|---|---|---|---|---|
| Consumer casual | Trip Pass/free | $0-$50/trip | After invite/import succeeds | Subscription fatigue | Sell one-trip value |
| Frequent organizer | Subscription | $5-$20/mo | Third active trip or recurring use | Monthly if group does not adopt | Annual/per-trip bridge |
| Youth/school/nonprofit | Team/event pass | $20-$99/event/team | Schedule/payment limits | Budget approval | Org invoice + low-cost pass |
| Pro sports/touring/work | Team/enterprise | $49-$199+/mo | Roles/broadcast/import/admin success | Trust and integrations | Pro proof checklist |
| Events/large groups | Event pass/enterprise | $99-$999+ event | Guest/broadcast/read receipt need | Existing event tools | Import + attendee segmentation |
| Luxury/advisors | Client-billable/white-label | $50-$500/client | Branded itinerary/export | Client polish | PDF/portal/branding |
## 7. Product Priority Matrix
| Priority | Feature | Problem | Segments affected | Evidence labels | Severity | Revenue impact | Effort | Owner | Recommended next action |
|---|---|---|---|---|---:|---|---|---|---|
| P0 | Payments | Money accuracy/trust must be bulletproof | Consumer, teams, events | [SIMULATED RISK]/[OBSERVED prior] | 5 | High | M | Backend/Frontend | Audit split creation, settlement, idempotency, limits. |
| P0 | Invite / join | Invitees may not see value before account/setup | All | [OBSERVED]/[SIMULATED RISK] | 5 | High | M | Growth/Frontend | Create guest preview and clearer join states. |
| P0 | Smart Import | Import errors/duplicates can poison trust | All | [HYPOTHESIS] | 5 | High | L | AI/Backend/Frontend | Add preview, source, confidence, undo. |
| P1 | Pricing / upgrade | Natural Trip Pass/Pro upgrade moments are unclear | All paid segments | [OBSERVED]/[SIMULATED RISK] | 4 | High | M | Product/Growth | Map limits to contextual CTAs. |
| P1 | Roles/permissions | Pro/events need confidence in who sees/edits what | Pro/events, youth, exec | [OBSERVED]/[SIMULATED RISK] | 4 | High | M | Product/Frontend | Plain-English role matrix and invite permissions. |
| P2 | Notifications | Critical updates compete with chatter | All | [SIMULATED RISK] | 4 | Medium | M | Frontend/Backend | Per-trip mute/digest/critical broadcast settings. |
| P2 | PDF export / recap | Organizers need shareable offline/client artifact | Teams, events, advisors | [HYPOTHESIS] | 3 | Medium | M | Frontend | Build export MVP around itinerary/places/tasks/payments. |
| P3 | Onboarding | 10 screens can feel long before value | Consumer/mobile | [OBSERVED]/[SIMULATED RISK] | 3 | Medium | S | Product/Design | Segmented 5-question pre-demo flow. |
| Later | Media | Polarized value; not universal paid wedge | Consumer/events | [SIMULATED RISK] | 2 | Low | M | Product | Keep solid, avoid heavy editor until validated. |
## 8. Top 20 User Quotes
1. **[SYNTHETIC QUOTE]** “I do not need another place to check; I need one link my group understands and trusts.” — Dana Miller, Consumer / Personal Trips, Invite/activation, insight: first-value clarity.
2. **[SYNTHETIC QUOTE]** “I do not need another place to check; I need one link my group understands and trusts.” — Marisol Vega, Consumer / Personal Trips, Invite/activation, insight: first-value clarity.
3. **[SYNTHETIC QUOTE]** “I do not need another place to check; I need one link my group understands and trusts.” — Tori Bennett, Consumer / Personal Trips, Invite/activation, insight: first-value clarity.
4. **[SYNTHETIC QUOTE]** “I do not need another place to check; I need one link my group understands and trusts.” — Marcus Reed, Consumer / Personal Trips, Invite/activation, insight: first-value clarity.
5. **[SYNTHETIC QUOTE]** “I do not need another place to check; I need one link my group understands and trusts.” — Priya Shah, Consumer / Personal Trips, Invite/activation, insight: first-value clarity.
6. **[SYNTHETIC QUOTE]** “I do not need another place to check; I need one link my group understands and trusts.” — Linda Brooks, Consumer / Personal Trips, Invite/activation, insight: first-value clarity.
7. **[SYNTHETIC QUOTE]** “I do not need another place to check; I need one link my group understands and trusts.” — Jalen Carter, Consumer / Personal Trips, Invite/activation, insight: first-value clarity.
8. **[SYNTHETIC QUOTE]** “I do not need another place to check; I need one link my group understands and trusts.” — Camille Laurent, Consumer / Personal Trips, Invite/activation, insight: first-value clarity.
9. **[SYNTHETIC QUOTE]** “I do not need another place to check; I need one link my group understands and trusts.” — Evan Kim, Consumer / Personal Trips, Invite/activation, insight: first-value clarity.
10. **[SYNTHETIC QUOTE]** “I do not need another place to check; I need one link my group understands and trusts.” — Nina Torres, Consumer / Personal Trips, Invite/activation, insight: first-value clarity.
11. **[SYNTHETIC QUOTE]** “I do not need another place to check; I need one link my group understands and trusts.” — Greg Wallace, Pro / Sports / Touring / Work, Invite/activation, insight: first-value clarity.
12. **[SYNTHETIC QUOTE]** “I do not need another place to check; I need one link my group understands and trusts.” — Alicia Grant, Pro / Sports / Touring / Work, Invite/activation, insight: first-value clarity.
13. **[SYNTHETIC QUOTE]** “I do not need another place to check; I need one link my group understands and trusts.” — Monique Ellis, Pro / Sports / Touring / Work, Invite/activation, insight: first-value clarity.
14. **[SYNTHETIC QUOTE]** “I do not need another place to check; I need one link my group understands and trusts.” — Tom Nguyen, Pro / Sports / Touring / Work, Invite/activation, insight: first-value clarity.
15. **[SYNTHETIC QUOTE]** “I do not need another place to check; I need one link my group understands and trusts.” — Rae Jenkins, Pro / Sports / Touring / Work, Invite/activation, insight: first-value clarity.
16. **[SYNTHETIC QUOTE]** “I do not need another place to check; I need one link my group understands and trusts.” — Devon Hart, Pro / Sports / Touring / Work, Invite/activation, insight: first-value clarity.
17. **[SYNTHETIC QUOTE]** “I do not need another place to check; I need one link my group understands and trusts.” — Sofia Mendes, Pro / Sports / Touring / Work, Invite/activation, insight: first-value clarity.
18. **[SYNTHETIC QUOTE]** “I do not need another place to check; I need one link my group understands and trusts.” — Harper Lewis, Pro / Sports / Touring / Work, Invite/activation, insight: first-value clarity.
19. **[SYNTHETIC QUOTE]** “I do not need another place to check; I need one link my group understands and trusts.” — Elaine Chen, Pro / Sports / Touring / Work, Invite/activation, insight: first-value clarity.
20. **[SYNTHETIC QUOTE]** “I do not need another place to check; I need one link my group understands and trusts.” — Omar Siddiq, Pro / Sports / Touring / Work, Invite/activation, insight: first-value clarity.
## 9. Top 20 Real Beta Interview Questions
1. What exact moment would make you invite the rest of your group?
2. What would make you pay per trip instead of monthly?
3. Which imported artifact would save the most time?
4. What AI answer would immediately lose your trust?
5. Would you let Chravel calculate who owes what? Why/why not?
6. What information must invitees see before account creation?
7. When do notifications become too much?
8. Do photos/files belong in the travel app or existing albums?
9. For pro/event workflows, which roles/channels are mandatory?
10. What export/recap would you send to stakeholders?
11. Which current app would Chravel replace first?
12. What would make you abandon during onboarding?
13. What price feels obvious after one successful trip?
14. What privacy controls are non-negotiable?
15. How often do plans change during the trip?
16. Would a guest-only read-only view increase adoption?
17. Do you need read receipts for broadcasts?
18. What does “professional-grade” mean in your workflow?
19. Which CTA would feel helpful vs annoying?
20. What must be true before fundraising claims about WTP are credible?
## 10. Founder / Investor Readout
Synthetic testing suggests organizer-first consolidation, calendar, invite links, Smart Import, and pro/event role-control opportunities are promising. Activation is likely blocked by invitee first-value/account friction and too much setup before proof. Monetization is likely blocked by unclear contextual CTAs, per-trip vs subscription mismatch, and trust gaps around AI/import/payments. Viral loops are likely blocked when the invited participant sees account creation before usefulness. Before fundraising claims, validate real invite conversion, real WTP, AI trust, Smart Import accuracy tolerance, and paid checkout completion with actual users. In two weeks, investor-impressive progress would be: guest preview, import preview/undo, contextual Trip Pass CTA, role explainer, and measured beta funnel events.
