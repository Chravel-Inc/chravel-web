#!/usr/bin/env python3
"""
Compose a polished App Store marketing screenshot.

Layers a headline (action verb + descriptor), app screenshot in a device frame,
onto a solid colored background. Output is App Store-compliant 1290x2796 PNG.

Usage:
    python appstore/scripts/compose_screenshot.py \
        --bg "#0A0A0A" \
        --verb "PLAN" \
        --desc "YOUR NEXT ADVENTURE" \
        --screenshot appstore/screenshots/iPhone-6.7/01-home-dashboard.png \
        --output appstore/screenshots/marketing/iPhone-6.7/01-plan.png

    Optional:
        --text-color "#FFFFFF"       (default: white)
        --desc-color "#c49746"       (default: gold — Chravel brand)
"""

from PIL import Image, ImageDraw, ImageFont
import argparse
import os
import sys

# Canvas dimensions (iPhone 6.7" App Store requirement)
CANVAS_W = 1290
CANVAS_H = 2796

# Device frame dimensions (must match generate_frame.py)
DEVICE_W = 1030
BEZEL = 15
SCREEN_W = DEVICE_W - 2 * BEZEL  # 1000
SCREEN_R = 62

# Layout
DEVICE_Y = 720           # y position of device frame top
TEXT_TOP = 180            # y position of first text line
MAX_TEXT_W = int(CANVAS_W * 0.92)
VERB_DESC_GAP = 20       # gap between verb and descriptor
DESC_LINE_GAP = 24       # gap between descriptor lines

# Font settings
VERB_SIZE_MAX = 256
VERB_SIZE_MIN = 150
DESC_SIZE = 124

# Font search paths (macOS + Linux)
FONT_PATHS = [
    # macOS — SF Pro Display Black (preferred; requires Apple SF Pro dev fonts)
    "/Library/Fonts/SF-Pro-Display-Black.otf",
    "/System/Library/Fonts/SF-Pro-Display-Black.otf",
    # macOS — guaranteed system fonts (heavy weights for headlines)
    "/System/Library/Fonts/Supplemental/Arial Black.ttf",
    "/System/Library/Fonts/Supplemental/Impact.ttf",
    "/System/Library/Fonts/Supplemental/Arial Bold.ttf",
    # Linux (CI / sandbox)
    "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
    "/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf",
    "/usr/share/fonts/truetype/freefont/FreeSansBold.ttf",
]


def find_font():
    """Find the first available bold font."""
    for path in FONT_PATHS:
        if os.path.exists(path):
            return path
    return None


def hex_to_rgb(h):
    """Convert hex color string to RGB tuple."""
    h = h.lstrip("#")
    return tuple(int(h[i:i + 2], 16) for i in (0, 2, 4))


def get_font(size):
    """Load font at given size, with fallback."""
    font_path = find_font()
    if font_path:
        return ImageFont.truetype(font_path, size)
    return ImageFont.load_default()


def fit_font(text, max_w, size_max, size_min):
    """Find the largest font size where text fits within max_w."""
    for size in range(size_max, size_min - 1, -4):
        font = get_font(size)
        bbox = font.getbbox(text)
        w = bbox[2] - bbox[0]
        if w <= max_w:
            return font
    return get_font(size_min)


def word_wrap(draw, text, font, max_w):
    """Split text into lines that fit within max_w."""
    words = text.split()
    lines = []
    current = ""
    for word in words:
        test = f"{current} {word}".strip()
        bbox = font.getbbox(test)
        w = bbox[2] - bbox[0]
        if w <= max_w and current:
            current = test
        elif not current:
            current = word
        else:
            lines.append(current)
            current = word
    if current:
        lines.append(current)
    return lines


def draw_centered(draw, y, text, font, fill, max_w=None):
    """Draw text centered horizontally. Returns y after last line."""
    if max_w:
        lines = word_wrap(draw, text, font, max_w)
    else:
        lines = [text]
    cx = CANVAS_W // 2
    for i, line in enumerate(lines):
        draw.text((cx, y), line, font=font, fill=fill, anchor="mt")
        bbox = font.getbbox(line)
        line_h = bbox[3] - bbox[1]
        y += line_h + (DESC_LINE_GAP if i < len(lines) - 1 else 0)
    return y


def compose(bg_hex, verb, desc, screenshot_path, output_path, text_color="#FFFFFF", desc_color="#c49746"):
    """Compose a marketing screenshot."""
    bg_rgb = hex_to_rgb(bg_hex)
    text_rgb = hex_to_rgb(text_color)
    desc_rgb = hex_to_rgb(desc_color)

    # Create canvas
    canvas = Image.new("RGBA", (CANVAS_W, CANVAS_H), bg_rgb + (255,))
    draw = ImageDraw.Draw(canvas)

    # Fit verb text
    verb_font = fit_font(verb, MAX_TEXT_W, VERB_SIZE_MAX, VERB_SIZE_MIN)

    # Descriptor font (fixed size)
    desc_font = get_font(DESC_SIZE)

    # Draw text
    y = TEXT_TOP
    y = draw_centered(draw, y, verb, verb_font, text_rgb)
    y += VERB_DESC_GAP
    draw_centered(draw, y, desc, desc_font, desc_rgb, max_w=MAX_TEXT_W)

    # Load and scale screenshot
    screenshot = Image.open(screenshot_path).convert("RGBA")
    scale = SCREEN_W / screenshot.width
    new_h = int(screenshot.height * scale)
    screenshot = screenshot.resize((SCREEN_W, new_h), Image.LANCZOS)

    # Apply rounded corners to screenshot
    mask = Image.new("L", (SCREEN_W, new_h), 0)
    mask_draw = ImageDraw.Draw(mask)
    mask_draw.rounded_rectangle([0, 0, SCREEN_W - 1, new_h - 1], radius=SCREEN_R, fill=255)
    screenshot.putalpha(mask)

    # Position screenshot within device frame area
    device_x = (CANVAS_W - DEVICE_W) // 2
    screen_x = device_x + BEZEL
    screen_y = DEVICE_Y + BEZEL
    canvas.alpha_composite(screenshot, (screen_x, screen_y))

    # Load and overlay device frame
    frame_path = os.path.join(os.path.dirname(__file__), "assets", "device_frame.png")
    if os.path.exists(frame_path):
        frame = Image.open(frame_path).convert("RGBA")
        canvas.alpha_composite(frame, (device_x, DEVICE_Y))
    else:
        print(f"Warning: Device frame not found at {frame_path}. Run generate_frame.py first.", file=sys.stderr)

    # Save as RGB PNG
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    canvas.convert("RGB").save(output_path, "PNG")
    print(f"  Created: {output_path} ({CANVAS_W}x{CANVAS_H})")


def main():
    parser = argparse.ArgumentParser(description="Compose App Store marketing screenshot")
    parser.add_argument("--bg", required=True, help="Background color hex (e.g. #0A0A0A)")
    parser.add_argument("--verb", required=True, help="Action verb headline (e.g. PLAN)")
    parser.add_argument("--desc", required=True, help="Descriptor text (e.g. YOUR NEXT ADVENTURE)")
    parser.add_argument("--screenshot", required=True, help="Path to raw app screenshot")
    parser.add_argument("--output", required=True, help="Output path for marketing screenshot")
    parser.add_argument("--text-color", default="#FFFFFF", help="Headline text color (default: white)")
    parser.add_argument("--desc-color", default="#c49746", help="Descriptor text color (default: Chravel gold)")
    args = parser.parse_args()

    compose(args.bg, args.verb, args.desc, args.screenshot, args.output, args.text_color, args.desc_color)


if __name__ == "__main__":
    main()
