import { afterEach, describe, expect, it, vi } from 'vitest';

const loadModule = async () => import('../voiceFeatureFlags');

describe('AI_VOICE_PROVIDER defaults', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it('defaults to off when env is unset (MVP: no live voice spend)', async () => {
    vi.stubEnv('VITE_AI_VOICE_PROVIDER', undefined);
    const mod = await loadModule();
    expect(mod.AI_VOICE_PROVIDER).toBe('off');
  });

  it('accepts explicit openai override for QA', async () => {
    vi.stubEnv('VITE_AI_VOICE_PROVIDER', 'openai');
    const mod = await loadModule();
    expect(mod.AI_VOICE_PROVIDER).toBe('openai');
  });

  it('LIVE_VOICE_RUNTIME_ENABLED is false when provider is off even if live flag true', async () => {
    vi.stubEnv('VITE_VOICE_LIVE_ENABLED', 'true');
    vi.stubEnv('VITE_AI_VOICE_PROVIDER', 'off');
    const mod = await loadModule();
    expect(mod.LIVE_VOICE_RUNTIME_ENABLED).toBe(false);
  });

  it('LIVE_VOICE_RUNTIME_ENABLED is true only when both live and a provider are on', async () => {
    vi.stubEnv('VITE_VOICE_LIVE_ENABLED', 'true');
    vi.stubEnv('VITE_AI_VOICE_PROVIDER', 'openai');
    const mod = await loadModule();
    expect(mod.LIVE_VOICE_RUNTIME_ENABLED).toBe(true);
  });
});
