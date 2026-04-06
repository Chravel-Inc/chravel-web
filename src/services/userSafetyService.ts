import { supabase } from '@/integrations/supabase/client';

interface ReportContentParams {
  reportedUserId: string;
  tripId?: string;
  messageId?: string;
  reason: 'spam' | 'harassment' | 'inappropriate' | 'other';
  details?: string;
}

export async function getBlockedUsers(): Promise<string[]> {
  const { data, error } = await supabase
    .from('user_blocks' as never)
    .select('blocked_id')
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch blocked users: ${error.message}`);
  }

  return (data as Array<{ blocked_id: string }>).map(row => row.blocked_id);
}

export async function blockUser(blockedId: string): Promise<boolean> {
  const { error } = await supabase.from('user_blocks' as never).insert({
    blocker_id: (await supabase.auth.getUser()).data.user?.id,
    blocked_id: blockedId,
  } as never);

  if (error) {
    if (error.code === '23505') {
      // Already blocked (unique constraint)
      return true;
    }
    throw new Error(`Failed to block user: ${error.message}`);
  }

  return true;
}

export async function unblockUser(blockedId: string): Promise<boolean> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error('Not authenticated');

  const { error } = await supabase
    .from('user_blocks' as never)
    .delete()
    .eq('blocker_id' as never, user.id as never)
    .eq('blocked_id' as never, blockedId as never);

  if (error) {
    throw new Error(`Failed to unblock user: ${error.message}`);
  }

  return true;
}

export async function reportContent(params: ReportContentParams): Promise<boolean> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error('Not authenticated');

  const { error } = await supabase.from('content_reports' as never).insert({
    reporter_id: user.id,
    reported_user_id: params.reportedUserId,
    trip_id: params.tripId || null,
    message_id: params.messageId || null,
    reason: params.reason,
    details: params.details || null,
  } as never);

  if (error) {
    throw new Error(`Failed to submit report: ${error.message}`);
  }

  return true;
}
