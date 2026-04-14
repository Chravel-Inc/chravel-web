

# Fix "Bank-Level Encryption" Claim — Honest Security Copy

## Audit: What We Actually Have

| Layer | What's Real | Evidence |
|-------|------------|---------|
| **TLS in transit** | All Supabase connections use HTTPS/TLS | Standard Supabase infrastructure |
| **Encryption at rest** | Supabase/AWS encrypts PostgreSQL data at rest (AES-256) | Supabase platform guarantee |
| **Row-Level Security** | 756 RLS policies enforce per-user data isolation | `supabase/migrations/` |
| **E2EE (optional)** | AES-GCM 256-bit client-side encryption for High Privacy trip chat | `src/services/privacyService.ts` |
| **Auth + JWT** | Every edge function validates JWT; no unauthenticated mutations | `_shared/requireAuth.ts` |
| **Web Push encryption** | RFC 8291 standard push encryption | `_shared/webPushUtils.ts` |
| **PII redaction** | AI concierge strips emails/phones before sending to Gemini | Privacy policy, `redactPII()` |

## What We Do NOT Have

- No independent SOC 2 Type II certification for Chravel itself (Supabase has one)
- No HSM-backed key management
- E2EE is opt-in (High Privacy trips only), not universal
- "Bank-level" typically implies PCI-DSS compliance, which we don't claim

## Proposed Copy

**Replace in both `FAQSection.tsx` and `PricingSection.tsx`:**

Current:
> "Bank-level encryption. Your trips are private unless you choose to share them."

Proposed:
> "All data is encrypted in transit and at rest. Row-level security ensures you only see trips you belong to. High Privacy mode adds end-to-end encryption for messages. Your trips are private unless you choose to share them."

This is ~30 words vs ~12, but every claim is verifiable. It's specific rather than hand-wavy.

## Files Changed

1. `src/components/landing/sections/FAQSection.tsx` — line 32
2. `src/components/conversion/PricingSection.tsx` — line 242

Two string replacements. No structural changes.

