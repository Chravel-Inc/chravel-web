/**
 * Trip Context Fetcher — Server-side equivalent of _shared/contextBuilder.ts.
 *
 * Fetches trip context from Supabase using the service role key (bypasses RLS).
 * This is safe because the agent only runs for authenticated users — the token
 * edge function validates the user's JWT before issuing a LiveKit token, and
 * the tripId + userId are passed in room metadata (set server-side, not client-controlled).
 *
 * For voice sessions, we always fetch ALL context slices (trip_summary class)
 * since voice queries can't be pre-classified.
 */

import { createClient, type SupabaseClient } from '@supabase/supabase-js';

export interface TripContext {
  tripMetadata: {
    id: string;
    name: string;
    destination: string;
    startDate: string;
    endDate: string;
    type: string;
  } | null;
  places: {
    tripBasecamp?: {
      name: string;
      address: string;
      lat?: number;
      lng?: number;
    };
  };
  userPreferences?: {
    dietary?: string[];
    vibe?: string[];
    accessibility?: string[];
    business?: string[];
    entertainment?: string[];
    budget?: string;
    timePreference?: string;
    travelStyle?: string;
  };
  calendar: Array<{
    id: string;
    title: string;
    startTime: string;
    endTime?: string;
    location?: string;
  }>;
  tasks: Array<{
    id: string;
    content: string;
    assignee?: string;
    dueDate?: string;
    isComplete: boolean;
  }>;
  collaborators: Array<{
    id: string;
    name: string;
    role: string;
  }>;
}

let supabase: SupabaseClient | null = null;

function getSupabase(): SupabaseClient {
  if (!supabase) {
    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) {
      throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
    }
    supabase = createClient(url, key);
  }
  return supabase;
}

/**
 * Fetch trip context for the voice agent. 10s timeout.
 * Returns null if the trip doesn't exist or on error.
 */
export async function fetchTripContext(
  tripId: string,
  userId: string,
): Promise<TripContext | null> {
  const db = getSupabase();

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10_000);

  try {
    // Parallel fetches — same approach as contextBuilder.ts
    const [tripResult, calendarResult, tasksResult, membersResult, placesResult, prefsResult] =
      await Promise.all([
        // Trip metadata
        db
          .from('trips')
          .select('id, name, destination, start_date, end_date, type')
          .eq('id', tripId)
          .single()
          .abortSignal(controller.signal),

        // Calendar events (upcoming 20)
        db
          .from('calendar_events')
          .select('id, title, start_time, end_time, location')
          .eq('trip_id', tripId)
          .gte('start_time', new Date().toISOString())
          .order('start_time', { ascending: true })
          .limit(20)
          .abortSignal(controller.signal),

        // Tasks
        db
          .from('tasks')
          .select('id, content, assignee_id, due_date, is_complete')
          .eq('trip_id', tripId)
          .eq('is_complete', false)
          .order('created_at', { ascending: false })
          .limit(20)
          .abortSignal(controller.signal),

        // Trip members
        db
          .from('trip_members')
          .select('user_id, role, profiles_public!inner(display_name)')
          .eq('trip_id', tripId)
          .abortSignal(controller.signal),

        // Trip basecamp
        db
          .from('trip_basecamps')
          .select('name, address, lat, lng')
          .eq('trip_id', tripId)
          .eq('scope', 'trip')
          .maybeSingle()
          .abortSignal(controller.signal),

        // User preferences
        db
          .from('user_preferences')
          .select(
            'dietary, vibe, accessibility, business, entertainment, budget, time_preference, travel_style',
          )
          .eq('user_id', userId)
          .maybeSingle()
          .abortSignal(controller.signal),
      ]);

    if (tripResult.error || !tripResult.data) {
      console.error('[agent:context] Trip not found:', tripId, tripResult.error?.message);
      return null;
    }

    const trip = tripResult.data;

    return {
      tripMetadata: {
        id: trip.id,
        name: trip.name ?? 'Unknown',
        destination: trip.destination ?? 'Unknown',
        startDate: trip.start_date ?? 'Unknown',
        endDate: trip.end_date ?? 'Unknown',
        type: trip.type ?? 'consumer',
      },
      places: {
        tripBasecamp: placesResult.data
          ? {
              name: placesResult.data.name,
              address: placesResult.data.address,
              lat: placesResult.data.lat,
              lng: placesResult.data.lng,
            }
          : undefined,
      },
      userPreferences: prefsResult.data
        ? {
            dietary: prefsResult.data.dietary,
            vibe: prefsResult.data.vibe,
            accessibility: prefsResult.data.accessibility,
            business: prefsResult.data.business,
            entertainment: prefsResult.data.entertainment,
            budget: prefsResult.data.budget,
            timePreference: prefsResult.data.time_preference,
            travelStyle: prefsResult.data.travel_style,
          }
        : undefined,
      calendar: (calendarResult.data ?? []).map((e: any) => ({
        id: e.id,
        title: e.title,
        startTime: e.start_time,
        endTime: e.end_time,
        location: e.location,
      })),
      tasks: (tasksResult.data ?? []).map((t: any) => ({
        id: t.id,
        content: t.content,
        assignee: t.assignee_id,
        dueDate: t.due_date,
        isComplete: t.is_complete,
      })),
      collaborators: (membersResult.data ?? []).map((m: any) => ({
        id: m.user_id,
        name: (m.profiles_public as any)?.display_name ?? 'Unknown',
        role: m.role ?? 'member',
      })),
    };
  } catch (err) {
    if ((err as Error).name === 'AbortError') {
      console.error('[agent:context] Context fetch timed out for trip:', tripId);
    } else {
      console.error('[agent:context] Context fetch error:', err);
    }
    return null;
  } finally {
    clearTimeout(timeout);
  }
}
