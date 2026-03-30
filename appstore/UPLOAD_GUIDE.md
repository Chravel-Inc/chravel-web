# Chravel App Store Screenshot Upload Guide

Upload the polished marketing screenshots to App Store Connect for TestFlight and App Store listing.

## Screenshots Location

Marketing screenshots are in `appstore/screenshots/marketing/iPhone-6.7/`:

| # | File | Headline |
|---|------|----------|
| 1 | `01-plan.png` | PLAN — YOUR NEXT ADVENTURE |
| 2 | `02-chat.png` | CHAT — WITH YOUR GROUP |
| 3 | `03-organize.png` | ORGANIZE — EVERY DETAIL |
| 4 | `04-ask.png` | ASK — YOUR AI TRAVEL GUIDE |
| 5 | `05-split.png` | SPLIT — EXPENSES EFFORTLESSLY |
| 6 | `06-discover.png` | DISCOVER — AMAZING PLACES |
| 7 | `07-share.png` | SHARE — TRIP MEMORIES |
| 8 | `08-decide.png` | DECIDE — TOGETHER |

All screenshots are 1290 × 2796 px (iPhone 6.7" / 15 Pro Max).

---

## Approach A: Fastlane (Automated)

### Prerequisites

1. **Ruby + Bundler** installed
2. **Fastlane** installed:
   ```bash
   cd ios-release
   bundle install
   ```
3. **App-specific password** generated at https://appleid.apple.com
   - Sign in → Security → App-Specific Passwords → Generate

### Environment Variables

Set these before running Fastlane. You can export them or add to a `.env` file in `ios-release/`:

```bash
export APPLE_ID=ops@chravelapp.com
export APPLE_TEAM_ID=2T6WY43H3X
export ITC_TEAM_ID=128616525
export FASTLANE_APPLE_APPLICATION_SPECIFIC_PASSWORD=YOUR_APP_SPECIFIC_PASSWORD
```

### Steps

```bash
# 1. Prepare screenshots into Fastlane-compatible directory structure
python3 appstore/scripts/prepare_fastlane_screenshots.py

# 2. Navigate to Fastlane directory
cd ios-release

# 3. Upload marketing screenshots to App Store Connect
bundle exec fastlane upload_marketing_screenshots

# 4. Verify in App Store Connect (see Approach B for navigation)
```

### Troubleshooting

- **"Could not find app"** — Verify `APPLE_TEAM_ID` and `ITC_TEAM_ID` are correct
- **"Authentication failed"** — Regenerate app-specific password at appleid.apple.com
- **"No screenshots found"** — Run `prepare_fastlane_screenshots.py` first (creates `en-US/` folder)
- **Two-factor auth prompt** — Fastlane will handle this interactively; follow the terminal prompts

---

## Approach B: Manual Upload via App Store Connect

### Step-by-step

1. **Sign in** to [App Store Connect](https://appstoreconnect.apple.com) with `ops@chravelapp.com`

2. **Navigate to your app:**
   - Click **"My Apps"** (or "Apps" in the sidebar)
   - Select **"Chravel"**

3. **Go to App Store version:**
   - In the left sidebar, under **"App Store"**, click on your iOS app version
   - If no version exists yet, click **"+ Version or Platform"** → iOS → enter version number

4. **Find the Screenshots section:**
   - Scroll down to **"iPhone 6.7-inch Display"** (or "App Previews and Screenshots")
   - This is in the **"Media"** section of the version page

5. **Upload screenshots:**
   - Click the **"+"** button or drag-and-drop
   - Select all 8 PNG files from `appstore/screenshots/marketing/iPhone-6.7/`
   - Upload them in order (01 through 08)
   - Apple auto-detects the device size from the 1290×2796 resolution

6. **Save:**
   - Click **"Save"** in the top-right corner
   - Screenshots will be visible in TestFlight for this version

### Important Notes

- Screenshots are managed on the **App Store version page**, NOT on individual TestFlight builds
- Once saved, screenshots appear for all TestFlight builds of that version
- You can reorder screenshots by dragging them
- Apple accepts the 6.7" size and auto-scales for smaller iPhone displays

---

## Regenerating Screenshots

If the app UI changes and you need fresh screenshots:

```bash
# 1. Capture new raw screenshots from the demo site
npm run screenshots:appstore

# 2. Generate new marketing screenshots with device frames and headlines
npm run screenshots:marketing

# 3. Prepare for Fastlane
python3 appstore/scripts/prepare_fastlane_screenshots.py

# 4. Upload
cd ios-release && bundle exec fastlane upload_marketing_screenshots
```

---

## Reference

| Item | Value |
|------|-------|
| Apple ID | `ops@chravelapp.com` |
| Apple Team ID | `2T6WY43H3X` |
| ITC Team ID | `128616525` |
| App Store Connect App ID | `6761122822` |
| Bundle ID | `com.chravel.app` |
| Screenshot dimensions | 1290 × 2796 px |
| Device target | iPhone 6.7" (15 Pro Max) |

### .env (copy-paste ready)

```bash
APPLE_ID=ops@chravelapp.com
APPLE_TEAM_ID=2T6WY43H3X
ITC_TEAM_ID=128616525
FASTLANE_APPLE_APPLICATION_SPECIFIC_PASSWORD=YOUR_APP_SPECIFIC_PASSWORD
```
