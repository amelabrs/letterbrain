#!/usr/bin/env python3
"""
Extract video URLs from a YouTube channel using yt-dlp.

Usage:
    pip install yt-dlp
    python extract_channel_videos.py

Output: prints video IDs and URLs, one per line.
"""

import subprocess
import json
import sys

CHANNEL_URL = "https://www.youtube.com/@MerryDailyEnglish/videos"

def extract_videos():
    """Use yt-dlp to get video metadata from the channel."""
    cmd = [
        "yt-dlp",
        "--flat-playlist",
        "--dump-json",
        "--no-warnings",
        CHANNEL_URL
    ]

    print(f"Fetching videos from: {CHANNEL_URL}\n")

    result = subprocess.run(cmd, capture_output=True, text=True)
    if result.returncode != 0:
        print(f"Error: {result.stderr}", file=sys.stderr)
        print("\nMake sure yt-dlp is installed: pip install yt-dlp")
        sys.exit(1)

    videos = []
    for line in result.stdout.strip().split("\n"):
        if not line:
            continue
        data = json.loads(line)
        videos.append({
            "id": data.get("id"),
            "title": data.get("title"),
            "url": f"https://www.youtube.com/watch?v={data.get('id')}",
            "duration": data.get("duration"),
        })

    print(f"Found {len(videos)} videos:\n")
    print(f"{'#':<4} {'ID':<12} {'Duration':<10} {'Title'}")
    print("-" * 80)
    for i, v in enumerate(videos, 1):
        dur = f"{v['duration']//60}:{v['duration']%60:02d}" if v['duration'] else "?"
        print(f"{i:<4} {v['id']:<12} {dur:<10} {v['title']}")

    # Also output as a JS array for easy pasting into app.js
    print("\n\n// JS array for app.js CARTOON_IDS:")
    print("const CARTOON_IDS = [")
    for v in videos:
        print(f'    "{v["id"]}",  // {v["title"]}')
    print("];")

    return videos


if __name__ == "__main__":
    extract_videos()
