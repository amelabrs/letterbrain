# LetterBrain — Implementation Reference

## Overview

LetterBrain is a **vanilla JS PWA** (no framework) that teaches young children the alphabet through letter-image association quizzes. It is fully client-side and deployable to any static host (GitHub Pages, Render).

---

## File Map

```
letterbrain/
├── index.html              — Single HTML shell; all screens live here as hidden divs
├── app.js                  — All game logic (~828 lines)
├── style.css               — All styling; Comic Sans / child-friendly palette
├── manifest.json           — PWA install metadata
├── WordVideos.json         — Video reward data (loaded at runtime via fetch)
│
├── images/                 — 35 PNG assets (one per letter A-Z + PWA icons)
├── videos/                 — Local mp4 overrides: fensi.mp4 (F), guitar.mp4 (G), icecream.mp4 (I)
├── audio/                  — Reference phonics mp3 (not used in-game)
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

## Game Modes

| Mode      | Prompt        | Child picks     |
|-----------|---------------|-----------------|
| `normal`  | Big letter     | Image (4 choices) |
| `reverse` | Image + word  | Letter (4 choices) |

In both modes, 4 choices are shown: 1 correct + 3 distractors sampled from `levelItems` (current level's new letters + 4 random review letters from prior levels).

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

Called by `playVideoReward()` — priority order:

1. **Phonetics mode ON** → `playPhonicsClip()`: seeks YouTube video `svmmuYQPrI4` to letter's timestamp (see `PHONICS_TIMESTAMPS`), plays ~5 seconds
2. **Be Funny ON + funnyShort exists** → `playFunnyShort()`: plays the letter's YouTube Short
3. **localVid exists** → plays local `<video>` element (F=fensi.mp4, G=guitar.mp4, I=icecream.mp4)
4. **vidStart/vidEnd exist** → seeks archive YouTube video `a_DRSc0oZV0` to the timestamp window

All per-letter clips use `#video-overlay` and auto-advance to the next round when done.

### Shorts reward (after perfect/near-perfect score)

Called by `playCartoonReward()`:
- Selects from `SHORTS_IDS` (50 YouTube Shorts IDs) sequentially
- Resumes from `lb_cartoon` localStorage state (persists across sessions)
- Plays for up to 5 minutes; child can skip with "Done ✖" button
- Uses `#shorts-overlay` (separate from per-letter overlay)

### Phonics Timestamps

```js
PHONICS_TIMESTAMPS = {
  "A":0, "B":13, "C":27, "D":40, "E":52, "F":64, "G":79, "H":93,
  "I":106, "J":118, "K":131, "L":145, "M":157, "N":169, "O":182,
  "P":196, "Q":211, "R":224, "S":238, "T":254, "U":268, "V":280,
  "W":295, "X":309, "Y":323, "Z":337
}
```

Clip duration is always `start + 5` seconds.

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
| `lb_unlocked`    | string  | Current unlocked pair number          |
| `lb_deviceId`    | string  | UUID for analytics                    |
| `lb_deviceName`  | string  | Optional caregiver label              |
| `lb_disableOld`  | `"0"/"1"` | Hide completed levels toggle        |
| `lb_phonetics`   | `"0"/"1"` | Phonetics video mode (default ON)   |
| `lb_wordVideo`   | `"0"/"1"` | Word video mode                     |
| `lb_beFunny`     | `"0"/"1"` | Funny shorts mode                   |
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
