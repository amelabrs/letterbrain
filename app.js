/* ── LetterBrain — App Logic ─────────────────────────────────────── */

const ITEMS = [
    { letter: "A", word: "Apple",    emoji: "🍎" },
    { letter: "B", word: "Ball",     emoji: "⚽" },
    { letter: "C", word: "Cat",      emoji: "🐱" },
    { letter: "D", word: "Dog",      emoji: "🐶" },
    { letter: "E", word: "Elephant", emoji: "🐘" },
    { letter: "F", word: "Frog",     emoji: "🐸" },
];

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

// ── Game Flow ───────────────────────────────────────────────────────

function startGame() {
    queue = shuffle(ITEMS);
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
    const wrong = shuffle(ITEMS.filter((it) => it.letter !== currentItem.letter)).slice(0, 3);
    const options = shuffle([currentItem, ...wrong]);

    // Render choices
    const choicesEl = document.getElementById("choices");
    choicesEl.innerHTML = "";

    options.forEach((opt) => {
        const btn = document.createElement("button");
        btn.className = "choice-btn";
        btn.innerHTML = `
            <span class="choice-emoji">${opt.emoji}</span>
            <span class="choice-label">${opt.word}</span>
        `;
        btn.onclick = () => handleChoice(btn, opt);
        choicesEl.appendChild(btn);
    });

    // Update progress
    document.getElementById("round-info").textContent = `${currentIndex + 1} / ${queue.length}`;
    document.getElementById("progress-fill").style.width = `${(currentIndex / queue.length) * 100}%`;
}

function handleChoice(btn, chosen) {
    if (answered) return;
    answered = true;

    const isCorrect = chosen.letter === currentItem.letter;

    // Highlight buttons
    document.querySelectorAll(".choice-btn").forEach((b) => {
        b.classList.add("dimmed");
    });
    btn.classList.remove("dimmed");

    if (isCorrect) {
        btn.classList.add("correct");
        stars++;
        document.getElementById("stars").textContent = stars;

        playCorrectSound();
        // Speak "B for Ball!" after the chime
        setTimeout(() => speak(`${currentItem.letter} for ${currentItem.word}!`), 500);

        showFeedback(true);
        spawnConfetti();
    } else {
        btn.classList.add("wrong");

        // Also highlight the correct one
        document.querySelectorAll(".choice-btn").forEach((b) => {
            if (b.querySelector(".choice-label").textContent === currentItem.word) {
                b.classList.remove("dimmed");
                b.classList.add("correct");
            }
        });

        playWrongSound();
        setTimeout(() => speak(`Oops! ${currentItem.letter} for ${currentItem.word}.`), 400);
        showFeedback(false);
    }

    // Advance after delay
    setTimeout(() => {
        currentIndex++;
        loadRound();
    }, 2200);
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

    showScreen("done-screen");

    speak(
        stars === queue.length
            ? "Amazing! You got them all right!"
            : `Great job! You got ${stars} out of ${queue.length}!`
    );
    spawnConfetti();
}
