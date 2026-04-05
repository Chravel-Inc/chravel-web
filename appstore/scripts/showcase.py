#!/usr/bin/env python3
"""
Generate a side-by-side showcase preview of marketing screenshots.

Usage:
    python appstore/scripts/showcase.py \
        --screenshots img1.png img2.png img3.png \
        --output appstore/screenshots/marketing/showcase.png
"""

from PIL import Image, ImageDraw, ImageFont
import argparse
import os

PADDING = 60
GAP = 40
TARGET_H = 800
BG_COLOR = (255, 255, 255)

# Font search paths
FONT_PATHS = [
    "/Library/Fonts/SF-Pro-Display-Regular.otf",
    "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
    "/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf",
]


def find_font():
    for path in FONT_PATHS:
        if os.path.exists(path):
            return path
    return None


def fit_text_font(text, max_w, size_max=48, size_min=16):
    font_path = find_font()
    for size in range(size_max, size_min - 1, -2):
        if font_path:
            font = ImageFont.truetype(font_path, size)
        else:
            font = ImageFont.load_default()
            break
        bbox = font.getbbox(text)
        if (bbox[2] - bbox[0]) <= max_w:
            return font
    return font


def main():
    parser = argparse.ArgumentParser(description="Generate screenshot showcase preview")
    parser.add_argument("--screenshots", nargs="+", required=True, help="Paths to marketing screenshots")
    parser.add_argument("--output", required=True, help="Output path for showcase image")
    parser.add_argument("--label", default=None, help="Optional label text at bottom")
    args = parser.parse_args()

    images = []
    for path in args.screenshots:
        img = Image.open(path).convert("RGBA")
        scale = TARGET_H / img.height
        new_w = int(img.width * scale)
        images.append(img.resize((new_w, TARGET_H), Image.LANCZOS))

    total_w = PADDING * 2 + sum(img.width for img in images) + GAP * (len(images) - 1)
    bottom_bar = 100 if args.label else 0
    total_h = PADDING * 2 + TARGET_H + bottom_bar

    canvas = Image.new("RGB", (total_w, total_h), BG_COLOR)
    x = PADDING
    for img in images:
        canvas.paste(img.convert("RGB"), (x, PADDING))
        x += img.width + GAP

    if args.label:
        draw = ImageDraw.Draw(canvas)
        label_y = PADDING + TARGET_H + bottom_bar // 2
        font = fit_text_font(args.label, total_w - 2 * PADDING)
        draw.text((total_w // 2, label_y), args.label, fill=(0, 0, 0), font=font, anchor="mm")

    os.makedirs(os.path.dirname(args.output), exist_ok=True)
    canvas.save(args.output, "PNG")
    print(f"Showcase saved: {args.output} ({total_w}x{total_h})")


if __name__ == "__main__":
    main()
