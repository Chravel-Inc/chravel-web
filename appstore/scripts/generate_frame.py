#!/usr/bin/env python3
"""
Generate an iPhone device frame template PNG.

Creates a realistic iPhone 15 Pro Max frame with Dynamic Island,
saved to assets/device_frame.png for use by compose_screenshot.py.

Usage:
    python appstore/scripts/generate_frame.py
"""

from PIL import Image, ImageDraw
import os

# Device dimensions (iPhone 15 Pro Max style)
DEVICE_W = 1030
DEVICE_H = 2800
DEVICE_R = 77       # outer corner radius
BEZEL = 15          # frame width
SCREEN_W = DEVICE_W - 2 * BEZEL  # 1000
SCREEN_H = DEVICE_H - 2 * BEZEL  # 2770
SCREEN_R = 62       # inner corner radius

# Dynamic Island
DI_W = 130
DI_H = 38
DI_TOP = 14         # offset from screen top
DI_R = DI_H // 2    # pill shape

# Colors
BODY_OUTER = (30, 30, 30, 255)
BODY_INNER = (20, 20, 20, 255)
BUTTON_CLR = (25, 25, 25, 255)
DI_CLR = (0, 0, 0, 255)


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

    # Screen cutout (transparent)
    screen_x = BEZEL
    screen_y = BEZEL
    mask = Image.new("L", (DEVICE_W, DEVICE_H), 255)
    mask_draw = ImageDraw.Draw(mask)
    mask_draw.rounded_rectangle(
        [screen_x, screen_y, screen_x + SCREEN_W - 1, screen_y + SCREEN_H - 1],
        radius=SCREEN_R,
        fill=0,
    )
    img.putalpha(mask)
    # Re-draw body on top of alpha
    body = Image.new("RGBA", (DEVICE_W, DEVICE_H), (0, 0, 0, 0))
    body_draw = ImageDraw.Draw(body)
    rounded_rect(body_draw, (0, 0, DEVICE_W - 1, DEVICE_H - 1), DEVICE_R, BODY_OUTER)
    rounded_rect(body_draw, (1, 1, DEVICE_W - 2, DEVICE_H - 2), DEVICE_R - 1, BODY_INNER)
    # Cut screen hole
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

    # Dynamic Island
    di_x = (DEVICE_W - DI_W) // 2
    di_y = screen_y + DI_TOP
    body_draw_final = ImageDraw.Draw(body)
    body_draw_final.rounded_rectangle(
        [di_x, di_y, di_x + DI_W, di_y + DI_H],
        radius=DI_R,
        fill=DI_CLR,
    )

    # Side buttons
    buttons = [
        # Power (right side)
        (DEVICE_W, 340, DEVICE_W + 4, 460, 2),
        # Volume up (left side)
        (-4, 280, 0, 360, 2),
        # Volume down (left side)
        (-4, 380, 0, 460, 2),
        # Silent switch (left side)
        (-4, 180, 0, 220, 2),
    ]
    for bx0, by0, bx1, by1, br in buttons:
        body_draw_final.rounded_rectangle([bx0, by0, bx1, by1], radius=br, fill=BUTTON_CLR)

    # Save
    out_dir = os.path.join(os.path.dirname(__file__), "assets")
    os.makedirs(out_dir, exist_ok=True)
    out_path = os.path.join(out_dir, "device_frame.png")
    body.save(out_path, "PNG")
    print(f"Device frame saved: {out_path} ({DEVICE_W}x{DEVICE_H})")
    print(f"  Screen area: {SCREEN_W}x{SCREEN_H}, bezel: {BEZEL}px, corner radius: {SCREEN_R}px")


if __name__ == "__main__":
    main()
