export type LaunchContext = 'browser' | 'installed_app';

export const NATIVE_APP_CONTEXT_QUERY_PARAM = 'app_context';
export const NATIVE_APP_CONTEXT_QUERY_VALUE = 'native';

const isNativeWebViewLaunch = (): boolean => {
  if (typeof window === 'undefined') return false;

  const params = new URLSearchParams(window.location.search);
  return params.get(NATIVE_APP_CONTEXT_QUERY_PARAM) === NATIVE_APP_CONTEXT_QUERY_VALUE;
};

const isStandalonePwaLaunch = (): boolean => {
  if (typeof window === 'undefined') return false;

  const displayModeStandalone = window.matchMedia?.('(display-mode: standalone)').matches ?? false;
  const iosStandalone =
    (window.navigator as Navigator & { standalone?: boolean }).standalone === true;

  return displayModeStandalone || iosStandalone;
};

export const getLaunchContext = (): LaunchContext => {
  return isNativeWebViewLaunch() || isStandalonePwaLaunch() ? 'installed_app' : 'browser';
};
