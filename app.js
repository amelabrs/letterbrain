/* ── LetterBrain — App Logic ─────────────────────────────────────── */

const ALL_ITEMS = [
    // Level 1: A–F
    { letter: "A", word: "Apple",    image: "images/apple.png", level: 1, vidStart: 5,  vidEnd: 12 },
    { letter: "B", word: "Ball",     image: "images/ball.png", level: 1, vidStart: 12, vidEnd: 19 },
    { letter: "C", word: "Cat",      image: "images/cat.png", level: 1, vidStart: 24, vidEnd: 30 },
    { letter: "D", word: "Dog",      image: "images/dog.png", level: 1, vidStart: 30, vidEnd: 36 },
    { letter: "E", word: "Elephant", image: "images/elephant.png", level: 1, vidStart: 36, vidEnd: 43 },
    { letter: "F", word: "Frog",     image: "images/frog.png", level: 1, vidStart: 43, vidEnd: 50 },
    // Level 2: G–J
    { letter: "G", word: "Goat",     image: "images/goat.png", level: 2, vidStart: 56, vidEnd: 62 },
    { letter: "H", word: "Hen",      image: "images/hen.png", level: 2, vidStart: 62, vidEnd: 69 },
    { letter: "I", word: "Igloo",    image: "images/igloo.png", level: 2, vidStart: 69, vidEnd: 76 },
    { letter: "J", word: "Joker",    image: "images/joker.png", level: 2, vidStart: 75, vidEnd: 82 },
    // Level 3: K–N
    { letter: "K", word: "King",     image: "images/king.png", level: 3, vidStart: 88, vidEnd: 95 },
    { letter: "L", word: "Lion",     image: "images/lion.png", level: 3, vidStart: 94, vidEnd: 100 },
    { letter: "M", word: "Mango",    image: "images/mango.png", level: 3, vidStart: 100, vidEnd: 106 },
    { letter: "N", word: "Nose",     image: "images/nose.png", level: 3, vidStart: 106, vidEnd: 112 },
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
const UNLOCK_THRESHOLD = 3; // stars needed to unlock next level

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
        gain.gain.setValueAtTime(0.25, audioCtx.currentTime + i * duration);
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

// ── Hidden Reset (long-press title for 3s) ────────────────────────────
let resetTimer = null;
const title = document.getElementById("app-title");
title.addEventListener("touchstart", () => {
    resetTimer = setTimeout(doReset, 3000);
});
title.addEventListener("touchend", () => clearTimeout(resetTimer));
title.addEventListener("touchcancel", () => clearTimeout(resetTimer));
title.addEventListener("mousedown", () => {
    resetTimer = setTimeout(doReset, 3000);
});
title.addEventListener("mouseup", () => clearTimeout(resetTimer));
title.addEventListener("mouseleave", () => clearTimeout(resetTimer));

function doReset() {
    if (confirm("Reset all progress?")) {
        localStorage.removeItem("lb_unlocked");
        buildLevelGrid();
        showScreen("start-screen");
        speak("Progress reset!");
    }
}

// ── Game Flow ───────────────────────────────────────────────────────

function startGame(lvl) {
    currentLevel = lvl;
    videoEnabled = document.getElementById("video-toggle").checked;
    levelItems = ALL_ITEMS.filter((it) => it.level === currentLevel);

    queue = shuffle(levelItems);
    currentIndex = 0;
    stars = 0;
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
    currentItem = queue[currentIndex];

    // Update letter display
    const bigLetter = document.getElementById("big-letter");
    bigLetter.textContent = currentItem.letter;
    bigLetter.style.animation = "none";
    // Force reflow to restart animation
    void bigLetter.offsetWidth;
    bigLetter.style.animation = "popIn 0.4s ease-out";

    // Speak the prompt
    speak(`What starts with ${currentItem.letter}?`);

    // Pick 3 wrong choices + 1 correct, shuffle
    const wrong = shuffle(levelItems.filter((it) => it.letter !== currentItem.letter)).slice(0, 3);
    const options = shuffle([currentItem, ...wrong]);

    // Render choices
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

    // Render emoji as high-quality SVGs
    if (window.twemoji) twemoji.parse(choicesEl, { folder: 'svg', ext: '.svg' });

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

// Called automatically by YouTube IFrame API
function onYouTubeIframeAPIReady() {
    ytPlayer = new YT.Player("yt-player", {
        width: "100%",
        height: "100%",
        videoId: VIDEO_ID,
        playerVars: {
            autoplay: 0,
            controls: 0,
            modestbranding: 1,
            rel: 0,
            showinfo: 0,
        },
        events: {
            onReady: () => { ytReady = true; },
            onStateChange: onPlayerStateChange,
        },
    });
}

function onPlayerStateChange(e) {
    // When video ends (state 0), hide overlay and advance
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
    if (ytPlayer) ytPlayer.pauseVideo();
    currentIndex++;
    loadRound();
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
}
