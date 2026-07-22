// Prices derive from billing/config.ts (the single numeric source of truth).
// Do not hardcode dollar amounts in this file.
import { BILLING_PRODUCTS, TRIP_PASS_PRODUCTS } from '@/billing/config';

export interface ConsumerSubscription {
  tier:
    | 'free'
    | 'explorer'
    | 'frequent-chraveler'
    | 'pro-starter'
    | 'pro-growth'
    | 'pro-enterprise';
  status: 'active' | 'trial' | 'expired' | 'cancelled';
  trialEndsAt?: string;
  subscriptionEndsAt?: string;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  storageUsedMB?: number;
  storageQuotaMB?: number;
}

export interface StorageQuota {
  usedMB: number;
  quotaMB: number;
  percentUsed: number;
  isNearLimit: boolean; // 80%+
  isOverLimit: boolean;
}

export interface TripPreferences {
  dietary: string[];
  vibe: string[];
  accessibility: string[];
  business: string[];
  entertainment: string[];
  lifestyle: string[];
  budgetMin: number;
  budgetMax: number;
  budgetUnit: 'experience' | 'day' | 'person' | 'trip';
  timePreference: 'early-riser' | 'night-owl' | 'flexible';
}

export const BUDGET_UNIT_OPTIONS = [
  { value: 'experience', label: 'Per experience' },
  { value: 'day', label: 'Per day' },
  { value: 'person', label: 'Per person' },
  { value: 'trip', label: 'Per trip' },
] as const;

export interface AIRecommendation {
  id: string;
  type: 'restaurant' | 'activity' | 'accommodation' | 'transportation';
  title: string;
  description: string;
  location: string;
  rating?: number;
  priceRange?: string;
  matchedPreferences: string[];
}

export const DIETARY_OPTIONS = [
  'Vegetarian',
  'Vegan',
  'Halal',
  'Kosher',
  'Gluten-free',
  'Dairy-free',
  'Nut-free',
  'Pescatarian',
  'Keto',
  'No restrictions',
];

export const VIBE_OPTIONS = [
  'Chill',
  'Party',
  'Outdoorsy',
  'Family-friendly',
  'Romantic',
  'Adventure',
  'Cultural',
  'Luxury',
  'Budget-friendly',
  'Nightlife',
  'High Energy',
  'Cozy',
  'Date Night',
  'Good for Groups',
];

export const ACCESSIBILITY_OPTIONS = [
  'Differently Abled Accessible',
  'EV Charging Nearby',
  'Pet Friendly',
  'Family Friendly',
  'Women Owned',
  'LGBTQ+ Friendly',
];

export const BUSINESS_OPTIONS = [
  'Business Appropriate',
  'Corporate',
  'Formal',
  'Chains',
  'Franchises',
];

export const ENTERTAINMENT_OPTIONS = [
  'Live Music',
  'Comedy',
  'Theater',
  'Sports',
  'Art',
  'Historic',
  'Shopping',
  'Tourist Attraction',
  'Landmark',
  'Must-See',
];

export const LIFESTYLE_OPTIONS = [
  'After Hours',
  'Late Night',
  'Early Morning Risers',
  'Locally Owned',
  'Black Owned',
  'Cannabis Friendly',
  'Casual',
  'Fine Dining',
  'Healthy Eats',
  'Brunch',
  'Lounges',
  'Outdoors',
  'Physical Adventure',
  'Sightseeing',
  'Volunteering',
  'Night Owls',
  "Farmer's Markets",
];

/**
 * Consumer subscription pricing
 *
 * PRIMARY consumer offering: Trip Passes ($39.99/45d, $74.99/90d)
 * Subscriptions exist for recurring travelers ($9.99/mo, $19.99/mo)
 */
const _explorer = BILLING_PRODUCTS['consumer-explorer'];
const _frequent = BILLING_PRODUCTS['consumer-frequent-chraveler'];
const _annualSavings = (monthly: number, annual: number) => Math.floor(monthly * 12 - annual);
const _annualSavingsPct = (monthly: number, annual: number) =>
  Math.round((1 - annual / (monthly * 12)) * 100);

const _explorerAnnual = _explorer.priceAnnual ?? _explorer.priceMonthly * 12;
const _frequentAnnual = _frequent.priceAnnual ?? _frequent.priceMonthly * 12;

export const CONSUMER_PRICING = {
  explorer: {
    monthly: _explorer.priceMonthly,
    annual: _explorerAnnual,
    tripPass: TRIP_PASS_PRODUCTS['pass-explorer-45'].price,
    tripPassDays: TRIP_PASS_PRODUCTS['pass-explorer-45'].durationDays,
    trips: Infinity,
    aiQueries: 25, // 25 queries per trip
    savings: _annualSavings(_explorer.priceMonthly, _explorerAnnual),
    savingsPercent: _annualSavingsPct(_explorer.priceMonthly, _explorerAnnual),
  },
  'frequent-chraveler': {
    monthly: _frequent.priceMonthly,
    annual: _frequentAnnual,
    tripPass: TRIP_PASS_PRODUCTS['pass-frequent-90'].price,
    tripPassDays: TRIP_PASS_PRODUCTS['pass-frequent-90'].durationDays,
    trips: Infinity,
    aiQueries: Infinity, // Unlimited AI
    proTripsPerMonth: 1,
    proTripSeats: 50,
    savings: _annualSavings(_frequent.priceMonthly, _frequentAnnual),
    savingsPercent: _annualSavingsPct(_frequent.priceMonthly, _frequentAnnual),
  },
} as const;
