# Real Beta Interview Questions — 30-Persona Study Validation

**Date:** 2026-06-11  
**Purpose:** Convert synthetic findings into real-user validation. Prioritized for WTP, invite, AI trust, Smart Import, media, payments, mobile, Pro permissions, and Trip Pass vs subscription.  
**Recruitment target:** 8–12 participants covering Regular (5), Events (2), Pro (3)  
**Session length:** 45 minutes (matches screener `would_do_45min_call`)

---

## Evidence labels for responses

| Label | Use when |
|-------|----------|
| `[VALIDATED]` | Real user confirms synthetic finding |
| `[REFUTED]` | Real user contradicts synthetic finding |
| `[NEW]` | Insight not in synthetic study |
| `[INCONCLUSIVE]` | Needs more sessions |

---

## Priority 1 — Monetization (WTP, Trip Pass vs sub)

*Synthetic basis: 22/30 WTP > $0; paid conversion avg 2.7/10; Trip Pass unreachable `[OBSERVED]`*

### Q1. Trip framing
> "Think about the last group trip you organized. If a tool saved you 2+ hours of coordination, what would you realistically pay — per trip or per month?"

- **Probe:** $39 once for 45 days vs $10/month vs free only
- **Listen for:** Per-trip preference (14 synthetic personas), subscription aversion (8, 28)
- **Validates:** `[HYPOTHESIS]` Trip Pass is dominant SKU

### Q2. Limit moment
> "Imagine you've used the free AI assistant 10 times on one trip and it stops. What would you do next?"

- **Show mock:** Trip Pass $39.99 vs Explorer $9.99/mo vs abandon
- **Listen for:** Checkout completion intent, settings-page friction
- **Validates:** P0-1 Trip Pass at walls

### Q3. iOS payment
> "You're on your phone in the app. You tap Upgrade and it says 'Subscribe on web.' What do you do?"

- **Probe:** Open Safari? Email support? Delete app?
- **Listen for:** Drop-off vs web completion
- **Validates:** P1-1 iOS dead-end `[OBSERVED]`

### Q4. Worst upgrade CTA
> "Which upsell would make you leave: monthly subscription, email sales, attendee cap warning, or onboarding slideshow?"

- **Listen for:** Rank order; cap label scare (persona 6)
- **Validates:** `pricing-insights.csv` worst_cta column

### Q5. Events pricing mental model
> "You're planning a 150-person reunion or wedding. How should pricing work — per event, per attendee, or included in subscription?"

- **Probe:** Show current tier table vs Event pass concept
- **Listen for:** $75–$200 one-off WTP (personas 6, 18, 21)
- **Validates:** P1-2 Events pricing visibility

---

## Priority 2 — Invite funnel

*Synthetic basis: invite avg 5.1/10; guest wall `[OBSERVED]` consumer_guest*

### Q6. Invitee first value
> "You get a link from a friend about a Vegas trip. Before creating an account, what do you need to see to decide whether to join?"

- **Probe:** Dates, itinerary, who's going, cost split, nothing — just join
- **Listen for:** Read-only calendar demand
- **Validates:** P0-2 guest itinerary

### Q7. Account wall
> "Would you create an account to see the trip schedule? What if you could see the schedule first and account only to chat?"

- **Listen for:** Account-required tolerance by segment (parents vs college)
- **Validates:** `[SIMULATED RISK]` sports mom / reunion elder churn

### Q8. Approval confusion
> "You open an invite and see 'Member Approval Required.' The organizer didn't mention approval. What do you assume?"

- **Show:** Join page states (fixed vs broken framing)
- **Validates:** P0-5 join default `[OBSERVED]`

### Q9. Invite channel
> "How would you actually send invites — text, email, Instagram, QR at event?"

- **Listen for:** Mobile share sheet vs desktop copy link
- **Validates:** Mobile invite UX

### Q10. Two-chat problem
> "Would your group keep using iMessage/WhatsApp alongside Chravel, or replace it?"

- **Listen for:** Chat replacement vs supplement (persona 2)
- **Validates:** `[HYPOTHESIS]` coordination layer positioning

---

## Priority 3 — AI trust & concierge

*Synthetic basis: AI trust avg 3.4/5; 38 tools with confirm card `[OBSERVED]`*

### Q11. AI write permission
> "The AI suggests adding a restaurant to your itinerary. What has to happen before you're comfortable saving it?"

- **Probe:** Confirm button, see on map, friend vote, never auto-save
- **Validates:** Confirm-card pattern

### Q12. AI failure mode
> "If the AI gave wrong flight times once, would you use it again for that trip?"

- **Listen for:** Trust recovery, quota visibility
- **Validates:** Usage chip value (fixed since 10-persona)

### Q13. Voice vs text
> "Would you use voice to plan a trip in a car? What would you expect — live conversation or voice-to-text?"

- **Disclose:** Current product is dictation-only if asked directly
- **Validates:** P2-4 honest labeling `[OBSERVED] voiceProductPath`

### Q14. AI vs Google
> "Why use Chravel's AI instead of ChatGPT for restaurant picks?"

- **Listen for:** Trip context, save-to-calendar, group visibility
- **Validates:** Differentiation (persona 10)

---

## Priority 4 — Smart Import

*Synthetic basis: paywall at import; corporate/events personas love concept `[OBSERVED]`*

### Q15. Import job-to-be-done
> "Paste a real confirmation email or PDF from your last trip. What fields must be correct for you to trust the import?"

- **Live task:** Use Smart Import in session
- **Listen for:** Date/time/location accuracy threshold
- **Validates:** Import quality bar

### Q16. Import paywall timing
> "You get one free import per trip, then paywall. Fair or too early?"

- **Probe:** Trip Pass vs Explorer at import wall
- **Validates:** P0-1 + Smart Import taste allowance

### Q17. Festival/agenda import
> "Have you ever manually typed a festival schedule into a group chat? What would auto-import be worth?"

- **Listen for:** $39 Trip Pass trigger (persona 23)
- **Validates:** `[SIMULATED RISK]`

---

## Priority 5 — Media & payments

### Q18. Photo hub
> "Where do trip photos live today? What would make your group move them to Chravel?"

- **Probe:** iCloud, Google Photos, Instagram
- **Listen for:** Storage cap reaction (persona 4 media wall)
- **Validates:** Media as upgrade trigger

### Q19. Money movement
> "Do you need Chravel to move money, or is 'who owes whom' + Venmo enough?"

- **Listen for:** In-app payment demand (low in synthetic study)
- **Validates:** `[HYPOTHESIS]` no payment processor needed

### Q20. Split cap
> "On a free plan with 3 expense splits, when should you be asked to pay — at split 4 or never during the trip?"

- **Validates:** P1-3 enforce vs remove cap

---

## Priority 6 — Mobile & PWA

*Synthetic basis: mobile usability 4.2/5; 17/30 iOS-primary*

### Q21. Mobile-first planning
> "Do you plan trips on phone or laptop? Show me how you'd add a calendar event on your phone."

- **Live task:** Mobile session
- **Validates:** `web-mobile-comparison.md`

### Q22. Onboarding tolerance
> "How many intro screens before your first trip is too many — 0, 3, 10?"

- **Show:** Onboarding carousel or describe 10 screens
- **Validates:** P2-2 `[OBSERVED]` 10 screens

### Q23. PWA install
> "Would you add Chravel to your home screen? What would convince you?"

- **Listen for:** Push notifications, offline itinerary
- **Validates:** `[HYPOTHESIS]`

---

## Priority 7 — Pro permissions & ops

*Synthetic basis: Pro NPS −24.3; tripConverter stubs `[OBSERVED]`*

### Q24. Team travel stack
> "What do you use today for team travel — spreadsheets, Teamworks, custom? What's missing?"

- **Recruit:** Pro sports/touring (personas 11–17 analogs)
- **Validates:** Pro positioning

### Q25. Roster/day sheet
> "Show me your ideal day-of-travel view for 25 people. What fields are mandatory?"

- **Listen for:** Room assignments, call times, per-diem
- **Validates:** P0-4 ops tab requirements

### Q26. Role permissions
> "Who should edit the itinerary vs view-only — coach, player, parent, bus driver?"

- **Listen for:** Permission matrix gaps
- **Validates:** `permissionMatrix.generated.ts` roles

### Q27. Broadcast reliability
> "How many people need the same message at once? What happens if 20% don't get it?"

- **Recruit:** Events/conference organizers
- **Validates:** P1-5 broadcast scale

### Q28. Pro purchase process
> "Could your organization buy software via self-serve checkout, or does it require a quote and PO?"

- **Listen for:** mailto vs Stripe tolerance
- **Validates:** P1-4 self-serve Pro

---

## Priority 8 — Closing & segmentation

### Q29. NPS with evidence
> "Would you recommend Chravel to a friend organizing a trip? Why or why not?"

- **Score:** 0–10 + verbatim reason
- **Compare to:** Synthetic NPS in `persona-matrix.csv`

### Q30. Beta commitment
> "Would you use Chravel for your next real trip if we fix [top issue they named] in 30 days?"

- **Listen for:** Conditional commitment vs polite yes
- **Validates:** `[HYPOTHESIS]` beta follow-up rate

### Q31. Segment check (screener)
> "In the last 12 months, how many group trips did you organize? Group size? Primary device?"

- **Maps to:** `persona-matrix.csv` screener fields for segment coverage

---

## Interview guide structure (45 min)

| Block | Time | Questions |
|-------|------|-----------|
| Warm-up + screener | 5 min | Q31 |
| Last trip narrative | 10 min | Open-ended (not numbered) |
| Live product tasks | 15 min | Q15, Q21, invite flow Q6–Q8 |
| Monetization cards | 10 min | Q1–Q5 |
| AI + trust | 5 min | Q11–Q12 |
| Close | 5 min | Q29–Q30 |

**Rotate deep-dives by segment:**
- Regular: Q6–Q10, Q18–Q20
- Events: Q5, Q27
- Pro: Q24–Q28

---

## Analysis template (per session)

```markdown
## Participant [ID]
- Segment: 
- Synthetic persona analog: 
- WTP stated: 
- Trip Pass vs sub preference: 
- Invite blocker: 
- Top quote: 
- Synthetic finding validated/refuted: 
- Recommended P0/P1 change: 
```

---

## Success criteria for validation round

| Finding | Validate if | Refute if |
|---------|-------------|-----------|
| Trip Pass > subscription preference | ≥6/8 Regular choose per-trip | ≥5/8 prefer monthly |
| Guest itinerary needed | ≥5/8 won't sign up without preview | ≥5/8 fine with account first |
| iOS payment dead-end | ≥4/5 iOS users abandon | ≥3/5 complete on web |
| Pro stubs unacceptable | ≥3/3 Pro users cite empty tabs | Users don't open ops tabs |
| 10-screen onboarding too long | ≥5/8 want ≤3 screens | ≥5/8 complete without skip |

---

*Synthetic study generated these questions. Real sessions replace hypothesis with evidence.*
