# Marketing Videos

## Homepage hero demo (current)

`chravel-homepage-demo-60.mp4` (1920×1080, 60s, muted H.264) and its
first-frame poster `chravel-homepage-demo-60-poster.jpg` are consumed by
`src/components/landing/sections/HeroSection.tsx`. They are committed here so
every Vercel deploy ships them — do **not** point the hero at sandbox or
external asset URLs.

The video is composed exclusively from real DOM screenshots of the running app
in demo mode (desktop 1600×900@2x + iPhone 390×844@3x). No AI-generated UI.

### Regenerate

```bash
# 1. Build the app and serve it
npm run build
npx vite preview --port 4173 &

# 2. Capture fresh real-UI frames into remotion/public/captures/
#    (drives the real Create Trip modal, chat, broadcasts, payments, Pro trip)
node remotion/scripts/capture-demo-frames.mjs

# 3. Render the 60s composition + poster
cd remotion && npm install
node scripts/render-remotion.mjs ../public/videos/chravel-homepage-demo-60.mp4 HomepageProductDemo60
npx remotion still src/index.ts HomepageProductDemo60 \
  ../public/videos/chravel-homepage-demo-60-poster.jpg \
  --frame=0 --image-format=jpeg --jpeg-quality=82
```

The composition lives at `remotion/src/compositions/HomepageProductDemo60.tsx`
(scene timings, captions, layout). The first frame is the demo dashboard so the
poster and frame 0 are pixel-identical — no visual jump when playback starts.

To preview interactively: `cd remotion && npm run studio`.

## Use-case reels (web cuts)

`use-cases/<slug>.mp4` + `use-cases/<slug>-poster.jpg` are consumed by
`UseCaseReelSection` on each `/use-cases/:slug` page (poster-first, click-to-play;
src loads only after Watch). Web cuts are 720p vertical muted H.264 (~1.5–2MB)
so the article stays light until someone hits play.

Registry: `src/lib/useCaseVideos.ts`. Remotion masters:
`remotion/src/compositions/useCases/`.

### Regenerate web cuts from Remotion masters

```bash
# Masters from a prior Remotion render (artifacts or remotion/out/usecase-reels/)
SRC=/opt/cursor/artifacts/use-case-reels
OUT=public/videos/use-cases
# For each slug, scale to 720-wide + extract poster at t=2s
ffmpeg -y -i "$SRC/chravel-<id>-reel.mp4" -vf scale=720:-2 -an \
  -c:v libx264 -preset medium -crf 28 -movflags +faststart -pix_fmt yuv420p \
  "$OUT/<slug>.mp4"
ffmpeg -y -ss 2 -i "$SRC/chravel-<id>-reel.mp4" -frames:v 1 -q:v 3 \
  "$OUT/<slug>-poster.jpg"
```

Id → slug map lives in `remotion/src/compositions/useCases/scripts.ts`
(`id` field) and `src/lib/useCaseVideos.ts`.

## Legacy compositions

- `HomepageHeroDemo` / `HomepageHeroDemo60` — earlier Ken Burns slideshow cuts.
- `MobileAppDemo` — 1080×1920 vertical cut for app-store/social.

Render via the `render:*` scripts in `remotion/package.json`.
