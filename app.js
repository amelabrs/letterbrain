/* ── LetterBrain — App Logic ─────────────────────────────────────── */

const ALL_ITEMS = [
    // Level 1: A–F (6 new)
    { letter: "A", word: "Apple",     image: "images/apple.png",    level: 1 },
    { letter: "B", word: "Ball",      image: "images/ball.png",     level: 1 },
    { letter: "C", word: "Cat",       image: "images/cat.png",      level: 1 },
    { letter: "D", word: "Dog",       image: "images/dog.png",      level: 1 },
    { letter: "E", word: "Elephant",  image: "images/elephant.png", level: 1 },
    { letter: "F", word: "Fish",      image: "images/fish.png",     level: 1 },
    // Level 2: G–H (2 new)
    { letter: "G", word: "Guitar",    image: "images/guitar.png",   level: 2 },
    { letter: "H", word: "House",     image: "images/house.png",    level: 2, boost: true },
    // Level 3: I–J (2 new)
    { letter: "I", word: "Ice Cream", image: "images/icecream.png", level: 3 },
    { letter: "J", word: "Joker",     image: "images/joker.png",    level: 3 },
    // Level 4: K–L (2 new)
    { letter: "K", word: "King",      image: "images/king.png",     level: 4 },
    { letter: "L", word: "Lion",      image: "images/lion.png",     level: 4 },
    // Level 5: M–N (2 new)
    { letter: "M", word: "Monkey",    image: "images/monkey.png",   level: 5 },
    { letter: "N", word: "Nose",      image: "images/nose.png",     level: 5 },
    // Level 6: O–P (2 new)
    { letter: "O", word: "Orange",    image: "images/orange.png",   level: 6 },
    { letter: "P", word: "Parrot",    image: "images/parrot.png",   level: 6 },
    // Level 7: Q–R (2 new)
    { letter: "Q", word: "Queen",     image: "images/queen.png",    level: 7 },
    { letter: "R", word: "Rabbit",    image: "images/rabbit.png",   level: 7 },
    // Level 8: S–T (2 new)
    { letter: "S", word: "Snake",     image: "images/snake.png",    level: 8 },
    { letter: "T", word: "Tiger",     image: "images/tiger.png",    level: 8 },
    // Level 9: U–V (2 new)
    { letter: "U", word: "Uncle",     image: "images/uncle.png",    level: 9 },
    { letter: "V", word: "Van",       image: "images/van.png",      level: 9 },
    // Level 10: W–X (2 new)
    { letter: "W", word: "Watch",     image: "images/watch.png",    level: 10 },
    { letter: "X", word: "Xmas Tree", image: "images/xmastree.png", level: 10 },
    // Level 11: Y–Z (2 new)
    { letter: "Y", word: "Yacht",     image: "images/yacht.png",    level: 11 },
    { letter: "Z", word: "Zebra",     image: "images/zebra.png",    level: 11 },
];

let currentLevel = 1;
let levelItems = [];
let gameMode = "normal"; // "normal" = letter→image, "reverse" = image→letter
let numberRange = [1, 4]; // active range for Numbers levels

const CHALK_TILE_COLORS  = ["#7CFF6B", "#00E5FF", "#FFEA00", "#FF4FA3", "#FF8A3D", "#B47CFF"];
const RAINBOW_TILE_COLORS = ["#347046", "#DEA431", "#2E5E6E", "#B85C38"];
const CHALK_MODE_COLORS = {
    quiz:       "#7CFF6B",
    matchcaps:  "#00E5FF",
    kannada:    "#FF8A3D",
    hindi:      "#FF4FA3",
    saynumbers: "#FFEA00",
    blends:     "#B47CFF",
    words:      "#FF6060",
};
const RAINBOW_MODE_COLORS = {
    quiz:       "#347046",
    matchcaps:  "#2E5E6E",
    kannada:    "#B85C38",
    hindi:      "#7B5A86",
    saynumbers: "#DEA431",
    blends:     "#1A4226",
    words:      "#C0392B",
};

let currentTheme = localStorage.getItem("lb_theme") || "chalkboard";

function tileColor(i) {
    const arr = currentTheme === "chalkboard" ? CHALK_TILE_COLORS : RAINBOW_TILE_COLORS;
    return arr[i % arr.length];
}
function modeColor(mode) {
    const map = currentTheme === "chalkboard" ? CHALK_MODE_COLORS : RAINBOW_MODE_COLORS;
    return map[mode] || map.quiz;
}

// ── Question-type colours: Yellow=Image  Blue=Letter  Orange=Audio ────
const QTYPE_COLORS = {
    chalkboard: { image: "#FFEA00", letter: "#00E5FF", audio: "#FF8A3D", test: "#B47CFF" },
    rainbow:    { image: "#DEA431", letter: "#2E5E6E", audio: "#B85C38", test: "#7B5A86" },
};
// Inline SVGs – all use stroke="currentColor" so they inherit tile text colour
const QTYPE_ICONS = {
    image:  `<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>`,
    audio:  `<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/></svg>`,
    letter: `<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="4 7 4 4 20 4 20 7"/><line x1="9" x2="15" y1="20" y2="20"/><line x1="12" x2="12" y1="4" y2="20"/></svg>`,
    video:  `<svg viewBox="0 0 24 24" width="13" height="13" fill="currentColor" stroke="none"><polygon points="5 3 19 12 5 21 5 3"/></svg>`,
};

function qTypeColor(mode, isTest = false) {
    const pal = QTYPE_COLORS[currentTheme] ?? QTYPE_COLORS.chalkboard;
    if (isTest) return pal.test;
    // Yellow = image/video is the PROMPT (child sees picture or video, picks letter)
    if (["picture", "reverse", "video-letter"].includes(mode)) return pal.image;
    if (mode === "hear") return pal.audio;
    if (mode === "caps-test") return pal.test;
    // Blue = letter is the PROMPT (child sees letter, picks image)
    return pal.letter;
}

function qTypeIcon(mode, isTest) {
    if (["picture", "reverse", "video-letter"].includes(mode)) return QTYPE_ICONS.image;
    if (mode === "hear") return QTYPE_ICONS.audio;
    return QTYPE_ICONS.letter;
}

function buildLegend() {
    const el = document.getElementById("mode-legend");
    if (!el) return;
    const pal = QTYPE_COLORS[currentTheme] ?? QTYPE_COLORS.chalkboard;
    const items = [
        { label: "Image",  color: pal.image,  icon: QTYPE_ICONS.image  },
        { label: "Letter", color: pal.letter, icon: QTYPE_ICONS.letter },
        { label: "Audio",  color: pal.audio,  icon: QTYPE_ICONS.audio  },
        { label: "Test",   color: pal.test,   icon: "★"                },
    ];
    el.innerHTML = items.map(({ label, color, icon }) =>
        `<span class="legend-item">
            <span class="legend-dot" style="background:${color}28;border:2px solid ${color};box-shadow:0 0 8px ${color}88;color:${color}">${icon}</span>
            <span class="legend-label" style="color:${color}">${label}</span>
        </span>`
    ).join('');
}

// ── Game levels: pairs of (normal, reverse) for each letter group ──
const CONTENT_LEVELS = [...new Set(ALL_ITEMS.map(it => it.level))].sort((a, b) => a - b);
const GAME_LEVELS = [];
CONTENT_LEVELS.forEach((cl) => {
    const pair = Math.ceil(GAME_LEVELS.length / 2) + 1;
    GAME_LEVELS.push({ contentLevel: cl, mode: "normal", pair });
    GAME_LEVELS.push({ contentLevel: cl, mode: "reverse", pair });
});

// ── Caps Match Levels ─────────────────────────────────────────────────
const CAPS_GROUPS = [
    ["A","B"], ["C","D"], ["E","F"], ["G","H"], ["I","J"],
    ["K","L"], ["M","N"], ["O","P"], ["Q","R"], ["S","T"],
    ["U","V"], ["W","X"], ["Y","Z"]
];

const CAPS_LEVELS = [];
let _capsRunning = [];
CAPS_GROUPS.forEach((group, i) => {
    const pair = i + 1;
    _capsRunning = [..._capsRunning, ...group];
    const cumulative = [..._capsRunning];
    CAPS_LEVELS.push({ letters: group, mode: "caps-normal", pair, cumulative });
    CAPS_LEVELS.push({ letters: group, mode: "caps-test",   pair, cumulative });
});

function getCapsUnlockedLevel() {
    const maxPair = CAPS_LEVELS[CAPS_LEVELS.length - 1].pair;
    return parseInt(localStorage.getItem("lb_caps_unlocked") || String(maxPair));
}
function setCapsUnlockedLevel(lvl) {
    localStorage.setItem("lb_caps_unlocked", String(lvl));
}

// ── Kannada ───────────────────────────────────────────────────────────
const KANNADA_ITEMS = [
    { letter: "ಅ", roman: "a",  audio: "audio/kannada/a.mp3",  vidStart: 14,  image: "images/prince.png" },
    { letter: "ಆ", roman: "aa", audio: "audio/kannada/aa.mp3", vidStart: 31,  image: "images/elephant.png" },
    { letter: "ಇ", roman: "i",  audio: "audio/kannada/i.mp3",  vidStart: 96,  image: "images/rat.png" },
    { letter: "ಈ", roman: "ii", audio: "audio/kannada/ii.mp3", vidStart: null, image: "images/fly.png" },
    { letter: "ಉ", roman: "u",  audio: "audio/kannada/u.mp3",  vidStart: 79,  image: "images/ring.png" },
    { letter: "ಊ", roman: "uu", audio: "audio/kannada/uu.mp3", vidStart: 94,  image: "images/sadhya.png" },
    { letter: "ಋ", roman: "ru", audio: "audio/kannada/ru.mp3", vidStart: 107, image: "images/saint.jpg" },
    { letter: "ಎ", roman: "e",  audio: "audio/kannada/e.mp3",  vidStart: 122, image: "images/leaf.png" },
    { letter: "ಏ", roman: "E",  audio: "audio/kannada/E.mp3",  vidStart: 138, image: "images/crab.png" },
    { letter: "ಐ", roman: "ai", audio: "audio/kannada/ai.mp3", vidStart: 154, image: "images/five.png" },
    { letter: "ಒ", roman: "o",  audio: "audio/kannada/o.mp3",  vidStart: 170, image: "images/camel.png" },
    { letter: "ಓ", roman: "oo", audio: "audio/kannada/oo.mp3", vidStart: 186, image: "images/run.png" },
    { letter: "ಔ", roman: "au", audio: "audio/kannada/au.mp3", vidStart: 202, image: "images/medicine.png" },
];
const KANNADA_VIDEO_ID = "KMNRrw5fPCY";

const KANNADA_LEVELS = [
    { label: "1", letters: ["ಅ", "ಆ"], mode: "letter-image" },
    { label: "2", letters: ["ಅ", "ಆ"], mode: "video-letter" },
    { label: "3", letters: ["ಇ", "ಈ"], mode: "letter-image" },
    { label: "4", letters: ["ಇ", "ಈ"], mode: "video-letter" },
    { label: "5", letters: ["ಅ", "ಆ", "ಇ", "ಈ"], mode: "video-letter", isTest: true },
    { label: "6", letters: ["ಅ", "ಆ", "ಇ", "ಈ"], mode: "letter-image", isTest: true },
    { label: "7", letters: ["ಅ", "ಆ", "ಇ", "ಈ"], mode: "hear",         isTest: true },
    { label: "8", letters: ["ಉ", "ಊ"], mode: "letter-image" },
    { label: "9", letters: ["ಉ", "ಊ"], mode: "video-letter" },
    { label: "10", letters: ["ಅ", "ಆ", "ಇ", "ಈ", "ಉ", "ಊ"], mode: "video-letter", isTest: true },
    { label: "11", letters: ["ಅ", "ಆ", "ಇ", "ಈ", "ಉ", "ಊ"], mode: "letter-image", isTest: true },
    { label: "12", letters: ["ಅ", "ಆ", "ಇ", "ಈ", "ಉ", "ಊ"], mode: "hear",         isTest: true },
    { label: "13", letters: ["ಅ", "ಆ", "ಇ", "ಈ", "ಉ", "ಊ"], mode: "hear",         isTest: true },
    { label: "14", letters: ["ಋ", "ಎ"], mode: "letter-image" },
    { label: "15", letters: ["ಋ", "ಎ"], mode: "video-letter" },
    { label: "16", letters: ["ಅ", "ಆ", "ಇ", "ಈ", "ಉ", "ಊ", "ಋ", "ಎ"], mode: "video-letter", isTest: true },
    { label: "17", letters: ["ಅ", "ಆ", "ಇ", "ಈ", "ಉ", "ಊ", "ಋ", "ಎ"], mode: "letter-image", isTest: true },
    { label: "18", letters: ["ಅ", "ಆ", "ಇ", "ಈ", "ಉ", "ಊ", "ಋ", "ಎ"], mode: "hear",         isTest: true },
    { label: "19", letters: ["ಏ", "ಐ"], mode: "letter-image" },
    { label: "20", letters: ["ಏ", "ಐ"], mode: "video-letter" },
    { label: "21", letters: ["ಅ", "ಆ", "ಇ", "ಈ", "ಉ", "ಊ", "ಋ", "ಎ", "ಏ", "ಐ"], mode: "video-letter", isTest: true },
    { label: "22", letters: ["ಅ", "ಆ", "ಇ", "ಈ", "ಉ", "ಊ", "ಋ", "ಎ", "ಏ", "ಐ"], mode: "letter-image", isTest: true },
    { label: "23", letters: ["ಅ", "ಆ", "ಇ", "ಈ", "ಉ", "ಊ", "ಋ", "ಎ", "ಏ", "ಐ"], mode: "hear",         isTest: true },
    { label: "24", letters: ["ಒ", "ಓ"], mode: "letter-image" },
    { label: "25", letters: ["ಒ", "ಓ"], mode: "video-letter" },
    { label: "26", letters: ["ಔ"],      mode: "letter-image" },
    { label: "27", letters: ["ಔ"],      mode: "video-letter" },
    { label: "28", letters: ["ಅ", "ಆ", "ಇ", "ಈ", "ಉ", "ಊ", "ಋ", "ಎ", "ಏ", "ಐ", "ಒ", "ಓ", "ಔ"], mode: "video-letter", isTest: true },
    { label: "29", letters: ["ಅ", "ಆ", "ಇ", "ಈ", "ಉ", "ಊ", "ಋ", "ಎ", "ಏ", "ಐ", "ಒ", "ಓ", "ಔ"], mode: "letter-image", isTest: true },
    { label: "30", letters: ["ಅ", "ಆ", "ಇ", "ಈ", "ಉ", "ಊ", "ಋ", "ಎ", "ಏ", "ಐ", "ಒ", "ಓ", "ಔ"], mode: "hear",         isTest: true },
];

// ── Word Families ────────────────────────────────────────────────────
const WORD_ITEMS = [
    { word: "cat", image: "images/cat.png" },
    { word: "bat", image: "images/bat.jpg" },
    { word: "mat", image: "images/mat.png" },
    { word: "hat", image: "images/hat.png" },
    { word: "rat", image: "images/rat.png" },
];
const WORD_LEVELS = [
    { label: "cat\nbat", words: ["cat", "bat"],                      mode: "normal"  },
    { label: "cat\nbat", words: ["cat", "bat"],                      mode: "reverse" },
    { label: "mat\nhat", words: ["mat", "hat"],                      mode: "normal"  },
    { label: "mat\nhat", words: ["mat", "hat"],                      mode: "reverse" },
    { label: "all 4",   words: ["cat", "bat", "mat", "hat"],        mode: "normal",  isTest: true },
    { label: "all 4",   words: ["cat", "bat", "mat", "hat"],        mode: "reverse", isTest: true },
    { label: "rat\nmat", words: ["rat", "mat"],                      mode: "normal"  },
    { label: "all 5",   words: ["cat", "bat", "mat", "hat", "rat"], mode: "normal",  isTest: true },
    { label: "all 5",   words: ["cat", "bat", "mat", "hat", "rat"], mode: "reverse", isTest: true },
];
const PHONEME_MAP = {
    a:"ah", b:"buh", c:"kuh", d:"duh", e:"eh", f:"ff",
    g:"guh", h:"huh", i:"ih", j:"juh", k:"kuh", l:"luh",
    m:"muh", n:"nuh", o:"oh", p:"puh", r:"rr", s:"ss",
    t:"tuh", u:"uh", v:"vuh", w:"wuh", x:"ks", y:"yuh", z:"zz",
};

function playPhonics(word) {
    const letters = word.toLowerCase().split("");
    let delay = 0;
    letters.forEach(letter => {
        const sound = PHONEME_MAP[letter] || letter;
        setTimeout(() => speak(sound), delay);
        delay += 600;
    });
    setTimeout(() => speak(word), delay + 400);
}

const HINDI_ITEMS = [
    // ka-varga
    { letter: "क", roman: "ka",   audio: "audio/hindi/ka.mp3",   vidStart: 58,  image: "images/lotus.png"    },
    { letter: "ख", roman: "kha",  audio: "audio/hindi/kha.mp3",  vidStart: 63,  image: "images/sword.png"    },
    { letter: "ग", roman: "ga",   audio: "audio/hindi/ga.mp3",   vidStart: 67,  image: "images/watch.png"    },
    { letter: "घ", roman: "gha",  audio: "audio/hindi/gha.mp3",  vidStart: 71,  image: "images/bell.png"     },
    { letter: "ङ", roman: "nga",  audio: "audio/hindi/nga.mp3",  vidStart: 76,  image: "images/color.png"    },
    // cha-varga
    { letter: "च", roman: "cha",  audio: "audio/hindi/cha.mp3",  vidStart: 81,  image: "images/spoon.png"    },
    { letter: "छ", roman: "chha", audio: "audio/hindi/chha.mp3", vidStart: 85,  image: "images/umbrella.png" },
    { letter: "ज", roman: "ja",   audio: "audio/hindi/ja.mp3",   vidStart: 94,  image: "images/ship.png"     },
    { letter: "झ", roman: "jha",  audio: "audio/hindi/jha.mp3",  vidStart: 99,  image: "images/waterfall.png"},
    { letter: "ञ", roman: "nya",  audio: "audio/hindi/nya.mp3",  vidStart: 103, image: null                  },
    // ta-varga (retroflex)
    { letter: "ट", roman: "ta",   audio: "audio/hindi/ta2.mp3",  vidStart: 108, image: "images/ram.png"      },
    { letter: "ठ", roman: "tha",  audio: "audio/hindi/tha2.mp3", vidStart: 113, image: "images/stamp.png"    },
    { letter: "ड", roman: "da",   audio: "audio/hindi/da2.mp3",  vidStart: 118, image: "images/drum.png"     },
    { letter: "ढ", roman: "dha",  audio: "audio/hindi/dha2.mp3", vidStart: 122, image: "images/drum.png"     },
    { letter: "ण", roman: "na",   audio: "audio/hindi/na2.mp3",  vidStart: 127, image: "images/fly.png"      },
    // ta-varga (dental)
    { letter: "त", roman: "ta",   audio: "audio/hindi/ta.mp3",   vidStart: 131, image: "images/scale.png"    },
    { letter: "थ", roman: "tha",  audio: "audio/hindi/tha.mp3",  vidStart: 136, image: "images/thermos.png"  },
    { letter: "द", roman: "da",   audio: "audio/hindi/da.mp3",   vidStart: 141, image: "images/cow.png"      },
    { letter: "ध", roman: "dha",  audio: "audio/hindi/dha.mp3",  vidStart: 145, image: "images/arrow.png"    },
    { letter: "न", roman: "na",   audio: "audio/hindi/na.mp3",   vidStart: 151, image: "images/tap.png"      },
    // pa-varga
    { letter: "प", roman: "pa",   audio: "audio/hindi/pa.mp3",   vidStart: 154, image: "images/kite.png"     },
    { letter: "फ", roman: "pha",  audio: "audio/hindi/pha.mp3",  vidStart: 159, image: "images/fruit.png"    },
    { letter: "ब", roman: "ba",   audio: "audio/hindi/ba.mp3",   vidStart: 164, image: "images/color.png"    },
    { letter: "भ", roman: "bha",  audio: "audio/hindi/bha.mp3",  vidStart: 168, image: "images/dance.png"    },
    { letter: "म", roman: "ma",   audio: "audio/hindi/ma.mp3",   vidStart: 173, image: "images/tree.png"     },
    // antastha
    { letter: "य", roman: "ya",   audio: "audio/hindi/ya.mp3",   vidStart: 177, image: "images/mask.png"     },
    { letter: "र", roman: "ra",   audio: "audio/hindi/ra.mp3",   vidStart: 182, image: "images/sun.png"      },
    { letter: "ल", roman: "la",   audio: "audio/hindi/la.mp3",   vidStart: 187, image: "images/laddoo.png"   },
    { letter: "व", roman: "va",   audio: "audio/hindi/va.mp3",   vidStart: 191, image: "images/diamond.png"  },
    // ushma + ha
    { letter: "श", roman: "sha",  audio: "audio/hindi/sha.mp3",  vidStart: 195, image: "images/conch.png"    },
    { letter: "ष", roman: "sha2", audio: "audio/hindi/sha2.mp3", vidStart: 200, image: "images/hexagon.png"  },
    { letter: "स", roman: "sa",   audio: "audio/hindi/sa.mp3",   vidStart: 205, image: "images/snake.png"    },
    { letter: "ह", roman: "ha",   audio: "audio/hindi/ha.mp3",   vidStart: 210, image: "images/swan.png"     },
];
const HINDI_VIDEO_ID = "0EfSycgslF0";
const HINDI_LEVELS = [
    { label: "1",  letters: ["क", "ख"], mode: "hear" },
    { label: "2",  letters: ["क", "ख"], mode: "video-letter" },
    { label: "3",  letters: ["क", "ख"], mode: "picture" },
    { label: "4",  letters: ["ग", "घ"], mode: "hear" },
    { label: "5",  letters: ["ग", "घ"], mode: "video-letter" },
    { label: "6",  letters: ["ग", "घ"], mode: "picture" },
    { label: "7",  letters: ["क","ख","ग","घ"], mode: "hear",         isTest: true },
    { label: "8",  letters: ["क","ख","ग","घ"], mode: "video-letter", isTest: true },
    { label: "9",  letters: ["क","ख","ग","घ"], mode: "picture",      isTest: true },
    { label: "10", letters: ["ङ", "च"], mode: "hear" },
    { label: "11", letters: ["ङ", "च"], mode: "video-letter" },
    { label: "12", letters: ["ङ", "च"], mode: "picture" },
    { label: "13", letters: ["छ", "ज"], mode: "hear" },
    { label: "14", letters: ["छ", "ज"], mode: "video-letter" },
    { label: "15", letters: ["छ", "ज"], mode: "picture" },
    { label: "16", letters: ["झ", "ट"], mode: "hear" },
    { label: "17", letters: ["झ", "ट"], mode: "video-letter" },
    { label: "18", letters: ["झ", "ट"], mode: "picture" },
    { label: "19", letters: ["ठ", "ड"], mode: "hear" },
    { label: "20", letters: ["ठ", "ड"], mode: "video-letter" },
    { label: "21", letters: ["ठ", "ड"], mode: "picture" },
    { label: "22", letters: ["ढ", "ण"], mode: "hear" },
    { label: "23", letters: ["ढ", "ण"], mode: "video-letter" },
    { label: "24", letters: ["ढ", "ण"], mode: "picture" },
    { label: "25", letters: ["क","ख","ग","घ","ङ","च","छ","ज","झ","ट","ठ","ड","ढ","ण"], mode: "hear",         isTest: true },
    { label: "26", letters: ["क","ख","ग","घ","ङ","च","छ","ज","झ","ट","ठ","ड","ढ","ण"], mode: "video-letter", isTest: true },
    { label: "27", letters: ["क","ख","ग","घ","ङ","च","छ","ज","झ","ट","ठ","ड","ढ","ण"], mode: "picture",      isTest: true },
    { label: "28", letters: ["त", "थ"], mode: "hear" },
    { label: "29", letters: ["त", "थ"], mode: "video-letter" },
    { label: "30", letters: ["त", "थ"], mode: "picture" },
    { label: "31", letters: ["द", "ध"], mode: "hear" },
    { label: "32", letters: ["द", "ध"], mode: "video-letter" },
    { label: "33", letters: ["द", "ध"], mode: "picture" },
    { label: "34", letters: ["न", "प"], mode: "hear" },
    { label: "35", letters: ["न", "प"], mode: "video-letter" },
    { label: "36", letters: ["न", "प"], mode: "picture" },
    { label: "37", letters: ["फ", "ब"], mode: "hear" },
    { label: "38", letters: ["फ", "ब"], mode: "video-letter" },
    { label: "39", letters: ["फ", "ब"], mode: "picture" },
    { label: "40", letters: ["भ", "म"], mode: "hear" },
    { label: "41", letters: ["भ", "म"], mode: "video-letter" },
    { label: "42", letters: ["भ", "म"], mode: "picture" },
    { label: "43", letters: ["त","थ","द","ध","न","प","फ","ब","भ","म"], mode: "hear",         isTest: true },
    { label: "44", letters: ["त","थ","द","ध","न","प","फ","ब","भ","म"], mode: "video-letter", isTest: true },
    { label: "45", letters: ["त","थ","द","ध","न","प","फ","ब","भ","म"], mode: "picture",      isTest: true },
    { label: "46", letters: ["य", "र"], mode: "hear" },
    { label: "47", letters: ["य", "र"], mode: "video-letter" },
    { label: "48", letters: ["य", "र"], mode: "picture" },
    { label: "49", letters: ["ल", "व"], mode: "hear" },
    { label: "50", letters: ["ल", "व"], mode: "video-letter" },
    { label: "51", letters: ["ल", "व"], mode: "picture" },
    { label: "52", letters: ["श", "ष"], mode: "hear" },
    { label: "53", letters: ["श", "ष"], mode: "video-letter" },
    { label: "54", letters: ["श", "ष"], mode: "picture" },
    { label: "55", letters: ["स", "ह"], mode: "hear" },
    { label: "56", letters: ["स", "ह"], mode: "video-letter" },
    { label: "57", letters: ["स", "ह"], mode: "picture" },
];

// ── Blends ───────────────────────────────────────────────────────────
const BLENDS_ITEMS = [
    { blend: "th", word: "Thief", audio: "audio/blends/th.mp3" },
    { blend: "at", word: "Cat",   audio: "audio/blends/at.mp3" },
    { blend: "og", word: "Dog",   audio: "audio/blends/og.mp3" },
    { blend: "un", word: "Sun",   audio: "audio/blends/un.mp3" },
];
const ALL_BLENDS = ["th", "at", "og", "un"];
const BLENDS_LEVELS = [
    { label: "TH·AT", activeBlends: ["th", "at"] },
    { label: "OG·UN", activeBlends: ["og", "un"] },
    { label: "★",     activeBlends: ["th", "at", "og", "un"] },
];

// ── Numbers ──────────────────────────────────────────────────────────
const NUMBER_LEVELS = [
    { label: "1–2", range: [1, 2],  mode: "hear" },
    { label: "3–4", range: [3, 4],  mode: "hear" },
    { label: "1–4", range: [1, 4],  mode: "hear", isTest: true },
    { label: "5–6", range: [5, 6],  mode: "hear" },
    { label: "1–6", range: [1, 6],  mode: "hear" },
    { label: "7–8", range: [7, 8],  mode: "hear" },
    { label: "1–8", range: [1, 8],  mode: "hear", isTest: true },
];

// ── Homework Mode ────────────────────────────────────────────────────
// A parent sets a per-tab ceiling ("learned up to here"); tabs are clamped
// to it so a child only ever sees content that's actually been taught.
const HOMEWORK_TABS = ["quiz", "matchcaps", "kannada", "hindi", "saynumbers", "words"];

function isHomeworkMode() {
    return localStorage.getItem("lb_homework_mode") !== "0"; // default ON
}
function setHomeworkModeEnabled(on) {
    localStorage.setItem("lb_homework_mode", on ? "1" : "0");
}
function getHomeworkCeiling(tab) {
    const stored = localStorage.getItem(`lb_hw_ceiling_${tab}`);
    return stored !== null ? parseInt(stored) : 1; // unset = safest default, first level only
}
function setHomeworkCeiling(tab, count) {
    localStorage.setItem(`lb_hw_ceiling_${tab}`, String(count));
}
function homeworkLocked(tab, idx) {
    return isHomeworkMode() && idx >= getHomeworkCeiling(tab);
}
function getLevelsForTab(tab) {
    switch (tab) {
        case "quiz": return GAME_LEVELS;
        case "matchcaps": return CAPS_LEVELS;
        case "kannada": return KANNADA_LEVELS;
        case "hindi": return HINDI_LEVELS;
        case "saynumbers": return NUMBER_LEVELS;
        case "words": return WORD_LEVELS;
    }
}

// ── Analytics ────────────────────────────────────────────────────────
const SHEET_URL = "https://script.google.com/macros/s/AKfycby0EcuYgQHwKb8rze8aA6TjhPsQDwalUJ-VB-NG9Bs7G7O9Ew7eIlpBPhEn2Jw_LRizVw/exec";

function getDeviceId() {
    let id = localStorage.getItem("lb_deviceId");
    if (!id) {
        id = crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2) + Date.now().toString(36);
        localStorage.setItem("lb_deviceId", id);
    }
    return id;
}

function getDeviceName() {
    return localStorage.getItem("lb_deviceName") || "";
}

function setDeviceName(name) {
    localStorage.setItem("lb_deviceName", name);
}

let roundWrongs = 0;       // wrong guesses for current letter
let sessionStats = [];     // per-letter results for current level run
let sayItWrongs = 0;
let recognitionTimeout = null;
let currentAppMode = localStorage.getItem("lb_mode") || "quiz";

// ── Speech Debug Log ─────────────────────────────────────────────────
const SPEECH_LOG_KEY = "lb_speech_log";
const SPEECH_LOG_MAX = 300;

function appendSpeechLog(entry) {
    let log;
    try { log = JSON.parse(localStorage.getItem(SPEECH_LOG_KEY) || "[]"); } catch(e) { log = []; }
    log.push(entry);
    if (log.length > SPEECH_LOG_MAX) log = log.slice(-SPEECH_LOG_MAX);
    try { localStorage.setItem(SPEECH_LOG_KEY, JSON.stringify(log)); } catch(e) {}
}

function getSpeechLog() {
    try { return JSON.parse(localStorage.getItem(SPEECH_LOG_KEY) || "[]"); } catch(e) { return []; }
}

function clearSpeechLog() {
    localStorage.removeItem(SPEECH_LOG_KEY);
}

function showSpeechLog() {
    const existing = document.getElementById("speech-log-overlay");
    if (existing) { existing.remove(); return; }

    const log = getSpeechLog();
    const overlay = document.createElement("div");
    overlay.id = "speech-log-overlay";
    overlay.className = "speech-log-overlay";

    let rows = "";
    if (log.length === 0) {
        rows = "<p style='color:#999;text-align:center'>No entries yet — play a Words or Letters round first.</p>";
    } else {
        rows = log.slice().reverse().map(e => {
            const tick = e.matched ? "✅" : "❌";
            const alts = (e.alts || [e.heard]).join(" / ");
            return `<tr class="${e.matched ? "log-ok" : "log-fail"}">
                <td>${tick}</td>
                <td><strong>${e.letter}</strong></td>
                <td>${e.word}</td>
                <td>${e.mode === "sayletters" ? "Letters" : "Words"}</td>
                <td class="log-heard">${alts || "—"}</td>
            </tr>`;
        }).join("");
        rows = `<table class="log-table"><thead>
            <tr><th></th><th>Letter</th><th>Word</th><th>Tab</th><th>Heard</th></tr>
        </thead><tbody>${rows}</tbody></table>`;
    }

    const copyText = log.slice().reverse().map(e =>
        `${e.matched?"OK":"MISS"} | ${e.letter} (${e.word}) | ${e.mode} | heard: ${(e.alts||[e.heard]).join(" / ")}`
    ).join("\n");

    overlay.innerHTML = `
        <div class="speech-log-box">
            <h3>🎙️ Speech Recognition Log</h3>
            <p class="log-hint">Share this with your developer to improve matching for this child's voice.</p>
            <div class="log-scroll">${rows}</div>
            <div class="log-actions">
                <button onclick="navigator.clipboard.writeText(${JSON.stringify(copyText)}).then(()=>this.textContent='Copied!').catch(()=>alert('Copy failed'))">📋 Copy Log</button>
                <button onclick="clearSpeechLog();document.getElementById('speech-log-overlay').remove()">🗑️ Clear</button>
                <button onclick="document.getElementById('speech-log-overlay').remove()">✖ Close</button>
            </div>
        </div>
    `;
    document.body.appendChild(overlay);
}

function getUnlockedLevel() {
    const maxPair = GAME_LEVELS[GAME_LEVELS.length - 1].pair;
    return parseInt(localStorage.getItem("lb_unlocked") || String(maxPair));
}

function setUnlockedLevel(lvl) {
    localStorage.setItem("lb_unlocked", String(lvl));
}

// ── Musical Sounds (Web Audio API) ──────────────────────────────────
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

function playChime(notes, duration) {
    notes.forEach((freq, i) => {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = "sine";
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(0.6, audioCtx.currentTime + i * duration);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + (i + 1) * duration);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start(audioCtx.currentTime + i * duration);
        osc.stop(audioCtx.currentTime + (i + 1) * duration);
    });
}

function playCorrectSound() {
    // Happy ascending chime: C5 → E5 → G5 → C6
    playChime([523, 659, 784, 1047], 0.12);
}

function playWrongSound() {
    // Gentle descending tone
    playChime([440, 349], 0.2);
}

let queue = [];       // shuffled order of letters to ask
let currentIndex = 0; // which round we're on
let currentItem = null;
let stars = 0;
let answered = false;
let roundClean = true; // true until a wrong guess this round

// ── Helpers ─────────────────────────────────────────────────────────

function shuffle(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}

// Shuffle and ensure no two adjacent items share the same key (word/letter/blend)
function shuffleNoRepeat(arr, keyFn = x => x?.word ?? x?.letter ?? x?.blend ?? x) {
    const a = shuffle(arr);
    for (let i = 1; i < a.length; i++) {
        if (keyFn(a[i]) === keyFn(a[i - 1])) {
            // Find the next item further ahead that's different, swap it in
            let swapped = false;
            for (let j = i + 1; j < a.length; j++) {
                if (keyFn(a[j]) !== keyFn(a[i - 1])) {
                    [a[i], a[j]] = [a[j], a[i]];
                    swapped = true;
                    break;
                }
            }
            // If nothing different is ahead, insert behind (won't happen with 3 copies)
            if (!swapped && i >= 2) [a[i], a[i - 2]] = [a[i - 2], a[i]];
        }
    }
    return a;
}

function showScreen(id) {
    document.querySelectorAll(".screen").forEach((s) => s.classList.remove("active"));
    document.getElementById(id).classList.add("active");
    // Hide celebration banner when leaving quiz screen
    if (id !== "quiz-screen") {
        const banner = document.getElementById("celebration-banner");
        if (banner) banner.classList.add("hidden");
    }
}

function setModeChip(mode) {
    const chip = document.getElementById("mode-chip");
    if (!chip) return;
    const c = modeColor(mode);
    if (currentTheme === "chalkboard") {
        chip.style.background = "#23272F";
        chip.style.border = `3px solid ${c}`;
        chip.style.boxShadow = `0 0 18px 2px ${c}99`;
        chip.style.color = c;
        const icons = {
            quiz:       `<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="${c}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M7 20h10"/><path d="M10 20c5.5-2.5.8-6.4 3-9"/><path d="M9.5 9.4c1.1.8 1.8 2.1 2 3.3-3.4.4-6.8-1.1-8-4.5a9 9 0 0 1 14 7.2c-2 .4-4.4-.4-6-2.1"/></svg>`,
            matchcaps:  `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="${c}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m17 2 4 4-4 4"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><path d="m7 22-4-4 4-4"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/></svg>`,
            kannada:    `<span style="font-family:'Noto Sans Kannada',serif;font-size:20px;font-weight:600;color:${c}">ಅ</span>`,
            hindi:      `<span style="font-family:'Noto Sans Kannada',serif;font-size:20px;font-weight:600;color:${c}">अ</span>`,
            saynumbers: `<span style="font-family:'Baloo 2',sans-serif;font-size:20px;font-weight:700;color:${c}">3</span>`,
            blends:     `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="${c}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 10v.2A3 3 0 0 1 8.9 16H5a3 3 0 0 1-1-5.8V10a3 3 0 0 1 6 0Z"/><path d="M7 16v4"/><path d="M13 19v3"/><path d="M12 19h8.3a1 1 0 0 0 .7-1.7L18 14h.3a1 1 0 0 0 .7-1.7L16 9h.2a1 1 0 0 0 .8-1.7L13 3l-1.4 1.5"/></svg>`,
            words:      `<span style="font-family:'Baloo 2',sans-serif;font-size:15px;font-weight:800;color:${c}">cat</span>`,
        };
        chip.innerHTML = icons[mode] || '';
    } else {
        chip.style.background = c;
        chip.style.border = "none";
        chip.style.boxShadow = `0 4px 12px ${c}66`;
        chip.style.color = "#fff";
        const icons = {
            quiz:       `<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M7 20h10"/><path d="M10 20c5.5-2.5.8-6.4 3-9"/><path d="M9.5 9.4c1.1.8 1.8 2.1 2 3.3-3.4.4-6.8-1.1-8-4.5a9 9 0 0 1 14 7.2c-2 .4-4.4-.4-6-2.1"/></svg>`,
            matchcaps:  `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m17 2 4 4-4 4"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><path d="m7 22-4-4 4-4"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/></svg>`,
            kannada:    `<span style="font-family:'Noto Sans Kannada',serif;font-size:20px;font-weight:600;color:#fff">ಅ</span>`,
            hindi:      `<span style="font-family:'Noto Sans Kannada',serif;font-size:20px;font-weight:600;color:#fff">अ</span>`,
            saynumbers: `<span style="font-family:'Baloo 2',sans-serif;font-size:20px;font-weight:700;color:#fff">3</span>`,
            blends:     `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 10v.2A3 3 0 0 1 8.9 16H5a3 3 0 0 1-1-5.8V10a3 3 0 0 1 6 0Z"/><path d="M7 16v4"/><path d="M13 19v3"/><path d="M12 19h8.3a1 1 0 0 0 .7-1.7L18 14h.3a1 1 0 0 0 .7-1.7L16 9h.2a1 1 0 0 0 .8-1.7L13 3l-1.4 1.5"/></svg>`,
            words:      `<span style="font-family:'Baloo 2',sans-serif;font-size:15px;font-weight:800;color:#fff">cat</span>`,
        };
        chip.innerHTML = icons[mode] || '';
    }
}

function addCheckBadge(btn) {
    const badge = document.createElement("div");
    badge.className = "check-badge";
    if (currentTheme === "chalkboard") {
        badge.innerHTML = '<span style="font-family:\'Baloo 2\',sans-serif;font-size:16px;font-weight:800;color:#23272F;line-height:1">✓</span>';
    } else {
        badge.innerHTML = '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>';
    }
    btn.appendChild(badge);
}

function styleTile(btn, i) {
    const c = tileColor(i);
    if (currentTheme === "chalkboard") {
        btn.style.background = "#23272F";
        btn.style.border = `3px solid ${c}`;
        btn.style.boxShadow = `0 0 14px 2px ${c}66`;
        btn.style.color = c;
    } else {
        btn.style.background = c;
        btn.style.border = "none";
        btn.style.boxShadow = "0 4px 10px rgba(0,0,0,0.18)";
        btn.style.color = "#fff";
    }
}

function setLetterDisplayColor(mode) {
    const el = document.getElementById("letter-display");
    if (!el) return;
    const c = modeColor(mode);
    if (currentTheme === "chalkboard") {
        el.style.background = "#23272F";
        el.style.border = `4px solid ${c}`;
        el.style.boxShadow = `0 0 26px 4px ${c}8C`;
        el.style.color = c;
    } else {
        el.style.background = c;
        el.style.border = "none";
        el.style.boxShadow = "0 4px 16px rgba(0,0,0,0.22)";
        el.style.color = "#fff";
    }
}

function applyTheme(theme) {
    currentTheme = theme;
    localStorage.setItem("lb_theme", theme);
    document.body.classList.toggle("theme-rainbow", theme === "rainbow");
    document.querySelectorAll(".theme-btn").forEach(b => {
        b.classList.toggle("active", b.dataset.theme === theme);
    });
    buildLevelGrid();
    buildLegend();
}

// Pick a deep male voice with a neutral accent
let friendlyVoice = null;
function pickVoice() {
    const voices = speechSynthesis.getVoices();
    // Prefer deep male voices — clear neutral accent, understandable for Indian children
    // Alex: macOS/iOS neutral American male (deep, authoritative)
    // Daniel: macOS/iOS British male (clear, warm)
    // Google UK English Male: Chrome on Android/desktop
    // Microsoft David: Windows neutral American male
    // Tom: macOS older male voice
    const preferred = [
        "Alex", "Daniel", "Tom",
        "Google UK English Male",
        "Microsoft David", "Microsoft Mark",
    ];
    for (const name of preferred) {
        const v = voices.find(v => v.name.includes(name));
        if (v) { friendlyVoice = v; return; }
    }
    // Fallback: any English male voice
    const male = voices.find(v => v.lang.startsWith("en") && v.name.toLowerCase().includes("male"));
    if (male) { friendlyVoice = male; return; }
    // Final fallback: any English voice
    friendlyVoice = voices.find(v => v.lang.startsWith("en")) || null;
}
if ("speechSynthesis" in window) {
    speechSynthesis.onvoiceschanged = pickVoice;
    pickVoice();
}

function speak(text) {
    if (!("speechSynthesis" in window)) return;
    speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(text);
    if (friendlyVoice) utter.voice = friendlyVoice;
    utter.rate = 0.85;   // slightly slower for clarity
    utter.pitch = 0.85;  // lower pitch for deep male resonance
    utter.volume = 1.0;
    utter.lang = "en-US";
    speechSynthesis.speak(utter);
}

// ── Build Level Grid (circle nodes) ────────────────────────────────

function makeNode({ color, content, isLocked, isCurrent, isExam, onclick }) {
    const node = document.createElement("div");
    let cls = "level-node";
    if (isLocked) cls += " locked";
    else if (isCurrent) cls += " current";
    else if (isExam) cls += " exam";
    node.className = cls;
    if (!isLocked) {
        if (currentTheme === "chalkboard") {
            const borderW = isCurrent ? "4px" : "3px";
            const glow = isCurrent ? `0 0 24px 4px ${color}CC` : `0 0 16px 2px ${color}80`;
            node.style.background = `${color}28`;
            node.style.border     = `${borderW} solid ${color}`;
            node.style.boxShadow  = glow;
            node.style.color      = color;
        } else {
            node.style.background = color;
            node.style.border     = "none";
            node.style.boxShadow  = isCurrent ? "0 6px 18px rgba(0,0,0,0.28)" : "0 4px 12px rgba(0,0,0,0.18)";
            node.style.color      = "#fff";
        }
        node.innerHTML = content;
        node.addEventListener("click", onclick);
    } else {
        if (currentTheme === "chalkboard") {
            node.innerHTML = '<span style="font-family:\'Baloo 2\',sans-serif;font-size:28px;font-weight:700">?</span>';
        } else {
            node.innerHTML = '<svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>';
        }
    }
    return node;
}

function buildLevelGrid() {
    const grid = document.getElementById("level-grid");
    grid.innerHTML = "";
    updateHomeworkBanner();

    if (currentAppMode === "words") {
        WORD_LEVELS.forEach(({ label, words, mode, isTest }, idx) => {
            const color = qTypeColor(mode, isTest);
            const icon = qTypeIcon(mode, false);
            const lines = label.split("\n");
            const isMulti = lines.length > 1;
            const labelHtml = isMulti
                ? lines.map(w => `<span style="font-family:'Baloo 2',sans-serif;font-size:15px;font-weight:800;color:inherit;line-height:1.1;display:block">${w}</span>`).join("")
                : `<span style="font-family:'Baloo 2',sans-serif;font-size:18px;font-weight:800;color:inherit;line-height:1">${label}</span>`;
            const content = `<div style="display:flex;flex-direction:column;align-items:center;gap:1px">
                ${labelHtml}
                <span style="font-size:11px;line-height:1">${icon}</span>
            </div>`;
            grid.appendChild(makeNode({
                color,
                content,
                isLocked: homeworkLocked("words", idx),
                isCurrent: false,
                isExam: !!isTest,
                onclick: () => startWordsGame(words, mode),
            }));
        });
        return;
    }

    if (currentAppMode === "saynumbers") {
        NUMBER_LEVELS.forEach(({ label, range, mode, isTest }, idx) => {
            const color = qTypeColor(mode, isTest);
            const icon = isTest ? "★" : qTypeIcon(mode, false);
            const content = `<span style="font-family:'Baloo 2',sans-serif;font-size:20px;font-weight:700;color:inherit;text-align:center;line-height:1.1">${label}<br><span style="font-size:13px">${icon}</span></span>`;
            grid.appendChild(makeNode({
                color,
                content,
                isLocked: homeworkLocked("saynumbers", idx),
                isCurrent: false,
                isExam: isTest,
                onclick: () => startNumbers(mode, range),
            }));
        });
        return;
    }

    if (currentAppMode === "kannada") {
        KANNADA_LEVELS.forEach(({ label, letters, mode, isTest }, idx) => {
            const color = qTypeColor(mode, isTest);
            const letterStr = isTest
                ? `${letters[0]}–${letters[letters.length - 1]}`
                : letters.slice(0, 2).join('');
            const fs = isTest ? "22px" : letters.length > 2 ? "26px" : "34px";
            const sublabel = qTypeIcon(mode, isTest);
            const content = `<div style="display:flex;flex-direction:column;align-items:center;gap:1px">
                <span style="font-family:'Noto Sans Kannada',serif;font-size:${fs};font-weight:700;color:inherit;line-height:1.15">${letterStr}</span>
                <span style="font-size:11px;line-height:1">${sublabel}</span>
            </div>`;
            grid.appendChild(makeNode({
                color,
                content,
                isLocked: homeworkLocked("kannada", idx),
                isCurrent: false,
                isExam: isTest,
                onclick: () => startKannadaGame(letters, mode, isTest, idx),
            }));
        });
        return;
    }

    if (currentAppMode === "hindi") {
        HINDI_LEVELS.forEach(({ label, letters, mode, isTest }, idx) => {
            const color = qTypeColor(mode, isTest);
            const letterStr = isTest
                ? `${letters[0]}–${letters[letters.length - 1]}`
                : letters.slice(0, 2).join('');
            const fs = isTest ? "22px" : letters.length > 2 ? "26px" : "34px";
            const sublabel = qTypeIcon(mode, isTest);
            const content = `<div style="display:flex;flex-direction:column;align-items:center;gap:1px">
                <span style="font-family:'Noto Sans Kannada',serif;font-size:${fs};font-weight:700;color:inherit;line-height:1.15">${letterStr}</span>
                <span style="font-size:11px;line-height:1">${sublabel}</span>
            </div>`;
            grid.appendChild(makeNode({
                color,
                content,
                isLocked: homeworkLocked("hindi", idx),
                isCurrent: false,
                isExam: isTest,
                onclick: () => startHindiGame(letters, mode),
            }));
        });
        return;
    }

    if (currentAppMode === "blends") {
        const audioColor = qTypeColor("hear");
        BLENDS_LEVELS.forEach(({ label, activeBlends }) => {
            const isAll = label === "★";
            const content = isAll
                ? `<span style="font-family:'Baloo 2',sans-serif;font-size:36px;font-weight:900;color:inherit">★</span>`
                : `<div style="display:flex;flex-direction:column;align-items:center;gap:1px">
                    <span style="font-family:'Baloo 2',sans-serif;font-size:18px;font-weight:900;color:inherit;line-height:1.1">${label}</span>
                    <span style="font-size:11px;line-height:1">${QTYPE_ICONS.audio}</span>
                  </div>`;
            grid.appendChild(makeNode({
                color: audioColor,
                content,
                isLocked: false,
                isCurrent: false,
                isExam: false,
                onclick: () => startBlendsGame(activeBlends),
            }));
        });
        return;
    }

    if (currentAppMode === "matchcaps") {
        const unlockedPair = getCapsUnlockedLevel();
        const capsLockedAt = i => CAPS_LEVELS[i].pair > unlockedPair || homeworkLocked("matchcaps", i);
        CAPS_LEVELS.forEach((gl, idx) => {
            const isLocked = capsLockedAt(idx);
            const isTest = gl.mode === "caps-test";
            const color = qTypeColor(gl.mode);
            const isCurrent = !isLocked && idx + 1 < CAPS_LEVELS.length && capsLockedAt(idx + 1);
            const rangeStr = isTest
                ? `${gl.cumulative[0]}–${gl.cumulative[gl.cumulative.length - 1]}`
                : `${gl.letters[0]}–${gl.letters[gl.letters.length - 1]}`;
            const sublabel = isTest ? "★" : QTYPE_ICONS.letter;
            const content = `<div style="display:flex;flex-direction:column;align-items:center;gap:1px">
                <span style="font-family:'Baloo 2',sans-serif;font-size:28px;font-weight:700;color:inherit;line-height:1.15">${rangeStr}</span>
                <span style="font-size:11px;line-height:1">${sublabel}</span>
            </div>`;
            grid.appendChild(makeNode({
                color,
                content,
                isLocked,
                isCurrent,
                isExam: isTest,
                onclick: () => startCapsGame(idx),
            }));
        });
        return;
    }

    const unlockedPair = getUnlockedLevel();
    const quizLockedAt = i => GAME_LEVELS[i].pair > unlockedPair || homeworkLocked("quiz", i);

    GAME_LEVELS.forEach((gl, idx) => {
        const items = ALL_ITEMS.filter((it) => it.level === gl.contentLevel);
        const isLocked = quizLockedAt(idx);
        const isCurrent = !isLocked && idx + 1 < GAME_LEVELS.length && quizLockedAt(idx + 1);
        const displayItem = gl.mode === "reverse" ? items[items.length - 1] : items[0];
        const color = qTypeColor(gl.mode);

        const content = displayItem?.image
            ? `<img src="${displayItem.image}" alt="${displayItem.word}">`
            : `<span style="font-family:'Baloo 2',sans-serif;font-size:34px;font-weight:700;color:inherit">${displayItem?.letter || '?'}</span>`;

        grid.appendChild(makeNode({
            color,
            content,
            isLocked,
            isCurrent,
            isExam: false,
            onclick: () => startGame(idx),
        }));
    });

    // A–Z exam nodes
    const examColor = modeColor("quiz");
    ["normal", "reverse"].forEach(mode => {
        const icon = mode === "normal" ? "🔤" : "🖼️";
        grid.appendChild(makeNode({
            color: examColor,
            content: `<span style="font-family:'Baloo 2',sans-serif;font-size:20px;font-weight:700;color:inherit;text-align:center;line-height:1.2">A–Z<br><span style="font-size:14px">${icon}</span></span>`,
            isLocked: false,
            isCurrent: false,
            isExam: true,
            onclick: () => startExam(mode),
        }));
    });
    buildLegend();
}

// Load WordVideos.json, merge video data into ALL_ITEMS, then build grid
async function initWordVideos() {
    try {
        const res = await fetch("WordVideos.json");
        const data = await res.json();
        if (data.video_id) VIDEO_ID = data.video_id;
        ALL_ITEMS.forEach(item => {
            const v = data.letters[item.letter];
            if (!v) return;
            if (v.localVid)   { item.localVid = v.localVid; }
            else              { item.vidStart = v.vidStart; item.vidEnd = v.vidEnd; }
            if (v.funnyShort) { item.funnyShort = v.funnyShort; item.funnyStart = v.funnyStart ?? 0; }
        });
    } catch (e) {
        console.warn("Could not load WordVideos.json — videos disabled", e);
    }
    buildLevelGrid();
}
initWordVideos();

// ── Phonetics toggle ─────────────────────────────────────────────────
const phoneticsRealToggle = document.getElementById("phonetics-real-toggle");
phoneticsRealToggle.checked = getPhoneticMode();
phoneticsRealToggle.addEventListener("change", () => setPhoneticMode(phoneticsRealToggle.checked));

const videoBeforeToggle = document.getElementById("video-before-toggle");
videoBeforeToggle.checked = getVideoBeforeQuestion();
videoBeforeToggle.addEventListener("change", () => {
    setVideoBeforeQuestion(videoBeforeToggle.checked);
    if (videoBeforeToggle.checked) { noVideoToggle.checked = false; setVideosDisabled(false); }
});

const noVideoToggle = document.getElementById("no-video-toggle");
noVideoToggle.checked = getVideosDisabled();
noVideoToggle.addEventListener("change", () => {
    setVideosDisabled(noVideoToggle.checked);
    if (noVideoToggle.checked) { videoBeforeToggle.checked = false; setVideoBeforeQuestion(false); }
});



// ── Settings (gear icon) ──────────────────────────────────────────────
document.getElementById("settings-btn").addEventListener("click", () => {
    const hwLine = "4 — Turn Homework Mode " + (isHomeworkMode() ? "OFF" : "ON");
    const action = prompt(
        `Settings:\n1 — Name this device\n2 — Reset progress\n3 — Set what's been learned (Homework)\n${hwLine}\n\nEnter a number:`
    );
    if (!action) return;
    if (action.trim() === "1") {
        const name = prompt("Enter a name for this device (e.g. Mom, Dad):");
        if (name && name.trim()) {
            setDeviceName(name.trim());
            speak(`Device named ${name.trim()}`);
        }
    } else if (action.trim() === "2") {
        if (confirm("Reset all progress?")) {
            localStorage.removeItem("lb_unlocked");
            buildLevelGrid();
            showScreen("start-screen");
            speak("Progress reset!");
        }
    } else if (action.trim() === "3") {
        openHomeworkSetup();
    } else if (action.trim() === "4") {
        setHomeworkModeEnabled(!isHomeworkMode());
        buildLevelGrid();
        speak(isHomeworkMode() ? "Homework mode on" : "Homework mode off");
    }
});

// ── Homework Setup Screen ───────────────────────────────────────────
let hwActiveTab = "quiz";

function updateHomeworkBanner() {
    const banner = document.getElementById("homework-banner");
    if (banner) banner.style.display = isHomeworkMode() ? "block" : "none";
}

function tabIconLabel(tab) {
    return { quiz: "🔤", matchcaps: "🔡", kannada: "ಅ", hindi: "अ", saynumbers: "3", words: "cat" }[tab];
}

function tabLevelLabel(tab, level) {
    switch (tab) {
        case "quiz": {
            const items = ALL_ITEMS.filter(it => it.level === level.contentLevel);
            const it = level.mode === "reverse" ? items[items.length - 1] : items[0];
            return it?.letter || "?";
        }
        case "matchcaps":
            return level.mode === "caps-test"
                ? `${level.cumulative[0]}–${level.cumulative[level.cumulative.length - 1]}`
                : level.letters.join("");
        case "kannada":
        case "hindi":
            return level.letters.slice(0, 2).join("");
        case "saynumbers":
            return level.label;
        case "words":
            return level.label.split("\n")[0];
    }
}

function buildHomeworkTabs() {
    const wrap = document.getElementById("hw-tabs");
    wrap.innerHTML = "";
    HOMEWORK_TABS.forEach(tab => {
        const btn = document.createElement("button");
        btn.className = "hw-tab-btn" + (tab === hwActiveTab ? " active" : "");
        btn.textContent = tabIconLabel(tab);
        btn.addEventListener("click", () => {
            hwActiveTab = tab;
            buildHomeworkTabs();
            buildHomeworkGrid();
        });
        wrap.appendChild(btn);
    });
}

function buildHomeworkGrid() {
    const grid = document.getElementById("hw-level-grid");
    grid.innerHTML = "";
    const levels = getLevelsForTab(hwActiveTab);
    const ceiling = getHomeworkCeiling(hwActiveTab);
    levels.forEach((level, idx) => {
        const learned = idx < ceiling;
        const node = document.createElement("div");
        node.className = "hw-node" + (learned ? " learned" : "");
        node.innerHTML = `<span>${tabLevelLabel(hwActiveTab, level)}</span>${learned ? '<span class="hw-check">✓</span>' : ''}`;
        node.addEventListener("click", () => {
            setHomeworkCeiling(hwActiveTab, idx + 1);
            buildHomeworkGrid();
        });
        grid.appendChild(node);
    });
}

function updateHomeworkModeToggleBtn() {
    const btn = document.getElementById("hw-mode-toggle");
    if (!btn) return;
    btn.textContent = isHomeworkMode()
        ? "🔓 Turn Homework Mode OFF (show everything)"
        : "🔒 Turn Homework Mode ON";
}

function toggleHomeworkModeFromSetup() {
    setHomeworkModeEnabled(!isHomeworkMode());
    updateHomeworkModeToggleBtn();
}

function openHomeworkSetup() {
    buildHomeworkTabs();
    buildHomeworkGrid();
    updateHomeworkModeToggleBtn();
    showScreen("homework-screen");
}

function closeHomeworkSetup() {
    showScreen("start-screen");
    buildLevelGrid();
}

// ── Game Flow ───────────────────────────────────────────────────────

let currentGameLevelIdx = 0; // index into GAME_LEVELS
let isExamMode = false;

const EXAM_LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWX".split("");

function startExam(mode) {
    isExamMode = true;
    currentGameLevelIdx = -1;
    gameMode = mode;
    currentLevel = 0;
    const examItems = ALL_ITEMS.filter(it => EXAM_LETTERS.includes(it.letter));
    levelItems = [...examItems];
    queue = shuffle([...examItems]); // 1x each, no repeats
    currentIndex = 0;
    stars = 0;
    sessionStats = [];
    document.getElementById("stars").textContent = stars;
    setModeChip("quiz");
    showScreen("quiz-screen");
    loadRound();
}

function startGame(gameLevelIdx) {
    isExamMode = false;
    currentGameLevelIdx = gameLevelIdx;
    const gl = GAME_LEVELS[gameLevelIdx];
    currentLevel = gl.contentLevel;
    gameMode = gl.mode;

    // New letters for this level (repeated 3x for reinforcement)
    const newItems = ALL_ITEMS.filter((it) => it.level === currentLevel);
    const repeatedNew = [...newItems, ...newItems, ...newItems]; // 3 reps each
    // Review items from all previous levels
    const reviewPool = ALL_ITEMS.filter((it) => it.level < currentLevel);
    const reviewItems = shuffle(reviewPool).slice(0, 4);
    // Combined pool for distractor selection
    levelItems = [...newItems, ...reviewItems];
    // Queue: 3x new + review, shuffled
    queue = shuffleNoRepeat([...repeatedNew, ...reviewItems]);
    currentIndex = 0;
    stars = 0;
    sessionStats = [];
    document.getElementById("stars").textContent = stars;
    setModeChip(currentAppMode);
    showScreen("quiz-screen");
    loadRound();
}

function loadRound() {
    if (currentIndex >= queue.length) {
        showDone();
        return;
    }

    answered = false;
    roundClean = true;
    roundWrongs = 0;
    currentItem = queue[currentIndex];
    document.getElementById("choices").className = "";

    const letterDisplay = document.getElementById("letter-display");

    const buildQuizQuestion = () => {
        if (gameMode === "reverse") {
            // Reverse mode: show image, pick the letter
            letterDisplay.innerHTML = `
                <div class="letter-label">${currentItem.word}</div>
                <img id="big-image" class="big-quiz-image" src="${currentItem.image}" alt="?">
            `;
            const bigImg = document.getElementById("big-image");
            bigImg.style.animation = "none";
            void bigImg.offsetWidth;
            bigImg.style.animation = "popIn 0.4s ease-out";

            speak(`${currentItem.word}`);

            const wrong = shuffle(levelItems.filter((it) => it.letter !== currentItem.letter)).slice(0, 3);
            const options = shuffle([currentItem, ...wrong]);

            const choicesEl = document.getElementById("choices");
            choicesEl.innerHTML = "";
            options.forEach((opt, i) => {
                const btn = document.createElement("button");
                btn.className = "choice-btn choice-letter-btn";
                styleTile(btn, i);
                btn.dataset.letter = opt.letter;
                btn.textContent = opt.letter;
                btn.onclick = () => handleChoice(btn, opt);
                choicesEl.appendChild(btn);
            });
        } else {
            // Normal mode: show letter, pick the image
            letterDisplay.innerHTML = `
                <div id="big-letter">A</div>
            `;
            const bigLetter = document.getElementById("big-letter");
            bigLetter.textContent = currentItem.letter;
            bigLetter.style.animation = "none";
            void bigLetter.offsetWidth;
            bigLetter.style.animation = "popIn 0.4s ease-out";

            speak(`${currentItem.letter.toLowerCase()}`);

            const wrong = shuffle(levelItems.filter((it) => it.letter !== currentItem.letter)).slice(0, 3);
            const options = shuffle([currentItem, ...wrong]);

            const choicesEl = document.getElementById("choices");
            choicesEl.innerHTML = "";
            options.forEach((opt, i) => {
                const btn = document.createElement("button");
                btn.className = "choice-btn";
                styleTile(btn, i);
                btn.dataset.letter = opt.letter;
                if (opt.image) {
                    btn.innerHTML = `<img class="choice-img" src="${opt.image}" alt="${opt.word}">`;
                } else {
                    btn.innerHTML = `<span class="choice-emoji">${opt.emoji}</span>`;
                }
                btn.onclick = () => handleChoice(btn, opt);
                choicesEl.appendChild(btn);
            });

            if (window.twemoji) twemoji.parse(choicesEl, { folder: 'svg', ext: '.svg' });
        }

        setLetterDisplayColor(currentAppMode);

        document.getElementById("round-info").textContent = `${currentIndex + 1} / ${queue.length}`;
        document.getElementById("progress-fill").style.width = `${(currentIndex / queue.length) * 100}%`;
    };

    if (!getVideosDisabled() && getVideoBeforeQuestion() && ytReady) {
        afterVideoHide = buildQuizQuestion;
        playVideoReward();
        return;
    }

    buildQuizQuestion();
}

function handleChoice(btn, chosen) {
    if (answered) return;

    const isCorrect = chosen.letter === currentItem.letter;

    if (isCorrect) {
        answered = true;
        // Dim all others, highlight correct
        document.querySelectorAll(".choice-btn").forEach((b) => {
            b.classList.add("dimmed");
        });
        btn.classList.remove("dimmed");
        btn.classList.add("correct");
        addCheckBadge(btn);
        if (roundClean) {
            stars++;
            document.getElementById("stars").textContent = stars;
        }

        // Record stats for this letter
        sessionStats.push({
            letter: currentItem.letter,
            word: currentItem.word,
            firstTry: roundClean,
            wrongs: roundWrongs
        });

        playCorrectSound();
        setTimeout(() => speak(`${currentItem.letter} for ${currentItem.word}!`), 500);

        showFeedback(true);
        spawnConfetti();

        if (getVideoBeforeQuestion() && !getVideosDisabled()) {
            setTimeout(() => advanceRound(), 1200);
        } else {
            setTimeout(() => playVideoReward(), 1600);
        }
        return;
    } else {
        btn.classList.add("wrong");
        btn.disabled = true;

        roundClean = false;
        roundWrongs++;
        playWrongSound();
        setTimeout(() => speak("Try again!"), 400);

        answered = false;
        return;
    }
}

// ── YouTube Video Reward ────────────────────────────────────────────

let VIDEO_ID = "a_DRSc0oZV0";

// ── Letter Video (letter-name pronunciation) ──────────────────────────
const PHONICS_VIDEO_ID = "svmmuYQPrI4";
const PHONICS_TIMESTAMPS = {
    "A":0,"B":13,"C":27,"D":40,"E":52,"F":64,"G":79,"H":93,
    "I":106,"J":118,"K":131,"L":145,"M":157,"N":169,"O":182,
    "P":196,"Q":211,"R":224,"S":238,"T":254,"U":268,"V":280,
    "W":295,"X":309,"Y":323,"Z":337
};

// ── Phonetics Video (phonetic sounds) — MbO6vGBkx48, 3:06 total ──
// A-I verified manually; J-Z extrapolated at ~7s per letter
const PHONETICS_VIDEO_ID = "MbO6vGBkx48";
const PHONETICS_TIMESTAMPS = {
    "A":0,  "B":7,  "C":16, "D":23, "E":31, "F":39, "G":46, "H":53,
    "I":60, "J":66, "K":74, "L":80, "M":88, "N":94, "O":100,"P":107,
    "Q":113,"R":122,"S":130,"T":138,"U":145,"V":152,"W":158,"X":166,
    "Y":172,"Z":179
};

// Phonetics toggle — ON: plays phonetic-sound video (MbO6vGBkx48), OFF: plays letter video (svmmuYQPrI4)
function getPhoneticMode() {
    return localStorage.getItem("lb_phonetic") === "1";
}
function setPhoneticMode(val) {
    localStorage.setItem("lb_phonetic", val ? "1" : "0");
}

function getVideosDisabled() {
    return localStorage.getItem("lb_novideo") === "1";
}
function setVideosDisabled(val) {
    localStorage.setItem("lb_novideo", val ? "1" : "0");
}

function getVideoBeforeQuestion() {
    return localStorage.getItem("lb_video_before") === "1";
}
function setVideoBeforeQuestion(val) {
    localStorage.setItem("lb_video_before", val ? "1" : "0");
}

function getPhonicsClip(letter) {
    const start = PHONICS_TIMESTAMPS[letter] ?? 0;
    return { start, end: start + 5 };
}
let ytPlayer = null;
let ytReady = false;
let videoTimer = null;
let videoShowing = false;

// Shorts rewards for perfect scores (sequential, resumable)
const SHORTS_IDS = [
    "-1fRlNP9KgY", "tbUS36NpM_M", "c1ZqkX3lZLY", "DE7h_dXmfNg", "z3BQTzydsVU",
    "M0qRwvputkI", "eJNpH4jreDI", "SL29f5RzwbM", "P-TMxmIcph4", "GIYaY4LS2nc",
    "-s-iHh7UAJY", "FcY4kzCaWyc", "Pyw0tmWhVCs", "aO1JRstVdgM", "L5LIrg4jyBw",
    "yKS1oWO5ZeI", "NRId6E9N3f8", "gl8RJ_W9380", "l4OnYlpNdQ4", "diLZ53-PaJk",
    "laL9K4MvH3o", "s5C-4roQZKM", "3H3qzqsChCA", "Ko5P0IVfywg", "7QS77Xcwye8",
    "kLChOx3ZpbQ", "6ikIOgh1YSg", "OsZRnlSPszI", "QzW8EkGUNfg", "7gLabNol-Ao",
    "haQVzonCAM8", "Vl58aEHPh0k", "5QQLKA30JDo", "36ba8fxuPdU", "i8BFf6CcnCo",
    "4YuBTA5Ok3I", "y0oIfXMppdI", "yJRo6abVVzo", "hkFmDezafYo", "mUFdyCNaK5Q",
    "rk5n55LBHmY", "AtUQLfh4CZY", "oXFCUw98cvI", "NmRj8Bw3yj0", "pwFsKOlYexQ",
    "dWsMBuCqXrY", "t24Cd8kcOKA", "ABW46ztBJIA", "T0uAwnWqfcY", "I6X11muVoEM"
];
const CARTOON_PLAY_DURATION = 5 * 60; // 5 minutes in seconds
let cartoonTimer = null;
let isCartoonPlaying = false;

function getCartoonState() {
    const saved = localStorage.getItem("lb_cartoon");
    if (saved) return JSON.parse(saved);
    return { index: 0, position: 0 };
}

function saveCartoonState(index, position) {
    localStorage.setItem("lb_cartoon", JSON.stringify({ index, position }));
}

// Called automatically by YouTube IFrame API
function onYouTubeIframeAPIReady() {
    ytPlayer = new YT.Player("yt-player", {
        width: "100%",
        height: "100%",
        videoId: VIDEO_ID,
        playerVars: {
            autoplay: 0,
            controls: 1,
            modestbranding: 1,
            rel: 0,
            showinfo: 0,
            playsinline: 1,
        },
        events: {
            onReady: () => { ytReady = true; },
            onStateChange: onPlayerStateChange,
        },
    });
}

function onPlayerStateChange(e) {
    // When per-letter video ends (state 0), hide overlay and advance
    if (e.data === YT.PlayerState.ENDED) {
        hideVideoOverlay();
    }
}

function playPhonicsClip() {
    if (!ytReady) { advanceRound(); return; }
    const { start, end } = getPhonicsClip(currentItem.letter);
    const overlay = document.getElementById("video-overlay");
    const localPlayer = document.getElementById("local-player");
    const ytEl = document.getElementById("yt-player");
    localPlayer.style.display = "none";
    ytEl.style.display = "block";
    overlay.className = "video-overlay show";
    videoShowing = true;
    ytPlayer.loadVideoById({ videoId: PHONICS_VIDEO_ID, startSeconds: start });
    clearInterval(videoTimer);
    videoTimer = setInterval(() => {
        if (ytPlayer.getCurrentTime && ytPlayer.getCurrentTime() >= end) {
            clearInterval(videoTimer);
            hideVideoOverlay();
        }
    }, 200);
    safetyTimer = setTimeout(() => {
        clearInterval(videoTimer);
        hideVideoOverlay();
    }, 5000);
}

function playPhoneticClip() {
    if (!ytReady) { advanceRound(); return; }
    const start = PHONETICS_TIMESTAMPS[currentItem.letter] ?? 50;
    const end = start + 5;
    const overlay = document.getElementById("video-overlay");
    const localPlayer = document.getElementById("local-player");
    const ytEl = document.getElementById("yt-player");
    localPlayer.style.display = "none";
    ytEl.style.display = "block";
    overlay.className = "video-overlay show";
    videoShowing = true;
    ytPlayer.loadVideoById({ videoId: PHONETICS_VIDEO_ID, startSeconds: start });
    clearInterval(videoTimer);
    videoTimer = setInterval(() => {
        if (ytPlayer.getCurrentTime && ytPlayer.getCurrentTime() >= end) {
            clearInterval(videoTimer);
            hideVideoOverlay();
        }
    }, 200);
    safetyTimer = setTimeout(() => {
        clearInterval(videoTimer);
        hideVideoOverlay();
    }, 5000);
}

function playVideoReward() {
    if (getVideosDisabled()) { advanceRound(); return; }
    if (getPhoneticMode()) { playPhoneticClip(); return; }
    playPhonicsClip();
}

function playKannadaVideo() {
    if (getVideosDisabled()) { proceedFromVideo(); return; }
    const overlay = document.getElementById("video-overlay");
    const localPlayer = document.getElementById("local-player");
    const ytEl = document.getElementById("yt-player");

    if (currentItem.letter === "ಈ") {
        localPlayer.src = "videos/only ee.mp4";
        localPlayer.load();
        localPlayer.currentTime = 0;
        localPlayer.style.display = "block";
        ytEl.style.display = "none";
        overlay.className = "video-overlay show";
        videoShowing = true;
        clearInterval(videoTimer);
        localPlayer.play().catch(() => {
            proceedFromVideo();
        });
        videoTimer = setInterval(() => {
            if (localPlayer.duration && localPlayer.currentTime >= localPlayer.duration - 0.2) {
                clearInterval(videoTimer);
                hideVideoOverlay();
            }
        }, 200);
        safetyTimer = setTimeout(() => {
            clearInterval(videoTimer);
            hideVideoOverlay();
        }, 10000);
        return;
    }

    if (!ytReady || currentItem.vidStart == null) { proceedFromVideo(); return; }
    const start = currentItem.letter === "ಅ"
        ? 18
        : currentItem.letter === "ಆ"
            ? 32
            : currentItem.letter === "ಇ"
                ? 47
                : currentItem.vidStart;
    const end = start + 5;
    const videoId = currentItem.vidId || KANNADA_VIDEO_ID;
    localPlayer.style.display = "none";
    ytEl.style.display = "block";
    overlay.className = "video-overlay show";
    videoShowing = true;
    ytPlayer.loadVideoById({ videoId, startSeconds: start });
    clearInterval(videoTimer);
    videoTimer = setInterval(() => {
        if (ytPlayer.getCurrentTime && ytPlayer.getCurrentTime() >= end) {
            clearInterval(videoTimer);
            hideVideoOverlay();
        }
    }, 200);
    safetyTimer = setTimeout(() => {
        clearInterval(videoTimer);
        hideVideoOverlay();
    }, 10000);
}

let safetyTimer = null;
let afterVideoHide = null;

function proceedFromVideo() {
    if (afterVideoHide) {
        const cb = afterVideoHide;
        afterVideoHide = null;
        cb();
    } else {
        advanceRound();
    }
}

function hideVideoOverlay() {
    if (!videoShowing) return; // prevent double-fire
    videoShowing = false;
    clearInterval(videoTimer);
    clearTimeout(safetyTimer);
    const overlay = document.getElementById("video-overlay");
    const localPlayer = document.getElementById("local-player");
    overlay.className = "video-overlay hidden";
    document.getElementById("skip-cartoon").style.display = "none";
    if (localPlayer) {
        localPlayer.pause();
        localPlayer.currentTime = 0;
    }
    if (ytPlayer) ytPlayer.pauseVideo();
    if (afterVideoHide) {
        const cb = afterVideoHide;
        afterVideoHide = null;
        cb();
    } else {
        advanceRound();
    }
}

function skipCartoon() {
    // Legacy — only for video-overlay skip button (per-letter clips)
    hideVideoOverlay();
}

// ── Feedback ────────────────────────────────────────────────────────

function showFeedback(correct) {
    if (correct) {
        const banner = document.getElementById("celebration-banner");
        if (banner) {
            banner.classList.remove("hidden");
            banner.style.animation = "none";
            void banner.offsetWidth;
            banner.style.animation = "slideUp 0.35s ease-out";
            setTimeout(() => banner.classList.add("hidden"), 1500);
        }
        return;
    }

    const fb = document.getElementById("feedback");
    const emoji = document.getElementById("feedback-emoji");
    const text = document.getElementById("feedback-text");

    fb.className = "feedback show wrong-fb";
    emoji.textContent = "😊";
    if (currentAppMode === "matchcaps") {
        text.textContent = `It's ${currentItem.letter} / ${currentItem.letter.toLowerCase()}!`;
    } else if (currentAppMode === "kannada") {
        text.textContent = `It's ${currentItem.roman}!`;
    } else if (currentAppMode === "hindi") {
        text.textContent = `It's ${currentItem.roman}!`;
    } else if (currentAppMode === "blends") {
        text.textContent = `It's ${currentItem.blend}!`;
    } else if (currentAppMode === "words") {
        text.textContent = `It's "${currentItem.word}"!`;
    } else {
        text.textContent = `It's ${currentItem.word}!`;
    }

    setTimeout(() => {
        fb.className = "feedback hidden";
    }, 1800);
}

function spawnConfetti() {
    const colors = ["#f6d365", "#fda085", "#a18cd1", "#fbc2eb", "#84fab0", "#ff6b6b"];
    for (let i = 0; i < 30; i++) {
        const c = document.createElement("div");
        c.className = "confetti";
        c.style.left = Math.random() * 100 + "vw";
        c.style.top = "-10px";
        c.style.background = colors[Math.floor(Math.random() * colors.length)];
        c.style.width = (6 + Math.random() * 8) + "px";
        c.style.height = (6 + Math.random() * 8) + "px";
        c.style.animationDuration = (1.5 + Math.random() * 1.5) + "s";
        c.style.animationDelay = Math.random() * 0.5 + "s";
        document.body.appendChild(c);
        setTimeout(() => c.remove(), 3500);
    }
}

// ── Done Screen ─────────────────────────────────────────────────────

function showDone() {
    document.getElementById("progress-fill").style.width = "100%";
    document.getElementById("final-score").textContent = stars;
    document.getElementById("final-total").textContent = queue.length;
    document.getElementById("final-stars").textContent = "⭐".repeat(stars) + "☆".repeat(queue.length - stars);

    showScreen("done-screen");
    document.getElementById("unlock-msg").style.display = "none";

    if (isExamMode) {
        speak(stars === queue.length
            ? "Perfect score! Amazing!"
            : `You got ${stars} out of ${queue.length}. Keep it up!`);
    } else if (currentAppMode === "matchcaps") {
        const gl = CAPS_LEVELS[currentGameLevelIdx];
        const unlockedPair = getCapsUnlockedLevel();
        const maxPair = CAPS_LEVELS[CAPS_LEVELS.length - 1].pair;
        const threshold = Math.ceil(queue.length * 0.8);
        let newUnlock = false;
        if (stars >= threshold && gl.mode === "caps-test" && gl.pair === unlockedPair && gl.pair < maxPair) {
            setCapsUnlockedLevel(unlockedPair + 1);
            newUnlock = true;
        }
        if (newUnlock) {
            document.getElementById("unlock-msg").style.display = "block";
            speak("Amazing! You unlocked new levels!");
        } else if (stars >= threshold) {
            speak("Great job!");
        } else {
            speak(`Good try! You got ${stars} out of ${queue.length}. Keep practicing!`);
        }
    } else {
        // Check if next pair should unlock (80% threshold)
        const gl = GAME_LEVELS[currentGameLevelIdx];
        const unlockedPair = getUnlockedLevel();
        const maxPair = GAME_LEVELS[GAME_LEVELS.length - 1].pair;
        const threshold = Math.ceil(queue.length * 0.8);
        let newUnlock = false;

        if (stars >= threshold && gl.pair === unlockedPair && gl.pair < maxPair) {
            setUnlockedLevel(unlockedPair + 1);
            newUnlock = true;
        }

        if (newUnlock) {
            document.getElementById("unlock-msg").style.display = "block";
            speak(`Amazing! You unlocked new levels!`);
        } else if (stars >= threshold) {
            speak("Great job!");
        } else {
            speak(`Good try! You got ${stars} out of ${queue.length}. Keep practicing!`);
        }
    }

    spawnConfetti();
    buildLevelGrid(); // refresh locked states
    sendStats();

    // Shorts reward for 5+ stars
    if (stars >= queue.length - 1) {
        setTimeout(() => playCartoonReward(), 2500);
    }
}

// ── Shorts Reward (simple iframe, no YT API dependency) ─────────────

function playCartoonReward() {
    const state = getCartoonState();
    const shortId = SHORTS_IDS[state.index % SHORTS_IDS.length];

    const overlay = document.getElementById("shorts-overlay");
    const iframe = document.getElementById("shorts-iframe");
    iframe.src = `https://www.youtube.com/embed/${shortId}?autoplay=1&rel=0&modestbranding=1`;
    overlay.className = "video-overlay show";
    isCartoonPlaying = true;

    // Auto-close after 5 minutes
    clearTimeout(cartoonTimer);
    cartoonTimer = setTimeout(() => {
        if (!isCartoonPlaying) return;
        // Advance to next short for next time
        const nextIndex = (state.index + 1) % SHORTS_IDS.length;
        saveCartoonState(nextIndex, 0);
        hideShorts();
    }, CARTOON_PLAY_DURATION * 1000);
}

function skipShorts() {
    clearTimeout(cartoonTimer);
    const state = getCartoonState();
    // Advance to next short for next time
    const nextIndex = (state.index + 1) % SHORTS_IDS.length;
    saveCartoonState(nextIndex, 0);
    hideShorts();
}

function hideShorts() {
    isCartoonPlaying = false;
    const overlay = document.getElementById("shorts-overlay");
    overlay.className = "video-overlay hidden";
    document.getElementById("shorts-iframe").src = "";
}

// ── Caps Match Game ───────────────────────────────────────────────────

function startCapsGame(capsLevelIdx) {
    isExamMode = false;
    currentGameLevelIdx = capsLevelIdx;
    const gl = CAPS_LEVELS[capsLevelIdx];
    gameMode = gl.mode;

    const cumItems = gl.cumulative.map(l => ALL_ITEMS.find(it => it.letter === l));

    if (gl.mode === "caps-test") {
        levelItems = [...ALL_ITEMS];
        queue = shuffle(cumItems.map(item => ({ ...item, capsDirection: "caps-normal" })));
    } else {
        const targetItems = gl.letters.map(l => ALL_ITEMS.find(it => it.letter === l));
        const priorItems = cumItems.filter(it => !gl.letters.includes(it.letter));
        const reviewItems = shuffle(priorItems).slice(0, 4);
        levelItems = [...ALL_ITEMS]; // full alphabet for distractor pool
        queue = shuffleNoRepeat([...targetItems, ...targetItems, ...targetItems, ...reviewItems]);
    }

    currentIndex = 0;
    stars = 0;
    sessionStats = [];
    document.getElementById("stars").textContent = stars;
    setModeChip("matchcaps");
    showScreen("quiz-screen");
    loadCapsRound();
}

function loadCapsRound() {
    if (currentIndex >= queue.length) {
        showDone();
        return;
    }

    answered = false;
    roundClean = true;
    roundWrongs = 0;
    currentItem = queue[currentIndex];
    document.getElementById("choices").className = "";

    const letterDisplay = document.getElementById("letter-display");
    letterDisplay.innerHTML = `<div id="big-letter">${currentItem.letter}</div>`;
    const bigLetter = document.getElementById("big-letter");
    bigLetter.style.animation = "none";
    void bigLetter.offsetWidth;
    bigLetter.style.animation = "popIn 0.4s ease-out";

    speak(currentItem.letter.toLowerCase());

    // Adjacent window of 4: target biased toward end (e.g. F → C,D,E,F)
    const ALPHA = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    const idx = ALPHA.indexOf(currentItem.letter);
    const start = Math.max(0, Math.min(idx - 3, ALPHA.length - 4));
    const poolLetters = ALPHA.slice(start, start + 4).split('');
    const wrong = poolLetters
        .filter(l => l !== currentItem.letter)
        .map(l => ALL_ITEMS.find(it => it.letter === l));
    const options = shuffle([currentItem, ...wrong]);

    const choicesEl = document.getElementById("choices");
    choicesEl.innerHTML = "";
    options.forEach((opt, i) => {
        const btn = document.createElement("button");
        btn.className = "choice-btn choice-letter-btn";
        styleTile(btn, i);
        btn.dataset.letter = opt.letter;
        btn.textContent = opt.letter.toLowerCase();
        btn.onclick = () => handleCapsChoice(btn, opt);
        choicesEl.appendChild(btn);
    });

    setLetterDisplayColor("matchcaps");
    document.getElementById("round-info").textContent = `${currentIndex + 1} / ${queue.length}`;
    document.getElementById("progress-fill").style.width = `${(currentIndex / queue.length) * 100}%`;
}

function handleCapsChoice(btn, chosen) {
    if (answered) return;

    const isCorrect = chosen.letter === currentItem.letter;

    if (isCorrect) {
        answered = true;
        document.querySelectorAll(".choice-btn").forEach(b => b.classList.add("dimmed"));
        btn.classList.remove("dimmed");
        btn.classList.add("correct");
        addCheckBadge(btn);
        if (roundClean) {
            stars++;
            document.getElementById("stars").textContent = stars;
        }

        sessionStats.push({
            letter: currentItem.letter,
            word: currentItem.word,
            firstTry: roundClean,
            wrongs: roundWrongs
        });

        playCorrectSound();
        showFeedback(true);
        spawnConfetti();
        // Always play phonetics video in Case tab, regardless of toggle
        setTimeout(() => playPhoneticClip(), 1600);
    } else {
        btn.classList.add("wrong");
        btn.disabled = true;
        roundClean = false;
        roundWrongs++;
        playWrongSound();
        setTimeout(() => speak("Try again!"), 400);
        answered = false;
    }
}

// ── Kannada Game ─────────────────────────────────────────────────────

let kannadaMode = "see";
let kannadaActiveItems = KANNADA_ITEMS;

let hindiMode = "see";
let hindiActiveItems = HINDI_ITEMS;

const _kannadaAudios = {};
KANNADA_ITEMS.forEach(item => {
    const a = new Audio(item.audio);
    a.preload = "auto";
    _kannadaAudios[item.letter] = a;
});
let _kannadaClipTimer = null;
const _hindiAudios = {};
HINDI_ITEMS.forEach(item => {
    const a = new Audio(item.audio);
    a.preload = "auto";
    _hindiAudios[item.letter] = a;
});
let _hindiClipTimer = null;

function playKannadaClip(letter) {
    const item = KANNADA_ITEMS.find(it => it.letter === letter);
    if (!item) return;
    clearTimeout(_kannadaClipTimer);
    Object.values(_kannadaAudios).forEach(a => a.pause());
    const audio = _kannadaAudios[letter];
    if (!audio) return;
    audio.currentTime = 0;
    audio.play().catch(() => {});
    _kannadaClipTimer = setTimeout(() => audio.pause(), 2500);
}

function playHindiClip(letter) {
    const item = HINDI_ITEMS.find(it => it.letter === letter);
    if (!item) return;
    clearTimeout(_hindiClipTimer);
    Object.values(_hindiAudios).forEach(a => a.pause());
    const audio = _hindiAudios[letter];
    if (!audio) return;
    audio.currentTime = 0;
    audio.play().catch(() => {});
    _hindiClipTimer = setTimeout(() => audio.pause(), 1000);
}

function shouldPlayKannadaDoubleCue(letter) {
    return ["ಅ", "ಆ", "ಇ", "ಈ", "ಉ", "ಊ", "ಋ", "ಎ"].includes(letter);
}

function getKannadaOptions(correctLetter, levelLetters = [], isTest = false, levelIndex = 0) {
    const levelLetterSet = (levelLetters || []).filter(Boolean);
    const allowFirstVowel = levelIndex === 0 || isTest;
    const correct = correctLetter;
    const pairMap = {
        "ಅ": ["ಅ", "ಆ"],
        "ಆ": ["ಅ", "ಆ"],
        "ಇ": ["ಇ", "ಈ"],
        "ಈ": ["ಇ", "ಈ"],
        "ಋ": ["ಋ", "ಎ"],
        "ಎ": ["ಋ", "ಎ"],
    };
    const pairLetters = pairMap[correct] || [correct];

    const distractorPool = KANNADA_ITEMS
        .map(item => item.letter)
        .filter(letter => {
            if (letter === "ಅ" && !allowFirstVowel) return false;
            if (pairLetters.includes(letter)) return false;
            return true;
        });

    const options = [...new Set(pairLetters)];
    const remaining = shuffle([...levelLetterSet.filter(letter => !options.includes(letter)), ...distractorPool]);
    while (options.length < 4 && remaining.length) {
        const next = remaining.shift();
        if (next && !options.includes(next)) options.push(next);
    }

    return shuffle(options).slice(0, 4);
}

let kannadaLevelIndex = 0;
let kannadaLevelIsTest = false;

function startKannadaGame(letters = KANNADA_ITEMS.map(it => it.letter), mode = "see", isTest = false, levelIndex = 0) {
    kannadaMode = mode;
    kannadaActiveItems = KANNADA_ITEMS.filter(it => letters.includes(it.letter));
    kannadaLevelIndex = levelIndex;
    kannadaLevelIsTest = isTest;
    isExamMode = false;
    currentGameLevelIdx = -1;
    gameMode = "kannada";
    queue = shuffleNoRepeat([...kannadaActiveItems, ...kannadaActiveItems, ...kannadaActiveItems]);
    currentIndex = 0;
    stars = 0;
    sessionStats = [];
    document.getElementById("stars").textContent = stars;
    setModeChip("kannada");
    showScreen("quiz-screen");
    loadKannadaRound();
}

function loadKannadaRound() {
    if (currentIndex >= queue.length) {
        showDone();
        return;
    }

    answered = false;
    roundClean = true;
    roundWrongs = 0;
    currentItem = queue[currentIndex];
    document.getElementById("choices").className = "";

    const letterDisplay = document.getElementById("letter-display");
    const choicesEl = document.getElementById("choices");
    choicesEl.innerHTML = "";

    const options = getKannadaOptions(currentItem.letter, kannadaActiveItems.map(it => it.letter), kannadaLevelIsTest, kannadaLevelIndex);

    const addKannadaLetterBtns = (opts) => {
        opts.forEach((opt, i) => {
            const btn = document.createElement("button");
            btn.className = "choice-btn choice-letter-btn";
            styleTile(btn, i);
            btn.style.fontFamily = "'Noto Sans Kannada',serif";
            btn.textContent = opt;
            btn.onclick = () => handleKannadaChoice(btn, { letter: opt });
            choicesEl.appendChild(btn);
        });
    };

    const showKannadaLetterImage = () => {
        letterDisplay.innerHTML = `
            <div style="font-size:5rem;font-family:'Noto Sans Kannada',serif;animation:popIn 0.4s ease-out">${currentItem.letter}</div>
        `;
        choicesEl.className = "image-choices";
        options.forEach((opt, i) => {
            const item = KANNADA_ITEMS.find(k => k.letter === opt);
            const btn = document.createElement("button");
            btn.className = "choice-btn choice-img-btn";
            styleTile(btn, i);
            btn.innerHTML = item?.image ? `<img src="${item.image}" alt="${opt}">` : `<span style="font-size:2rem;font-family:'Noto Sans Kannada',serif">${opt}</span>`;
            btn.dataset.letter = opt;
            btn.onclick = () => handleKannadaChoice(btn, { letter: opt });
            choicesEl.appendChild(btn);
        });
        setLetterDisplayColor("kannada");
    };

    const showKannadaPicture = () => {
        letterDisplay.innerHTML = `<img src="${currentItem.image}" style="width:130px;height:130px;object-fit:contain;animation:popIn 0.4s ease-out">`;
        setTimeout(() => playKannadaClip(currentItem.letter), 400);
        addKannadaLetterBtns(options);
        setLetterDisplayColor("kannada");
    };

    const showKannadaHear = () => {
        letterDisplay.innerHTML = `
            <div id="kannada-hear-btn" class="kannada-listen-btn">🔊</div>
            <div style="font-size:0.85rem;color:#aaa;margin-top:6px">tap to hear again</div>
        `;
        document.getElementById("kannada-hear-btn").addEventListener("click", () => playKannadaClip(currentItem.letter));
        setTimeout(() => playKannadaClip(currentItem.letter), 400);
        addKannadaLetterBtns(options);
        setLetterDisplayColor("kannada");
    };

    const videoBefore = getVideoBeforeQuestion() && !getVideosDisabled();

    if (kannadaMode === "letter-image") {
        if (videoBefore) {
            letterDisplay.innerHTML = "";
            choicesEl.innerHTML = "";
            afterVideoHide = showKannadaLetterImage;
            setTimeout(() => playKannadaVideo(), 300);
        } else {
            showKannadaLetterImage();
        }
    } else if (kannadaMode === "video-letter") {
        // Play teaching video first → then show image question + 4 letter choices
        letterDisplay.innerHTML = "";
        choicesEl.innerHTML = "";
        afterVideoHide = () => {
            setLetterDisplayColor("kannada");
            letterDisplay.innerHTML = currentItem.image
                ? `<img src="${currentItem.image}" style="width:130px;height:130px;object-fit:contain;animation:popIn 0.4s ease-out">`
                : `<div style="font-size:5rem;font-family:'Noto Sans Kannada',serif;animation:popIn 0.4s ease-out">${currentItem.letter}</div>`;
            setTimeout(() => playKannadaClip(currentItem.letter), 300);
            addKannadaLetterBtns(options);
        };
        setTimeout(() => playKannadaVideo(), 300);
    } else if (kannadaMode === "picture") {
        if (videoBefore) {
            letterDisplay.innerHTML = "";
            choicesEl.innerHTML = "";
            afterVideoHide = showKannadaPicture;
            setTimeout(() => playKannadaVideo(), 300);
        } else {
            showKannadaPicture();
        }
    } else {
        // hear mode
        if (videoBefore) {
            letterDisplay.innerHTML = "";
            choicesEl.innerHTML = "";
            afterVideoHide = showKannadaHear;
            setTimeout(() => playKannadaVideo(), 300);
        } else {
            showKannadaHear();
        }
    }

    document.getElementById("round-info").textContent = `${currentIndex + 1} / ${queue.length}`;
    document.getElementById("progress-fill").style.width = `${(currentIndex / queue.length) * 100}%`;
}

function handleKannadaChoice(btn, chosen) {
    if (answered) return;

    const isCorrect = chosen.letter === currentItem.letter;

    if (isCorrect) {
        answered = true;
        document.querySelectorAll(".choice-btn").forEach(b => b.classList.add("dimmed"));
        btn.classList.remove("dimmed");
        btn.classList.add("correct");
        addCheckBadge(btn);
        if (roundClean) {
            stars++;
            document.getElementById("stars").textContent = stars;
        }
        playCorrectSound();
        showFeedback(true);
        spawnConfetti();
        const videoAlreadyPlayed = kannadaMode === "video-letter" || (getVideoBeforeQuestion() && !getVideosDisabled());
        if (videoAlreadyPlayed) {
            playKannadaClip(currentItem.letter);
            setTimeout(() => advanceRound(), 1200);
        } else if (kannadaMode === "letter-image" || kannadaMode === "picture") {
            playKannadaClip(currentItem.letter);
            setTimeout(() => playKannadaVideo(), 1800);
        } else {
            setTimeout(() => playKannadaVideo(), 1600);
        }
    } else {
        btn.classList.add("wrong");
        btn.disabled = true;
        roundClean = false;
        roundWrongs++;
        playWrongSound();
        answered = false;
    }
}

function startHindiGame(letters = HINDI_ITEMS.map(it => it.letter), mode = "see", isTest = false, levelIndex = 0) {
    hindiMode = mode;
    hindiActiveItems = HINDI_ITEMS.filter(it => letters.includes(it.letter));
    kannadaLevelIndex = levelIndex;
    kannadaLevelIsTest = isTest;
    isExamMode = false;
    currentGameLevelIdx = -1;
    gameMode = "hindi";
    queue = shuffleNoRepeat([...hindiActiveItems, ...hindiActiveItems, ...hindiActiveItems]);
    currentIndex = 0;
    stars = 0;
    sessionStats = [];
    document.getElementById("stars").textContent = stars;
    setModeChip("hindi");
    showScreen("quiz-screen");
    loadHindiRound();
}

function loadHindiRound() {
    if (currentIndex >= queue.length) {
        showDone();
        return;
    }

    answered = false;
    roundClean = true;
    roundWrongs = 0;
    currentItem = queue[currentIndex];
    document.getElementById("choices").className = "";

    const letterDisplay = document.getElementById("letter-display");
    const choicesEl = document.getElementById("choices");
    choicesEl.innerHTML = "";

    const buildHindiChoices = () => {
        const wrong = shuffle(HINDI_ITEMS.filter(it => it.letter !== currentItem.letter)).slice(0, 3);
        shuffle([currentItem, ...wrong]).forEach((opt, i) => {
            const btn = document.createElement("button");
            btn.className = "choice-btn choice-letter-btn";
            styleTile(btn, i);
            btn.style.fontFamily = "'Noto Sans Kannada',serif";
            btn.textContent = opt.letter;
            btn.onclick = () => handleHindiChoice(btn, opt);
            choicesEl.appendChild(btn);
        });
    };

    const showHindiPicture = () => {
        letterDisplay.innerHTML = `<img src="${currentItem.image}" style="width:130px;height:130px;object-fit:contain;animation:popIn 0.4s ease-out">`;
        buildHindiChoices();
        setLetterDisplayColor("hindi");
    };

    const showHindiHear = () => {
        letterDisplay.innerHTML = `
            <div id="hindi-hear-btn" class="kannada-listen-btn">🔊</div>
            <div style="font-size:0.85rem;color:#aaa;margin-top:6px">tap to hear again</div>
        `;
        document.getElementById("hindi-hear-btn").addEventListener("click", () => playHindiClip(currentItem.letter));
        setTimeout(() => playHindiClip(currentItem.letter), 400);
        buildHindiChoices();
        setLetterDisplayColor("hindi");
    };

    const videoBefore = getVideoBeforeQuestion() && !getVideosDisabled();

    if (hindiMode === "video-letter") {
        // Play teaching video first → after it hides, show image prompt + letter choices
        letterDisplay.innerHTML = "";
        choicesEl.innerHTML = "";
        afterVideoHide = () => {
            setLetterDisplayColor("hindi");
            letterDisplay.innerHTML = currentItem.image
                ? `<img src="${currentItem.image}" style="width:130px;height:130px;object-fit:contain;animation:popIn 0.4s ease-out">`
                : `<div style="font-size:4rem;font-family:'Noto Sans Kannada',serif;animation:popIn 0.4s ease-out">${currentItem.letter}</div>`;
            setTimeout(() => playHindiClip(currentItem.letter), 300);
            buildHindiChoices();
        };
        setTimeout(() => playHindiVideo(), 300);
    } else if (hindiMode === "picture") {
        if (videoBefore) {
            letterDisplay.innerHTML = "";
            choicesEl.innerHTML = "";
            afterVideoHide = showHindiPicture;
            setTimeout(() => playHindiVideo(), 300);
        } else {
            showHindiPicture();
        }
    } else {
        // hear mode
        if (videoBefore) {
            letterDisplay.innerHTML = "";
            choicesEl.innerHTML = "";
            afterVideoHide = showHindiHear;
            setTimeout(() => playHindiVideo(), 300);
        } else {
            showHindiHear();
        }
    }
    document.getElementById("round-info").textContent = `${currentIndex + 1} / ${queue.length}`;
    document.getElementById("progress-fill").style.width = `${(currentIndex / queue.length) * 100}%`;
}

function handleHindiChoice(btn, chosen) {
    if (answered) return;

    const isCorrect = chosen.letter === currentItem.letter;

    if (isCorrect) {
        answered = true;
        document.querySelectorAll(".choice-btn").forEach(b => b.classList.add("dimmed"));
        btn.classList.remove("dimmed");
        btn.classList.add("correct");
        addCheckBadge(btn);
        if (roundClean) {
            stars++;
            document.getElementById("stars").textContent = stars;
        }
        playCorrectSound();
        showFeedback(true);
        spawnConfetti();
        const videoAlreadyPlayed = hindiMode === "video-letter" || (getVideoBeforeQuestion() && !getVideosDisabled());
        if (videoAlreadyPlayed) {
            playHindiClip(currentItem.letter);
            setTimeout(() => advanceRound(), 1200);
        } else if (hindiMode === "picture") {
            playHindiClip(currentItem.letter);
            setTimeout(() => playHindiVideo(), 1800);
        } else {
            setTimeout(() => playHindiVideo(), 1600);
        }
    } else {
        btn.classList.add("wrong");
        btn.disabled = true;
        roundClean = false;
        roundWrongs++;
        playWrongSound();
        answered = false;
    }
}

function playHindiVideo() {
    if (getVideosDisabled()) { proceedFromVideo(); return; }
    const overlay = document.getElementById("video-overlay");
    const localPlayer = document.getElementById("local-player");
    const ytEl = document.getElementById("yt-player");

    if (!ytReady || currentItem.vidStart == null) { proceedFromVideo(); return; }
    const start = currentItem.vidStart;
    const end = typeof currentItem.vidEnd === "number" ? currentItem.vidEnd : start + 4;
    const videoId = currentItem.vidId || HINDI_VIDEO_ID;
    localPlayer.style.display = "none";
    ytEl.style.display = "block";
    overlay.className = "video-overlay show";
    videoShowing = true;
    ytPlayer.loadVideoById({ videoId, startSeconds: start });
    clearInterval(videoTimer);
    videoTimer = setInterval(() => {
        if (ytPlayer.getCurrentTime && ytPlayer.getCurrentTime() >= end) {
            clearInterval(videoTimer);
            hideVideoOverlay();
        }
    }, 200);
    safetyTimer = setTimeout(() => {
        clearInterval(videoTimer);
        hideVideoOverlay();
    }, 10000);
}

// ── Blends Game ──────────────────────────────────────────────────────

const _blendAudios = {};
BLENDS_ITEMS.forEach(item => {
    const a = new Audio(item.audio);
    a.preload = "auto";
    _blendAudios[item.blend] = a;
});

function playBlendAudio(blend, timesLeft) {
    const audio = _blendAudios[blend];
    if (!audio) return;
    Object.values(_blendAudios).forEach(a => { a.pause(); a.currentTime = 0; });
    audio.currentTime = 0;
    audio.onended = timesLeft > 1 ? () => playBlendAudio(blend, timesLeft - 1) : null;
    audio.play().catch(() => {});
}

let blendsActiveItems = [];

function startBlendsGame(activeBlends) {
    blendsActiveItems = BLENDS_ITEMS.filter(it => activeBlends.includes(it.blend));
    gameMode = "blends-audio";
    currentAppMode = "blends";
    queue = shuffleNoRepeat([...blendsActiveItems, ...blendsActiveItems, ...blendsActiveItems]);
    currentIndex = 0;
    stars = 0;
    sessionStats = [];
    document.getElementById("stars").textContent = stars;
    setModeChip("blends");
    showScreen("quiz-screen");
    loadBlendsRound();
}

function loadBlendsRound() {
    if (currentIndex >= queue.length) { showDone(); return; }

    answered = false;
    roundClean = true;
    roundWrongs = 0;
    currentItem = queue[currentIndex];
    document.getElementById("choices").className = "";

    const letterDisplay = document.getElementById("letter-display");
    const choicesEl = document.getElementById("choices");
    choicesEl.innerHTML = "";

    setLetterDisplayColor("blends");
    letterDisplay.innerHTML = "";

    // Question: replay button + play blend 3 times via real audio
    const replayBtn = document.createElement("button");
    replayBtn.style.cssText = "font-size:3.5rem;background:none;border:none;cursor:pointer;line-height:1;display:block;margin:0 auto 4px";
    replayBtn.textContent = "🔊";
    replayBtn.onclick = () => playBlendAudio(currentItem.blend, 3);
    const hintLabel = document.createElement("div");
    hintLabel.className = "letter-label";
    hintLabel.textContent = "Which one?";
    letterDisplay.appendChild(replayBtn);
    letterDisplay.appendChild(hintLabel);

    playBlendAudio(currentItem.blend, 3);

    // Always show all 4 options as text buttons
    shuffle(ALL_BLENDS).forEach((b, i) => {
        const btn = document.createElement("button");
        btn.className = "choice-btn choice-letter-btn";
        styleTile(btn, i);
        btn.style.fontSize = "2rem";
        btn.textContent = b.toUpperCase();
        btn.dataset.blend = b;
        btn.onclick = () => handleBlendsChoice(btn, b);
        choicesEl.appendChild(btn);
    });

    document.getElementById("round-info").textContent = `${currentIndex + 1} / ${queue.length}`;
    document.getElementById("progress-fill").style.width = `${(currentIndex / queue.length) * 100}%`;
}

function handleBlendsChoice(btn, chosen) {
    if (answered) return;

    const isCorrect = chosen === currentItem.blend;

    if (isCorrect) {
        answered = true;
        document.querySelectorAll(".choice-btn").forEach(b => b.classList.add("dimmed"));
        btn.classList.remove("dimmed");
        btn.classList.add("correct");
        addCheckBadge(btn);
        if (roundClean) { stars++; document.getElementById("stars").textContent = stars; }
        playCorrectSound();
        showFeedback(true);
        spawnConfetti();
        playBlendAudio(currentItem.blend, 1);
        setTimeout(() => advanceRound(), 1400);
    } else {
        btn.classList.add("wrong");
        btn.disabled = true;
        roundClean = false;
        roundWrongs++;
        playWrongSound();
        showFeedback(false);
        answered = false;
    }
}

// ── Words Game ───────────────────────────────────────────────────────

let wordsMode = "normal";
let wordsFamilyItems = [];

function startWordsGame(words, mode) {
    wordsMode = mode;
    wordsFamilyItems = WORD_ITEMS.filter(it => words.includes(it.word));
    gameMode = "words-" + mode;
    currentAppMode = "words";
    queue = shuffleNoRepeat([...wordsFamilyItems, ...wordsFamilyItems, ...wordsFamilyItems]);
    currentIndex = 0;
    stars = 0;
    sessionStats = [];
    document.getElementById("stars").textContent = stars;
    setModeChip("words");
    showScreen("quiz-screen");
    loadWordsRound();
}

function playWordInitialPhonic(word, onDone) {
    const letter = word[0].toUpperCase();
    const start = PHONETICS_TIMESTAMPS[letter] ?? 0;
    const end = start + 5;

    afterVideoHide = onDone;

    const overlay = document.getElementById("video-overlay");
    const localPlayer = document.getElementById("local-player");
    const ytEl = document.getElementById("yt-player");
    localPlayer.style.display = "none";
    ytEl.style.display = "block";
    overlay.className = "video-overlay show";
    videoShowing = true;

    ytPlayer.loadVideoById({ videoId: PHONETICS_VIDEO_ID, startSeconds: start });
    clearInterval(videoTimer);
    videoTimer = setInterval(() => {
        if (ytPlayer.getCurrentTime && ytPlayer.getCurrentTime() >= end) {
            clearInterval(videoTimer);
            hideVideoOverlay();
        }
    }, 200);
    safetyTimer = setTimeout(() => {
        clearInterval(videoTimer);
        hideVideoOverlay();
    }, 7000);
}

function loadWordsRound() {
    if (currentIndex >= queue.length) { showDone(); return; }

    answered = false;
    roundClean = true;
    roundWrongs = 0;
    currentItem = queue[currentIndex];
    document.getElementById("choices").className = "";

    setLetterDisplayColor("words");

    const wrongPool = shuffle(wordsFamilyItems.filter(it => it.word !== currentItem.word)).slice(0, 1);
    const options = shuffle([currentItem, ...wrongPool]);

    const buildQuestion = () => {
        const letterDisplay = document.getElementById("letter-display");
        const choicesEl = document.getElementById("choices");
        choicesEl.innerHTML = "";

        if (wordsMode === "normal") {
            letterDisplay.innerHTML = `<div class="big-word">${currentItem.word.toUpperCase()}</div>`;
            choicesEl.className = "image-choices";
            options.forEach((opt, i) => {
                const btn = document.createElement("button");
                btn.className = "choice-btn choice-img-btn";
                styleTile(btn, i);
                btn.innerHTML = `<img src="${opt.image}" alt="${opt.word}">`;
                btn.dataset.word = opt.word;
                btn.onclick = () => handleWordsChoice(btn, opt);
                choicesEl.appendChild(btn);
            });
        } else {
            letterDisplay.innerHTML = `<img src="${currentItem.image}" style="width:130px;height:130px;object-fit:contain;animation:popIn 0.4s ease-out" alt="${currentItem.word}">`;
            options.forEach((opt, i) => {
                const btn = document.createElement("button");
                btn.className = "choice-btn choice-letter-btn";
                styleTile(btn, i);
                btn.textContent = opt.word;
                btn.dataset.word = opt.word;
                btn.onclick = () => handleWordsChoice(btn, opt);
                choicesEl.appendChild(btn);
            });
        }

        document.getElementById("round-info").textContent = `${currentIndex + 1} / ${queue.length}`;
        document.getElementById("progress-fill").style.width = `${(currentIndex / queue.length) * 100}%`;
    };

    if (!getVideosDisabled() && getVideoBeforeQuestion() && ytReady) {
        playWordInitialPhonic(currentItem.word, buildQuestion);
    } else {
        buildQuestion();
    }
}

function handleWordsChoice(btn, chosen) {
    if (answered) return;

    const isCorrect = chosen.word === currentItem.word;

    if (isCorrect) {
        answered = true;
        document.querySelectorAll(".choice-btn").forEach(b => b.classList.add("dimmed"));
        btn.classList.remove("dimmed");
        btn.classList.add("correct");
        addCheckBadge(btn);
        if (roundClean) { stars++; document.getElementById("stars").textContent = stars; }
        playCorrectSound();
        showFeedback(true);
        spawnConfetti();
        speak(currentItem.word);
        setTimeout(() => speak(currentItem.word), 1000);
        setTimeout(() => speak(currentItem.word), 2000);
        if (!getVideosDisabled() && !getVideoBeforeQuestion() && ytReady) {
            setTimeout(() => playWordInitialPhonic(currentItem.word, () => advanceRound()), 3200);
        } else {
            setTimeout(() => advanceRound(), 3200);
        }
    } else {
        btn.classList.add("wrong");
        btn.disabled = true;
        roundClean = false;
        roundWrongs++;
        playWrongSound();
        showFeedback(false);
        answered = false;
    }
}

// ── Advance helper (mode-aware) ──────────────────────────────────────
function advanceRound() {
    currentIndex++;
    if (currentAppMode === "saynumbers") {
        if (gameMode === "reverse") loadNumberRoundReverse();
        else if (gameMode === "hear") loadNumberRoundHear();
        else loadNumberRound();
    } else if (currentAppMode === "matchcaps") {
        loadCapsRound();
    } else if (currentAppMode === "kannada") {
        loadKannadaRound();
    } else if (currentAppMode === "hindi") {
        loadHindiRound();
    } else if (currentAppMode === "blends") {
        loadBlendsRound();
    } else if (currentAppMode === "words") {
        loadWordsRound();
    } else {
        loadRound();
    }
}

// ── Mode Tabs ─────────────────────────────────────────────────────────
// "matchcaps" has no nav button of its own — it lives inside the Quiz tab
// behind the Quiz/Case segmented toggle, so it highlights the Quiz tab.
function navTabFor(mode) {
    return mode === "matchcaps" ? "quiz" : mode;
}
function updateQuizCaseToggle() {
    const wrap = document.getElementById("quiz-case-toggle");
    const isQuizFamily = currentAppMode === "quiz" || currentAppMode === "matchcaps";
    wrap.style.display = isQuizFamily ? "flex" : "none";
    document.getElementById("toggle-quiz").classList.toggle("active", currentAppMode === "quiz");
    document.getElementById("toggle-case").classList.toggle("active", currentAppMode === "matchcaps");
}
function setActiveTab(mode) {
    currentAppMode = mode;
    localStorage.setItem("lb_mode", mode);
    const activeNavTab = navTabFor(mode);
    ["quiz", "kannada", "hindi", "saynumbers", "words"].forEach(m => {
        const el = document.getElementById(`tab-${m}`);
        if (el) el.classList.toggle("active", m === activeNavTab);
    });
    updateQuizCaseToggle();
    buildLevelGrid();
}
document.getElementById("tab-quiz").addEventListener("click", () => setActiveTab("quiz"));
document.getElementById("tab-kannada").addEventListener("click", () => setActiveTab("kannada"));
document.getElementById("tab-hindi").addEventListener("click", () => setActiveTab("hindi"));
document.getElementById("tab-saynumbers").addEventListener("click", () => setActiveTab("saynumbers"));
document.getElementById("tab-words").addEventListener("click", () => setActiveTab("words"));
document.getElementById("toggle-quiz").addEventListener("click", () => setActiveTab("quiz"));
document.getElementById("toggle-case").addEventListener("click", () => setActiveTab("matchcaps"));
// Reset any stored mode from removed/retired tabs
if (["sayit", "saywords", "sayletters", "blends"].includes(currentAppMode)) {
    currentAppMode = "quiz";
    localStorage.setItem("lb_mode", "quiz");
}
// Set initial tab highlight (grid is built by initWordVideos below)
const initialNavTab = navTabFor(currentAppMode);
["quiz", "kannada", "hindi", "saynumbers", "words"].forEach(m => {
    const el = document.getElementById(`tab-${m}`);
    if (el) el.classList.toggle("active", m === initialNavTab);
});
updateQuizCaseToggle();

// Apply saved theme on load
document.body.classList.toggle("theme-rainbow", currentTheme === "rainbow");
document.querySelectorAll(".theme-btn").forEach(b => {
    b.classList.toggle("active", b.dataset.theme === currentTheme);
});

// ── Speech Recognition ────────────────────────────────────────────────
// Letter name alternatives including Indian English variants (e.g. "haitch" for H)
const LETTER_SOUNDS = {
    A: ["a","ay","ae","eh"],
    B: ["b","bee","be"],
    C: ["c","see","sea","si","ce"],
    D: ["d","dee","de","di"],
    E: ["e","ee","eeh","yi"],
    F: ["f","ef","eff","ph"],
    G: ["g","jee","gee","ge","ji"],
    H: ["h","aitch","haitch","ach","ache","hh"],
    I: ["i","eye","ai","aye"],
    J: ["j","jay","jae","ja"],
    K: ["k","kay","kae","ka"],
    L: ["l","el","elle","al"],
    M: ["m","em","am"],
    N: ["n","en","an"],
    O: ["o","oh","ow","eau"],
    P: ["p","pee","pe","pi"],
    Q: ["q","cue","queue","kew","ku"],
    R: ["r","ar","are","arr"],
    S: ["s","es","ess","ass"],
    T: ["t","tee","te","ti"],
    U: ["u","you","yew","yu","oo"],
    V: ["v","vee","ve","vi"],
    W: ["w","double you","double-you","doubleyou"],
    X: ["x","ex","eks","ix"],
    Y: ["y","why","wai","wi","yy"],
    Z: ["z","zee","zed","sed","ze"],
};

const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
let currentRecognition = null; // active instance, for aborting

function levenshtein(a, b) {
    const m = a.length, n = b.length;
    const dp = [];
    for (let i = 0; i <= m; i++) {
        dp[i] = [i];
        for (let j = 1; j <= n; j++) {
            dp[i][j] = i === 0 ? j :
                a[i-1] === b[j-1] ? dp[i-1][j-1] :
                1 + Math.min(dp[i-1][j], dp[i][j-1], dp[i-1][j-1]);
        }
    }
    return dp[m][n];
}

function isLetterMatch(recognized, letter) {
    const r = recognized.toLowerCase().trim().replace(/[^a-z\s-]/g, "");
    const targets = LETTER_SOUNDS[letter] || [letter.toLowerCase()];
    const words = r.split(/\s+/);
    for (const target of targets) {
        // Multi-word targets like "double you" — full string match only
        if (target.includes(" ")) { if (r === target) return true; continue; }
        for (const w of words) {
            if (!w) continue;
            if (w === target) return true;  // exact word match
            if (target.length >= 3) {       // fuzzy only for longer targets (aitch, haitch…)
                const threshold = target.length < 5 ? 1 : 2;
                if (levenshtein(w, target) <= threshold) return true;
            }
        }
    }
    return false;
}

// ── Say It Game ───────────────────────────────────────────────────────

function startSayIt(gameLevelIdx) {
    currentGameLevelIdx = gameLevelIdx;
    const gl = GAME_LEVELS[gameLevelIdx];
    currentLevel = gl.contentLevel;
    gameMode = "normal";

    const newItems = ALL_ITEMS.filter(it => it.level === currentLevel);
    const reviewPool = ALL_ITEMS.filter(it => it.level < currentLevel);
    const reviewItems = shuffle(reviewPool).slice(0, 2);
    // Boosted letters (H) get 6 reps; others get 4
    const repeatedNew = newItems.flatMap(it => Array(it.boost ? 6 : 4).fill(it));
    queue = shuffleNoRepeat([...repeatedNew, ...reviewItems]);
    currentIndex = 0;
    stars = 0;
    sayItWrongs = 0;
    sessionStats = [];
    document.getElementById("stars").textContent = stars;
    showScreen("quiz-screen");
    loadSayItRound();
}

function loadSayItRound() {
    if (currentIndex >= queue.length) {
        showDone();
        return;
    }

    answered = false;
    roundClean = true;
    roundWrongs = 0;
    sayItWrongs = 0;
    currentItem = queue[currentIndex];

    const letterDisplay = document.getElementById("letter-display");
    letterDisplay.innerHTML = `
        <div id="big-letter">${currentItem.letter}</div>
        <img class="sayit-hint-img" src="${currentItem.image}" alt="${currentItem.word}">
        <div class="sayit-hint-label">${currentItem.word}</div>
    `;
    const bigLetter = document.getElementById("big-letter");
    bigLetter.style.animation = "none";
    void bigLetter.offsetWidth;
    bigLetter.style.animation = "popIn 0.4s ease-out";

    const sayPrompt = currentAppMode === "sayletters" ? currentItem.letter : currentItem.word;

    const choicesEl = document.getElementById("choices");
    choicesEl.className = "sayit-mode";
    choicesEl.innerHTML = `
        <button id="sayit-btn" class="sayit-btn" onclick="handleSayItTap()">
            🎤 Say <strong>${sayPrompt}</strong>!
        </button>
        <div id="sayit-status" class="sayit-status"></div>
    `;

    document.getElementById("round-info").textContent = `${currentIndex + 1} / ${queue.length}`;
    document.getElementById("progress-fill").style.width = `${(currentIndex / queue.length) * 100}%`;

    // Auto-start listening after child has had a moment to look at the card
    setTimeout(() => { if (!answered) handleSayItTap(); }, 1200);
}

function isSayItMatch(recognized, item) {
    const r = recognized.toLowerCase().trim();
    if (currentAppMode === "sayletters") {
        // Letters mode: only accept the letter name — word fallback would let
        // "A for Elephant" pass when shown E (wrong letter, right word)
        return isLetterMatch(r, item.letter);
    }
    // Words mode: accept the word first, then letter name as fallback
    if (isWordMatch(r, item.word)) return true;
    return isLetterMatch(r, item.letter);
}

function isWordMatch(recognized, target) {
    const r = recognized.toLowerCase().trim().replace(/[^a-z\s]/g, "");
    const t = target.toLowerCase().trim();
    if (r === t || r.includes(t)) return true;
    const words = r.split(/\s+/);
    const tFirst = t.split(/\s+/)[0]; // first word of target (e.g. "ice" from "ice cream")
    for (const w of words) {
        if (!w || w[0] !== tFirst[0]) continue; // must start with same letter before fuzzy
        const threshold = tFirst.length < 4 ? 1 : 2;
        if (levenshtein(w, tFirst) <= threshold) return true;
    }
    return false;
}

function handleSayItTap() {
    if (answered) return;

    if (!SpeechRecognitionAPI) {
        handleSayItResult(true, null);
        return;
    }

    try { currentRecognition?.abort(); } catch(e) {}

    const rec = new SpeechRecognitionAPI();
    rec.lang = "en-US";   // broader model, handles Indian English well
    rec.maxAlternatives = 5;
    rec.interimResults = false;
    rec.continuous = false;
    currentRecognition = rec;

    const btn = document.getElementById("sayit-btn");
    const status = document.getElementById("sayit-status");
    const listenTarget = currentAppMode === "sayletters" ? currentItem.letter : currentItem.word;
    btn.className = "sayit-btn listening";
    btn.innerHTML = `👂 Say <strong>${listenTarget}</strong>...`;
    status.textContent = "";

    clearTimeout(recognitionTimeout);
    recognitionTimeout = setTimeout(() => {
        try { rec.abort(); } catch(e) {}
        resetSayItBtn();
        status.textContent = "Tap the button and try again!";
        sayItWrongs++;
        if (sayItWrongs >= 2) showSayItSkip();
    }, 7000);

    rec.onresult = (event) => {
        clearTimeout(recognitionTimeout);
        const alts = Array.from(event.results[0]).map(r => r.transcript);
        const matched = alts.some(a => isSayItMatch(a, currentItem));
        appendSpeechLog({
            t: new Date().toISOString(),
            mode: currentAppMode,
            letter: currentItem.letter,
            word: currentItem.word,
            alts,
            matched
        });
        handleSayItResult(matched, alts[0]);
    };

    rec.onerror = (event) => {
        clearTimeout(recognitionTimeout);
        if (event.error === "aborted") return;
        if (event.error === "not-allowed") {
            resetSayItBtn();
            status.textContent = "🎙️ Mic blocked — see below";
            showMicHelp();
            return;
        }
        // Silent auto-retry once on transient errors
        if (sayItWrongs === 0) {
            resetSayItBtn();
            setTimeout(() => { if (!answered) handleSayItTap(); }, 800);
            return;
        }
        resetSayItBtn();
        status.textContent = "Tap the button and try again!";
        sayItWrongs++;
        if (sayItWrongs >= 2) showSayItSkip();
    };

    rec.onnomatch = () => {
        clearTimeout(recognitionTimeout);
        // Silent auto-retry once before showing feedback
        if (sayItWrongs === 0) {
            resetSayItBtn();
            status.textContent = "Try saying it louder 🔊";
            sayItWrongs++;
            setTimeout(() => { if (!answered) handleSayItTap(); }, 1200);
            return;
        }
        resetSayItBtn();
        status.textContent = "Tap the button and try again!";
        sayItWrongs++;
        if (sayItWrongs >= 2) showSayItSkip();
    };

    try {
        rec.start();
    } catch(e) {
        clearTimeout(recognitionTimeout);
        resetSayItBtn();
        status.textContent = "Tap the button to try again!";
    }
}

function resetSayItBtn() {
    const btn = document.getElementById("sayit-btn");
    if (!btn) return;
    btn.className = "sayit-btn";
    const t = currentAppMode === "sayletters" ? currentItem.letter : currentItem.word;
    btn.innerHTML = `🎤 Say <strong>${t}</strong>!`;
}

function showSayItSkip() {
    if (document.getElementById("sayit-skip")) return;
    const skip = document.createElement("button");
    skip.id = "sayit-skip";
    skip.className = "sayit-skip-btn";
    skip.textContent = "Skip →";
    skip.onclick = () => {
        if (answered) return;
        answered = true;
        try { currentRecognition?.abort(); } catch(e) {}
        clearTimeout(recognitionTimeout);
        setTimeout(advanceRound, 400);
    };
    document.getElementById("choices").appendChild(skip);
}

function showMicHelp() {
    if (document.getElementById("mic-help")) return;
    const help = document.createElement("div");
    help.id = "mic-help";
    help.className = "mic-help";
    help.innerHTML = `
        <strong>Microphone is blocked.</strong><br>
        Fix it in Chrome:<br>
        1. Click the 🔒 lock icon in the address bar<br>
        2. Set <em>Microphone</em> → Allow<br>
        3. Reload the page<br><br>
        On Mac, also check:<br>
        System Settings → Privacy → Microphone → enable Chrome
    `;
    document.getElementById("choices").appendChild(help);
    showSayItSkip();
}

function handleSayItResult(success, recognized) {
    if (answered) return;
    try { currentRecognition?.abort(); } catch(e) {}
    clearTimeout(recognitionTimeout);

    const btn = document.getElementById("sayit-btn");
    const status = document.getElementById("sayit-status");

    if (success) {
        answered = true;
        stars++;
        document.getElementById("stars").textContent = stars;

        sessionStats.push({
            letter: currentItem.letter,
            word: currentItem.word,
            firstTry: sayItWrongs === 0,
            wrongs: sayItWrongs
        });

        btn.className = "sayit-btn success";
        btn.innerHTML = `✅ ${currentItem.letter} for ${currentItem.word}!`;
        if (recognized) status.textContent = `I heard: "${recognized}"`;

        playCorrectSound();
        spawnConfetti();
        showFeedback(true);

        setTimeout(() => playVideoReward(), 1600);
    } else {
        roundClean = false;
        sayItWrongs++;
        playWrongSound();
        status.textContent = recognized
            ? `I heard "${recognized}" — try again!`
            : "Try again!";
        resetSayItBtn();
        if (sayItWrongs >= 2) showSayItSkip();
    }
}

// ── Numbers Game ──────────────────────────────────────────────────────

function startNumbers(mode = "normal", range = [1, 4]) {
    gameMode = mode;
    numberRange = range;
    queue = Array.from({ length: 10 }, () => range[0] + Math.floor(Math.random() * (range[1] - range[0] + 1)));
    currentIndex = 0;
    stars = 0;
    answered = false;
    document.getElementById("stars").textContent = stars;
    setModeChip("saynumbers");
    showScreen("quiz-screen");
    if (gameMode === "reverse") loadNumberRoundReverse();
    else if (gameMode === "hear") loadNumberRoundHear();
    else loadNumberRound();
}

function loadNumberRound() {
    if (currentIndex >= queue.length) {
        showNumbersDone();
        return;
    }

    answered = false;
    roundClean = true;
    roundWrongs = 0;
    const count = queue[currentIndex];

    const balls = Array(count).fill('<div class="number-ball"></div>').join('');
    document.getElementById("letter-display").innerHTML = `<div class="number-balls">${balls}</div>`;

    const choicesEl = document.getElementById("choices");
    choicesEl.className = "";
    choicesEl.innerHTML = "";

    // Build 3 distractors from nearby numbers, then shuffle with the correct answer
    const pool = [];
    for (let n = Math.max(1, count - 3); n <= count + 3; n++) {
        if (n !== count) pool.push(n);
    }
    const choices = shuffle([count, ...shuffle(pool).slice(0, 3)]);
    choices.forEach((n, i) => {
        const btn = document.createElement("button");
        btn.className = "choice-btn choice-number-btn";
        styleTile(btn, i);
        btn.textContent = n;
        btn.onclick = () => handleNumberChoice(btn, n, count);
        choicesEl.appendChild(btn);
    });

    setLetterDisplayColor("saynumbers");
    document.getElementById("round-info").textContent = `${currentIndex + 1} / ${queue.length}`;
    document.getElementById("progress-fill").style.width = `${(currentIndex / queue.length) * 100}%`;
}

function loadNumberRoundHear() {
    if (currentIndex >= queue.length) { showNumbersDone(); return; }

    answered = false;
    roundClean = true;
    roundWrongs = 0;
    const count = queue[currentIndex];

    const letterDisplay = document.getElementById("letter-display");
    letterDisplay.innerHTML = `
        <div id="number-hear-btn" class="kannada-listen-btn" style="font-size:2.5rem">🔊</div>
        <div style="font-size:0.85rem;color:#aaa;margin-top:6px">tap to hear again</div>
    `;
    document.getElementById("number-hear-btn").addEventListener("click", () => speak(String(count)));
    setTimeout(() => speak(String(count)), 400);

    const choicesEl = document.getElementById("choices");
    choicesEl.className = "";
    choicesEl.innerHTML = "";

    const pool = [];
    for (let n = Math.max(1, count - 3); n <= count + 3; n++) {
        if (n !== count) pool.push(n);
    }
    const choices = shuffle([count, ...shuffle(pool).slice(0, 3)]);
    choices.forEach((n, i) => {
        const btn = document.createElement("button");
        btn.className = "choice-btn choice-number-btn";
        styleTile(btn, i);
        btn.textContent = n;
        btn.onclick = () => handleNumberChoice(btn, n, count);
        choicesEl.appendChild(btn);
    });

    setLetterDisplayColor("saynumbers");
    document.getElementById("round-info").textContent = `${currentIndex + 1} / ${queue.length}`;
    document.getElementById("progress-fill").style.width = `${(currentIndex / queue.length) * 100}%`;
}

function handleNumberChoice(btn, chosen, count) {
    if (answered) return;

    if (chosen === count) {
        answered = true;
        document.querySelectorAll(".choice-btn").forEach(b => b.classList.add("dimmed"));
        btn.classList.remove("dimmed");
        btn.classList.add("correct");
        addCheckBadge(btn);
        if (roundClean) {
            stars++;
            document.getElementById("stars").textContent = stars;
        }
        playCorrectSound();
        spawnConfetti();
        speak(String(count));
        setTimeout(() => speak(String(count)), 1200);
        showFeedback(true);

        setTimeout(advanceRound, 2200);
    } else {
        btn.classList.add("wrong");
        btn.disabled = true;
        roundClean = false;
        roundWrongs++;
        playWrongSound();
    }
}

function loadNumberRoundReverse() {
    if (currentIndex >= queue.length) {
        showNumbersDone();
        return;
    }

    answered = false;
    const count = queue[currentIndex];
    let tapped = 0;

    const letterDisplay = document.getElementById("letter-display");
    letterDisplay.innerHTML = `<div id="big-letter">${count}</div>`;
    setLetterDisplayColor("saynumbers");
    const bigLetter = document.getElementById("big-letter");
    bigLetter.style.animation = "none";
    void bigLetter.offsetWidth;
    bigLetter.style.animation = "popIn 0.4s ease-out";

    speak(String(count));

    const choicesEl = document.getElementById("choices");
    choicesEl.className = "number-tap-grid";
    choicesEl.innerHTML = "";

    for (let i = 0; i < 4; i++) {
        const ball = document.createElement("div");
        ball.className = "number-tap-ball";
        ball.onclick = () => {
            if (answered || ball.classList.contains("tapped")) return;
            ball.classList.add("tapped");
            tapped++;
            if (tapped === count) {
                answered = true;
                stars++;
                document.getElementById("stars").textContent = stars;
                playCorrectSound();
                spawnConfetti();
                speak(String(count));
                setTimeout(() => speak(String(count)), 1200);

                showFeedback(true);
                setTimeout(advanceRound, 2200);
            }
        };
        choicesEl.appendChild(ball);
    }

    document.getElementById("round-info").textContent = `${currentIndex + 1} / ${queue.length}`;
    document.getElementById("progress-fill").style.width = `${(currentIndex / queue.length) * 100}%`;
}

function showNumbersDone() {
    document.getElementById("progress-fill").style.width = "100%";
    document.getElementById("final-score").textContent = stars;
    document.getElementById("final-total").textContent = queue.length;
    document.getElementById("final-stars").textContent = "⭐".repeat(stars) + "☆".repeat(queue.length - stars);
    document.getElementById("unlock-msg").style.display = "none";
    showScreen("done-screen");
    const msg = stars >= 8 ? "Amazing! You got almost everything right!"
        : stars >= 5 ? "Great job!"
        : `Good try! You got ${stars} out of ${queue.length}. Keep practicing!`;
    speak(msg);
    spawnConfetti();
}

// ── Send Stats to Google Sheet ──────────────────────────────────────

function sendStats() {
    if (!SHEET_URL) return;
    const payload = {
        timestamp: new Date().toISOString(),
        deviceId: getDeviceId(),
        deviceName: getDeviceName(),
        mode: gameMode,
        level: currentLevel,
        stars: stars,
        total: queue.length,
        perfect: stars === queue.length,
        letters: sessionStats
    };
    fetch(SHEET_URL, {
        method: "POST",
        mode: "no-cors",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
    }).catch(() => {});
}
