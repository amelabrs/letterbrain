# LetterBrain — Implementation Reference

> Last updated: 2026-08-10. Reflects app.js v77.

---

## File Map

```
letterbrain/
├── index.html              — Single HTML shell; all screens live here as hidden divs
├── app.js                  — All game logic (~3700 lines)
├── style.css               — Chalkboard Pop theme (dark bg, neon borders) + Rainbow Trail toggle
├── manifest.json           — PWA metadata
│
├── images/                 — PNG/JPG assets (A–Z letters, Kannada, Hindi, word family images)
├── videos/
│   └── number song.mp4     — Local number-rhyme video (used by Numbers tab, zones 3–4 and 5–6)
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

## Color Vocabulary (Zone UI)

A consistent three-color system applies to all zone-based tabs:

| Color | Hex | Meaning |
|-------|-----|---------|
| **Red** | `#C04A4A` | Audio/hearing activity — tap to hear, pick the letter |
| **Teal** | `#2E5E6E` | Visual/image activity — see the letter or image, make a visual match |
| **Gold** | `#DEA431` | Cumulative test pill — never used for learn buttons |

This means: if a button plays a sound, it's red. If a button shows an image quiz, it's teal. The big gold pill is always the test.

---

## Tabs

| Tab | ID | `currentAppMode` | Description |
|-----|----|-----------------|-------------|
| Quiz | `tab-quiz` | `"quiz"` | A–Z alphabet: letter ↔ image |
| Case | *(sub-tab of Quiz)* | `"matchcaps"` | Upper ↔ lowercase matching |
| Lowercase | *(sub-tab of Quiz)* | `"lowercase"` | abc recognition |
| ಕನ್ನಡ | `tab-kannada` | `"kannada"` | Kannada vowels |
| हिंदी | `tab-hindi` | `"hindi"` | Hindi consonants |
| Numbers | `tab-saynumbers` | `"saynumbers"` | Number recognition 1–10 |
| Word / AT | `tab-words` | `"words"` | CVC word families — -at rime |
| Word / AM | *(sub-tab of Word)* | `"words-am"` | CVC word families — -am rime |

### Sub-tab pattern

Tabs with multiple modes use a segmented toggle below the nav tabs:

- **Quiz tab** → `#quiz-case-toggle` (ABC / abc / Case)
- **Word tab** → `#word-family-toggle` (AT / AM)

`navTabFor(mode)` maps sub-modes to their parent nav tab so the correct tab button stays highlighted:
```js
function navTabFor(mode) {
    if (mode === "matchcaps" || mode === "lowercase") return "quiz";
    if (mode === "words-am") return "words";
    return mode;
}
```

`updateWordFamilyToggle()` shows/hides `#word-family-toggle` and marks the active button, mirroring `updateQuizCaseToggle()`. Both are called from `setActiveTab()` and on initial load.

---

## Zone Card UI Pattern

All non-English tabs now use a vertical zone card layout instead of the 3-column letter grid.

### CSS override

When rendering a zone tab, the grid gets class `nh-mode`:
```js
grid.classList.add("nh-mode");
```

In style.css:
```css
#level-grid.nh-mode {
    display: flex;
    flex-direction: column;
    grid-template-columns: unset;
    padding: 12px 16px 24px;
}
```

`buildLevelGrid()` calls `grid.classList.remove("nh-mode")` at the top so switching tabs resets the layout.

### Zone group card structure

Each group card (`.nh-group-card`) contains:
1. A **learn row** (`.nh-learn-row`) — flex row of learn pill buttons
2. A **test pill** (`.nh-test-node`) — full-width gold pill for the cumulative test

Learn buttons use `.hindi-pair-btn` (shared across all zone tabs).

---

## Zone Data Pattern

All pair-based tabs derive their zone groups from a flat `ALL_PAIRS` array:

```js
const *_ZONE_GROUPS = *_ALL_PAIRS.map((pair, i) => ({
    learns: [pair],
    test: *_ALL_PAIRS.slice(0, i + 1).flat(), // cumulative — all taught so far
}));
```

### Flat LEVELS arrays (for homework index tracking)

Each tab derives a flat array in the same top-to-bottom order as the UI buttons, so `homeworkLocked(tab, idx)` works with sequential indices:

```js
const *_LEVELS = [];
*_ZONE_GROUPS.forEach(group => {
    group.learns.forEach(pair => {
        *_LEVELS.push({ ..., mode: "learn1" });
        *_LEVELS.push({ ..., mode: "learn2" });
    });
    *_LEVELS.push({ ..., isTest: true });
});
```

---

## Kannada Tab

### Overview

Teaches Kannada vowels (ಸ್ವರಗಳು) in pairs. Two learn modes per pair, then a cumulative test.

### KANNADA_ALL_PAIRS (7 groups)

```
["ಅ","ಆ"], ["ಇ","ಈ"], ["ಉ","ಊ"], ["ಋ","ಎ"], ["ಏ","ಐ"],
["ಒ","ಓ","ಔ"],  ← triplet group
["ಅಂ","ಅಃ"]
```

### Zone structure per pair

| Button | Color | Mode | Game: child sees → picks |
|--------|-------|------|--------------------------|
| Letter·Image (teal) | `#2E5E6E` | `letter-image` | Kannada letter → image |
| 🔊 Hear (red) | `#C04A4A` | `hear` | Audio clip → Kannada letter |
| ★ Test (gold) | `#DEA431` | cumulative test | All pairs seen so far |

### KANNADA_LEVELS derivation

```js
KANNADA_ZONE_GROUPS.forEach(group => {
    group.learns.forEach(letters => {
        KANNADA_LEVELS.push({ letters, mode: "letter-image" });
        KANNADA_LEVELS.push({ letters, mode: "hear" });
    });
    KANNADA_LEVELS.push({ letters: group.test, mode: "letter-image", isTest: true });
});
```

### Audio / Video

| Resource | Details |
|----------|---------|
| Audio clips | `audio/kannada/*.mp3`, each capped at 2500ms playback |
| YouTube video | `KMNRrw5fPCY`, 5-second clip from `vidStart` |
| Special case | ಈ uses local `videos/only ee.mp4` instead of YouTube |

---

## Hindi Tab

### Overview

Teaches Hindi consonants (व्यंजन). 16 pairs covering the full Devanagari consonant set.

### HINDI_ALL_PAIRS (16 pairs)

```
["क","ख"], ["ग","घ"], ["ङ","च"], ["छ","ज"], ["झ","ट"],
["ठ","ड"], ["ढ","ण"], ["त","थ"], ["द","ध"], ["न","प"],
["फ","ब"], ["भ","म"], ["य","र"], ["ल","व"], ["श","ष"], ["स","ह"]
```

### Zone structure per pair

| Button | Color | Mode | Game: child sees → picks |
|--------|-------|------|--------------------------|
| 🔊 Hear (red) | `#C04A4A` | `hear` | Audio clip → Hindi letter |
| Picture (teal) | `#2E5E6E` | `picture` | Image → Hindi letter |
| ★ Test (gold) | `#DEA431` | cumulative test | All pairs seen so far |

### HINDI_LEVELS derivation

```js
HINDI_ZONE_GROUPS.forEach(group => {
    group.learns.forEach(letters => {
        HINDI_LEVELS.push({ letters, mode: "hear" });
        HINDI_LEVELS.push({ letters, mode: "picture" });
    });
    HINDI_LEVELS.push({ letters: group.test, mode: "picture", isTest: true });
});
```

### Audio / Video

| Resource | Details |
|----------|---------|
| Audio clips | `audio/hindi/*.mp3`, each capped at 1000ms playback |
| YouTube video | `0EfSycgslF0`, 4-second clip from `vidStart` |

---

## English Quiz Tab

### Overview

A–Z alphabet. Two play modes per content level (learn pair), cumulative test after each.

### Sub-tabs

The Quiz tab has a segmented toggle: **ABC** (normal/reverse quiz) | **abc** (lowercase) | **Case** (uppercase ↔ lowercase matching).

### CONTENT_LEVELS and GAME_LEVELS

`CONTENT_LEVELS` is `[1..11]` — level 1 = A–F, levels 2–11 = two letters each.

`GAME_LEVELS` is derived: for each content level, one `mode:"normal"` entry + one `mode:"reverse"` entry.

### Zone structure per content level

| Button | Color | Mode | Game |
|--------|-------|------|------|
| Normal (teal) | `#2E5E6E` | `normal` | See letter → pick image |
| Reverse (red) | `#C04A4A` | `reverse` | See image → pick letter |
| ★ Test (gold) | `#DEA431` | cumulative test | `startQuizTest(contentLevel)` |

### startQuizTest(maxContentLevel)

Runs reverse mode on all letters up to that content level:
```js
function startQuizTest(maxContentLevel) {
    isExamMode = true;
    currentGameLevelIdx = -1;
    gameMode = "reverse";
    levelItems = ALL_ITEMS.filter(it => it.level <= maxContentLevel);
    queue = shuffle([...levelItems]);
    // ...
}
```

### Case sub-tab

- Uses `CAPS_GROUPS` (pairs of uppercase letters)
- **Lower-case labels**: `"a·b"`, not `"A·B"`
- One learn button per pair (teal, only one mode: match uppercase to lowercase)
- Gold cumulative test pill covering all pairs seen so far
- `CAPS_LEVELS` flat array: `normalIdx = i*2`, `testIdx = i*2+1`

---

## Word Tab

The **Word** tab (nav button: "word") covers CVC word families. It has two sub-tabs:

| Sub-tab | `currentAppMode` | Content |
|---------|-----------------|---------|
| AT | `"words"` | -at word family: cat, bat, mat, hat, rat |
| AM | `"words-am"` | -am word family: ham, jam, yam, ram |

The `#word-family-toggle` (AT / AM) shows only when in the words family, exactly mirroring the `#quiz-case-toggle` for English.

### AT Word Family

**WORD_ITEMS**: cat, bat, mat, hat, rat

**WORD_ALL_PAIRS**:
```js
["cat","bat"], ["mat","hat"], ["rat","mat"]
```

### AM Word Family

**AM_WORD_ITEMS**: ham, jam, yam, ram

**AM_WORD_ALL_PAIRS**:
```js
["ham","jam"], ["yam","ram"]
```

> **Note**: Images for ham, jam, yam need to be added to `images/`. `ram.png` already exists.

### Zone structure (both word families)

| Button | Color | Mode | Game: child sees → picks |
|--------|-------|------|--------------------------|
| Word pair (teal) | `#2E5E6E` | `normal` | Hear/see word → pick image |
| Word pair (red) | `#C04A4A` | `reverse` | See image → pick word |
| ★ Test (gold) | `#DEA431` | cumulative test | All words seen so far |

### startWordsGame / startWordsAmGame

AT uses `WORD_ITEMS` and sets `currentAppMode = "words"`.
AM uses `AM_WORD_ITEMS` and sets `currentAppMode = "words-am"`.
Both delegate gameplay to the shared `loadWordsRound()` which uses `wordsFamilyItems`.

### Adding a new word family sub-tab

1. Add `*_WORD_ITEMS`, `*_WORD_ALL_PAIRS`, `*_WORD_ZONE_GROUPS`, `*_WORD_LEVELS`
2. Add the mode to `HOMEWORK_TABS` and `getLevelsForTab()`
3. Add toggle button to `#word-family-toggle` in HTML
4. Add `navTabFor` mapping → `"words"`
5. Add `updateWordFamilyToggle()` logic
6. Add `buildLevelGrid` branch for the new mode
7. Add `start*WordsGame()` function

---

## Numbers Tab (saynumbers)

### Overview

Teaches number recognition 1–10 using a **rhyme-peg** system (each number rhymes with a memorable word).

### Rhyme Peg System

| Number | Peg word | Emoji |
|--------|----------|-------|
| 1 | sun | ☀️ |
| 2 | shoe | 👟 |
| 3 | tree | 🌳 |
| 4 | door | 🚪 |
| 5 | hive | 🐝 |
| 6 | sticks | 🪵 |
| 7 | heaven | ✨ |
| 8 | plate | 🍽️ |
| 9 | vine | 🍇 |
| 10 | pen | ✏️ |

### Game Flow (per zone)

1. **Word flash**: large rhyme word + emoji shown briefly
2. **Count display**: N emoji images fill the `#letter-display` box (`renderNHCountGrid`)
3. **Numeral choice**: 4 tiles showing numerals — child picks the right number
4. Feedback → next item

### NH_ZONES

```js
const NH_ZONES = [
    { id:"nhz1-2",   label:"1 & 2",     nums:[1,2],           isTest:false, repeats:3 },
    { id:"nhz3-4",   label:"3 & 4",     nums:[3,4],           isTest:false, repeats:3 },
    { id:"nhzt1-4",  label:"Test 1–4",  nums:[1,2,3,4],       isTest:true,  repeats:2 },
    { id:"nhz5-6",   label:"5 & 6",     nums:[5,6],           isTest:false, repeats:3 },
    { id:"nhzt1-6",  label:"Test 1–6",  nums:[1,2,3,4,5,6],   isTest:true,  repeats:1 },
    { id:"nhz7-8",   label:"7 & 8",     nums:[7,8],           isTest:false, repeats:3 },
    { id:"nhzt1-8",  label:"Test 1–8",  nums:[1,2,3,4,5,6,7,8], isTest:true, repeats:1 },
    { id:"nhz9-10",  label:"9 & 10",    nums:[9,10],          isTest:false, repeats:3 },
    { id:"nhzt1-10", label:"Test 1–10", nums:[1,2,3,4,5,6,7,8,9,10], isTest:true, repeats:1 },
];
```

Zones are grouped by `buildLevelGrid` into cards: consecutive learn zones + their following test pill.

### renderNHCountGrid — emoji sizes for 150px display box

The `#letter-display` element is 150×150px. Emoji counts and sizes are calibrated to fit:

| n | Grid cols | Emoji size | Gap |
|---|-----------|-----------|-----|
| 1 | 1 | 82px | 5px |
| 2 | 2 | 58px | 5px |
| 3 | 3 | 36px | 5px |
| 4 | 2 | 56px | 5px |
| 5–6 | 3 | 34px | 3px |
| 7–8 | 4 | 26px | 3px |
| 9 | 3 | 32px | 3px |
| 10 | 5 | 20px | 3px |

### Video Clip Strategy (NH_CLIPS)

For zones 3-4 and 5-6, a local video (`videos/number song.mp4`) plays clips during the learn flow:

```
intro clip  → word flash for first number
after-N clip → shown after counting N emojis
outro clip  → closes the zone
```

**NH_CLIPS** (current):
```js
const NH_CLIPS = {
    'nhz3-4': {
        intro:  { start: 90,  dur: 5 },
        after3: { start: 95,  dur: 7 },
        after4: { start: 102, dur: 7 },
        outro:  { start: 110, dur: 8 },
    },
    'nhz5-6': {
        intro:  { start: 121, dur: 5 },
        after5: { start: 126, dur: 7 },
        after6: { start: 134, dur: 7 },
        outro:  { start: 143, dur: 8 },
    },
};
```

**Zones without clips** (nhz1-2, nhz7-8, nhz9-10):
- Zones 1–2 play without any video (word flash → count → choose).
- **Zones 7–8 and 9–10 have no NH_CLIPS entries yet.** The number song video does contain footage for these numbers, but the timestamps have not been identified. To add them:
  1. Open `videos/number song.mp4` and find where 7, 8, 9, 10 are introduced.
  2. Note the seconds for intro, after-7, after-8 (and after-9, after-10).
  3. Add `'nhz7-8': { intro, after7, after8, outro }` and `'nhz9-10': { ... }` to `NH_CLIPS`.
  4. The `playNHClip(key, cb)` function already supports any clip key in the zone's object — no other code changes needed.

---

## Video Reward System

### Per-letter clip (during gameplay)

| Tab | Function | Video ID | Clip duration |
|-----|----------|----------|--------------|
| Quiz (phonics off) | `playPhonicsClip()` | `svmmuYQPrI4` | 5 sec |
| Quiz (phonics on) | `playPhoneticClip()` | `MbO6vGBkx48` | 5 sec |
| Kannada | `playKannadaVideo()` | `KMNRrw5fPCY` | 5 sec (ಈ = local mp4) |
| Hindi | `playHindiVideo()` | `0EfSycgslF0` | 4 sec |
| Numbers 3-4, 5-6 | `playNHClip()` | local mp4 | variable |

All YouTube clips use the single `#yt-player` element (IFrame API). `hideVideoOverlay()` fires `afterVideoHide` callback if set, else calls `advanceRound()`.

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

All tabs build `queue` as N copies of the active items, then call `shuffleNoRepeat()`:

```js
queue = shuffleNoRepeat([...activeItems, ...activeItems, ...activeItems]); // 3× repeat
```

`shuffleNoRepeat()` runs Fisher-Yates then walks the array, swapping any adjacent duplicate.

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

## Homework Locking

`homeworkLocked(tab, idx)` returns true if homework mode is on and the index is at or above the ceiling.

```js
const HOMEWORK_TABS = [
    "quiz", "matchcaps", "lowercase", "kannada", "hindi",
    "saynumbers", "words", "words-am"
];
```

Each tab's ceiling is stored as `lb_hw_ceiling_<tab>` in localStorage. `getLevelsForTab(tab)` returns the corresponding flat levels array for displaying the homework setup screen.

---

## Settings Toggles

| Toggle | `localStorage` key | Effect |
|--------|--------------------|--------|
| 🔬 Phonetics | `lb_phonetic` | ON: phonetic-sound video; OFF: phonics-name video (Quiz tab only) |
| 🚫 No Videos | `lb_novideo` | Skips all video overlays; `proceedFromVideo()` fires immediately |
| 🌙 Chalkboard / 🌿 Rainbow | `lb_theme` | Visual theme |

---

## How to Add a New Word Family Sub-tab

1. **Images** — Add one image per word to `images/`. e.g. `ham.png`, `jam.png`, `yam.png`.

2. **Data** — Add word items, pairs, zone groups, levels:
```js
const OG_WORD_ITEMS = [
    { word: "dog", image: "images/dog.png" },
    { word: "log", image: "images/log.png" },
    // ...
];
const OG_WORD_ALL_PAIRS = [["dog","log"], ["fog","hog"]];
const OG_WORD_ZONE_GROUPS = OG_WORD_ALL_PAIRS.map((pair, i) => ({
    learns: [pair],
    test: [...new Set(OG_WORD_ALL_PAIRS.slice(0, i+1).flat())],
}));
const OG_WORD_LEVELS = [];
OG_WORD_ZONE_GROUPS.forEach(group => {
    group.learns.forEach(words => {
        OG_WORD_LEVELS.push({ label: words.join("·"), words, mode: "normal" });
        OG_WORD_LEVELS.push({ label: words.join("·"), words, mode: "reverse" });
    });
    OG_WORD_LEVELS.push({ label: "test", words: group.test, mode: "normal", isTest: true });
});
```

3. **HTML** — Add a toggle button inside `#word-family-toggle`:
```html
<button id="toggle-words-og" class="segmented-btn" data-mode="words-og">OG</button>
```

4. **app.js wiring**:
   - `HOMEWORK_TABS` → add `"words-og"`
   - `getLevelsForTab` → add `case "words-og": return OG_WORD_LEVELS;`
   - `navTabFor` → add `if (mode === "words-og") return "words";`
   - `updateWordFamilyToggle` → add the new toggle button highlight
   - `buildLevelGrid` → add `if (currentAppMode === "words-og") { ... }`
   - Add `startWordsOgGame(words, mode)` that uses `OG_WORD_ITEMS`
   - Add event listener: `document.getElementById("toggle-words-og").addEventListener("click", () => setActiveTab("words-og"))`

5. **Bump version** in index.html and push.

---

## How to Add a New Kannada Vowel

1. **Audio**: splice from `audio/kannada.mp3`:
   ```bash
   ffmpeg -y -i audio/kannada.mp3 -ss <START_SEC> -t 3 -q:a 2 audio/kannada/<roman>.mp3
   ```

2. **Video timestamp**: `https://www.youtube.com/watch?v=KMNRrw5fPCY` → note seconds → `vidStart`

3. **Image**: store in `images/<name>.png`

4. **Add to KANNADA_ITEMS** in canonical vowel order.

5. **Add pair to KANNADA_ALL_PAIRS** — KANNADA_ZONE_GROUPS and KANNADA_LEVELS auto-derive.

6. **Bump version, commit, push**.

---

## How to Add a New Hindi Consonant

1. **Audio**: `ffmpeg -y -i audio/<source>.mp3 -ss <START_SEC> -t 2 -q:a 2 audio/hindi/<roman>.mp3`
2. **Video timestamp**: `https://www.youtube.com/watch?v=0EfSycgslF0`
3. **Image**: `images/<name>.png`
4. **Add to HINDI_ITEMS** in Devanagari consonant order.
5. **Add pair to HINDI_ALL_PAIRS** — zones and levels auto-derive.
6. **Bump version, commit, push**.
