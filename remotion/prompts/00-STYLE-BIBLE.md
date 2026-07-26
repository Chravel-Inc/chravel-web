# Chravel Style Bible — live-action plates

Every AI-generated clip in this system obeys this document. It exists so that eleven
films generated across different sessions, and possibly different models, cut together
as one campaign.

**Scope:** this governs the _plates_ only — the live-action backgrounds. All typography,
UI, logos, and titles are rendered in Remotion and must never be requested from a video
model. See `00-NEGATIVE-PROMPTS.md` for how that is enforced.

---

## 1. The look in one line

> Premium travel documentary, shot on large-format digital, warm practical light,
> deep shadows, gold highlights, real people who are not aware of the camera.

Reference grade: the "after" half of a high-end hotel brand film. Not an ad. Not stock.

## 2. Camera language

Put these in every prompt. Naming real glass and bodies moves diffusion models toward
cinema footage and away from smartphone/stock-video training data — this is the single
most reliable photorealism lever after lighting.

| Parameter | Value                                                                                   |
| --------- | --------------------------------------------------------------------------------------- |
| Body      | ARRI Alexa 35, or Sony VENICE 2 for night exteriors                                     |
| Glass     | Cooke S7/i primes — the Cooke look renders skin warm and slightly soft                  |
| Focal     | 35mm for environment beats · 85mm for faces · 24mm only for wide establishers           |
| Aperture  | T2.0–T2.8. Shallow, but the whole face stays sharp. Never T1.2 bokeh-soup               |
| Shutter   | 180° — natural motion blur at 24fps                                                     |
| Movement  | Slow dolly, gentle handheld float, or locked off. Never a drone orbit, never a whip pan |
| Height    | Eye level. Low-angle hero shots read as advertising and break the documentary frame     |

## 3. Lighting

- **Motivated only.** Every source must exist in the world: a window, a lamp, a phone
  screen, a string light, a fire, a sunset. No unmotivated rim light.
- **Golden hour or blue hour** for exteriors. Midday sun is banned — it flattens skin and
  destroys the grade.
- **Practicals in frame** are encouraged: lamps, candles, screens, neon. They give the
  colourist something to key gold off.
- **Cold open scenes** are underexposed by roughly a stop, with cooler, greener light.
  **Payoff scenes** are warm and a stop brighter. That delta is the whole emotional
  argument of the film — do not flatten it.

## 4. Grade

```
Shadows   deep, slightly cool, never crushed to pure black
Midtones  warm, skin-forward
Highlights soft gold roll-off (#c49746 → #e8af48), never clipped white
Saturation restrained — one notch below what feels right
Contrast  filmic S-curve, gentle shoulder
```

Add `Kodak Vision3 500T` or `subtle 35mm halation` to prompts for night interiors.

## 5. Casting and skin — how to avoid the AI look

This is where most generated humans fail. Be explicit:

- **Ask for texture.** `visible skin texture, pores, fine lines, natural asymmetry,
flyaway hairs, slight under-eye shadow`. Models default to airbrushed; you must
  actively pull them back.
- **Ask for catchlights.** `clear catchlights in both eyes` — dead eyes are the fastest
  tell that a face is synthetic.
- **Ask for subsurface scattering** on backlit skin (ears, fingers, nose edges).
- **Age people specifically.** "A woman in her late 30s" beats "a woman". Ages between
  28 and 55 generate far more convincingly than 18–24, which skews toward the plastic
  influencer aesthetic these models are saturated with.
- **Real wardrobe.** Cotton, linen, denim, wool. Visible wrinkles and drape. Never
  crisp, never costume-perfect.
- **Candid beats posed.** `caught mid-action, unaware of camera, natural expression` —
  not `smiling at camera`, which produces stock photography.
- **Hands:** keep them busy and partly out of frame. Hands holding a phone, a glass, a
  door. Fully visible splayed hands are still the highest-risk element in any generation.

## 6. Duration and coverage

Generate **6–8 seconds** per shot even though the edit uses 3–5. The extra head and tail
give the Remotion edit room to find the cut, and lets you drop the frames where a model
drifts (drift almost always begins after second 5).

Generate **three variants** of every hero shot. Expect to keep one. This is the normal
hit rate for photoreal humans and budgeting for it prevents settling for a bad take.

## 7. Framing for 9:16

Generate **16:9 and crop**, unless the model natively supports vertical well. Composition
rule: keep the subject's eyeline in the upper third and leave the lower 40% of frame
relatively empty — that is where Remotion lays the headline. A plate with a busy lower
third cannot be typeset over and will be unusable no matter how good the footage is.

## 8. Continuity

Any character appearing in more than one shot must be generated with the still-first
workflow in `00-WORKFLOW.md`. Text-to-video alone will not hold a face across shots, and
a face that shifts between scene 1 and scene 5 reads as two different people.
