# Negative prompts — append to every generation

Copy the relevant block into the negative-prompt field of **every** shot, without
exception. These are not stylistic preferences; each entry corresponds to a specific,
recurring failure mode that will otherwise make a clip unusable.

---

## A. The universal block (always use)

```
text, letters, words, writing, typography, captions, subtitles, watermark, logo,
signage, street signs, brand names, phone screen content, UI, user interface, app
interface, menus, buttons, numbers, clock faces
```

**Why this is non-negotiable.** Diffusion video models cannot spell. Any text they
generate arrives as convincing-looking gibberish, and it is the single most damaging
"AI slop" tell in a brand film. In this system 100% of on-screen text is rendered by
Remotion in real Inter — so there is never a reason to let a model attempt a letterform.

This is also why the plates must not show phone screens. If a shot needs a phone,
frame it screen-away or screen-off; the actual UI is composited in Remotion from real
product captures.

## B. Anatomy (always use)

```
extra fingers, missing fingers, fused fingers, malformed hands, deformed hands,
extra limbs, extra arms, distorted face, warped face, asymmetric eyes, misaligned eyes,
dead eyes, lifeless stare, crossed eyes, floating limbs, detached body parts,
mangled teeth, too many teeth
```

## C. The "AI look" (always use)

```
plastic skin, waxy skin, airbrushed, over-smoothed, poreless, beauty filter, instagram
filter, uncanny valley, doll-like, mannequin, CGI, 3D render, video game render,
unreal engine, oversaturated, HDR halo, glowing skin, hyper-glossy, artificial bokeh
```

## D. Motion artifacts (video only)

```
morphing, warping, melting, flickering, strobing, jittery motion, frame blending,
ghosting, temporal instability, face drift, identity shift, sliding features,
teleporting objects, inconsistent lighting between frames
```

## E. Wrong genre (always use)

```
stock photo, stock footage, corporate stock, posed group shot, everyone smiling at
camera, thumbs up, high five, staged, advertisement, commercial lighting, studio
backdrop, greenscreen, drone orbit, lens flare, anamorphic streak
```

## F. Add for interiors

```
blown out windows, flat overhead lighting, fluorescent green cast, empty lifeless room
```

## G. Add for night / low light

```
noise, grain artifacts, banding, muddy shadows, crushed blacks, neon oversaturation
```

---

## Tool-specific notes

| Tool                     | How to pass negatives                                                                                                                                                                                                                                                               |
| ------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Veo 3**                | No dedicated negative field. Fold the constraints into the positive prompt as explicit clauses: _"…no text or signage anywhere in frame, no visible screen content, natural unretouched skin with visible pores."_ Veo respects positive phrasing far better than an appended list. |
| **Sora 2**               | Same as Veo — describe what IS there. Sora over-weights nouns in a negative list and can summon the very thing you excluded. Prefer _"a bare concrete wall"_ over _"no signs on the wall"_.                                                                                         |
| **Kling 2.5**            | Has a real negative-prompt field. Paste blocks A–E verbatim.                                                                                                                                                                                                                        |
| **Seedance 2 / EvoLink** | Has a real negative-prompt field. Paste blocks A–E verbatim.                                                                                                                                                                                                                        |

**The general rule:** on models with a negative field, use these lists. On models without
one, convert each negative into a positive description of what should be there instead.
Never simply omit them.
