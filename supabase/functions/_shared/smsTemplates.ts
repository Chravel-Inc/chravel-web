/**
 * SMS Message Templates
 *
 * Global format rules:
 * - Prefix with "ChravelApp:" (unified brand prefix)
 * - Keep under ~160 chars when possible
 * - Include trip/event context
 * - Action-driving: encourage opening the app
 * - No sensitive details (exact addresses, full payment amounts in preview)
 */

export const SMS_BRAND_PREFIX = 'ChravelApp:';
export const SMS_APP_BASE_URL = 'https://chravel.app';

export interface SmsTemplateData {
  tripName?: string;
  senderName?: string;
  amount?: number | string;
  count?: number | string;
  currency?: string;
  location?: string;
  eventName?: string;
  eventTime?: string;
  preview?: string;
  taskTitle?: string;
  pollQuestion?: string;
  deepLink?: string;
}

export type SmsCategory =
  | 'basecamp_updates'
  | 'join_requests'
  | 'payments'
  | 'broadcasts'
  | 'calendar_events'
  | 'tasks'
  | 'polls'
  | 'calendar_bulk_import';

export function truncate(text: string, maxLength: number): string {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return `${text.substring(0, Math.max(maxLength - 3, 1))}...`;
}

export function formatTimeForTimezone(
  isoTime: string | undefined,
  timezone: string = 'America/Los_Angeles',
): string {
  if (!isoTime) return 'soon';

  try {
    const date = new Date(isoTime);
    if (Number.isNaN(date.getTime())) {
      return truncate(isoTime, 18);
    }

    return new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    }).format(date);
  } catch {
    return truncate(isoTime, 18);
  }
}

export function generateSmsMessage(category: SmsCategory, data: SmsTemplateData): string {
  const tripName = truncate(data.tripName || 'your trip', 28);
  const senderName = truncate(data.senderName || 'Someone', 20);
  const link = data.deepLink || '';

  let msg: string;

  switch (category) {
    case 'broadcasts': {
      const preview = truncate(data.preview || 'Important update', 50);
      msg = `${SMS_BRAND_PREFIX} Broadcast in ${tripName} from ${senderName}: "${preview}"`;
      break;
    }

    case 'calendar_events': {
      const eventTitle = truncate(data.eventName || 'Upcoming event', 32);
      const atTime = truncate(data.eventTime || 'soon', 20);
      msg = `${SMS_BRAND_PREFIX} Reminder - ${eventTitle} in ${tripName} at ${atTime}.`;
      break;
    }

    case 'payments': {
      const amount = data.amount ?? '0';
      const currency = data.currency || '$';
      const value = typeof amount === 'number' ? amount.toFixed(2).replace(/\.00$/, '') : amount;
      const normalizedCurrency = currency === 'USD' ? '$' : `${currency} `;
      msg = `${SMS_BRAND_PREFIX} Payment - ${senderName} requested ${normalizedCurrency}${value} for ${tripName}.`;
      break;
    }

    case 'tasks': {
      const taskTitle = truncate(data.taskTitle || 'Task', 40);
      msg = `${SMS_BRAND_PREFIX} Task assigned - "${taskTitle}" in ${tripName}.`;
      break;
    }

    case 'polls': {
      const question = truncate(data.pollQuestion || 'New poll', 45);
      msg = `${SMS_BRAND_PREFIX} New poll in ${tripName}: "${question}"`;
      break;
    }

    case 'join_requests': {
      msg = `${SMS_BRAND_PREFIX} Join request - ${senderName} wants to join ${tripName}.`;
      break;
    }

    case 'basecamp_updates': {
      const location = truncate(data.location || 'new location', 45);
      msg = `${SMS_BRAND_PREFIX} Basecamp updated for ${tripName}: ${location}.`;
      break;
    }

    case 'calendar_bulk_import': {
      const count = data.count ?? data.amount ?? '0';
      msg = `${SMS_BRAND_PREFIX} ${count} calendar events added to ${tripName} via Smart Import.`;
      break;
    }

    default:
      msg = `${SMS_BRAND_PREFIX} New update in ${tripName}. Open the app for details.`;
  }

  return link ? `${msg} ${link}` : msg;
}

export function isSmsEligibleCategory(category: string): category is SmsCategory {
  return [
    'basecamp_updates',
    'join_requests',
    'payments',
    'broadcasts',
    'calendar_events',
    'tasks',
    'polls',
    'calendar_bulk_import',
  ].includes(category);
}
