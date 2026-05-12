# Welcome to your Lovable project

## Project info

**URL**: https://lovable.dev/projects/20feaa04-0946-4c68-a68d-0eb88cc1b9c4

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/20feaa04-0946-4c68-a68d-0eb88cc1b9c4) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Set up environment variables
cp .env.example .env
# Edit .env and add your API keys (see Environment Configuration section below)

# Step 5: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS
- Native shell: Expo WebView + EAS Build (lives in the separate `chravel-mobile` repo, not this codebase)
- Supabase (backend)

## Mobile App Development

Chravel ships as web + PWA from this repo, and as a native iOS/Android
app via a separate **`chravel-mobile`** repository (Expo + EAS Build).
The native shell wraps this web app in an Expo WebView and exposes a
small bridge (`window.ChravelNative`) for native-only capabilities.

**Where things live:**
- This repo (`chravel-web`): web app, PWA, service worker, design system,
  Supabase edge functions, native-bridge consumer (`src/utils/nativeBridge.ts`,
  `src/utils/installedAuthBrowser.ts`, `src/utils/platformDetection.ts`).
- `chravel-mobile` repo: Expo app, EAS Build config, native plugins for
  camera/push/haptics/geolocation/IAP, `WebBrowser.openAuthSessionAsync`
  OAuth bridge, AASA / assetlinks for Universal Links.

**Mobile-friendly behavior baked into this repo:**
- Mobile-specific routing with conditional rendering
- Touch-optimized UI (44px+ touch targets)
- Service Worker for offline support (PWA; the native shell brings its own caching)
- Virtual scrolling for performance
- Zero impact on desktop/web experience

For complete mobile readiness report, see: [MOBILE_READINESS.md](MOBILE_READINESS.md)
For native build instructions (iOS App Store / Play Store), see the
`chravel-mobile` repo — those flows do not run from this codebase.

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/20feaa04-0946-4c68-a68d-0eb88cc1b9c4) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/tips-tricks/custom-domain#step-by-step-guide)

## 🚀 **Developer Resources**

**For comprehensive development documentation, see:**
- **[DEVELOPER_HANDBOOK.md](/docs/ACTIVE/DEVELOPER_HANDBOOK.md)** - Complete developer guide
- **[PRODUCTION_CLEANUP_SUMMARY.md](/docs/_archive/root/PRODUCTION_CLEANUP_SUMMARY.md)** - Recent improvements (historical)
- **[production-ready-codebase.plan.md](/docs/_archive/root/production-ready-codebase.plan.md)** - Production roadmap (historical)

## 🔧 **Environment Configuration**

### Required for Local Development

Create a `.env` file in the root directory (copy from `.env.example`):

```bash
cp .env.example .env
```

**Critical Frontend Variables:**
- `VITE_GOOGLE_MAPS_API_KEY` – **Required** for Places tab and map features
  - Get from: https://console.cloud.google.com/apis/credentials
  - Enable: Maps JavaScript API, Places API, Geocoding API
- `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` – Required for database connection
**Backend/Supabase Functions Variables:**
- `LOVABLE_API_KEY` – Required for AI Concierge powered by Google Gemini
- `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` – Allow functions to read/write data

Set these variables when running `supabase functions serve` locally.
When deploying, set the same variables using `supabase secrets set`.

### Troubleshooting

**Maps not loading?**
1. Verify `VITE_GOOGLE_MAPS_API_KEY` is set in `.env`
2. Ensure the API key has the following APIs enabled:
   - Maps JavaScript API
   - Places API
   - Geocoding API
3. Restart the development server after adding/changing environment variables

## Claude Code

Run `npm run claude` to launch Claude Code for advanced code analysis and MCP integration. See [docs/claude-code.md](docs/claude-code.md) for setup details.

## 🔌 **Render MCP Integration**

Chravel now supports the Render Model Context Protocol (MCP) server, enabling you to manage Render infrastructure directly from Cursor using natural language.

**Capabilities:**
- Create and manage web services, static sites, and databases
- Monitor logs and analyze service metrics in real-time
- Query Render Postgres databases directly
- Update service configurations and environment variables

**Setup:**
1. The MCP configuration is already set up in `.cursor/mcp_config.json`
2. **Restart Cursor** for the changes to take effect
3. Use natural language prompts like "Show me my Render services" or "What's the CPU usage?"

For complete documentation, see: [docs/RENDER_MCP_INTEGRATION.md](docs/RENDER_MCP_INTEGRATION.md)

<!-- Trigger deployment -->
 - Updated
