import * as React from 'react';

// 1024px to include iPad in mobile view for PWA consistency
const MOBILE_BREAKPOINT = 1024;
const MEDIA_QUERY = `(max-width: ${MOBILE_BREAKPOINT}px)`;

export function useIsMobile(): boolean {
  const [isMobile, setIsMobile] = React.useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return window.matchMedia(MEDIA_QUERY).matches;
    }
    return true;
  });

  React.useEffect(() => {
    const mql = window.matchMedia(MEDIA_QUERY);
    const onChange = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mql.addEventListener('change', onChange);
    setIsMobile(mql.matches);
    return () => mql.removeEventListener('change', onChange);
  }, []);

  return isMobile;
}

/** True for mouse/trackpad UIs; false for most phones — used to avoid Radix Tooltip eating first tap. */
export function usePrefersFinePointer(): boolean {
  const [fine, setFine] = React.useState(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return false;
    return window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  });

  React.useEffect(() => {
    if (typeof window.matchMedia !== 'function') {
      setFine(false);
      return;
    }
    const mq = window.matchMedia('(hover: hover) and (pointer: fine)');
    const onChange = (e: MediaQueryListEvent) => setFine(e.matches);
    mq.addEventListener('change', onChange);
    setFine(mq.matches);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  return fine;
}
