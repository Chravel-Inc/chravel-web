# ChravelApp Use-Case Cinematic Reels

Instagram / social vertical films (1080×1920 · 30fps · ~21s) for every use case on
[chravel.app/use-cases](https://chravel.app/use-cases).

## What’s in each reel

| Beat | Intent |
| --- | --- |
| Hook | Name the chaos in one cinematic line |
| Pain | Make the group-chat tax feel real |
| Turn | Reveal one shared ChravelApp workspace |
| Features ×3 | Sharpest product unlocks for that audience |
| CTA | Brand mark + “Get started free” + URL |

Typography is Remotion text (Playfair Display + Instrument Serif + Inter) — never
AI-rasterized lettering. People and places come from real stock footage and brand
photography under `public/usecases/`.

## Compositions

Registered in Remotion Studio under **UseCaseReels**:

- `UseCaseReel-concierge`
- `UseCaseReel-weddings`
- `UseCaseReel-group-trips`
- `UseCaseReel-families`
- `UseCaseReel-sports`
- `UseCaseReel-touring`
- `UseCaseReel-conferences`
- `UseCaseReel-local-clubs`
- `UseCaseReel-faith`
- `UseCaseReel-business`

## Render

```bash
cd remotion
# Stock clips must exist in public/usecases/broll/ready/ (gitignored; download locally)
npm run render:use-case-reels
# or one:
node scripts/render-use-case-reels.mjs weddings
```

Outputs land in `remotion/out/usecase-reels/` and `/opt/cursor/artifacts/use-case-reels/`.
