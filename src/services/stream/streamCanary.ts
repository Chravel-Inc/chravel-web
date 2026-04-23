import { supabase } from '@/integrations/supabase/client';

const STREAM_CANARY_FLAG_KEY = 'stream_changes_canary';
const INTERNAL_EMAIL_DOMAINS = ['chravel.app', 'chravelapp.com', 'meechyourgoals.com'];

export type StreamCanaryIncidentMetric =
  | 'read_channel_denied'
  | 'send_message_failure'
  | 'reconnect_backfill_mismatch'
  | 'mention_notification_failure';

export interface StreamCanaryUser {
  id: string;
  email?: string;
  permissions?: string[];
  proRole?: string;
}

type FeatureFlagRow = {
  enabled: boolean;
  rollout_percentage: number;
};

function simpleHash(value: string): number {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

function isInternalEmail(email?: string): boolean {
  if (!email) return false;
  const domain = email.split('@')[1]?.toLowerCase().trim();
  return Boolean(domain && INTERNAL_EMAIL_DOMAINS.includes(domain));
}

function isTrustedPermission(permission: string): boolean {
  const normalized = permission.toLowerCase();
  return (
    normalized.includes('admin') ||
    normalized.includes('staff') ||
    normalized.includes('moderator') ||
    normalized.includes('trusted')
  );
}

export function isTrustedStreamCanaryUser(user: StreamCanaryUser | null | undefined): boolean {
  if (!user) return false;
  if (isInternalEmail(user.email)) return true;
  if (user.proRole && isTrustedPermission(user.proRole)) return true;
  if (Array.isArray(user.permissions) && user.permissions.some(isTrustedPermission)) return true;
  return false;
}

async function fetchCanaryFlag(): Promise<FeatureFlagRow | null> {
  const { data, error } = await supabase
    .from('feature_flags')
    .select('enabled, rollout_percentage')
    .eq('key', STREAM_CANARY_FLAG_KEY)
    .maybeSingle();

  if (error || !data) return null;
  return data as FeatureFlagRow;
}

export async function isStreamCanaryEnabledForUser(
  user: StreamCanaryUser | null | undefined,
): Promise<boolean> {
  if (!isTrustedStreamCanaryUser(user)) return false;

  const flag = await fetchCanaryFlag();
  if (!flag || !flag.enabled) return false;

  const rollout = Math.max(0, Math.min(100, Number(flag.rollout_percentage ?? 0)));
  if (rollout >= 100) return true;
  if (rollout <= 0) return false;

  const bucket = simpleHash(`${STREAM_CANARY_FLAG_KEY}:${user?.id ?? ''}`) % 100;
  return bucket < rollout;
}

export async function reportStreamCanaryIncident(params: {
  metric: StreamCanaryIncidentMetric;
  tripId?: string;
  context?: Record<string, unknown>;
}): Promise<void> {
  try {
    await supabase.functions.invoke('stream-canary-guard', {
      body: {
        metric: params.metric,
        tripId: params.tripId,
        context: params.context,
      },
    });
  } catch {
    // Best-effort only — incident reporting must not block chat UX.
  }
}
