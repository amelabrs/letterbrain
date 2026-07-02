# LetterBrain — Implementation Reference

## Overview

LetterBrain is a **vanilla JS PWA** (no framework) that teaches young children the alphabet through letter-image association quizzes. It is fully client-side and deployable to any static host (GitHub Pages, Render).

---

## File Map

```
letterbrain/
├── index.html              — Single HTML shell; all screens live here as hidden divs
├── app.js                  — All game logic (~1700 lines)
├── style.css               — All styling; Comic Sans / child-friendly palette
├── manifest.json           — PWA install metadata
├── WordVideos.json         — Video reward data (loaded at runtime via fetch)
│
├── images/                 — PNG assets (A-Z letters + Kannada: prince, elephant, rat, fly)
├── videos/                 — Local mp4 overrides: fensi.mp4 (F), guitar.mp4 (G), icecream.mp4 (I)
├── audio/
│   ├── kannada.mp3         — Kannada vowel pronunciation audio (used in-game)
│   └── Phonics A-Z Mouth Shapes.mp3  — Reference only
│
├── docs/                   — Documentation
│   ├── IMPLEMENTATION.md   — This file
│   ├── word-videos.md      — Video system docs
│   └── video_backup.md     — Archive video timestamp records
│
├── scripts/
│   └── extract_channel_videos.py  — Utility for extracting YouTube Shorts IDs
└── .github/workflows/pages.yml    — GitHub Pages auto-deploy on push to main
```

---

## Architecture

### Screen System

There are no routes or page navigations. All screens are `<div class="screen">` elements; only one has `class="active"` at a time. Switching is done via `showScreen(id)`.

```
#start-screen   — Level selection grid + settings toggles
#quiz-screen    — Active gameplay (letter display + 4-choice buttons)
#done-screen    — Post-round score + unlock message
```

Two overlay layers sit above all screens (z-index 300):
- `#video-overlay` — per-letter phonics/word clip (YouTube IFrame or local `<video>`)
- `#shorts-overlay` — cartoon reward for perfect/near-perfect scores (YouTube Shorts via `<iframe>`)

---

## Data Model

### ALL_ITEMS (app.js:3–41)

Static array of 26 letter objects. Each has:

| field    | type   | description                                   |
|----------|--------|-----------------------------------------------|
| `letter` | string | Uppercase letter (A–Z)                        |
| `word`   | string | Associated word (e.g. "Apple")                |
| `image`  | string | Path to image asset (e.g. `images/apple.png`) |
| `level`  | number | Content level group (1–11)                    |

At startup, `initWordVideos()` fetches `WordVideos.json` and merges in:

| field       | type   | source           | description                            |
|-------------|--------|------------------|----------------------------------------|
| `vidStart`  | number | WordVideos.json  | Archive video start timestamp (sec)    |
| `vidEnd`    | number | WordVideos.json  | Archive video end timestamp (sec)      |
| `localVid`  | string | WordVideos.json  | Path to local mp4 (overrides archive)  |
| `funnyShort`| string | WordVideos.json  | YouTube Shorts ID                      |
| `funnyStart`| number | WordVideos.json  | Start offset within Short (sec)        |

### Content Levels (letter groupings)

| Level | Letters | Notes                        |
|-------|---------|------------------------------|
| 1     | A–F     | 6 letters — foundational set |
| 2     | G–H     | 2 new                        |
| 3     | I–J     | 2 new                        |
| 4     | K–L     | 2 new                        |
| 5     | M–N     | 2 new                        |
| 6     | O–P     | 2 new                        |
| 7     | Q–R     | 2 new                        |
| 8     | S–T     | 2 new                        |
| 9     | U–V     | 2 new                        |
| 10    | W–X     | 2 new                        |
| 11    | Y–Z     | 2 new                        |

### GAME_LEVELS (app.js:49–54)

Each content level generates **2 game levels** (one per mode), so there are 22 total game levels. Each game level belongs to a **pair** (normal + reverse together).

```js
{ contentLevel: 1, mode: "normal",  pair: 1 }   // Game level 1
{ contentLevel: 1, mode: "reverse", pair: 1 }   // Game level 2
{ contentLevel: 2, mode: "normal",  pair: 2 }   // Game level 3
// ...
```

**Pair = the unlock unit.** Completing a pair at ≥80% score unlocks the next pair.

---

## Tabs

The start screen has five mode tabs (in order):

| Tab | ID | Description |
|-----|----|-------------|
| 📝 Quiz | `tab-quiz` | Main A–Z alphabet quiz |
| 🔠 Case | `tab-matchcaps` | Uppercase ↔ lowercase matching |
| ಕನ್ನಡ | `tab-kannada` | Kannada vowel recognition |
| हिंदी | `tab-hindi` | Hindi vowel recognition |
| 🔢 Numbers | `tab-saynumbers` | Number recognition 1–6 |

Active tab is tracked in `currentAppMode`. Switching calls `setActiveTab(mode)` and rebuilds the level grid.

---

## Settings

One toggle remains on the start screen:

| Toggle | ID | Stored in | Effect |
|--------|----|-----------|--------|
| 🔬 Phonetics | `phonetics-real-toggle` | `lb_phonetics` | ON → plays phonetics clip (`MbO6vGBkx48`); OFF → plays phonics clip (`svmmuYQPrI4`) |

All other previous toggles (Learning Video, Be Funny, Disable Video, Disable Old Levels) have been removed.

---

## Game Modes

### Quiz Tab (📝)

| Mode      | Prompt        | Child picks     |
|-----------|---------------|-----------------|
| `normal`  | Big letter     | Image (4 choices) |
| `reverse` | Image + word  | Letter (4 choices) |

In both modes, 4 choices are shown: 1 correct + 3 distractors sampled from `levelItems`. An **Exam level** (A–X, gold card) always appears at the end of the level grid — it cycles through A–X once with no repetition.

### Case Tab (🔠)

Teaches uppercase ↔ lowercase letter matching. 39 levels total (13 letter pairs × 3 levels each):

| Level type | Mode key | Prompt | Child picks |
|------------|----------|--------|-------------|
| Normal | `caps-normal` | Uppercase letter | Lowercase (4 choices) |
| Reverse | `caps-reverse` | Lowercase letter | Uppercase (4 choices) |
| Test | `caps-test` | Mixed upper/lower | Opposite case (4 choices) |

- **Letter pairs**: A/B, C/D, E/F, G/H, I/J, K/L, M/N, O/P, Q/R, S/T, U/V, W/X, Y/Z
- **Distractors**: adjacent letters (sliding window of 4 from A–Z alphabet)
- **All levels always unlocked** — no progression gate
- **Always plays phonetics video** after correct answer; no TTS speech after correct

Defined by `CAPS_GROUPS` and `CAPS_LEVELS` arrays. Each test level has a `cumulative` array (all letters seen so far) for future use.

### Numbers Tab (🔢)

5 levels, child sees a number and picks from 4 choices:

| Level | Range | Notes |
|-------|-------|-------|
| 1 | 1–2 | Intro to 1 and 2 |
| 2 | 3–4 | Intro to 3 and 4 |
| 3 | 1–4 | Mixed review |
| 4 | 5–6 | Intro to 5 and 6 |
| 5 | 1–6 | Full mixed test |

Distractors are drawn dynamically from within the full 1–6 range.

### Kannada Tab (ಕನ್ನಡ)

Teaches the first four Kannada vowels. **Hear mode only**: audio plays → child picks the correct Kannada letter from 4 choices (always all 4 shown).

#### KANNADA_ITEMS

```js
{ letter: “ಅ”, roman: “a”,  start: 0,  vidStart: 14,   image: “images/prince.png”   }
{ letter: “ಆ”, roman: “aa”, start: 3,  vidStart: 31,   image: “images/elephant.png” }
{ letter: “ಇ”, roman: “i”,  start: 6,  vidStart: 44,   image: “images/rat.png”      }
{ letter: “ಈ”, roman: “ii”, start: 9,  vidStart: null, image: “images/fly.png”      }
```

- `start` — offset (seconds) in `audio/kannada.mp3` for pronunciation
- `vidStart` — offset (seconds) in `KANNADA_VIDEO_ID` for video reward (`null` = skip)
- `image` — illustration for picture mode (not yet in gameplay; planned for Level 2 / Level 4)

#### KANNADA_LEVELS

| Level | Letters | Mode | Notes |
|-------|---------|------|-------|
| 1 | ಅ, ಆ | hear | Audio → pick letter |
| 2 | ಇ, ಈ | hear | Audio → pick letter |
| 3 ⭐ | all 4 | hear | Cumulative test (gold card) |

#### Audio

`playKannadaClip(letter)` uses an HTML5 `Audio` element pointed at `audio/kannada.mp3`. It seeks to `item.start`, plays, then pauses after 2.5 seconds.

#### Video rewards

`playKannadaVideo()` plays a clip from YouTube video `KMNRrw5fPCY` using the same IFrame mechanism as other video rewards. Per-item timestamps: ಅ→14s, ಆ→31s, ಇ→44s. ಈ has `vidStart: null` so it skips the video and advances immediately.

### Hindi Tab (हिंदी)

Teaches the first four Hindi vowels. **Hear mode only**: audio plays → child picks the correct Hindi letter from 4 choices (always all 4 shown).

#### HINDI_ITEMS

```js
{ letter: “अ”, roman: “a”,  start: 0,  vidStart: 0,  vidEnd: 5,  image: “images/prince.png” }
{ letter: “आ”, roman: “aa”, start: 3,  vidStart: 5,  vidEnd: 9,  image: “images/elephant.png” }
{ letter: “इ”, roman: “i”,  start: 6,  vidStart: 9,  vidEnd: 15, image: “images/rat.png”      }
{ letter: “ई”, roman: “ii”, start: 9,  vidStart: 15, vidEnd: 20, image: “images/fly.png”      }
```

- `start` — offset (seconds) in `audio/kannada.mp3` for pronunciation
- `vidStart` — offset (seconds) in `HINDI_VIDEO_ID` for video reward
- `vidEnd` — explicit end offset for Hindi clips
- `image` — illustration for picture mode

#### HINDI_LEVELS

| Level | Letters | Mode | Notes |
|-------|---------|------|-------|
| 1 | अ, आ | hear | Audio → pick letter |
| 2 | अ, आ | picture | Picture → pick letter |
| 3 | इ, ई | hear | Audio → pick letter |
| 4 | इ, ई | picture | Picture → pick letter |
| 5 ⭐ | all 4 | hear | Cumulative test (gold card) |

#### Audio

`playHindiClip(letter)` reuses `audio/kannada.mp3` and seeks to the item’s `start` offset.

#### Video rewards

`playHindiVideo()` plays a clip from YouTube video `0EfSycgslF0` using the requested timestamps:
- अ → 0:00
- आ → 0:05
- इ → 0:09
- ई → 0:15

Each item can also override the video ID via `vidId` field (currently unused; previously tested for ಈ).

---

## Game Flow

### startGame(gameLevelIdx) — app.js:307

1. Sets `currentLevel`, `gameMode` from `GAME_LEVELS[gameLevelIdx]`
2. Builds `queue`:
   - New letters for this level × 3 repetitions each
   - 4 random review letters from all prior levels
   - All shuffled together
3. Resets counters (`stars`, `currentIndex`, `sessionStats`)
4. Calls `loadRound()`

### loadRound() — app.js:331

1. If `currentIndex >= queue.length` → `showDone()`
2. Sets `currentItem = queue[currentIndex]`
3. Renders `#letter-display` (big letter or image+word label depending on mode)
4. Generates 4 choice buttons and adds `onclick → handleChoice()`
5. Calls `speak()` with the letter or word
6. Updates progress bar

### handleChoice(btn, chosen) — app.js:411

**Correct answer:**
- `answered = true` (blocks further clicks)
- If `roundClean` (no prior wrong guess this round): `stars++`
- Pushes to `sessionStats`
- Plays correct chime, speaks `"X for Word!"`
- Shows feedback overlay + confetti
- If video is enabled and clip exists: calls `playVideoReward()` after 1600ms (video handles advancing)
- Otherwise: `currentIndex++`, `loadRound()` after 2200ms

**Wrong answer:**
- Marks button red + disabled
- `roundClean = false`, `roundWrongs++`
- Plays wrong tone, speaks `"Try again!"`
- Does NOT advance — child retries same question

### showDone() — app.js:726

1. Displays final score
2. Checks unlock threshold: `stars >= ceil(queue.length * 0.8)` AND `gl.pair === unlockedPair`
3. If threshold met: `setUnlockedLevel(unlockedPair + 1)`, shows unlock message
4. If `stars >= queue.length - 1`: triggers `playCartoonReward()` after 2.5s
5. Calls `sendStats()` (analytics)

---

## Audio System

### Text-to-Speech (app.js:139–170)

Uses the Web Speech API (`SpeechSynthesisUtterance`). Voice selection prefers: Samantha, Karen, Moira, Fiona, Tessa, Victoria, Google UK English Female, Google US English. Falls back to any English voice.

Settings: `rate: 0.9`, `pitch: 1.35` (higher and slower than default — child-friendly).

Triggered:
- On `loadRound()` — speaks the letter (normal mode) or word (reverse mode)
- After a correct answer — speaks `"X for Word!"`
- After a wrong answer — speaks `"Try again!"`

### Sound Effects (app.js:90–113)

Generated via Web Audio API oscillators (no audio files needed):

| Event   | Notes                     | Frequencies      |
|---------|---------------------------|------------------|
| Correct | Ascending 4-note chime    | C5 E5 G5 C6 (523–1047 Hz) |
| Wrong   | Gentle 2-note descending  | 440 → 349 Hz     |

---

## Video Reward System

### Per-letter clip (after correct answer)

Called by `playVideoReward()`:

| Phonetics toggle | Function called | Video | Duration |
|-----------------|-----------------|-------|----------|
| ON | `playPhoneticClip()` | `MbO6vGBkx48` (real phonetics mouth shapes) | 5 sec from `PHONETICS_TIMESTAMPS[letter]` |
| OFF | `playPhonicsClip()` | `svmmuYQPrI4` (phonics archive) | 5 sec from `PHONICS_TIMESTAMPS[letter]` |

For the **Case tab**, `playPhoneticClip()` is always called regardless of the toggle.

For the **Kannada tab**, `playKannadaVideo()` is called with video `KMNRrw5fPCY`, playing 8 seconds from the item's `vidStart`.

All per-letter clips use `#video-overlay` and auto-advance to the next round when done.

### Shorts reward (after perfect/near-perfect score)

Called by `playCartoonReward()`:
- Selects from `SHORTS_IDS` (50 YouTube Shorts IDs) sequentially
- Resumes from `lb_cartoon` localStorage state (persists across sessions)
- Plays for up to 5 minutes; child can skip with "Done ✖" button
- Uses `#shorts-overlay` (separate from per-letter overlay)

### Timestamps

**PHONETICS_TIMESTAMPS** — video `MbO6vGBkx48` (real phonetics, mouth shapes):
```js
{ A:0, B:7, C:16, D:23, E:31, F:39, G:46, H:53,
  I:60, J:66, K:74, L:80, M:88, N:94, O:100, P:107,
  Q:113, R:122, S:130, T:138, U:145, V:152, W:158, X:166,
  Y:172, Z:179 }
```

**PHONICS_TIMESTAMPS** — video `svmmuYQPrI4` (phonics archive):
```js
{ A:0, B:13, C:27, D:40, E:52, F:64, G:79, H:93,
  I:106, J:118, K:131, L:145, M:157, N:169, O:182,
  P:196, Q:211, R:224, S:238, T:254, U:268, V:280,
  W:295, X:309, Y:323, Z:337 }
```

All clip durations: `start + 5` seconds (Kannada clips: `start + 8` seconds).

---

## Progression & Unlocking

| Key              | Default | Description                                  |
|------------------|---------|----------------------------------------------|
| `lb_unlocked`    | `"3"`   | Highest unlocked pair number (not level)     |
| Unlock threshold | 80%     | `Math.ceil(queue.length * 0.8)` stars needed |
| Min visible      | 4 pairs | Always show ≥8 game levels on start screen   |

Unlock only triggers when: score ≥ threshold AND child is playing the **current frontier pair** (not replaying old levels).

---

## State / Persistence

All state is in `localStorage`:

| Key              | Type    | Description                           |
|------------------|---------|---------------------------------------|
| `lb_unlocked`    | string  | Current unlocked pair number (Quiz tab) — defaults to max (all unlocked) |
| `lb_caps_unlocked` | string | Current unlocked pair number (Case tab) — defaults to max (all unlocked) |
| `lb_deviceId`    | string  | UUID for analytics                    |
| `lb_deviceName`  | string  | Optional caregiver label              |
| `lb_phonetics`   | `"0"/"1"` | Phonetics video mode (default ON)   |
| `lb_cartoon`     | JSON    | `{ index, position }` for shorts resume |

In-session state (global JS variables, not persisted):

```js
currentGameLevelIdx  // index into GAME_LEVELS
currentLevel         // content level (1–11)
gameMode             // "normal" | "reverse"
levelItems           // letters usable as distractors this round
queue                // shuffled question array
currentIndex         // progress through queue
currentItem          // current question's item object
stars                // score for this session
answered             // true while waiting for video/advance
roundClean           // false if any wrong guess this round
roundWrongs          // count of wrong guesses this round
sessionStats         // array of { letter, word, firstTry, wrongs }
```

---

## Analytics

Sends a POST (mode: `no-cors`) to a Google Apps Script webhook after each session:

```json
{
  "timestamp": "ISO string",
  "deviceId": "uuid",
  "deviceName": "optional string",
  "mode": "normal | reverse",
  "level": 2,
  "stars": 8,
  "total": 10,
  "perfect": false,
  "letters": [
    { "letter": "G", "word": "Guitar", "firstTry": true, "wrongs": 0 },
    { "letter": "H", "word": "House",  "firstTry": false, "wrongs": 2 }
  ]
}
```

---

## CSS / UI Notes

- Font: Comic Sans MS with fallbacks (Chalkboard SE, Marker Felt)
- Palette: purple gradient background (`#667eea → #764ba2`), white cards
- Max content width: 500px (centered, mobile-first)
- Key animations: `popIn` (0.4s scale-in on letter/image), `wiggle` (0.5s on correct), `bounce` (infinite on big emoji), `fall` (confetti)
- `z-index` layers: screens (base) → feedback overlay (100) → confetti (200) → video overlays (300)
