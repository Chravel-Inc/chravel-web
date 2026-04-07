#!/usr/bin/env python3
"""
Adapt Chravel marketing screenshots for Google Play Store.

Takes existing App Store marketing composites (iPhone + iPad) and crops/resizes
them to meet Play Store dimension and aspect ratio requirements.

Play Store constraints:
  - Format: 24-bit PNG or JPEG, no alpha, max 8MB
  - Min 320px, Max 3840px per side
  - Aspect ratio max 2:1 (longer side <= 2x shorter side)
  - Phone:      1080x1920  (9:16)   — 2-8 screenshots
  - 7" Tablet:  1200x1920  (10:16)  — 4-8 screenshots
  - 10" Tablet: 1800x2560  (~9:16)  — 4-8 screenshots

Approach: center-crop source to target aspect ratio, then resize.

Usage:
    python appstore/scripts/generate_playstore_screenshots.py

Output:
    playstore/screenshots/phone/*.png       (8 screenshots, 1080x1920)
    playstore/screenshots/tablet-7/*.png    (4 screenshots, 1200x1920)
    playstore/screenshots/tablet-10/*.png   (4 screenshots, 1800x2560)
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

# Target dimensions
PHONE_SIZE = (1080, 1920)
TABLET7_SIZE = (1200, 1920)
TABLET10_SIZE = (1800, 2560)


def center_crop_to_aspect(img, target_w, target_h):
    """Crop image from center to match target aspect ratio."""
    src_w, src_h = img.size
    target_ratio = target_w / target_h
    src_ratio = src_w / src_h

    if src_ratio > target_ratio:
        # Source is wider — crop width
        new_w = int(src_h * target_ratio)
        offset = (src_w - new_w) // 2
        return img.crop((offset, 0, offset + new_w, src_h))
    elif src_ratio < target_ratio:
        # Source is taller — crop height from bottom (preserve headline at top)
        new_h = int(src_w / target_ratio)
        return img.crop((0, 0, src_w, new_h))
    return img


def adapt_screenshot(src_path, dst_path, target_size):
    """Crop to target aspect ratio, resize, save as RGB PNG (no alpha)."""
    img = Image.open(src_path).convert("RGBA")
    cropped = center_crop_to_aspect(img, target_size[0], target_size[1])
    resized = cropped.resize(target_size, Image.LANCZOS)
    # Save as RGB (no alpha) — Play Store requirement
    resized.convert("RGB").save(dst_path, "PNG")
    size_kb = os.path.getsize(dst_path) / 1024
    print(f"  {os.path.basename(dst_path):30s} {target_size[0]}x{target_size[1]}  ({size_kb:.0f} KB)")


def process_dir(src_dir, out_dir, target_size, label):
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
        )
        count += 1
    return count


def main():
    print("Generating Google Play Store screenshots from App Store marketing composites...\n")

    # Phone screenshots from iPhone composites
    print(f"Phone ({PHONE_SIZE[0]}x{PHONE_SIZE[1]}):")
    phone_count = process_dir(IPHONE_SRC, PHONE_OUT, PHONE_SIZE, "phone")

    # 7" Tablet screenshots from iPad composites
    print(f"\n7\" Tablet ({TABLET7_SIZE[0]}x{TABLET7_SIZE[1]}):")
    t7_count = process_dir(IPAD_SRC, TABLET7_OUT, TABLET7_SIZE, "7\" tablet")

    # 10" Tablet screenshots from iPad composites
    print(f"\n10\" Tablet ({TABLET10_SIZE[0]}x{TABLET10_SIZE[1]}):")
    t10_count = process_dir(IPAD_SRC, TABLET10_OUT, TABLET10_SIZE, "10\" tablet")

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
