#!/usr/bin/env python3
"""
Generate the Google Play "Graphics" assets: app icon + feature graphic.

Play Console requirements (Create default store listing form, 2026):
  - App icon:        PNG or JPEG, up to 1 MB, exactly 512 x 512 px.
  - Feature graphic: PNG or JPEG, up to 15 MB, exactly 1024 x 500 px.

App icon: Chravel's canonical app icon is public/chravel-pwa-icon.png — the same
mark referenced by the favicon, apple-touch-icon, and PWA manifest (192/512), so
the store icon matches what users install. We normalize it to exactly 512x512,
flatten any alpha onto the brand near-black, and re-encode as PNG under 1 MB.

Feature graphic: composed on-brand (premium dark/gold) to sit above the
screenshots — vertical dark gradient + soft gold glow, the Chravel globe emblem
(cropped from public/chravel-icon.png) on the left, wordmark + tagline at right.

Usage:
    python3 appstore/scripts/generate_playstore_graphics.py

Output:
    playstore/graphics/app-icon-512.png            (512x512)
    playstore/graphics/feature-graphic-1024x500.png (1024x500)
"""

import os

from PIL import Image, ImageDraw, ImageFont

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.abspath(os.path.join(SCRIPT_DIR, "..", ".."))

PWA_ICON = os.path.join(PROJECT_ROOT, "public", "chravel-pwa-icon.png")
LOGO_LOCKUP = os.path.join(PROJECT_ROOT, "public", "chravel-icon.png")

OUT_DIR = os.path.join(PROJECT_ROOT, "playstore", "graphics")
ICON_OUT = os.path.join(OUT_DIR, "app-icon-512.png")
FEATURE_OUT = os.path.join(OUT_DIR, "feature-graphic-1024x500.png")

# Brand tokens (source of truth: chravel-design-language skill)
BG_PRIMARY = (10, 10, 10)     # #0A0A0A near-black
BG_RICH = (23, 13, 6)         # #170D06 rich dark
GOLD = (196, 151, 70)         # #c49746
GOLD_GLOW = (232, 175, 72)    # #e8af48
WHITE = (255, 255, 255)
GRAY = (156, 163, 175)        # gray-400

FONT_PATHS_BOLD = [
    "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
    "/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf",
    "/usr/share/fonts/truetype/freefont/FreeSansBold.ttf",
]
FONT_PATHS_REG = [
    "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
    "/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf",
    "/usr/share/fonts/truetype/freefont/FreeSans.ttf",
]


def _font(paths, size):
    for p in paths:
        if os.path.exists(p):
            return ImageFont.truetype(p, size)
    return ImageFont.load_default()


def _fit_font(paths, text, max_w, cap_size):
    """Largest font <= cap_size whose rendered `text` width fits max_w."""
    draw = ImageDraw.Draw(Image.new("RGB", (10, 10)))
    size = cap_size
    while size > 8:
        f = _font(paths, size)
        if draw.textlength(text, font=f) <= max_w:
            return f
        size -= 2
    return _font(paths, 8)


def _save_under(img, path, max_bytes):
    """Save PNG; fall back to JPEG if it would exceed max_bytes."""
    img.save(path, "PNG", optimize=True)
    if os.path.getsize(path) <= max_bytes:
        return path
    jpg = os.path.splitext(path)[0] + ".jpg"
    img.save(jpg, "JPEG", quality=92, optimize=True)
    os.remove(path)
    return jpg


# ---------------------------------------------------------------------------
# App icon — normalize the canonical app icon to a 512x512 store asset
# ---------------------------------------------------------------------------
def build_app_icon():
    src = Image.open(PWA_ICON)
    # Flatten any transparency onto the brand near-black, then ensure 512x512.
    if src.mode in ("RGBA", "LA", "P"):
        src = src.convert("RGBA")
        canvas = Image.new("RGB", src.size, BG_PRIMARY)
        canvas.paste(src, (0, 0), src)
        src = canvas
    else:
        src = src.convert("RGB")
    if src.size != (512, 512):
        src = src.resize((512, 512), Image.LANCZOS)
    out = _save_under(src, ICON_OUT, 1 * 1024 * 1024)
    print(f"  app icon       {os.path.basename(out)}  512x512  ({os.path.getsize(out) / 1024:.0f} KB)")


# ---------------------------------------------------------------------------
# Feature graphic — 1024x500 premium dark/gold banner
# ---------------------------------------------------------------------------
def _vertical_gradient(w, h, top, bottom):
    grad = Image.new("RGB", (w, h))
    px = grad.load()
    for y in range(h):
        t = y / max(1, h - 1)
        r = int(top[0] + (bottom[0] - top[0]) * t)
        g = int(top[1] + (bottom[1] - top[1]) * t)
        b = int(top[2] + (bottom[2] - top[2]) * t)
        for x in range(w):
            px[x, y] = (r, g, b)
    return grad


def _radial_glow(w, h, center, radius, color, max_alpha):
    """Return an RGBA layer with a soft radial glow."""
    glow = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    gpx = glow.load()
    cx, cy = center
    for y in range(h):
        for x in range(w):
            d = ((x - cx) ** 2 + (y - cy) ** 2) ** 0.5
            if d < radius:
                a = int(max_alpha * (1 - d / radius) ** 2)
                gpx[x, y] = (color[0], color[1], color[2], a)
    return glow


def _crop_emblem():
    """Crop the globe+orbit emblem from the dark logo lockup."""
    lockup = Image.open(LOGO_LOCKUP).convert("RGBA")
    # Emblem sits upper-center of the 1536x1024 lockup, above the wordmark.
    return lockup.crop((468, 40, 1068, 640))  # 600x600


def build_feature_graphic():
    W, H = 1024, 500
    base = _vertical_gradient(W, H, BG_RICH, BG_PRIMARY)

    # Soft gold glow behind where the emblem sits (left third).
    glow = _radial_glow(W, H, center=(250, 250), radius=320, color=GOLD_GLOW, max_alpha=70)
    base = Image.alpha_composite(base.convert("RGBA"), glow).convert("RGB")

    # Emblem on the left. The crop is on a black field; screen-blend it so the
    # black background drops out and the gold/navy globe sits on the gradient.
    em = 380
    em_x, em_y = 56, 60
    emblem = _crop_emblem().resize((em, em), Image.LANCZOS)
    emblem_rgb = emblem.convert("RGB")
    region = base.crop((em_x, em_y, em_x + em, em_y + em))
    base.paste(_screen(region, emblem_rgb), (em_x, em_y))

    draw = ImageDraw.Draw(base)
    text_x = 470
    max_w = W - text_x - 48  # right margin

    # Wordmark — auto-fit to the available width.
    f_word = _fit_font(FONT_PATHS_BOLD, "Chravel", max_w, 132)
    wb = draw.textbbox((0, 0), "Chravel", font=f_word)
    word_h = wb[3] - wb[1]
    word_y = 150
    draw.text((text_x, word_y), "Chravel", font=f_word, fill=WHITE)

    # Tagline (gold)
    tagline = "Less Chaos. More Coordination."
    f_tag = _fit_font(FONT_PATHS_BOLD, tagline, max_w, 40)
    tag_y = word_y + word_h + 34
    draw.text((text_x + 2, tag_y), tagline, font=f_tag, fill=GOLD)

    # Sub-line (gray)
    subline = "Group trips: chat, itinerary, expenses & AI."
    f_sub = _fit_font(FONT_PATHS_REG, subline, max_w, 28)
    draw.text((text_x + 2, tag_y + 52), subline, font=f_sub, fill=GRAY)

    out = _save_under(base, FEATURE_OUT, 15 * 1024 * 1024)
    print(f"  feature        {os.path.basename(out)}  1024x500  ({os.path.getsize(out) / 1024:.0f} KB)")


def _screen(bg, fg):
    """Screen blend (drops black, keeps light emblem) — both RGB, same size."""
    from PIL import ImageChops
    return ImageChops.screen(bg, fg)


def main():
    os.makedirs(OUT_DIR, exist_ok=True)
    print("Generating Google Play graphics...")
    build_app_icon()
    build_feature_graphic()
    print(f"\nOutput: {OUT_DIR}")


if __name__ == "__main__":
    main()
