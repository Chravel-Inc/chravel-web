# Generation workflow

How to get from a prompt pack to footage sitting in the Remotion timeline.

---

## Step 0 — you do not have to do any of this for the films to work

Every composition already renders complete using the brand photography in
`public/plates/stills`. This workflow is the upgrade path, not a prerequisite. Do it one
scenario at a time; each clip you add improves that film in isolation.

---

## Step 1 — lock a reference still per character (the critical step)

**Do not skip to text-to-video.** Generating each shot independently from text produces a
different face every time, and inconsistent faces across scenes are the defect viewers
notice most.

For each character in `00-CHARACTER-BIBLE.md` who appears in more than one shot:

1. Generate a **neutral, well-lit portrait still** using the character's prompt fragment
   plus the Style Bible's camera and skin directives. Use `nano-banana` (Gemini) or
   Higgsfield Soul.
2. Generate 4–6 candidates. Pick the one with the most convincing skin texture and
   clearest catchlights — not the most attractive one.
3. Save as `prompts/refs/C{n}-{name}.png` and **record the seed**.

That still is now the character. Every later shot references it.

## Step 2 — generate each shot as image-to-video

For every shot in the scenario pack:

1. Start from the character's reference still (image-to-video / reference-image mode).
2. Use the shot's prompt from the pack.
3. Reuse the character's seed where the tool exposes one.
4. Render **6–8 seconds** even though the edit needs 3–5.
5. Generate **3 variants**. Expect to keep 1.

Shots with no people in them (establishers, hands, details) can go straight
text-to-video; there is no face to hold.

## Step 3 — cull honestly

Reject a take for any of these, no matter how good the rest looks:

- Any letterform anywhere in frame
- Hands with wrong finger counts, or fingers that change between frames
- A face that shifts identity across the clip
- Skin with no pores
- Motion that morphs, melts, or flickers
- Anyone looking at camera in a shot that is meant to be candid

Culling is most of the work. A 1-in-3 keep rate is normal and healthy.

## Step 4 — trim and drop in

1. Trim to the beat length listed in the pack.
2. Name the file exactly as the pack's **Clip filename**.
3. Drop it in `remotion/public/plates/clips/`.
4. Add the filename to that scenario's plate in `src/usecases/scenarios.ts`:

```ts
coldOpen: { clip: 'concierge-coldopen.mp4', still: 'concierge-atlantis-poolside.jpg', darken: 0.55 },
```

Keep `still` in place — it stays as the poster and the fallback. `Plate` switches to the
clip automatically. **No component code changes.**

5. Re-render: `npm run render:usecases -- UC-01`

## Step 5 — audio

The films are currently silent, which is correct for feed autoplay — Instagram and TikTok
both start muted and a large share of views never unmute. If you add a bed:

- Licence properly (Artlist, Musicbed, Epidemic). Do not use a model's generated music
  for a commercial brand film without checking the licence terms.
- Duck nothing — there is no voiceover.
- Cut the music to land its downbeat on the scene-3 gold sweep, which is the film's pivot.

Voiceover is deliberately not part of this system: it forces a translation and re-record
for every market, and the copy already reads clearly on screen.

---

## Tool routing

| Need                                | Use                                     |
| ----------------------------------- | --------------------------------------- |
| Character reference stills          | nano-banana (Gemini) or Higgsfield Soul |
| Photoreal humans, 6–8s, best motion | Veo 3 or Sora 2                         |
| Cinematic camera moves from a still | Higgsfield DoP                          |
| Volume / cost-efficient variants    | Seedance 2 via `evolink-media`          |

`evolink-media` and `higgsfield` are already declared in `.mcp.json.example` at the repo
root. Copy it to `.mcp.json`, add real keys, and restart the session to drive them
directly from Claude Code rather than by hand.

## Cost expectation

Roughly 6 hero shots per scenario × 11 scenarios × 3 variants ≈ **200 generations** for a
full live-action pass. Budget accordingly, and note that the films are shippable at every
point along the way — there is no all-or-nothing threshold.
