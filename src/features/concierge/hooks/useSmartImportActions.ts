import { useCallback, useState } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import type { QueryClient } from '@tanstack/react-query';
import type { ChatMessage } from '@/features/concierge/types';
import type { SmartImportPreviewEvent } from '@/services/conciergeGateway';

interface Params {
  tripId: string;
  userId?: string;
  setMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
  queryClient: QueryClient;
}

export function useSmartImportActions({ tripId, userId, setMessages, queryClient }: Params) {
  const [smartImportStates, setSmartImportStates] = useState<
    Record<string, { isImporting: boolean; result: { imported: number; failed: number } | null }>
  >({});
  const [bulkDeleteStates, setBulkDeleteStates] = useState<
    Record<
      string,
      {
        isImporting: boolean;
        result: { imported: number; failed: number; alreadyMissing?: number } | null;
      }
    >
  >({});

  const handleSmartImportConfirm = useCallback(
    async (messageId: string, events: SmartImportPreviewEvent[]) => {
      if (!tripId || events.length === 0) return;
      setSmartImportStates(prev => ({ ...prev, [messageId]: { isImporting: true, result: null } }));
      try {
        const { calendarService } = await import('@/services/calendarService');
        const createEvents = events.map(evt => ({
          trip_id: tripId,
          title: evt.title,
          start_time: evt.startTime,
          end_time: evt.endTime || undefined,
          location: evt.location || undefined,
          event_category: evt.category || 'other',
          include_in_itinerary: true,
          source_type: 'ai_concierge_import',
          source_data: {
            imported_from: 'concierge_smart_import',
            notes: evt.notes || undefined,
            import_hash: `${tripId}|${evt.title.toLowerCase().trim()}|${evt.startTime}`,
          },
        }));
        const result = await calendarService.bulkCreateEvents(createEvents);
        setSmartImportStates(prev => ({
          ...prev,
          [messageId]: {
            isImporting: false,
            result: { imported: result.imported, failed: result.failed },
          },
        }));
        if (result.imported > 0)
          toast.success(
            `Added ${result.imported} event${result.imported !== 1 ? 's' : ''} to Calendar`,
          );
        if (result.failed > 0)
          toast.error(`${result.failed} event${result.failed !== 1 ? 's' : ''} failed to import`);
      } catch {
        setSmartImportStates(prev => ({
          ...prev,
          [messageId]: { isImporting: false, result: { imported: 0, failed: events.length } },
        }));
        toast.error('Failed to import events. Please try again.');
      }
    },
    [tripId],
  );

  const handleSmartImportDismiss = useCallback(
    (messageId: string) => {
      setMessages(prev =>
        prev.map(m => (m.id === messageId ? { ...m, smartImportPreview: undefined } : m)),
      );
    },
    [setMessages],
  );

  const handleBulkDeleteConfirm = useCallback(
    async (messageId: string, previewToken: string, events: SmartImportPreviewEvent[]) => {
      if (!tripId || events.length === 0) return;
      const selectedEventIds = events.map(e => e.id).filter(Boolean) as string[];
      if (selectedEventIds.length === 0) return;

      setBulkDeleteStates(prev => ({ ...prev, [messageId]: { isImporting: true, result: null } }));
      try {
        const { calendarService } = await import('@/services/calendarService');
        const result = await calendarService.bulkDeleteEvents(selectedEventIds, tripId);
        // intentional: trip_pending_actions not yet in generated types
        (supabase as any)
          .from('trip_pending_actions')
          .update({
            status: 'confirmed',
            resolved_at: new Date().toISOString(),
            resolved_by: userId,
          })
          .eq('id', previewToken)
          .eq('status', 'pending')
          .then(() => {});
        setBulkDeleteStates(prev => ({
          ...prev,
          [messageId]: {
            isImporting: false,
            result: {
              imported: result.deleted,
              failed: result.failed,
              alreadyMissing: result.alreadyMissing,
            },
          },
        }));
        queryClient.invalidateQueries({ queryKey: ['calendarEvents', tripId] });
        if (result.deleted > 0) {
          const extra =
            result.alreadyMissing > 0 ? ` ${result.alreadyMissing} were already gone.` : '';
          toast.success(
            `Removed ${result.deleted} event${result.deleted !== 1 ? 's' : ''} from Calendar.${extra}`,
          );
        }
        if (result.failed > 0)
          toast.error(`${result.failed} event${result.failed !== 1 ? 's' : ''} failed to remove`);
      } catch {
        setBulkDeleteStates(prev => ({
          ...prev,
          [messageId]: { isImporting: false, result: { imported: 0, failed: events.length } },
        }));
        toast.error('Failed to remove events. Please try again.');
      }
    },
    [tripId, userId, queryClient],
  );

  const handleBulkDeleteDismiss = useCallback(
    (messageId: string) => {
      setMessages(prev =>
        prev.map(m => (m.id === messageId ? { ...m, bulkDeletePreview: undefined } : m)),
      );
    },
    [setMessages],
  );

  return {
    smartImportStates,
    bulkDeleteStates,
    handleSmartImportConfirm,
    handleSmartImportDismiss,
    handleBulkDeleteConfirm,
    handleBulkDeleteDismiss,
  };
}
