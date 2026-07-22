/**
 * OG Metadata Service
 *
 * Fetches Open Graph metadata (title, description, image) for URLs
 * Used to enhance URL previews in Media > URLs tab
 *
 * @module services/ogMetadataService
 */

import {
  supabase,
  SUPABASE_PROJECT_URL,
  SUPABASE_PUBLIC_API_KEY,
} from '@/integrations/supabase/client';

export interface OGMetadata {
  title?: string;
  description?: string;
  image?: string;
  siteName?: string;
  type?: string;
  url?: string;
  error?: string;
}

/**
 * Fetches OG metadata from a URL via the authenticated edge function.
 */
export async function fetchOGMetadata(url: string): Promise<OGMetadata> {
  try {
    const { data: sessionData } = await supabase.auth.getSession();
    const accessToken = sessionData?.session?.access_token;
    if (!accessToken) {
      return { error: 'Authentication required' };
    }

    const response = await fetch(`${SUPABASE_PROJECT_URL}/functions/v1/fetch-og-metadata`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
        apikey: SUPABASE_PUBLIC_API_KEY,
      },
      body: JSON.stringify({ url }),
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch metadata: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
