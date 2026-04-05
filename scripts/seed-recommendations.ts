import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import { hotelRecommendations } from '../src/data/recommendations/hotels';
import { restaurantRecommendations } from '../src/data/recommendations/restaurants';
import { activityRecommendations } from '../src/data/recommendations/activities';
import { tourRecommendations } from '../src/data/recommendations/tours';
import { experienceRecommendations } from '../src/data/recommendations/experiences';
import { transportationRecommendations } from '../src/data/recommendations/transportation';

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const allRecs = [
  ...hotelRecommendations,
  ...restaurantRecommendations,
  ...activityRecommendations,
  ...tourRecommendations,
  ...experienceRecommendations,
  ...transportationRecommendations,
].filter(rec => !rec.isSponsored); // Only organic ones go here, sponsored are campaigns

async function seed() {
  console.log(`Seeding ${allRecs.length} organic recommendations...`);

  const { data, error } = await supabase
    .from('recommendation_items')
    .insert(
      allRecs.map(rec => ({
        type: rec.type,
        title: rec.title,
        description: rec.description,
        location: rec.location,
        city: rec.city,
        latitude: rec.coordinates?.lat || null,
        longitude: rec.coordinates?.lng || null,
        rating: rec.rating,
        price_level: rec.priceLevel,
        images: rec.images,
        tags: rec.tags,
        external_link: rec.externalLink,
        source: 'curated',
        cta_text: rec.ctaButton?.text || 'View',
        cta_action: rec.ctaButton?.action || 'view',
        is_active: rec.isAvailable !== false,
        metadata: rec.userRecommendations ? { userRecommendations: rec.userRecommendations } : {},
      })),
    )
    .select('id');

  if (error) {
    console.error('Error seeding recommendations:', error);
    process.exit(1);
  } else {
    console.log('Successfully seeded recommendations:', data?.length);
  }
}

seed().catch(err => {
  console.error(err);
  process.exit(1);
});
