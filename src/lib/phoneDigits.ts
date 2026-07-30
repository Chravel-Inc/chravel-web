/**
 * Normalize a phone string to digits-only for contact lookup.
 * Keeps a leading country code when present; strips formatting.
 */
export function normalizePhoneDigits(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) return '';
  const hasPlus = trimmed.startsWith('+');
  const digits = trimmed.replace(/\D/g, '');
  if (!digits) return '';
  // Preserve international form when user typed +; otherwise return digits as entered.
  return hasPlus ? digits : digits;
}

/** Last 10 digits — useful for US-style matching when country code is inconsistent. */
export function phoneLast10(digits: string): string {
  if (digits.length <= 10) return digits;
  return digits.slice(-10);
}

export function looksLikePhoneContact(raw: string): boolean {
  const digits = normalizePhoneDigits(raw);
  return digits.length >= 7 && digits.length <= 15;
}

export function looksLikeEmailContact(raw: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(raw.trim());
}
