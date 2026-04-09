# Technical Due Diligence & Cost Estimation Report: Chravel Platform

**Analyst:** Jules (AI Engineering Agent)
**Date:** April 9, 2026
**Subject:** Build-from-scratch cost estimation for Chravel (Web + Mobile)

---

# Executive Summary
- **Estimated Web Agency Cost:** $585,000
- **Estimated iOS Cost (Native):** $225,000
- **Estimated Android Cost (Native):** $210,000
- **Estimated Total (Native Suite):** **$1,020,000**
- **Estimated Shared-Code Total (Capacitor):** **$655,000**
- **Estimated Actual Cash Spend:** ~$7,500 (thoughtbot) + AI Subscriptions
- **Estimated Savings:** **$640,000+** (relative to shared-code agency build)
- **Key Caveats:** This estimate assumes a mid-market U.S./nearshore agency with a blended rate of **$165/hr**. The complexity of the AI Concierge and Smart Import systems is the primary cost driver.

---

# Codebase Inventory

Based on a forensic scan of the repository, Chravel is not a "wrapper app" or a simple CRUD tool. It is a high-density, feature-complete OS for travel.

- **Total Lines of Code:** ~311,349 (Verified via `cloc`)
- **TypeScript Source:** ~210,000 LOC (Frontend + Edge Functions)
- **Database Complexity:** 337 Migrations, ~210 Tables, heavy use of RLS and Postgres-level logic.
- **Backend Architecture:** 94 Supabase Edge Functions (extremely high density for a startup).
- **Frontend Architecture:** 479+ React components using a strictly enforced design system (shadcn/ui + Tailwind).
- **Test Coverage:** ~97 test files (low coverage % but high structural presence).
- **Documentation:** ~78k lines of Markdown (Architectural audits, engineering manifestos, security reports).

---

# What An Agency Would Actually Be Building

An agency would group the work into these major workstreams:

1.  **Core Product / Trip Management:** The foundational logic for trip CRUD, member roles, invite flows, and multi-tenant trip isolation via RLS.
2.  **Chat / Realtime:** A high-concurrency chat system with role-based channels, threads, reactions, and Supabase Realtime integration.
3.  **AI Concierge / Voice:** [High Complexity] A multi-modal assistant using Gemini Flash/Pro. Includes a 38-tool registry, query classification, and a Gemini Live voice bridge with custom proxy logic.
4.  **Smart Import / Calendar:** [High Complexity] Gmail OAuth integration, PDF/Receipt OCR parsing via AI, and bi-directional Google Calendar sync.
5.  **Payments / Subscriptions:** Dual-path billing (Stripe for Web/Org, RevenueCat for iOS/Android) including expense splitting and per-diem logic.
6.  **Maps / Media / Notifications:** Google Maps integration, distance matrix calculations, shared media albums, and a unified notification gating system (Push/Email/SMS).
7.  **Organizations / Admin / Infra:** B2B seat-based billing, team management, and Supabase infrastructure (94 Edge Functions).
8.  **Mobile Packaging / Store Release:** Capacitor bridge configuration, native plugin integration (Camera, Push, Haptics), and App Store/Play Store CI/CD scripts.

---

# Agency Cost Estimate — Web Platform

Building the web platform + backend from scratch is the bulk of the effort. The depth of the Edge Functions (94) indicates a massive amount of "hidden" business logic.

- **Team:** 1 Lead Engineer, 2 Senior Engineers, 1 Part-time PM, 1 Part-time Designer, 0.5 QA.
- **Duration:** 8 months
- **Hours:** ~3,500 hours
- **Blended Rate:** $165/hr (Mid-tier U.S. or high-end nearshore shop)

| Tier | Estimate | Logic |
| :--- | :--- | :--- |
| **Low** | **$450,000** | Aggressive timeline, minimal "polish" on AI features, standard chat. |
| **Midpoint** | **$585,000** | Full feature set, 90+ Edge Functions, hardened security/RLS. |
| **High** | **$820,000** | Enterprise-grade QA, extensive load testing for voice, deep Gmail integration. |

---

# Agency Cost Estimate — iOS

### Fully Native iOS (Swift/SwiftUI)
If built as a standalone native app, the agency would need to recreate the 479+ components and complex state management in Swift.
- **Low:** $180,000
- **Midpoint:** $225,000
- **High:** $270,000

### Shared-Code / Wrapper Approach (Capacitor)
If the existing touch-optimized React app is used with a Capacitor bridge (the current strategy).
- **Estimated Cost:** **$45,000 – $75,000**

---

# Agency Cost Estimate — Android

### Fully Native Android (Kotlin/Jetpack Compose)
- **Low:** $170,000
- **Midpoint:** $210,000
- **High:** $250,000

### Shared-Code / Wrapper Approach (Capacitor)
- **Estimated Cost:** **$25,000 – $45,000** (Marginal cost over iOS if using Capacitor).

---

# thoughtbot / Wrapper Economics

The spend of roughly **$7,500** with **thoughtbot** for the wrapper and App Store packaging was extremely efficient capital allocation.

1.  **Avoided Native Build Duplication:** By choosing a shared-code wrapper strategy, you avoided approximately **$400k - $500k** in native development costs for a separate iOS and Android codebase.
2.  **Professional Packaging:** The repo contains high-quality mobile assets (e.g., `ios-release/`, `appstore/scripts/`, `fastlane/`) that establish a production-grade release pipeline.
3.  **Efficiency:** An agency usually charges a "Launch Fee" of $20k+ just for store submission and CI/CD setup. Paying thoughtbot $7,500 for this "last mile" work while using AI for the "first 300,000 lines" is a textbook example of high-leverage engineering.

---

# Savings Analysis

- **Estimated Third-Party Cost (Shared-Code Build):** $655,000 ($585k Web + $70k Mobile)
- **Estimated Actual Cash Outlay:** ~$7,500 (thoughtbot) + tool subscriptions
- **Estimated Savings in Dollars:** **~$645,000**
- **Estimated Savings Percentage:** **98.8%**

*Note: If compared to a fully native suite, savings exceed $1,000,000.*

---

# Assumptions and Sensitivity Analysis

- **Agency Rate:** I used **$165/hr** (standard for a high-quality mid-market U.S. agency). A $60/hr offshore agency would be cheaper but would likely struggle with the AI/Voice complexity.
- **Team Mix:** Assumes a lean but professional team (3 devs + support).
- **Timeline:** 8 months is a realistic "scratch to production" timeline for a system of this complexity.
- **Native vs. Shared-code:** The shared-code decision is the single largest cost saver in the mobile strategy.
- **Polish Level:** Assumes 90+ readiness score for all features (as noted in handoff docs).
- **QA Depth:** Assumes automated testing and manual pass for mobile-specific edge cases.

---

# Final Bottom Line

- **Realistic Total Range:** $650,000 – $1,100,000 (depending on native vs. shared)
- **Realistic Midpoint:** **$655,000** (Shared-code strategy)
- **Realistic Savings Range:** **$600,000 – $1,000,000+**
- **thoughtbot Spend Efficiency:** The thoughtbot spend looks **exceptionally efficient**. It provided the professional native "wrapper" required for the App Store, effectively unlocking the value of the 311,000 lines of AI-generated code for native distribution.

---
