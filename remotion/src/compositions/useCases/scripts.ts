/**
 * High-impact Instagram Reel scripts for every ChravelApp use case.
 * Format: 1080×1920 · ~22s · multi-scene cinematic.
 *
 * Script principle per reel:
 * 1. Hook — name the chaos in one line
 * 2. Pain — make the audience feel the group-chat tax
 * 3. Turn — one shared workspace
 * 4–6. Feature beats — the sharpest product unlocks
 * 7. CTA — brand + action
 */

export type FeatureBeat = {
  label: string;
  detail: string;
};

export type UseCaseScript = {
  id: string;
  slug: string;
  eyebrow: string;
  hook: string;
  pain: string;
  turn: string;
  features: [FeatureBeat, FeatureBeat, FeatureBeat];
  cta: string;
  ctaSub: string;
  urlPath: string;
  /** Paths relative to public/usecases/broll/ready/ */
  clips: [string, string, string, string];
  /** Path relative to public/usecases/stills/ */
  still: string;
  /** Phone UI accent lines shown in the product reveal */
  phoneLines: string[];
};

export const USE_CASE_SCRIPTS: UseCaseScript[] = [
  {
    id: 'concierge',
    slug: 'travel-concierge-client-portal',
    eyebrow: 'TRAVEL CONCIERGE',
    hook: 'They paid for peace of mind.\nNot a PDF in WhatsApp.',
    pain: 'Confirmations in email.\nLinks in Drive.\nPlans in five threads.\nYour client feels none of it.',
    turn: 'Hand them a private portal\nalready planned.',
    features: [
      {
        label: 'Coordinator Access',
        detail: 'Your team runs logistics. Their chats stay private.',
      },
      {
        label: 'Smart Import',
        detail: 'Flights and vouchers in. Blank app out.',
      },
      {
        label: 'Client-ready day one',
        detail: 'Calendar, Base Camps, Places — preloaded.',
      },
    ],
    cta: 'Deliver a premium trip',
    ctaSub: 'after every booking',
    urlPath: 'chravel.app/use-cases/travel-concierge',
    clips: [
      'gen-concierge.mp4',
      'gen-concierge-02.mp4',
      'brand-concierge.mp4',
      'gen-concierge.mp4',
    ],
    still: 'concierge.jpg',
    phoneLines: [
      'Atlantis Escape · Preloaded',
      'Coordinator · Logistics only',
      'Private chats · Client locked',
    ],
  },
  {
    id: 'weddings',
    slug: 'wedding-guest-coordination-app',
    eyebrow: 'WEDDINGS',
    hook: 'A wedding is a weekend.\nNot one group chat.',
    pain: "Bride's side. Groom's side.\nVendors. Wedding party.\nTwelve threads. Zero clarity.",
    turn: 'One Pro Trip.\nEvery audience covered.',
    features: [
      {
        label: 'Channels per audience',
        detail: 'Family, party, vendors — only what they need.',
      },
      {
        label: 'Planner as Coordinator',
        detail: 'Logistics yes. Family chats no.',
      },
      {
        label: 'Shared photo album',
        detail: 'Every guest. Every phone. One album.',
      },
    ],
    cta: 'Run the whole weekend',
    ctaSub: 'without the chaos',
    urlPath: 'chravel.app/use-cases/weddings',
    clips: ['gen-weddings.mp4', 'gen-weddings-02.mp4', 'brand-wedding.mp4', 'gen-weddings.mp4'],
    still: 'wedding.webp',
    phoneLines: [
      'Wedding Weekend · Pro Trip',
      'Channel · Wedding Party',
      'Media · 214 guest photos',
    ],
  },
  {
    id: 'group-trips',
    slug: 'group-travel-planning-app',
    eyebrow: 'GROUP TRIPS',
    hook: 'Bachelor. Birthday. Reunion.\nSame chaos. Every time.',
    pain: '"Where are we meeting?"\n"Who paid for the Airbnb?"\n"Wait — what time?"',
    turn: 'One trip workspace.\nEveryone in sync.',
    features: [
      {
        label: 'Shared calendar',
        detail: 'Itinerary everyone can actually see.',
      },
      {
        label: 'Payments that settle',
        detail: 'Split costs. No spreadsheet. No Venmo chase.',
      },
      {
        label: 'Base Camps + Places',
        detail: 'Pin the house. Save the spots.',
      },
    ],
    cta: 'Plan the trip together',
    ctaSub: 'without the group-chat tax',
    urlPath: 'chravel.app/group-travel',
    clips: ['gen-group.mp4', 'gen-group-02.mp4', 'brand-group.mp4', 'gen-group.mp4'],
    still: 'group.jpg',
    phoneLines: [
      'Tahoe Bachelor · 8 going',
      'Tonight · Dinner at 7:30',
      'Split · Cabin $420 settled',
    ],
  },
  {
    id: 'families',
    slug: 'family-organization-app',
    eyebrow: 'FAMILIES & PARENTS',
    hook: "Family life shouldn't live\non the fridge.",
    pain: 'Practices. Pickups. Forms.\nGame photos on one phone.\nDinner decided in a text war.',
    turn: 'One family hub.\nTrip or no trip.',
    features: [
      {
        label: 'Shared family calendar',
        detail: 'Practices, games, appointments — visible.',
      },
      {
        label: 'Photos that reach everyone',
        detail: 'Kids post. Grandparents see. Instantly.',
      },
      {
        label: 'Polls + carpools',
        detail: 'Dinner votes. Snack duty. Done.',
      },
    ],
    cta: 'Make logistics a shared place',
    ctaSub: 'spend the time together',
    urlPath: 'chravel.app/use-cases/families',
    clips: ['gen-families-02.mp4', 'brand-family.mp4', 'gen-families-02.mp4', 'brand-family.mp4'],
    still: 'family.jpg',
    phoneLines: ['The Amechis · This season', 'Sat · Soccer 9:00 AM', 'Poll · Pizza vs sushi'],
  },
  {
    id: 'sports',
    slug: 'sports-team-travel-coordination',
    eyebrow: 'SPORTS TEAMS',
    hook: 'Game day fails\nwhen travel day does.',
    pain: 'Coach has the schedule.\nParents have the hotel.\nPlayers are in another chat.',
    turn: 'One team workspace.\nEveryone moves together.',
    features: [
      {
        label: 'Broadcast the change',
        detail: 'Bus moved? One update. Whole party.',
      },
      {
        label: 'Hotel as Base Camp',
        detail: 'Gyms, stadiums, airports — pinned.',
      },
      {
        label: 'Tasks + forms',
        detail: 'Waivers, gear, rooming lists — tracked.',
      },
    ],
    cta: 'Keep the whole team aligned',
    ctaSub: 'for the next road trip',
    urlPath: 'chravel.app/use-cases/sports',
    clips: ['gen-sports-01.mp4', 'gen-sports-02.mp4', 'brand-sports.mp4', 'gen-sports-01.mp4'],
    still: 'sports.jpg',
    phoneLines: [
      'AAU Showcase · Indianapolis',
      'Broadcast · Bus departs 6:45',
      'Base Camp · Team Hotel',
    ],
  },
  {
    id: 'touring',
    slug: 'music-tour-coordination',
    eyebrow: 'TOURING ARTISTS & CREWS',
    hook: 'Fifty cities.\nFifty different group chats.',
    pain: 'Day sheet screenshots.\nSecurity on one thread.\nContent on another.\nCall times already stale.',
    turn: 'One workspace\nper city. Entire party.',
    features: [
      {
        label: 'City-by-city schedule',
        detail: 'Call times, venues, meals — live.',
      },
      {
        label: 'Broadcast to the run',
        detail: 'Load-in moved. Everyone knows.',
      },
      {
        label: 'Shared content album',
        detail: 'Photos and video. One place.',
      },
    ],
    cta: 'Keep the run buttoned up',
    ctaSub: 'city by city',
    urlPath: 'chravel.app/use-cases/touring',
    clips: ['gen-touring-01.mp4', 'gen-touring-03.mp4', 'brand-tour.mp4', 'gen-touring-01.mp4'],
    still: 'tour.webp',
    phoneLines: ['City 14 · Chicago', 'Call · Soundcheck 3:00 PM', 'Base Camp · Venue Stage Door'],
  },
  {
    id: 'conferences',
    slug: 'conference-event-management-app',
    eyebrow: 'CONFERENCES & EVENTS',
    hook: 'The printed agenda\ndied by session one.',
    pain: 'Room swaps. Speaker changes.\nStaff on radio.\nAttendees on a stale PDF.',
    turn: 'One live workspace.\nOrganizers and attendees.',
    features: [
      {
        label: 'Live Agenda + Lineup',
        detail: 'Update once. Everyone sees current.',
      },
      {
        label: 'Broadcasts that land',
        detail: 'Keynote in Hall B — ten minutes.',
      },
      {
        label: 'Staff tasks + Polls',
        detail: 'Load-in. Feedback. Breakouts.',
      },
    ],
    cta: 'Run the event from one place',
    ctaSub: 'agenda to teardown',
    urlPath: 'chravel.app/use-cases/events',
    clips: [
      'gen-conferences-01.mp4',
      'gen-conferences-03.mp4',
      'brand-conference.mp4',
      'gen-conferences-01.mp4',
    ],
    still: 'conference.jpg',
    phoneLines: [
      'Summit 2026 · Day 2',
      'Broadcast · Keynote → Hall B',
      'Agenda · Live for attendees',
    ],
  },
  {
    id: 'local-clubs',
    slug: 'local-clubs-meetups',
    eyebrow: 'LOCAL CLUBS & MEETUPS',
    hook: 'No flight required.\nStill chaos every week.',
    pain: 'Run club. Trivia. Rec league.\nPlans buried in replies.\nHalf the crew at the wrong spot.',
    turn: 'One home base\nfor the regulars.',
    features: [
      {
        label: 'Recurring schedule',
        detail: 'Weekly run. Tee time. Trivia night.',
      },
      {
        label: 'RSVPs that count',
        detail: 'Polls for headcount. No reply avalanche.',
      },
      {
        label: 'Pinned locations',
        detail: 'Bar, course, start line — never wrong.',
      },
    ],
    cta: 'Organize the regulars',
    ctaSub: 'no plane ticket needed',
    urlPath: 'chravel.app/use-cases/local-clubs',
    clips: ['gen-clubs-01.mp4', 'gen-clubs-02.mp4', 'brand-clubs.mp4', 'gen-clubs-01.mp4'],
    still: 'clubs.webp',
    phoneLines: [
      'Sunrise Run Club · Weekly',
      "Poll · Who's in Saturday?",
      'Base Camp · Lakeside Start',
    ],
  },
  {
    id: 'faith',
    slug: 'church-group-trip-coordination',
    eyebrow: 'FAITH & CHURCH GROUPS',
    hook: 'Lead the mission.\nNot the group chat.',
    pain: 'Permission slips. Trip fees.\nParent texts. Packing lists.\nThe leader chases everyone.',
    turn: 'One trip workspace\nfor the whole ministry.',
    features: [
      {
        label: 'Forms + rosters',
        detail: 'Waivers and medicals in Attachments.',
      },
      {
        label: 'Payments for trip fees',
        detail: 'Collect deposits without the cash box.',
      },
      {
        label: 'Broadcasts to families',
        detail: 'Parents informed. Chaperones aligned.',
      },
    ],
    cta: 'Lead the trip',
    ctaSub: 'not the group chat',
    urlPath: 'chravel.app/use-cases/faith',
    clips: ['gen-faith-01.mp4', 'gen-faith-02.mp4', 'brand-faith.mp4', 'gen-faith-01.mp4'],
    still: 'faith.jpg',
    phoneLines: [
      'Youth Mission · Summer',
      'Task · Permission form due Fri',
      'Payments · Deposit collected',
    ],
  },
  {
    id: 'business',
    slug: 'business-travel-coordination',
    eyebrow: 'BUSINESS TRAVEL',
    hook: 'Work trips belong\nout of your personal texts.',
    pain: 'Decks in email.\nDinners in iMessage.\nReceipts in Slack.\nRight next to family chats.',
    turn: 'A private workspace\nfor the coworkers going.',
    features: [
      {
        label: 'Contained team chat',
        detail: 'Work stays in the trip. Not iMessage.',
      },
      {
        label: 'Decks + Tasks',
        detail: 'Attachments and per-person prep.',
      },
      {
        label: 'Base Camps + splits',
        detail: 'Venue pinned. Dinners settled.',
      },
    ],
    cta: 'Keep work travel contained',
    ctaSub: 'and the team aligned',
    urlPath: 'chravel.app/use-cases/business',
    clips: [
      'gen-business-01.mp4',
      'gen-business-02.mp4',
      'brand-business.mp4',
      'gen-business-01.mp4',
    ],
    still: 'business.webp',
    phoneLines: [
      'Client Offsite · Denver',
      'Task · Steve · Finalize deck',
      'Base Camp · Client HQ',
    ],
  },
];

export const getScriptById = (id: string): UseCaseScript => {
  const found = USE_CASE_SCRIPTS.find(s => s.id === id);
  if (!found) {
    throw new Error(`Unknown use-case script id: ${id}`);
  }
  return found;
};
