# Handoff: LetterBrain — "Rainbow Trail" Redesign

## Overview
LetterBrain is a phone-based alphabet/phonics quiz app for young children (ages ~5-7, pre/early-reader). The child sees a prompt (a letter, a picture, a vowel glyph, or a number) and taps one of several picture/glyph choices; correct answers earn a reward and progress a level map. The app has six parallel modes: **Quiz** (English letters), **Case** (uppercase/lowercase matching), **Kannada** vowels, **Hindi** vowels, **Numbers**, and **Blends** (two-letter sounds like "sh", "ch").

This redesign, "Rainbow Trail," restyles the whole app in the bound **Garden Swap Design System** (Potting Shed palette: kraft-paper cream, deep pine/fern greens, terracotta clay, honey, plus plum and denim as secondary accents) — with the layout and color pushed brighter/bolder than the design system's default marketplace usage, at the client's request, because the target user is a barely-verbal young child. **No UI text is used for navigation or answer choices anywhere in the app** — only pictures, color, and the actual glyphs/digits being taught (a Kannada vowel or a numeral is content, not a label, so it's shown as-is).

## About the Design Files
The files in this bundle are **design references created in HTML** — static prototypes showing intended look, structure, and states, not production code to copy directly. The task is to **recreate these HTML designs in the target codebase's existing environment** (LetterBrain is currently a vanilla-JS PWA — `index.html` + `app.js` + `style.css`, no framework) using that codebase's existing patterns, OR, if the team decides to rebuild in a framework, to implement fresh there. Preserve the existing game-logic architecture described in the current repo's `docs/IMPLEMENTATION.md` (queue-based rounds, star/unlock thresholds, `GAME_LEVELS`, per-mode item arrays) — only the visual layer and the no-text-navigation requirement are new.

## Fidelity
**High-fidelity for color, type, spacing, and iconography** (real design-system tokens, not placeholders). **Low/illustrative for content** — the letter/word pairs shown (Apple/Ball/Cat/Dog, etc.) are examples; wire the real 26-letter, 4-vowel, 6-number, and blends datasets from the existing `app.js` / `WordVideos.json` into these layouts. Illustration images are placeholders (`<image-slot>` in the source) — replace with real word/animal artwork before shipping.

## Design Tokens
Font families:
- Display/serif (big letters, titles, journal captions): `'Newsreader', Georgia, 'Times New Roman', serif`
- UI/sans (chrome, small labels): `'Hanken Grotesk', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif`

Colors used in this redesign (CSS custom properties, from the Garden Swap token set):
- Page background: `--paper #F4EDDF` · Card surface: `--card #FFFDF8` · Sunken surface: `--paper-raised #FBF6EC`
- Ink: `--ink #20251D` · Ink soft: `--ink-soft #5C6151` · Ink faint: `--ink-faint #8C8E7C`
- Greens: `--pine-700 #1A4226` (Blends mode color) · `--fern-600 #285C39` (primary/Quiz mode color) · `--fern-500 #347046` · `--fern-400 #4C8A5C` · `--mint-100 #E7EFDC`
- Clay/terracotta: `--clay-700 #9F4A2B` · `--clay-600 #B85C38` (Kannada mode color) · `--clay-200 #ECD2C0` · `--clay-100 #F4E5D9`
- Honey: `--honey-600 #C2871C` · `--honey-500 #DEA431` (Numbers mode color) · `--honey-200 #F1DEAE` · `--honey-100 #F8EDD3`
- Denim: `--denim-700 #234E5B` · `--denim-600 #2E5E6E` (Case mode color) · `--denim-100 #D7E5E9`
- Plum: `--plum-500 #7B5A86` (Hindi mode color) · `--plum-100 #ECE1F0`
- Hairline: `--line #E6DCC8` · `--line-strong #D8CCB3`

Radius: `--radius-card 18px` (choice tiles, cards) · `--radius-lg 24px` (big prompt card) · pill/circle for avatars and level nodes.
Shadow: `--shadow` (resting cards), `--shadow-hover` (current/active level node), `--shadow-fab` (the focused/current level, warm green-tinted), `--shadow-modal` (large illustration cards).
Spacing/tap targets: level-map circles 74-92px; quiz choice tiles ~145-160px square (2×2 grid, 14px gap); mode-switch icons 40-50px circles. All comfortably exceed the 44px minimum tap target for small hands.

**Mode → color key** (used consistently everywhere — level map dots, mode-switcher icon, quiz card, choice tiles):
Quiz = fern-500/600 · Case = denim-600 · Kannada = clay-600 · Hindi = plum-500 · Numbers = honey-500 · Blends = pine-700.

## Screens / Views (one pair per mode; all 6 modes follow the same two-screen pattern)

### 1. Level Map ("My Garden")
- **Purpose**: pick a level/round within the current mode.
- **Layout**: status-bar-safe top padding (~56px), centered header row: a small sparkles glyph + serif "My Garden" title (24px, weight 600, `--pine-700`). Below it, a horizontal row of 6 circular mode-switch icons (40px), one per mode, in that mode's signature color; the active mode is full-opacity with a 3px light-tint outline ring and a small shadow, inactive modes sit at 50% opacity, no ring. Icons: Quiz = sprout, Case = repeat/swap, Kannada = the glyph "ಅ", Hindi = the glyph "अ", Numbers = the digit "3", Blends = trees (stands in for combined sounds).
- Below the tab row, a 3-column grid (16-18px gap) of level nodes, each a circle sized 74-92px in the mode's color: completed nodes are solid-colored with a check or icon; the current/frontier node is the largest, with a `--shadow-fab`-style glow ring in a light tint of `--honey-200`; locked nodes use a standardized style — `--paper-raised` background, 2px dashed `--line-strong` border, a `lock` glyph in `--ink-faint` — never colored-but-faded (keeps "locked" reading as one consistent state app-wide, regardless of mode color).
- **No text labels on nodes.** The letter/glyph/digit itself may appear small inside a node (that's content, e.g. "Aa" in Case mode) but there's never a word caption underneath.

### 2. Quiz Round
- **Layout**: top strip is either a 3-segment progress pill row (`--fern-500` fill for completed segments, `--line` for remaining) or a single circular "current mode" chip, depending on variant shown. Main content is centered: a large rounded-square prompt card (140-150px, `--radius-lg`/44px radius, the mode's signature color, `--shadow-hover`) showing the target — a big serif letter/glyph/digit (70-84px, weight 700, white) or (Numbers) a digit plus a row of counting dots for pre-numeral quantity sense.
- Below it, a 2×2 grid of choice tiles (`--radius-card` 26px radius, 14px gap), each tile a different solid color from the mode's designated 4-color rotation (never all the same color, so children can also anchor on tile position/color, not just picture). Each tile holds either a picture illustration (`<image-slot>` circle, ~68px) or, for Case/Kannada/Hindi/Numbers/Blends-letter tiles, a large serif glyph directly on the color tile.
- **Correct-answer state**: the correct tile gets a 5px light-tint ring in its own pale token (e.g. mint-100 for a fern tile, honey-100 for a honey tile) plus a small white-bordered circular badge (`--fern-600` bg, white check icon) overhung at its top-right corner.
- **Reward**: a full-width celebration banner anchored at the bottom of the screen — `--fern-600` background, `--radius-lg` corners, `--shadow-hover`, containing a horizontal row of sparkle/star icons in `--honey-200` and white. This replaces the original app's YouTube video-clip reward entirely.

## Interactions & Behavior (intended; not wired in these static files)
- Tapping a level node navigates to that level's first Quiz Round.
- Tapping a choice tile: correct → ring + badge appear, banner reward plays (~1.5-2s), auto-advance to next round (mirrors existing `handleChoice()` correct-path timing in `app.js`). Incorrect → tile flashes/disables briefly, no advance, matches existing wrong-answer retry behavior.
- Tapping a mode-switch icon swaps the whole screen's active mode and reloads that mode's level map — icons are the only mode navigation; there is no text tab strip anymore.
- Progress pill / level-map node fill updates live as rounds complete, same unlock-threshold logic as the current app (star count ≥ 80% of round length unlocks next level/pair).

## State Management
Reuse the existing state model documented in the current repo (`GAME_LEVELS`, `currentLevel`, `queue`, `currentIndex`, `stars`, `roundClean`, `lb_unlocked` / `lb_caps_unlocked` in localStorage, etc.) — this redesign changes presentation only, not the data/progression model.

## Assets
- Icons: Garden Swap's built-in line-icon set (Lucide-derived, ISC-licensed) — `sprout`, `repeat`, `lock`, `check`, `sparkles`, `star`, `trees`. Available via the design system bundle; do not substitute emoji.
- Illustrations: placeholders only in these files (drag-and-drop `<image-slot>` components). Source real word/animal illustrations before shipping — see the current repo's `images/` folder for the existing asset set (apple.png, ball.png, cat.png, etc.) as a starting inventory.
- Fonts: Newsreader (serif) and Hanken Grotesk (sans) — both loaded via Google Fonts in the design system's `tokens/fonts.css`.

## Files
- `quiz.html`, `case.html`, `kannada.html`, `hindi.html`, `numbers.html`, `blends.html` — one pair of screens (Level Map + Quiz Round) per mode, in this folder.
- `design-tokens.css` — the exact color/type/spacing custom properties referenced above, extracted for convenience.
