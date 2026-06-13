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
    return parseInt(localStorage.getItem("lb_unlocked") || "3");
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

function getDisableOld() {
    return localStorage.getItem("lb_disableOld") === "1";
}

function setDisableOld(val) {
    localStorage.setItem("lb_disableOld", val ? "1" : "0");
}

function buildLevelGrid() {
    const grid = document.getElementById("level-grid");
    grid.innerHTML = "";

    if (currentAppMode === "saynumbers") {
        [
            { label: "1 🔢", thumbs: "<span>⚽</span><span>⚽⚽</span><span>⚽⚽⚽</span>", mode: "reverse", range: [1, 4] },
            { label: "2 ⚽", thumbs: "<span>1</span><span>2</span>",                       mode: "normal", range: [1, 2] },
            { label: "3 ⚽", thumbs: "<span>3</span><span>4</span>",                       mode: "normal", range: [3, 4] },
        ].forEach(({ label, thumbs, mode, range }) => {
            const card = document.createElement("div");
            card.className = "level-card";
            card.onclick = () => startNumbers(mode, range);
            card.innerHTML = `
                <span class="level-number">${label}</span>
                <div class="level-thumbs number-level-preview">${thumbs}</div>
                <span class="level-go">▶</span>
            `;
            grid.appendChild(card);
        });
        return;
    }

    const unlockedPair = getUnlockedLevel(); // now stores pair number
    const disableOld = getDisableOld();

    const maxVisiblePair = Math.max(unlockedPair + 1, 4); // always show at least 8 levels

    GAME_LEVELS.forEach((gl, idx) => {
        if (gl.pair > maxVisiblePair) return;

        const items = ALL_ITEMS.filter((it) => it.level === gl.contentLevel);
        const card = document.createElement("div");
        const isLocked = gl.pair > unlockedPair;
        const isOldDisabled = disableOld && gl.pair < unlockedPair;
        card.className = "level-card" + (isLocked ? " locked" : "") + (isOldDisabled ? " old-disabled" : "");

        if (!isLocked && !isOldDisabled) {
            card.onclick = () => startGame(idx);
        }

        const modeIcon = gl.mode === "normal" ? "🔤" : "🖼️";
        const thumbs = items.map((it) =>
            `<img src="${it.image}" alt="${it.word}">`
        ).join("");

        card.innerHTML = `
            <span class="level-number">${idx + 1} ${modeIcon}</span>
            <div class="level-thumbs">${thumbs}</div>
            <span class="level-go">${isLocked ? "🔒" : isOldDisabled ? "✅" : "▶"}</span>
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

// ── Disable Old Levels Toggle ──────────────────────────────────────
const disableOldToggle = document.getElementById("disable-old-toggle");
disableOldToggle.checked = getDisableOld();
disableOldToggle.addEventListener("change", () => {
    setDisableOld(disableOldToggle.checked);
    buildLevelGrid();
});

const phoneticsToggle = document.getElementById("phonetics-toggle");
phoneticsToggle.checked = getPhoneticsMode();
// ── Video mode toggles (mutually exclusive) ─────────────────────────
const videoModeToggles = {
    phonetics:  { el: phoneticsToggle,                          get: getPhoneticsMode, set: setPhoneticsMode },
    beFunny:    { el: document.getElementById("be-funny-toggle"),   get: getBeFunny,       set: setBeFunny },
    wordVideo:  { el: document.getElementById("word-video-toggle"), get: getWordVideoMode, set: setWordVideoMode },
};

function activateVideoMode(activeKey) {
    Object.entries(videoModeToggles).forEach(([key, t]) => {
        const on = key === activeKey;
        t.set(on);
        t.el.checked = on;
    });
}

Object.entries(videoModeToggles).forEach(([key, t]) => {
    t.el.checked = t.get();
    t.el.addEventListener("change", () => {
        if (t.el.checked) activateVideoMode(key);
        else { t.set(false); }
    });
});

const beFunnyToggle = videoModeToggles.beFunny.el;

// On load: if no video mode is active, default to Phonetics
if (!Object.values(videoModeToggles).some(t => t.get())) {
    activateVideoMode('phonetics');
}



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

function startGame(gameLevelIdx) {
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

        // Play video clip unless disabled
        if (!document.getElementById("disable-video-toggle").checked && (currentItem.vidStart != null || currentItem.localVid || currentItem.funnyShort || getPhoneticsMode())) {
            setTimeout(() => playVideoReward(), 1600);
            return; // Don't auto-advance — video will handle it
        }
    } else {
        btn.classList.add("wrong");
        btn.disabled = true;

        roundClean = false;
        roundWrongs++;
        playWrongSound();
        setTimeout(() => speak("Try again!"), 400);

        // Let the child keep trying — don't advance, don't reveal answer
        answered = false;
        return;
    }

    // Advance after delay (correct without video)
    setTimeout(advanceRound, 2200);
}

// ── YouTube Video Reward ────────────────────────────────────────────

let VIDEO_ID = "a_DRSc0oZV0";

// ── Phonics Mode ─────────────────────────────────────────────────────
const PHONICS_VIDEO_ID = "svmmuYQPrI4";
const PHONICS_TIMESTAMPS = {
    "A":0,"B":13,"C":27,"D":40,"E":52,"F":64,"G":79,"H":93,
    "I":106,"J":118,"K":131,"L":145,"M":157,"N":169,"O":182,
    "P":196,"Q":211,"R":224,"S":238,"T":254,"U":268,"V":280,
    "W":295,"X":309,"Y":323,"Z":337
};
const PHONICS_LETTERS = Object.keys(PHONICS_TIMESTAMPS);

function getBeFunny() {
    return localStorage.getItem("lb_beFunny") === "1";
}
function setBeFunny(val) {
    localStorage.setItem("lb_beFunny", val ? "1" : "0");
}
function getWordVideoMode() {
    return localStorage.getItem("lb_wordVideo") === "1";
}
function setWordVideoMode(val) {
    localStorage.setItem("lb_wordVideo", val ? "1" : "0");
}

function getPhoneticsMode() {
    const val = localStorage.getItem("lb_phonetics");
    return val === null ? true : val === "1";
}
function setPhoneticsMode(val) {
    localStorage.setItem("lb_phonetics", val ? "1" : "0");
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

function playFunnyShort() {
    if (!ytReady) { advanceRound(); return; }
    const overlay = document.getElementById("video-overlay");
    const localPlayer = document.getElementById("local-player");
    const ytEl = document.getElementById("yt-player");
    localPlayer.style.display = "none";
    ytEl.style.display = "block";
    overlay.className = "video-overlay show";
    videoShowing = true;
    ytPlayer.loadVideoById({ videoId: currentItem.funnyShort, startSeconds: currentItem.funnyStart ?? 0 });
    safetyTimer = setTimeout(() => {
        clearInterval(videoTimer);
        hideVideoOverlay();
    }, 5000);
}

function playVideoReward() {
    if (getPhoneticsMode()) { playPhonicsClip(); return; }
    if (currentItem.funnyShort && getBeFunny()) { playFunnyShort(); return; }
    // Local video takes priority
    if (currentItem.localVid) {
        const overlay = document.getElementById("video-overlay");
        const localPlayer = document.getElementById("local-player");
        const ytEl = document.getElementById("yt-player");
        ytEl.style.display = "none";
        localPlayer.style.display = "block";
        localPlayer.src = currentItem.localVid;
        overlay.className = "video-overlay show";
        videoShowing = true;
        localPlayer.play();
        localPlayer.onended = () => {
            localPlayer.style.display = "none";
            ytEl.style.display = "block";
            hideVideoOverlay();
        };
        // Safety timeout (30s max)
        safetyTimer = setTimeout(() => {
            localPlayer.pause();
            localPlayer.style.display = "none";
            ytEl.style.display = "block";
            hideVideoOverlay();
        }, 5000);
        return;
    }

    if (!ytReady) {
        advanceRound();
        return;
    }

    const start = currentItem.vidStart;
    const end = currentItem.vidEnd;

    const overlay = document.getElementById("video-overlay");
    overlay.className = "video-overlay show";
    videoShowing = true;
    ytPlayer.seekTo(start, true);
    ytPlayer.playVideo();

    // Monitor playback and stop at the end timestamp
    clearInterval(videoTimer);
    videoTimer = setInterval(() => {
        if (ytPlayer.getCurrentTime && ytPlayer.getCurrentTime() >= end) {
            clearInterval(videoTimer);
            hideVideoOverlay();
        }
    }, 200);

    // Safety timeout
    safetyTimer = setTimeout(() => {
        clearInterval(videoTimer);
        hideVideoOverlay();
    }, 5000);
}

let safetyTimer = null;

function hideVideoOverlay() {
    if (!videoShowing) return; // prevent double-fire
    videoShowing = false;
    clearInterval(videoTimer);
    clearTimeout(safetyTimer);
    const overlay = document.getElementById("video-overlay");
    overlay.className = "video-overlay hidden";
    document.getElementById("skip-cartoon").style.display = "none";
    if (ytPlayer) ytPlayer.pauseVideo();
    // Reload the original video for per-letter rewards
    if (ytReady) ytPlayer.cueVideoById(VIDEO_ID);
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
    text.textContent = correct
        ? `${currentItem.letter} for ${currentItem.word}!`
        : `It's ${currentItem.word}!`;

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

    showScreen("done-screen");

    if (newUnlock) {
        document.getElementById("unlock-msg").style.display = "block";
        speak(`Amazing! You unlocked new levels!`);
    } else if (stars >= threshold) {
        document.getElementById("unlock-msg").style.display = "none";
        speak("Great job!");
    } else {
        document.getElementById("unlock-msg").style.display = "none";
        speak(`Good try! You got ${stars} out of ${queue.length}. Keep practicing!`);
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

// ── Advance helper (mode-aware) ──────────────────────────────────────
function advanceRound() {
    currentIndex++;
    if (currentAppMode === "saynumbers") {
        if (gameMode === "reverse") loadNumberRoundReverse();
        else loadNumberRound();
    } else {
        loadRound();
    }
}

// ── Mode Tabs ─────────────────────────────────────────────────────────
function setActiveTab(mode) {
    currentAppMode = mode;
    localStorage.setItem("lb_mode", mode);
    ["quiz", "saynumbers"].forEach(m => {
        const el = document.getElementById(`tab-${m}`);
        if (el) el.classList.toggle("active", m === mode);
    });
    buildLevelGrid();
}
document.getElementById("tab-quiz").addEventListener("click", () => setActiveTab("quiz"));
document.getElementById("tab-saynumbers").addEventListener("click", () => setActiveTab("saynumbers"));
// Reset any stored mode from removed tabs
if (["sayit", "saywords", "sayletters"].includes(currentAppMode)) {
    currentAppMode = "quiz";
    localStorage.setItem("lb_mode", "quiz");
}
// Set initial tab highlight (grid is built by initWordVideos below)
["quiz", "saynumbers"].forEach(m => {
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

        const hasVideo = currentItem.vidStart != null || currentItem.localVid ||
                         currentItem.funnyShort || getPhoneticsMode();
        if (!document.getElementById("disable-video-toggle").checked && hasVideo) {
            setTimeout(() => playVideoReward(), 1600);
        } else {
            setTimeout(advanceRound, 2200);
        }
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
    for (let n = numberRange[0]; n <= numberRange[1]; n++) {
        const btn = document.createElement("button");
        btn.className = "choice-btn choice-number-btn";
        btn.textContent = n;
        btn.onclick = () => handleNumberChoice(btn, n, count);
        choicesEl.appendChild(btn);
    }

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
