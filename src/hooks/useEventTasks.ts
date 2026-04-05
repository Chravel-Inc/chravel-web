/**
 * useEventTasks - Fetch and mutate event tasks from Supabase
 * Used by EventTasksTab for Events (event_tasks table)
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useDemoMode } from '@/hooks/useDemoMode';
import { useToast } from '@/hooks/use-toast';

export interface EventTask {
  id: string;
  event_id: string;
  title: string;
  description?: string | null;
  sort_order: number;
  created_by?: string | null;
  created_at?: string | null;
}

interface CreateEventTaskParams {
  title: string;
  description?: string;
  sort_order: number;
}

interface UpdateEventTaskParams {
  title: string;
  description?: string;
  sort_order?: number;
}

export function useEventTasks(eventId: string) {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { isDemoMode } = useDemoMode();
  const { toast } = useToast();

  const { data: tasks = [], isLoading } = useQuery({
    queryKey: ['eventTasks', eventId, isDemoMode],
    queryFn: async (): Promise<EventTask[]> => {
      if (isDemoMode || !eventId) return [];

      const { data, error } = await supabase
        .from('event_tasks')
        .select('*')
        .eq('event_id', eventId)
        .order('sort_order', { ascending: true });

      if (error) throw error;
      return (data || []) as EventTask[];
    },
    enabled: !!eventId && !isDemoMode,
  });

  const createMutation = useMutation({
    mutationFn: async (params: CreateEventTaskParams) => {
      if (!user?.id) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('event_tasks')
        .insert({
          event_id: eventId,
          title: params.title,
          description: params.description || null,
          sort_order: params.sort_order,
          created_by: user.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data as EventTask;
    },
    onMutate: async (params: CreateEventTaskParams) => {
      if (isDemoMode) return;
      await queryClient.cancelQueries({ queryKey: ['eventTasks', eventId, isDemoMode] });
      const prev = queryClient.getQueryData<EventTask[]>(['eventTasks', eventId, isDemoMode]) ?? [];
      const optimisticTask: EventTask = {
        id: `opt-${Date.now()}`,
        event_id: eventId,
        title: params.title,
        description: params.description || null,
        sort_order: params.sort_order,
        created_by: user?.id || null, // user is already available from useAuth() hook at the top of the file
        created_at: new Date().toISOString(),
      };
      // Insert maintaining sort order
      const next = [...prev, optimisticTask].sort((a, b) => a.sort_order - b.sort_order);
      queryClient.setQueryData<EventTask[]>(['eventTasks', eventId, isDemoMode], next);
      return { prev };
    },
    onError: (err: Error, _variables, context) => {
      if (context?.prev) {
        queryClient.setQueryData(['eventTasks', eventId, isDemoMode], context.prev);
      }
      toast({ title: 'Failed to add task', description: err.message, variant: 'destructive' });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['eventTasks', eventId, isDemoMode] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ taskId, params }: { taskId: string; params: UpdateEventTaskParams }) => {
      const { error } = await supabase
        .from('event_tasks')
        .update({
          title: params.title,
          description: params.description ?? null,
          ...(params.sort_order !== undefined && { sort_order: params.sort_order }),
        })
        .eq('id', taskId)
        .eq('event_id', eventId);

      if (error) throw error;
      return { taskId, params };
    },
    onMutate: async ({ taskId, params }) => {
      if (isDemoMode) return;
      await queryClient.cancelQueries({ queryKey: ['eventTasks', eventId, isDemoMode] });
      const prev = queryClient.getQueryData<EventTask[]>(['eventTasks', eventId, isDemoMode]) ?? [];
      const next = prev.map(task =>
        task.id === taskId
          ? {
              ...task,
              title: params.title ?? task.title,
              description: params.description ?? task.description,
              ...(params.sort_order !== undefined && { sort_order: params.sort_order }),
            }
          : task,
      );
      // Re-sort if sort_order changed
      if (params.sort_order !== undefined) {
        next.sort((a, b) => a.sort_order - b.sort_order);
      }
      queryClient.setQueryData<EventTask[]>(['eventTasks', eventId, isDemoMode], next);
      return { prev };
    },
    onError: (err: Error, _variables, context) => {
      if (context?.prev) {
        queryClient.setQueryData(['eventTasks', eventId, isDemoMode], context.prev);
      }
      toast({ title: 'Failed to update task', description: err.message, variant: 'destructive' });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['eventTasks', eventId, isDemoMode] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (taskId: string) => {
      const { error } = await supabase
        .from('event_tasks')
        .delete()
        .eq('id', taskId)
        .eq('event_id', eventId);

      if (error) throw error;
    },
    onMutate: async (taskId: string) => {
      if (isDemoMode) return;
      await queryClient.cancelQueries({ queryKey: ['eventTasks', eventId, isDemoMode] });
      const prev = queryClient.getQueryData<EventTask[]>(['eventTasks', eventId, isDemoMode]) ?? [];
      const next = prev.filter(task => task.id !== taskId);
      queryClient.setQueryData<EventTask[]>(['eventTasks', eventId, isDemoMode], next);
      return { prev };
    },
    onError: (err: Error, _variables, context) => {
      if (context?.prev) {
        queryClient.setQueryData(['eventTasks', eventId, isDemoMode], context.prev);
      }
      toast({ title: 'Failed to remove task', description: err.message, variant: 'destructive' });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['eventTasks', eventId, isDemoMode] });
    },
  });

  const createTask = async (params: CreateEventTaskParams) => {
    return createMutation.mutateAsync(params);
  };

  const updateTask = async (taskId: string, params: UpdateEventTaskParams) => {
    return updateMutation.mutateAsync({ taskId, params });
  };

  const deleteTask = async (taskId: string) => {
    return deleteMutation.mutateAsync(taskId);
  };

  return {
    tasks,
    isLoading,
    createTask,
    updateTask,
    deleteTask,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}
