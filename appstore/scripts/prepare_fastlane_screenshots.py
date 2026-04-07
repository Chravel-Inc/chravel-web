#!/usr/bin/env python3
"""
Prepare marketing screenshots for Fastlane upload.

Fastlane's `deliver` expects screenshots organized in locale folders (e.g., en-US/).
Device type is auto-detected from image resolution:
    1290x2796 → iPhone 6.7"
    2048x2732 → iPad Pro 12.9" (3rd gen)

This script copies marketing screenshots into the expected structure:

    appstore/screenshots/marketing/en-US/
        01-plan.png          (iPhone 6.7")
        02-chat.png          (iPhone 6.7")
        ...
        ipad-01-plan.png     (iPad Pro 12.9")
        ipad-02-chat.png     (iPad Pro 12.9")
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
IPHONE_DIR = os.path.join(MARKETING_DIR, "iPhone-6.7")
IPAD_DIR = os.path.join(MARKETING_DIR, "iPad-Pro-12.9")
DEST_DIR = os.path.join(MARKETING_DIR, "en-US")


def main():
    if not os.path.isdir(IPHONE_DIR):
        print(f"Error: Source directory not found: {IPHONE_DIR}", file=sys.stderr)
        print("Run 'python appstore/scripts/generate_marketing_screenshots.py' first.", file=sys.stderr)
        sys.exit(1)

    # Get source PNGs
    iphone_pngs = sorted(f for f in os.listdir(IPHONE_DIR) if f.lower().endswith(".png"))
    ipad_pngs = sorted(f for f in os.listdir(IPAD_DIR) if f.lower().endswith(".png")) if os.path.isdir(IPAD_DIR) else []

    if not iphone_pngs:
        print(f"Error: No PNG files found in {IPHONE_DIR}", file=sys.stderr)
        sys.exit(1)

    # Clear and recreate destination
    if os.path.exists(DEST_DIR):
        shutil.rmtree(DEST_DIR)
    os.makedirs(DEST_DIR)

    # Copy iPhone screenshots
    for png in iphone_pngs:
        src = os.path.join(IPHONE_DIR, png)
        dst = os.path.join(DEST_DIR, png)
        shutil.copy2(src, dst)

    # Copy iPad screenshots (prefixed to avoid name collisions)
    for png in ipad_pngs:
        src = os.path.join(IPAD_DIR, png)
        dst = os.path.join(DEST_DIR, f"ipad-{png}")
        shutil.copy2(src, dst)

    total = len(iphone_pngs) + len(ipad_pngs)
    print(f"Prepared {total} screenshots for Fastlane upload ({len(iphone_pngs)} iPhone, {len(ipad_pngs)} iPad):")
    for png in iphone_pngs:
        print(f"  en-US/{png} (iPhone 6.7\")")
    for png in ipad_pngs:
        print(f"  en-US/ipad-{png} (iPad Pro 12.9\")")
    print(f"\nOutput: {DEST_DIR}")
    print("Ready for: bundle exec fastlane upload_marketing_screenshots")


if __name__ == "__main__":
    main()
