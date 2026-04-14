import { supabase } from '@/integrations/supabase/client';

export type StreamMembershipFallbackAction = 'add' | 'remove';

export async function syncMembershipViaServerFallback(input: {
  action: StreamMembershipFallbackAction;
  tripId: string;
  userId: string;
}): Promise<void> {
  const { error } = await supabase.functions.invoke('stream-sync-membership', {
    body: input,
  });

  if (error) {
    throw new Error(error.message || 'stream-sync-membership invoke failed');
  }
}
