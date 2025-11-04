// Hangman: GitHub Pages variant
// Expects assets at /assets/bg.mp3, /assets/win.mp3, /assets/lose.mp3, /assets/hangman.png

const MAX_WRONG = 6;
const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

// Elements
const canvas = document.getElementById('hangmanCanvas');
const ctx = canvas.getContext('2d');
const hangmanImage = document.getElementById('hangmanImage');
const wordContainer = document.getElementById('wordContainer');
const wrongLettersSpan = document.getElementById('wrongLetters');
const keyboard = document.getElementById('keyboard');
const statusText = document.getElementById('statusText');
const newGameBtn = document.getElementById('newGameBtn');
const hintBtn = document.getElementById('hintBtn');
const resetBtn = document.getElementById('resetBtn');
const toggleMusicBtn = document.getElementById('toggleMusicBtn');

// Audio
const bgAudio = new Audio('assets/bg.mp3'); bgAudio.loop = true; bgAudio.volume = 0.45;
const winAudio = new Audio('assets/win.mp3'); winAudio.volume = 0.95;
const loseAudio = new Audio('assets/lose.mp3'); loseAudio.volume = 0.95;

// Game state
let words = [];
let answer = '';
let revealed = [];
let wrong = [];

// Initialize
function init(){
  buildKeyboard();
  fetchWordsList();
  window.addEventListener('keydown', e=>{ if (/^[a-z]$/i.test(e.key)) handleGuess(e.key.toLowerCase()); });
  newGameBtn.addEventListener('click', startNewGame);
  resetBtn.addEventListener('click', ()=>{ stopAllAudio(); startNewGame(); });
  hintBtn.addEventListener('click', revealHint);
  toggleMusicBtn.addEventListener('click', ()=>{ if (bgAudio.paused) bgAudio.play().catch(()=>{}); else bgAudio.pause(); });
  window.addEventListener('resize', resizeCanvas);
  resizeCanvas();
}

function fetchWordsList(){
  fetch('words.txt').then(r=>{
    if (!r.ok) throw new Error('no words.txt');
    return r.text();
  }).then(txt=>{
    const list = txt.split(/\r?\n/).map(s=>s.trim()).filter(Boolean);
    if (list.length) words = list;
  }).catch(()=>{
    // fallback list
    words = ["javascript","hangman","github","developer","canvas","audio","keyboard","puzzle","challenge","network"];
  }).finally(startNewGame);
}

function pickWord(){
  const candidate = words[Math.floor(Math.random()*words.length)];
  return candidate.toLowerCase().replace(/[^a-z\- ]/g,'');
}

function startNewGame(){
  answer = pickWord();
  revealed = Array.from(answer).map(ch => (ch === ' ' || ch === '-') ? ch : null);
  wrong = [];
  updateDisplay();
  drawHangman();
  enableAllKeys();
  statusText.textContent = 'New game — good luck!';
  if (bgAudio.src) bgAudio.play().catch(()=>{});
}

function buildKeyboard(){
  keyboard.innerHTML = '';
  alphabet.forEach(letter=>{
    const btn = document.createElement('div');
    btn.className = 'key';
    btn.textContent = letter;
    btn.dataset.letter = letter;
    btn.addEventListener('click', ()=> handleGuess(letter.toLowerCase()));
    keyboard.appendChild(btn);
  });
}

function handleGuess(letter){
  if (!letter) return; letter = letter.toLowerCase();
  if (wrong.includes(letter) || revealed.includes(letter)) return;
  if (answer.includes(letter)){
    for (let i=0;i<answer.length;i++) if (answer[i] === letter) revealed[i] = letter;
  } else {
    wrong.push(letter);
  }
  markKey(letter);
  drawHangman();
  updateDisplay();
}

function markKey(letter){
  const key = Array.from(keyboard.children).find(k=>k.dataset.letter.toLowerCase()===letter);
  if (key) key.classList.add('disabled');
}

function updateDisplay(){
  wordContainer.innerHTML = '';
  revealed.forEach(ch=>{
    const el = document.createElement('div'); el.className = 'letter'; el.textContent = ch ? ch.toUpperCase() : '';
    wordContainer.appendChild(el);
  });
  wrongLettersSpan.textContent = wrong.length ? wrong.join(', ').toUpperCase() : '—';

  if (!revealed.includes(null)){
    statusText.textContent = 'You won!';
    playWin(); disableAllKeys();
  } else if (wrong.length >= MAX_WRONG){
    statusText.textContent = 'You lost — answer: ' + answer.toUpperCase();
    revealAll(); playLose(); disableAllKeys();
  }
}

function revealAll(){
  for (let i=0;i<answer.length;i++) if (!revealed[i]) revealed[i] = answer[i];
  updateDisplay();
}

function enableAllKeys(){ Array.from(keyboard.children).forEach(k=>k.classList.remove('disabled')); }
function disableAllKeys(){ Array.from(keyboard.children).forEach(k=>k.classList.add('disabled')); }

function revealHint(){
  const unrevealed = revealed.map((v,i)=> v===null ? i : -1).filter(i=>i>=0);
  if (!unrevealed.length) return;
  const idx = unrevealed[Math.floor(Math.random()*unrevealed.length)];
  revealed[idx] = answer[idx];
  // penalty: add a wrong guess that's not in answer
  for (let ch of 'abcdefghijklmnopqrstuvwxyz'){
    if (!answer.includes(ch) && !wrong.includes(ch)){
      wrong.push(ch); break;
    }
  }
  drawHangman(); updateDisplay();
}

function stopAllAudio(){ bgAudio.pause(); bgAudio.currentTime = 0; winAudio.pause(); winAudio.currentTime = 0; loseAudio.pause(); loseAudio.currentTime = 0; }
function playWin(){ stopAllAudio(); if (winAudio.src) winAudio.play().catch(()=>{}); else if (bgAudio.src) bgAudio.play().catch(()=>{}); }
function playLose(){ stopAllAudio(); if (loseAudio.src) loseAudio.play().catch(()=>{}); else if (bgAudio.src) bgAudio.play().catch(()=>{}); }

// Canvas drawing
function drawGallows(){
  const W = canvas.width, H = canvas.height; ctx.clearRect(0,0,W,H);
  ctx.lineWidth = 6; ctx.strokeStyle = '#bfd7ff'; ctx.lineCap = 'round';
  // base
  ctx.beginPath(); ctx.moveTo(60,H-40); ctx.lineTo(220,H-40); ctx.stroke();
  // pole
  ctx.beginPath(); ctx.moveTo(140,H-40); ctx.lineTo(140,40); ctx.lineTo(360,40); ctx.lineTo(360,90); ctx.stroke();
}

function drawHangman(){
  drawGallows();
  const stages = wrong.length;
  ctx.lineWidth = 6; ctx.strokeStyle = '#e1f0ff';
  if (stages >= 1){ ctx.beginPath(); ctx.arc(360,120,30,0,Math.PI*2); ctx.stroke(); }
  if (stages >= 2){ ctx.beginPath(); ctx.moveTo(360,150); ctx.lineTo(360,240); ctx.stroke(); }
  if (stages >= 3){ ctx.beginPath(); ctx.moveTo(360,170); ctx.lineTo(320,200); ctx.stroke(); }
  if (stages >= 4){ ctx.beginPath(); ctx.moveTo(360,170); ctx.lineTo(400,200); ctx.stroke(); }
  if (stages >= 5){ ctx.beginPath(); ctx.moveTo(360,240); ctx.lineTo(330,300); ctx.stroke(); }
  if (stages >= 6){ ctx.beginPath(); ctx.moveTo(360,240); ctx.lineTo(390,300); ctx.stroke(); ctx.font='20px serif'; ctx.fillStyle='#ffb3b3'; ctx.fillText('x',350,120); ctx.fillText('x',368,120); }
}

function resizeCanvas(){
  const ratio = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();
  canvas.width = Math.max(600, rect.width*ratio); canvas.height = Math.max(260, 160*ratio);
  drawHangman();
}

// Start
init();
