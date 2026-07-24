import { describe, it, expect } from 'vitest';
import {
  type EnvVarSpec,
  FRONTEND_VARS,
  FEATURE_FLAG_VARS,
  ANALYTICS_VARS,
  MOBILE_VARS,
  REVENUECAT_VARS,
  PAYMENT_VARS,
  ADDITIONAL_VARS,
} from '../validate-env';

// ---------------------------------------------------------------------------
// These tests import the REAL spec arrays from scripts/validate-env.ts so they
// guard the actual CLI, not a copy. (Previously this file re-implemented the
// specs inline and had already drifted — it asserted 5 frontend vars while the
// script had 6, and marked VITE_SUPABASE_ANON_KEY required while the script had
// made it optional behind a combined publishable-or-anon check.) The parsing
// and classification helpers below mirror the script's algorithm to unit-test
// its logic paths; the spec-count/shape assertions are the drift guard.
// ---------------------------------------------------------------------------

// Mirror of the script's .env parsing (loadEnvFile), made pure for testing.
function loadEnvFromContent(
  envContent: string | null,
  envLocalContent: string | null,
  processEnv: Record<string, string | undefined>,
): Record<string, string> {
  const vars: Record<string, string> = {};

  for (const content of [envContent, envLocalContent]) {
    if (content) {
      for (const line of content.split('\n')) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) continue;
        const eqIdx = trimmed.indexOf('=');
        if (eqIdx === -1) continue;
        const key = trimmed.slice(0, eqIdx).trim();
        const value = trimmed
          .slice(eqIdx + 1)
          .trim()
          .replace(/^["']|["']$/g, '');
        if (value) vars[key] = value;
      }
    }
  }

  for (const [key, value] of Object.entries(processEnv)) {
    if (value) vars[key] = value;
  }

  return vars;
}

// Mirror of the script's required/optional/present classification.
function classifyEnvVars(
  env: Record<string, string>,
  allVars: EnvVarSpec[],
): { present: string[]; missing: EnvVarSpec[]; optional: EnvVarSpec[] } {
  const missing: EnvVarSpec[] = [];
  const optional: EnvVarSpec[] = [];
  const present: string[] = [];

  for (const spec of allVars) {
    const value = env[spec.name];
    if (value && value.length > 0) {
      present.push(spec.name);
    } else if (spec.required) {
      missing.push(spec);
    } else {
      optional.push(spec);
    }
  }

  return { present, missing, optional };
}

// Mirror of the script's per-mode var selection (validate()).
function getVarsForMode(isIos: boolean): EnvVarSpec[] {
  let allVars = [
    ...FRONTEND_VARS,
    ...FEATURE_FLAG_VARS,
    ...ANALYTICS_VARS,
    ...PAYMENT_VARS,
    ...ADDITIONAL_VARS,
  ];
  if (isIos) {
    allVars = [...allVars, ...MOBILE_VARS, ...REVENUECAT_VARS];
  }
  return allVars;
}

describe('validate-env', () => {
  describe('EnvVarSpec definitions (real script arrays)', () => {
    it('should have the correct number of FRONTEND_VARS', () => {
      expect(FRONTEND_VARS).toHaveLength(6);
    });

    it('should have required VITE_SUPABASE_URL', () => {
      const spec = FRONTEND_VARS.find(v => v.name === 'VITE_SUPABASE_URL');
      expect(spec).toBeDefined();
      expect(spec?.required).toBe(true);
      expect(spec?.canStubForTestFlight).toBe(false);
    });

    it('should have optional VITE_SUPABASE_ANON_KEY (behind combined publishable-or-anon check)', () => {
      const spec = FRONTEND_VARS.find(v => v.name === 'VITE_SUPABASE_ANON_KEY');
      expect(spec).toBeDefined();
      expect(spec?.required).toBe(false);
    });

    it('should have VITE_SUPABASE_PUBLISHABLE_KEY', () => {
      const spec = FRONTEND_VARS.find(v => v.name === 'VITE_SUPABASE_PUBLISHABLE_KEY');
      expect(spec).toBeDefined();
      expect(spec?.required).toBe(false);
    });

    it('should have required VITE_GOOGLE_MAPS_API_KEY with stub', () => {
      const spec = FRONTEND_VARS.find(v => v.name === 'VITE_GOOGLE_MAPS_API_KEY');
      expect(spec).toBeDefined();
      expect(spec?.required).toBe(true);
      expect(spec?.canStubForTestFlight).toBe(true);
      expect(spec?.stubValue).toBe('STUB_MAPS_KEY');
    });

    it('should have optional VITE_STRIPE_PUBLISHABLE_KEY', () => {
      const spec = FRONTEND_VARS.find(v => v.name === 'VITE_STRIPE_PUBLISHABLE_KEY');
      expect(spec).toBeDefined();
      expect(spec?.required).toBe(false);
    });

    it('should have the correct number of FEATURE_FLAG_VARS', () => {
      expect(FEATURE_FLAG_VARS).toHaveLength(4);
    });

    it('should have the correct number of ANALYTICS_VARS', () => {
      expect(ANALYTICS_VARS).toHaveLength(2);
    });

    it('should have the correct number of MOBILE_VARS', () => {
      expect(MOBILE_VARS).toHaveLength(2);
    });

    it('should have the correct number of REVENUECAT_VARS', () => {
      expect(REVENUECAT_VARS).toHaveLength(3);
    });

    it('should have PAYMENT_VARS and ADDITIONAL_VARS', () => {
      expect(PAYMENT_VARS.length).toBeGreaterThan(0);
      expect(ADDITIONAL_VARS.length).toBeGreaterThan(0);
      expect(PAYMENT_VARS.find(v => v.name === 'VITE_VENMO_CLIENT_ID')).toBeDefined();
      expect(ADDITIONAL_VARS.find(v => v.name === 'VITE_APP_VERSION')).toBeDefined();
    });

    it('should mark all FEATURE_FLAG_VARS as optional', () => {
      for (const spec of FEATURE_FLAG_VARS) {
        expect(spec.required).toBe(false);
      }
    });

    it('should mark all ANALYTICS_VARS as optional', () => {
      for (const spec of ANALYTICS_VARS) {
        expect(spec.required).toBe(false);
      }
    });

    it('should mark all MOBILE_VARS as optional', () => {
      for (const spec of MOBILE_VARS) {
        expect(spec.required).toBe(false);
      }
    });

    it('should mark all REVENUECAT_VARS as optional', () => {
      for (const spec of REVENUECAT_VARS) {
        expect(spec.required).toBe(false);
      }
    });
  });

  describe('loadEnvFromContent', () => {
    it('should parse key=value pairs from .env content', () => {
      const content =
        'VITE_SUPABASE_URL=https://example.supabase.co\nVITE_SUPABASE_ANON_KEY=my-key';
      const result = loadEnvFromContent(content, null, {});
      expect(result.VITE_SUPABASE_URL).toBe('https://example.supabase.co');
      expect(result.VITE_SUPABASE_ANON_KEY).toBe('my-key');
    });

    it('should skip comments', () => {
      const content = '# This is a comment\nVITE_KEY=value';
      const result = loadEnvFromContent(content, null, {});
      expect(result.VITE_KEY).toBe('value');
      expect(Object.keys(result)).toHaveLength(1);
    });

    it('should skip blank lines', () => {
      const content = '\n\nVITE_KEY=value\n\n';
      const result = loadEnvFromContent(content, null, {});
      expect(result.VITE_KEY).toBe('value');
    });

    it('should skip lines without equals sign', () => {
      const content = 'NO_EQUALS_HERE\nVITE_KEY=value';
      const result = loadEnvFromContent(content, null, {});
      expect(result.VITE_KEY).toBe('value');
      expect(Object.keys(result)).toHaveLength(1);
    });

    it('should strip surrounding quotes from values', () => {
      const content = 'KEY_SINGLE=\'single-quoted\'\nKEY_DOUBLE="double-quoted"';
      const result = loadEnvFromContent(content, null, {});
      expect(result.KEY_SINGLE).toBe('single-quoted');
      expect(result.KEY_DOUBLE).toBe('double-quoted');
    });

    it('should ignore empty values', () => {
      const content = 'EMPTY_KEY=\nNON_EMPTY=value';
      const result = loadEnvFromContent(content, null, {});
      expect(result.EMPTY_KEY).toBeUndefined();
      expect(result.NON_EMPTY).toBe('value');
    });

    it('should merge .env and .env.local with .env.local taking priority', () => {
      const envContent = 'KEY_A=from-env\nKEY_B=from-env';
      const envLocalContent = 'KEY_B=from-env-local\nKEY_C=from-env-local';
      const result = loadEnvFromContent(envContent, envLocalContent, {});
      expect(result.KEY_A).toBe('from-env');
      expect(result.KEY_B).toBe('from-env-local');
      expect(result.KEY_C).toBe('from-env-local');
    });

    it('should include process.env values', () => {
      const result = loadEnvFromContent(null, null, { PROCESS_VAR: 'process-value' });
      expect(result.PROCESS_VAR).toBe('process-value');
    });

    it('should let process.env override file values', () => {
      const content = 'SHARED_KEY=file-value';
      const result = loadEnvFromContent(content, null, { SHARED_KEY: 'process-value' });
      expect(result.SHARED_KEY).toBe('process-value');
    });

    it('should handle values with equals signs', () => {
      const content = 'KEY=value=with=equals';
      const result = loadEnvFromContent(content, null, {});
      expect(result.KEY).toBe('value=with=equals');
    });

    it('should handle keys with spaces around them', () => {
      const content = '  KEY_SPACED  =  value  ';
      const result = loadEnvFromContent(content, null, {});
      expect(result.KEY_SPACED).toBe('value');
    });

    it('should return empty object when no content and no env', () => {
      const result = loadEnvFromContent(null, null, {});
      expect(Object.keys(result)).toHaveLength(0);
    });

    it('should skip process.env undefined values', () => {
      const result = loadEnvFromContent(null, null, { UNDEFINED_VAR: undefined });
      expect(result.UNDEFINED_VAR).toBeUndefined();
    });
  });

  describe('classifyEnvVars', () => {
    it('should classify present required vars correctly', () => {
      const env = {
        VITE_SUPABASE_URL: 'https://example.supabase.co',
        VITE_GOOGLE_MAPS_API_KEY: 'maps-key',
      };
      const { present, missing, optional } = classifyEnvVars(env, FRONTEND_VARS);
      expect(present).toContain('VITE_SUPABASE_URL');
      expect(present).toContain('VITE_GOOGLE_MAPS_API_KEY');
      expect(missing).toHaveLength(0);
      expect(optional.length).toBeGreaterThan(0);
    });

    it('should report missing required vars', () => {
      const env: Record<string, string> = {};
      const { missing } = classifyEnvVars(env, FRONTEND_VARS);
      const missingNames = missing.map(m => m.name);
      // Only VITE_SUPABASE_URL and VITE_GOOGLE_MAPS_API_KEY are required:true.
      expect(missingNames).toContain('VITE_SUPABASE_URL');
      expect(missingNames).toContain('VITE_GOOGLE_MAPS_API_KEY');
      expect(missingNames).not.toContain('VITE_SUPABASE_ANON_KEY');
    });

    it('should classify optional vars as optional when missing', () => {
      const env: Record<string, string> = {};
      const { optional } = classifyEnvVars(env, FEATURE_FLAG_VARS);
      expect(optional).toHaveLength(FEATURE_FLAG_VARS.length);
    });

    it('should classify optional vars as present when set', () => {
      const env = {
        VITE_ENABLE_DEMO_MODE: 'true',
        VITE_ENABLE_AI_CONCIERGE: 'true',
        VITE_ENABLE_STRIPE_PAYMENTS: 'false',
        VITE_ENABLE_PUSH_NOTIFICATIONS: 'false',
      };
      const { present, optional } = classifyEnvVars(env, FEATURE_FLAG_VARS);
      expect(present).toHaveLength(4);
      expect(optional).toHaveLength(0);
    });

    it('should handle empty string values as missing', () => {
      const env = { VITE_SUPABASE_URL: '' };
      const { missing } = classifyEnvVars(env, [FRONTEND_VARS[0]]);
      expect(missing).toHaveLength(1);
    });

    it('should handle analytics vars', () => {
      const env = { VITE_SENTRY_DSN: 'https://sentry.io/dsn' };
      const { present, optional } = classifyEnvVars(env, ANALYTICS_VARS);
      expect(present).toContain('VITE_SENTRY_DSN');
      expect(optional.length).toBe(ANALYTICS_VARS.length - 1);
    });
  });

  describe('getVarsForMode', () => {
    it('should return web vars when isIos is false', () => {
      const vars = getVarsForMode(false);
      const names = vars.map(v => v.name);
      expect(names).toContain('VITE_SUPABASE_URL');
      expect(names).not.toContain('IOS_BUNDLE_ID');
      expect(names).not.toContain('VITE_REVENUECAT_ENABLED');
    });

    it('should include iOS vars when isIos is true', () => {
      const vars = getVarsForMode(true);
      const names = vars.map(v => v.name);
      expect(names).toContain('VITE_SUPABASE_URL');
      expect(names).toContain('IOS_BUNDLE_ID');
      expect(names).toContain('IOS_APP_NAME');
      expect(names).toContain('VITE_REVENUECAT_ENABLED');
      expect(names).toContain('VITE_REVENUECAT_IOS_API_KEY');
    });

    it('should have more vars in iOS mode than web mode', () => {
      const webVars = getVarsForMode(false);
      const iosVars = getVarsForMode(true);
      expect(iosVars.length).toBeGreaterThan(webVars.length);
      expect(iosVars.length - webVars.length).toBe(MOBILE_VARS.length + REVENUECAT_VARS.length);
    });
  });

  describe('integration: full validation flow', () => {
    it('should pass when all required vars are present', () => {
      const env = {
        VITE_SUPABASE_URL: 'https://example.supabase.co',
        VITE_GOOGLE_MAPS_API_KEY: 'AIzaSy...',
      };
      const allVars = getVarsForMode(false);
      const { missing } = classifyEnvVars(env, allVars);
      expect(missing).toHaveLength(0);
    });

    it('should fail when required vars are missing (web mode)', () => {
      const env: Record<string, string> = {};
      const allVars = getVarsForMode(false);
      const { missing } = classifyEnvVars(env, allVars);
      // 2 required frontend vars (URL + MAPS); the publishable-or-anon check is
      // enforced separately by the script, not via required:true on a spec.
      expect(missing.length).toBe(2);
    });

    it('should pass for iOS mode with all required vars', () => {
      const env = {
        VITE_SUPABASE_URL: 'https://example.supabase.co',
        VITE_GOOGLE_MAPS_API_KEY: 'AIzaSy...',
      };
      const allVars = getVarsForMode(true);
      const { missing, optional } = classifyEnvVars(env, allVars);
      expect(missing).toHaveLength(0);
      expect(optional.length).toBeGreaterThan(0);
    });

    it('should load from .env file and validate', () => {
      const envContent = [
        'VITE_SUPABASE_URL=https://my-project.supabase.co',
        'VITE_GOOGLE_MAPS_API_KEY=AIzaSyTest123',
        '# Optional ones below',
        'VITE_ENABLE_DEMO_MODE=true',
      ].join('\n');

      const env = loadEnvFromContent(envContent, null, {});
      const allVars = getVarsForMode(false);
      const { present, missing } = classifyEnvVars(env, allVars);

      expect(present).toContain('VITE_SUPABASE_URL');
      expect(present).toContain('VITE_GOOGLE_MAPS_API_KEY');
      expect(present).toContain('VITE_ENABLE_DEMO_MODE');
      expect(missing).toHaveLength(0);
    });

    it('should report partial env with some required vars missing', () => {
      const envContent = 'VITE_SUPABASE_URL=https://example.supabase.co';
      const env = loadEnvFromContent(envContent, null, {});
      const allVars = getVarsForMode(false);
      const { present, missing } = classifyEnvVars(env, allVars);

      expect(present).toContain('VITE_SUPABASE_URL');
      expect(missing.map(m => m.name)).toContain('VITE_GOOGLE_MAPS_API_KEY');
    });
  });

  describe('stub values', () => {
    it('should have stub values for TestFlight-stubbable vars', () => {
      const stubbable = [
        ...FRONTEND_VARS,
        ...FEATURE_FLAG_VARS,
        ...ANALYTICS_VARS,
        ...REVENUECAT_VARS,
      ].filter(v => v.canStubForTestFlight);
      expect(stubbable.length).toBeGreaterThan(0);
      for (const spec of stubbable) {
        expect(spec.stubValue).toBeDefined();
      }
    });

    it('should NOT have stub values for non-stubbable vars', () => {
      const nonStubbable = FRONTEND_VARS.filter(v => !v.canStubForTestFlight);
      expect(nonStubbable.length).toBeGreaterThan(0);
      for (const spec of nonStubbable) {
        expect(spec.stubValue).toBeUndefined();
      }
    });
  });
});
