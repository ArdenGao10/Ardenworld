/* My World — sound
 *
 * Every sound here is synthesised in code with the Web Audio API —
 * no audio files, nothing extra to ship. Matches the hand-drawn world.
 *
 * Browsers won't let audio start before a user gesture, so `initAudio()`
 * must be called from inside a click/tap handler (the title screen does it).
 *
 *   graph:  oscillators ─┬─ sfxGain ─┐
 *                        └─ bgmGain ─┴─ master (mute) ─ destination
 */

let ctx = null;
let master = null;   // global volume / mute
let sfxGain = null;  // interaction sounds
let bgmGain = null;  // background ambience

let muted = localStorage.getItem("mw-muted") === "1";

// ----- setup -----
export function initAudio() {
  if (ctx) {
    if (ctx.state === "suspended") ctx.resume();
    return;
  }
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return; // very old browser — game stays silent, no crash
  ctx = new AC();

  master = ctx.createGain();
  master.gain.value = muted ? 0 : 0.55;
  master.connect(ctx.destination);

  sfxGain = ctx.createGain();
  sfxGain.gain.value = 0.9;
  sfxGain.connect(master);

  bgmGain = ctx.createGain();
  bgmGain.gain.value = 0.5;
  bgmGain.connect(master);
}

export function isMuted() { return muted; }

export function setMuted(m) {
  muted = m;
  localStorage.setItem("mw-muted", m ? "1" : "0");
  if (master && ctx) master.gain.setTargetAtTime(m ? 0 : 0.55, ctx.currentTime, 0.04);
  if (m) stopBgm();
  else startBgm();
}

// ----- a single shaped tone -----
function tone({ freq = 440, type = "sine", dur = 0.15, vol = 0.3,
                attack = 0.006, glideTo = null, delay = 0 }) {
  if (!ctx || muted) return;
  const t0 = ctx.currentTime + delay;
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  if (glideTo) osc.frequency.exponentialRampToValueAtTime(glideTo, t0 + dur);
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.linearRampToValueAtTime(vol, t0 + attack);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  osc.connect(g);
  g.connect(sfxGain);
  osc.start(t0);
  osc.stop(t0 + dur + 0.03);
}

// ----- a burst of filtered noise (water, splashes) -----
function noiseBurst({ dur = 0.3, vol = 0.3, lp = 1400, lpEnd = 400 }) {
  if (!ctx || muted) return;
  const t0 = ctx.currentTime;
  const buf = ctx.createBuffer(1, Math.ceil(ctx.sampleRate * dur), ctx.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  const src = ctx.createBufferSource();
  src.buffer = buf;
  const filter = ctx.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.setValueAtTime(lp, t0);
  filter.frequency.exponentialRampToValueAtTime(lpEnd, t0 + dur);
  const g = ctx.createGain();
  g.gain.setValueAtTime(vol, t0);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  src.connect(filter);
  filter.connect(g);
  g.connect(sfxGain);
  src.start(t0);
  src.stop(t0 + dur);
}

// ============================================================
// Interaction sound effects
// ============================================================
export function playStep() {
  // soft, low footfall — pitch wanders a little so it never feels looped
  tone({ freq: 84 + Math.random() * 26, type: "triangle", dur: 0.1, vol: 0.075, attack: 0.004 });
}
export function playJump() {
  tone({ freq: 300, type: "sine", dur: 0.2, vol: 0.22, glideTo: 660 });
}
export function playSplash() {
  noiseBurst({ dur: 0.34, vol: 0.32, lp: 1700, lpEnd: 320 });
  tone({ freq: 520, type: "sine", dur: 0.18, vol: 0.1, glideTo: 200, delay: 0.02 });
}
export function playStar() {
  tone({ freq: 988, type: "sine", dur: 0.16, vol: 0.2 });
  tone({ freq: 1319, type: "sine", dur: 0.26, vol: 0.18, delay: 0.09 });
}
export function playClick() {
  tone({ freq: 620, type: "triangle", dur: 0.07, vol: 0.16 });
}
export function playOpen() {
  tone({ freq: 392, type: "sine", dur: 0.12, vol: 0.16 });
  tone({ freq: 523, type: "sine", dur: 0.18, vol: 0.16, delay: 0.08 });
}
export function playWin() {
  [523.25, 659.25, 783.99, 1046.5].forEach((f, i) =>
    tone({ freq: f, type: "sine", dur: 0.5, vol: 0.2, delay: i * 0.13 }));
}

// ============================================================
// Background music — a bright, bouncy little loop in C major
// ============================================================
const NOTE = {
  C3: 130.81, D3: 146.83, E3: 164.81, F3: 174.61, G3: 196.00, A3: 220.00,
  C4: 261.63, D4: 293.66, E4: 329.63, F4: 349.23, G4: 392.00,
  A4: 440.00, B4: 493.88, C5: 523.25, D5: 587.33, E5: 659.25, G5: 783.99,
};
// 4 bars × 8 eighth-notes; "." = rest (the note before it just rings on)
const MELODY = [
  "G4", "E4", "G4", "C5", ".",  "E4", "D4", ".",
  "F4", "A4", "G4", "E4", ".",  "C4", ".",  ".",
  "G4", "E4", "G4", "C5", ".",  "D5", "C5", ".",
  "E5", "D5", "C5", "G4", "A4", ".",  ".",  ".",
];
const BASS = [
  "C3", ".", ".", "G3", "C3", ".", ".", ".",
  "F3", ".", ".", "C3", "F3", ".", ".", ".",
  "C3", ".", ".", "G3", "C3", ".", ".", ".",
  "G3", ".", ".", "D3", "G3", ".", ".", ".",
];
const STEP = 0.19; // seconds per eighth-note — ~158 BPM, sprightly

let bgmTimer = null;
let bgmOn = false;
let bgmStep = 0;
let bgmNextT = 0;

function bgmNote(freq, when, dur, vol, type) {
  if (!ctx || !freq) return;
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  g.gain.setValueAtTime(0.0001, when);
  g.gain.linearRampToValueAtTime(vol, when + 0.012);
  g.gain.exponentialRampToValueAtTime(0.0001, when + dur);
  osc.connect(g);
  g.connect(bgmGain);
  osc.start(when);
  osc.stop(when + dur + 0.04);
}

export function startBgm() {
  if (!ctx || muted || bgmTimer) return;
  bgmOn = true;
  bgmStep = 0;
  bgmNextT = ctx.currentTime + 0.12;
  // a small look-ahead scheduler keeps the rhythm tight despite setTimeout jitter
  const schedule = () => {
    if (!bgmOn) return;
    while (bgmNextT < ctx.currentTime + 0.3) {
      const i = bgmStep % MELODY.length;
      const mel = NOTE[MELODY[i]];
      const bas = NOTE[BASS[i]];
      if (mel) {
        bgmNote(mel, bgmNextT, 0.34, 0.17, "triangle");
        bgmNote(mel * 2, bgmNextT, 0.16, 0.035, "sine"); // a touch of sparkle
      }
      if (bas) bgmNote(bas, bgmNextT, 0.42, 0.13, "sine");
      bgmNextT += STEP;
      bgmStep++;
    }
    bgmTimer = setTimeout(schedule, 60);
  };
  schedule();
}

export function stopBgm() {
  bgmOn = false;
  clearTimeout(bgmTimer);
  bgmTimer = null;
}
