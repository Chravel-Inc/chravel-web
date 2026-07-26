# 01 · Travel Concierge & Advisors

**Composition:** `UC-01-travel-concierge-client-portal-vertical` / `-square`
**Cast:** C1 Marisa (advisor), C2 David (client)
**Emotional arc:** the gap between what the client paid for and how the trip actually arrives.

Read `00-STYLE-BIBLE.md` and `00-NEGATIVE-PROMPTS.md` first. Append negative blocks
A–E to every generation.

---

## Shot 1 · Cold open — `concierge-coldopen.mp4` · 6s (edit uses 3s)

**Plate slot:** `plates.coldOpen` · **Fallback:** `concierge-atlantis-poolside.jpg`

> A 41-year-old woman with warm olive skin, dark shoulder-length hair pushed behind one
> ear, fine lines at the eyes, minimal makeup, wearing a soft cream linen blazer over a
> silk shell, small gold hoops, visible skin texture and pores, natural asymmetry. She
> sits alone at a hotel desk late at night, lit only by a warm brass lamp and the cool
> glow of a laptop, rubbing the bridge of her nose between her fingers. Loose printed
> pages and a passport are spread across the desk. Shot on ARRI Alexa 35 with a Cooke
> S7/i 35mm at T2.2, slow push in, eye level, 180-degree shutter. Warm practical lamp
> light against cool laptop spill, deep shadows, underexposed by one stop. Kodak Vision3
> 500T, subtle halation. Candid, unaware of camera. The laptop screen is angled away and
> its content is not visible.

**Note:** the screen must face away — that is what keeps a garbled fake UI out of frame.

## Shot 2 · Escalation A · 4s

> Extreme close-up of a phone lying face-down on a marble hotel desk, buzzing repeatedly,
> vibrating against a set of car keys. Warm lamp light raking across the marble. Shot on
> ARRI Alexa 35, Cooke S7/i 85mm macro at T2.0, locked off, shallow focus on the phone
> edge. Screen is face-down and never visible. Deep shadows, warm highlights.

## Shot 3 · Escalation B · 4s

> A stack of loose printed travel documents and folded itineraries sliding off the edge
> of a desk and scattering across a dark wooden floor, shot in slow motion from a low
> angle. The pages are blank cream paper with no printing or text visible. Warm side
> light from a single lamp, deep shadow, dust motes in the beam. Shot on ARRI Alexa 35,
> 35mm at T2.4, locked off.

**Note:** explicitly blank pages. A model asked for "documents" will invent text.

## Shot 4 · The turn — `concierge-turn.mp4` · 6s

**Plate slot:** `plates.turn` · **Fallback:** `dubai-birthday-cameron-knight.webp`

> A 47-year-old man with medium-brown skin, close-cropped greying hair, a short beard,
> laugh lines, wearing an unbuttoned pale blue linen shirt and a worn leather watch strap,
> stands at a rooftop infinity pool at golden hour, looking out over a city skyline,
> shoulders dropping as he exhales. Visible skin texture and pores, subsurface scattering
> where the low sun catches the edge of his ear, clear catchlights in both eyes. Shot on
> ARRI Alexa 35 with a Cooke S7/i 85mm at T2.0, very slow dolly in, eye level. Golden hour
> backlight, warm gold highlights rolling off softly, restrained saturation. Candid,
> unaware of camera.

## Shot 5 · Payoff — `concierge-payoff.mp4` · 8s

**Plate slot:** `plates.payoff` · **Fallback:** `concierge-atlantis-poolside.jpg`

> The same 47-year-old man with medium-brown skin, close-cropped greying hair and a short
> beard, in a pale blue linen shirt, sitting on the edge of a resort pool with his legs in
> the water, laughing genuinely at something off-frame while two children play in the
> water nearby. Late afternoon sun, warm and one stop brighter than the earlier scenes.
> Visible skin texture, natural asymmetry, clear catchlights. Children are background
> figures, softly out of focus, faces not discernible. Shot on ARRI Alexa 35, Cooke S7/i
> 35mm at T2.8, gentle handheld float, eye level, 180-degree shutter.

**Continuity:** same reference still and seed as Shot 4. This is the payoff for that
exact person — a different face here breaks the film.

## Shot 6 · Lockup

**No plate.** Rendered entirely in Remotion. Do not generate.

---

## Seed log

| Character | Ref still            | Seed       | Notes                         |
| --------- | -------------------- | ---------- | ----------------------------- |
| C1 Marisa | `refs/C1-marisa.png` | _(record)_ |                               |
| C2 David  | `refs/C2-david.png`  | _(record)_ | Shots 4 and 5 must share this |
