

# Marketing Page Copy Reduction — 20% Word Count Cut

## Current Word Count Inventory

| Section | Location | Current Words (approx) |
|---------|----------|----------------------|
| **Hero** | `HeroSection.tsx` | ~45 |
| **How It Works** | `ProblemSolutionSection.tsx` | ~30 |
| **AI Features** | `AiFeaturesSection.tsx` | ~155 |
| **Use Cases** (6 cards) | `UseCasesSection.tsx` | ~280 |
| **Replaces Grid** | `ReplacesGrid.tsx` + `ReplacesGridData.ts` | ~30 (headers) + ~80 (benefits) |
| **FAQ** | `FAQSection.tsx` | ~310 |
| **Pricing** | `PricingSection.tsx` | ~100 (descriptions) |
| **Total visible copy** | | **~1,030 words** |

**Target: ~820 words (remove ~210 words)**

---

## Edit Plan by Section

### 1. HeroSection.tsx (~45 → ~35 words, -10)

**Current:**
> "For Friends, Families, Sports, Tours, Work Trips & More. Planning is Frustrating. Get UnFrustrated."
> "Plans, Photos, Places, PDFs, & Payments — in one Shared space."

**Proposed:**
> "Friends, Families, Sports, Tours, Work & More. Planning is Frustrating. Get UnFrustrated."
> "Plans, Photos, Places & Payments — one shared space."

Cut "For", "PDFs, &", "in" — tighter rhythm.

### 2. AiFeaturesSection.tsx (~155 → ~105 words, -50)

This is the biggest offender. The feature descriptions read like documentation, not marketing.

| Feature | Current | Proposed |
|---------|---------|----------|
| Section headline | "Travel Intelligence: AI that understands your trip." | "AI That Knows Your Trip" |
| Section subhead | "Full trip context. Live web search. Payment awareness. Group decisions. Every answer is grounded in your actual trip — not just your question." | "Every answer grounded in your itinerary, budget, and group — not generic advice." |
| Context-Aware Concierge | "Loads your full trip — itinerary, tasks, payments, places, and group — before every answer. Responses are grounded in your actual trip data, not generic travel advice. Live web search included for real-time hours, prices, and availability." | "Your full trip context — itinerary, tasks, payments, places — loaded before every answer. Live web search for real-time hours and prices." |
| Payment Tracking | "Keep track of who owes what, without the spreadsheets" | "Who owes what — no spreadsheets." |
| Chravel Agent | "Your AI assistant takes action — add places to BaseCamps, save links, create polls, update calendars, assign tasks, plus pull flights, hotels, and activity suggestions." | "Takes action: adds places, creates polls, updates calendars, assigns tasks, and pulls travel suggestions." |
| BaseCamps | "No more fumbling to find the Airbnb or hotel address. Store it once for all trip members." | "Store your Airbnb or hotel address once. Everyone has it." |
| Smart Import | "Paid feature: Import calendar, agenda & lineup from URLs or paste—AI extracts schedules and names automatically (Explorer+ / Trip Pass / Pro)" | "Import calendars, agendas & lineups from URLs — AI extracts schedules automatically. (Explorer+)" |
| Recap PDFs | "Sharing recommendations or just want a quick overview of the trip? Get a simple summary PDF." | "One-tap trip summary PDF." |

### 3. UseCasesSection.tsx (~280 → ~215 words, -65)

Trim the "before" and "after" descriptions — they're wordy for expandable cards.

| Card | Field | Current | Proposed |
|------|-------|---------|----------|
| Family Hubs | before | "Last-minute texts. Missed pickups. Fridge notes ignored. Confusion over who's doing what — and when." | "Last-minute texts. Missed pickups. Nobody knows who's doing what." |
| Family Hubs | after | "One shared space for year-round family logistics and recurring routines. Keep calendars, chat updates, tasks, and photos in sync — so everyone knows where to be, and when." | "One shared space for family logistics. Calendars, tasks, and chat in sync — everyone knows where to be." |
| Touring Artists | before | "Spreadsheets, countless texts, last-minute changes, and missed details. Overwhelmed Tour Managers & Annoyed Artists." | "Spreadsheets, endless texts, missed details. Overwhelmed managers, annoyed artists." |
| Bach Parties | before | "Dozens of chats between families, guests, planners, and vendors. Guests constantly asking where to be and when." | "Dozens of chats. Guests constantly asking where to be and when." |
| Bach Parties | after | "One shared itinerary with pinned locations, real-time updates, and live photo sharing—no confusion, just celebration." | "Shared itinerary, pinned locations, live photos — no confusion, just celebration." |
| Frats/Sororities | before | "One giant group chat becomes a permanent archive — endless scrollback, mixed events, and sensitive moments living forever in one thread." | "One giant group chat — endless scrollback, mixed events, sensitive moments living forever in one thread." |
| Frats/Sororities | after | "Create separate Trip vaults per event (Rush Week, Formal, Retreat) so chat + media stay compartmentalized. Membership is explicit, access is controlled, and your private moments don't end up as one searchable liability." | "Separate vaults per event — Rush, Formal, Retreat. Chat and media stay compartmentalized. Access controlled, moments stay private." |
| Sports | before | "Staff juggling travel, practices, academics, and logistics across multiple tools." | "Staff juggling travel, practices, and logistics across too many tools." |
| Community | after | "One shared home for meetups, locations, notes, and photos—your group finally stays connected." | "One shared home for meetups, locations, and photos. Your group stays connected." |
| Use Cases header subtext | "For work trips, vacations, sports teams, tours, and even local events. ChravelApp is designed to handle it all." | "Work trips, vacations, sports, tours, local events — ChravelApp handles it all." |

### 4. FAQSection.tsx (~310 → ~255 words, -55)

| FAQ | Current answer | Proposed answer |
|-----|---------------|-----------------|
| "Who is ChravelApp for?" | "Anybody organizing a group that wants to simplify sharing information: Work, Personal, Sports, Tours, Conferences, Vacations, Travel, or even local events." | "Anyone organizing a group — work, sports, tours, conferences, vacations, or local events." |
| "Why not just use the apps I already have?" | "Unlike your current stack where texts don't know what's in your emails, and your spreadsheet doesn't know what's in your group chat—ChravelApp's 8 tabs are fully interconnected. Your AI concierge can search your calendar, polls, and outstanding tasks, and more. One context-aware trip brain instead of 8 disconnected apps." | "Your texts don't know what's in your calendar. Your spreadsheet doesn't know what's in your group chat. ChravelApp's 8 tabs are fully interconnected — one trip brain instead of 8 disconnected apps." |
| "How do AI queries work on each plan?" | (63 words) | "Free: 10 AI queries per user per trip. Explorer: 25. Frequent Chraveler: unlimited. Voice sessions count as one query. Each new trip resets your limit." (~25 words, -38) |
| "Do all trip members need to pay?" | (50 words) | "Trips are free with limited features. Upgrade for unlimited trips and more. For Pro, only the admin pays and assigns seats — ideal for teams." (~25 words) |
| "What's included with the free Pro Trip and Event?" | "Every account gets 1 free ChravelApp Pro trip and 1 free Event to experience all premium features. It's our way of letting you try before you buy — no commitment required!" | "Every account gets 1 free Pro trip and 1 free Event — try all premium features, no commitment." |
| "Are Events included..." | (40 words) | "Yes — bundled into all paid plans. Explorer: up to 50 guests. Frequent Chraveler: up to 100. All Pro tiers: unlimited." (~20 words) |
| FAQ subheading | "Everything you need to know about ChravelApp" | "Got questions? We've got answers." |

### 5. ReplacesGrid header (~15 → ~12 words, -3)

**Current:** "Tap the Tabs below to see ChravelApp Consolidate your App Arsenal"
**Proposed:** "Tap below to see how ChravelApp consolidates your app stack"

---

## Summary of Cuts

| Section | Words Cut | Technique |
|---------|-----------|-----------|
| Hero | ~10 | Remove filler prepositions |
| AI Features | ~50 | Cut documentation-style prose to punchy copy |
| Use Cases | ~65 | Tighten before/after descriptions |
| FAQ | ~55 | Compress answers, remove redundant phrasing |
| Replaces Grid | ~3 | Minor header tightening |
| Pricing descriptions | ~5 | Minor trims |
| **Total** | **~188-210** | **~20% reduction** |

## Files Changed

1. `src/components/landing/sections/HeroSection.tsx` — subtitle and bottom tagline
2. `src/components/landing/sections/AiFeaturesSection.tsx` — all 6 feature descriptions + headline/subhead
3. `src/components/landing/sections/UseCasesSection.tsx` — scenarios array text + header subtext
4. `src/components/landing/sections/FAQSection.tsx` — 6 FAQ answers + subheading
5. `src/components/conversion/ReplacesGrid.tsx` — header subtitle

## Approach

Pure string-level edits to copy. No structural/layout/component changes. Every feature point preserved — just expressed in fewer words.

