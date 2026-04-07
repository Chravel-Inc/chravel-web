#!/usr/bin/env python3
"""
Generate all Chravel marketing App Store screenshots.

Takes raw simulator screenshots from appstore/screenshots/iPhone-6.7/
and creates polished marketing versions with device frames, benefit headlines,
and Chravel's premium dark/gold branding.

Usage:
    python appstore/scripts/generate_marketing_screenshots.py

Output:
    appstore/screenshots/marketing/iPhone-6.7/*.png  (8 marketing screenshots)
    appstore/screenshots/marketing/showcase.png       (side-by-side preview)
"""

import os
import sys
import subprocess

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.abspath(os.path.join(SCRIPT_DIR, "..", ".."))
RAW_DIR = os.path.join(PROJECT_ROOT, "appstore", "screenshots", "iPhone-6.7")
OUT_DIR = os.path.join(PROJECT_ROOT, "appstore", "screenshots", "marketing", "iPhone-6.7")
IPAD_RAW_DIR = os.path.join(PROJECT_ROOT, "appstore", "screenshots", "iPad-Pro-12.9")
IPAD_OUT_DIR = os.path.join(PROJECT_ROOT, "appstore", "screenshots", "marketing", "iPad-Pro-12.9")

# Chravel brand palette — premium dark backgrounds with gold accents
SCREENSHOTS = [
    {
        "raw": "01-home-dashboard.png",
        "out": "01-plan.png",
        "verb": "PLAN",
        "desc": "YOUR NEXT ADVENTURE",
        "bg": "#0A0A0A",
    },
    {
        "raw": "02-trip-chat.png",
        "out": "02-chat.png",
        "verb": "CHAT",
        "desc": "WITH YOUR GROUP",
        "bg": "#1A1207",
    },
    {
        "raw": "03-calendar-itinerary.png",
        "out": "03-organize.png",
        "verb": "ORGANIZE",
        "desc": "EVERY DETAIL",
        "bg": "#0D1117",
    },
    {
        "raw": "04-ai-concierge.png",
        "out": "04-ask.png",
        "verb": "ASK",
        "desc": "YOUR AI TRAVEL GUIDE",
        "bg": "#170D06",
    },
    {
        "raw": "05-expense-splitting.png",
        "out": "05-split.png",
        "verb": "SPLIT",
        "desc": "EXPENSES EFFORTLESSLY",
        "bg": "#0A0A0A",
    },
    {
        "raw": "06-maps-places.png",
        "out": "06-discover.png",
        "verb": "DISCOVER",
        "desc": "AMAZING PLACES",
        "bg": "#0D1117",
    },
    {
        "raw": "07-media-gallery.png",
        "out": "07-share.png",
        "verb": "SHARE",
        "desc": "TRIP MEMORIES",
        "bg": "#1A1207",
    },
    {
        "raw": "08-polls-voting.png",
        "out": "08-decide.png",
        "verb": "DECIDE",
        "desc": "TOGETHER",
        "bg": "#170D06",
    },
]


IPAD_SCREENSHOTS = [
    {
        "raw": "01-home-dashboard.png",
        "out": "01-plan.png",
        "verb": "PLAN",
        "desc": "YOUR NEXT ADVENTURE",
        "bg": "#0A0A0A",
    },
    {
        "raw": "02-trip-chat.png",
        "out": "02-chat.png",
        "verb": "CHAT",
        "desc": "WITH YOUR GROUP",
        "bg": "#1A1207",
    },
    {
        "raw": "03-calendar-itinerary.png",
        "out": "03-organize.png",
        "verb": "ORGANIZE",
        "desc": "EVERY DETAIL",
        "bg": "#0D1117",
    },
    {
        "raw": "04-maps-places.png",
        "out": "04-discover.png",
        "verb": "DISCOVER",
        "desc": "AMAZING PLACES",
        "bg": "#0D1117",
    },
]


def main():
    # Step 1: Ensure device frame exists
    frame_path = os.path.join(SCRIPT_DIR, "assets", "device_frame.png")
    if not os.path.exists(frame_path):
        print("Generating device frame...")
        result = subprocess.run(
            [sys.executable, os.path.join(SCRIPT_DIR, "generate_frame.py")],
            capture_output=True, text=True,
        )
        if result.returncode != 0:
            print(f"Error generating frame: {result.stderr}", file=sys.stderr)
            sys.exit(1)
        print(result.stdout)

    # Step 2: Generate marketing screenshots
    print(f"\nGenerating {len(SCREENSHOTS)} marketing screenshots...")
    print(f"  Source: {RAW_DIR}")
    print(f"  Output: {OUT_DIR}\n")

    os.makedirs(OUT_DIR, exist_ok=True)
    generated = []
    failures = []

    for shot in SCREENSHOTS:
        raw_path = os.path.join(RAW_DIR, shot["raw"])
        out_path = os.path.join(OUT_DIR, shot["out"])

        if not os.path.exists(raw_path):
            print(f"  SKIP: {shot['raw']} (not found)")
            continue

        result = subprocess.run(
            [
                sys.executable, os.path.join(SCRIPT_DIR, "compose_screenshot.py"),
                "--bg", shot["bg"],
                "--verb", shot["verb"],
                "--desc", shot["desc"],
                "--screenshot", raw_path,
                "--output", out_path,
            ],
            capture_output=True, text=True,
        )
        if result.returncode != 0:
            print(f"  ERROR: {shot['out']}: {result.stderr}", file=sys.stderr)
            failures.append(shot["out"])
        else:
            print(result.stdout.strip())
            generated.append(out_path)

    # Step 3: Generate showcase preview (first 3 screenshots)
    if len(generated) >= 3:
        showcase_path = os.path.join(PROJECT_ROOT, "appstore", "screenshots", "marketing", "showcase.png")
        print(f"\nGenerating showcase preview...")
        result = subprocess.run(
            [
                sys.executable, os.path.join(SCRIPT_DIR, "showcase.py"),
                "--screenshots", *generated[:3],
                "--output", showcase_path,
                "--label", "Chravel — Travel Together",
            ],
            capture_output=True, text=True,
        )
        if result.returncode != 0:
            print(f"Error generating showcase: {result.stderr}", file=sys.stderr)
        else:
            print(result.stdout.strip())

    # Step 4: Generate iPad device frame
    ipad_frame_path = os.path.join(SCRIPT_DIR, "assets", "device_frame_ipad.png")
    if not os.path.exists(ipad_frame_path):
        print("\nGenerating iPad device frame...")
        result = subprocess.run(
            [sys.executable, os.path.join(SCRIPT_DIR, "generate_frame_ipad.py")],
            capture_output=True, text=True,
        )
        if result.returncode != 0:
            print(f"Error generating iPad frame: {result.stderr}", file=sys.stderr)
        else:
            print(result.stdout)

    # Step 5: Generate iPad marketing screenshots
    print(f"\nGenerating {len(IPAD_SCREENSHOTS)} iPad marketing screenshots...")
    print(f"  Source: {IPAD_RAW_DIR}")
    print(f"  Output: {IPAD_OUT_DIR}\n")

    os.makedirs(IPAD_OUT_DIR, exist_ok=True)
    ipad_generated = []

    for shot in IPAD_SCREENSHOTS:
        raw_path = os.path.join(IPAD_RAW_DIR, shot["raw"])
        out_path = os.path.join(IPAD_OUT_DIR, shot["out"])

        if not os.path.exists(raw_path):
            print(f"  SKIP: {shot['raw']} (not found in iPad-Pro-12.9)")
            continue

        result = subprocess.run(
            [
                sys.executable, os.path.join(SCRIPT_DIR, "compose_screenshot_ipad.py"),
                "--bg", shot["bg"],
                "--verb", shot["verb"],
                "--desc", shot["desc"],
                "--screenshot", raw_path,
                "--output", out_path,
            ],
            capture_output=True, text=True,
        )
        if result.returncode != 0:
            print(f"  ERROR: {shot['out']}: {result.stderr}", file=sys.stderr)
            failures.append(f"iPad/{shot['out']}")
        else:
            print(result.stdout.strip())
            ipad_generated.append(out_path)

    total_gen = len(generated) + len(ipad_generated)
    total_expected = len(SCREENSHOTS) + len(IPAD_SCREENSHOTS)
    print(f"\nDone! {total_gen}/{total_expected} marketing screenshots generated ({len(generated)} iPhone, {len(ipad_generated)} iPad).")

    if failures:
        print(f"\nFailed: {', '.join(failures)}", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
