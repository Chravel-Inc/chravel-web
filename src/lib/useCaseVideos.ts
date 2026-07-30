/**
 * Cinematic use-case reels for /use-cases/:slug pages.
 * Web cuts live in public/videos/use-cases/ (720p vertical, muted H.264 ~1.5–2MB).
 * Social masters stay in Remotion artifacts / out/ — not shipped with the site.
 */

export interface UseCaseVideo {
  /** Public path to the web-optimized mp4 */
  src: string;
  /** Public path to the poster still */
  poster: string;
  /** Accessible label for the player */
  ariaLabel: string;
  /** Short duration hint shown in the UI (e.g. "20 sec") */
  durationLabel: string;
}

const webPaths = (slug: string): Pick<UseCaseVideo, 'src' | 'poster'> => ({
  src: `/videos/use-cases/${slug}.mp4`,
  poster: `/videos/use-cases/${slug}-poster.jpg`,
});

/**
 * Keyed by use-case slug from `USE_CASES`.
 * Only include pages that have a rendered web cut committed under public/videos/use-cases/.
 */
export const USE_CASE_VIDEOS: Record<string, UseCaseVideo> = {
  'travel-concierge-client-portal': {
    ...webPaths('travel-concierge-client-portal'),
    ariaLabel: 'ChravelApp travel concierge use-case reel',
    durationLabel: '20 sec',
  },
  'wedding-guest-coordination-app': {
    ...webPaths('wedding-guest-coordination-app'),
    ariaLabel: 'ChravelApp weddings use-case reel',
    durationLabel: '20 sec',
  },
  'group-travel-planning-app': {
    ...webPaths('group-travel-planning-app'),
    ariaLabel: 'ChravelApp group trips use-case reel',
    durationLabel: '20 sec',
  },
  'family-organization-app': {
    ...webPaths('family-organization-app'),
    ariaLabel: 'ChravelApp families use-case reel',
    durationLabel: '20 sec',
  },
  'sports-team-travel-coordination': {
    ...webPaths('sports-team-travel-coordination'),
    ariaLabel: 'ChravelApp sports teams use-case reel',
    durationLabel: '20 sec',
  },
  'music-tour-coordination': {
    ...webPaths('music-tour-coordination'),
    ariaLabel: 'ChravelApp touring use-case reel',
    durationLabel: '20 sec',
  },
  'conference-event-management-app': {
    ...webPaths('conference-event-management-app'),
    ariaLabel: 'ChravelApp conferences use-case reel',
    durationLabel: '20 sec',
  },
  'local-clubs-meetups': {
    ...webPaths('local-clubs-meetups'),
    ariaLabel: 'ChravelApp local clubs use-case reel',
    durationLabel: '20 sec',
  },
  'church-group-trip-coordination': {
    ...webPaths('church-group-trip-coordination'),
    ariaLabel: 'ChravelApp faith groups use-case reel',
    durationLabel: '20 sec',
  },
  'business-travel-coordination': {
    ...webPaths('business-travel-coordination'),
    ariaLabel: 'ChravelApp business travel use-case reel',
    durationLabel: '20 sec',
  },
};

export const getUseCaseVideo = (slug: string | undefined): UseCaseVideo | undefined =>
  slug ? USE_CASE_VIDEOS[slug] : undefined;
