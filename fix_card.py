with open('src/components/RecommendationCard.tsx', 'r') as f:
    text = f.read()

# Make sure we pass campaignId
track_imp_old = """      const trackImpressionAsync = async () => {
        // Use uuid if available (for real DB items) or id as string fallback
        const itemId = recommendation.uuid || String(recommendation.id);
        const itemType = recommendation.isSponsored ? 'sponsored' : 'organic';

        try {
          const id = await RecommendationService.trackImpression({
            itemId,
            itemType,
            userId: user?.id,
            tripId,
            surface,
            position,
          });"""

track_imp_new = """      const trackImpressionAsync = async () => {
        // Use uuid if available (for real DB items) or id as string fallback
        const itemId = recommendation.uuid || String(recommendation.id);
        const itemType = recommendation.isSponsored ? 'sponsored' : 'organic';

        try {
          const id = await RecommendationService.trackImpression({
            itemId,
            itemType,
            userId: user?.id,
            tripId,
            surface,
            position,
            campaignId: recommendation.campaignId,
          });"""

track_click_old = """  const trackClick = async (action: 'view' | 'save' | 'book' | 'external_link' | 'add_to_trip' | 'hide') => {
    if (impressionId) {
      await RecommendationService.trackClick({ impressionId, action });
    } else {
      // In case they clicked before the impression fully fired/returned
      const itemId = recommendation.uuid || String(recommendation.id);
      const itemType = recommendation.isSponsored ? 'sponsored' : 'organic';
      RecommendationService.trackImpression({
        itemId,
        itemType,
        userId: user?.id,
        tripId,
        surface,
        position,
      }).then(id => {
        if (id) RecommendationService.trackClick({ impressionId: id, action });
      });
    }
  };"""

track_click_new = """  const trackClick = async (action: 'view' | 'save' | 'book' | 'external_link' | 'add_to_trip' | 'hide') => {
    if (impressionId) {
      await RecommendationService.trackClick({ impressionId, action, campaignId: recommendation.campaignId });
    } else {
      // In case they clicked before the impression fully fired/returned
      const itemId = recommendation.uuid || String(recommendation.id);
      const itemType = recommendation.isSponsored ? 'sponsored' : 'organic';
      RecommendationService.trackImpression({
        itemId,
        itemType,
        userId: user?.id,
        tripId,
        surface,
        position,
        campaignId: recommendation.campaignId,
      }).then(id => {
        if (id) RecommendationService.trackClick({ impressionId: id, action, campaignId: recommendation.campaignId });
      });
    }
  };"""

text = text.replace(track_imp_old, track_imp_new)
text = text.replace(track_click_old, track_click_new)

with open('src/components/RecommendationCard.tsx', 'w') as f:
    f.write(text)
