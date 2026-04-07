#!/usr/bin/env python3
"""
Generate an iPad Pro device frame template PNG.

Creates a realistic iPad Pro frame (thin bezels, no Dynamic Island),
saved to assets/device_frame_ipad.png for use by compose_screenshot_ipad.py.

Usage:
    python appstore/scripts/generate_frame_ipad.py
"""

from PIL import Image, ImageDraw
import os

# iPad Pro 12.9" style dimensions — thinner bezels than iPhone
DEVICE_W = 1580
DEVICE_H = 2120
DEVICE_R = 38       # outer corner radius
BEZEL = 20          # frame width
SCREEN_W = DEVICE_W - 2 * BEZEL  # 1540
SCREEN_H = DEVICE_H - 2 * BEZEL  # 2080
SCREEN_R = 30       # inner corner radius

# Colors (same as iPhone frame)
BODY_OUTER = (30, 30, 30, 255)
BODY_INNER = (20, 20, 20, 255)


def rounded_rect(draw, xy, radius, fill):
    """Draw a rounded rectangle."""
    x0, y0, x1, y1 = xy
    draw.rounded_rectangle([x0, y0, x1, y1], radius=radius, fill=fill)


def main():
    img = Image.new("RGBA", (DEVICE_W, DEVICE_H), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    # Outer body
    rounded_rect(draw, (0, 0, DEVICE_W - 1, DEVICE_H - 1), DEVICE_R, BODY_OUTER)
    # Inner body (slight inset for depth)
    rounded_rect(draw, (1, 1, DEVICE_W - 2, DEVICE_H - 2), DEVICE_R - 1, BODY_INNER)

    # Build frame with screen cutout
    body = Image.new("RGBA", (DEVICE_W, DEVICE_H), (0, 0, 0, 0))
    body_draw = ImageDraw.Draw(body)
    rounded_rect(body_draw, (0, 0, DEVICE_W - 1, DEVICE_H - 1), DEVICE_R, BODY_OUTER)
    rounded_rect(body_draw, (1, 1, DEVICE_W - 2, DEVICE_H - 2), DEVICE_R - 1, BODY_INNER)

    # Cut screen hole
    screen_x = BEZEL
    screen_y = BEZEL
    screen_mask = Image.new("L", (DEVICE_W, DEVICE_H), 0)
    sm_draw = ImageDraw.Draw(screen_mask)
    sm_draw.rounded_rectangle(
        [screen_x, screen_y, screen_x + SCREEN_W - 1, screen_y + SCREEN_H - 1],
        radius=SCREEN_R,
        fill=255,
    )
    # Invert: keep frame, cut screen
    frame_mask = Image.new("L", (DEVICE_W, DEVICE_H), 255)
    frame_mask.paste(Image.new("L", (DEVICE_W, DEVICE_H), 0), mask=screen_mask)
    body.putalpha(frame_mask)

    # Save
    out_dir = os.path.join(os.path.dirname(__file__), "assets")
    os.makedirs(out_dir, exist_ok=True)
    out_path = os.path.join(out_dir, "device_frame_ipad.png")
    body.save(out_path, "PNG")
    print(f"iPad device frame saved: {out_path} ({DEVICE_W}x{DEVICE_H})")
    print(f"  Screen area: {SCREEN_W}x{SCREEN_H}, bezel: {BEZEL}px, corner radius: {SCREEN_R}px")


if __name__ == "__main__":
    main()
