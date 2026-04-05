/**
 * Haptic feedback service (web no-op).
 *
 * All methods resolve immediately on web. Native haptics are handled
 * by the separate chravel-mobile Expo app.
 */

class HapticService {
  async light(): Promise<void> {}
  async medium(): Promise<void> {}
  async heavy(): Promise<void> {}
  async success(): Promise<void> {}
  async warning(): Promise<void> {}
  async error(): Promise<void> {}
  async celebration(): Promise<void> {}
  async selectionChanged(): Promise<void> {}
  async vibrate(_duration: number = 300): Promise<void> {}
}

export const hapticService = new HapticService();
