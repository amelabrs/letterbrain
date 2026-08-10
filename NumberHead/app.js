// ── NumberHead ── app.js ─────────────────────────────────────────────────
"use strict";

const TILE_COLORS = ["#347046","#DEA431","#2E5E6E","#B85C38","#7B5A86","#C47A28"];
const LS = "nh_";

// ── Number data ──────────────────────────────────────────────────────────
const ITEMS = [
  { num:1,  word:"one",   rhyme:"sun",    emoji:"☀️"  },
  { num:2,  word:"two",   rhyme:"shoes",  emoji:"👟"  },
  { num:3,  word:"three", rhyme:"trees",  emoji:"🌲"  },
  { num:4,  word:"four",  rhyme:"doors",  emoji:"🚪"  },
  { num:5,  word:"five",  rhyme:"dive",   emoji:"🤿"  },
  { num:6,  word:"six",   rhyme:"sticks", emoji:"🪄"  },
  { num:7,  word:"seven", rhyme:"heaven", emoji:"⭐"  },
  { num:8,  word:"eight", rhyme:"gate",   emoji:"⛩️" },
  { num:9,  word:"nine",  rhyme:"line",   emoji:"📏"  },
  { num:10, word:"ten",   rhyme:"pen",    emoji:"✏️"  },
];

// ── Zone / level structure ───────────────────────────────────────────────
const ZONES = [
  { id:"z1-2",   label:"1 & 2",     nums:[1,2],                   isTest:false, repeats:3 },
  { id:"z3-4",   label:"3 & 4",     nums:[3,4],                   isTest:false, repeats:3 },
  { id:"zt1-4",  label:"Test 1–4",  nums:[1,2,3,4],               isTest:true,  repeats:2 },
  { id:"z5-6",   label:"5 & 6",     nums:[5,6],                   isTest:false, repeats:3 },
  { id:"zt1-6",  label:"Test 1–6",  nums:[1,2,3,4,5,6],           isTest:true,  repeats:1 },
  { id:"z7-8",   label:"7 & 8",     nums:[7,8],                   isTest:false, repeats:3 },
  { id:"zt1-8",  label:"Test 1–8",  nums:[1,2,3,4,5,6,7,8],      isTest:true,  repeats:1 },
  { id:"z9-10",  label:"9 & 10",    nums:[9,10],                  isTest:false, repeats:3 },
  { id:"zt1-10", label:"Test 1–10", nums:[1,2,3,4,5,6,7,8,9,10], isTest:true,  repeats:1 },
];

// ── Video clips keyed by zone id ─────────────────────────────────────────
// start = seconds into video, dur = seconds to show
// afterN key matches 'after' + currentItem.num
const CLIPS = {
  'z3-4': {
    intro:  { start: 90,  dur: 5 },  // 1:30 — jigsaw (5 s before door)
    after3: { start: 95,  dur: 7 },  // 1:35 — numbers on the door
    after4: { start: 102, dur: 7 },  // 1:42 — numbers on the floor
    outro:  { start: 110, dur: 8 },  // 1:50 — don't you want to sing along
  },
  'z5-6': {
    intro:  { start: 121, dur: 5 },  // 2:01 — five seconds before five clip
    after5: { start: 126, dur: 7 },  // 2:06 — five / dive
    after6: { start: 134, dur: 7 },  // 2:14 — six / sticks
    outro:  { start: 143, dur: 8 },  // 2:23 — wrap up
  },
};
let clipCallback=null, clipTimer=null;

// ── State ────────────────────────────────────────────────────────────────
let queue=[], qIdx=0, sessionStars=0, roundClean=true, answered=false;
let currentItem=null, currentZone=null;

// ── Boot ─────────────────────────────────────────────────────────────────
window.addEventListener('DOMContentLoaded', () => {
  document.getElementById('stars').textContent = localStorage.getItem(LS+"stars") || "0";
  buildLevelGrid();
  if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js');
});

// ── Level Grid ───────────────────────────────────────────────────────────
function buildLevelGrid() {
  const grid = document.getElementById('level-grid');
  grid.innerHTML = '';

  ZONES.forEach((zone, zi) => {
    const card = document.createElement('div');
    card.className = zone.isTest ? 'zone-card zone-test-card' : 'zone-card';

    const hdr = document.createElement('div');
    hdr.className = zone.isTest ? 'zone-header zone-test-header' : 'zone-header';
    hdr.textContent = zone.isTest ? '★  ' + zone.label : zone.label;
    card.appendChild(hdr);

    const row = document.createElement('div');
    row.className = 'zone-row';

    const zStars = parseInt(localStorage.getItem(LS+'z_'+zone.id) || '0');
    const node = document.createElement('button');
    node.className = 'level-node';
    node.style.background = TILE_COLORS[zi % TILE_COLORS.length];

    const emojis = zone.isTest
      ? '⭐'
      : zone.nums.map(n => ITEMS[n-1].emoji).join('');

    const numRange = zone.nums.length > 1
      ? zone.nums[0] + '–' + zone.nums[zone.nums.length-1]
      : String(zone.nums[0]);

    node.innerHTML = `
      <span class="node-emoji">${emojis}</span>
      <span class="node-nums">${numRange}</span>
      <span class="node-stars">${'⭐'.repeat(Math.min(3, zStars))}</span>
    `;
    node.onclick = () => startZone(zone);
    row.appendChild(node);
    card.appendChild(row);
    grid.appendChild(card);
  });
}

// ── Start Zone ───────────────────────────────────────────────────────────
function startZone(zone) {
  currentZone = zone;
  queue = buildQueue(zone.nums, zone.repeats);
  qIdx = 0;
  sessionStars = 0;
  document.getElementById('zone-label').textContent = zone.label;
  show('quiz-screen');

  if (CLIPS[zone.id]) {
    playClip('intro', () => nextRound());
  } else {
    nextRound();
  }
}

// ── Round ────────────────────────────────────────────────────────────────
function nextRound() {
  if (qIdx >= queue.length) { showDone(); return; }
  const num = queue[qIdx++];
  currentItem = ITEMS[num - 1];
  roundClean = true;
  answered = false;
  updateProgress();
  renderQuestion();
}

function renderQuestion() {
  const display = document.getElementById('letter-display');
  display.style.background = TILE_COLORS[(currentItem.num - 1) % TILE_COLORS.length];

  // ── Phase 1: say the word ────────────────────────────────────────────
  display.innerHTML = `<span class="rhyme-word">${currentItem.word}</span>`;
  document.getElementById('choices').innerHTML = '';
  document.getElementById('choices').style.visibility = 'hidden';
  speakWord(currentItem.word);

  // ── Phase 2: show count grid + choices after 800 ms ─────────────────
  setTimeout(() => {
    renderCountGrid(display);
    renderChoices();
    document.getElementById('choices').style.visibility = 'visible';
  }, 800);
}

// ── Count grid ───────────────────────────────────────────────────────────
function renderCountGrid(display) {
  const n = currentItem.num;
  const cols = n<=3 ? n : n===4 ? 2 : n<=6 ? 3 : n<=8 ? 4 : n===9 ? 3 : 5;
  // box is 210px, padding 8px each side → ~194px effective
  const size = n===1?104 : n===2?84 : n===3?58 : n===4?80 : n<=6?54 : n<=8?42 : n===9?52 : 34;
  const gap  = n<=4 ? 6 : n<=8 ? 4 : 3;

  let html = `<div class="count-grid" style="grid-template-columns:repeat(${cols},1fr);gap:${gap}px">`;
  for (let i = 0; i < n; i++) {
    html += `<span class="count-emoji" style="font-size:${size}px">${currentItem.emoji}</span>`;
  }
  html += '</div>';
  display.innerHTML = html;
}

// ── Choices ──────────────────────────────────────────────────────────────
function renderChoices() {
  const opts = getOptions(currentItem.num);
  const el = document.getElementById('choices');
  el.innerHTML = '';
  opts.forEach((num, i) => {
    const item = ITEMS[num - 1];
    const btn = document.createElement('button');
    btn.className = 'choice-btn';
    btn.style.background = TILE_COLORS[i % TILE_COLORS.length];
    btn.innerHTML = `<span class="choice-numeral">${num}</span><span class="choice-subword">${item.word}</span>`;
    btn.onclick = () => handleChoice(btn, num);
    el.appendChild(btn);
  });
}

function getOptions(correctNum) {
  const others = [1,2,3,4,5,6,7,8,9,10].filter(n => n !== correctNum);
  // Prefer nearby numbers as distractors, with a little noise for variety
  others.sort((a, b) => {
    const da = Math.abs(a - correctNum) + Math.random() * 2.5;
    const db = Math.abs(b - correctNum) + Math.random() * 2.5;
    return da - db;
  });
  return shuffle([correctNum, ...others.slice(0, 3)]);
}

// ── Handle Choice ─────────────────────────────────────────────────────────
function handleChoice(btn, chosen) {
  if (answered) return;

  if (chosen === currentItem.num) {
    answered = true;
    document.querySelectorAll('.choice-btn').forEach(b => b.classList.add('dimmed'));
    btn.classList.remove('dimmed');
    btn.classList.add('correct');
    addCheckBadge(btn);

    if (roundClean) {
      sessionStars++;
      const total = (parseInt(localStorage.getItem(LS+"stars") || "0")) + 1;
      localStorage.setItem(LS+"stars", total);
      document.getElementById('stars').textContent = total;
      const zk = LS+'z_'+currentZone.id;
      localStorage.setItem(zk, (parseInt(localStorage.getItem(zk) || "0")) + 1);
    }

    playCorrectSound();
    showFeedback(true);
    spawnConfetti();

    // Play matching video clip after every correct answer (if zone has clips)
    const afterKey = 'after' + currentItem.num;
    const zoneClips = CLIPS[currentZone.id];
    if (zoneClips && zoneClips[afterKey]) {
      setTimeout(() => playClip(afterKey, () => nextRound()), 1200);
    } else {
      setTimeout(() => nextRound(), 1200);
    }

  } else {
    btn.classList.add('wrong');
    btn.disabled = true;
    roundClean = false;
    playWrongSound();
    showFeedback(false);
  }
}

function addCheckBadge(btn) {
  const b = document.createElement('div');
  b.className = 'check-badge';
  b.innerHTML = '<svg width="16" height="12" viewBox="0 0 16 12"><path d="M1 6l4 4L15 1" stroke="#fff" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  btn.appendChild(b);
}

// ── Feedback ──────────────────────────────────────────────────────────────
function showFeedback(correct) {
  const fb = document.getElementById('feedback');
  const em = document.getElementById('feedback-emoji');
  const tx = document.getElementById('feedback-text');

  if (correct) {
    em.textContent = '🎉';
    tx.textContent = '';
    fb.classList.remove('hidden'); fb.classList.add('show');
    setTimeout(() => { fb.classList.remove('show'); fb.classList.add('hidden'); }, 500);
  } else {
    em.textContent = '😊';
    tx.textContent = `It's ${currentItem.num} — ${currentItem.word} ${currentItem.rhyme}!`;
    fb.classList.remove('hidden'); fb.classList.add('show');
    setTimeout(() => { fb.classList.remove('show'); fb.classList.add('hidden'); }, 1800);
  }
}

// ── Done Screen ────────────────────────────────────────────────────────────
function showDone() {
  if (CLIPS[currentZone.id]) {
    playClip('outro', renderDoneScreen);
  } else {
    renderDoneScreen();
  }
}

function renderDoneScreen() {
  const isPerfect = sessionStars === queue.length;
  document.getElementById('done-title').textContent = isPerfect ? '⭐ Perfect!' : '🎉 Great job!';
  document.getElementById('done-score').textContent = sessionStars;
  document.getElementById('done-total').textContent = queue.length;
  document.getElementById('done-stars').textContent = '⭐'.repeat(Math.min(5, sessionStars));
  show('done-screen');
}

// ── Progress ─────────────────────────────────────────────────────────────
function updateProgress() {
  document.getElementById('progress-fill').style.width = (qIdx / queue.length * 100) + '%';
}

// ── Navigation ────────────────────────────────────────────────────────────
function goHome() {
  // Abort any playing clip without calling its callback
  clearTimeout(clipTimer);
  clipCallback = null;
  const vid = document.getElementById('vid');
  if (vid) vid.pause();
  document.getElementById('video-overlay').classList.add('hidden');
  show('start-screen');
  buildLevelGrid();
}

function show(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById(id).classList.add('active');
}

// ── Queue builder ─────────────────────────────────────────────────────────
function buildQueue(nums, repeats) {
  const pool = [];
  for (let r = 0; r < repeats; r++) {
    pool.push(...shuffle([...nums]));
  }
  // Flatten any adjacent duplicates
  for (let i = 1; i < pool.length; i++) {
    if (pool[i] === pool[i-1]) {
      for (let j = i+1; j < pool.length; j++) {
        if (pool[j] !== pool[i-1]) { [pool[i], pool[j]] = [pool[j], pool[i]]; break; }
      }
    }
  }
  return pool;
}

function shuffle(arr) {
  for (let i = arr.length-1; i > 0; i--) {
    const j = Math.floor(Math.random()*(i+1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// ── Video playback ────────────────────────────────────────────────────────
function playClip(key, callback) {
  const zoneClips = CLIPS[currentZone ? currentZone.id : ''];
  const clip = zoneClips && zoneClips[key];
  if (!clip) { if (callback) callback(); return; }  // no clip defined — skip through

  const { start, dur } = clip;
  const overlay = document.getElementById('video-overlay');
  const vid     = document.getElementById('vid');

  clipCallback = callback;
  clearTimeout(clipTimer);

  vid.currentTime = start;
  overlay.classList.remove('hidden');

  vid.play().catch(() => skipClip()); // if autoplay blocked, fall through

  clipTimer = setTimeout(() => skipClip(), dur * 1000);
}

function skipClip() {
  clearTimeout(clipTimer);
  const vid = document.getElementById('vid');
  if (vid) vid.pause();
  document.getElementById('video-overlay').classList.add('hidden');
  const cb = clipCallback;
  clipCallback = null;
  if (cb) cb();
}

// ── TTS ───────────────────────────────────────────────────────────────────
function speakWord(word) {
  if (!('speechSynthesis' in window)) return;
  speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(word);
  u.lang = 'en-US';
  u.rate = 0.85;
  u.pitch = 1.1;
  speechSynthesis.speak(u);
}

// ── Web Audio chimes ──────────────────────────────────────────────────────
let audioCtx = null;
function getACtx() {
  return audioCtx || (audioCtx = new (window.AudioContext || window.webkitAudioContext)());
}
function playTone(freq, t, dur) {
  const ctx = getACtx();
  const o = ctx.createOscillator(), g = ctx.createGain();
  o.connect(g); g.connect(ctx.destination);
  o.frequency.value = freq; o.type = 'sine';
  g.gain.setValueAtTime(0.25, ctx.currentTime + t);
  g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + t + dur);
  o.start(ctx.currentTime + t);
  o.stop(ctx.currentTime + t + dur + 0.05);
}
function playCorrectSound() { [523, 659, 784, 1047].forEach((f, i) => playTone(f, i*0.12, 0.18)); }
function playWrongSound()   { [440, 349].forEach((f, i) => playTone(f, i*0.2, 0.22)); }

// ── Confetti ──────────────────────────────────────────────────────────────
function spawnConfetti() {
  const canvas = document.getElementById('confetti-canvas');
  if (!canvas) return;
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  canvas.style.display = 'block';
  const ctx = canvas.getContext('2d');
  const pieces = Array.from({length:48}, () => ({
    x: Math.random() * canvas.width,
    y: Math.random() * canvas.height * 0.4 - canvas.height * 0.1,
    vx: (Math.random()-0.5)*4, vy: Math.random()*4+2,
    r: Math.random()*6+4,
    color: TILE_COLORS[Math.floor(Math.random()*TILE_COLORS.length)],
    angle: Math.random()*Math.PI*2,
    spin: (Math.random()-0.5)*0.2,
  }));
  let frame = 0;
  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    pieces.forEach(p => {
      ctx.save();
      ctx.translate(p.x, p.y); ctx.rotate(p.angle);
      ctx.fillStyle = p.color;
      ctx.fillRect(-p.r/2, -p.r/2, p.r, p.r*0.5);
      ctx.restore();
      p.x += p.vx; p.y += p.vy; p.vy += 0.15; p.angle += p.spin;
    });
    if (++frame < 60) requestAnimationFrame(draw);
    else canvas.style.display = 'none';
  }
  draw();
}
