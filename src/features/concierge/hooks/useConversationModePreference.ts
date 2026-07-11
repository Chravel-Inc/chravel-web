/**
 * Persists the user's "Conversation Mode" toggle in localStorage so they can
 * disable hands-free voice without flipping the server-side feature flag.
 * Defaults to enabled when the feature flag allows it.
 */
import { useCallback, useEffect, useState } from 'react';

const STORAGE_KEY = 'chravel.concierge.conversationMode';

function readInitial(): boolean {
  if (typeof window === 'undefined') return true;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw === null) return true;
    return raw === '1' || raw === 'true';
  } catch {
    return true;
  }
}

export function useConversationModePreference() {
  const [enabled, setEnabledState] = useState<boolean>(readInitial);

  const setEnabled = useCallback((next: boolean) => {
    setEnabledState(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, next ? '1' : '0');
    } catch {
      /* ignore */
    }
  }, []);

  // Cross-tab sync
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key !== STORAGE_KEY || e.newValue === null) return;
      setEnabledState(e.newValue === '1' || e.newValue === 'true');
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  return { enabled, setEnabled };
}
