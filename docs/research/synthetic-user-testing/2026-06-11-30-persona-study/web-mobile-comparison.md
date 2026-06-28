# Web vs Mobile / PWA Comparison

## Method

[OBSERVED] Browser testing loaded the local app, unauthenticated landing, auth modal, demo dashboard, pricing section, DevTools console, and iPhone-sized responsive viewport. [OBSERVED] Source inspection covered desktop/mobile route pairs and native navigation components.

## Desktop web

### Strengths

- [OBSERVED] Landing communicates the group-chat travel app thesis, use cases, and pricing.
- [OBSERVED] Auth modal is reachable, offers Google/Apple/email, and can be closed.
- [OBSERVED] Desktop dashboard demo cards show trip metadata and Invite/View/Share affordances.
- [SIMULATED RISK] Desktop is the right setup surface for planners, pros, and event admins.

### Issues

- [OBSERVED] Demo walkthrough did not reliably enter full in-trip interactive tab views.
- [SIMULATED RISK] Regular vs Pro vs Events needs sharper mode-specific education.
- [SIMULATED RISK] Pro/Event buyers need fewer marketing promises and more operational proof.

## Mobile / PWA

### Strengths

- [OBSERVED] Mobile landing at iPhone size remained readable with visible hamburger and Login/Signup button.
- [OBSERVED] Source includes mobile route pairs for Trip, ProTrip, and Event detail pages.
- [OBSERVED] Source includes native tab bar and trip-type switcher.

### Issues

- [OBSERVED] In-trip bottom navigation, chat input, invite modal, and feature forms were not directly reached in the browser demo session.
- [SIMULATED RISK] Large groups will need one-thumb mute, broadcast, schedule, and payment controls.
- [SIMULATED RISK] PWA/native wrapper trust depends on push, offline, share sheet, and App Store purchase behavior.

## Comparison table

| Area | Desktop web | Mobile/PWA | Action |
| --- | --- | --- | --- |
| Landing | Strong, readable, broad use cases | Readable at iPhone width | Add mode-specific CTAs |
| Auth | Modal observed with exit | Needs mobile modal validation | Test signup/close/OAuth on device |
| Dashboard | Trip cards visible | Likely stacked; needs in-app validation | Run authenticated mobile E2E |
| Invite | Buttons visible on cards | Invite link is critical mobile path | Make preview/account-light flow first-class |
| Calendar | Best for setup/editing | Best for day-of reading | Optimize itinerary overview for mobile |
| AI/Import | Good setup surface | Needs trust and confirmation on small screens | Source preview + confirm cards |
| Payments | Ledger review easier | Settlement/reminder likely mobile | Harden money trust and rail handoff |
| Notifications | Settings/admin review | Day-of control critical | Per-trip mute and digest |
