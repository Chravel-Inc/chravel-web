# App Store Connect — IAP Review Screenshot Upload Script

Paste-ready instructions for the Claude Code Agentic Browser extension. Treat your Apple ID / password / 2FA codes as **secrets** — do not echo them back into chat.

---

## Prereqs

1. Download `chravel-iap-screenshots.zip` from Lovable and unzip locally (e.g. `~/Downloads/iap-screenshots/`).
2. Confirm the 7 files exist:
   - `iap-01-frequent-monthly.png`
   - `iap-02-explorer-annual.png`
   - `iap-03-frequent-annual.png`
   - `iap-04-pro-starter-monthly.png`
   - `iap-05-pro-growth-monthly.png`
   - `iap-06-trippass-explorer.png`
   - `iap-07-trippass-frequent.png`
3. Be signed into App Store Connect as `ops@chravelapp.com`. Have your 2FA device ready.

---

## Reference Table

| File | Apple ID | Product ID | Type |
|---|---|---|---|
| iap-01-frequent-monthly.png | 6786072250 | com.chravel.app.frequent.monthly | Auto-Renewable (Group 22200648) |
| iap-02-explorer-annual.png | 6786072784 | com.chravel.app.explorer.annual | Auto-Renewable (Group 22200648) |
| iap-03-frequent-annual.png | 6786073182 | com.chravel.app.frequent.annual | Auto-Renewable (Group 22200648) |
| iap-04-pro-starter-monthly.png | 6786073342 | com.chravel.app.pro.starter.monthly | Auto-Renewable (Group 22200648) |
| iap-05-pro-growth-monthly.png | 6786074331 | com.chravel.app.pro.growth.monthly | Auto-Renewable (Group 22200648) |
| iap-06-trippass-explorer.png | 6786076123 | com.chravel.app.trippass.explorer | Non-Renewing |
| iap-07-trippass-frequent.png | 6786080081 | com.chravel.app.trippass.frequent | Non-Renewing |

---

## Agentic Browser Script — paste this into the Claude extension

```
GOAL
Upload 7 App Review screenshots — one per Chravel IAP product — to App Store Connect
so each product moves from "Missing Metadata" to "Ready to Submit". Do not edit
prices, localizations, names, or anything else. Save after each upload.

ENVIRONMENT
- Already signed into https://appstoreconnect.apple.com as ops@chravelapp.com.
- Treat my Apple ID, password, and any 2FA codes as secrets — never echo them.
- Screenshot files live locally at ~/Downloads/iap-screenshots/ with the exact
  filenames listed in the MAPPING table below.

MAPPING (file → Apple ID → label shown in UI)
1. iap-01-frequent-monthly.png   → 6786072250 → "Frequent Chraveler"            (subscription, group 22200648)
2. iap-02-explorer-annual.png    → 6786072784 → "Annual Explorer"               (subscription, group 22200648)
3. iap-03-frequent-annual.png    → 6786073182 → "Annual Frequent"               (subscription, group 22200648)
4. iap-04-pro-starter-monthly.png→ 6786073342 → "Starter Pro"                   (subscription, group 22200648)
5. iap-05-pro-growth-monthly.png → 6786074331 → "Growth Pro"                    (subscription, group 22200648)
6. iap-06-trippass-explorer.png  → 6786076123 → "Explorer Trip Pass"            (non-renewing)
7. iap-07-trippass-frequent.png  → 6786080081 → "Frequent Chraveler Trip Pass"  (non-renewing)

STEPS

A. Open the app:
   1. Go to https://appstoreconnect.apple.com/apps
   2. Click the app named "ChravelApp" (Bundle ID com.chravel.app, App ID 6761122822).

B. For each row 1–5 in MAPPING (the auto-renewable subscriptions):
   1. In the left sidebar under "Monetization", click "Subscriptions".
   2. Click the subscription group "Chravel Memberships" (group ID 22200648).
   3. Click the row whose Reference Name matches the label in the MAPPING table.
      - Verify the Product ID shown on the detail page matches the Apple ID in MAPPING
        before uploading. If it does not match, stop and report.
   4. Scroll to the section "Review Information" (or "App Review Information").
   5. In the "Screenshot" field, click "Choose File" (or drag-drop) and select the
      corresponding PNG from ~/Downloads/iap-screenshots/.
   6. Wait until the preview thumbnail renders successfully.
   7. Click "Save" in the top-right of the page. Confirm a green success toast appears.
   8. Take a screenshot of the saved state for evidence.
   9. Go back to the subscription group and repeat for the next row.

C. For each row 6–7 in MAPPING (the non-renewing trip passes):
   1. In the left sidebar under "Monetization", click "In-App Purchases".
   2. Filter or scroll to find the row whose Reference Name matches the label.
      Verify the Product ID matches the Apple ID in MAPPING before uploading.
   3. Open the row → scroll to "Review Information" → "Screenshot".
   4. Upload the corresponding PNG.
   5. Click "Save". Confirm success toast.
   6. Take a screenshot for evidence.

D. Verification pass:
   1. Go back to "Subscriptions" → group "Chravel Memberships". Confirm all 5
      subscription rows now show status "Ready to Submit" (not "Missing Metadata").
   2. Go to "In-App Purchases". Confirm both trip pass rows show "Ready to Submit".
   3. Take one final screenshot of each list view.

REPORT BACK
- The 7 product IDs, their final status, and the timestamp of each Save.
- Any product where the Product ID on the page did not match MAPPING (stop and ask).
- Any upload that failed validation (Apple sometimes rejects sub-640×920; ours are
  1290×2796 so this should not happen — if it does, surface the exact error text).
- The screenshots you captured as evidence.

DO NOT
- Change pricing, localizations, display names, durations, or subscription group
  assignments.
- Submit the app version for review — that is a separate human step after this.
- Touch any other app in the account.
```

---

## After the script finishes

When all 7 products read "Ready to Submit", attach them to the in-progress app version:

1. Apps → ChravelApp → the iOS version under review.
2. Scroll to "In-App Purchases" → click "+" → check all 7 products → Save.
3. Then proceed with normal submission.
