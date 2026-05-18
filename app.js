/* ── LetterBrain — App Logic ─────────────────────────────────────── */

const ALL_ITEMS = [
    // Level 1: A–F
    { letter: "A", word: "Apple",    image: "images/apple.png", level: 1, vidStart: 5,  vidEnd: 12 },
    { letter: "B", word: "Ball",     image: "images/ball.png", level: 1, vidStart: 12, vidEnd: 19 },
    { letter: "C", word: "Cat",      image: "images/cat.png", level: 1, vidStart: 24, vidEnd: 30 },
    { letter: "D", word: "Dog",      image: "images/dog.png", level: 1, vidStart: 30, vidEnd: 36 },
    { letter: "E", word: "Elephant", image: "images/elephant.png", level: 1, vidStart: 36, vidEnd: 43 },
    { letter: "F", word: "Fish",     image: "images/fish.png", level: 1, vidStart: 43, vidEnd: 50 },
    // Level 2: G–J
    { letter: "G", word: "Goat",     image: "images/goat.png", level: 2, vidStart: 56, vidEnd: 62 },
    { letter: "H", word: "Hen",      image: "images/hen.png", level: 2, vidStart: 62, vidEnd: 69 },
    { letter: "I", word: "Igloo",    image: "images/igloo.png", level: 2, vidStart: 69, vidEnd: 76 },
    { letter: "J", word: "Joker",    image: "images/joker.png", level: 2, vidStart: 75, vidEnd: 82 },
    // Level 3: K–N
    { letter: "K", word: "King",     image: "images/king.png", level: 3, vidStart: 87, vidEnd: 93 },
    { letter: "L", word: "Lion",     image: "images/lion.png", level: 3, vidStart: 93, vidEnd: 99 },
    { letter: "M", word: "Monkey",   image: "images/monkey.png", level: 3, vidStart: 99, vidEnd: 105 },
    { letter: "N", word: "Nose",     image: "images/nose.png", level: 3, vidStart: 105, vidEnd: 111 },
    // Level 4: O–R
    { letter: "O", word: "Orange",   image: "images/orange.png", level: 4, vidStart: 118, vidEnd: 125 },
    { letter: "P", word: "Parrot",   image: "images/parrot.png", level: 4, vidStart: 125, vidEnd: 132 },
    { letter: "Q", word: "Queen",    image: "images/queen.png", level: 4, vidStart: 132, vidEnd: 139 },
    { letter: "R", word: "Rabbit",   image: "images/rabbit.png", level: 4, vidStart: 139, vidEnd: 146 },
    // Level 5: S–V
    { letter: "S", word: "Snake",    image: "images/snake.png", level: 5, vidStart: 150, vidEnd: 157 },
    { letter: "T", word: "Tiger",    image: "images/tiger.png", level: 5, vidStart: 157, vidEnd: 164 },
    { letter: "U", word: "Uncle",    image: "images/uncle.png", level: 5, vidStart: 164, vidEnd: 171 },
    { letter: "V", word: "Van",      image: "images/van.png", level: 5, vidStart: 171, vidEnd: 178 },
    // Level 6: W–Z
    { letter: "W", word: "Watch",    image: "images/watch.png", level: 6, vidStart: 182, vidEnd: 189 },
    { letter: "X", word: "Xmas Tree",image: "images/xmastree.png", level: 6, vidStart: 189, vidEnd: 196 },
    { letter: "Y", word: "Yacht",    image: "images/yacht.png", level: 6, vidStart: 196, vidEnd: 203 },
    { letter: "Z", word: "Zebra",    image: "images/zebra.png", level: 6, vidStart: 203, vidEnd: 210 },
];

let currentLevel = 1;
let levelItems = [];
let videoEnabled = true;
let gameMode = "normal"; // "normal" = letter→image, "reverse" = image→letter
const UNLOCK_THRESHOLD = 3; // stars needed to unlock next level

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

function getUnlockedLevel() {
    return parseInt(localStorage.getItem("lb_unlocked") || "1");
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
    const levels = [...new Set(ALL_ITEMS.map((it) => it.level))].sort();
    const unlocked = getUnlockedLevel();

    levels.forEach((lvl) => {
        const items = ALL_ITEMS.filter((it) => it.level === lvl);
        const card = document.createElement("div");
        const isLocked = lvl > unlocked;
        card.className = "level-card" + (isLocked ? " locked" : "");

        if (!isLocked) {
            card.onclick = () => startGame(lvl);
        }

        const thumbs = items.map((it) =>
            `<img src="${it.image}" alt="${it.word}">`
        ).join("");

        card.innerHTML = `
            <span class="level-number">${lvl}</span>
            <div class="level-thumbs">${thumbs}</div>
            <span class="level-go">${isLocked ? "🔒" : "▶"}</span>
        `;
        grid.appendChild(card);
    });
}

// Build on load
buildLevelGrid();

// ── Mode Tabs ──────────────────────────────────────────────────────────
document.querySelectorAll(".mode-tab").forEach((tab) => {
    tab.addEventListener("click", () => {
        document.querySelectorAll(".mode-tab").forEach((t) => t.classList.remove("active"));
        tab.classList.add("active");
        gameMode = tab.dataset.mode;
    });
});

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

function startGame(lvl) {
    currentLevel = lvl;
    videoEnabled = document.getElementById("video-toggle").checked;
    levelItems = ALL_ITEMS.filter((it) => it.level === currentLevel);

    queue = shuffle(levelItems);
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

        // Pick 3 wrong letters + 1 correct, show as letter buttons
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

        // Play video reward if enabled and this letter has a video clip
        if (videoEnabled && currentItem.vidStart != null) {
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
    setTimeout(() => {
        currentIndex++;
        loadRound();
    }, 2200);
}

// ── YouTube Video Reward ────────────────────────────────────────────

const VIDEO_ID = "a_DRSc0oZV0";
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

function playVideoReward() {
    if (!ytReady) {
        currentIndex++;
        loadRound();
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
    }, (end - start + 2) * 1000);
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
    currentIndex++;
    loadRound();
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

    // Check if next level should unlock
    const unlocked = getUnlockedLevel();
    const nextLevel = currentLevel + 1;
    const maxLevel = Math.max(...ALL_ITEMS.map((it) => it.level));
    let newUnlock = false;

    if (stars === queue.length && currentLevel === unlocked && nextLevel <= maxLevel) {
        setUnlockedLevel(nextLevel);
        newUnlock = true;
    }

    showScreen("done-screen");

    if (newUnlock) {
        document.getElementById("unlock-msg").style.display = "block";
        speak(`Amazing! You unlocked Level ${nextLevel}!`);
    } else if (stars === queue.length) {
        document.getElementById("unlock-msg").style.display = "none";
        speak("Amazing! You got them all right!");
    } else {
        document.getElementById("unlock-msg").style.display = "none";
        speak(`Good try! You got ${stars} out of ${queue.length}. Get all right to unlock the next level!`);
    }

    spawnConfetti();
    buildLevelGrid(); // refresh locked states
    sendStats();

    // Shorts reward for perfect score (always plays, independent of per-letter video toggle)
    if (stars === queue.length) {
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
