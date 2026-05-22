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
  if (m) { stopBgm(); stopMood(); bgmWasOn = false; }
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
  tone({ freq: 84 + Math.random() * 26, type: "triangle", dur: 0.09, vol: 0.04, attack: 0.004 });
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
export function playPianoNote(freq) {
  // a triangle wave with a quick attack and a soft octave shimmer
  tone({ freq, type: "triangle", dur: 0.75, vol: 0.22, attack: 0.005 });
  tone({ freq: freq * 2, type: "sine", dur: 0.32, vol: 0.05, attack: 0.005 });
}
export function playPop() {
  tone({ freq: 880, type: "sine", dur: 0.12, vol: 0.18, glideTo: 440 });
}

// ============================================================
// Background music — a bright, bouncy little loop in C major
// ============================================================
const NOTE = {
  // bass
  E2: 82.41, F2: 87.31, G2: 98.00, A2: 110.00, "A#2": 116.54, B2: 123.47,
  // octave 3
  C3: 130.81, "C#3": 138.59, D3: 146.83, "D#3": 155.56, E3: 164.81,
  F3: 174.61, "F#3": 185.00, G3: 196.00, "G#3": 207.65, A3: 220.00,
  "A#3": 233.08, B3: 246.94,
  // octave 4
  C4: 261.63, "C#4": 277.18, D4: 293.66, "D#4": 311.13, E4: 329.63,
  F4: 349.23, "F#4": 369.99, G4: 392.00, "G#4": 415.30, A4: 440.00,
  "A#4": 466.16, B4: 493.88,
  // octave 5
  C5: 523.25, "C#5": 554.37, D5: 587.33, "D#5": 622.25, E5: 659.25,
  F5: 698.46, "F#5": 739.99, G5: 783.99,
};
// 4 bars × 8 eighth-notes; "." = rest (the note before it just rings on)
const BGM_TRACKS = {
  // The walk — bright, sprightly C major
  walk: {
    step: 0.19,
    melType: "triangle", basType: "sine",
    melVol: 0.17, basVol: 0.13,
    sparkle: true,
    melody: [
      "G4", "E4", "G4", "C5", ".",  "E4", "D4", ".",
      "F4", "A4", "G4", "E4", ".",  "C4", ".",  ".",
      "G4", "E4", "G4", "C5", ".",  "D5", "C5", ".",
      "E5", "D5", "C5", "G4", "A4", ".",  ".",  ".",
    ],
    bass: [
      "C3", ".", ".", "G3", "C3", ".", ".", ".",
      "F3", ".", ".", "C3", "F3", ".", ".", ".",
      "C3", ".", ".", "G3", "C3", ".", ".", ".",
      "G3", ".", ".", "D3", "G3", ".", ".", ".",
    ],
  },
  // The room — warm cheerful waltz-y feel in F major, slower & cozier
  home: {
    step: 0.225,
    melType: "triangle", basType: "sine",
    melVol: 0.15, basVol: 0.11,
    sparkle: false,
    melody: [
      "F4", ".",  "A4", "C5", ".",  "A4", "G4", ".",
      "A4", ".",  "F4", "D4", ".",  "F4", "E4", ".",
      "F4", ".",  "D4", "A#3",".",  "D4", "F4", ".",
      "G4", ".",  "E4", "C4", ".",  "E4", "G4", ".",
    ],
    bass: [
      "F2", ".", ".", ".", "C3", ".", ".", ".",
      "D2", ".", ".", ".", "A2", ".", ".", ".",
      "A#2",".", ".", ".", "F2", ".", ".", ".",
      "C3", ".", ".", ".", "F2", ".", ".", ".",
    ],
  },
};
let currentTrack = "walk";
let trackCfg = BGM_TRACKS.walk;

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

export function startBgm(track) {
  // bgmWasOn=true means mood music is currently parked the BGM — any
  // accidental restart (e.g. a click bubbling from a song-toggle button
  // up to the stage's onMouseDown) would stack BGM on top of the mood.
  if (!ctx || muted || bgmWasOn) return;
  // Switch tracks if a different one was requested.
  if (track && track !== currentTrack && BGM_TRACKS[track]) {
    if (bgmTimer) stopBgm();
    currentTrack = track;
  }
  trackCfg = BGM_TRACKS[currentTrack] || BGM_TRACKS.walk;
  if (bgmTimer) return;
  bgmOn = true;
  bgmStep = 0;
  bgmNextT = ctx.currentTime + 0.12;
  // a small look-ahead scheduler keeps the rhythm tight despite setTimeout jitter
  const schedule = () => {
    if (!bgmOn) return;
    while (bgmNextT < ctx.currentTime + 0.3) {
      const i = bgmStep % trackCfg.melody.length;
      const mel = NOTE[trackCfg.melody[i]];
      const bas = NOTE[trackCfg.bass[i]];
      if (mel) {
        bgmNote(mel, bgmNextT, 0.34, trackCfg.melVol, trackCfg.melType);
        if (trackCfg.sparkle) bgmNote(mel * 2, bgmNextT, 0.16, 0.035, "sine");
      }
      if (bas) bgmNote(bas, bgmNextT, 0.42, trackCfg.basVol, trackCfg.basType);
      bgmNextT += trackCfg.step;
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

// ============================================================
// Mood music — per-mood ambient loops for the Moodtune demo
// ============================================================
// Each entry is a tiny 16-step pattern looped at its own tempo, with a
// melody voice and a slower bass voice. Picks scale/timbre to match the
// mood word. "." holds the previous note's ring (rest).
const MOOD_CONFIG = {
  // 忧郁 — slow, low, sparse sine; A natural minor with a long ring
  mellow: {
    step: 0.42, vol: 0.18, mtype: "sine", btype: "sine", mdur: 2.4, bdur: 6,
    melody: ["A3", ".",  "C4", ".",  "E4", ".",  "D4", ".",
            "C4", ".",  "A3", ".",  "G3", ".",  ".",  "."],
    bass:   ["A2", ".",  ".",  ".",  ".",  ".",  ".",  ".",
            "F2", ".",  ".",  ".",  ".",  ".",  ".",  "."],
  },
  // 温柔 — warm triangle, C major arpeggios moving to F
  tender: {
    step: 0.30, vol: 0.17, mtype: "triangle", btype: "sine", mdur: 1.6, bdur: 5,
    melody: ["C4", "E4", "G4", "E4", "C4", ".",  "B3", ".",
            "F4", "A4", "C5", "A4", "F4", ".",  "E4", "."],
    bass:   ["C3", ".",  ".",  ".",  "C3", ".",  ".",  ".",
            "F3", ".",  ".",  ".",  "F3", ".",  ".",  "."],
  },
  // 怀旧 — F major, slightly detuned triangle for that worn-tape wobble
  nostalgic: {
    step: 0.34, vol: 0.16, mtype: "triangle", btype: "sine", mdur: 1.8, bdur: 5,
    detune: 9,
    melody: ["F4", ".",  "D4", ".",  "C4", ".",  "A3", ".",
            "A#3", ".", "D4", ".",  "F4", ".",  "C4", "."],
    bass:   ["F2", ".",  ".",  ".",  "F2", ".",  ".",  ".",
            "A#2", ".", ".",  ".",  "C3", ".",  ".",  "."],
  },
  // 躁动 — fast square pulses, syncopated E minor
  restless: {
    step: 0.17, vol: 0.12, mtype: "square", btype: "sine", mdur: 0.9, bdur: 2.5,
    melody: ["E4", ".",  "G4", "E4", ".",  "B4", "A4", "G4",
            "E4", ".",  "G4", "B4", ".",  "D5", "B4", "G4"],
    bass:   ["E2", ".",  ".",  ".",  "E2", ".",  ".",  ".",
            "A2", ".",  ".",  ".",  "B2", ".",  ".",  "."],
  },
  // 平静 — very slow sine drone in D dorian, long sustains
  calm: {
    step: 0.55, vol: 0.13, mtype: "sine", btype: "sine", mdur: 3.6, bdur: 9,
    melody: ["D4", ".",  ".",  ".",  "F4", ".",  ".",  ".",
            "A4", ".",  ".",  ".",  "D5", ".",  ".",  "."],
    bass:   ["D3", ".",  ".",  ".",  ".",  ".",  ".",  ".",
            ".",  ".",  ".",  ".",  ".",  ".",  ".",  "."],
  },
  // 雀跃 — bouncy fast triangle, G major arpeggios
  joyful: {
    step: 0.19, vol: 0.15, mtype: "triangle", btype: "sine", mdur: 0.9, bdur: 2.4,
    melody: ["G4", "B4", "D5", "B4", "G4", "B4", "D5", "G5",
            "E4", "G4", "B4", "G4", "D4", "G4", "B4", "D5"],
    bass:   ["G3", ".",  ".",  ".",  "G3", ".",  ".",  ".",
            "C3", ".",  ".",  ".",  "D3", ".",  ".",  "."],
  },
  // 深夜 — smoky walking bass + sparse high shimmer (B♭ minor)
  latenight: {
    step: 0.27, vol: 0.13, mtype: "sine", btype: "triangle", mdur: 2.0, bdur: 1.3,
    melody: ["F5", ".",  ".",  "D#5", ".", ".",  "F5", ".",
            ".",  "D5", ".",  ".",  "A#4", ".", ".",  "."],
    bass:   ["A#2","F3", "G#2","D#3","A#2","F3", "G#2","D#3",
            "A#2","F3", "G#2","D#3","A#2","F3", "G#2","D#3"],
  },
  // 治愈 — slow rising sine arpeggios, A major / D
  healing: {
    step: 0.32, vol: 0.15, mtype: "sine", btype: "sine", mdur: 1.6, bdur: 5,
    melody: ["A3", "C#4","E4", "A4", "E4", "C#4",".",  ".",
            "D4", "F#4","A4", "C#5","A4", "F#4",".",  "."],
    bass:   ["A2", ".",  ".",  ".",  ".",  ".",  ".",  ".",
            "D3", ".",  ".",  ".",  ".",  ".",  ".",  "."],
  },
};

let moodTimer = null;
let moodOn = false;
let moodStep = 0;
let moodNextT = 0;
let moodCfg = null;
let moodGain = null;     // dedicated bus so we can mute all in-flight notes at once
let bgmWasOn = false;    // pause the walk's BGM while a mood plays

// Lazy-create the mood bus the first time a mood note plays. All mood
// notes route through this gain so we can hard-cut any pre-scheduled
// tail notes when the user flips to a different song (otherwise the
// previous mood's ringing notes bleed onto the new one).
function ensureMoodGain() {
  if (moodGain || !ctx || !bgmGain) return;
  moodGain = ctx.createGain();
  moodGain.gain.value = 1;
  moodGain.connect(bgmGain);
}

function moodNote(freq, when, dur, vol, type, detune = 0) {
  if (!ctx || !freq) return;
  ensureMoodGain();
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  if (detune) osc.detune.value = detune;
  g.gain.setValueAtTime(0.0001, when);
  g.gain.linearRampToValueAtTime(vol, when + 0.04);
  g.gain.exponentialRampToValueAtTime(0.0001, when + dur);
  osc.connect(g);
  g.connect(moodGain || bgmGain);
  osc.start(when);
  osc.stop(when + dur + 0.05);
}

// Internal — tears down the scheduler and silences any tail notes that
// the Web Audio scheduler has already queued (up to ~1s into the future).
function teardownMood() {
  moodOn = false;
  moodCfg = null;
  clearTimeout(moodTimer);
  moodTimer = null;
  if (moodGain && ctx) {
    const t = ctx.currentTime;
    moodGain.gain.cancelScheduledValues(t);
    moodGain.gain.setValueAtTime(moodGain.gain.value, t);
    moodGain.gain.linearRampToValueAtTime(0, t + 0.05);
  }
}

export function startMood(moodKey) {
  if (!ctx || muted) return;
  const cfg = MOOD_CONFIG[moodKey];
  if (!cfg) return;
  if (moodOn && moodCfg === cfg) return; // same mood already running

  const wasInMood = moodOn;
  teardownMood();
  // Pause the walk's BGM only on the first entry into mood-land. While
  // hopping between moods (e.g. song #01 → #02 in different mood pools)
  // the BGM stays parked, so it never gets re-scheduled in the gap.
  if (!wasInMood && bgmOn) { bgmWasOn = true; stopBgm(); }

  moodCfg = cfg;
  moodOn = true;
  moodStep = 0;
  moodNextT = ctx.currentTime + 0.12;
  // Bring the mood bus back up.
  // • If we were just switching moods, the teardown queued a linear fade
  //   to 0 at t+0.05; we chain a linear ramp back to 1 by t+0.15 so the
  //   bus smoothly fades down and back up — the old mood's tail can't
  //   bleed over the new one.
  // • If this is a fresh entry (no prior mood), the bus may still be at
  //   0 from a previous session — snap it back to 1.
  ensureMoodGain();
  if (moodGain) {
    const t = ctx.currentTime;
    if (wasInMood) {
      moodGain.gain.linearRampToValueAtTime(1, t + 0.15);
    } else {
      moodGain.gain.cancelScheduledValues(t);
      moodGain.gain.setValueAtTime(1, t);
    }
  }
  const schedule = () => {
    if (!moodOn) return;
    while (moodNextT < ctx.currentTime + 0.35) {
      const i = moodStep % moodCfg.melody.length;
      const mel = NOTE[moodCfg.melody[i]];
      const bas = NOTE[moodCfg.bass[i]];
      if (mel) {
        moodNote(mel, moodNextT, moodCfg.step * moodCfg.mdur,
                 moodCfg.vol, moodCfg.mtype, moodCfg.detune || 0);
      }
      if (bas) {
        moodNote(bas, moodNextT, moodCfg.step * moodCfg.bdur,
                 moodCfg.vol * 0.7, moodCfg.btype);
      }
      moodNextT += moodCfg.step;
      moodStep++;
    }
    moodTimer = setTimeout(schedule, 60);
  };
  schedule();
}

export function stopMood() {
  if (!moodOn && !bgmWasOn) return;
  teardownMood();
  if (bgmWasOn) { bgmWasOn = false; startBgm(); }
}
