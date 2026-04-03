# Executive Summary
**Overall Risk Level:** HIGH

An extensive security audit of the `chravelapp.com` codebase was conducted targeting the 20 critical security anti-patterns typical of modern AI-generated applications. The core architecture uses React, Vite, and Supabase Edge Functions. While several security layers are correctly implemented (like shared CORS headers, structured authorization layers, and edge-function JWT validation), a few key vulnerabilities remain. We discovered **2 Critical issues**, **3 High issues**, **2 Medium issues**, and **4 Low/Informational issues**.

**Findings by Severity:**
- Critical: 2 (Vulnerable `jspdf` dependency, Wildcard CORS)
- High: 3 (Other vulnerable dependencies, in-memory rate-limiting fallback)
- Medium: 2 (Non-sensitive frontend API keys)
- Low: 4

---

## 2. Critical Issues

### 2.1. Wildcard CORS Configuration on Edge Function
**Location:** `supabase/functions/google-tts/index.ts:5-6`
**Description:** The Google TTS edge function manually configures `Access-Control-Allow-Origin: *` rather than utilizing the shared, strict CORS validator used by the rest of the edge functions (`getCorsHeaders()`).
**Exploit Scenario:** An attacker can host a malicious script on an arbitrary domain. Since the endpoint allowed `*` along with headers, an attacker could silently trigger requests to generate expensive Google TTS audio using the application's backend resources, leading to financial denial-of-service (billing exhaustion) or misuse of the GCP API key.
**Exact Fix:**
*Already applied directly to the codebase during this audit.*
```typescript
<<<<<<< SEARCH
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async req => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
=======
import { getCorsHeaders } from '../_shared/cors.ts';

serve(async req => {
  const corsHeaders = getCorsHeaders(req);

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
>>>>>>> REPLACE
```

### 2.2. Critical Vulnerability in `jspdf` Dependency
**Location:** `package.json` / `package-lock.json`
**Description:** The project relied on an older version of `jspdf` (<=4.2.0) which is vulnerable to PDF Object Injection and HTML Injection (CVEs leading to code execution/XSS inside generated PDFs).
**Exploit Scenario:** An attacker could craft specific inputs (like trip names or notes) that, when rendered into a PDF export by another user, executes malicious HTML or scripts within the context of the victim's PDF viewer/browser.
**Exact Fix:**
*Already applied via `npm audit fix` during this audit.*
Run `npm audit fix` to bump `jspdf` and related packages to secure versions.

---

## 3. High Issues

### 3.1. Vulnerabilities in other npm dependencies
**Location:** `package.json`
**Description:** Several other dependencies showed high severity vulnerabilities in `npm audit`: `happy-dom`, `flatted`, `minimatch`, `tar`.
**Exploit Scenario:** Supply chain and ReDoS attacks. `happy-dom` could interpolate unsanitized export names as executable code during test execution or SSR.
**Exact Fix:**
*Already applied via `npm audit fix` during this audit.*

### 3.2. In-Memory Rate Limiting Fallback
**Location:** `supabase/functions/_shared/rateLimitGuard.ts:78`
**Description:** The rate limiter falls back to an in-memory limit if the DB check fails. Edge functions are distributed and stateless, meaning an in-memory map per-isolate allows an attacker to quickly bypass rate limits by spinning up requests that hit different isolates.
**Exploit Scenario:** An attacker scripts an auth brute-force or AI-spam attack. If they briefly DoS the DB rate limiter (or it times out), the function falls back to in-memory, completely failing to stop a distributed attack.
**Exact Fix:**
Modify the fallback to fail-closed rather than fail-open if strict rate limiting is required.
```typescript
<<<<<<< SEARCH
  // Fallback: in-process rate limiting (not distributed, but better than nothing)
  const isAllowed = applyLocalRateLimit(key, limitWindow, maxRequests);

  if (!isAllowed) {
    return {
=======
  // Strict Rate Limiting: Fail closed if the database cannot verify the limit.
  console.error('[Rate Limit] DB fallback triggered. Failing closed.');
  return {
    isAllowed: false,
    response: new Response(JSON.stringify({ error: 'Rate limit service unavailable' }), {
      status: 429,
      headers: { 'Content-Type': 'application/json' },
    }),
  };
>>>>>>> REPLACE
```

### 3.3. Supabase Auth Session Stored in LocalStorage
**Location:** `src/integrations/supabase/client.ts:60`
**Description:** The `storageKey: 'chravel-auth-session'` stores Supabase JWTs in `localStorage`. This violates Anti-pattern #5.
**Exploit Scenario:** Any successful XSS attack on the frontend will result in the immediate theft of the user's active session token, allowing full account takeover.
**Exact Fix:**
Migrate to using Supabase SSR / cookies (`@supabase/ssr`). Because this is an SPA heavily reliant on client-side JS and Capacitor (native), pure HTTPOnly cookies can be challenging but should be the target architecture for the web build.

---

## 4. Medium Issues

### 4.1. Non-Sensitive API Keys in Frontend Code
**Location:** `src/telemetry/service.ts`, `src/constants/revenuecat.ts`
**Description:** API Keys for PostHog, Sentry, and RevenueCat are exposed in the frontend (`import.meta.env.VITE_POSTHOG_API_KEY`).
**Exploit Scenario:** An attacker can scrape these keys and pollute your analytics or trigger false alerts, increasing Sentry billing.
**Exact Fix:** While standard for SPAs, implementing proxy endpoints for telemetry is the only way to hide these entirely.

### 4.2. esbuild and serialize-javascript vulnerabilities
**Location:** `package-lock.json`
**Description:** Remaining moderate/high vulnerabilities that require a major version bump (`npm audit fix --force`).
**Exact Fix:** Upgrade Vite to v6+ and workbox-build.

---

## 5. Low / Informational Issues

- **Local Storage usage for PII:** `circuitBreaker.ts` and `demoModeStore.ts` utilize localStorage. While mostly flags, storing any non-session state in LS should be audited for PII leakage.
- **Error sanitization tests use 'AIza' strings:** While these are test stubs (`supabase/functions/_shared/__tests__/errorSanitization.test.ts`), storing string patterns that resemble active keys can trip DLP/Secret scanners.
- **Mock Demo State overrides:** `useRoleAssignments` allows a `demo_pro_trip_assignments` LS flag to alter roles.
- **Invite Code stored in LS:** `JoinTrip.tsx` stores invite codes in LS to survive redirects. While not highly critical, it leaves a trace of invites.

---

## 6. Positive Findings

- ✅ **No Hardcoded Secrets**: Scanned for `sk_live`, `sk_test`, `ghp_`, and DB credentials. They are properly abstracted into `.env` and `Deno.env.get`.
- ✅ **Centralized CORS validation**: The edge functions effectively utilize a shared `_shared/cors.ts` module with explicit domain whitelists (`chravel.app`), largely eliminating wildcard usage (minus the one patched TTS endpoint).
- ✅ **DB Parameterization**: Uses Supabase Client ORM (`supabase.from()`), which securely parameterizes inputs via PostgREST, preventing SQL injection.
- ✅ **Server-Side Auth Middleware**: Edge functions properly validate the JWT `req.headers.get('Authorization')` utilizing `supabase.auth.getUser()`. They do not rely on frontend checks.

---

## 7. Recommended Immediate Actions

1. **Deploy the `google-tts` CORS patch.**
2. **Deploy the `package-lock.json` patch to resolve `jspdf` and other critical dependency vulnerabilities.**
3. **Plan migration to `@supabase/ssr`** to eliminate localStorage JWT storage for web clients.
4. **Upgrade Vite** to resolve the remaining `esbuild` development server vulnerability.

---

## 8. Full Security Checklist

| # | Anti-Pattern | Status | Notes |
|---|---|---|---|
| 1 | API keys hardcoded in frontend | **PASS** | Only public/analytics keys (Sentry, Posthog, Maps). Supabase Service Role is kept backend. |
| 2 | Missing rate limiting | **PARTIAL** | implemented DB-backed rate limiting (`rateLimitGuard`), but fallback logic is weak. |
| 3 | SQL built with string concatenation | **PASS** | Supabase SDK handles parameterization. |
| 4 | CORS wildcard / permissive origins | **FAIL (Fixed)** | `google-tts` edge function had `*`. Fixed to use whitelist. |
| 5 | JWTs stored in localStorage | **FAIL** | Supabase client uses `localStorage` for `chravel-auth-session`. |
| 6 | Weak or default JWT secret | **PASS** | Handled securely by Supabase platform. Custom OAuth uses env secret. |
| 7 | Admin routes guarded only in frontend | **PASS** | Edge functions explicitly fetch user context via `supabase.auth.getUser`. |
| 8 | .env file committed to git | **PASS** | `.env.example` contains no sensitive keys. Scanners passing. |
| 9 | Error responses leak traces | **PASS** | `errorSanitization.ts` correctly masks API keys and internal paths. |
| 10 | File uploads lack strict validation | **PARTIAL** | Uses Supabase Storage, but should ensure strict MIME and size limits in bucket policies. |
| 11 | Passwords hashed poorly | **PASS** | Handled by Supabase GoTrue Auth. |
| 12 | Sessions never expire | **PASS** | Supabase JWTs rotate automatically. |
| 13 | Auth middleware missing on APIs | **PASS** | Edge functions show consistent `getUser()` validation prior to privileged ops. |
| 14 | Server running as root | **PASS** | Serverless / Deno isolate model mitigates this. |
| 15 | DB port exposed | **PASS** | Managed by Supabase (pooled/restricted). |
| 16 | IDOR on resource endpoints | **PASS** | RLS (Row Level Security) handles DB access securely. |
| 17 | No strict HTTPS enforcement | **PASS** | Handled by host (Vercel/Cloudflare). Security headers use HSTS. |
| 18 | Sessions not invalidated on logout | **PASS** | Handled by Supabase `auth.signOut()`. |
| 19 | Outdated/vulnerable dependencies | **FAIL (Fixed)** | Fixed `jspdf`, `flatted`, `happy-dom`. |
| 20 | Open redirects | **PASS** | OAuth redirects use hardcoded allowed URIs in Supabase. |
