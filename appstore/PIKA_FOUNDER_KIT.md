# Pika MCP — Chravel Founder Starter Kit

Generate Chravel's launch/marketing assets with Pika's **Founder Starter Kit** —
4 skills delivered through the **Pika MCP**:

| Skill | What it makes |
|---|---|
| **Build-a-Brand** | Full visual + verbal identity (logo, wordmark, palette, type, voice) |
| **App Screens** | App Store screen mockups optimized for downloads, with captions |
| **Product Sizzle** | A ~15-second feature sizzle film |
| **Founder Video** | A founder intro: who you are, what you made, why it matters |

> **Important — where to run this.** These 4 skills are **not local files** in this repo.
> They are server-side capabilities of the **Pika MCP**, a *remote OAuth connector*
> (`https://mcp.pika.me/api/mcp`). They run in a Pika-connected **claude.ai** chat
> (web / desktop / iOS), **not** in a Claude Code coding session. This doc is the
> paste-ready kit; do Part A once, then paste Part B and each Part C prompt into a
> Pika-connected chat.

---

## Part A — Connect the Pika MCP (one-time, ~2 min)

1. Open **claude.ai → Settings → Connectors → Add custom connector**
   (direct: <https://claude.ai/settings/connectors?modal=add-custom-connector>).
2. **Name:** `Pika`  ·  **URL:** `https://mcp.pika.me/api/mcp`
3. Click **Add → Connect**, then sign in / create your **Pika account** in the OAuth popup.
4. The connector **syncs across Claude web + desktop + iOS** with your account — add it
   once on web and it's available everywhere (you can't *add* connectors from iOS, but
   they work there once added).
5. Start a **new claude.ai chat** with the **Pika** connector toggled on. Confirm it's
   live by asking: `List the Pika skills and tools you have available.` You should see
   Build-a-Brand, App Screens, Product Sizzle, Founder Video.

---

## Part B — Bootstrap your Pika Agent with Chravel's brand

Paste this first, in the Pika-connected chat, so every asset comes out on-brand.

```text
Set up my Pika Agent identity for my company, then confirm what you loaded.

1) Read my existing identity files by calling identity_persona_read for each of the
   three files: identity, soul, and style.

2) Then apply this brand brief as the source of truth (override/merge into the above):

COMPANY: Chravel — group travel coordination.
ONE-LINER: Travel together, organized. Plan trips, chat with your group, split
expenses, get an AI travel concierge, and keep your itinerary, map, and memories in
one shared place.
AUDIENCE: Friends, families, and groups planning trips together; also pro/event
organizers. Mobile-first (iOS + PWA).
POSITIONING / TONE: Premium, calm, confident, modern. Not loud or gimmicky. Speaks
like a well-traveled friend who has the logistics handled.

VISUAL IDENTITY — premium dark / gold (lock to these exact values):
- Backgrounds: near-black #0A0A0A (primary). Warm variant #1A1207, cool #0D1117,
  rich #170D06.
- Gold primary: #c49746 (accents, descriptors, brand marks).
- Gold glow / highlight: #e8af48.
- Headline text: pure white #FFFFFF.
- Secondary text: muted gray.
- Gold is RESERVED for primary CTAs and brand elements — use sparingly, never as a
  full background. Dark-first always; no bright/light backgrounds.
- Feel: high-contrast, spacious, refined. Rounded corners, soft elevation.

VOICE: Short, declarative, benefit-first. Action verbs. No exclamation spam.

Confirm the merged identity, soul, and style you'll use for all subsequent generations.
```

---

## Part C — The 4 generation prompts (paste one at a time)

Run them in order — Build-a-Brand first, since the others should inherit its output.

### 1) Build-a-Brand

```text
Use the Build-a-Brand skill to create Chravel's full visual and verbal identity,
strictly following the brand brief you just loaded (premium dark/gold; bg #0A0A0A;
gold #c49746; gold glow #e8af48; white headlines).

Deliver:
- Primary logo + wordmark "Chravel" (and a compact app-icon mark), on dark.
- Logo lockups: primary (gold on near-black), inverted, and mono.
- Color system with the exact hexes above, plus usage rules.
- Type system (headline + body) and a few sample lockups.
- Verbal identity: tagline options, 1-line pitch, voice do/don't.
- A one-page brand sheet that ties it together.

Keep it cohesive with the travel-coordination positioning. Output the assets and a
short rationale for "the mark explained."
```

### 2) App Screens (App Store, iPhone 6.7")

```text
Use the App Screens skill to design App Store screenshots for Chravel that are
optimized for downloads, on-brand (bg #0A0A0A, white verb headline, gold #c49746
descriptor), and using the brand identity from the previous step.

Format: vertical, 1290 x 2796 px (iPhone 6.7" / 15 Pro Max), PNG.

Make 8 screens — each a bold white action-verb headline + gold descriptor over a
clean Chravel app mockup of the feature:

1. PLAN — YOUR NEXT ADVENTURE        (trip dashboard)
2. CHAT — WITH YOUR GROUP            (group messaging)
3. ORGANIZE — EVERY DETAIL           (calendar / itinerary)
4. ASK — YOUR AI TRAVEL GUIDE        (AI concierge)
5. SPLIT — EXPENSES EFFORTLESSLY     (expense splitting)
6. DISCOVER — AMAZING PLACES         (maps & places)
7. SHARE — TRIP MEMORIES             (media gallery)
8. DECIDE — TOGETHER                 (group polls)

Show rich, populated data (not empty states). No debug UI or placeholder text.
Deliver all 8 plus a side-by-side showcase strip labeled "Chravel — Travel Together".
```

### 3) Product Sizzle (~15s)

```text
Use the Product Sizzle skill to make a ~15-second vertical (9:16) sizzle film for
Chravel that drives hype and downloads, in the premium dark/gold brand (bg #0A0A0A,
gold #c49746 accents, white type).

Story beats: a group deciding to travel -> Chravel turns the chaos into one organized
trip (plan, chat, split, AI concierge, shared map & memories) -> end on the Chravel
wordmark + tagline + an implied App Store CTA.

Energy: confident and cinematic, not frantic. Add an on-brand score and crisp
kinetic captions. Deliver the video plus a thumbnail/poster frame.
```

### 4) Founder Video (~30–45s)

```text
Use the Founder Video skill to create a founder intro video for Chravel that shows
investors and customers who we are, what we made, and why they need it.

Keep it brand-consistent (dark/gold lower-thirds, gold #c49746, white type, Chravel
wordmark). Script arc: the problem (group trips are chaos to coordinate) -> what
Chravel is (one shared place to plan, chat, split, and get an AI travel concierge) ->
why now / why us -> simple CTA. ~30-45 seconds.

Deliver the video, the script/VO it used, and a poster frame.
```

---

## Part D — Bringing assets back into the repo

The generated outputs slot into Chravel's existing ASO / App Store pipeline
(`aso-appstore-screenshots` skill). **In-repo companions now exist for each skill** —
deterministic, on-brand starting points you can ship as-is or replace with Pika output:

| Asset | Location | Status |
|---|---|---|
| App-screen marketing frames | `appstore/screenshots/marketing/` | ✅ Generated — 8× `NN-verb.png` @ 1290×2796 |
| Brand kit (palette, sheet, lockup, guidelines) | `appstore/brand/` | ✅ Generated — `generate_brand_kit.py` + `brand-guidelines.html` |
| Sizzle storyboard + founder script | `appstore/video/` | ✅ Written — paste the Part C prompts to render the actual videos |

Pipeline reference (already in repo): `appstore/scripts/generate_brand_kit.py`,
`appstore/scripts/generate_marketing_screenshots.py`, `appstore/scripts/showcase.py`,
and the `aso-appstore-screenshots` skill.

**Regenerate the local companions:**

```bash
python3 appstore/scripts/generate_brand_kit.py            # brand/ palette + sheet
python3 appstore/scripts/generate_marketing_screenshots.py # 8 App Store screens
open appstore/brand/brand-guidelines.html                  # full identity reference
```

> **Repo hygiene:** the 8 marketing PNGs + brand stills are the committed,
> App-Store-ready deliverables. Don't bloat git with large video binaries — render
> `sizzle.mp4` / `founder.mp4`, store them in cloud storage, link them, and commit
> only the small poster stills + the storyboard/script `.md` files.

---

## Sources

- Pika MCP: <https://www.pika.me/mcp> · endpoint `https://mcp.pika.me/api/mcp`
- Claude custom connectors (remote MCP): <https://support.claude.com/en/articles/11175166-get-started-with-custom-connectors-using-remote-mcp>
- Chravel brand tokens: `.claude/skills/chravel-design-language/SKILL.md`,
  `.claude/skills/aso-appstore-screenshots/SKILL.md`
