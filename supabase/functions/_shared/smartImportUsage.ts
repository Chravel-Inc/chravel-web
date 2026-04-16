import { resolveUsagePlanForUser } from './concierge/usagePolicy.ts';

export interface SmartImportUsageAllowed {
  allowed: true;
  remaining: number | null;
  limit: number | null;
  used: number;
}

export interface SmartImportUsageBlocked {
  allowed: false;
  remaining: number;
  limit: number;
  used: number;
  errorCode: 'SMART_IMPORT_LIMIT_REACHED';
  upgradeRequired: true;
}

export type SmartImportUsageResult = SmartImportUsageAllowed | SmartImportUsageBlocked;

const SMART_IMPORT_LIMITS_BY_PLAN: Record<string, number | null> = {
  free: Number(Deno.env.get('SMART_IMPORT_FREE_LIMIT') || 10),
  explorer: Number(Deno.env.get('SMART_IMPORT_EXPLORER_LIMIT') || 50),
  frequent_chraveler: null,
};

function resolveSmartImportLimit(plan: string): number | null {
  const raw = SMART_IMPORT_LIMITS_BY_PLAN[plan] ?? SMART_IMPORT_LIMITS_BY_PLAN.free;
  if (raw === null) return null;
  return raw > 0 ? raw : null;
}

export async function checkAndIncrementSmartImportUsage(
  supabase: any,
  userId: string,
  tripId?: string | null,
): Promise<SmartImportUsageResult> {
  const { usagePlan } = await resolveUsagePlanForUser(supabase, userId);
  const limit = resolveSmartImportLimit(usagePlan);

  if (limit === null) {
    return { allowed: true, remaining: null, limit: null, used: 0 };
  }

  const { data, error } = await supabase.rpc('check_and_increment_smart_import_usage', {
    p_user_id: userId,
    p_trip_id: tripId ?? null,
    p_limit: limit,
  } as Record<string, unknown>);

  if (error) {
    throw new Error(`Smart import usage check failed: ${error.message}`);
  }

  const row = Array.isArray(data) ? data[0] : data;
  const allowed = Boolean(row?.allowed);
  const remaining = typeof row?.remaining === 'number' ? row.remaining : 0;
  const used = typeof row?.used === 'number' ? row.used : 0;

  if (!allowed) {
    return {
      allowed: false,
      remaining,
      limit,
      used,
      errorCode: 'SMART_IMPORT_LIMIT_REACHED',
      upgradeRequired: true,
    };
  }

  return {
    allowed: true,
    remaining,
    limit,
    used,
  };
}
