# gTTS Audio Generation for Kannada Vowels

## Overview

We use Google Text-to-Speech (`gtts`) to generate voiceover audio for Kannada vowels, mixed with a background music track. This produces clean, natural-sounding Kannada pronunciation.

## Requirements

- Python 3.9 (system Python via Xcode): `/Applications/Xcode.app/Contents/Developer/usr/bin/python3`
- `gtts` library: installed via `/usr/bin/pip3 install gtts`
- `ffmpeg` (already available on the machine)
- Background music files in `background/`

## Audio Format

Each clip says:
> **letter** *(long pause ~1s)* **word** *(short pause ~0.4s)* **word**

e.g. for ಇ: *"ಇ … ಇಟ್ಟಿಗೆ … ಇಟ್ಟಿಗೆ"*

## Mix Settings

- Voiceover: **6× volume boost** (gTTS output is quiet by default)
- Background music: **−18 dB** (soft, under the voice)
- Background track chosen: `Dancing Bee (Upbeat Happy Background Music).mp3`
- Output format: `.mp3`, `-q:a 2`

## Generation Script (one vowel)

```bash
SCRATCH="/tmp/gtts_work"
mkdir -p "$SCRATCH"
BG="background/Dancing Bee (Upbeat Happy Background Music).mp3"
LETTER="ಇ"
WORD="ಇಟ್ಟಿಗೆ"
ROMAN="i"
OUT="audio/kannada/${ROMAN}.mp3"

# Step 1 — generate voice parts
python3 -c "
from gtts import gTTS
gTTS('$LETTER', lang='kn').save('$SCRATCH/p1.mp3')
gTTS('$WORD',   lang='kn').save('$SCRATCH/p2.mp3')
gTTS('$WORD',   lang='kn').save('$SCRATCH/p3.mp3')
"

# Step 2 — generate silences
ffmpeg -y -f lavfi -i anullsrc=r=24000:cl=mono -t 1.0 -q:a 2 "$SCRATCH/long.mp3"  -loglevel quiet
ffmpeg -y -f lavfi -i anullsrc=r=24000:cl=mono -t 0.4 -q:a 2 "$SCRATCH/short.mp3" -loglevel quiet

# Step 3 — concatenate voiceover
ffmpeg -y \
  -i "$SCRATCH/p1.mp3" -i "$SCRATCH/long.mp3" \
  -i "$SCRATCH/p2.mp3" -i "$SCRATCH/short.mp3" \
  -i "$SCRATCH/p3.mp3" \
  -filter_complex "[0][1][2][3][4]concat=n=5:v=0:a=1" \
  -q:a 2 "$SCRATCH/vo.mp3" -loglevel quiet

# Step 4 — mix with background
ffmpeg -y \
  -i "$SCRATCH/vo.mp3" \
  -i "$BG" \
  -filter_complex "[0]volume=6.0[vo]; [1]volume=-18dB[bg]; [vo][bg]amix=inputs=2:duration=first" \
  -q:a 2 "$OUT" -loglevel quiet
```

## Vowel → Word Mapping

| Letter | Roman | Word | Status |
|--------|-------|------|--------|
| ಅ | a | ಅರಮನೆ | pending |
| ಆ | aa | ಆಮೆ | pending |
| ಇ | i | ಇಟ್ಟಿಗೆ | ✅ test done |
| ಈ | ii | ? | word needed |
| ಉ | u | ಉಗುರು | pending |
| ಊ | uu | ಊಟ | pending |
| ಋ | ru | ಋಷಿ | pending |
| ಎ | e | ಎಲೆ | pending |
| ಏ | E | ಏಣಿ | pending |
| ಐ | ai | ಐವರು | pending |
| ಒ | o | ಒಣಫಲ | pending |
| ಓ | oo | ಓಟ | pending |
| ಔ | au | ಔಷಧಿ | pending |
| ಅಂ | am | ? | word needed |
| ಅಃ | ah | ? | word needed |

## Notes

- The `gtts` output for Kannada is quiet — always boost voiceover by at least 6× before mixing.
- `python3` must be the Xcode system Python (`/Applications/Xcode.app/Contents/Developer/usr/bin/python3`) since the venv Python path is broken.
- These files will replace the existing `audio/kannada/` vowel clips (a.mp3 through ah.mp3).
- Once all 15 words are confirmed, run the full batch script.
