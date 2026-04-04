import { useQuery } from '@tanstack/react-query';
import { RecommendationService, RecommendationFilters, SponsoredFilters } from '@/services/recommendationService';
import type { Recommendation } from '@/data/recommendations/types';

interface UseRecommendationsOptions {
  city?: string;
  type?: Recommendation['type'] | 'all';
  limit?: number;
  sponsoredRatio?: number;
  location?: string;
  tripType?: string;
}

export const useRecommendations = (options: UseRecommendationsOptions | string = 'all') => {
  // Backwards compatibility for when we pass just the activeFilter string
  const opts: UseRecommendationsOptions = typeof options === 'string' ? { type: options as Recommendation['type'] | 'all' } : options;
  const activeFilter = opts.type;

  const typeFilter = activeFilter === 'all' ? undefined : activeFilter as Recommendation['type'];
  const cityFilter = opts.city;

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['recommendations', activeFilter, cityFilter, opts.location, opts.tripType, opts.limit],
    queryFn: async () => {
      const organicFilters: RecommendationFilters = {
        city: cityFilter,
        type: typeFilter,
        limit: opts.limit,
      };

      const sponsoredFilters: SponsoredFilters = {
        location: opts.location || cityFilter, // Use city as fallback for location targeting
        tripType: opts.tripType,
      };

      try {
        const [organic, sponsored] = await Promise.all([
          RecommendationService.getOrganicItems(organicFilters),
          RecommendationService.getSponsoredItems(sponsoredFilters),
        ]);

        return RecommendationService.blendFeed(organic, sponsored, opts.sponsoredRatio);
      } catch (err) {
        console.error('Failed to fetch recommendations:', err);
        throw err;
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  return {
    recommendations: data || [],
    hasRecommendations: (data?.length ?? 0) > 0,
    isLoading,
    error,
    refetch,
  };
};
