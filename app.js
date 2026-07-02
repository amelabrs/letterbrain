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
    CAPS_LEVELS.push({ letters: group, mode: "caps-normal",  pair, cumulative });
    CAPS_LEVELS.push({ letters: group, mode: "caps-reverse", pair, cumulative });
    CAPS_LEVELS.push({ letters: group, mode: "caps-test",    pair, cumulative });
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
    { letter: "ಅ", roman: "a",  start: 0,  vidStart: 14,  image: "images/prince.png" },
    { letter: "ಆ", roman: "aa", start: 3,  vidStart: 31,  image: "images/elephant.png" },
    { letter: "ಇ", roman: "i",  start: 6,  vidStart: 96,  image: "images/rat.png" },
    { letter: "ಈ", roman: "ii", start: 9,  vidStart: null, image: "images/fly.png" },
    { letter: "ಉ", roman: "u",  start: 13, vidStart: 79 },
    { letter: "ಊ", roman: "uu", start: 17, vidStart: 94 },
    { letter: "ಋ", roman: "ru", start: 20, vidStart: 109 },
    { letter: "ಎ", roman: "e",  start: 24, vidStart: 125 },
];
const KANNADA_VIDEO_ID = "KMNRrw5fPCY";

const KANNADA_LEVELS = [
    { label: "1", letters: ["ಅ", "ಆ"], mode: "hear" },
    { label: "2", letters: ["ಅ", "ಆ"], mode: "picture" },
    { label: "3", letters: ["ಇ", "ಈ"], mode: "hear" },
    { label: "4", letters: ["ಇ", "ಈ"], mode: "picture" },
    { label: "5", letters: ["ಅ", "ಆ", "ಇ", "ಈ"], mode: "hear", isTest: true },
];

const HINDI_ITEMS = [
    { letter: "अ", roman: "a",  start: 0,  vidStart: 0,  image: "images/prince.png" },
    { letter: "आ", roman: "aa", start: 3,  vidStart: 5,  image: "images/elephant.png" },
    { letter: "इ", roman: "i",  start: 6,  vidStart: 9,  image: "images/rat.png" },
    { letter: "ई", roman: "ii", start: 9,  vidStart: 15, image: "images/fly.png" },
];
const HINDI_VIDEO_ID = "0EfSycgslF0";
const HINDI_LEVELS = [
    { label: "1", letters: ["अ", "आ"], mode: "hear" },
    { label: "2", letters: ["अ", "आ"], mode: "picture" },
    { label: "3", letters: ["इ", "ई"], mode: "hear" },
    { label: "4", letters: ["इ", "ई"], mode: "picture" },
    { label: "5", letters: ["अ", "आ", "इ", "ई"], mode: "hear", isTest: true },
];

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

function showScreen(id) {
    document.querySelectorAll(".screen").forEach((s) => s.classList.remove("active"));
    document.getElementById(id).classList.add("active");
}

// Pick a friendly female/child voice
let friendlyVoice = null;
function pickVoice() {
    const voices = speechSynthesis.getVoices();
    // Prefer these friendly voices (macOS/iOS have great ones)
    const preferred = ["Samantha", "Karen", "Moira", "Fiona", "Tessa", "Victoria",
                       "Google UK English Female", "Google US English"];
    for (const name of preferred) {
        const v = voices.find((v) => v.name.includes(name));
        if (v) { friendlyVoice = v; return; }
    }
    // Fallback: any English female voice
    const female = voices.find((v) => v.lang.startsWith("en") && v.name.toLowerCase().includes("female"));
    if (female) { friendlyVoice = female; return; }
    // Fallback: any English voice
    friendlyVoice = voices.find((v) => v.lang.startsWith("en")) || null;
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
    utter.rate = 0.9;
    utter.pitch = 1.35;
    utter.volume = 1.0;
    utter.lang = "en-US";
    speechSynthesis.speak(utter);
}

// ── Build Level Cards ───────────────────────────────────────────────

function buildLevelGrid() {
    const grid = document.getElementById("level-grid");
    grid.innerHTML = "";

    if (currentAppMode === "saynumbers") {
        [
            { label: "1", thumbs: "<span>1</span><span>2</span>",             range: [1, 2] },
            { label: "2", thumbs: "<span>3</span><span>4</span>",             range: [3, 4] },
            { label: "3", thumbs: "<span>1</span><span>2</span><span>3</span><span>4</span>", range: [1, 4] },
            { label: "4", thumbs: "<span>5</span><span>6</span>",                         range: [5, 6] },
            { label: "5", thumbs: "<span>1</span><span>2</span><span>3</span><span>4</span><span>5</span><span>6</span>", range: [1, 6] },
        ].forEach(({ label, thumbs, range }) => {
            const card = document.createElement("div");
            card.className = "level-card";
            card.onclick = () => startNumbers("normal", range);
            card.innerHTML = `
                <span class="level-number">${label}</span>
                <div class="level-thumbs number-level-preview">${thumbs}</div>
                <span class="level-go">▶</span>
            `;
            grid.appendChild(card);
        });
        return;
    }

    if (currentAppMode === "kannada") {
        KANNADA_LEVELS.forEach(({ label, letters, mode, isTest }) => {
            const card = document.createElement("div");
            card.className = "level-card" + (isTest ? " exam-card" : "");
            card.onclick = () => startKannadaGame(letters, mode);
            let thumbs;
            if (mode === "picture") {
                thumbs = letters.map(l => {
                    const it = KANNADA_ITEMS.find(k => k.letter === l);
                    return `<img src="${it.image}" style="width:38px;height:38px;object-fit:contain;">`;
                }).join("");
            } else {
                thumbs = letters.map(l =>
                    `<span class="caps-pair" style="font-family:serif">${l}</span>`
                ).join("");
            }
            const modeIcon = isTest ? " ⭐" : (mode === "picture" ? " 🖼️" : " 🔊");
            card.innerHTML = `
                <span class="level-number">${label}${modeIcon}</span>
                <div class="level-thumbs caps-preview">${thumbs}</div>
                <span class="level-go">▶</span>
            `;
            grid.appendChild(card);
        });
        return;
    }

    if (currentAppMode === "hindi") {
        HINDI_LEVELS.forEach(({ label, letters, mode, isTest }) => {
            const card = document.createElement("div");
            card.className = "level-card" + (isTest ? " exam-card" : "");
            card.onclick = () => startHindiGame(letters, mode);
            let thumbs;
            if (mode === "picture") {
                thumbs = letters.map(l => {
                    const it = HINDI_ITEMS.find(k => k.letter === l);
                    return `<img src="${it.image}" style="width:38px;height:38px;object-fit:contain;">`;
                }).join("");
            } else {
                thumbs = letters.map(l =>
                    `<span class="caps-pair" style="font-family:serif">${l}</span>`
                ).join("");
            }
            const modeIcon = isTest ? " ⭐" : (mode === "picture" ? " 🖼️" : " 🔊");
            card.innerHTML = `
                <span class="level-number">${label}${modeIcon}</span>
                <div class="level-thumbs caps-preview">${thumbs}</div>
                <span class="level-go">▶</span>
            `;
            grid.appendChild(card);
        });
        return;
    }

    if (currentAppMode === "matchcaps") {
        const unlockedPair = getCapsUnlockedLevel();
        CAPS_LEVELS.forEach((gl, idx) => {
            const card = document.createElement("div");
            const isLocked = gl.pair > unlockedPair;
            const isTest = gl.mode === "caps-test";
            card.className = "level-card" + (isLocked ? " locked" : "") + (isTest ? " exam-card" : "");
            if (!isLocked) card.onclick = () => startCapsGame(idx);

            let modeIcon, thumbs;
            if (isTest) {
                modeIcon = "⭐";
                const range = `${gl.cumulative[0]}–${gl.cumulative[gl.cumulative.length - 1]}`;
                thumbs = `<span class="caps-pair" style="font-size:1.3rem">TEST ${range}</span>`;
            } else {
                modeIcon = gl.mode === "caps-normal" ? "🔠" : "🔡";
                thumbs = gl.letters.map(l =>
                    `<span class="caps-pair">${l}${l.toLowerCase()}</span>`
                ).join("");
            }
            card.innerHTML = `
                <span class="level-number">${idx + 1} ${modeIcon}</span>
                <div class="level-thumbs caps-preview">${thumbs}</div>
                <span class="level-go">${isLocked ? "🔒" : "▶"}</span>
            `;
            grid.appendChild(card);
        });
        return;
    }

    const unlockedPair = getUnlockedLevel();

    GAME_LEVELS.forEach((gl, idx) => {

        const items = ALL_ITEMS.filter((it) => it.level === gl.contentLevel);
        const card = document.createElement("div");
        const isLocked = gl.pair > unlockedPair;
        card.className = "level-card" + (isLocked ? " locked" : "");

        if (!isLocked) {
            card.onclick = () => startGame(idx);
        }

        const modeIcon = gl.mode === "normal" ? "🔤" : "🖼️";
        const thumbs = items.map((it) =>
            `<img src="${it.image}" alt="${it.word}">`
        ).join("");

        card.innerHTML = `
            <span class="level-number">${idx + 1} ${modeIcon}</span>
            <div class="level-thumbs">${thumbs}</div>
            <span class="level-go">${isLocked ? "🔒" : "▶"}</span>
        `;
        grid.appendChild(card);
    });

    // A–Z exam cards — always unlocked
    const examThumbs = [ALL_ITEMS[0], ALL_ITEMS[8], ALL_ITEMS[12], ALL_ITEMS[25]]
        .map(it => `<img src="${it.image}" alt="${it.word}">`).join("");

    ["normal", "reverse"].forEach(mode => {
        const card = document.createElement("div");
        card.className = "level-card exam-card";
        card.onclick = () => startExam(mode);
        const modeIcon = mode === "normal" ? "🔤" : "🖼️";
        card.innerHTML = `
            <span class="level-number">A–Z ${modeIcon}</span>
            <div class="level-thumbs">${examThumbs}</div>
            <span class="level-go">▶</span>
        `;
        grid.appendChild(card);
    });
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



// ── Settings (gear icon) ──────────────────────────────────────────────
document.getElementById("settings-btn").addEventListener("click", () => {
    const action = prompt(
        "Settings:\n1 — Name this device\n2 — Reset progress\n\nEnter 1 or 2:"
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
    }
});

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
    queue = shuffle([...repeatedNew, ...reviewItems]);
    currentIndex = 0;
    stars = 0;
    sessionStats = [];
    document.getElementById("stars").textContent = stars;
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

        // Pick 3 wrong letters from the round's pool (levelItems)
        const wrong = shuffle(levelItems.filter((it) => it.letter !== currentItem.letter)).slice(0, 3);
        const options = shuffle([currentItem, ...wrong]);

        const choicesEl = document.getElementById("choices");
        choicesEl.innerHTML = "";
        options.forEach((opt) => {
            const btn = document.createElement("button");
            btn.className = "choice-btn choice-letter-btn";
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

        // Pick 3 wrong choices from the round's pool (levelItems)
        const wrong = shuffle(levelItems.filter((it) => it.letter !== currentItem.letter)).slice(0, 3);
        const options = shuffle([currentItem, ...wrong]);

        const choicesEl = document.getElementById("choices");
        choicesEl.innerHTML = "";
        options.forEach((opt) => {
            const btn = document.createElement("button");
            btn.className = "choice-btn";
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

    // Update progress
    document.getElementById("round-info").textContent = `${currentIndex + 1} / ${queue.length}`;
    document.getElementById("progress-fill").style.width = `${(currentIndex / queue.length) * 100}%`;
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

        setTimeout(() => playVideoReward(), 1600);
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
    if (getPhoneticMode()) { playPhoneticClip(); return; }
    playPhonicsClip();
}

function playKannadaVideo() {
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
            advanceRound();
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

    if (!ytReady || currentItem.vidStart == null) { advanceRound(); return; }
    const start = currentItem.letter === "ಅ"
        ? 18
        : currentItem.letter === "ಆ"
            ? 32
            : currentItem.letter === "ಇ"
                ? 47
                : currentItem.vidStart;
    const end = start + 8;
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
    advanceRound();
}

function skipCartoon() {
    // Legacy — only for video-overlay skip button (per-letter clips)
    hideVideoOverlay();
}

// ── Feedback ────────────────────────────────────────────────────────

function showFeedback(correct) {
    const fb = document.getElementById("feedback");
    const emoji = document.getElementById("feedback-emoji");
    const text = document.getElementById("feedback-text");

    fb.className = "feedback show " + (correct ? "correct-fb" : "wrong-fb");
    emoji.textContent = correct ? "🌟" : "😊";
    if (currentAppMode === "matchcaps") {
        text.textContent = correct
            ? `${currentItem.letter} = ${currentItem.letter.toLowerCase()}!`
            : `It's ${currentItem.letter} / ${currentItem.letter.toLowerCase()}!`;
    } else if (currentAppMode === "kannada") {
        text.textContent = correct
            ? `${currentItem.letter} = ${currentItem.roman}!`
            : `It's ${currentItem.roman}!`;
    } else {
        text.textContent = correct
            ? `${currentItem.letter} for ${currentItem.word}!`
            : `It's ${currentItem.word}!`;
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
        // Both directions, 1x each, shuffled together
        levelItems = [...ALL_ITEMS]; // full alphabet for distractor pool
        queue = shuffle([
            ...cumItems.map(item => ({ ...item, capsDirection: "caps-normal" })),
            ...cumItems.map(item => ({ ...item, capsDirection: "caps-reverse" }))
        ]);
    } else {
        const targetItems = gl.letters.map(l => ALL_ITEMS.find(it => it.letter === l));
        const priorItems = cumItems.filter(it => !gl.letters.includes(it.letter));
        const reviewItems = shuffle(priorItems).slice(0, 4);
        levelItems = [...ALL_ITEMS]; // full alphabet for distractor pool
        queue = shuffle([...targetItems, ...targetItems, ...targetItems, ...reviewItems]);
    }

    currentIndex = 0;
    stars = 0;
    sessionStats = [];
    document.getElementById("stars").textContent = stars;
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

    const dir = currentItem.capsDirection || gameMode;
    const isNormal = dir === "caps-normal";
    const displayLetter = isNormal ? currentItem.letter : currentItem.letter.toLowerCase();

    const letterDisplay = document.getElementById("letter-display");
    letterDisplay.innerHTML = `<div id="big-letter">${displayLetter}</div>`;
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
    options.forEach(opt => {
        const btn = document.createElement("button");
        btn.className = "choice-btn choice-letter-btn";
        btn.dataset.letter = opt.letter;
        btn.textContent = isNormal ? opt.letter.toLowerCase() : opt.letter;
        btn.onclick = () => handleCapsChoice(btn, opt);
        choicesEl.appendChild(btn);
    });

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

let _kannadaAudio = null;
let _kannadaClipTimer = null;
let _hindiAudio = null;
let _hindiClipTimer = null;

function playKannadaClip(letter, options = {}) {
    const item = KANNADA_ITEMS.find(it => it.letter === letter);
    if (!item) return;
    if (!_kannadaAudio) {
        _kannadaAudio = new Audio("audio/kannada.mp3");
    }
    clearTimeout(_kannadaClipTimer);
    _kannadaAudio.pause();
    _kannadaAudio.currentTime = item.start;
    _kannadaAudio.play().catch(() => {});
    const duration = options.duration ?? 2500;
    _kannadaClipTimer = setTimeout(() => _kannadaAudio.pause(), duration);
}

function playHindiClip(letter, options = {}) {
    const item = HINDI_ITEMS.find(it => it.letter === letter);
    if (!item) return;
    if (!_hindiAudio) {
        _hindiAudio = new Audio("audio/kannada.mp3");
    }
    clearTimeout(_hindiClipTimer);
    _hindiAudio.pause();
    _hindiAudio.currentTime = item.start;
    _hindiAudio.play().catch(() => {});
    const duration = options.duration ?? 2500;
    _hindiClipTimer = setTimeout(() => _hindiAudio.pause(), duration);
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
        "ಈ": ["ಇ", "ಈ"]
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
    queue = shuffle([...kannadaActiveItems, ...kannadaActiveItems, ...kannadaActiveItems]);
    currentIndex = 0;
    stars = 0;
    sessionStats = [];
    document.getElementById("stars").textContent = stars;
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

    if (kannadaMode === "picture") {
        letterDisplay.innerHTML = `<img src="${currentItem.image}" style="width:180px;height:180px;object-fit:contain;animation:popIn 0.4s ease-out">`;
        options.forEach(opt => {
            const btn = document.createElement("button");
            btn.className = "choice-btn choice-letter-btn";
            btn.style.fontFamily = "serif";
            btn.textContent = opt;
            btn.onclick = () => handleKannadaChoice(btn, { letter: opt });
            choicesEl.appendChild(btn);
        });
    } else {
        // hear mode
        letterDisplay.innerHTML = `
            <div id="kannada-hear-btn" class="kannada-listen-btn">🔊</div>
            <div style="font-size:0.85rem;color:#aaa;margin-top:6px">tap to hear again</div>
        `;
        document.getElementById("kannada-hear-btn").addEventListener("click", () => playKannadaClip(currentItem.letter));
        setTimeout(() => playKannadaClip(currentItem.letter), 400);
        options.forEach(opt => {
            const btn = document.createElement("button");
            btn.className = "choice-btn choice-letter-btn";
            btn.style.fontFamily = "serif";
            btn.textContent = opt;
            btn.onclick = () => handleKannadaChoice(btn, { letter: opt });
            choicesEl.appendChild(btn);
        });
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
        if (roundClean) {
            stars++;
            document.getElementById("stars").textContent = stars;
        }
        playCorrectSound();
        showFeedback(true);
        spawnConfetti();
        if (kannadaMode === "picture") {
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
    queue = shuffle([...hindiActiveItems, ...hindiActiveItems, ...hindiActiveItems]);
    currentIndex = 0;
    stars = 0;
    sessionStats = [];
    document.getElementById("stars").textContent = stars;
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

    if (hindiMode === "picture") {
        letterDisplay.innerHTML = `<img src="${currentItem.image}" style="width:180px;height:180px;object-fit:contain;animation:popIn 0.4s ease-out">`;
        shuffle([...HINDI_ITEMS]).forEach(opt => {
            const btn = document.createElement("button");
            btn.className = "choice-btn choice-letter-btn";
            btn.style.fontFamily = "serif";
            btn.textContent = opt.letter;
            btn.onclick = () => handleHindiChoice(btn, opt);
            choicesEl.appendChild(btn);
        });
    } else {
        letterDisplay.innerHTML = `
            <div id="kannada-hear-btn" class="kannada-listen-btn">🔊</div>
            <div style="font-size:0.85rem;color:#aaa;margin-top:6px">tap to hear again</div>
        `;
        document.getElementById("kannada-hear-btn").addEventListener("click", () => playHindiClip(currentItem.letter));
        setTimeout(() => playHindiClip(currentItem.letter), 400);
        shuffle([...HINDI_ITEMS]).forEach(opt => {
            const btn = document.createElement("button");
            btn.className = "choice-btn choice-letter-btn";
            btn.style.fontFamily = "serif";
            btn.textContent = opt.letter;
            btn.onclick = () => handleHindiChoice(btn, opt);
            choicesEl.appendChild(btn);
        });
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
        if (roundClean) {
            stars++;
            document.getElementById("stars").textContent = stars;
        }
        playCorrectSound();
        showFeedback(true);
        spawnConfetti();
        if (hindiMode === "picture") {
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
    const overlay = document.getElementById("video-overlay");
    const localPlayer = document.getElementById("local-player");
    const ytEl = document.getElementById("yt-player");

    if (!ytReady || currentItem.vidStart == null) { advanceRound(); return; }
    const start = currentItem.vidStart;
    const end = typeof currentItem.vidEnd === "number" ? currentItem.vidEnd : start + 5;
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

// ── Advance helper (mode-aware) ──────────────────────────────────────
function advanceRound() {
    currentIndex++;
    if (currentAppMode === "saynumbers") {
        if (gameMode === "reverse") loadNumberRoundReverse();
        else loadNumberRound();
    } else if (currentAppMode === "matchcaps") {
        loadCapsRound();
    } else if (currentAppMode === "kannada") {
        loadKannadaRound();
    } else if (currentAppMode === "hindi") {
        loadHindiRound();
    } else {
        loadRound();
    }
}

// ── Mode Tabs ─────────────────────────────────────────────────────────
function setActiveTab(mode) {
    currentAppMode = mode;
    localStorage.setItem("lb_mode", mode);
    ["quiz", "matchcaps", "kannada", "hindi", "saynumbers"].forEach(m => {
        const el = document.getElementById(`tab-${m}`);
        if (el) el.classList.toggle("active", m === mode);
    });
    buildLevelGrid();
}
document.getElementById("tab-quiz").addEventListener("click", () => setActiveTab("quiz"));
document.getElementById("tab-matchcaps").addEventListener("click", () => setActiveTab("matchcaps"));
document.getElementById("tab-kannada").addEventListener("click", () => setActiveTab("kannada"));
document.getElementById("tab-hindi").addEventListener("click", () => setActiveTab("hindi"));
document.getElementById("tab-saynumbers").addEventListener("click", () => setActiveTab("saynumbers"));
// Reset any stored mode from removed tabs
if (["sayit", "saywords", "sayletters"].includes(currentAppMode)) {
    currentAppMode = "quiz";
    localStorage.setItem("lb_mode", "quiz");
}
// Set initial tab highlight (grid is built by initWordVideos below)
["quiz", "matchcaps", "kannada", "hindi", "saynumbers"].forEach(m => {
    const el = document.getElementById(`tab-${m}`);
    if (el) el.classList.toggle("active", m === currentAppMode);
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
    queue = shuffle([...repeatedNew, ...reviewItems]);
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
    showScreen("quiz-screen");
    if (gameMode === "reverse") loadNumberRoundReverse();
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
    choices.forEach(n => {
        const btn = document.createElement("button");
        btn.className = "choice-btn choice-number-btn";
        btn.textContent = n;
        btn.onclick = () => handleNumberChoice(btn, n, count);
        choicesEl.appendChild(btn);
    });

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
        if (roundClean) {
            stars++;
            document.getElementById("stars").textContent = stars;
        }
        playCorrectSound();
        spawnConfetti();
        speak(String(count));
        setTimeout(() => speak(String(count)), 1200);

        const fb = document.getElementById("feedback");
        fb.className = "feedback show correct-fb";
        document.getElementById("feedback-emoji").textContent = "🌟";
        document.getElementById("feedback-text").textContent = `${count}!`;
        setTimeout(() => { fb.className = "feedback hidden"; }, 1800);

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

                const fb = document.getElementById("feedback");
                fb.className = "feedback show correct-fb";
                document.getElementById("feedback-emoji").textContent = "🌟";
                document.getElementById("feedback-text").textContent = `${count}!`;
                setTimeout(() => { fb.className = "feedback hidden"; }, 1800);

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
