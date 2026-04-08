

## Build a Public "Delete Account" Page for Google Play Store

Google Play requires a publicly accessible URL where users can request account deletion. Chravel already has full account deletion logic in Settings (with 30-day grace period, re-auth, cancellation). This page needs to be a standalone, unauthenticated informational page that explains the process and links users to the in-app settings.

### What gets built

**New file: `src/pages/DeleteAccountPage.tsx`**
- Public page (no auth required) at `/delete-account`
- Chravel branding, dark theme matching existing legal pages (Privacy, Support, Terms)
- Content:
  - App name "Chravel" prominently displayed
  - Steps to request account deletion (open app → Settings → Account Management → Delete Account)
  - What data gets deleted (profile, trips, messages, media, payment history, AI conversation history)
  - What data is retained and for how long (anonymized analytics retained 90 days, legal/financial records per regulatory requirements)
  - 30-day cancellation window explained
  - Contact email (support@chravel.app) for users who can't access their account
- Back link to home page

**Modified file: `src/App.tsx`**
- Add lazy import for `DeleteAccountPage`
- Add route: `<Route path="/delete-account" ... />`
- Add `/delete-account` to the list of paths excluded from mobile app layout (alongside `/privacy`, `/support`, etc.)

### URL to provide to Google Play

After publishing: `https://chravel.lovable.app/delete-account`

(Or your custom domain: `https://chravel.app/delete-account`)

### Technical details
- Follows exact same pattern as `PrivacyPolicy.tsx` / `SupportPage.tsx` — static content, no auth, dark theme
- No new dependencies
- No backend changes needed — the actual deletion flow already exists via `request_account_deletion` RPC

