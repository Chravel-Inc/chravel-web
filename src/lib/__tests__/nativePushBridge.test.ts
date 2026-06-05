import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  checkNativePushPermissions,
  getPushNotificationsPlugin,
  isNativePushAvailable,
  registerNativePushToken,
  requestNativePushPermissions,
} from '@/lib/nativePushBridge';

describe('nativePushBridge', () => {
  afterEach(() => {
    delete (window as unknown as { Capacitor?: unknown }).Capacitor;
    delete (window as unknown as { ChravelNative?: unknown }).ChravelNative;
  });

  it('isNativePushAvailable is false on plain web', () => {
    expect(isNativePushAvailable()).toBe(false);
    expect(getPushNotificationsPlugin()).toBeNull();
  });

  it('isNativePushAvailable is true when PushNotifications plugin is injected', () => {
    (window as unknown as { Capacitor: { Plugins: Record<string, unknown> } }).Capacitor = {
      Plugins: {
        PushNotifications: {
          checkPermissions: vi.fn(async () => ({ receive: 'prompt' })),
          requestPermissions: vi.fn(async () => ({ receive: 'granted' })),
          register: vi.fn(async () => undefined),
          addListener: vi.fn(),
          removeAllListeners: vi.fn(async () => undefined),
        },
      },
    };

    expect(isNativePushAvailable()).toBe(true);
    expect(getPushNotificationsPlugin()).not.toBeNull();
  });

  it('registerNativePushToken resolves token from registration listener', async () => {
    const register = vi.fn(async () => undefined);
    const addListener = vi.fn(async (event: string, cb: (payload: { value: string }) => void) => {
      if (event === 'registration') {
        cb({ value: 'device-token-123' });
      }
      return { remove: vi.fn(async () => undefined) };
    });

    (window as unknown as { Capacitor: { Plugins: Record<string, unknown> } }).Capacitor = {
      Plugins: {
        PushNotifications: {
          checkPermissions: vi.fn(async () => ({ receive: 'granted' })),
          requestPermissions: vi.fn(async () => ({ receive: 'granted' })),
          register,
          addListener,
          removeAllListeners: vi.fn(async () => undefined),
        },
      },
    };

    await expect(requestNativePushPermissions()).resolves.toBe('granted');
    await expect(checkNativePushPermissions()).resolves.toBe('granted');
    await expect(registerNativePushToken()).resolves.toEqual({ token: 'device-token-123' });
    expect(register).toHaveBeenCalled();
  });
});
