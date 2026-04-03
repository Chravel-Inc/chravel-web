# Gmail Smart Import — Google Cloud Console Testing Mode Setup

> This guide walks through configuring Google Cloud Console and Supabase secrets so that Gmail Smart Import works in **Testing mode** (up to 100 test users, no CASA security assessment required, no fees).

## Prerequisites

- Access to the Google Cloud Console project used by Chravel
- Access to the Supabase Dashboard for the Chravel project
- A Gmail account to use as a test user

---

## Step 1: Enable Required APIs

1. Go to **Google Cloud Console** > **APIs & Services** > **Enabled APIs & Services**
2. Verify these APIs are enabled (click **+ Enable APIs and Services** if missing):
   - **Gmail API** — required for reading emails
   - **Generative Language API** — required for Gemini AI extraction (likely already enabled for the AI concierge)

---

## Step 2: Configure OAuth Consent Screen

1. Go to **APIs & Services** > **OAuth consent screen**
2. Set the following:

| Field | Value |
|-------|-------|
| **User type** | External |
| **Publishing status** | **Testing** (do NOT publish to production) |
| **App name** | Chravel |
| **User support email** | Your support email |
| **App logo** | Optional |
| **App domain** | `chravel.app` |
| **Authorized domains** | `chravel.app` |
| **Developer contact email** | Your email |

3. Under **Scopes**, add:
   - `https://www.googleapis.com/auth/gmail.readonly` (Restricted scope)
   - `https://www.googleapis.com/auth/userinfo.email` (Sensitive scope)

4. Under **Test users**, add the Gmail addresses of users who will test this feature (up to 100).

> **Important**: Only users explicitly added as test users can complete the OAuth flow. All other users will see "Access blocked" from Google.

---

## Step 3: Create or Verify OAuth 2.0 Client

1. Go to **APIs & Services** > **Credentials**
2. Under **OAuth 2.0 Client IDs**, either create a new client or edit the existing one:

| Field | Value |
|-------|-------|
| **Application type** | Web application |
| **Name** | Chravel Web |
| **Authorized JavaScript origins** | `https://chravel.app` |
| **Authorized redirect URIs** | `https://chravel.app/api/gmail/oauth/callback` |

3. For local development, also add:
   - **Authorized JavaScript origins**: `http://localhost:5173`
   - **Authorized redirect URIs**: `http://localhost:5173/api/gmail/oauth/callback`

4. Copy the **Client ID** and **Client Secret** — you'll need these for Supabase secrets.

> **Critical**: The redirect URI must match **exactly** — including the protocol (`https://`), domain, and path. No trailing slash.

---

## Step 4: Set Supabase Edge Function Secrets

1. Go to **Supabase Dashboard** > **Edge Functions** > **Secrets** (or use `supabase secrets set`)
2. Set the following secrets:

| Secret | Value | How to generate |
|--------|-------|-----------------|
| `GOOGLE_CLIENT_ID` | From Step 3 | Copy from Google Cloud Console |
| `GOOGLE_CLIENT_SECRET` | From Step 3 | Copy from Google Cloud Console |
| `GOOGLE_REDIRECT_URI` | `https://chravel.app/api/gmail/oauth/callback` | Exact match with Google Console |
| `GMAIL_TOKEN_ENCRYPTION_KEY` | 32-byte random, base64-encoded | `openssl rand -base64 32` |
| `OAUTH_STATE_SIGNING_SECRET` | Random string for HMAC signing | `openssl rand -base64 32` |
| `GEMINI_API_KEY` | Your Gemini API key | Likely already set for AI concierge |

> **Security**: `GMAIL_TOKEN_ENCRYPTION_KEY` encrypts Gmail OAuth tokens at rest using AES-GCM-256. `OAUTH_STATE_SIGNING_SECRET` signs the OAuth state parameter to prevent CSRF. Generate both fresh — do not reuse other keys.

---

## Step 5: Verify Database Migrations

These tables must exist in your Supabase project. If any are missing, apply the corresponding migration:

| Table/View | Migration |
|------------|-----------|
| `gmail_accounts` | `20260401000000_smart_import.sql` |
| `gmail_accounts_safe` (view) | `20260401000001_secure_gmail_tokens.sql` |
| `gmail_import_jobs` | `20260401000000_smart_import.sql` |
| `gmail_import_message_logs` | `20260401000000_smart_import.sql` |
| `smart_import_candidates` | `20260401000000_smart_import.sql` |
| `gmail_token_audit_logs` | `20260315000000_gmail_hardening.sql` |

Check via SQL Editor:
```sql
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('gmail_accounts', 'gmail_import_jobs', 'gmail_import_message_logs',
                    'smart_import_candidates', 'gmail_token_audit_logs');
```

---

## Step 6: Verify Edge Function Deployment

Ensure both edge functions are deployed with JWT verification enabled:

- `gmail-auth` — handles OAuth connect/callback/disconnect
- `gmail-import-worker` — scans inbox and extracts reservations via Gemini

Check `supabase/config.toml` has entries for both with `verify_jwt = true`.

---

## Step 7: Test the Flow

### Connect Gmail
1. Open `https://chravel.app/settings` > **Integrations** section
2. Click **Connect Gmail**
3. Google consent screen appears with "Google hasn't verified this app" warning
4. Click **Advanced** > **Go to Chravel (unsafe)** to proceed
5. Approve the `gmail.readonly` scope
6. Redirected back to Chravel — toast: "Successfully connected [your email]"
7. Settings page shows the connected account with green "Connected" badge

### Scan Inbox
1. Navigate to a trip with known dates
2. Open **Smart Import** > select the connected account > **Scan Inbox**
3. Import worker searches Gmail for travel-related emails matching the trip dates
4. Candidates appear for review (flights, hotels, restaurants, events, etc.)

---

## Testing Mode Behavior

| Scenario | What happens |
|----------|-------------|
| Test user clicks "Connect Gmail" | Normal OAuth flow with "unverified app" warning (click through) |
| Non-test user clicks "Connect Gmail" | Google shows "Access blocked: This app's request is invalid" |
| Token expires after 1 hour | Import worker auto-refreshes using the stored refresh token |
| User disconnects Gmail | Tokens are revoked via Google API and deleted from database |
| More than 100 test users needed | Must submit for Google verification (triggers CASA assessment) |

---

## Troubleshooting

### "Access blocked" or "Error 403: access_denied"
- The user's email is not in the **Test users** list on the OAuth consent screen
- Fix: Add their email in Google Cloud Console > OAuth consent screen > Test users

### Redirect fails after Google consent
- The redirect URI in the OAuth client doesn't exactly match `GOOGLE_REDIRECT_URI`
- Check: No trailing slash, correct protocol (`https://`), correct path
- Both the Google Console and the Supabase secret must match exactly

### "Token exchange failed" in edge function logs
- `GOOGLE_CLIENT_SECRET` is wrong or not set
- The authorization code expired (codes are single-use and expire in ~10 minutes)

### "GOOGLE_CLIENT_ID secret is not set" (503 error)
- One or more required secrets are missing in Supabase
- Check all 6 secrets from Step 4 are set

### "Gmail integration tables not found" (503 error)
- Database migrations haven't been applied
- Apply the migrations listed in Step 5

### OAuth works on web but not iOS (Capacitor)
- The current flow uses `window.location.href` for the OAuth redirect, which navigates the WKWebView to Google and back
- For production iOS, consider using `@capacitor/browser` (SFSafariViewController) for a more robust OAuth experience
- This is a known enhancement — the web/PWA flow works correctly

---

## Security Notes

- **Scopes are minimal**: `gmail.readonly` (read-only, no write/delete) + `userinfo.email` (email address only)
- **Tokens encrypted at rest**: AES-GCM-256 encryption before database storage
- **OAuth state signed**: HMAC-SHA256 prevents CSRF/replay attacks
- **PKCE flow**: Proof Key for Code Exchange prevents authorization code interception
- **Frontend never sees tokens**: `gmail_accounts_safe` view excludes token columns; RLS enforced
- **Audit trail**: All connect/disconnect/refresh events logged in `gmail_token_audit_logs`
- **Account cap**: Maximum 5 Gmail accounts per user (enforced server-side)
- **Google's Limited Use Policy**: App only reads emails for travel reservation extraction; no data stored beyond parsed candidates
