# Chravel Video Kit

In-repo companions to Pika's **Product Sizzle** and **Founder Video** skills
(prompts in [`../PIKA_FOUNDER_KIT.md`](../PIKA_FOUNDER_KIT.md)).

| File | What it is |
|---|---|
| `sizzle-storyboard.md` | ≈15s 9:16 feature sizzle — beat sheet, captions, score notes. |
| `founder-video-script.md` | ≈30–45s founder intro — full VO script, shot list, lower-thirds. |

These are the editorial source of truth. To generate the actual videos, paste the
matching Part C prompt from `../PIKA_FOUNDER_KIT.md` into a Pika-connected claude.ai
chat (these storyboards give Pika the exact beats), or hand them to an editor /
Remotion composition.

## Repo hygiene
Don't commit large video binaries. Render to `sizzle.mp4` / `founder.mp4`, store
them in cloud storage, link them here, and commit only the small poster stills
(`sizzle-poster.png`, `founder-poster.png`) plus these `.md` files.
