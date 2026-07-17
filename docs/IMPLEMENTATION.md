# LetterBrain — Implementation Reference

> Last updated: 2026-07-17. Reflects app.js v38.

---

## File Map

```
letterbrain/
├── index.html              — Single HTML shell; all screens live here as hidden divs
├── app.js                  — All game logic (~2200 lines)
├── style.css               — Chalkboard Pop theme (dark bg, neon borders) + Rainbow Trail toggle
├── manifest.json           — PWA metadata
│
├── images/                 — PNG/JPG assets (A–Z letters, Kannada, Hindi, word family images)
├── videos/                 — Local mp4 overrides (only ee.mp4 for ಈ special case)
├── audio/
│   ├── kannada.mp3         — Full Kannada vowel recording (source for splicing)
│   ├── kannada/            — Pre-spliced individual vowel clips: a.mp3, aa.mp3, i.mp3, …
│   ├── hindi/              — Pre-spliced individual consonant clips: ka.mp3, kha.mp3, …
│   └── blends/             — Pre-spliced blend clips: at.mp3, og.mp3, un.mp3, th.mp3
│
├── docs/
│   ├── IMPLEMENTATION.md   — This file
│   └── word-videos.md      — Video reward system docs
│
└── scripts/
    └── extract_channel_videos.py
```

---

## Architecture

Vanilla JS PWA. No framework, no build step. All screens are `<div class="screen">` elements; only one carries `class="active"` at a time. Switching via `showScreen(id)`.

```
#start-screen   — Tab selector + level grid + settings
#quiz-screen    — Active gameplay: letter/image display + choice buttons
#done-screen    — Post-round score
```

Two overlay layers (z-index 300):
- `#video-overlay` — per-letter teaching clip (YouTube IFrame or local `<video>`)
- `#shorts-overlay` — cartoon reward after perfect/near-perfect scores

---

## Themes

Two visual themes toggled at runtime. Stored in `localStorage` key `lb_theme`.

| Theme | Body class | Background | Tile colours |
|-------|------------|------------|--------------|
| Chalkboard Pop (default) | — | `#23272F` dark | Neon borders: green, cyan, yellow, pink, orange, purple |
| Rainbow Trail | `theme-rainbow` | `#F4EDDF` warm cream | Earthy: `#347046`, `#DEA431`, `#2E5E6E`, `#B85C38` |

`applyTheme(name)` adds/removes the body class and persists the choice.

---

## Tabs

| Tab | ID | `currentAppMode` | Description |
|-----|----|-----------------|-------------|
| Quiz | `tab-quiz` | `"quiz"` | A–Z alphabet: letter ↔ image |
| Case | `tab-matchcaps` | `"matchcaps"` | Upper ↔ lowercase matching |
| ಕನ್ನಡ | `tab-kannada` | `"kannada"` | Kannada vowels |
| हिंदी | `tab-hindi` | `"hindi"` | Hindi consonants |
| Blends | `tab-blends` | `"blends"` | Phonics rimes/blends (audio) |
| Numbers | `tab-saynumbers` | `"saynumbers"` | Number recognition 1–6 |
| Words | `tab-words` | `"words"` | CVC word families |

---

## Kannada Tab

### Overview

Teaches Kannada vowels (ಸ್ವರಗಳು) in pairs. Each pair gets two levels:
1. **letter-image** — see the letter, pick the matching image
2. **video-letter** — watch the teaching video clip, then see image, pick the letter

After every two pairs, a block of three cumulative test levels runs.

---

### KANNADA_ITEMS (app.js ~line 115)

All eight current vowels:

| Letter | Roman | Audio file | `vidStart` (sec) | Image |
|--------|-------|------------|-----------------|-------|
| ಅ | a  | `audio/kannada/a.mp3`  | 14 (override → 18s in code) | `images/prince.png` |
| ಆ | aa | `audio/kannada/aa.mp3` | 31 (override → 32s in code) | `images/elephant.png` |
| ಇ | i  | `audio/kannada/i.mp3`  | 96 (override → 47s in code) | `images/rat.png` |
| ಈ | ii | `audio/kannada/ii.mp3` | null (local mp4 used) | `images/fly.png` |
| ಉ | u  | `audio/kannada/u.mp3`  | 79  | `images/ring.png` |
| ಊ | uu | `audio/kannada/uu.mp3` | 94  | `images/sadhya.png` |
| ಋ | ru | `audio/kannada/ru.mp3` | 79  | `images/saint.jpg` |
| ಎ | e  | `audio/kannada/e.mp3`  | 121 | `images/leaf.png` |

> **Note on ಅ/ಆ/ಇ overrides**: `playKannadaVideo()` contains hardcoded start-second overrides for ಅ (18), ಆ (32), ಇ (47) that supersede the `vidStart` field. This is because the field values were set to an earlier version of the video.

> **Note on ಈ**: Uses a local mp4 (`videos/only ee.mp4`) instead of the YouTube video — `playKannadaVideo()` special-cases this letter.

---

### Audio — splicing from kannada.mp3

Each vowel's pronunciation is stored as a pre-spliced individual MP3 under `audio/kannada/`. The source file is `audio/kannada.mp3` (50.9 seconds total).

Splicing is done **offline with ffmpeg** before committing:

```bash
# General pattern:
ffmpeg -y -i audio/kannada.mp3 -ss <START_SECONDS> -t 3 -q:a 2 audio/kannada/<roman>.mp3

# All current clips (source timestamps in kannada.mp3):
# a.mp3   → spliced from kannada.mp3 (original session, exact start unknown)
# aa.mp3  → spliced from kannada.mp3 (original session)
# i.mp3   → spliced from kannada.mp3 (original session)
# ii.mp3  → spliced from kannada.mp3 (original session)
# u.mp3   → spliced from kannada.mp3 (original session)
# uu.mp3  → spliced from kannada.mp3 (original session)
# ru.mp3  → ffmpeg -ss 20 -t 3   (spliced 2026-07-17)
# e.mp3   → ffmpeg -ss 25 -t 3   (spliced 2026-07-17)
```

At runtime, `playKannadaClip(letter)` plays the file from position 0 and pauses after **2500ms** via a `setTimeout` (the audio file may be longer; the timer caps playback):

```js
function playKannadaClip(letter) {
    // Stops all other clips, plays the target clip for 2500ms
    audio.currentTime = 0;
    audio.play();
    _kannadaClipTimer = setTimeout(() => audio.pause(), 2500);
}
```

All clips are preloaded at startup via `new Audio(item.audio)` with `preload = "auto"`.

---

### Video — KANNADA_VIDEO_ID

YouTube video: `KMNRrw5fPCY`  
URL: `https://www.youtube.com/watch?v=KMNRrw5fPCY`

`playKannadaVideo()` plays a **5-second clip** from `vidStart`:
```js
const end = start + 5;
ytPlayer.loadVideoById({ videoId, startSeconds: start });
// polls getCurrentTime() every 200ms; hides overlay when >= end
// safetyTimer at 10s cancels if polling stalls
```

After the overlay hides, `hideVideoOverlay()` fires `afterVideoHide` callback if set, otherwise calls `advanceRound()`.

---

### KANNADA_LEVELS (app.js ~line 127)

18 levels total as of v38:

| Level | Letters | Mode | Child sees | Child picks |
|-------|---------|------|-----------|-------------|
| 1  | ಅ, ಆ | `letter-image` | Big Kannada letter | Matching image (4 choices) |
| 2  | ಅ, ಆ | `video-letter` | Teaching video → then image | Kannada letter (4 choices) |
| 3  | ಇ, ಈ | `letter-image` | Big Kannada letter | Matching image (4 choices) |
| 4  | ಇ, ಈ | `video-letter` | Teaching video → then image | Kannada letter (4 choices) |
| 5  | ಅ ಆ ಇ ಈ | `video-letter` ⭐ | Teaching video → image | Kannada letter (4 choices) |
| 6  | ಅ ಆ ಇ ಈ | `letter-image` ⭐ | Big letter | Image (4 choices) |
| 7  | ಅ ಆ ಇ ಈ | `hear` ⭐ | 🔊 button | Kannada letter (4 choices) |
| 8  | ಉ, ಊ | `letter-image` | Big Kannada letter | Matching image (4 choices) |
| 9  | ಉ, ಊ | `video-letter` | Teaching video → image | Kannada letter (4 choices) |
| 10 | ಅ ಆ ಇ ಈ ಉ ಊ | `video-letter` ⭐ | Teaching video → image | Kannada letter (4 choices) |
| 11 | ಅ ಆ ಇ ಈ ಉ ಊ | `letter-image` ⭐ | Big letter | Image (4 choices) |
| 12 | ಅ ಆ ಇ ಈ ಉ ಊ | `hear` ⭐ | 🔊 button | Kannada letter (4 choices) |
| 13 | ಅ ಆ ಇ ಈ ಉ ಊ | `hear` ⭐ | 🔊 button | Kannada letter (4 choices) |
| 14 | ಋ, ಎ | `letter-image` | Big Kannada letter | Matching image (4 choices) |
| 15 | ಋ, ಎ | `video-letter` | Teaching video → image | Kannada letter (4 choices) |
| 16 | all 8 | `video-letter` ⭐ | Teaching video → image | Kannada letter (4 choices) |
| 17 | all 8 | `letter-image` ⭐ | Big letter | Image (4 choices) |
| 18 | all 8 | `hear` ⭐ | 🔊 button | Kannada letter (4 choices) |

⭐ = cumulative test (`isTest: true`)

---

### Game Modes (Kannada)

**`letter-image`** — Letter shown silently, child picks image:
- Display: large Kannada letter (5rem, Noto Sans Kannada)
- Choices: 4 image buttons (from KANNADA_ITEMS)
- On correct: `playKannadaClip()` → 1800ms → `playKannadaVideo()`

**`video-letter`** — Teaching video plays first, then image question:
- On load: `afterVideoHide` callback is set, then `playKannadaVideo()` fires immediately
- After video hides: image appears + `playKannadaClip()` fires + 4 letter buttons appear
- On correct: `advanceRound()` after 1200ms (video was the teaching moment; no repeat)

**`picture`** — Image shown, child picks letter (used sparingly in test levels):
- Display: image (130×130px)
- `playKannadaClip()` fires 400ms after display
- On correct: `playKannadaClip()` → 1800ms → `playKannadaVideo()`

**`hear`** — Audio-only question:
- Display: 🔊 button (tappable to replay), "tap to hear again" label
- `playKannadaClip()` fires 400ms after display
- On correct: `playKannadaVideo()` after 1600ms

---

### Choice Options — getKannadaOptions()

Always shows **4 choices**. Logic:
1. Start with the pair of the current letter (e.g. ಅ→ [ಅ, ಆ], ಋ→ [ಋ, ಎ])
2. Fill remaining slots from `levelLetterSet` (letters active this level), then from the full `KANNADA_ITEMS` pool
3. ಅ is suppressed from distractors unless `isTest=true` or `levelIndex === 0`

Pair map (kept in sync with `getKannadaOptions`):

```js
{ "ಅ": ["ಅ","ಆ"], "ಆ": ["ಅ","ಆ"],
  "ಇ": ["ಇ","ಈ"], "ಈ": ["ಇ","ಈ"],
  "ಋ": ["ಋ","ಎ"], "ಎ": ["ಋ","ಎ"] }
```

ಉ and ಊ are not in the pairMap; they appear together because both are in `levelLetterSet`.

---

### How to Add a New Kannada Vowel

Follow this checklist exactly:

#### 1. Record / identify audio
- Source file: `audio/kannada.mp3` (the full recorded pronunciation track)
- Note the timestamp (in seconds) where the new vowel is spoken
- Splice with ffmpeg:
  ```bash
  ffmpeg -y -i audio/kannada.mp3 -ss <START_SEC> -t 3 -q:a 2 audio/kannada/<roman>.mp3
  ```
  Use `-t 3` (3 seconds) for a clean clip. Adjust if the natural pause is shorter.

#### 2. Find the video timestamp
- Video: `https://www.youtube.com/watch?v=KMNRrw5fPCY`
- Play the video, find where the new vowel is introduced
- Note the timestamp in seconds (e.g. 2:01 = 121 seconds)
- This becomes `vidStart` in KANNADA_ITEMS

#### 3. Choose or create the image
- Fluent Emoji 3D style preferred (256×256 PNG from Microsoft's emoji CDN)
- Or any clear photo/illustration the child recognises
- Store in `images/<name>.png` (or `.jpg`)
- The image should unambiguously represent the word/concept used in the video

#### 4. Add to KANNADA_ITEMS
```js
{ letter: "ಏ", roman: "ee", audio: "audio/kannada/ee.mp3", vidStart: <sec>, image: "images/<name>.png" },
```
Keep the array in canonical Kannada vowel order: ಅ ಆ ಇ ಈ ಉ ಊ ಋ ಎ ಏ ಐ ಒ ಓ ಔ …

#### 5. Update getKannadaOptions pairMap
Add both directions so choices always include the pair:
```js
"ಏ": ["ಏ", "ಐ"],
"ಐ": ["ಏ", "ಐ"],
```
If adding a lone vowel without a pair yet, omit from pairMap — it will fall through to the general pool.

#### 6. Update shouldPlayKannadaDoubleCue (if needed)
If the vowel should get the double-cue audio behaviour, add it to the array in `shouldPlayKannadaDoubleCue()`.

#### 7. Add KANNADA_LEVELS entries
Follow the pattern: two intro levels (letter-image + video-letter), then three cumulative test levels covering all vowels seen so far:
```js
{ label: "19", letters: ["ಏ", "ಐ"], mode: "letter-image" },
{ label: "20", letters: ["ಏ", "ಐ"], mode: "video-letter" },
{ label: "21", letters: ["ಅ","ಆ","ಇ","ಈ","ಉ","ಊ","ಋ","ಎ","ಏ","ಐ"], mode: "video-letter", isTest: true },
{ label: "22", letters: ["ಅ","ಆ","ಇ","ಈ","ಉ","ಊ","ಋ","ಎ","ಏ","ಐ"], mode: "letter-image", isTest: true },
{ label: "23", letters: ["ಅ","ಆ","ಇ","ಈ","ಉ","ಊ","ಋ","ಎ","ಏ","ಐ"], mode: "hear",         isTest: true },
```

#### 8. Bump the version in index.html
```html
<script src="app.js?v=39"></script>
```

#### 9. Commit and push
```bash
git add audio/kannada/<roman>.mp3 app.js index.html
git commit -m "Kannada: add ಏ/ಐ (levels 19–23)"
git push
```

---

## Hindi Tab

### Overview

Teaches Hindi **consonants** (व्यंजन), not vowels. Currently covers the first four: क, ख, ग, घ (ka, kha, ga, gha). Structure mirrors Kannada but simpler — 5 levels only.

---

### HINDI_ITEMS (app.js ~line 190)

| Letter | Roman | Audio file | `vidStart` (sec) | Image |
|--------|-------|------------|-----------------|-------|
| क | ka  | `audio/hindi/ka.mp3`  | 58 | `images/lotus.png` |
| ख | kha | `audio/hindi/kha.mp3` | 63 | `images/rabbit.png` |
| ग | ga  | `audio/hindi/ga.mp3`  | 67 | `images/cow.png` |
| घ | gha | `audio/hindi/gha.mp3` | 71 | `images/clock.png` |

---

### Audio — hindi/ clips

Individual MP3 files in `audio/hindi/`. Each was pre-spliced offline from a Hindi consonant audio recording. At runtime, `playHindiClip(letter)` plays the file from position 0 and stops after **1000ms**:

```js
function playHindiClip(letter) {
    audio.currentTime = 0;
    audio.play();
    _hindiClipTimer = setTimeout(() => audio.pause(), 1000);
}
```

Note: Hindi clips are capped at 1000ms (vs 2500ms for Kannada) because consonant clips are shorter.

---

### Video — HINDI_VIDEO_ID

YouTube video: `0EfSycgslF0`  
URL: `https://www.youtube.com/watch?v=0EfSycgslF0`

`playHindiVideo()` plays a **4-second clip** from `vidStart` (end = `start + 4`). Optional `vidEnd` field on an item overrides the default +4 duration.

---

### HINDI_LEVELS (app.js ~line 197)

5 levels:

| Level | Letters | Mode | Child sees | Child picks |
|-------|---------|------|-----------|-------------|
| 1 | क, ख | `hear` | 🔊 button | Hindi letter (4 choices) |
| 2 | क, ख | `video-letter` | Teaching video → image | Hindi letter (4 choices) |
| 3 | ग, घ | `hear` | 🔊 button | Hindi letter (4 choices) |
| 4 | ग, घ | `video-letter` | Teaching video → image | Hindi letter (4 choices) |
| 5 | all 4 | `hear` ⭐ | 🔊 button | Hindi letter (4 choices) |

⭐ = cumulative test (`isTest: true`)

---

### Game Modes (Hindi)

**`hear`** — Audio clip plays automatically:
- Display: 🔊 button + "tap to hear again"
- `playHindiClip()` fires 400ms after display
- 4 choice buttons = all HINDI_ITEMS (always all 4, no distractor logic)
- On correct: `playHindiVideo()` after 1600ms

**`video-letter`** — Teaching video plays first:
- `afterVideoHide` callback is set, then `playHindiVideo()` fires 300ms after display
- After video hides: image (or letter fallback) appears + `playHindiClip()` + 4 letter buttons
- On correct: `advanceRound()` after 1200ms

**`picture`** — Image shown silently, child picks letter:
- On correct: `playHindiClip()` → 1800ms → `playHindiVideo()`

---

### Choices (Hindi)

Unlike Kannada, Hindi does **not** use `getKannadaOptions`. It simply shuffles all `HINDI_ITEMS` and shows all 4 as buttons — no distractor pool logic. This means if more letters are added, the choice count increases automatically.

---

### How to Add a New Hindi Consonant

#### 1. Audio
- Splice from source file at the known timestamp:
  ```bash
  ffmpeg -y -i audio/<source>.mp3 -ss <START_SEC> -t 2 -q:a 2 audio/hindi/<roman>.mp3
  ```
  Use `-t 2` (2 seconds) — consonant clips are shorter than vowel clips.

#### 2. Video timestamp
- Video: `https://www.youtube.com/watch?v=0EfSycgslF0`
- Note timestamp in seconds for the letter's clip → becomes `vidStart`

#### 3. Image
- Choose a clear illustration the child recognises for this consonant's word
- Store in `images/<name>.png`

#### 4. Add to HINDI_ITEMS
```js
{ letter: "ङ", roman: "nga", audio: "audio/hindi/nga.mp3", vidStart: <sec>, image: "images/<name>.png" },
```

#### 5. Add HINDI_LEVELS entries
The first two new letters get 2 intro levels + the test expands to all known letters:
```js
{ label: "6", letters: ["ङ", "च"], mode: "hear" },
{ label: "7", letters: ["ङ", "च"], mode: "video-letter" },
{ label: "8", letters: ["क","ख","ग","घ","ङ","च"], mode: "hear", isTest: true },
```

#### 6. Bump version, commit, push.

---

## Video Reward System

### Per-letter clip (during gameplay)

| Tab | Function | Video ID | Clip duration |
|-----|----------|----------|--------------|
| Quiz (phonics off) | `playPhonicsClip()` | `svmmuYQPrI4` | 5 sec |
| Quiz (phonics on) | `playPhoneticClip()` | `MbO6vGBkx48` | 5 sec |
| Kannada | `playKannadaVideo()` | `KMNRrw5fPCY` | 5 sec (ಈ = local mp4) |
| Hindi | `playHindiVideo()` | `0EfSycgslF0` | 4 sec |

All use the YouTube IFrame API via the single `#yt-player` element. The `hideVideoOverlay()` function fires `afterVideoHide` if set, else calls `advanceRound()`.

### Shorts reward (after perfect/near-perfect score)
- 50 sequential YouTube Shorts IDs in `SHORTS_IDS`
- Resumes from `lb_cartoon` localStorage (`{ index, position }`)
- Plays up to 5 minutes; child skips with "Done ✖"

---

## Audio Clip Duration Reference

| Tab | Clip file | Play duration (ms) |
|-----|-----------|-------------------|
| Kannada | `audio/kannada/*.mp3` | 2500 |
| Hindi | `audio/hindi/*.mp3` | 1000 |
| Blends | `audio/blends/*.mp3` | full (via `onended`) |

---

## Queue Building

All tabs build `queue` as N copies of the active items, then call `shuffleNoRepeat()` to guarantee no consecutive duplicates:

```js
queue = shuffleNoRepeat([...activeItems, ...activeItems, ...activeItems]); // 3× repeat
```

`shuffleNoRepeat()` runs Fisher-Yates then walks the array, swapping any adjacent duplicate further ahead.

---

## TTS Voice

`speak(text)` uses the Web Speech API. Voice priority (deep male, neutral accent):

1. Alex (macOS neutral American)
2. Daniel (macOS/iOS British)
3. Tom (macOS older male)
4. Google UK English Male
5. Microsoft David / Mark (Windows)
6. Any English male voice → any English voice

Settings: `rate: 0.85`, `pitch: 0.85`.

---

## Settings Toggles

| Toggle | `localStorage` key | Effect |
|--------|--------------------|--------|
| 🔬 Phonetics | `lb_phonetic` | ON: phonetic-sound video; OFF: phonics-name video (Quiz tab only) |
| 🚫 No Videos | `lb_novideo` | Skips all video overlays; `proceedFromVideo()` fires immediately |
| 🌙 Chalkboard / 🌿 Rainbow | `lb_theme` | Visual theme |
