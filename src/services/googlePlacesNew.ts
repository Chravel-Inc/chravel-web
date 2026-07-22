/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck - Temporary until cache type constraints resolved
/// <reference types="@types/google.maps" />

/**
 * Google Places API (New) 2024 Service
 *
 * Live surface: autocomplete (+ session tokens) for LocationSearchBar.
 * Nearby/text/details/resolve helpers were unused and removed in dead-code batch 3.
 *
 * Documentation: https://developers.google.com/maps/documentation/javascript/place-class
 */

import { Loader } from '@googlemaps/js-api-loader';
import { getGoogleMapsApiKey } from '@/config/maps';
import type { ConvertedPrediction, AutocompleteRequest } from '@/types/places';
import {
  generateCacheKey,
  getCachedPlace,
  setCachedPlace,
  recordApiUsage,
} from './googlePlacesCache';
import { toast } from 'sonner';
import { telemetry } from '@/telemetry/service';

let mapsApi: typeof google.maps | null = null;
let loaderPromise: Promise<typeof google.maps> | null = null;

export type SearchOrigin = { lat: number; lng: number } | null;

/**
 * API Quota Monitor
 * Tracks API usage and provides fallback mechanisms
 */
class ApiQuotaMonitor {
  private dailyRequests: Map<string, number> = new Map();
  private hourlyRequests: Map<string, number> = new Map();
  private cachedResults: Map<string, { data: unknown; timestamp: number }> = new Map();
  private readonly CACHE_TTL = 3600000; // 1 hour cache
  private readonly DAILY_LIMIT = 10000; // Conservative daily limit
  private readonly HOURLY_LIMIT = 1000; // Conservative hourly limit

  /**
   * Check if we're approaching quota limits
   */
  checkQuota(): { canProceed: boolean; reason?: string } {
    const today = new Date().toISOString().split('T')[0];
    const hour = new Date().toISOString().slice(0, 13); // YYYY-MM-DDTHH

    const dailyCount = this.dailyRequests.get(today) || 0;
    const hourlyCount = this.hourlyRequests.get(hour) || 0;

    if (dailyCount >= this.DAILY_LIMIT) {
      return { canProceed: false, reason: 'Daily quota exceeded' };
    }

    if (hourlyCount >= this.HOURLY_LIMIT) {
      return { canProceed: false, reason: 'Hourly quota exceeded' };
    }

    return { canProceed: true };
  }

  /**
   * Record an API request
   */
  recordRequest(): void {
    const today = new Date().toISOString().split('T')[0];
    const hour = new Date().toISOString().slice(0, 13);

    this.dailyRequests.set(today, (this.dailyRequests.get(today) || 0) + 1);
    this.hourlyRequests.set(hour, (this.hourlyRequests.get(hour) || 0) + 1);

    // Clean up old entries (keep last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    for (const [date] of this.dailyRequests) {
      if (date < sevenDaysAgo.toISOString().split('T')[0]) {
        this.dailyRequests.delete(date);
      }
    }
  }

  /**
   * Cache a result with TTL
   */
  cacheResult(key: string, data: unknown): void {
    this.cachedResults.set(key, {
      data,
      timestamp: Date.now(),
    });

    // Clean up expired cache entries
    for (const [cacheKey, value] of this.cachedResults) {
      if (Date.now() - value.timestamp > this.CACHE_TTL) {
        this.cachedResults.delete(cacheKey);
      }
    }
  }

  /**
   * Get cached result if available and not expired
   */
  getCachedResult(key: string): unknown | null {
    const cached = this.cachedResults.get(key);
    if (!cached) return null;

    if (Date.now() - cached.timestamp > this.CACHE_TTL) {
      this.cachedResults.delete(key);
      return null;
    }

    return cached.data;
  }

  /**
   * Generate cache key from query and origin
   */
  generateCacheKey(query: string, origin: SearchOrigin | null): string {
    const originStr = origin ? `${origin.lat},${origin.lng}` : 'no-origin';
    return `query:${query.toLowerCase().trim()}:origin:${originStr}`;
  }

  /**
   * Get quota usage statistics
   */
  getQuotaStats(): { daily: number; hourly: number; dailyLimit: number; hourlyLimit: number } {
    const today = new Date().toISOString().split('T')[0];
    const hour = new Date().toISOString().slice(0, 13);

    return {
      daily: this.dailyRequests.get(today) || 0,
      hourly: this.hourlyRequests.get(hour) || 0,
      dailyLimit: this.DAILY_LIMIT,
      hourlyLimit: this.HOURLY_LIMIT,
    };
  }
}

export const apiQuotaMonitor = new ApiQuotaMonitor();

/**
 * Retry utility with exponential backoff
 * @param operation - The async operation to retry
 * @param maxRetries - Maximum number of retries (default: 2, reduced for faster feedback)
 * @param baseDelay - Base delay in milliseconds (default: 500, reduced for speed)
 */
export async function retryWithBackoff<T>(
  operation: () => Promise<T>,
  maxRetries: number = 2,
  baseDelay: number = 500,
): Promise<T> {
  let lastError: Error;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;

      // Don't retry on quota exhaustion - use cache instead
      if (
        (error as unknown)?.message?.includes('quota') ||
        (error as unknown)?.message?.includes('OVER_QUERY_LIMIT')
      ) {
        throw error;
      }

      if (attempt === maxRetries) {
        break;
      }

      // Exponential backoff with jitter
      const delay = baseDelay * Math.pow(2, attempt) + Math.random() * 1000;
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw lastError!;
}

export async function loadMaps(): Promise<typeof google.maps> {
  if (mapsApi) return mapsApi;

  if (!loaderPromise) {
    const apiKey = getGoogleMapsApiKey();

    if (!apiKey || apiKey === 'placeholder') {
      const errorMsg = 'Google Maps API key is not configured. Check environment settings.';
      console.error('[GooglePlacesNew] ❌ API key missing or placeholder', {
        hasKey: Boolean(apiKey),
        isPlaceholder: apiKey === 'placeholder',
        envCheck: import.meta.env.VITE_GOOGLE_MAPS_API_KEY ? 'present' : 'missing',
      });
      toast.error('Maps API key not configured');
      throw new Error(errorMsg);
    }

    console.info('[GooglePlacesNew] ℹ️ Loading Google Maps API...', {
      apiKeyLength: apiKey.length,
      version: 'weekly',
      libraries: ['places', 'geocoding', 'marker'],
    });

    const loader = new Loader({
      apiKey,
      version: 'weekly',
      libraries: ['places', 'geocoding', 'marker'],
    });

    loaderPromise = loader
      .load()
      .then(google => {
        mapsApi = google.maps;
        console.info('[GooglePlacesNew] ✅ Google Maps API loaded successfully');
        return mapsApi;
      })
      .catch(error => {
        console.error('[GooglePlacesNew] ❌ Failed to load Google Maps API', {
          error: error.message,
          code: error.code,
          stack: import.meta.env.DEV ? error.stack : undefined,
        });

        // More specific error messages
        let userMessage = 'Failed to load Google Maps';
        if (error.message?.includes('ApiNotActivatedMapError')) {
          userMessage = 'Maps API not enabled - check Google Cloud Console';
        } else if (error.message?.includes('RefererNotAllowedMapError')) {
          userMessage = 'Domain not authorized for this API key';
        } else if (error.message?.includes('InvalidKeyMapError')) {
          userMessage = 'Invalid API key';
        }

        toast.error(userMessage);
        loaderPromise = null;
        throw new Error(`Google Maps API failed to load: ${error.message}`);
      });
  }

  return loaderPromise;
}

export async function autocomplete(
  input: string,
  sessionToken: string,
  origin: SearchOrigin,
): Promise<ConvertedPrediction[]> {
  await loadMaps();

  // Check Supabase cache first (30-day TTL)
  const cacheKey = generateCacheKey('autocomplete', input, origin);
  const cached = await getCachedPlace<ConvertedPrediction[]>(cacheKey);
  if (cached) {
    return cached;
  }

  // Check client-side cache (1-hour TTL)
  const clientCacheKey = apiQuotaMonitor.generateCacheKey(`autocomplete:${input}`, origin);
  const clientCached = apiQuotaMonitor.getCachedResult(clientCacheKey);
  if (clientCached) {
    return clientCached;
  }

  // Check quota before making request
  const quotaCheck = apiQuotaMonitor.checkQuota();
  if (!quotaCheck.canProceed) {
    telemetry.track('google_places_quota_blocked', {
      surface: 'autocomplete',
      reason: quotaCheck.reason ?? 'unknown',
    });
    // Return cached results if available (even if expired)
    const expiredCache = apiQuotaMonitor.getCachedResult(clientCacheKey);
    if (expiredCache) {
      return expiredCache;
    }
    // Note: OSM doesn't support autocomplete, so we return empty array
    return [];
  }

  const { AutocompleteSuggestion } = (await google.maps.importLibrary(
    'places',
  )) as google.maps.PlacesLibrary;

  const request: AutocompleteRequest = {
    input,
    sessionToken,
    languageCode: 'en',
  };

  // Add location bias if origin provided
  if (origin) {
    request.locationBias = {
      circle: {
        center: { latitude: origin.lat, longitude: origin.lng },
        radius: 50000,
      },
    };
    request.origin = { latitude: origin.lat, longitude: origin.lng };
  }

  try {
    // Record API request
    apiQuotaMonitor.recordRequest();
    await recordApiUsage('autocomplete');

    // Retry with exponential backoff
    const { suggestions } = await retryWithBackoff(async () => {
      // @ts-ignore - New API method
      return await AutocompleteSuggestion.fetchAutocompleteSuggestions(request);
    });

    if (!suggestions || suggestions.length === 0) {
      return [];
    }

    // Convert to legacy prediction format
    const results = suggestions
      .filter((s: unknown) => s.placePrediction) // Only place predictions
      .map((s: unknown) => ({
        place_id: s.placePrediction.placeId,
        description: s.placePrediction.text.text,
        structured_formatting: s.placePrediction.structuredFormat
          ? {
              main_text: s.placePrediction.structuredFormat.mainText.text,
              secondary_text: s.placePrediction.structuredFormat.secondaryText?.text,
            }
          : undefined,
      }));

    // Cache results (both client-side and Supabase)
    apiQuotaMonitor.cacheResult(clientCacheKey, results);
    await setCachedPlace(cacheKey, 'autocomplete', input, results, undefined, origin);

    return results;
  } catch (error) {
    telemetry.track('google_places_autocomplete_error', {
      message: error instanceof Error ? error.message : 'unknown_error',
    });
    if (import.meta.env.DEV) {
      console.error('[GooglePlacesNew] Autocomplete error:', error);
    }

    // If quota error, try to return cached results
    if (
      (error as unknown)?.message?.includes('quota') ||
      (error as unknown)?.message?.includes('OVER_QUERY_LIMIT')
    ) {
      const expiredCache = apiQuotaMonitor.getCachedResult(clientCacheKey);
      if (expiredCache) {
        return expiredCache;
      }
    }

    // Note: OSM doesn't support autocomplete, so we return empty array
    return [];
  }
}

/**
 * Generate a unique session token for autocomplete billing
 */
export function generateSessionToken(): string {
  return `session_${Date.now()}_${Math.random().toString(36).substring(7)}`;
}
