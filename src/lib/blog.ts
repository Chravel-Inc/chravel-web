// Blog content registry.
//
// Source of truth for the /blog index and each /blog/:slug post. Posts are data-driven:
// add a `BlogPost` here to publish (then add its path to public/sitemap.xml). Body is a
// list of sections (optional heading + paragraphs + list + one optional inline link) so
// posts stay structured for SEO without raw HTML.

export interface BlogSection {
  heading?: string;
  paragraphs?: string[];
  list?: string[];
  /** Optional in-content internal link rendered after the section text. */
  link?: { label: string; to: string };
}

export interface BlogFaq {
  q: string;
  a: string;
}

export interface BlogCta {
  heading: string;
  subtext: string;
  primaryLabel: string;
  primaryTo: string;
  secondaryLabel?: string;
  secondaryTo?: string;
}

export interface BlogPost {
  slug: string;
  /** SEO <title>. */
  title: string;
  /** Meta description. */
  description: string;
  h1: string;
  /** Short summary for the index card and JSON-LD. */
  excerpt: string;
  /** ISO date, YYYY-MM-DD. */
  datePublished: string;
  dateModified?: string;
  author: string;
  tags?: string[];
  sections: BlogSection[];
  faq?: BlogFaq[];
  /** Internal links surfaced at the end of the post (cluster linking). */
  related: { label: string; to: string }[];
  cta: BlogCta;
}

export const BLOG_PATH = '/blog';
export const BLOG_AUTHOR = 'The Chravel Team';

export const BLOG_POSTS: BlogPost[] = [
  {
    slug: 'travel-concierge-better-client-experience-after-booking',
    title: 'How Travel Concierge Companies Can Deliver a Better Client Experience After Booking',
    description:
      'Travel concierge companies win on the post-booking experience. Learn how to replace scattered WhatsApp threads, PDFs, and Drive folders with one client trip portal — and look more premium after the sale.',
    h1: 'How travel concierge companies can deliver a better client experience after booking',
    excerpt:
      'The booking confirmation is where client expectations peak — and where most concierge teams fall back on scattered WhatsApp threads, PDFs, and Drive folders. Here is how to deliver a premium, organized experience after the client pays.',
    datePublished: '2026-06-21',
    author: BLOG_AUTHOR,
    tags: ['Travel Concierge', 'Client Experience'],
    sections: [
      {
        paragraphs: [
          'For a travel concierge company, the sale is not the finish line — it is the moment a client’s expectations are highest. They just paid a premium for someone to take the logistics off their plate. What happens next, in the days and weeks before they travel, is what they actually remember.',
          'Yet this is exactly where many concierge teams quietly regress. The proposal was polished. The booking was smooth. Then the trip gets delivered through a scramble of WhatsApp messages, forwarded PDFs, a shared Google Drive folder, a long email thread, and a handful of screenshots. The service was premium; the delivery feels improvised.',
        ],
      },
      {
        heading: 'The booking is the start of the experience, not the end',
        paragraphs: [
          'Clients do not buy a concierge service for the booking itself — they can book a hotel on their own. They buy the feeling of being taken care of: not having to chase details, not having to wonder whether something was handled, not having to assemble the trip in their own head. That feeling is created — or broken — in the post-booking window, when the trip is real but has not happened yet.',
          'If a client has to dig through their inbox to find a confirmation, ask which hotel everyone is meeting at, or piece together the day-by-day plan from three different messages, the premium feeling evaporates — even if every booking underneath it is flawless.',
        ],
      },
      {
        heading: 'Where the post-booking experience breaks down',
        paragraphs: ['The failure points are consistent across concierge teams of every size:'],
        list: [
          'Trip details are scattered across email, text, WhatsApp, PDFs, and Drive, so there is no single place to look.',
          'Clients ask the same questions repeatedly — what time, which hotel, what is included — because the answers live in different threads.',
          'Confirmations and vouchers get buried, then re-sent on the day they are needed.',
          'Updates go out five different ways, and someone always misses one.',
          'Every planner on the team delivers a little differently, so quality depends on who is handling the account.',
        ],
      },
      {
        heading: 'What clients actually want after they pay',
        paragraphs: [
          'Strip it back and the post-booking want is simple: one place that holds everything, kept current, that they can open without thinking. They want to see the itinerary, know where to be, have their documents on hand, and trust that if something changes, they will be told — once, clearly.',
          'Delivering that consistently is less about working harder and more about moving the experience out of scattered tools and into one shared, client-ready space.',
        ],
      },
      {
        heading: 'Give every client one trip portal',
        paragraphs: [
          'The most effective change a concierge team can make is to stop sending clients a folder and start giving them a workspace. Create one trip per client or family and preload everything before they ever open it: the itinerary on a shared calendar, flight and hotel confirmations and receipts as attachments, the hotel and key meeting points pinned as base camps, vetted restaurants and activities saved as recommendations, and any pre-trip to-dos assigned as tasks.',
          'When the client joins, they do not see a blank app or an empty inbox — they step into a trip that already feels planned. As plans change, one update reaches everyone instead of being retyped across threads. And because the structure is the same for every trip, the experience stops depending on which planner is on the account.',
        ],
        link: {
          label: 'See how Chravel works as a travel concierge client portal',
          to: '/use-cases/travel-concierge-client-portal',
        },
      },
      {
        heading: 'A simple after-booking workflow',
        paragraphs: [
          'You do not need an operations overhaul to do this — just a repeatable shape for every trip:',
        ],
        list: [
          'Create the trip and add the client or family.',
          'Preload the itinerary on the calendar, or import it from confirmation emails and PDFs.',
          'Upload receipts, vouchers, and reservations so nothing has to be re-sent later.',
          'Pin the hotel and meeting points, and add vetted local recommendations.',
          'Assign any pre-trip tasks — passports, payments, packing notes, arrival details.',
          'Invite the client, then send updates as a single broadcast when something changes.',
        ],
      },
      {
        heading: 'Why this makes you look more premium',
        paragraphs: [
          'A concierge company is selling confidence, and confidence is communicated through how organized the experience feels. A client who opens one tidy trip and sees their flights, hotels, reservations, documents, and reminders in a single place reads that as competence — the same way a smooth check-in or a thoughtful welcome note does.',
          'It also compounds internally. A standard trip shape means less repetitive hand-holding, fewer “where was that confirmation?” messages, and a consistent client experience across your whole team. New planners inherit a system instead of a habit. And after the trip, a shared photo album gives clients a reason to return to the experience — and to you.',
        ],
      },
      {
        heading: 'Getting started',
        paragraphs: [
          'You can deliver this without building a custom app or standing up a white-label portal. Create one client-ready trip, preload the details, and invite the client into a single organized space. The booking got them in the door; the post-booking experience is what earns the next referral.',
        ],
      },
    ],
    faq: [
      {
        q: 'Do I need custom software to give clients a trip portal?',
        a: 'No. You can create a client-ready trip in minutes and preload the itinerary, documents, and recommendations — no custom development or white-label setup required.',
      },
      {
        q: 'How is this different from sending a shared Drive folder?',
        a: 'A folder stores files; a trip portal organizes the whole experience — itinerary, locations, tasks, updates, and documents in one place — and lets you push a single update when plans change.',
      },
      {
        q: 'Can my whole team deliver the same experience?',
        a: 'Yes. A repeatable trip structure with role-based access means every planner delivers a consistent, premium experience instead of improvising per account.',
      },
      {
        q: 'What do clients need to use it?',
        a: 'Just a phone or browser. It runs on the web and as an installable app on iOS and Android, so every client is covered regardless of device.',
      },
    ],
    related: [
      {
        label: 'Chravel for travel concierge companies',
        to: '/use-cases/travel-concierge-client-portal',
      },
      { label: 'All Chravel use cases', to: '/use-cases' },
      { label: 'Chravel for teams', to: '/teams' },
    ],
    cta: {
      heading: 'Deliver a more premium trip after every booking',
      subtext:
        'Create a client-ready trip, preload the details, and invite your client into one organized workspace.',
      primaryLabel: 'Create a client trip',
      primaryTo: '/auth',
      secondaryLabel: 'See Chravel for travel concierge',
      secondaryTo: '/use-cases/travel-concierge-client-portal',
    },
  },
];

const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

/** Format an ISO date (YYYY-MM-DD) deterministically, avoiding timezone drift. */
export const formatBlogDate = (iso: string): string => {
  const [y, m, d] = iso.split('-').map(Number);
  if (!y || !m || !d) return iso;
  return `${MONTHS[m - 1]} ${d}, ${y}`;
};

/** Rough reading time at ~200 words/min over the post's text. */
export const estimateReadingMinutes = (post: BlogPost): number => {
  const words = post.sections.reduce((n, section) => {
    const text = [
      section.heading ?? '',
      ...(section.paragraphs ?? []),
      ...(section.list ?? []),
    ].join(' ');
    return n + text.trim().split(/\s+/).filter(Boolean).length;
  }, 0);
  return Math.max(1, Math.round(words / 200));
};

export const getBlogPost = (slug: string | undefined): BlogPost | undefined =>
  slug ? BLOG_POSTS.find(post => post.slug === slug) : undefined;

/** Posts newest-first for the index. */
export const getSortedBlogPosts = (): BlogPost[] =>
  [...BLOG_POSTS].sort((a, b) => b.datePublished.localeCompare(a.datePublished));
