interface SmartImportPaywallPayload {
  error?: string;
  error_code?: string;
  upgrade_required?: boolean;
  remaining?: number;
}

export function getSmartImportErrorMessage(
  payload: SmartImportPaywallPayload | null | undefined,
  fallback: string,
): string {
  if (payload?.upgrade_required && payload.error_code === 'SMART_IMPORT_LIMIT_REACHED') {
    const remaining = typeof payload.remaining === 'number' ? payload.remaining : 0;
    return `Smart Import monthly limit reached (${remaining} remaining). Upgrade to continue.`;
  }

  return payload?.error || fallback;
}

export function isSmartImportPaywall(
  payload: SmartImportPaywallPayload | null | undefined,
): boolean {
  return Boolean(payload?.upgrade_required && payload?.error_code === 'SMART_IMPORT_LIMIT_REACHED');
}
