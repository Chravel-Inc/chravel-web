/**
 * Extract a YYYY-MM-DD string using the Date's **local** year/month/day.
 *
 * Unlike `date.toISOString().split('T')[0]`, this avoids shifting the date
 * when the local timezone is behind UTC.
 */
export function formatLocalDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Parse a YYYY-MM-DD string into a local Date object.
 *
 * `new Date("YYYY-MM-DD")` parses as UTC midnight which causes timezone bugs
 * when displayed or modified in the local timezone (often shifting by 1 day).
 */
export function parseLocalDate(dateString: string): Date {
  if (!dateString) return new Date();

  // Try to match YYYY-MM-DD pattern
  const parts = dateString.split('-');
  if (parts.length === 3) {
    const [year, month, day] = parts.map(Number);
    // Month is 0-indexed in Date constructor
    if (!isNaN(year) && !isNaN(month) && !isNaN(day)) {
      return new Date(year, month - 1, day);
    }
  }

  // Try parsing YYYY/MM/DD or others
  const parsed = new Date(dateString);
  // Ensure we don't have Invalid Date
  return isNaN(parsed.getTime()) ? new Date() : parsed;
}
