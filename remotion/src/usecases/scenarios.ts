/**
 * The 11 use-case scenarios, as film manifests.
 *
 * COPY PROVENANCE — every user-visible string below is transcribed verbatim from
 * the marketing source of truth. Do not invent new claims here; `src/lib/useCases.ts`
 * is explicit that copy may only describe real product surfaces.
 *
 *   before / after / badge / audience  ← src/components/landing/sections/UseCasesSection.tsx
 *   ctaHeading / pains / solutions     ← src/lib/useCases.ts (cta.heading, featureMap[])
 *   still assets                       ← src/lib/useCaseImages.ts (copied to public/plates/stills)
 *
 * This file is deliberately NOT importing from the app. `src/lib/useCases.ts` is pure
 * data and would import cleanly, but the before/after/badge copy lives in a .tsx that
 * pulls in framer-motion, lucide-react, and `@/` path aliases — bundling that into
 * Remotion would drag the whole app module graph in. Transcribed instead; if the site
 * copy changes, update it here too.
 *
 * The 11 = the union of two lists that are each 10 long and not identical:
 * useCases.ts has Group Trips but no Greek life; UseCasesSection.tsx has Greek life
 * but no Group Trips.
 */

import type { Scenario } from './types';

export const SCENARIOS: Scenario[] = [
  {
    index: 1,
    slug: 'travel-concierge-client-portal',
    title: 'Travel Concierge & Advisors',
    audience: 'Luxury planners · travel advisors · client trips · families',
    before:
      'After the client pays, the trip still arrives as scattered WhatsApp messages, PDFs, and email chains.',
    after:
      'Run every client trip as a Pro Trip. Invite your team as Coordinators — they manage logistics while the client’s private chats, photos, and AI history stay off-limits at the database.',
    badge: 'Look premium · fewer client questions · private by default',
    ctaHeading: 'Deliver a more premium trip after every booking',
    pains: [
      'Details scattered across email, texts, and Drive',
      'Planners need logistics — not private chats',
      'Clients forget times and meeting points',
    ],
    solutions: [
      { label: 'Calendar + Base Camps', capture: 'm-calendar.png' },
      // m-pro-team.png is captured against a touring demo trip ("Beyoncé – Cowboy
      // Carter World Tour"). It is the only capture showing role management, which is
      // the headline concierge feature — so it stays, but not as the opening shot.
      { label: 'Coordinator Access', capture: 'm-pro-team.png' },
      { label: 'Smart Import + Attachments', capture: 'm-dashboard.png' },
    ],
    plates: {
      coldOpen: { still: 'concierge-atlantis-poolside.jpg', push: 'in', darken: 0.55 },
      // NOT dubai-birthday-luxury.webp — that file is byte-identical to
      // bali-destination-wedding.webp (mislabelled in src/assets/trip-covers).
      turn: { still: 'dubai-birthday-cameron-knight.webp', push: 'out', darken: 0.58 },
      payoff: { still: 'concierge-atlantis-poolside.jpg', push: 'out', darken: 0.25 },
    },
  },

  {
    index: 2,
    slug: 'wedding-guest-coordination-app',
    title: 'Weddings',
    audience: 'Couples · bride & groom families · wedding party · planners · vendors',
    before:
      'A dozen side chats, the planner in your family thread, and guests asking the same questions over and over.',
    after:
      'Channels per audience, a shared photo album, and a Coordinator seat for your planner — they run logistics without ever reading your family chat.',
    badge: 'Private family threads · one shared weekend',
    ctaHeading: 'Make the whole wedding weekend easier',
    pains: [
      'Bride’s side, groom’s side, and vendors all in one thread',
      '“What’s the dress code?” asked on repeat',
      'Guest photos trapped across phones',
    ],
    solutions: [
      { label: 'Channels per audience', capture: 'm-chat.png' },
      { label: 'Shared Media album', capture: 'm-media.png' },
      { label: 'Shared Calendar', capture: 'm-calendar.png' },
    ],
    plates: {
      coldOpen: { still: 'bali-wedding.webp', push: 'in', darken: 0.55 },
      turn: { still: 'bali-destination-wedding.webp', push: 'out', darken: 0.58 },
      payoff: { still: 'bali-destination-wedding.webp', push: 'out', darken: 0.2 },
    },
  },

  {
    index: 3,
    slug: 'group-travel-planning-app',
    title: 'Group Trips',
    audience: 'Bachelor parties · birthdays · family trips · destination weekends',
    before: 'Nine people, one group chat, and a plan nobody can find under four hundred messages.',
    after:
      'One trip workspace — the itinerary, the split, the pinned spots, and the photos all in a place everyone can actually find.',
    badge: 'One workspace · zero “wait, where are we meeting?”',
    ctaHeading: 'Plan the trip without the chaos',
    pains: [
      'The plan buried under 400 messages',
      '“Who owes who” after every meal',
      'Half the group at the wrong bar',
    ],
    solutions: [
      { label: 'Shared Calendar', capture: 'm-calendar.png' },
      { label: 'Payments', capture: 'm-payments.png' },
      { label: 'Base Camps + Places', capture: 'm-places.png' },
    ],
    plates: {
      coldOpen: { still: 'cancun-beach.webp', push: 'in', darken: 0.55 },
      turn: { still: 'group-cruise-deck-aerial.jpg', push: 'out', darken: 0.58 },
      payoff: { still: 'group-cruise-deck-aerial.jpg', push: 'out', darken: 0.2 },
    },
  },

  {
    index: 4,
    slug: 'family-organization-app',
    title: 'Families & Parents',
    audience: 'Family calendar · practices · pickups · photos · chores · team carpools',
    before:
      'Practices, pickups, forms, and “what’s for dinner?” scattered across two calendars, a fridge flyer, and a dozen group texts.',
    after:
      'One shared family hub — calendar, photos, tickets, chores, dinner polls, and team carpools, all in sync so everyone knows where to be.',
    badge: 'Fewer missed pickups · more time together',
    ctaHeading: 'Make your family’s logistics one shared place',
    pains: [
      'Practices and pickups scattered across texts',
      'Tickets and permission slips lost',
      'Kids’ game photos stuck on one phone',
    ],
    solutions: [
      { label: 'Shared Calendar', capture: 'm-calendar.png' },
      { label: 'Shared Media album', capture: 'm-media.png' },
      { label: 'Polls + Tasks', capture: 'm-polls.png' },
    ],
    plates: {
      coldOpen: { still: 'youth-soccer-family.jpg', push: 'in', darken: 0.55 },
      turn: { still: 'aspen-family-summer.webp', push: 'out', darken: 0.58 },
      payoff: { still: 'youth-soccer-family.jpg', push: 'out', darken: 0.2 },
    },
  },

  {
    index: 5,
    slug: 'sports-team-travel-coordination',
    title: 'Sports Teams',
    audience: 'Players · coaches · coordinators · operations staff',
    before: 'Staff juggling travel, practices, and logistics across too many tools.',
    after:
      'Role-based access, team schedules, and instant updates — built to scale from Amateur to the Pros.',
    badge: 'Fewer errors · faster decisions',
    ctaHeading: 'Keep the whole team on the same page',
    pains: [
      'Schedule changes cause confusion',
      'Parents and players in different chats',
      'Waivers and forms hard to track',
    ],
    solutions: [
      { label: 'Broadcasts + Calendar', capture: 'm-broadcasts.png' },
      { label: 'Base Camps + Explorer', capture: 'm-places.png' },
      { label: 'Tasks', capture: 'm-tasks.png' },
    ],
    plates: {
      coldOpen: { still: 'iu-memorial-stadium-cover.jpg', push: 'in', darken: 0.55 },
      turn: { still: 'youth-soccer-family.jpg', push: 'out', darken: 0.58 },
      payoff: { still: 'iu-memorial-stadium-cover.jpg', push: 'out', darken: 0.2 },
    },
  },

  {
    index: 6,
    slug: 'music-tour-coordination',
    title: 'Touring Artists & Crews',
    audience: 'Musicians · comedians · podcasts · managers · production',
    before:
      'Spreadsheets, endless texts, missed details. Overwhelmed tour managers, annoyed artists.',
    after:
      'Show days, rehearsal times, off days, crew channels, logistics, and payments — all in one place. Everyone aligned, every city.',
    badge: 'Fewer mistakes · smoother tours',
    ctaHeading: 'Keep the touring party aligned, city by city',
    pains: [
      'Departments in separate chats',
      'Day sheets screenshotted and stale',
      'Content assets scattered everywhere',
    ],
    solutions: [
      { label: 'Calendar + Attachments', capture: 'm-calendar.png' },
      { label: 'Broadcasts', capture: 'm-broadcasts.png' },
      { label: 'Shared Media album', capture: 'm-media.png' },
    ],
    plates: {
      coldOpen: { still: 'coachella-festival.webp', push: 'in', darken: 0.6 },
      turn: { still: 'coachella-festival-new.webp', push: 'out', darken: 0.6 },
      payoff: { still: 'coachella-festival.webp', push: 'out', darken: 0.25 },
    },
  },

  {
    index: 7,
    slug: 'conference-event-management-app',
    title: 'Conferences & Events',
    audience: 'Organizers · speakers · production staff · attendees',
    before:
      'A printed agenda goes stale by the first session, and attendees screenshot the schedule and miss the room swap.',
    after:
      'A live agenda and speaker lineup, attendee broadcasts, session polls, staff tasks, venue maps, and a shared album — all in one place.',
    badge: 'No stale handouts · nobody misses a room change',
    ctaHeading: 'Run your next event from one workspace',
    pains: [
      'Printed agendas stale by day one',
      'Sessions change at the last minute',
      'Staff coordinating over radio and text',
    ],
    solutions: [
      { label: 'Live Agenda + Calendar', capture: 'm-calendar.png' },
      { label: 'Broadcasts', capture: 'm-broadcasts.png' },
      { label: 'Polls', capture: 'm-polls.png' },
    ],
    plates: {
      coldOpen: { still: 'conference-ballroom-stage.jpg', push: 'in', darken: 0.55 },
      turn: { still: 'conference-ballroom-stage.jpg', push: 'out', darken: 0.6 },
      payoff: { still: 'conference-ballroom-stage.jpg', push: 'out', darken: 0.25 },
    },
  },

  {
    index: 8,
    slug: 'local-clubs-meetups',
    title: 'Local Clubs & Meetups',
    audience: 'Run clubs · trivia nights · rec leagues · golf groups · community meetups',
    before:
      'A different group text every week, RSVPs lost in the replies, and half the crew showing up to the wrong bar, course, or start line.',
    after:
      'One home base for the regulars — recurring schedule, RSVPs, the spot pinned on a map, a shared album, and one broadcast when plans change.',
    badge: 'No plane ticket required · the regulars always know where to be',
    ctaHeading: 'Keep your local crew in one place',
    pains: [
      'A new group text every single week',
      'RSVPs lost in a wall of replies',
      'People at the wrong course or start line',
    ],
    solutions: [
      { label: 'Polls + Calendar', capture: 'm-polls.png' },
      { label: 'Base Camps', capture: 'm-places.png' },
      { label: 'Shared Media album', capture: 'm-media.png' },
    ],
    plates: {
      coldOpen: { still: 'phoenix-golf-outing.webp', push: 'in', darken: 0.55 },
      turn: { still: 'phoenix-golf-outing.webp', push: 'out', darken: 0.58 },
      payoff: { still: 'phoenix-golf-outing.webp', push: 'out', darken: 0.2 },
    },
  },

  {
    index: 9,
    slug: 'church-group-trip-coordination',
    title: 'Faith & Church Groups',
    audience: 'Mission trips · retreats · youth group · choir & worship tours',
    before:
      'Sign-up sheets, paper permission slips, a phone tree, and a dozen parent group texts for every trip.',
    after:
      'Rosters and roles, permission forms, the itinerary, trip-fee collection, broadcasts to every family, and a shared album — all in one place.',
    badge: 'Lead the trip, not the group chat',
    ctaHeading: 'Lead the trip, not the group chat',
    pains: [
      'Sign-up sheets and paper permission slips',
      'Collecting trip fees and deposits',
      'Parents and chaperones out of the loop',
    ],
    solutions: [
      { label: 'Attachments + Tasks', capture: 'm-tasks.png' },
      { label: 'Payments', capture: 'm-payments.png' },
      { label: 'Broadcasts', capture: 'm-broadcasts.png' },
    ],
    plates: {
      coldOpen: { still: 'faith-community-build.jpg', push: 'in', darken: 0.55 },
      turn: { still: 'faith-community-build.jpg', push: 'out', darken: 0.58 },
      payoff: { still: 'faith-community-build.jpg', push: 'out', darken: 0.2 },
    },
  },

  {
    index: 10,
    slug: 'business-travel-coordination',
    title: 'Business Travel & Company Retreats',
    audience: 'Coworkers · client meetings · offsites · company retreats · work dinners',
    before:
      'Work trips scattered across personal iMessage, forwarded confirmations, Slack DMs, and a Drive folder nobody remembers to open.',
    after:
      'A private trip workspace with the meeting itinerary, decks, receipts, per-person tasks, and dinner splits — kept out of your personal texts.',
    badge: 'Aligned team · work chat out of personal texts',
    ctaHeading: 'Keep work trips organized — and out of your personal texts',
    pains: [
      'Work trips leaking into personal iMessage',
      'Decks and confirmations scattered',
      'Chasing Venmo for the team dinner',
    ],
    solutions: [
      { label: 'A private trip workspace', capture: 'm-chat.png' },
      { label: 'Per-person Tasks', capture: 'm-tasks.png' },
      { label: 'Payments', capture: 'm-payments.png' },
    ],
    plates: {
      coldOpen: { still: 'aspen-corporate-ski.webp', push: 'in', darken: 0.55 },
      turn: { still: 'aspen-ski.webp', push: 'out', darken: 0.58 },
      payoff: { still: 'aspen-corporate-ski.webp', push: 'out', darken: 0.2 },
    },
  },

  {
    index: 11,
    slug: 'fraternities-sororities',
    title: 'Fraternities & Sororities',
    audience: 'Rush · formals · retreats · philanthropy · chapter ops',
    before:
      'One giant group chat — endless scrollback, mixed events, sensitive moments living forever in one thread.',
    after:
      'Separate vaults per event — Rush, Formal, Retreat. Chat and media stay compartmentalized. Access controlled, moments stay private.',
    badge: 'Private trip vaults with access controls',
    ctaHeading: 'Give every chapter event its own private vault',
    pains: [
      'One giant chat, endless scrollback',
      'Every event mixed into one thread',
      'Sensitive moments living forever',
    ],
    solutions: [
      { label: 'Separate vaults per event', capture: 'm-dashboard.png' },
      { label: 'Access controls', capture: 'm-pro-team.png' },
      { label: 'Compartmentalized media', capture: 'm-media.png' },
    ],
    plates: {
      coldOpen: { still: 'cancun-spring-break.webp', push: 'in', darken: 0.6 },
      turn: { still: 'cancun-beach.webp', push: 'out', darken: 0.6 },
      payoff: { still: 'cancun-spring-break.webp', push: 'out', darken: 0.25 },
    },
  },
];

export const getScenario = (slug: string): Scenario => {
  const found = SCENARIOS.find(s => s.slug === slug);
  if (!found) throw new Error(`Unknown scenario slug: ${slug}`);
  return found;
};
