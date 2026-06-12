# Real Beta Interview Questions — what to ask actual humans next

> The whole point of the synthetic study is to sharpen these. Every question below targets a
> finding this study could NOT settle (labeled [SIMULATED RISK] or [HYPOTHESIS]) and names the
> decision it unblocks. Source persona in parentheses; one persona-specific question also closes
> each report in `30-persona-full-report.md`.

## How to run these

- Prioritize behavioral evidence over opinions: "show me your last trip's chat/Venmo history/spreadsheet"
  beats "would you use…". Several questions are live tasks, not questions.
- Recruit against the screener in this study (trips/year, group size, organizer role, platform) so
  answers map back onto the persona matrix.
- The top 10 below are ordered by (decision value × current uncertainty).

## Top 20

### Invite friction & the guest wall (decides: P1-1 scope)
1. **Live task:** Send this invite link to your three least-responsive friends right now. What do
   they do, and what do they text you back? (23, 7)
2. What percentage of your over-55 guests get past a sign-up screen without calling you? Walk me
   through the last time you onboarded a relative over 70 to any app — at which exact step did
   they call you instead? (5, 6)
3. If invitees could see the itinerary and vote in polls from the link alone — no account — what
   would you still need before moving your group's planning here? (4, 7, 24)

### Willingness to pay & SKU shape (decides: P1-3/P1-4 pricing)
4. Show me your actual Venmo request history from your last group trip. At which exact moment in
   that history would you have paid $40 to make it stop? Would $12 have changed the answer? (3, 28)
5. **Live moment test:** You're at dinner; the app says 3-of-3 free splits used, with [$12 weekend
   pass / $39.99 Trip Pass / $9.99-mo] options. What do you actually do in the next two minutes? (28)
6. Who pays — you personally, the group, or an organization? Has the group ever reimbursed you for
   a tool? What approval did that need? (24, 25, 26, 14)
7. *(Events pros)* You run N events a year. Describe the pricing structure that would make this a
   line item in your client invoice rather than a personal expense. (21, 29)

### AI trust (decides: concierge investment level — biggest open [HYPOTHESIS])
8. **Live task:** Ask the concierge for a restaurant recommendation in a city you know deeply.
   Narrate the exact moment in its answer where you decided to trust it or dismiss it. (8)
9. What's one thing an AI assistant could do during a trip that would make you trust it MORE than
   a group member doing the same task — and one thing that would end its credibility permanently? (1, 5)

### Smart Import value (decides: P1-6 sequencing, P0-6 priority)
10. **Live task:** Bring five real documents from your last trip/leg (venue advance, hotel
    confirmation, charter manifest, schedule sheet). Watch the import. How many corrections before
    you'd trust it to build tomorrow's schedule — and what would you pay per leg/trip if it got
    there? (15, 17)
11. What happened the last time a tool duplicated or mangled an entry in shared data your group
    relied on? What did you do next? (16, 22)

### Payments trust (decides: P2-4 and settlement roadmap)
12. Open your last trip's expense record. How would $2,400 of house/gas/grocery costs need to
    appear if the app understood "couples" or "families" as units? Where did your actual process
    break? (9)
13. Walk me through your last end-of-trip settlement. Who was the last person to pay, how long did
    it take, and what — if anything — would you let an app DO about that person? (28, 10)

### Mobile usability (decides: P3 nav investment, Android story)
14. **Live task, their phone:** Find Tasks. Find Polls. Create a calendar item. (Watch for the tab
    strip scroll.) Then: what's missing from this being your trip home screen? (1, 23)
15. *(Android users)* Install this as a PWA with me right now. Then I'll send you a push
    notification tonight — tell me tomorrow if it arrived. (2, 24, 30)

### Pro/event roles & permissions (decides: Pro segment investment, P1-1 opt-out design)
16. **Adversarial live task:** Here's a viewer-role login on a dummy trip. Spend ten minutes trying
    to learn things you shouldn't. What did you find, and what would you need to see before
    trusting this with a principal's/client's itinerary? (19)
17. If broadcasts, role channels, and roster import worked today but per-diem/compliance didn't,
    would you run ONE real trip on this alongside your current stack? What ends the experiment? (11, 12, 13)
18. Show me the exact artifact you hand to compliance/your client after a trip. If Chravel
    generated 80% automatically, what's in the missing 20% that keeps you in Excel? (13, 18, 20)

### Account creation & activation (decides: onboarding cuts)
19. **Funnel observation, not a question:** watch a first-time organizer go from landing → created
    trip → first invite sent, with think-aloud. Note where the 10-screen carousel, signup, and
    invite steps lose them. Compare against the PostHog funnel (now live). (7, 10)

### Trip Pass vs subscription (decides: monetization architecture)
20. You planned N trips in the last 12 months. Looking at [Trip Pass $39.99 / weekend pass $12 /
    Explorer $9.99-mo / Frequent Chraveler $19.99-mo]: which one is "obviously for someone like
    you," which is obviously not, and why? (2, 3, 9, 10, 30)

## Coverage map

| Study uncertainty | Questions | Unblocks |
|---|---|---|
| Guest wall severity | 1–3 | P1-1 (biggest build) |
| WTP / SKU shape | 4–7, 20 | P1-3, P1-4 |
| AI trust | 8–9 | Concierge roadmap |
| Smart Import | 10–11 | P1-6, P0-6 |
| Payments trust | 12–13 | P2-4, settlement |
| Mobile/Android | 14–15 | P3 nav, PWA story |
| Pro roles/privacy | 16–18 | Pro segment go/no-go |
| Activation funnel | 19 | Onboarding cuts |
