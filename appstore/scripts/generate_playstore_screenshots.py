#!/usr/bin/env python3
"""
Adapt Chravel marketing screenshots for the Google Play Store.

Takes existing App Store marketing composites (iPhone + iPad) and reframes them
to meet Play Store dimension and aspect-ratio requirements *exactly*.

Play Store constraints (per the Play Console "Create default store listing"
form, 2026):
  - Format: 24-bit PNG or JPEG, NO alpha channel, max 8 MB each.
  - Aspect ratio: must be EXACTLY 16:9 or 9:16 (0.5625 or 1.7778).
  - Phone:      each side 320-3840 px, 2-8 screenshots.
  - 7" Tablet:  each side 320-3840 px, up to 8 screenshots.
  - 10" Tablet: each side 1080-7680 px, up to 8 screenshots.

All tiers use portrait 9:16 here:
  - Phone:      1080 x 1920  (sides within 320-3840)   9:16
  - 7" Tablet:  1440 x 2560  (sides within 320-3840)   9:16
  - 10" Tablet: 2160 x 3840  (sides within 1080-7680)  9:16

Reframing strategy:
  - "crop": center-crop to the target aspect, then resize. Used for the iPhone
    composites, whose tall source (0.46) only needs the empty bottom trimmed —
    no app content is lost.
  - "pad":  pad the background out to the target aspect, then resize. Used for
    the iPad composites: their 0.75 source would have the device frame clipped
    if cropped to 9:16, so we extend the (near-black) background instead. This
    is lossless — the whole device frame is preserved.

Usage:
    python appstore/scripts/generate_playstore_screenshots.py

Output:
    playstore/screenshots/phone/*.png       (1080x1920)
    playstore/screenshots/tablet-7/*.png    (1440x2560)
    playstore/screenshots/tablet-10/*.png   (2160x3840)
"""

import os
import sys

from PIL import Image

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.abspath(os.path.join(SCRIPT_DIR, "..", ".."))

# Source directories (App Store marketing composites)
IPHONE_SRC = os.path.join(PROJECT_ROOT, "appstore", "screenshots", "marketing", "iPhone-6.7")
IPAD_SRC = os.path.join(PROJECT_ROOT, "appstore", "screenshots", "marketing", "iPad-Pro-12.9")

# Output directories
PLAY_BASE = os.path.join(PROJECT_ROOT, "playstore", "screenshots")
PHONE_OUT = os.path.join(PLAY_BASE, "phone")
TABLET7_OUT = os.path.join(PLAY_BASE, "tablet-7")
TABLET10_OUT = os.path.join(PLAY_BASE, "tablet-10")

# Target dimensions — all exact 9:16 (ratio 0.5625)
PHONE_SIZE = (1080, 1920)
TABLET7_SIZE = (1440, 2560)
TABLET10_SIZE = (2160, 3840)

# Play Store hard limit: 8 MB per asset. Keep margin.
MAX_BYTES = 8 * 1024 * 1024


def _sample_bg(img):
    """Sample the top-left pixel as the background fill color (RGB)."""
    px = img.convert("RGB").getpixel((0, 0))
    return px


def center_crop_to_aspect(img, target_w, target_h):
    """Crop image from center to match target aspect ratio (may drop edges)."""
    src_w, src_h = img.size
    target_ratio = target_w / target_h
    src_ratio = src_w / src_h

    if src_ratio > target_ratio:
        # Source is wider — crop width from center
        new_w = int(round(src_h * target_ratio))
        offset = (src_w - new_w) // 2
        return img.crop((offset, 0, offset + new_w, src_h))
    if src_ratio < target_ratio:
        # Source is taller — crop height from the bottom (preserve headline)
        new_h = int(round(src_w / target_ratio))
        return img.crop((0, 0, src_w, new_h))
    return img


def pad_to_aspect(img, target_w, target_h):
    """Pad image with its background color to match target aspect (lossless)."""
    src_w, src_h = img.size
    target_ratio = target_w / target_h
    src_ratio = src_w / src_h
    bg = _sample_bg(img)

    if abs(src_ratio - target_ratio) < 1e-6:
        return img.convert("RGB")

    if src_ratio > target_ratio:
        # Too wide — add height (top/bottom bands)
        new_h = int(round(src_w / target_ratio))
        canvas = Image.new("RGB", (src_w, new_h), bg)
        canvas.paste(img.convert("RGB"), (0, (new_h - src_h) // 2))
    else:
        # Too tall — add width (left/right bands)
        new_w = int(round(src_h * target_ratio))
        canvas = Image.new("RGB", (new_w, src_h), bg)
        canvas.paste(img.convert("RGB"), ((new_w - src_w) // 2, 0))
    return canvas


def _save_within_limit(rgb_img, dst_path):
    """Save as PNG; if over 8 MB, fall back to high-quality JPEG."""
    rgb_img.save(dst_path, "PNG", optimize=True)
    if os.path.getsize(dst_path) <= MAX_BYTES:
        return dst_path
    # Fall back to JPEG (Play Store accepts JPEG; no alpha needed)
    jpg_path = os.path.splitext(dst_path)[0] + ".jpg"
    rgb_img.save(jpg_path, "JPEG", quality=92, optimize=True, progressive=True)
    os.remove(dst_path)
    return jpg_path


def adapt_screenshot(src_path, dst_path, target_size, mode):
    """Reframe to target aspect (crop or pad), resize, save RGB (no alpha)."""
    img = Image.open(src_path).convert("RGBA")
    if mode == "pad":
        reframed = pad_to_aspect(img, target_size[0], target_size[1])
    else:
        reframed = center_crop_to_aspect(img, target_size[0], target_size[1])
    resized = reframed.convert("RGB").resize(target_size, Image.LANCZOS)
    out_path = _save_within_limit(resized, dst_path)
    size_kb = os.path.getsize(out_path) / 1024
    w, h = resized.size
    print(f"  {os.path.basename(out_path):28s} {w}x{h}  ratio {w / h:.4f}  ({size_kb:.0f} KB)")


def process_dir(src_dir, out_dir, target_size, mode, label):
    """Process all PNGs in src_dir to out_dir."""
    if not os.path.isdir(src_dir):
        print(f"  SKIP {label}: source not found ({src_dir})")
        return 0

    pngs = sorted(f for f in os.listdir(src_dir) if f.lower().endswith(".png"))
    if not pngs:
        print(f"  SKIP {label}: no PNGs found")
        return 0

    os.makedirs(out_dir, exist_ok=True)
    count = 0
    for png in pngs:
        adapt_screenshot(
            os.path.join(src_dir, png),
            os.path.join(out_dir, png),
            target_size,
            mode,
        )
        count += 1
    return count


def main():
    print("Generating Google Play Store screenshots (exact 9:16)...\n")

    print(f"Phone ({PHONE_SIZE[0]}x{PHONE_SIZE[1]}):")
    phone_count = process_dir(IPHONE_SRC, PHONE_OUT, PHONE_SIZE, "crop", "phone")

    print(f"\n7\" Tablet ({TABLET7_SIZE[0]}x{TABLET7_SIZE[1]}):")
    t7_count = process_dir(IPAD_SRC, TABLET7_OUT, TABLET7_SIZE, "pad", "7\" tablet")

    print(f"\n10\" Tablet ({TABLET10_SIZE[0]}x{TABLET10_SIZE[1]}):")
    t10_count = process_dir(IPAD_SRC, TABLET10_OUT, TABLET10_SIZE, "pad", "10\" tablet")

    total = phone_count + t7_count + t10_count
    print(f"\nDone! {total} Play Store screenshots generated:")
    print(f"  Phone:      {phone_count} ({PHONE_SIZE[0]}x{PHONE_SIZE[1]})")
    print(f"  7\" Tablet:  {t7_count} ({TABLET7_SIZE[0]}x{TABLET7_SIZE[1]})")
    print(f"  10\" Tablet: {t10_count} ({TABLET10_SIZE[0]}x{TABLET10_SIZE[1]})")
    print(f"\nOutput: {PLAY_BASE}")

    if total == 0:
        print("\nError: No screenshots generated. Run generate_marketing_screenshots.py first.", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
