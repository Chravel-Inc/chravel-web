

## Create Public SMS Terms & Consent Page

### Purpose
Twilio toll-free verification requires a publicly accessible URL proving how SMS opt-in consent is collected. This page will serve as that proof.

### What gets built

**New file: `src/pages/SmsTerms.tsx`**
- Matches the existing layout pattern from `TermsOfService.tsx` and `PrivacyPolicy.tsx` (dark background, prose styling, back button)
- Content sections:
  1. **What is Chravel SMS** — transactional trip notifications, not marketing
  2. **How Users Opt In** — paid plan required → Settings > Notifications > Enable SMS toggle → confirmation SMS sent → user replies YES
  3. **Message Categories** — calendar reminders, broadcasts, payments, tasks, polls, join requests, basecamp updates
  4. **Message Frequency** — up to 10 messages per day
  5. **How to Opt Out** — reply STOP, or disable in app Settings
  6. **Data Rates** — standard "Msg & data rates may apply"
  7. **Privacy** — links to `/privacy` and `/terms`
  8. **Contact** — support@chravelapp.com, privacy@chravelapp.com

**Modified file: `src/App.tsx`**
- Add lazy import for `SmsTerms`
- Add `<Route path="/sms-terms" ...>` (public, no auth — placed next to `/terms` route)
- Add `/sms-terms` to the `isPublicRoute` check in `OfflineAwareRoutes`

### After deployment
Use **`https://chravel.lovable.app/sms-terms`** as the "Proof of consent (opt-in) collected" URL in the Twilio toll-free verification form.

### No other files affected
The existing build errors shown are pre-existing and unrelated to this change.

