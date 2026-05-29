# Word Videos — How the System Works

## Overview

When a child answers a letter correctly, LetterBrain plays a short video reward.
There are three video modes, controlled by a toggle on the start screen:

| Mode | What plays |
|------|-----------|
| **Word Videos** (default) | A fun/funny clip related to the letter's word |
| **Phonetics** (BETA toggle) | A ~5-second phonics mouth-shape clip from a dedicated phonics video |

---

## WordVideos.json

All word video data lives in `WordVideos.json` at the project root.
`app.js` fetches this file at startup — no video data is hardcoded in JS.

### Structure

```json
{
  "video_id": "a_DRSc0oZV0",
  "letters": {
    "A": {
      "word": "Apple",
      "vidStart": 5,
      "vidEnd": 12,
      "funnyShort": "AkPv9ohAUWw"
    },
    "Z": {
      "word": "Zebra",
      "vidStart": 203,
      "vidEnd": 210
    }
  }
}
```

### Fields per letter

| Field | Description |
|-------|-------------|
| `word` | The word shown in the game |
| `vidStart` / `vidEnd` | Timestamps (seconds) in the archive YouTube video (`video_id`) |
| `localVid` | Path to a local video file (e.g. `videos/fensi.mp4`) — used for F, G, I |
| `funnyShort` | YouTube Shorts ID to play instead of the archive clip |

### Priority (Word Videos mode)

1. If `funnyShort` is set → play that YouTube Short (capped at 20 seconds)
2. Else if `localVid` is set → play the local video file
3. Else → play the archive clip using `vidStart`/`vidEnd`

---

## Funny Shorts — Current assignments

| Letter | Word | Short ID | URL |
|--------|------|----------|-----|
| A | Apple | AkPv9ohAUWw | https://www.youtube.com/shorts/AkPv9ohAUWw |
| B | Ball | tzBoE0ipsYU | https://www.youtube.com/shorts/tzBoE0ipsYU |
| C | Cat | z4OC3pYuOUw | https://www.youtube.com/shorts/z4OC3pYuOUw |
| D | Dog | XkwS5l157GA | https://www.youtube.com/shorts/XkwS5l157GA |
| E | Elephant | 0tczXVZ4C-s | https://www.youtube.com/shorts/0tczXVZ4C-s |
| H | House | UHHrjoxeZWw | https://www.youtube.com/shorts/UHHrjoxeZWw |
| J | Joker | Eojxofb7tUA | https://www.youtube.com/shorts/Eojxofb7tUA |
| K | King | NssKVMttrQs | https://www.youtube.com/shorts/NssKVMttrQs |
| L | Lion | k3ZM9Z9LXoc | https://www.youtube.com/shorts/k3ZM9Z9LXoc |

---

## How to change or revert a funny video

**Add a funny video** — add `funnyShort` to a letter entry in `WordVideos.json`:
```json
"F": { "word": "Fish", "localVid": "videos/fensi.mp4", "funnyShort": "YOUR_SHORT_ID" }
```

**Revert to the archive video** — remove the `funnyShort` field:
```json
"F": { "word": "Fish", "localVid": "videos/fensi.mp4" }
```

No changes to `app.js` are ever needed — just edit the JSON.

---

## Phonetics mode

Phonics timestamps live in `videos/phonics_timestamps.json`.
Each letter maps to a start time (seconds) in the YouTube video `svmmuYQPrI4`.
The app plays 5 seconds from that timestamp.
Phonetics mode is on by default and can be toggled off on the start screen.
