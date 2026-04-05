/**
 * Web-only permission status utilities.
 *
 * Provides browser Permissions API queries for geolocation, camera,
 * and microphone. Native push permissions are not applicable on web.
 */

export type PermissionId = 'notifications' | 'location' | 'microphone' | 'camera';

export type PermissionState =
  | 'granted'
  | 'denied'
  | 'prompt'
  | 'unknown'
  | 'unavailable'
  | 'not_applicable';

export interface PermissionStatus {
  id: PermissionId;
  state: PermissionState;
  canRequest: boolean;
  canOpenSettings: boolean;
  detail?: string;
}

function normalizePermissionState(state: unknown): PermissionState {
  if (state === 'granted') return 'granted';
  if (state === 'denied') return 'denied';
  if (state === 'prompt') return 'prompt';
  return 'unknown';
}

async function queryBrowserPermission(name: string): Promise<PermissionState> {
  const permissions = (navigator as unknown as { permissions?: Permissions }).permissions;
  if (!permissions?.query) return 'unknown';

  try {
    const result = await permissions.query({ name: name as PermissionName });
    return normalizePermissionState(result.state);
  } catch {
    return 'unknown';
  }
}

async function requestGeolocationPermission(): Promise<PermissionState> {
  if (!('geolocation' in navigator)) return 'unavailable';

  return new Promise(resolve => {
    navigator.geolocation.getCurrentPosition(
      () => resolve('granted'),
      (err: GeolocationPositionError) => {
        if (err.code === 1) resolve('denied');
        else resolve('unknown');
      },
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 60000 },
    );
  });
}

async function requestMediaPermission(constraint: 'audio' | 'video'): Promise<PermissionState> {
  const mediaDevices = navigator.mediaDevices;
  if (!mediaDevices?.getUserMedia) return 'unavailable';

  try {
    const stream = await mediaDevices.getUserMedia(
      constraint === 'audio' ? { audio: true } : { video: true },
    );
    stream.getTracks().forEach(track => track.stop());
    return 'granted';
  } catch (error) {
    if (error instanceof DOMException) {
      if (error.name === 'NotAllowedError' || error.name === 'SecurityError') return 'denied';
      if (error.name === 'NotFoundError') return 'unavailable';
    }
    return 'unknown';
  }
}

/**
 * Opens the native app settings screen. Not available on web.
 */
export async function openAppSettings(): Promise<boolean> {
  return false;
}

export async function getPermissionStatus(id: PermissionId): Promise<PermissionStatus> {
  switch (id) {
    case 'notifications': {
      // Web push uses the Notification API, not native push
      if (!('Notification' in window)) {
        return { id, state: 'unavailable', canRequest: false, canOpenSettings: false };
      }
      const perm = Notification.permission;
      const state: PermissionState =
        perm === 'granted' ? 'granted' : perm === 'denied' ? 'denied' : 'prompt';
      return { id, state, canRequest: state === 'prompt', canOpenSettings: false };
    }

    case 'location': {
      const state = await queryBrowserPermission('geolocation');
      return {
        id,
        state,
        canRequest: state === 'prompt' || state === 'unknown',
        canOpenSettings: false,
      };
    }

    case 'camera': {
      const state = await queryBrowserPermission('camera');
      return {
        id,
        state,
        canRequest: state === 'prompt' || state === 'unknown',
        canOpenSettings: false,
      };
    }

    case 'microphone': {
      const state = await queryBrowserPermission('microphone');
      return {
        id,
        state,
        canRequest: state === 'prompt' || state === 'unknown',
        canOpenSettings: false,
      };
    }

    default: {
      const exhaustiveCheck: never = id;
      return { id: exhaustiveCheck, state: 'unknown', canRequest: false, canOpenSettings: false };
    }
  }
}

export async function requestPermission(id: PermissionId): Promise<PermissionState> {
  switch (id) {
    case 'notifications': {
      if (!('Notification' in window)) return 'unavailable';
      const result = await Notification.requestPermission();
      return result === 'granted' ? 'granted' : result === 'denied' ? 'denied' : 'prompt';
    }
    case 'location':
      return requestGeolocationPermission();
    case 'camera':
      return requestMediaPermission('video');
    case 'microphone':
      return requestMediaPermission('audio');
    default: {
      const exhaustiveCheck: never = id;
      return exhaustiveCheck;
    }
  }
}
