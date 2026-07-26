import { supabase } from '@/integrations/supabase/client';

type TripType = 'consumer' | 'pro' | 'event';

/**
 * Delete a trip "for me" - removes user's access to the trip without deleting it for others.
 * This removes the user from trip_members table. The trip itself persists for other members.
 */
export const deleteTripForMe = async (tripId: string, userId: string): Promise<void> => {
  // Check if the user has a membership row before attempting deletion
  const { data: membership, error: membershipError } = await supabase
    .from('trip_members')
    .select('id')
    .eq('trip_id', tripId)
    .eq('user_id', userId)
    .maybeSingle();

  if (membershipError) {
    if (import.meta.env.DEV) console.error('Failed to check trip membership:', membershipError);
    throw membershipError;
  }

  // If no membership exists, nothing to delete - return success
  if (!membership) {
    return;
  }

  // Remove user from trip_members
  const { error: deleteError } = await supabase
    .from('trip_members')
    .delete()
    .eq('trip_id', tripId)
    .eq('user_id', userId);

  if (deleteError) {
    if (import.meta.env.DEV) console.error('Failed to delete trip membership:', deleteError);
    throw deleteError;
  }
};

// Hide a trip (privacy feature - separate from archive)
export const hideTrip = async (tripId: string): Promise<void> => {
  const { error } = await supabase.from('trips').update({ is_hidden: true }).eq('id', tripId);

  if (error) {
    if (import.meta.env.DEV) console.error('Failed to hide trip:', error);
    throw error;
  }
};

// Unhide a trip
export const unhideTrip = async (tripId: string): Promise<void> => {
  const { error } = await supabase.from('trips').update({ is_hidden: false }).eq('id', tripId);

  if (error) {
    if (import.meta.env.DEV) console.error('Failed to unhide trip:', error);
    throw error;
  }
};

// Get hidden trips (only when show_hidden_trips preference is true)
export const getHiddenTrips = async (userId: string) => {
  const { data: hiddenTrips, error } = await supabase
    .from('trips')
    .select('*')
    .eq('is_hidden', true)
    .eq('created_by', userId);

  if (error) {
    if (import.meta.env.DEV) console.error('Failed to get hidden trips:', error);
    return [];
  }

  return hiddenTrips || [];
};

// Archive a trip
export const archiveTrip = async (
  tripId: string,
  _tripType: TripType,
  _userId?: string,
): Promise<void> => {
  const { error } = await supabase.from('trips').update({ is_archived: true }).eq('id', tripId);

  if (error) {
    if (import.meta.env.DEV) console.error('Failed to archive trip:', error);
    throw error;
  }

  // Best-effort storage cleanup — don't block the archive action
  cleanupTripStorage(tripId).catch(cleanupErr => {
    if (import.meta.env.DEV) {
      console.error('Storage cleanup failed for trip:', tripId, cleanupErr);
    }
  });
};

// Restore (unarchive) a trip
export const restoreTrip = async (
  tripId: string,
  _tripType: TripType,
  _userId?: string,
): Promise<void> => {
  const { error } = await supabase.functions.invoke('restore-trip', {
    body: { trip_id: tripId },
  });
  if (error) {
    if (import.meta.env.DEV) console.error('Failed to restore trip:', error);
    const response =
      error.context instanceof Response ? await error.context.json().catch(() => null) : null;
    const errorCode = response?.error || error.message;
    if (errorCode === 'TRIP_LIMIT_REACHED') {
      throw new Error('TRIP_LIMIT_REACHED');
    }
    throw error;
  }
};

// Get all archived trips (excludes hidden trips - they have their own section)
export const getArchivedTrips = async (userId?: string) => {
  const { data: archivedTrips, error } = await supabase
    .from('trips')
    .select('*')
    .eq('is_archived', true)
    .eq('is_hidden', false) // Hidden trips should not appear in archive section
    .eq('created_by', userId || '');

  if (error) {
    if (import.meta.env.DEV) console.error('Failed to get archived trips:', error);
    return {
      consumer: [],
      pro: [],
      events: [],
      total: 0,
    };
  }

  // Separate by trip_type
  const consumer = archivedTrips?.filter(t => t.trip_type === 'consumer') || [];
  const pro = archivedTrips?.filter(t => t.trip_type === 'pro') || [];
  const events = archivedTrips?.filter(t => t.trip_type === 'event') || [];

  return {
    consumer,
    pro,
    events,
    total: archivedTrips?.length || 0,
  };
};

/**
 * Clean up storage objects for an archived trip.
 * Removes files from the trip-media bucket in batches.
 * Safe to call multiple times (idempotent — skips already-deleted files).
 */
export const cleanupTripStorage = async (
  tripId: string,
): Promise<{ deleted: number; errors: number }> => {
  let deleted = 0;
  let errors = 0;

  // Get all media index entries for this trip to find storage paths
  const { data: mediaEntries, error: queryError } = await supabase
    .from('trip_media_index')
    .select('id, metadata')
    .eq('trip_id', tripId);

  if (queryError || !mediaEntries?.length) {
    return { deleted: 0, errors: queryError ? 1 : 0 };
  }

  // Extract upload paths from metadata
  const paths: string[] = [];
  for (const entry of mediaEntries) {
    const meta = entry.metadata as Record<string, unknown> | null;
    if (meta?.upload_path && typeof meta.upload_path === 'string') {
      paths.push(meta.upload_path);
    }
  }

  // Also try the standard path pattern: tripId/subdir/*
  const subdirs = ['images', 'videos', 'files'];
  for (const subdir of subdirs) {
    const { data: files } = await supabase.storage
      .from('trip-media')
      .list(`${tripId}/${subdir}`, { limit: 1000 });

    if (files) {
      for (const file of files) {
        paths.push(`${tripId}/${subdir}/${file.name}`);
      }
    }
  }

  // Delete in batches of 50
  const batchSize = 50;
  for (let i = 0; i < paths.length; i += batchSize) {
    const batch = paths.slice(i, i + batchSize);
    const { error: deleteError } = await supabase.storage.from('trip-media').remove(batch);

    if (deleteError) {
      errors++;
    } else {
      deleted += batch.length;
    }
  }

  // Clean up media index entries
  if (deleted > 0) {
    await supabase.from('trip_media_index').delete().eq('trip_id', tripId);
  }

  return { deleted, errors };
};

export const archiveService = {
  deleteTripForMe,
  hideTrip,
  unhideTrip,
  getHiddenTrips,
  archiveTrip,
  restoreTrip,
  getArchivedTrips,
  cleanupTripStorage,
};
