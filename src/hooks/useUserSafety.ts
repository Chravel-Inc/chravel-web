import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from './useAuth';
import {
  getBlockedUsers,
  blockUser,
  unblockUser,
  reportContent,
} from '@/services/userSafetyService';
import { toast } from 'sonner';

const BLOCKED_USERS_KEY = ['blockedUsers'] as const;

export function useBlockedUsers() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: blockedUserIds = [], ...query } = useQuery({
    queryKey: BLOCKED_USERS_KEY,
    queryFn: getBlockedUsers,
    enabled: !!user,
    staleTime: 60 * 1000,
    gcTime: 5 * 60 * 1000,
  });

  const blockMutation = useMutation({
    mutationFn: blockUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: BLOCKED_USERS_KEY });
      toast.success('User blocked');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to block user');
    },
  });

  const unblockMutation = useMutation({
    mutationFn: unblockUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: BLOCKED_USERS_KEY });
      toast.success('User unblocked');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to unblock user');
    },
  });

  return {
    blockedUserIds,
    isLoading: query.isLoading,
    blockUser: blockMutation.mutate,
    unblockUser: unblockMutation.mutate,
    isBlocking: blockMutation.isPending,
    isUnblocking: unblockMutation.isPending,
    isUserBlocked: (userId: string) => blockedUserIds.includes(userId),
  };
}

export function useReportContent() {
  const reportMutation = useMutation({
    mutationFn: reportContent,
    onSuccess: () => {
      toast.success('Report submitted. We will review it shortly.');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to submit report');
    },
  });

  return {
    reportContent: reportMutation.mutateAsync,
    isReporting: reportMutation.isPending,
  };
}
