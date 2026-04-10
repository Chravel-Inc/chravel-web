import { useState, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { tripKeys } from '@/lib/queryKeys';
import { useAuth } from './useAuth';
import { useDemoMode } from './useDemoMode';
import { demoModeService } from '@/services/demoModeService';
import { toast } from 'sonner';
import { normalizeTripCoverUrl } from '@/utils/tripCoverStorage';

export type CoverDisplayMode = 'cover' | 'contain';

export const useTripCoverPhoto = (
  tripId: string,
  initialPhotoUrl?: string,
  initialDisplayMode: CoverDisplayMode = 'cover',
) => {
  const { user } = useAuth();
  const { isDemoMode } = useDemoMode();
  const queryClient = useQueryClient();
  const [coverPhoto, setCoverPhoto] = useState<string | undefined>(initialPhotoUrl);
  const [coverDisplayMode, setCoverDisplayMode] = useState<CoverDisplayMode>(initialDisplayMode);
  const [isUpdating, setIsUpdating] = useState(false);

  // Keep local state aligned with TanStack Query / parent props (detail key is ['trip', id, userId], not ['trips'])
  useEffect(() => {
    if (isDemoMode) {
      const demoPhoto = demoModeService.getCoverPhoto(tripId);
      setCoverPhoto(demoPhoto ?? initialPhotoUrl);
      setCoverDisplayMode(initialDisplayMode);
      return;
    }
    setCoverPhoto(initialPhotoUrl);
    setCoverDisplayMode(initialDisplayMode);
  }, [isDemoMode, tripId, initialPhotoUrl, initialDisplayMode]);

  const updateCoverPhoto = async (photoUrl: string): Promise<boolean> => {
    // Reject blob URLs from being saved to database (except in demo mode)
    if (photoUrl.startsWith('blob:') && !isDemoMode) {
      console.warn('[useTripCoverPhoto] Rejecting blob URL - not persistable');
      toast.error('Upload in progress, please wait...');
      return false;
    }

    // Reject URLs that don't look like images (prevents webpage URLs being saved)
    if (!isDemoMode) {
      // Use URL hostname check to prevent substring bypass (e.g. evil.com?q=unsplash.com)
      const isKnownHost = (() => {
        try {
          const { hostname } = new URL(photoUrl);
          return (
            hostname === 'unsplash.com' ||
            hostname.endsWith('.unsplash.com') ||
            hostname === 'supabase.co' ||
            hostname.endsWith('.supabase.co')
          );
        } catch {
          return false;
        }
      })();
      const hasImageExt = /\.(jpe?g|png|gif|webp|avif|svg)(\?|$)/i.test(photoUrl);
      if (!isKnownHost && !hasImageExt) {
        console.warn('[useTripCoverPhoto] Rejecting non-image URL:', photoUrl);
        toast.error('Please use a direct image URL');
        return false;
      }
    }

    // Demo mode: update session storage
    if (isDemoMode) {
      setCoverPhoto(photoUrl);
      demoModeService.setCoverPhoto(tripId, photoUrl);
      toast.success('Cover photo updated (demo mode)');
      return true;
    }

    // Authenticated mode: update database
    if (!user) {
      toast.error('Please sign in to update cover photos');
      return false;
    }

    setIsUpdating(true);
    try {
      const normalizedPhotoUrl = normalizeTripCoverUrl(photoUrl) ?? photoUrl;
      // Use .select() to verify the update actually happened
      // RLS policy "Trip creators can update their trips" handles authorization
      const { data, error } = await supabase
        .from('trips')
        .update({ cover_image_url: normalizedPhotoUrl })
        .eq('id', tripId)
        .select('id')
        .maybeSingle();

      if (error) throw error;

      // Check if any row was actually updated
      if (!data) {
        console.error('[useTripCoverPhoto] No rows updated - user may not have permission');
        toast.error("You don't have permission to update this trip's cover photo");
        return false;
      }

      setCoverPhoto(normalizedPhotoUrl);
      queryClient.setQueriesData({ queryKey: tripKeys.detail(tripId) }, old =>
        old && typeof old === 'object' ? { ...old, cover_image_url: normalizedPhotoUrl } : old,
      );
      // Trip list uses ['trips', ...]; trip detail uses ['trip', tripId, userId] — invalidate both
      queryClient.invalidateQueries({ queryKey: tripKeys.all });
      queryClient.invalidateQueries({ queryKey: ['proTrips'] });
      queryClient.invalidateQueries({ queryKey: ['events'] });
      queryClient.invalidateQueries({ queryKey: tripKeys.detail(tripId) });
      toast.success('Cover photo updated');
      return true;
    } catch (error) {
      console.error('Error updating cover photo:', error);
      toast.error('Failed to update cover photo');
      return false;
    } finally {
      setIsUpdating(false);
    }
  };

  const removeCoverPhoto = async (): Promise<boolean> => {
    // Demo mode: remove from session storage
    if (isDemoMode) {
      setCoverPhoto(undefined);
      demoModeService.removeCoverPhoto(tripId);
      toast.success('Cover photo removed (demo mode)');
      return true;
    }

    // Authenticated mode: remove from database
    if (!user) {
      toast.error('Please sign in to remove cover photos');
      return false;
    }

    setIsUpdating(true);
    try {
      // Use .select() to verify the update actually happened
      // RLS policy handles authorization
      const { data, error } = await supabase
        .from('trips')
        .update({ cover_image_url: null })
        .eq('id', tripId)
        .select('id')
        .maybeSingle();

      if (error) throw error;

      // Check if any row was actually updated
      if (!data) {
        console.error('[useTripCoverPhoto] No rows updated - user may not have permission');
        toast.error("You don't have permission to update this trip's cover photo");
        return false;
      }

      // Optional: Delete file from storage if needed
      if (coverPhoto && coverPhoto.includes('/storage/v1/object/public/trip-media/')) {
        const storagePath = coverPhoto
          .split('/storage/v1/object/public/trip-media/')[1]
          ?.split('?')[0];
        if (storagePath) {
          await supabase.storage.from('trip-media').remove([storagePath]);
        }
      }

      setCoverPhoto(undefined);
      queryClient.setQueriesData({ queryKey: tripKeys.detail(tripId) }, old =>
        old && typeof old === 'object' ? { ...old, cover_image_url: null } : old,
      );
      queryClient.invalidateQueries({ queryKey: tripKeys.all });
      queryClient.invalidateQueries({ queryKey: ['proTrips'] });
      queryClient.invalidateQueries({ queryKey: ['events'] });
      queryClient.invalidateQueries({ queryKey: tripKeys.detail(tripId) });
      toast.success('Cover photo removed');
      return true;
    } catch (error) {
      console.error('Error removing cover photo:', error);
      toast.error('Failed to remove cover photo');
      return false;
    } finally {
      setIsUpdating(false);
    }
  };

  const updateCoverDisplayMode = async (mode: CoverDisplayMode): Promise<boolean> => {
    if (isDemoMode) {
      setCoverDisplayMode(mode);
      return true;
    }

    if (!user) {
      toast.error('Please sign in to update cover photo settings');
      return false;
    }

    setIsUpdating(true);
    try {
      const { data, error } = await supabase
        .from('trips')
        .update({ cover_display_mode: mode })
        .eq('id', tripId)
        .select('id')
        .maybeSingle();

      if (error) throw error;
      if (!data) {
        toast.error("You don't have permission to update this trip's cover settings");
        return false;
      }

      setCoverDisplayMode(mode);
      queryClient.setQueriesData({ queryKey: tripKeys.detail(tripId) }, old =>
        old && typeof old === 'object' ? { ...old, cover_display_mode: mode } : old,
      );
      queryClient.invalidateQueries({ queryKey: tripKeys.all });
      queryClient.invalidateQueries({ queryKey: ['proTrips'] });
      queryClient.invalidateQueries({ queryKey: ['events'] });
      queryClient.invalidateQueries({ queryKey: tripKeys.detail(tripId) });
      return true;
    } catch (error) {
      console.error('Error updating cover display mode:', error);
      toast.error('Failed to update cover display mode');
      return false;
    } finally {
      setIsUpdating(false);
    }
  };

  return {
    coverPhoto,
    coverDisplayMode,
    updateCoverPhoto,
    updateCoverDisplayMode,
    removeCoverPhoto,
    isUpdating,
  };
};
