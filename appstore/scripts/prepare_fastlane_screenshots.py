#!/usr/bin/env python3
"""
Prepare marketing screenshots for Fastlane upload.

Fastlane's `deliver` expects screenshots organized in locale folders (e.g., en-US/).
Device type is auto-detected from image resolution (1290x2796 → iPhone 6.7").

This script copies marketing screenshots into the expected structure:

    appstore/screenshots/marketing/en-US/
        01-plan.png
        02-chat.png
        ...

Usage:
    python appstore/scripts/prepare_fastlane_screenshots.py
"""

import os
import shutil
import sys

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.abspath(os.path.join(SCRIPT_DIR, "..", ".."))
MARKETING_DIR = os.path.join(PROJECT_ROOT, "appstore", "screenshots", "marketing")
SOURCE_DIR = os.path.join(MARKETING_DIR, "iPhone-6.7")
DEST_DIR = os.path.join(MARKETING_DIR, "en-US")


def main():
    if not os.path.isdir(SOURCE_DIR):
        print(f"Error: Source directory not found: {SOURCE_DIR}", file=sys.stderr)
        print("Run 'python appstore/scripts/generate_marketing_screenshots.py' first.", file=sys.stderr)
        sys.exit(1)

    # Get source PNGs
    pngs = sorted(f for f in os.listdir(SOURCE_DIR) if f.lower().endswith(".png"))
    if not pngs:
        print(f"Error: No PNG files found in {SOURCE_DIR}", file=sys.stderr)
        sys.exit(1)

    # Clear and recreate destination
    if os.path.exists(DEST_DIR):
        shutil.rmtree(DEST_DIR)
    os.makedirs(DEST_DIR)

    # Copy screenshots
    for png in pngs:
        src = os.path.join(SOURCE_DIR, png)
        dst = os.path.join(DEST_DIR, png)
        shutil.copy2(src, dst)

    print(f"Prepared {len(pngs)} screenshots for Fastlane upload:")
    for png in pngs:
        print(f"  en-US/{png}")
    print(f"\nOutput: {DEST_DIR}")
    print("Ready for: bundle exec fastlane upload_marketing_screenshots")


if __name__ == "__main__":
    main()
