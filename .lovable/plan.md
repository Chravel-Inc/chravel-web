

# Clarify Events FAQ Copy

## Problem
The current FAQ answer "Explorer: up to 50 guests. Frequent Chraveler: up to 100. All Pro tiers: unlimited." reads as if "unlimited" refers to guests, when it actually means unlimited *events*. The max guests per event is 100.

## Proposed Copy

**Current:**
> Yes — bundled into all paid plans. Explorer: up to 50 guests. Frequent Chraveler: up to 100. All Pro tiers: unlimited.

**New:**
> Yes — bundled into all paid plans. Explorer: up to 50 guests per event. Frequent Chraveler: up to 100 guests per event. Pro tiers: unlimited events (up to 100 guests each).

## Files Changed
1. `src/components/landing/sections/FAQSection.tsx` — FAQ answer string
2. `src/components/conversion/PricingSection.tsx` — same FAQ answer if duplicated there

