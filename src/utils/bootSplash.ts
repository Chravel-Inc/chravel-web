/**
 * Static HTML boot overlay (#chravel-boot-splash in index.html) shows branded art
 * before React/CSS loads. Dismiss after first shell paint so installed shells avoid
 * a blank or mismatched frame between native splash and the WebView.
 */
const SPLASH_ID = 'chravel-boot-splash';
const HIDE_CLASS = 'chravel-boot-splash--hide';

export function dismissChravelBootSplash(): void {
  if (typeof document === 'undefined') return;

  const el = document.getElementById(SPLASH_ID);
  if (!el) return;

  el.classList.add(HIDE_CLASS);
  window.setTimeout(() => {
    el.remove();
  }, 280);
}
