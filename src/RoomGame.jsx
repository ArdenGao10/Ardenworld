/* My World — 房间版 · A Room You Can Walk In  (room mode)
 *
 * A wide cozy room. Walk left/right, click an object to interact.
 *
 * Stations (left → right):
 *   出门去野外攀岩 (placeholder — under construction)
 *   攀岩墙 (inline climbing mini-game; back-facing climber sprite)
 *   床    (lie down)
 *   鱼缸  (feed the fish)
 *   书桌  (Focus modal)
 *   植物
 *   书架  (random book quote)
 *   涂鸦墙 (room-only toys)
 *   唱片机 (Moodtune modal)
 *   信鸽笼 (write a letter — pigeon flies out the window)
 *
 * `onSwitch` returns to the walk version.
 */

import { useState, useEffect, useRef } from 'react';
import { WORKS, WALK_SPEED, JUMP_VEL, GRAVITY, CHAR_BASE_W, DOODLES_ROOM } from './world/data.js';
import { Char } from './world/Char.jsx';
import WorkModal from './components/WorkModal.jsx';
import ShowcaseFrame from './components/ShowcaseFrame.jsx';
import DoodleWall from './components/DoodleWall.jsx';
import Overlay from './components/Overlay.jsx';
import ContactCard from './components/ContactCard.jsx';
import Gallery from './components/Gallery.jsx';
import { SpeakerIcon } from './components/Icons.jsx';
import {
  initAudio, startBgm, playStep, playOpen, playClick, playJump, playWin,
  isMuted, setMuted,
} from './world/sound.js';

const ROOM_W = 2480;
const FLOOR_H = 170;
const CHAR_FOOT = 18;
const INTERACT_RADIUS = 110;

// Two new works tuck into spots that already had air: the café game is a
// little Switch resting on the foot of the bed (so the bed gives you both
// "lie down" and "play"), and the spark jar sits on a small cabinet under
// the window. Focus is the alarm clock on the desk. Width stays original.
const POS = {
  outdoor:  140,
  climb:    340,
  bed:      640,
  cafe:     775,
  fishtank: 940,
  desk:     1180,
  spark:    1340,
  plant:    1440,
  shelf:    1540,
  doodle:   1760,
  record:   1980,
  about:    2150,
  mail:     2360,
};
const PROMPT_LABEL = {
  outdoor:  "去野外 →",
  climb:    "上墙试试",
  bed:      "躺一下",
  fishtank: "喂喂鱼",
  focus:    "坐下专注",
  shelf:    "翻一本",
  doodle:   "看看实验",
  mood:     "放一张唱片",
  cafe:     "玩一会儿",
  spark:    "摇一摇",
  about:    "认识一下",
  mail:     "写一封信",
};

// ⬇⬇⬇  自我介绍 — 随便改成你自己的  ⬇⬇⬇
const ABOUT_ME = {
  name: "我是 Arden",
  lines: [
    "一个喜欢自己做小东西的人 —",
    "网页、小游戏、会动的小玩意儿。",
    "",
    "这间屋子里的家具,差不多都是",
    "我做过的、或还想做的东西。",
    "",
    "想合作、想聊天 —",
    "墙边笼子里有只鸽子,它会送信 :)",
  ],
};

// Window — placed between desk and plant; used as the pigeon's exit point
const WINDOW_W = 220;
const WINDOW_H = 150;
const WINDOW_LEFT = (POS.desk + POS.plant) / 2 - 110;
const WINDOW_BOTTOM_FROM_FLOOR = 170;
const WINDOW_CX = WINDOW_LEFT + WINDOW_W / 2;
const WINDOW_CY_FROM_FLOOR = WINDOW_BOTTOM_FROM_FLOOR + WINDOW_H / 2;

const CLIMB_REACH = 96;
const CLIMB_HOLDS = [
  { id: "s",      x:  60, y:  30, c: "#9bb18e", shape: "triangle", size: 18, ground: true },
  { id: "a",      x: 168, y:  46, c: "#efb24a", shape: "oval",     size: 20, ground: true },
  { id: "b",      x:  88, y:  98, c: "#7f9a76", shape: "pentagon", size: 24 },
  { id: "c",      x: 188, y: 120, c: "#7f9a76", shape: "pentagon", size: 22 },
  { id: "d",      x:  46, y: 154, c: "#efb24a", shape: "oval",     size: 20 },
  { id: "e",      x: 130, y: 180, c: "#9a6fb0", shape: "shield",   size: 22 },
  { id: "f",      x: 196, y: 208, c: "#7f9a76", shape: "pentagon", size: 18 },
  { id: "g",      x:  74, y: 226, c: "#9a6fb0", shape: "shield",   size: 22 },
  { id: "h",      x: 170, y: 254, c: "#7f9a76", shape: "pentagon", size: 22 },
  { id: "i",      x:  64, y: 286, c: "#efb24a", shape: "oval",     size: 20 },
  { id: "j",      x: 196, y: 310, c: "#7f9a76", shape: "pentagon", size: 18 },
  { id: "summit", x: 130, y: 340, c: "#c97a83", shape: "maroon",   size: 24, summit: true },
];

const BOOK_QUOTES = [
  { q: "「冬天里,被子是最好的房子。」",       from: "—某本随笔" },
  { q: "「我在路上看到一只猫,它没看我。」",   from: "—某本散文集" },
  { q: "「重要的事情,慢慢说。」",             from: "—某本小书" },
  { q: "「光从窗户进来,落在桌上,我就什么都没做。」", from: "—某本日记" },
  { q: "「茶凉了,故事还在。」",               from: "—某本短篇集" },
  { q: "「人最难的,是允许自己慢一点。」",     from: "—某本随感" },
  { q: "「下雨的下午,什么也不做也好。」",     from: "—某本旅行手账" },
  { q: "「家不是地方,是肯让你坐下来的灯光。」", from: "—某本散文" },
];

export default function RoomGame({ onSwitch }) {
  const [viewport, setViewport] = useState({ w: window.innerWidth, h: window.innerHeight });
  const [charX, setCharX] = useState(POS.desk);
  const [charY, setCharY] = useState(0);
  const [vy, setVy] = useState(0);
  const [facing, setFacing] = useState(-1);
  const [walking, setWalking] = useState(false);
  const [target, setTarget] = useState(null);
  const [workModal, setWorkModal] = useState(null);
  const [showcase, setShowcase] = useState(null);
  const [showDoodle, setShowDoodle] = useState(false);
  const [bookQuote, setBookQuote] = useState(null);
  const [showContact, setShowContact] = useState(false);
  const [showOutdoor, setShowOutdoor] = useState(false);
  const [showGallery, setShowGallery] = useState(false);
  const [showAbout, setShowAbout] = useState(false);
  const [fishFeed, setFishFeed] = useState(0);
  const [muted, setMutedState] = useState(isMuted());
  const [showHint, setShowHint] = useState(true);
  const [thought, setThought] = useState(null);
  // pigeon — incremented when a letter is sent; the cage hides during flight
  const [pigeonFlying, setPigeonFlying] = useState(0);
  const [cageEmpty, setCageEmpty] = useState(false);

  const [climbHold, setClimbHold] = useState(null);
  const [climbSummited, setClimbSummited] = useState(false);
  const [lying, setLying] = useState(false);
  const [rising, setRising] = useState(false); // brief wake-up fade-out

  const stageRef = useRef(null);
  const stateRef = useRef({ x: POS.desk, y: 0, vy: 0 });
  stateRef.current.x = charX;
  stateRef.current.y = charY;
  stateRef.current.vy = vy;
  const lastT = useRef(performance.now());
  const stepAcc = useRef(0);
  const keys = useRef({ left: false, right: false, jumpRequested: false });
  const thoughtTimer = useRef(null);
  const pigeonReturnTimer = useRef(null);
  // Timestamp of the last lie-down / get-up. A tap (and the synthetic mouse
  // event a phone fires right after it) within this window is ignored, so the
  // same gesture can't toggle sleep on and straight back off.
  const lieToggleAt = useRef(0);
  const riseTimer = useRef(null);

  useEffect(() => {
    const r = () => setViewport({ w: window.innerWidth, h: window.innerHeight });
    window.addEventListener("resize", r);
    return () => window.removeEventListener("resize", r);
  }, []);
  useEffect(() => () => {
    clearTimeout(thoughtTimer.current);
    clearTimeout(pigeonReturnTimer.current);
    clearTimeout(riseTimer.current);
  }, []);
  useEffect(() => { startBgm("home"); }, []);

  const isMobile = viewport.w < 720 || matchMedia("(pointer:coarse)").matches;
  const charBottom = FLOOR_H - CHAR_FOOT;
  const blocked = !!(workModal || showDoodle || showcase || bookQuote
                  || showContact || showOutdoor || showGallery || showAbout);

  const cameraTarget = climbHold ? POS.climb : charX;
  const camX = Math.max(0, Math.min(ROOM_W - viewport.w, cameraTarget - viewport.w * 0.5));

  const onStageDown = (e) => {
    initAudio(); startBgm("home");
    if (blocked) return;

    // Swallow the tap that just toggled sleep (and the phone's synthetic
    // mouse event that follows it) so it can't immediately toggle back.
    if (Date.now() - lieToggleAt.current < 450) return;
    if (lying) { getUp(); return; }

    if (e.target.closest('.mw-skip, .climb-hold, .room-fx, .mw-prompt-tap')) return;

    const rect = stageRef.current.getBoundingClientRect();
    const localX = (e.clientX ?? e.touches?.[0]?.clientX) - rect.left;
    const localY = (e.clientY ?? e.touches?.[0]?.clientY) - rect.top;
    const worldX = localX + camX;
    setShowHint(false);

    if (climbHold) {
      if (localY > viewport.h - FLOOR_H - 40) exitClimb();
      return;
    }

    // Desktop: tapping near an object walks the character to it and opens it.
    // Mobile: tapping only ever walks — interaction happens by tapping the
    // black prompt bubble. This keeps you from getting trapped beside an
    // object that re-opens its modal every time you tap to walk past it.
    if (!isMobile) {
      const hits = [
        { x: POS.outdoor,  approach: POS.outdoor + 40,  then: openOutdoor },
        { x: POS.climb,    approach: POS.climb + 90,    then: enterClimb },
        { x: POS.bed,      approach: POS.bed - 30,      then: lieDown },
        { x: POS.cafe,     approach: POS.cafe,          then: () => openWork("cafe") },
        { x: POS.fishtank, approach: POS.fishtank,      then: feedFish },
        { x: POS.desk,     approach: POS.desk + 93,     then: () => openWork("focus") },
        { x: POS.spark,    approach: POS.spark,         then: () => openWork("spark") },
        { x: POS.shelf,    approach: POS.shelf,         then: openBook },
        { x: POS.doodle,   approach: POS.doodle,        then: openDoodle },
        { x: POS.record,   approach: POS.record - 70,   then: () => openWork("mood") },
        { x: POS.about,    approach: POS.about - 40,    then: openAbout },
        { x: POS.mail,     approach: POS.mail - 50,     then: openContact },
      ];
      for (const h of hits) {
        if (Math.abs(worldX - h.x) < 110) {
          setTarget({ x: clamp(h.approach, 80, ROOM_W - 80), then: h.then });
          return;
        }
      }
    }
    setTarget({ x: clamp(worldX, 80, ROOM_W - 80), then: null });
  };

  function openWork(workId) { playOpen(); setWorkModal({ workId }); }
  function openDoodle()     { playOpen(); setShowDoodle(true); }
  function openContact()    { playOpen(); setShowContact(true); }
  function openOutdoor()    { playOpen(); setShowOutdoor(true); }
  function openAbout()      { playOpen(); setShowAbout(true); }
  function openBook() {
    playOpen();
    setBookQuote(BOOK_QUOTES[Math.floor(Math.random() * BOOK_QUOTES.length)]);
  }
  function lieDown() {
    if (lying) return;
    playClick();
    setLying(true);
    setRising(false);
    lieToggleAt.current = Date.now();
  }
  function getUp() {
    if (!lying) return;
    playClick();
    setLying(false);
    lieToggleAt.current = Date.now();
    // keep the dim overlay around briefly so it can fade back out
    setRising(true);
    clearTimeout(riseTimer.current);
    riseTimer.current = setTimeout(() => setRising(false), 460);
  }
  function feedFish() { playClick(); setFishFeed(n => n + 1); }
  function launchPigeon() {
    // pigeon leaves the cage, flies out the window
    setCageEmpty(true);
    setPigeonFlying(p => p + 1);
    clearTimeout(pigeonReturnTimer.current);
    // returns ~3.4s later
    pigeonReturnTimer.current = setTimeout(() => setCageEmpty(false), 3400);
  }

  function enterClimb() {
    const startHolds = CLIMB_HOLDS.filter(h => h.ground);
    const charWorldX = stateRef.current.x;
    let best = startHolds[0], bestD = Infinity;
    for (const h of startHolds) {
      const wx = POS.climb - 100 + h.x;
      const d = Math.abs(wx - charWorldX);
      if (d < bestD) { bestD = d; best = h; }
    }
    playJump();
    setClimbHold(best.id);
    setClimbSummited(false);
  }
  function moveClimb(holdId) {
    const cur = CLIMB_HOLDS.find(h => h.id === climbHold);
    const next = CLIMB_HOLDS.find(h => h.id === holdId);
    if (!cur || !next) return;
    const d = Math.hypot(cur.x - next.x, cur.y - next.y);
    if (d > CLIMB_REACH) { playClick(); exitClimb(); return; }
    playJump();
    setClimbHold(holdId);
    if (next.summit) { setClimbSummited(true); playWin(); }
  }
  function exitClimb() { setClimbHold(null); setClimbSummited(false); }

  // Single entry point for interacting with whatever the character is near.
  function interactWith(key) {
    if (key === "focus") openWork("focus");
    else if (key === "mood") openWork("mood");
    else if (key === "cafe") openWork("cafe");
    else if (key === "spark") openWork("spark");
    else if (key === "doodle") openDoodle();
    else if (key === "shelf") openBook();
    else if (key === "fishtank") feedFish();
    else if (key === "climb") enterClimb();
    else if (key === "bed") lieDown();
    else if (key === "mail") openContact();
    else if (key === "about") openAbout();
    else if (key === "outdoor") openOutdoor();
  }

  useEffect(() => {
    const down = (e) => {
      if (blocked) return;
      const k = e.key;
      if (lying && (k === " " || k === "Enter" || k === "Escape")) {
        getUp(); e.preventDefault(); return;
      }
      if (climbHold && (k === "Escape" || k === "s" || k === "S" || k === "ArrowDown")) {
        exitClimb(); e.preventDefault(); return;
      }
      if (k === "ArrowLeft" || k === "a" || k === "A") {
        if (!climbHold && !lying) { keys.current.left = true; e.preventDefault(); }
      } else if (k === "ArrowRight" || k === "d" || k === "D") {
        if (!climbHold && !lying) { keys.current.right = true; e.preventDefault(); }
      } else if (k === "ArrowUp" || k === "w" || k === "W") {
        if (!climbHold && !lying) { keys.current.jumpRequested = true; e.preventDefault(); }
      } else if (k === "e" || k === "E" || k === " " || k === "Enter") {
        if (!climbHold && !lying) {
          const n = findNearest(stateRef.current.x);
          if (n) interactWith(n);
        }
      }
    };
    const up = (e) => {
      const k = e.key;
      if (k === "ArrowLeft" || k === "a" || k === "A") keys.current.left = false;
      if (k === "ArrowRight" || k === "d" || k === "D") keys.current.right = false;
    };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
    };
  }, [blocked, climbHold, lying]);

  useEffect(() => {
    let raf;
    const loop = (t) => {
      const dt = Math.min(0.04, (t - lastT.current) / 1000);
      lastT.current = t;

      let x = stateRef.current.x;
      let y = stateRef.current.y;
      let v = stateRef.current.vy;
      let isWalking = false;
      let curFacing = facing;
      const paused = blocked || climbHold || lying;
      const keyDir = (keys.current.right ? 1 : 0) - (keys.current.left ? 1 : 0);

      if (keyDir !== 0 && !paused) {
        curFacing = keyDir;
        x += WALK_SPEED * dt * keyDir;
        isWalking = true;
        if (target) setTarget(null);
      } else if (target && !paused) {
        const dx = target.x - x;
        if (Math.abs(dx) < 6) {
          const then = target.then;
          setTarget(null);
          if (then) then();
        } else {
          const dir = Math.sign(dx);
          curFacing = dir;
          x += WALK_SPEED * dt * dir;
          isWalking = true;
        }
      }

      x = Math.max(80, Math.min(ROOM_W - 80, x));

      // jump + gravity — a quick hop with ArrowUp / W (or the mobile button)
      if (keys.current.jumpRequested && y === 0 && !paused) {
        v = JUMP_VEL;
        playJump();
      }
      keys.current.jumpRequested = false;
      if (y > 0 || v !== 0) {
        y += v * dt;
        v -= GRAVITY * dt;
        if (y <= 0) { y = 0; v = 0; }
      }

      if (isWalking && y < 6) {
        stepAcc.current += dt;
        if (stepAcc.current >= 0.3) { stepAcc.current = 0; playStep(); }
      } else stepAcc.current = 0.3;

      stateRef.current.x = x;
      stateRef.current.y = y;
      stateRef.current.vy = v;
      setCharX(x);
      setCharY(y);
      setVy(v);
      setWalking(isWalking);
      setFacing(curFacing);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [target, blocked, climbHold, lying, facing]);

  const nearest = (!blocked && !climbHold && !lying) ? findNearest(charX) : null;

  // While a station's modal is open we replace the standing character with
  // a posed sprite (sitting at the desk, swaying at the record player).
  const sitting = !!workModal && workModal.workId === "focus"
                  && Math.abs(charX - POS.desk) < 140;
  const singing = !!workModal && workModal.workId === "mood"
                  && Math.abs(charX - POS.record) < 140;
  const curHold = climbHold ? CLIMB_HOLDS.find(h => h.id === climbHold) : null;
  const climbWorldOriginX = POS.climb - 100;
  const climbBottomY = FLOOR_H - 6;
  const climbCharX = curHold ? climbWorldOriginX + curHold.x : 0;
  const climbCharBottom = curHold ? climbBottomY + curHold.y - 18 : 0;

  // pigeon flight delta (world coords) — cage perch → window center
  const pigeonStartX = POS.mail - 16;
  const pigeonStartBottom = FLOOR_H + 130;
  const pigeonDX = WINDOW_CX - pigeonStartX;       // negative (leftward)
  const pigeonDY = (FLOOR_H + WINDOW_CY_FROM_FLOOR) - pigeonStartBottom; // upward

  return (
    <div className="mw-stage room-stage" ref={stageRef}
         onMouseDown={onStageDown}
         onContextMenu={(e) => e.preventDefault()}
         onTouchStart={(e) => {
           if (e.target.closest('button, .climb-hold, .mw-prompt-tap')) return;
           e.preventDefault(); onStageDown(e);
         }}
         style={{
           background: "linear-gradient(180deg, #f0e2c6 0%, #ead7b3 65%, #e3cca0 100%)",
           cursor: "pointer",
         }}
    >
      <div className="mw-world" style={{
        width: ROOM_W, height: "100%",
        // Integer-snap the camera translate. Fractional translateX on a
        // composited layer makes WebKit show hairline white seams between
        // adjacent decor (the same artefact the walk had before).
        transform: `translateX(${-Math.round(camX)}px)`,
        pointerEvents: "none",
      }}>
        {/* wall background */}
        <div style={{
          position: "absolute", left: 0, top: 0, width: ROOM_W,
          height: `calc(100% - ${FLOOR_H}px)`,
          background: "linear-gradient(180deg, #f0e2c6 0%, #ead7b3 80%, #e3cca0 100%)",
        }}>
          {Array.from({ length: Math.ceil(ROOM_W / 38) }).map((_, i) => (
            <div key={i} style={{
              position: "absolute", top: 0, bottom: 0, left: i * 38, width: 1,
              background: "rgba(180,150,100,.08)",
            }}/>
          ))}
          <div style={{
            position: "absolute", left: 0, right: 0, bottom: 0, height: 8,
            background: "#b89870",
            borderTop: "2px solid #1b1b1b", borderBottom: "2px solid #1b1b1b",
            filter: "url(#wobble)",
          }}/>
        </div>

        {/* === wooden floor === */}
        <div style={{
          position: "absolute", left: 0, bottom: 0, width: ROOM_W, height: FLOOR_H,
          background: "linear-gradient(180deg, #c79864 0%, #a77a4a 100%)",
          borderTop: "2.5px solid #1b1b1b", overflow: "hidden",
        }}>
          {Array.from({ length: Math.ceil(ROOM_W / 130) + 2 }).map((_, i) => (
            <div key={i} style={{
              position: "absolute", left: i * 130, top: 0, bottom: 0, width: 2,
              background: "rgba(60,30,10,.35)",
            }}/>
          ))}
          {Array.from({ length: Math.ceil(ROOM_W / 130) + 2 }).map((_, i) => (
            <div key={`b${i}`} style={{
              position: "absolute", left: i * 130 + 65, top: FLOOR_H * 0.5, bottom: 0, width: 2,
              background: "rgba(60,30,10,.3)",
            }}/>
          ))}
          <div style={{
            position: "absolute", left: 0, right: 0, top: FLOOR_H * 0.5, height: 1.5,
            background: "rgba(60,30,10,.25)",
          }}/>
          <div style={{
            position: "absolute", left: POS.desk - 80, bottom: 14, width: 380, height: 70,
            background: "repeating-linear-gradient(90deg, #c97a83 0 18px, #fef3a3 18px 30px, #cfe0c6 30px 48px, #fef3a3 48px 60px)",
            border: "2.5px solid #1b1b1b", filter: "url(#wobble)",
            boxShadow: "2px 3px 0 rgba(0,0,0,.14)",
          }}/>
        </div>

        {/* === wall decor === */}
        <StringLights roomW={ROOM_W} floorH={FLOOR_H}/>
        <PennantBanner cx={POS.bed} bottom={FLOOR_H + 280}/>

        {/* picture frame above the bed.
            `transform: translateZ(0)` here (and on every other wobble decor
            in this room) promotes each one to its own compositor layer so
            WebKit caches its wobble filter result. Without this, every
            camera-transform change (each frame the player walks) makes
            WebKit re-execute the displacement on these decor elements,
            and the border edge leaks paint trails. */}
        <div style={{
          position: "absolute", left: POS.bed - 36, bottom: FLOOR_H + 222, width: 76, height: 58,
          background: "#fffdf6", border: "3px solid #1b1b1b", filter: "url(#wobble)",
          transform: "translateZ(0)",
          boxShadow: "2px 3px 0 rgba(0,0,0,.18)",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <svg width="56" height="40" viewBox="0 0 56 40">
            <path d="M3 32 L18 14 L30 26 L42 10 L53 32 Z"
                  fill="#cfe0c6" stroke="#1b1b1b" strokeWidth="1.8"
                  strokeLinejoin="round" filter="url(#wobble)"/>
            <circle cx="44" cy="8" r="3.5" fill="#fef3a3" stroke="#1b1b1b" strokeWidth="1.5"/>
          </svg>
        </div>

        {/* a second picture frame between bookshelf and doodle wall */}
        <div style={{
          position: "absolute", left: POS.shelf + 100, bottom: FLOOR_H + 230, width: 74, height: 58,
          background: "#fffdf6", border: "3px solid #1b1b1b", filter: "url(#wobble)",
          transform: "translateZ(0)",
          boxShadow: "2px 3px 0 rgba(0,0,0,.18)",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <svg width="54" height="40" viewBox="0 0 54 40">
            <circle cx="14" cy="14" r="6" fill="#fef3a3" stroke="#1b1b1b" strokeWidth="1.6"/>
            <path d="M2 34 L20 18 L30 28 L46 12 L52 34 Z"
                  fill="#a8c8e0" stroke="#1b1b1b" strokeWidth="1.8"
                  strokeLinejoin="round" filter="url(#wobble)"/>
          </svg>
        </div>

        {/* window between desk and plant — pigeon exits here */}
        <RoomWindow worldLeft={WINDOW_LEFT}
                    bottomFromFloor={WINDOW_BOTTOM_FROM_FLOOR}/>

        {/* wall clock above the desk */}
        <div style={{
          position: "absolute", left: POS.desk - 100, bottom: FLOOR_H + 270,
          width: 50, height: 50, borderRadius: "50%",
          background: "#fffdf6", border: "3px solid #1b1b1b", filter: "url(#wobble)",
          transform: "translateZ(0)",
          boxShadow: "2px 3px 0 rgba(0,0,0,.18)",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <svg width="40" height="40" viewBox="0 0 40 40">
            {[0,1,2,3].map(i => (
              <line key={i}
                x1={20 + Math.cos(i * Math.PI / 2) * 14}
                y1={20 + Math.sin(i * Math.PI / 2) * 14}
                x2={20 + Math.cos(i * Math.PI / 2) * 17}
                y2={20 + Math.sin(i * Math.PI / 2) * 17}
                stroke="#1b1b1b" strokeWidth="1.5"/>
            ))}
            <line x1="20" y1="20" x2="20" y2="10" stroke="#1b1b1b" strokeWidth="1.8" strokeLinecap="round"/>
            <line x1="20" y1="20" x2="27" y2="22" stroke="#1b1b1b" strokeWidth="1.8" strokeLinecap="round"/>
            <circle cx="20" cy="20" r="1.6" fill="#1b1b1b"/>
          </svg>
        </div>

        {/* shelf with trinkets above the record player — each one its own
            layer to cache the wobble filter past camera transforms. */}
        <div style={{
          position: "absolute", left: POS.record - 60, bottom: FLOOR_H + 200, width: 120, height: 8,
          background: "#7a5a36", border: "2px solid #1b1b1b", filter: "url(#wobble)",
          transform: "translateZ(0)",
          boxShadow: "0 4px 0 rgba(0,0,0,.18)",
        }}/>
        <div style={{ position: "absolute", left: POS.record - 42, bottom: FLOOR_H + 208,
          width: 16, height: 20, transform: "translateZ(0)",
          background: "#fef3a3", border: "2px solid #1b1b1b", filter: "url(#wobble)" }}/>
        <div style={{ position: "absolute", left: POS.record - 16, bottom: FLOOR_H + 208,
          width: 12, height: 26, borderRadius: "50% 50% 30% 30%", transform: "translateZ(0)",
          background: "#c97a83", border: "2px solid #1b1b1b", filter: "url(#wobble)" }}/>
        <div style={{ position: "absolute", left: POS.record + 8, bottom: FLOOR_H + 208,
          width: 20, height: 16, borderRadius: "50%", transform: "translateZ(0)",
          background: "#cfe0c6", border: "2px solid #1b1b1b", filter: "url(#wobble)" }}/>

        {/* === stations === */}
        <Anchored x={POS.outdoor - 50} bottom={FLOOR_H - 6}
                  prompt={nearest === "outdoor" && PROMPT_LABEL.outdoor}
                  onActivate={() => interactWith("outdoor")}
                  promptOffset={232}>
          <OutdoorPortal highlighted={nearest === "outdoor"}/>
        </Anchored>

        <Anchored x={POS.climb - 100} bottom={climbBottomY}
                  prompt={nearest === "climb" && PROMPT_LABEL.climb}
                  onActivate={() => interactWith("climb")}
                  promptOffset={370}>
          <ClimbingWall
            holds={CLIMB_HOLDS}
            highlighted={nearest === "climb"}
            climbHold={climbHold}
            onHoldClick={moveClimb}
          />
        </Anchored>

        <Anchored x={POS.bed - 122} bottom={FLOOR_H - 6}
                  prompt={nearest === "bed" && PROMPT_LABEL.bed}
                  onActivate={() => interactWith("bed")}
                  promptOffset={148}>
          <Bed highlighted={nearest === "bed"} lying={lying}/>
        </Anchored>

        {/* 网吧考古学家 — a little Switch actually resting on the foot (right
            end) of the bed. Placed relative to POS.bed, not POS.cafe, so it
            sits on the blanket instead of floating off the bed's side: x lands
            it on the foot half, bottom sits it on the mattress-top surface
            (FLOOR_H + 64). The walk-to / interaction point stays at POS.cafe. */}
        <Anchored x={POS.bed + 48} bottom={FLOOR_H + 54}
                  prompt={nearest === "cafe" && PROMPT_LABEL.cafe}
                  onActivate={() => interactWith("cafe")}
                  promptOffset={92}>
          <SwitchConsole highlighted={nearest === "cafe"}/>
        </Anchored>

        <Anchored x={POS.fishtank - 90} bottom={FLOOR_H - 6}
                  prompt={nearest === "fishtank" && PROMPT_LABEL.fishtank}
                  onActivate={() => interactWith("fishtank")}
                  promptOffset={210}>
          <FishTank highlighted={nearest === "fishtank"} feedTick={fishFeed}/>
        </Anchored>

        <Anchored x={POS.desk - 110} bottom={FLOOR_H - 6}
                  prompt={nearest === "focus" && PROMPT_LABEL.focus}
                  onActivate={() => interactWith("focus")}
                  promptOffset={196}>
          <Desk highlighted={nearest === "focus"}/>
        </Anchored>

        {/* 灵感搜集器 — a glowing idea jar on a small cabinet under the window */}
        <Anchored x={POS.spark - 40} bottom={FLOOR_H - 6}
                  prompt={nearest === "spark" && PROMPT_LABEL.spark}
                  onActivate={() => interactWith("spark")}
                  promptOffset={150}>
          <SparkCabinet highlighted={nearest === "spark"}/>
        </Anchored>

        {/* stool beside the desk — always there */}
        <div style={{ position: "absolute", left: POS.desk + 65, bottom: FLOOR_H - 6 }}>
          <Stool/>
        </div>

        <div style={{ position: "absolute", left: POS.plant - 35, bottom: FLOOR_H - 6 }}>
          <Plant/>
        </div>

        <Anchored x={POS.shelf - 64} bottom={FLOOR_H - 6}
                  prompt={nearest === "shelf" && PROMPT_LABEL.shelf}
                  onActivate={() => interactWith("shelf")}
                  promptOffset={210}>
          <Bookshelf highlighted={nearest === "shelf"}/>
        </Anchored>

        <Anchored x={POS.doodle - 80} bottom={FLOOR_H + 80}
                  prompt={nearest === "doodle" && PROMPT_LABEL.doodle}
                  onActivate={() => interactWith("doodle")}
                  promptOffset={158}>
          <DoodleWallPanel highlighted={nearest === "doodle"}/>
        </Anchored>

        <Anchored x={POS.record - 70} bottom={FLOOR_H - 6}
                  prompt={nearest === "mood" && PROMPT_LABEL.mood}
                  onActivate={() => interactWith("mood")}
                  promptOffset={148}>
          <RecordPlayer highlighted={nearest === "mood"}/>
        </Anchored>

        {/* about-me easel */}
        <Anchored x={POS.about - 60} bottom={FLOOR_H - 6}
                  prompt={nearest === "about" && PROMPT_LABEL.about}
                  onActivate={() => interactWith("about")}
                  promptOffset={216}>
          <AboutEasel highlighted={nearest === "about"}/>
        </Anchored>

        {/* pigeon cage — hung from the wall, up above head height */}
        <Anchored x={POS.mail - 31} bottom={FLOOR_H + 80}
                  prompt={nearest === "mail" && PROMPT_LABEL.mail}
                  onActivate={() => interactWith("mail")}
                  promptOffset={162}>
          <PigeonCage highlighted={nearest === "mail"} empty={cageEmpty}/>
        </Anchored>

        {/* a pigeon flying out the window when a letter was just sent */}
        {pigeonFlying > 0 && (
          <div key={pigeonFlying} className="room-fx pigeon-fly"
               style={{
                 position: "absolute",
                 left: pigeonStartX,
                 bottom: pigeonStartBottom,
                 zIndex: 28,
                 pointerEvents: "none",
                 "--fly-x": `${pigeonDX}px`,
                 "--fly-y": `${-pigeonDY}px`,
               }}>
            <FlyingPigeon/>
          </div>
        )}

        {/* === walking character ===
            Position via transform: translate3d, not left/bottom. Inside
            .mw-world (a composited layer), per-frame left/bottom changes
            trip a WebKit paint-invalidation bug that leaves ghost trails
            on adjacent static decor — picture frames, wall clock, the
            record-player shelf trinkets, the focus-orb sign. Driving the
            character on the GPU dirty-rect track keeps those clean. */}
        {!lying && !climbHold && !sitting && !singing && (
          <div style={{
            position: "absolute", left: 0, bottom: 0, zIndex: 10,
            transform: `translate3d(${charX - CHAR_BASE_W / 2}px, ${-(charBottom + charY)}px, 0)`,
            willChange: "transform",
          }}>
            <Char size={isMobile ? 70 : 90} walking={walking} jumping={charY > 5} facing={facing}
                  mood={nearest ? "?" : ""}/>
            {thought && (
              <div className="mw-thought" key={thought.id}>
                <div className="sk-hand" style={{ fontSize: 17, lineHeight: 1.3, color: "#1b1b1b" }}>
                  {thought.text}
                </div>
              </div>
            )}
          </div>
        )}

        {/* === seated character at the desk (back to camera) === */}
        {sitting && (
          <div style={{
            position: "absolute", left: POS.desk + 93 - 28, bottom: FLOOR_H - 6 + 38,
            zIndex: 12,
          }}>
            <SittingChar/>
          </div>
        )}

        {/* === swaying character at the record player + drifting notes === */}
        {singing && (
          <div style={{
            position: "absolute", left: (POS.record - 70) - CHAR_BASE_W / 2, bottom: charBottom,
            zIndex: 12,
          }}>
            <div className="room-sway">
              <Char size={isMobile ? 70 : 90} walking={false} facing={1} mood=""/>
            </div>
            <div className="room-note room-note-1">♪</div>
            <div className="room-note room-note-2">♫</div>
            <div className="room-note room-note-3">♬</div>
          </div>
        )}

        {/* === climber on the wall (back view, arms up) ===
            Same transform pattern as the walker — left/bottom transitions
            inside .mw-world leave trails on the climbing wall holds and
            the picture frames above. */}
        {!lying && climbHold && (
          <div style={{
            position: "absolute", left: 0, bottom: 0, zIndex: 11,
            transform: `translate3d(${climbCharX - 30}px, ${-climbCharBottom}px, 0)`,
            transition: "transform .25s ease-out",
            willChange: "transform",
          }}>
            <ClimberSprite/>
          </div>
        )}
      </div>

      {/* === HUD === */}
      <div style={{
        position: "fixed", top: 16, left: 16, right: 16, display: "flex",
        justifyContent: "space-between", alignItems: "center", zIndex: 30,
        pointerEvents: "none",
      }}>
        <div className="sk-mono" style={{
          fontSize: 11, letterSpacing: ".15em", background: "#fffdf6",
          border: "2px solid #1b1b1b", padding: "6px 12px", filter: "url(#wobble)",
          pointerEvents: "auto",
        }}>
          MY WORLD &nbsp;·&nbsp; 房间版 · ROOM
          {climbHold && <span style={{ marginLeft: 8 }}>· 攀岩中</span>}
          {lying && <span style={{ marginLeft: 8 }}>· 睡了 zZ</span>}
        </div>
        {/* gallery shortcut — top right */}
        <button className="mw-skip" onClick={(e) => { e.stopPropagation(); setShowGallery(true); }}
                style={{ pointerEvents: "auto" }}>
          SKIP · 看作品 →
        </button>
      </div>

      <button className="mw-skip" onClick={(e) => {
          e.stopPropagation();
          initAudio();
          const m = !muted;
          setMuted(m); setMutedState(m);
        }}
        style={{ position: "fixed", bottom: 24, left: 24, zIndex: 36 }}>
        <SpeakerIcon muted={muted}/>{muted ? "静音" : "声音"}
      </button>

      {/* mobile jump button — no keyboard there, so a tap-to-hop control */}
      {isMobile && !blocked && !climbHold && !lying && (
        <button className="mw-skip"
          onPointerDown={(e) => {
            e.stopPropagation();
            if (stateRef.current.y === 0) keys.current.jumpRequested = true;
          }}
          style={{ position: "fixed", bottom: 24, left: "50%", transform: "translateX(-50%)", zIndex: 36 }}>
          ↑ 跳
        </button>
      )}

      {climbHold ? (
        <button className="mw-skip"
                onClick={(e) => { e.stopPropagation(); exitClimb(); }}
                style={{ position: "fixed", bottom: 24, right: 24, zIndex: 36 }}>
          ↓ 下来
        </button>
      ) : (
        <button className="mw-skip" onClick={(e) => { e.stopPropagation(); onSwitch(); }}
                style={{ position: "fixed", bottom: 24, right: 24, zIndex: 36 }}>
          ← 散步版
        </button>
      )}

      {climbSummited && (
        <div className="dw-fade" style={{
          position: "fixed", left: "50%", top: "18%",
          transform: "translateX(-50%) rotate(-1.5deg)",
          background: "#fffdf6", border: "3px solid #1b1b1b", filter: "url(#wobble)",
          padding: "16px 22px", textAlign: "center", width: 240,
          boxShadow: "4px 6px 0 rgba(0,0,0,.2)", zIndex: 45,
        }}>
          <div className="sk-mono" style={{ fontSize: 10, letterSpacing: ".22em", color: "#888" }}>
            CLIMB · 登顶
          </div>
          <div className="mw-title" style={{ fontSize: 32, lineHeight: 1, marginTop: 4, color: "#d97757" }}>
            登顶 ✦
          </div>
          
          <button className="mw-btn" style={{ marginTop: 14, fontSize: 14, padding: "6px 18px" }}
                  onClick={() => exitClimb()}>
            ↓ 下来
          </button>
        </div>
      )}

      {(lying || rising) && (
        <div className={`room-fx ${lying ? "bed-rest-in" : "bed-rest-out"}`} style={{
          position: "fixed", left: 0, right: 0, top: 0, bottom: 0, zIndex: 28,
          pointerEvents: "none",
          background: "radial-gradient(circle at 50% 65%, rgba(27,27,27,0) 30%, rgba(27,27,27,.18) 100%)",
        }}>
          {lying && (
            <div className="sk-hand bed-rest-hint" style={{
              position: "absolute", left: "50%", top: "16%", transform: "translateX(-50%)",
              fontSize: 26, color: "#1b1b1b", background: "rgba(255,253,246,.92)",
              border: "2px solid #1b1b1b", filter: "url(#wobble)", padding: "8px 18px",
              pointerEvents: "auto",
            }}>
              {isMobile ? "点一下屏幕起床" : "点一下 / 按空格起床"}
            </div>
          )}
        </div>
      )}

      {showHint && !blocked && !climbHold && !lying && (
        <div className="mw-start-hint">
          <div className="sk-hand" style={{ fontSize: isMobile ? 22 : 26, color: "#1b1b1b" }}>
            走到东西旁边 — 都能玩 ✦
          </div>
          <div className="mw-body" style={{ fontSize: 13, color: "#555", marginTop: 4 }}>
            窗边灵感罐·攀岩·床上掌机·鱼缸·书桌闹钟·书架·涂鸦墙·唱片机·关于我·信鸽 &nbsp;·&nbsp; {isMobile ? "点屏幕走 · 点黑气泡互动 · 点 ↑跳 · 右上 SKIP 看作品" : "← → / A D 走 · W/↑ 跳 · E 互动 · 右上 SKIP 看作品"}
          </div>
        </div>
      )}

      {workModal && (
        <WorkModal
          work={WORKS[workModal.workId]}
          workId={workModal.workId}
          onClose={() => setWorkModal(null)}
          onShowcase={(url, workId) =>
            setShowcase({ url, workId, fromX: stateRef.current.x })
          }
        />
      )}

      {showcase && (
        <ShowcaseFrame
          url={showcase.url}
          onClose={() => {
            if (typeof showcase.fromX === "number") {
              stateRef.current.x = showcase.fromX;
              setCharX(showcase.fromX);
              setTarget(null);
            }
            setShowcase(null);
            setWorkModal(null);
          }}
        />
      )}

      {showDoodle && (
        <DoodleWall doodles={DOODLES_ROOM} onClose={() => setShowDoodle(false)}/>
      )}

      {showGallery && (
        <Gallery
          onClose={() => setShowGallery(false)}
          onBackToWalk={() => setShowGallery(false)}
          backLabel="← 回房间走走"
          onShowcase={(url, workId) =>
            setShowcase({ url, workId, fromX: stateRef.current.x })
          }
        />
      )}

      {bookQuote && (
        <Overlay title="翻一页" sub="BOOKSHELF · 书架"
                 onClose={() => setBookQuote(null)} accent="#fffdf6">
          <div style={{ textAlign: "center", padding: "10px 4px" }}>
            <div className="mw-title" style={{ fontSize: 32, lineHeight: 1.35, color: "#1b1b1b" }}>
              {bookQuote.q}
            </div>
            <div className="sk-hand" style={{ fontSize: 17, color: "#7a6648", marginTop: 14 }}>
              {bookQuote.from}
            </div>
            <button className="mw-btn" style={{ marginTop: 22 }}
                    onClick={() => { playOpen(); setBookQuote(BOOK_QUOTES[Math.floor(Math.random() * BOOK_QUOTES.length)]); }}>
              ↺ 再翻一本
            </button>
          </div>
        </Overlay>
      )}

      {showContact && (
        <ContactCard
          onClose={() => setShowContact(false)}
          onSent={launchPigeon}
        />
      )}

      {showAbout && (
        <Overlay title="关于我" sub="ABOUT · 自我介绍"
                 onClose={() => setShowAbout(false)} accent="#fffdf6">
          <div style={{ textAlign: "center", padding: "6px 4px 2px" }}>
            <svg width="116" height="116" viewBox="0 0 116 116"
                 style={{ display: "block", margin: "0 auto 12px" }}>
              {/* shoulders — a moss sweater */}
              <path d="M26 108 Q58 64 90 108 L90 116 L26 116 Z"
                    fill="#6f8f6a" stroke="#1b1b1b" strokeWidth="2.5" strokeLinejoin="round"/>
              {/* neck */}
              <rect x="51" y="72" width="14" height="20" fill="#e9b88a" stroke="#1b1b1b" strokeWidth="2"/>
              {/* long hair — one smooth shape framing the head down to the shoulders */}
              <path d="M58 16 Q23 18 21 58 Q19 100 36 106 Q40 80 39 60
                       Q39 36 58 30 Q77 36 77 60 Q76 80 80 106
                       Q97 100 95 58 Q93 18 58 16 Z"
                    fill="#3a2c22" stroke="#1b1b1b" strokeWidth="2.4"
                    strokeLinejoin="round" filter="url(#wobble)"/>
              {/* ears */}
              <circle cx="31" cy="54" r="5" fill="#e9b88a" stroke="#1b1b1b" strokeWidth="2"/>
              <circle cx="85" cy="54" r="5" fill="#e9b88a" stroke="#1b1b1b" strokeWidth="2"/>
              {/* head */}
              <circle cx="58" cy="52" r="27" fill="#e9b88a" stroke="#1b1b1b" strokeWidth="2.5"/>
              {/* round glasses */}
              <circle cx="47" cy="54" r="11" fill="#cfe0c6" fillOpacity=".4"
                      stroke="#1b1b1b" strokeWidth="2.6"/>
              <circle cx="69" cy="54" r="11" fill="#cfe0c6" fillOpacity=".4"
                      stroke="#1b1b1b" strokeWidth="2.6"/>
              <path d="M57 53 Q58 50 59 53" fill="none" stroke="#1b1b1b" strokeWidth="2.4"/>
              {/* eyes */}
              <circle cx="47" cy="54" r="2.8" fill="#1b1b1b"/>
              <circle cx="69" cy="54" r="2.8" fill="#1b1b1b"/>
              {/* eyebrows */}
              <path d="M39 41 Q47 37 55 41" stroke="#1b1b1b" strokeWidth="2.3"
                    fill="none" strokeLinecap="round"/>
              <path d="M61 41 Q69 37 77 41" stroke="#1b1b1b" strokeWidth="2.3"
                    fill="none" strokeLinecap="round"/>
              {/* freckles */}
              <circle cx="38" cy="64" r="1.1" fill="#b07c4a"/>
              <circle cx="42" cy="68" r="1.1" fill="#b07c4a"/>
              <circle cx="37" cy="69" r="1.1" fill="#b07c4a"/>
              <circle cx="74" cy="64" r="1.1" fill="#b07c4a"/>
              <circle cx="78" cy="68" r="1.1" fill="#b07c4a"/>
              <circle cx="79" cy="64" r="1.1" fill="#b07c4a"/>
              {/* smile */}
              <path d="M50 70 Q58 77 66 70" stroke="#1b1b1b" strokeWidth="2.6"
                    fill="none" strokeLinecap="round"/>
            </svg>
            <div className="mw-title" style={{ fontSize: 32, color: "#1b1b1b" }}>
              {ABOUT_ME.name}
            </div>
            <div className="mw-body" style={{ fontSize: 17, color: "#555", marginTop: 12, lineHeight: 1.75 }}>
              {ABOUT_ME.lines.map((line, i) => (
                <div key={i}>{line || " "}</div>
              ))}
            </div>
            <button className="mw-btn" style={{ marginTop: 20 }}
                    onClick={() => setShowAbout(false)}>
              ← 回屋里
            </button>
          </div>
        </Overlay>
      )}

      {showOutdoor && (
        <Overlay title="去野外攀岩" sub="OUTDOOR · 施工中"
                 onClose={() => setShowOutdoor(false)} accent="#fffdf6">
          <div style={{ textAlign: "center", padding: "4px 0" }}>
            <svg width="220" height="160" viewBox="0 0 220 160"
                 style={{ display: "block", margin: "0 auto" }}>
              <text x="22" y="28" fontSize="18" fill="#d97757" fontFamily="Caveat">✦</text>
              <text x="188" y="22" fontSize="14" fill="#d97757" fontFamily="Caveat">✦</text>
              <path d="M22 130 L78 42 L104 76 L138 28 L198 130 Z"
                    fill="#cfe0c6" stroke="#1b1b1b" strokeWidth="2.5"
                    strokeLinejoin="round" filter="url(#wobble)"/>
              <path d="M70 52 L78 42 L86 54 L80 58 L78 54 L74 58 Z"
                    fill="#fffdf6" stroke="#1b1b1b" strokeWidth="1.5" filter="url(#wobble)"/>
              <path d="M130 36 L138 28 L146 38 L142 42 L138 38 L134 42 Z"
                    fill="#fffdf6" stroke="#1b1b1b" strokeWidth="1.5" filter="url(#wobble)"/>
              <g stroke="#7a6648" strokeWidth="2.5" fill="none" filter="url(#wobble)">
                <line x1="42" y1="130" x2="62" y2="78"/>
                <line x1="58" y1="130" x2="78" y2="78"/>
                <line x1="46" y1="118" x2="64" y2="118"/>
                <line x1="49" y1="106" x2="67" y2="106"/>
                <line x1="52" y1="94" x2="70" y2="94"/>
                <line x1="55" y1="82" x2="73" y2="82"/>
              </g>
              <g transform="translate(60 72)" filter="url(#wobble)">
                <path d="M-8 4 Q0 -5 8 4 L10 8 L-10 8 Z"
                      fill="#fef3a3" stroke="#1b1b1b" strokeWidth="1.8"/>
                <path d="M-10 8 L10 8" stroke="#1b1b1b" strokeWidth="1.8"/>
                <circle cx="0" cy="13" r="5" fill="#fffdf6" stroke="#1b1b1b" strokeWidth="1.8"/>
                <circle cx="-1.8" cy="12.5" r="0.7" fill="#1b1b1b"/>
                <circle cx="1.8" cy="12.5" r="0.7" fill="#1b1b1b"/>
                <path d="M-5 18 L5 18 L6 30 L-6 30 Z"
                      fill="#d97757" stroke="#1b1b1b" strokeWidth="1.5"/>
                <line x1="-5" y1="20" x2="-10" y2="26" stroke="#1b1b1b" strokeWidth="1.5" strokeLinecap="round"/>
                <line x1="5" y1="20" x2="13" y2="15" stroke="#1b1b1b" strokeWidth="1.5" strokeLinecap="round"/>
                <rect x="11" y="11" width="11" height="3.5" fill="#fffdf6" stroke="#1b1b1b" strokeWidth="1.3"/>
                <path d="M22 9 L25 9 L25 16 L22 16 L22 14 L24 12.5 L22 11 Z"
                      fill="#fffdf6" stroke="#1b1b1b" strokeWidth="1.3"/>
                <line x1="-3" y1="30" x2="-4" y2="38" stroke="#1b1b1b" strokeWidth="1.5" strokeLinecap="round"/>
                <line x1="3" y1="30" x2="4" y2="38" stroke="#1b1b1b" strokeWidth="1.5" strokeLinecap="round"/>
              </g>
              <g transform="rotate(-5 110 138)">
                <rect x="-15" y="132" width="250" height="15" fill="#fef3a3"
                      stroke="#1b1b1b" strokeWidth="2" filter="url(#wobble)"/>
                {Array.from({ length: 10 }).map((_, i) => (
                  <path key={i} d={`M ${i * 26 - 10} 132 L ${i * 26 + 4} 147`}
                        stroke="#1b1b1b" strokeWidth="2"/>
                ))}
              </g>
            </svg>
            <div className="mw-body" style={{ fontSize: 17, color: "#555", marginTop: 14, lineHeight: 1.6 }}>
              锁扣还在拧 — 改天再来 ✿<br/>
              想去爬墙? 屋里就有一面手绘的 ↓
            </div>
            <button className="mw-btn" style={{ marginTop: 18 }}
                    onClick={() => setShowOutdoor(false)}>
              ← 回屋里
            </button>
          </div>
        </Overlay>
      )}
    </div>
  );
}

function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }

function findNearest(charX) {
  const ents = [
    ["outdoor",  POS.outdoor],
    ["climb",    POS.climb],
    ["bed",      POS.bed],
    ["fishtank", POS.fishtank],
    ["focus",    POS.desk],
    ["shelf",    POS.shelf],
    ["doodle",   POS.doodle],
    ["mood",     POS.record],
    ["cafe",     POS.cafe],
    ["spark",    POS.spark],
    ["about",    POS.about],
    ["mail",     POS.mail],
  ];
  let best = null, bd = INTERACT_RADIUS;
  for (const [k, x] of ents) {
    const d = Math.abs(charX - x);
    if (d < bd) { bd = d; best = k; }
  }
  return best;
}

// ============================================================
// Anchored — world-layer object with a floating black prompt
// ============================================================
function Anchored({ x, bottom, prompt, promptOffset, onActivate, children }) {
  return (
    <div style={{ position: "absolute", left: x, bottom }}>
      {children}
      {prompt && (
        <div className="mw-prompt-anchor mw-prompt-tap" style={{ bottom: promptOffset }}
             onPointerDown={onActivate ? (e) => { e.stopPropagation(); onActivate(); } : undefined}>
          ▾ &nbsp; {prompt} &nbsp; ▾
        </div>
      )}
    </div>
  );
}

// ============================================================
// Wall decor — string lights spanning the whole wall
// ============================================================
function StringLights({ roomW, floorH }) {
  const bulbColors = ["#d97757", "#fef3a3", "#a8c8e0", "#9bb18e", "#c97a83", "#efb24a"];
  const bulbs = [];
  const spacing = 110;
  for (let x = 60; x < roomW - 40; x += spacing) {
    const sag = 10 + Math.sin(x / 80) * 6;
    bulbs.push({ x, sag, color: bulbColors[bulbs.length % bulbColors.length] });
  }
  return (
    <div style={{
      position: "absolute", left: 0, top: 24, width: roomW, height: 60,
      pointerEvents: "none",
    }}>
      <svg width={roomW} height="60" style={{ display: "block" }}>
        {/* hanging cord — gentle catenary-ish curve */}
        {bulbs.map((b, i) => {
          if (i === bulbs.length - 1) return null;
          const nb = bulbs[i + 1];
          return (
            <path key={`c${i}`}
              d={`M${b.x} ${b.sag} Q${(b.x + nb.x) / 2} ${(b.sag + nb.sag) / 2 + 10} ${nb.x} ${nb.sag}`}
              stroke="#1b1b1b" strokeWidth="1.6" fill="none"/>
          );
        })}
        {/* bulbs */}
        {bulbs.map((b, i) => (
          <g key={`b${i}`}>
            <line x1={b.x} y1={b.sag + 4} x2={b.x} y2={b.sag + 12}
                  stroke="#1b1b1b" strokeWidth="1.4"/>
            <circle cx={b.x} cy={b.sag + 19} r="6.5"
                    fill={b.color} stroke="#1b1b1b" strokeWidth="1.8" filter="url(#wobble)"/>
            <circle cx={b.x - 2} cy={b.sag + 17} r="1.6" fill="rgba(255,255,255,.6)"/>
          </g>
        ))}
      </svg>
    </div>
  );
}

function PennantBanner({ cx, bottom }) {
  const colors = ["#d97757", "#fef3a3", "#cfe0c6", "#a8c8e0", "#c97a83", "#9bb18e"];
  return (
    <div style={{ position: "absolute", left: cx - 120, bottom, pointerEvents: "none" }}>
      <svg width="240" height="46" viewBox="0 0 240 46">
        <path d="M4 8 Q120 22 236 8" stroke="#1b1b1b" strokeWidth="1.6" fill="none"/>
        {colors.map((c, i) => {
          const x = 14 + i * 36;
          const tip = 12 + Math.sin(i) * 4;
          return (
            <g key={i} filter="url(#wobble)">
              <line x1={x} y1={10 + tip * 0.2} x2={x} y2={14} stroke="#1b1b1b" strokeWidth="1"/>
              <path d={`M${x - 12} ${14} L${x + 12} ${14} L${x} ${14 + 22} Z`}
                    fill={c} stroke="#1b1b1b" strokeWidth="1.6" strokeLinejoin="round"/>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

function HangingPlant({ cx, bottom }) {
  return (
    <div style={{ position: "absolute", left: cx - 36, bottom, pointerEvents: "none" }}>
      <svg width="72" height="110" viewBox="0 0 72 110">
        {/* hanging cord */}
        <line x1="36" y1="0" x2="14" y2="38" stroke="#1b1b1b" strokeWidth="1.5"/>
        <line x1="36" y1="0" x2="58" y2="38" stroke="#1b1b1b" strokeWidth="1.5"/>
        <line x1="36" y1="0" x2="36" y2="34" stroke="#1b1b1b" strokeWidth="1.5"/>
        {/* pot */}
        <path d="M12 38 L60 38 L56 64 L16 64 Z"
              fill="#a77a4a" stroke="#1b1b1b" strokeWidth="2.2"
              strokeLinejoin="round" filter="url(#wobble)"/>
        <line x1="10" y1="38" x2="62" y2="38" stroke="#1b1b1b" strokeWidth="2.2"/>
        {/* trailing leaves */}
        <g filter="url(#wobble)">
          <path d="M22 42 Q14 58 16 90 Q22 76 24 60 Z"
                fill="#9bb18e" stroke="#1b1b1b" strokeWidth="1.8"/>
          <path d="M36 42 Q34 70 30 100 Q40 80 40 56 Z"
                fill="#7f9a76" stroke="#1b1b1b" strokeWidth="1.8"/>
          <path d="M52 42 Q60 58 56 88 Q50 72 50 56 Z"
                fill="#9bb18e" stroke="#1b1b1b" strokeWidth="1.8"/>
        </g>
      </svg>
    </div>
  );
}

function PendantLamp({ cx, bottom }) {
  return (
    <div style={{ position: "absolute", left: cx - 32, bottom, pointerEvents: "none" }}>
      <svg width="64" height="100" viewBox="0 0 64 100">
        <line x1="32" y1="0" x2="32" y2="46" stroke="#1b1b1b" strokeWidth="1.6"/>
        <path d="M14 46 L50 46 L42 78 L22 78 Z"
              fill="#d97757" stroke="#1b1b1b" strokeWidth="2.4"
              strokeLinejoin="round" filter="url(#wobble)"/>
        <line x1="22" y1="78" x2="42" y2="78" stroke="#1b1b1b" strokeWidth="2"/>
        <ellipse cx="32" cy="90" rx="22" ry="3.5" fill="rgba(254,243,163,.55)"/>
      </svg>
    </div>
  );
}

// ============================================================
// Outdoor portal — exterior door on the left wall (under construction)
// ============================================================
function OutdoorPortal({ highlighted }) {
  return (
    <div style={{ position: "relative", width: 100, height: 220,
                  filter: highlighted ? "drop-shadow(0 0 14px rgba(217,119,87,.55))" : "none",
                  transition: "filter .25s" }}>
      <svg width="100" height="220" viewBox="0 0 100 220" style={{ display: "block" }}>
        <rect x="6" y="14" width="88" height="200"
              fill="#7a5a36" stroke="#1b1b1b" strokeWidth="2.5" filter="url(#wobble)"/>
        <rect x="14" y="22" width="72" height="184"
              fill="#a77a4a" stroke="#1b1b1b" strokeWidth="2" filter="url(#wobble)"/>
        <rect x="22" y="36" width="56" height="44"
              fill="#a8c8de" stroke="#1b1b1b" strokeWidth="2" filter="url(#wobble)"/>
        <path d="M22 80 L34 60 L46 70 L60 50 L78 80 Z" fill="#9bb18e"/>
        <line x1="50" y1="36" x2="50" y2="80" stroke="#1b1b1b" strokeWidth="1.6"/>
        <line x1="22" y1="58" x2="78" y2="58" stroke="#1b1b1b" strokeWidth="1.6"/>
        <rect x="22" y="100" width="56" height="50" fill="none" stroke="#1b1b1b" strokeWidth="1.6"/>
        <rect x="22" y="160" width="56" height="40" fill="none" stroke="#1b1b1b" strokeWidth="1.6"/>
        <circle cx="76" cy="128" r="3" fill="#1b1b1b"/>
        <g transform="rotate(-12 50 196)">
          <rect x="-20" y="190" width="140" height="12" fill="#fef3a3"
                stroke="#1b1b1b" strokeWidth="1.8" filter="url(#wobble)"/>
          {Array.from({ length: 8 }).map((_, i) => (
            <path key={i} d={`M ${i * 18 - 14} 190 L ${i * 18 - 4} 202`}
                  stroke="#1b1b1b" strokeWidth="1.6"/>
          ))}
        </g>
        <rect x="-2" y="-6" width="104" height="22" fill="#fffdf6"
              stroke="#1b1b1b" strokeWidth="2" filter="url(#wobble)"/>
        <text x="50" y="10" fontSize="13" textAnchor="middle"
              fontFamily="Caveat" fill="#1b1b1b">野外攀岩 →</text>
      </svg>
    </div>
  );
}

// ============================================================
// Pigeon cage — a small bamboo birdcage hanging from the wall
// ============================================================
function PigeonCage({ highlighted, empty }) {
  const W = 62, H = 150;
  // bamboo ribs fan out from the finial down to the cage body
  const N_RIBS = 11;
  const ribs = Array.from({ length: N_RIBS }, (_, i) => {
    const t = i / (N_RIBS - 1);          // 0..1
    return 8 + t * 46;                   // x at the cage body (8..54)
  });
  return (
    <div style={{ position: "relative", width: W, height: H,
                  filter: highlighted ? "drop-shadow(0 0 14px rgba(217,119,87,.55))" : "none",
                  transition: "filter .25s" }}>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ display: "block" }}>
        {/* metal hook */}
        <path d="M31 2 Q40 2 40 10 Q40 18 33 18"
              fill="none" stroke="#1b1b1b" strokeWidth="2.2" strokeLinecap="round"/>
        {/* hanging cord */}
        <line x1="31" y1="18" x2="31" y2="34" stroke="#7a5a36" strokeWidth="2"/>
        {/* wooden finial cap */}
        <rect x="28" y="32" width="6" height="6" fill="#a77a4a" stroke="#1b1b1b" strokeWidth="1.4"/>
        <ellipse cx="31" cy="40" rx="7" ry="4"
                 fill="#a77a4a" stroke="#1b1b1b" strokeWidth="1.8"/>
        {/* bamboo ribs */}
        {ribs.map((xb, i) => (
          <path key={i} d={`M31 43 Q${xb} 56 ${xb} 134`}
                fill="none" stroke="#b07c4a" strokeWidth="1.3"/>
        ))}
        {/* dome silhouette */}
        <path d="M8 134 Q8 50 31 43 Q54 50 54 134"
              fill="none" stroke="#7a5a36" strokeWidth="2.2" filter="url(#wobble)"/>
        {/* horizontal hoop rings */}
        <path d="M9 72  Q31 79 53 72"  fill="none" stroke="#7a5a36" strokeWidth="1.5"/>
        <path d="M8 104 Q31 111 54 104" fill="none" stroke="#7a5a36" strokeWidth="1.5"/>
        {/* perch */}
        <line x1="15" y1="100" x2="47" y2="100" stroke="#8b6539" strokeWidth="2.4"/>
        {/* white dove on the perch */}
        {!empty && (
          <g transform="translate(20, 82)">
            <ellipse cx="10" cy="10" rx="10" ry="6.5"
                     fill="#fffdf6" stroke="#1b1b1b" strokeWidth="1.6"/>
            <path d="M1 10 L-4 8 L0 15 Z"
                  fill="#fffdf6" stroke="#1b1b1b" strokeWidth="1.3" strokeLinejoin="round"/>
            <circle cx="18" cy="4" r="5" fill="#fffdf6" stroke="#1b1b1b" strokeWidth="1.6"/>
            <path d="M23 4 L28 5 L23 7 Z" fill="#efb24a" stroke="#1b1b1b" strokeWidth="1.1"/>
            <circle cx="19" cy="3" r=".8" fill="#1b1b1b"/>
            <path d="M4 9 Q10 5 17 9" fill="none" stroke="#1b1b1b" strokeWidth="1.2"/>
            <line x1="8"  y1="16" x2="8"  y2="19" stroke="#efb24a" strokeWidth="1.5"/>
            <line x1="13" y1="16" x2="13" y2="19" stroke="#efb24a" strokeWidth="1.5"/>
          </g>
        )}
        {empty && (
          <g className="cage-feather" transform="translate(29, 84)">
            <path d="M0 0 Q4 4 2 10 Q1.5 6 0 0 Z"
                  fill="#fffdf6" stroke="#1b1b1b" strokeWidth="1.1"
                  strokeLinejoin="round"/>
          </g>
        )}
        {/* round wooden tray base */}
        <path d="M3 132 Q3 144 31 147 Q59 144 59 132"
              fill="#8b6539" stroke="#1b1b1b" strokeWidth="2"
              strokeLinejoin="round" filter="url(#wobble)"/>
        <ellipse cx="31" cy="132" rx="28" ry="7"
                 fill="#a77a4a" stroke="#1b1b1b" strokeWidth="2" filter="url(#wobble)"/>
      </svg>
    </div>
  );
}

// ============================================================
// The pigeon mid-flight (wings flap, carrying a letter)
// ============================================================
function FlyingPigeon() {
  return (
    <svg width="42" height="34" viewBox="-8 -16 42 34" style={{ display: "block", overflow: "visible" }}>
      {/* body */}
      <ellipse cx="10" cy="4" rx="10" ry="6" fill="#fffdf6" stroke="#1b1b1b" strokeWidth="1.6"/>
      {/* head */}
      <circle cx="19" cy="0" r="5" fill="#fffdf6" stroke="#1b1b1b" strokeWidth="1.6"/>
      <circle cx="20" cy="-1" r=".9" fill="#1b1b1b"/>
      {/* beak + tiny letter */}
      <path d="M24 0 L29 1 L24 2 Z" fill="#efb24a" stroke="#1b1b1b" strokeWidth="1.3"/>
      <rect x="29" y="-3" width="9" height="7"
            fill="#fef3a3" stroke="#1b1b1b" strokeWidth="1.2"
            transform="rotate(-8 33 0)"/>
      <path d="M29 -3 L33 1 L38 -3" stroke="#1b1b1b" strokeWidth="1" fill="none"
            transform="rotate(-8 33 0)"/>
      {/* tail */}
      <path d="M0 4 L-6 2 L-3 9 Z" fill="#fffdf6" stroke="#1b1b1b" strokeWidth="1.3" strokeLinejoin="round"/>
      {/* flapping wings */}
      <path className="pigeon-wing pigeon-wing-l"
            d="M9 -2 L-3 -13 L6 -2 Z"
            fill="#f4f1e8" stroke="#1b1b1b" strokeWidth="1.5" strokeLinejoin="round"/>
      <path className="pigeon-wing pigeon-wing-r"
            d="M11 -2 L23 -13 L14 -2 Z"
            fill="#f4f1e8" stroke="#1b1b1b" strokeWidth="1.5" strokeLinejoin="round"/>
    </svg>
  );
}

// ============================================================
// Climber sprite — back-facing character with arms raised
// ============================================================
function ClimberSprite() {
  return (
    <svg width="60" height="90" viewBox="0 0 60 90" style={{ display: "block" }}>
      {/* arms raised */}
      <line x1="22" y1="36" x2="14" y2="6"  stroke="#e9b88a" strokeWidth="7" strokeLinecap="round"/>
      <line x1="38" y1="36" x2="46" y2="6"  stroke="#e9b88a" strokeWidth="7" strokeLinecap="round"/>
      {/* outlines on arms */}
      <line x1="22" y1="36" x2="14" y2="6"  stroke="#1b1b1b" strokeWidth="1.4" strokeLinecap="round" fill="none"/>
      <line x1="38" y1="36" x2="46" y2="6"  stroke="#1b1b1b" strokeWidth="1.4" strokeLinecap="round" fill="none"/>
      {/* hands gripping */}
      <circle cx="14" cy="4" r="4.5" fill="#e9b88a" stroke="#1b1b1b" strokeWidth="1.8"/>
      <circle cx="46" cy="4" r="4.5" fill="#e9b88a" stroke="#1b1b1b" strokeWidth="1.8"/>
      {/* hair tuft (back of head) */}
      <path d="M18 22 Q30 12 42 22 Q42 30 30 30 Q18 30 18 22 Z"
            fill="#1b1b1b" filter="url(#wobble)"/>
      {/* head — neck a tiny sliver visible */}
      <circle cx="30" cy="22" r="11" fill="#e9b88a" stroke="#1b1b1b" strokeWidth="2"/>
      {/* shirt back */}
      <path d="M19 32 L41 32 L43 60 L17 60 Z"
            fill="#c97a83" stroke="#1b1b1b" strokeWidth="2" strokeLinejoin="round"
            filter="url(#wobble)"/>
      {/* shorts */}
      <rect x="19" y="60" width="22" height="13"
            fill="#26344f" stroke="#1b1b1b" strokeWidth="2" filter="url(#wobble)"/>
      {/* legs slightly spread */}
      <line x1="26" y1="73" x2="22" y2="84" stroke="#e9b88a" strokeWidth="6" strokeLinecap="round"/>
      <line x1="34" y1="73" x2="38" y2="84" stroke="#e9b88a" strokeWidth="6" strokeLinecap="round"/>
      <line x1="26" y1="73" x2="22" y2="84" stroke="#1b1b1b" strokeWidth="1.3" strokeLinecap="round"/>
      <line x1="34" y1="73" x2="38" y2="84" stroke="#1b1b1b" strokeWidth="1.3" strokeLinecap="round"/>
      {/* shoes */}
      <ellipse cx="22" cy="86" rx="6" ry="2.5" fill="#9bb18e" stroke="#1b1b1b" strokeWidth="1.6"/>
      <ellipse cx="38" cy="86" rx="6" ry="2.5" fill="#efb24a" stroke="#1b1b1b" strokeWidth="1.6"/>
    </svg>
  );
}

// ============================================================
// Climbing wall — hand-drawn holds + click-to-hop mini-game
// ============================================================
function ClimbingWall({ holds, highlighted, climbHold, onHoldClick }) {
  const W = 240, H = 360;
  const current = climbHold ? holds.find(h => h.id === climbHold) : null;
  return (
    <div style={{ position: "relative", width: W, height: H,
                  filter: highlighted ? "drop-shadow(0 0 14px rgba(217,119,87,.55))" : "none",
                  transition: "filter .25s" }}>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ display: "block" }}>
        <rect x="6" y="6" width={W - 12} height={H - 12}
              fill="#e9d8b5" stroke="#1b1b1b" strokeWidth="3" filter="url(#wobble)"/>
        <path d="M30 60 L52 100 L40 150" stroke="rgba(27,27,27,.14)" strokeWidth="1.6" fill="none"/>
        <path d="M178 70 L196 116 L184 156" stroke="rgba(27,27,27,.12)" strokeWidth="1.6" fill="none"/>
        <ellipse cx="42" cy="200" rx="9" ry="3" fill="rgba(255,255,255,.42)"/>
        <ellipse cx="148" cy="84" rx="10" ry="3" fill="rgba(255,255,255,.42)"/>
        <rect x="-6" y={H - 14} width={W + 12} height="14"
              fill="#cfe0c6" stroke="#1b1b1b" strokeWidth="2" filter="url(#wobble)"/>
        <line x1="40" y1={H - 7} x2={W - 40} y2={H - 7}
              stroke="rgba(27,27,27,.3)" strokeWidth="1.2" strokeDasharray="4 4"/>
        {current && (
          <circle cx={current.x} cy={H - current.y} r={CLIMB_REACH}
                  fill="rgba(217,119,87,.08)" stroke="rgba(217,119,87,.55)"
                  strokeWidth="1.6" strokeDasharray="6 5"/>
        )}
        {holds.map(h => {
          const reachable = !climbHold ? h.ground
            : current && h.id !== current.id && Math.hypot(current.x - h.x, current.y - h.y) <= CLIMB_REACH;
          const isCurrent = climbHold === h.id;
          const cy = H - h.y;
          const click = () => onHoldClick(h.id);
          const opacity = isCurrent ? 1 : reachable ? 1 : 0.42;
          const stroke = "#1b1b1b";
          const handlers = reachable ? {
            style: { cursor: "pointer", filter: "url(#wobble)", opacity, pointerEvents: "auto" },
            className: "climb-hold",
            onMouseDown: (e) => { e.stopPropagation(); click(); },
            onTouchStart: (e) => { e.stopPropagation(); e.preventDefault(); click(); },
          } : {
            style: { filter: "url(#wobble)", opacity, pointerEvents: "none" },
          };
          if (h.shape === "triangle") {
            const s = h.size;
            return (
              <g key={h.id} {...handlers}>
                <path d={`M${h.x} ${cy - s} L${h.x + s} ${cy + s * .6} L${h.x - s} ${cy + s * .6} Z`}
                      fill={h.c} stroke={stroke} strokeWidth="2.4" strokeLinejoin="round"/>
                <circle cx={h.x - 1} cy={cy + 1} r="1.4" fill="#1b1b1b" opacity=".55"/>
              </g>
            );
          }
          if (h.shape === "oval") {
            return (
              <g key={h.id} {...handlers}>
                <ellipse cx={h.x} cy={cy} rx={h.size + 4} ry={h.size - 2}
                         fill={h.c} stroke={stroke} strokeWidth="2.4"/>
                <ellipse cx={h.x - h.size * .35} cy={cy - h.size * .3}
                         rx={h.size * .35} ry={h.size * .2}
                         fill="rgba(255,255,255,.45)"/>
                <circle cx={h.x - 2} cy={cy + 1} r="1.4" fill="#1b1b1b" opacity=".55"/>
                <circle cx={h.x + 4} cy={cy + 2} r="1.2" fill="#1b1b1b" opacity=".5"/>
              </g>
            );
          }
          if (h.shape === "pentagon") {
            const s = h.size;
            const pts = [0, 1, 2, 3, 4].map(i => {
              const a = -Math.PI / 2 + (i * 2 * Math.PI) / 5;
              return `${h.x + Math.cos(a) * s},${cy + Math.sin(a) * s}`;
            }).join(" ");
            return (
              <g key={h.id} {...handlers}>
                <polygon points={pts} fill={h.c} stroke={stroke} strokeWidth="2.4"
                         strokeLinejoin="round"/>
                <circle cx={h.x - 1} cy={cy + 1} r="1.5" fill="#1b1b1b" opacity=".55"/>
              </g>
            );
          }
          if (h.shape === "shield") {
            const s = h.size;
            return (
              <g key={h.id} {...handlers}>
                <path d={`M${h.x} ${cy - s} Q${h.x + s} ${cy - s * .3} ${h.x + s * .5} ${cy + s * .9}
                          Q${h.x} ${cy + s * 1.1} ${h.x - s * .5} ${cy + s * .9}
                          Q${h.x - s} ${cy - s * .3} ${h.x} ${cy - s} Z`}
                      fill={h.c} stroke={stroke} strokeWidth="2.4" strokeLinejoin="round"/>
                <circle cx={h.x - 2} cy={cy} r="1.4" fill="#1b1b1b" opacity=".55"/>
                <circle cx={h.x + 3} cy={cy + 4} r="1.2" fill="#1b1b1b" opacity=".5"/>
              </g>
            );
          }
          const s = h.size;
          return (
            <g key={h.id} {...handlers}>
              {["#d97757", "#efb24a", "#9bb18e", "#6a8ab0", "#9a6fb0"].map((rc, i) => (
                <rect key={i} x={h.x + s + 4 + i * 5} y={cy - s + 2} width="3" height="14"
                      fill={rc} stroke={stroke} strokeWidth="1"
                      transform={`rotate(${-30 + i * 15} ${h.x + s + 4} ${cy - s})`}/>
              ))}
              <path d={`M${h.x} ${cy - s} Q${h.x + s * 1.1} ${cy - s * .4} ${h.x + s * .6} ${cy + s}
                        Q${h.x} ${cy + s * 1.1} ${h.x - s * .6} ${cy + s}
                        Q${h.x - s * 1.1} ${cy - s * .4} ${h.x} ${cy - s} Z`}
                    fill={h.c} stroke={stroke} strokeWidth="2.5" strokeLinejoin="round"/>
              <circle cx={h.x - 1} cy={cy + 2} r="1.5" fill="#1b1b1b" opacity=".6"/>
            </g>
          );
        })}
        <text x={W / 2} y="22" fontSize="14" textAnchor="middle"
              fontFamily="Caveat" fill="#d97757">登顶 ✦</text>
      </svg>
    </div>
  );
}

// ============================================================
// Bed
// ============================================================
function Bed({ highlighted, lying }) {
  return (
    <div style={{ position: "relative", width: 244, height: 130,
                  filter: highlighted ? "drop-shadow(0 0 14px rgba(217,119,87,.55))" : "none",
                  transition: "filter .25s" }}>
      <svg width="244" height="130" viewBox="0 0 244 130" style={{ display: "block" }}>
        <rect x="4" y="22" width="22" height="98"
              fill="#a77a4a" stroke="#1b1b1b" strokeWidth="2.5" filter="url(#wobble)"/>
        <rect x="22" y="60" width="216" height="34"
              fill="#fffdf6" stroke="#1b1b1b" strokeWidth="2.5" filter="url(#wobble)"/>
        <path d="M86 60 L238 60 L240 94 L82 94 Z"
              fill="#c97a83" stroke="#1b1b1b" strokeWidth="2.5"
              strokeLinejoin="round" filter="url(#wobble)"/>
        <line x1="104" y1="62" x2="106" y2="92" stroke="rgba(255,255,255,.4)" strokeWidth="1.4"/>
        <line x1="146" y1="62" x2="149" y2="92" stroke="rgba(255,255,255,.4)" strokeWidth="1.4"/>
        <line x1="188" y1="62" x2="191" y2="92" stroke="rgba(255,255,255,.4)" strokeWidth="1.4"/>
        <line x1="228" y1="62" x2="231" y2="92" stroke="rgba(255,255,255,.4)" strokeWidth="1.4"/>

        {!lying && (
          <>
            <rect x="30" y="48" width="50" height="22"
                  fill="#fef3a3" stroke="#1b1b1b" strokeWidth="2.5"
                  filter="url(#wobble)" rx="4"/>
            <line x1="38" y1="54" x2="74" y2="54" stroke="rgba(27,27,27,.22)" strokeWidth="1"/>
          </>
        )}

        {lying && (
          <>
            <ellipse cx="50" cy="56" rx="20" ry="14"
                     fill="#fef3a3" stroke="#1b1b1b" strokeWidth="2.5" filter="url(#wobble)"/>
            <circle cx="62" cy="56" r="11"
                    fill="#e9b88a" stroke="#1b1b1b" strokeWidth="2.2" filter="url(#wobble)"/>
            <path d="M58 56 Q61 58 64 56" stroke="#1b1b1b" strokeWidth="1.8"
                  fill="none" strokeLinecap="round"/>
            <path d="M52 50 Q58 44 66 48" stroke="#1b1b1b" strokeWidth="2.2"
                  fill="none" strokeLinecap="round"/>
            <path d="M86 70 Q160 50 232 76 L232 92 L86 92 Z"
                  fill="#b06876" stroke="#1b1b1b" strokeWidth="2.4"
                  strokeLinejoin="round" filter="url(#wobble)"/>
          </>
        )}

        <rect x="22" y="94" width="216" height="10" fill="#7a5a36" stroke="#1b1b1b" strokeWidth="2.5"/>
        <rect x="26" y="104" width="9" height="18" fill="#7a5a36" stroke="#1b1b1b" strokeWidth="2"/>
        <rect x="226" y="104" width="9" height="18" fill="#7a5a36" stroke="#1b1b1b" strokeWidth="2"/>

        <g transform="translate(168, 36)" filter="url(#wobble)">
          <ellipse cx="22" cy="22" rx="22" ry="9" fill="#1b1b1b"/>
          <circle cx="4" cy="18" r="7" fill="#1b1b1b"/>
          <path d="M-1 13 L-2 5 L3 12 Z" fill="#1b1b1b"/>
          <path d="M9 12 L10 4 L5 11 Z" fill="#1b1b1b"/>
          <circle cx="4" cy="20" r="0.7" fill="#fef3a3"/>
          <path d="M40 22 Q50 18 46 12" stroke="#1b1b1b" strokeWidth="2" fill="none" strokeLinecap="round"/>
        </g>
        <text x="158" y="34" fontSize="14" fill="#1b1b1b" fontFamily="Caveat">zZ</text>

        {lying && (
          <g fontFamily="Caveat" fill="#1b1b1b">
            <text x="78" y="42" fontSize="16" className="bed-z bed-z-1">z</text>
            <text x="86" y="30" fontSize="20" className="bed-z bed-z-2">Z</text>
            <text x="96" y="18" fontSize="24" className="bed-z bed-z-3">Z</text>
          </g>
        )}
      </svg>
    </div>
  );
}

// ============================================================
// Fish tank
// ============================================================
function FishTank({ highlighted, feedTick }) {
  const TANK_W = 160, TANK_H = 110;
  const initFish = () => [
    { x: 30,  y: 30, vx:  46, c: "#d97757", id: 0 },
    { x: 130, y: 70, vx: -38, c: "#efb24a", id: 1 },
    { x: 70,  y: 86, vx:  32, c: "#6a8ab0", id: 2 },
    { x: 110, y: 50, vx: -42, c: "#c97a83", id: 3 },
  ];
  const [fish, setFish] = useState(initFish);
  const [flakes, setFlakes] = useState([]);
  const flakesRef = useRef([]);
  const fishRef = useRef(initFish());
  const lastT = useRef(performance.now());
  const flakeId = useRef(0);

  useEffect(() => {
    if (feedTick === 0) return;
    const nFlakes = 4;
    const spawned = [];
    for (let i = 0; i < nFlakes; i++) {
      spawned.push({
        id: flakeId.current++,
        x: 40 + Math.random() * (TANK_W - 80),
        y: -6 - i * 4,
        vy: 26 + Math.random() * 14,
      });
    }
    flakesRef.current = [...flakesRef.current, ...spawned];
    setFlakes([...flakesRef.current]);
  }, [feedTick]);

  useEffect(() => {
    let raf;
    lastT.current = performance.now();
    const loop = (now) => {
      const dt = Math.min(0.04, (now - lastT.current) / 1000);
      lastT.current = now;

      const next = [];
      for (const f of flakesRef.current) {
        f.y += f.vy * dt;
        const eaten = fishRef.current.some(fi =>
          Math.hypot(fi.x - f.x, fi.y - f.y) < 14
        );
        if (!eaten && f.y < TANK_H - 14) next.push(f);
      }
      flakesRef.current = next;

      for (const fi of fishRef.current) {
        let target = null, bestD = 90;
        for (const f of flakesRef.current) {
          const d = Math.hypot(f.x - fi.x, f.y - fi.y);
          if (d < bestD) { bestD = d; target = f; }
        }
        if (target) {
          const dx = target.x - fi.x, dy = target.y - fi.y;
          const d = Math.hypot(dx, dy) || 1;
          const speed = 70;
          fi.vx = (dx / d) * speed;
          fi.x  += fi.vx * dt;
          fi.y  += (dy / d) * speed * dt;
        } else {
          fi.x += fi.vx * dt;
          fi.y += Math.sin(now / 700 + fi.id) * 8 * dt;
          if (fi.x < 14) { fi.x = 14; fi.vx = Math.abs(fi.vx); }
          if (fi.x > TANK_W - 14) { fi.x = TANK_W - 14; fi.vx = -Math.abs(fi.vx); }
        }
        fi.y = Math.max(8, Math.min(TANK_H - 18, fi.y));
      }
      setFish([...fishRef.current]);
      setFlakes([...flakesRef.current]);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <div style={{ position: "relative", width: 180, height: 200,
                  filter: highlighted ? "drop-shadow(0 0 14px rgba(217,119,87,.55))" : "none",
                  transition: "filter .25s" }}>
      <svg width="180" height="200" viewBox="0 0 180 200" style={{ display: "block" }}>
        <path d="M10 168 L168 168 L172 184 L8 184 Z"
              fill="#a77a4a" stroke="#1b1b1b" strokeWidth="2.5"
              strokeLinejoin="round" filter="url(#wobble)"/>
        <rect x="20" y="184" width="9" height="16" fill="#7a5a36" stroke="#1b1b1b" strokeWidth="2"/>
        <rect x="151" y="184" width="9" height="16" fill="#7a5a36" stroke="#1b1b1b" strokeWidth="2"/>
      </svg>
      {/* Fish tank glass — own compositor layer so the wobble border
          doesn't trail when the camera scrolls past. The fish + flakes
          inside are already on the GPU dirty-rect track via translate3d. */}
      <div style={{
        position: "absolute", left: 10, bottom: 32, width: TANK_W, height: TANK_H,
        background: "linear-gradient(180deg, #a8c8e0 0%, #6a8ab0 100%)",
        border: "3px solid #1b1b1b", filter: "url(#wobble)",
        transform: "translateZ(0)",
        overflow: "hidden",
      }}>
        {[20, 56, 90, 126].map((bx, i) => (
          <div key={i} style={{
            position: "absolute", left: bx, bottom: 6, width: 7, height: 7,
            borderRadius: "50%", background: "rgba(255,255,255,.7)",
            animation: `tank-bubble ${2.4 + i * 0.4}s linear infinite`,
            animationDelay: `${-i * 0.7}s`,
          }}/>
        ))}
        {/* Fish + flakes use transform: translate3d, not left/top. The
            tank parent has filter: url(#wobble), and per-frame left/top
            on its children is the textbook WebKit paint-trail pattern.
            Inner scaleX/rotate go on a wrapper child so they don't ride
            the per-frame transform path. */}
        {fish.map(fi => (
          <div key={fi.id} style={{
            position: "absolute", left: 0, top: 0,
            transform: `translate3d(${fi.x - 18}px, ${fi.y - 8}px, 0)`,
            width: 36, height: 16, pointerEvents: "none",
            willChange: "transform",
          }}>
            <div style={{ transform: fi.vx < 0 ? "scaleX(-1)" : "none" }}>
              <svg width="36" height="16" viewBox="0 0 36 16">
                <ellipse cx="14" cy="8" rx="13" ry="6.5"
                         fill={fi.c} stroke="#1b1b1b" strokeWidth="1.5"/>
                <path d="M27 8 L36 2 L36 14 Z"
                      fill={fi.c} stroke="#1b1b1b" strokeWidth="1.5" strokeLinejoin="round"/>
                <path d="M14 2 L18 -2 L20 4 Z"
                      fill={fi.c} stroke="#1b1b1b" strokeWidth="1.2"/>
                <circle cx="6" cy="6.5" r="1.3" fill="#1b1b1b"/>
                <circle cx="5.4" cy="6" r=".5" fill="#fffdf6"/>
                <path d="M0 8 Q3 6 3 8 Q3 10 0 8" fill={fi.c} stroke="#1b1b1b" strokeWidth="1"/>
              </svg>
            </div>
          </div>
        ))}
        {flakes.map(f => (
          <div key={f.id} style={{
            position: "absolute", left: 0, top: 0,
            transform: `translate3d(${f.x - 3}px, ${f.y}px, 0) rotate(${(f.id * 47) % 90}deg)`,
            width: 6, height: 6,
            background: "#7a5a36", borderRadius: 1.5,
            pointerEvents: "none",
            willChange: "transform",
          }}/>
        ))}
        <div style={{
          position: "absolute", left: 0, right: 0, bottom: 0, height: 12,
          background: "#cfb37a",
          borderTop: "1.5px solid rgba(27,27,27,.5)",
        }}/>
        <svg style={{ position: "absolute", left: 116, bottom: 10 }}
             width="26" height="40" viewBox="0 0 26 40">
          <path d="M13 38 Q4 26 8 6"  stroke="#5e7a4f" strokeWidth="2.6" fill="none" strokeLinecap="round"/>
          <path d="M13 38 Q22 26 18 6" stroke="#5e7a4f" strokeWidth="2.6" fill="none" strokeLinecap="round"/>
          <path d="M13 38 Q13 24 13 8" stroke="#5e7a4f" strokeWidth="2.2" fill="none" strokeLinecap="round"/>
        </svg>
        {feedTick > 0 && (
          <div key={feedTick} style={{
            position: "absolute", left: "50%", top: 0,
            width: 40, height: 6, marginLeft: -20,
            border: "2px solid rgba(255,255,255,.6)", borderRadius: "50%",
            animation: "tank-ripple .9s ease-out forwards",
          }}/>
        )}
      </div>
      <div style={{
        position: "absolute", left: 8, bottom: 166, width: 164, height: 6,
        background: "#7a5a36", border: "2px solid #1b1b1b",
      }}/>
    </div>
  );
}

// ============================================================
// Bookshelf
// ============================================================
const BOOK_ROWS = [
  ["#d97757", "#efb24a", "#cfe0c6", "#a8c8e0", "#c97a83", "#9bb18e", "#fef3a3"],
  ["#cfe0c6", "#9a6fb0", "#fef3a3", "#d97757", "#a8c8e0", "#c97a83"],
  ["#a77a4a", "#9bb18e", "#efb24a", "#6a8ab0", "#cfe0c6", "#c97a83", "#9a6fb0", "#fef3a3"],
];
function Bookshelf({ highlighted }) {
  return (
    <div style={{ position: "relative", width: 128, height: 200,
                  filter: highlighted ? "drop-shadow(0 0 14px rgba(217,119,87,.55))" : "none",
                  transition: "filter .25s" }}>
      <svg width="128" height="200" viewBox="0 0 128 200" style={{ display: "block" }}>
        <rect x="4" y="4" width="120" height="192"
              fill="#a77a4a" stroke="#1b1b1b" strokeWidth="2.5" filter="url(#wobble)"/>
        <rect x="10" y="10" width="108" height="180" fill="#e9d8b5"/>
        {[60, 116, 172].map((sy, i) => {
          const row = BOOK_ROWS[i];
          let xCursor = 14;
          return (
            <g key={i}>
              <rect x="10" y={sy} width="108" height="6"
                    fill="#7a5a36" stroke="#1b1b1b" strokeWidth="1.5"/>
              {row.map((color, j) => {
                const wBook = 11 + ((j * 7) % 6);
                const hBook = 36 + ((j * 5) % 12);
                const tilt = (j % 5 === 4) ? -8 : 0;
                const xb = xCursor;
                xCursor += wBook + 1;
                return (
                  <g key={j} transform={tilt ? `rotate(${tilt} ${xb + wBook / 2} ${sy})` : undefined}>
                    <rect x={xb} y={sy - hBook} width={wBook} height={hBook}
                          fill={color} stroke="#1b1b1b" strokeWidth="1.4" filter="url(#wobble)"/>
                    <line x1={xb + 2} y1={sy - hBook + 6} x2={xb + wBook - 2} y2={sy - hBook + 6}
                          stroke="rgba(27,27,27,.35)" strokeWidth="0.8"/>
                  </g>
                );
              })}
            </g>
          );
        })}
        <text x="118" y="186" fontSize="14" textAnchor="end"
              fontFamily="Caveat" fill="#7a6648">·books·</text>
      </svg>
    </div>
  );
}

// ============================================================
// Desk
// ============================================================
function Desk({ highlighted }) {
  return (
    <div style={{ position: "relative", width: 220, height: 170,
                  filter: highlighted ? "drop-shadow(0 0 14px rgba(217,119,87,.55))" : "none",
                  transition: "filter .25s" }}>
      <svg width="220" height="170" viewBox="0 0 220 170" style={{ display: "block" }}>
        <path d="M14 110 L206 110 L210 124 L10 124 Z"
              fill="#a77a4a" stroke="#1b1b1b" strokeWidth="2.5"
              strokeLinejoin="round" filter="url(#wobble)"/>
        <rect x="22" y="124" width="10" height="44" fill="#7a5a36" stroke="#1b1b1b" strokeWidth="2"/>
        <rect x="188" y="124" width="10" height="44" fill="#7a5a36" stroke="#1b1b1b" strokeWidth="2"/>
        <rect x="60" y="128" width="60" height="22" fill="#8b6539" stroke="#1b1b1b" strokeWidth="2" filter="url(#wobble)"/>
        <circle cx="90" cy="139" r="1.8" fill="#1b1b1b"/>
        {/* 专注圈 — a small alarm clock; the pomodoro ring lives on its face */}
        <line x1="100" y1="106" x2="96" y2="112" stroke="#1b1b1b" strokeWidth="2" strokeLinecap="round"/>
        <line x1="116" y1="106" x2="120" y2="112" stroke="#1b1b1b" strokeWidth="2" strokeLinecap="round"/>
        <circle cx="100" cy="78" r="5" fill="#d97757" stroke="#1b1b1b" strokeWidth="1.8" filter="url(#wobble)"/>
        <circle cx="116" cy="78" r="5" fill="#d97757" stroke="#1b1b1b" strokeWidth="1.8" filter="url(#wobble)"/>
        <path d="M103 74 Q108 68 113 74" fill="none" stroke="#1b1b1b" strokeWidth="1.8" strokeLinecap="round"/>
        <line x1="108" y1="69" x2="108" y2="74" stroke="#1b1b1b" strokeWidth="1.6"/>
        <circle cx="108" cy="93" r="15" fill="#fef3a3" stroke="#1b1b1b" strokeWidth="2.2" filter="url(#wobble)"/>
        <circle cx="108" cy="93" r="11" fill="#fffdf6" stroke="#cfe0c6" strokeWidth="2.6"/>
        <circle cx="108" cy="93" r="11" fill="none" stroke="#d97757" strokeWidth="2.6"
                strokeDasharray="69" strokeDashoffset="26" strokeLinecap="round"
                transform="rotate(-90 108 93)"/>
        <line x1="108" y1="93" x2="108" y2="86" stroke="#1b1b1b" strokeWidth="1.6" strokeLinecap="round"/>
        <line x1="108" y1="93" x2="113" y2="95" stroke="#1b1b1b" strokeWidth="1.6" strokeLinecap="round"/>
        <circle cx="108" cy="93" r="1.6" fill="#1b1b1b"/>
        <g filter="url(#wobble)">
          <rect x="22" y="100" width="16" height="6" fill="#1b1b1b"/>
          <line x1="30" y1="100" x2="30" y2="76" stroke="#1b1b1b" strokeWidth="2.5"/>
          <line x1="30" y1="76" x2="52" y2="60" stroke="#1b1b1b" strokeWidth="2.5"/>
          <path d="M52 60 L70 50 L62 72 Z"
                fill="#fef3a3" stroke="#1b1b1b" strokeWidth="2"/>
          <ellipse cx="80" cy="108" rx="36" ry="4" fill="rgba(254,243,163,.6)"/>
        </g>
        <g filter="url(#wobble)">
          <rect x="166" y="100" width="32" height="6" fill="#c97a83" stroke="#1b1b1b" strokeWidth="1.5"/>
          <rect x="168" y="93" width="28" height="7" fill="#9bb18e" stroke="#1b1b1b" strokeWidth="1.5"/>
          <rect x="170" y="85" width="24" height="8" fill="#fef3a3" stroke="#1b1b1b" strokeWidth="1.5"/>
        </g>
        <g filter="url(#wobble)">
          <rect x="40" y="92" width="14" height="14" fill="#fffdf6" stroke="#1b1b1b" strokeWidth="1.5"/>
          <path d="M54 95 Q60 98 54 102" stroke="#1b1b1b" strokeWidth="1.5" fill="none"/>
          <path d="M44 88 Q46 84 44 80" stroke="#1b1b1b" strokeWidth="1.2" fill="none"/>
          <path d="M50 88 Q52 84 50 80" stroke="#1b1b1b" strokeWidth="1.2" fill="none"/>
        </g>
      </svg>
    </div>
  );
}

// ============================================================
// Stool — a small wooden stool next to the desk
// ============================================================
function Stool() {
  return (
    <svg width="56" height="64" viewBox="0 0 56 64" style={{ display: "block" }}>
      {/* back leg */}
      <line x1="28" y1="15" x2="28" y2="60" stroke="#8b6539" strokeWidth="4.5" strokeLinecap="round"/>
      {/* seat */}
      <ellipse cx="28" cy="14" rx="22" ry="7.5"
               fill="#c97a83" stroke="#1b1b1b" strokeWidth="2.5" filter="url(#wobble)"/>
      {/* front legs */}
      <line x1="10" y1="17" x2="7" y2="62" stroke="#7a5a36" strokeWidth="4.5" strokeLinecap="round"/>
      <line x1="46" y1="17" x2="49" y2="62" stroke="#7a5a36" strokeWidth="4.5" strokeLinecap="round"/>
      {/* stretcher */}
      <line x1="9" y1="42" x2="47" y2="42" stroke="#7a5a36" strokeWidth="3"/>
    </svg>
  );
}

// ============================================================
// Seated character — back to camera, used at the desk
// ============================================================
function SittingChar() {
  return (
    <svg width="56" height="92" viewBox="0 0 56 92" style={{ display: "block" }}>
      {/* hair / back of head */}
      <path d="M16 20 Q28 9 40 20 Q40 31 28 31 Q16 31 16 20 Z"
            fill="#1b1b1b" filter="url(#wobble)"/>
      <circle cx="28" cy="20" r="11" fill="#e9b88a" stroke="#1b1b1b" strokeWidth="2"/>
      {/* shirt back */}
      <path d="M17 30 L39 30 L41 62 L15 62 Z"
            fill="#c97a83" stroke="#1b1b1b" strokeWidth="2"
            strokeLinejoin="round" filter="url(#wobble)"/>
      {/* arms resting forward */}
      <line x1="18" y1="37" x2="15" y2="56" stroke="#e9b88a" strokeWidth="6.5" strokeLinecap="round"/>
      <line x1="38" y1="37" x2="41" y2="56" stroke="#e9b88a" strokeWidth="6.5" strokeLinecap="round"/>
      <line x1="18" y1="37" x2="15" y2="56" stroke="#1b1b1b" strokeWidth="1.2" strokeLinecap="round"/>
      <line x1="38" y1="37" x2="41" y2="56" stroke="#1b1b1b" strokeWidth="1.2" strokeLinecap="round"/>
      {/* lap / thighs */}
      <path d="M14 60 L42 60 L43 80 L13 80 Z"
            fill="#26344f" stroke="#1b1b1b" strokeWidth="2" strokeLinejoin="round"/>
    </svg>
  );
}

// ============================================================
// About-me easel — a canvas on a tripod with a little portrait
// ============================================================
function AboutEasel({ highlighted }) {
  return (
    <div style={{ position: "relative", width: 120, height: 210,
                  filter: highlighted ? "drop-shadow(0 0 14px rgba(217,119,87,.55))" : "none",
                  transition: "filter .25s" }}>
      <svg width="120" height="210" viewBox="0 0 120 210" style={{ display: "block" }}>
        {/* tripod legs */}
        <line x1="60" y1="30" x2="20" y2="204" stroke="#7a5a36" strokeWidth="6" strokeLinecap="round"/>
        <line x1="60" y1="30" x2="100" y2="204" stroke="#7a5a36" strokeWidth="6" strokeLinecap="round"/>
        <line x1="60" y1="48" x2="74" y2="208" stroke="#8b6539" strokeWidth="5" strokeLinecap="round"/>
        {/* canvas ledge */}
        <line x1="26" y1="142" x2="94" y2="142" stroke="#7a5a36" strokeWidth="7" strokeLinecap="round"/>
        {/* canvas */}
        <rect x="30" y="40" width="60" height="104"
              fill="#fffdf6" stroke="#1b1b1b" strokeWidth="2.6" filter="url(#wobble)"/>
        {/* a small self-portrait painted on it — glasses, long hair */}
        <path d="M44 130 Q60 76 76 130 Z"
              fill="#6f8f6a" stroke="#1b1b1b" strokeWidth="2" strokeLinejoin="round"/>
        {/* neck */}
        <rect x="55" y="94" width="10" height="11" fill="#e9b88a" stroke="#1b1b1b" strokeWidth="1.6"/>
        {/* long hair — one smooth shape framing the head */}
        <path d="M60 62 Q42 63 41 84 Q40 110 49 124 Q51 106 50 92
                 Q50 76 60 72 Q70 76 70 92 Q69 106 71 124
                 Q80 110 79 84 Q78 63 60 62 Z"
              fill="#3a2c22" stroke="#1b1b1b" strokeWidth="1.8"
              strokeLinejoin="round" filter="url(#wobble)"/>
        <circle cx="51" cy="86" r="3.4" fill="#e9b88a" stroke="#1b1b1b" strokeWidth="1.6"/>
        <circle cx="69" cy="86" r="3.4" fill="#e9b88a" stroke="#1b1b1b" strokeWidth="1.6"/>
        <circle cx="60" cy="84" r="16" fill="#e9b88a" stroke="#1b1b1b" strokeWidth="2"/>
        {/* round glasses */}
        <circle cx="54" cy="85" r="6.4" fill="#cfe0c6" fillOpacity=".4"
                stroke="#1b1b1b" strokeWidth="2"/>
        <circle cx="67" cy="85" r="6.4" fill="#cfe0c6" fillOpacity=".4"
                stroke="#1b1b1b" strokeWidth="2"/>
        <path d="M59 84 Q60.5 82 62 84" fill="none" stroke="#1b1b1b" strokeWidth="1.8"/>
        <circle cx="54" cy="85" r="1.7" fill="#1b1b1b"/>
        <circle cx="67" cy="85" r="1.7" fill="#1b1b1b"/>
        {/* freckles + smile */}
        <circle cx="49" cy="92" r=".9" fill="#b07c4a"/>
        <circle cx="52" cy="94" r=".9" fill="#b07c4a"/>
        <circle cx="69" cy="92" r=".9" fill="#b07c4a"/>
        <circle cx="72" cy="94" r=".9" fill="#b07c4a"/>
        <path d="M55 94 Q60.5 99 66 94" stroke="#1b1b1b" strokeWidth="1.8"
              fill="none" strokeLinecap="round"/>
        {/* wooden placard */}
        <rect x="34" y="150" width="52" height="20" rx="2"
              fill="#fef3a3" stroke="#1b1b1b" strokeWidth="2" filter="url(#wobble)"/>
        <text x="60" y="164" fontSize="13" textAnchor="middle"
              fontFamily="Caveat" fill="#1b1b1b">关于我</text>
      </svg>
    </div>
  );
}

// ============================================================
// Plant
// ============================================================
function Plant() {
  return (
    <svg width="70" height="120" viewBox="0 0 70 120" style={{ display: "block" }}>
      <path d="M16 96 L54 96 L50 116 L20 116 Z"
            fill="#c97a83" stroke="#1b1b1b" strokeWidth="2.5"
            strokeLinejoin="round" filter="url(#wobble)"/>
      <line x1="14" y1="96" x2="56" y2="96" stroke="#1b1b1b" strokeWidth="2.5"/>
      <g filter="url(#wobble)">
        <path d="M35 96 Q22 80 20 60 Q26 64 32 80 Z"
              fill="#9bb18e" stroke="#1b1b1b" strokeWidth="2"/>
        <path d="M35 96 Q44 80 52 50 Q44 60 38 86 Z"
              fill="#7f9a76" stroke="#1b1b1b" strokeWidth="2"/>
        <path d="M35 96 Q34 70 30 30 Q40 56 40 88 Z"
              fill="#9bb18e" stroke="#1b1b1b" strokeWidth="2"/>
      </g>
    </svg>
  );
}

// ============================================================
// Switch console — 网吧考古学家 (a small handheld on the bed)
// ============================================================
function SwitchConsole({ highlighted }) {
  return (
    <div style={{ position: "relative", width: 70, height: 50,
                  filter: highlighted ? "drop-shadow(0 0 12px rgba(217,119,87,.6))" : "none",
                  transition: "filter .25s" }}>
      <svg width="70" height="50" viewBox="0 0 70 50" style={{ display: "block" }}>
        <g transform="rotate(-6 35 28)">
          {/* left Joy-Con (neon blue) */}
          <path d="M11 18 Q6 18 6 23 L6 35 Q6 40 11 40 L18 40 L18 18 Z"
                fill="#19b3e6" stroke="#1b1b1b" strokeWidth="1.8" filter="url(#wobble)"/>
          <circle cx="12" cy="25" r="2.4" fill="#0a0d12" stroke="#1b1b1b" strokeWidth="1.2"/>
          {/* right Joy-Con (neon red) */}
          <path d="M59 18 Q64 18 64 23 L64 35 Q64 40 59 40 L52 40 L52 18 Z"
                fill="#e84b4b" stroke="#1b1b1b" strokeWidth="1.8" filter="url(#wobble)"/>
          <circle cx="58" cy="33" r="2.4" fill="#0a0d12" stroke="#1b1b1b" strokeWidth="1.2"/>
          {/* screen body */}
          <rect x="18" y="18" width="34" height="22" rx="2.5"
                fill="#2b2f36" stroke="#1b1b1b" strokeWidth="1.8" filter="url(#wobble)"/>
          {/* the dark café game on screen */}
          <rect x="21" y="21" width="28" height="16" rx="1.5" fill="#0c1118"/>
          <text x="35" y="32" textAnchor="middle" fontSize="6"
                fontFamily="JetBrains Mono" fill="#aee3c0"
                style={{ filter: "drop-shadow(0 0 3px rgba(120,230,170,.8))" }}>HOME</text>
        </g>
      </svg>
    </div>
  );
}

// ============================================================
// Spark cabinet — 灵感搜集器 (idea jar on a small cabinet under the window)
// ============================================================
function SparkCabinet({ highlighted }) {
  return (
    <div style={{ position: "relative", width: 80, height: 150,
                  filter: highlighted ? "drop-shadow(0 0 14px rgba(240,184,96,.6))" : "none",
                  transition: "filter .25s" }}>
      <svg width="80" height="150" viewBox="0 0 80 150" style={{ display: "block" }}>
        {/* small cabinet */}
        <rect x="10" y="92" width="60" height="48"
              fill="#a77a4a" stroke="#1b1b1b" strokeWidth="2.4" filter="url(#wobble)"/>
        <rect x="6" y="86" width="68" height="8" rx="2"
              fill="#8b6539" stroke="#1b1b1b" strokeWidth="2.2" filter="url(#wobble)"/>
        <line x1="40" y1="96" x2="40" y2="136" stroke="#1b1b1b" strokeWidth="1.6"/>
        <circle cx="36" cy="116" r="1.8" fill="#1b1b1b"/>
        <circle cx="44" cy="116" r="1.8" fill="#1b1b1b"/>
        <rect x="14" y="140" width="8" height="7" fill="#7a5a36" stroke="#1b1b1b" strokeWidth="1.5"/>
        <rect x="58" y="140" width="8" height="7" fill="#7a5a36" stroke="#1b1b1b" strokeWidth="1.5"/>

        {/* warm glow + small jar on top */}
        <circle cx="40" cy="56" r="24" fill="rgba(246,205,125,.4)"/>
        <path d="M28 50 Q28 45 33 45 L47 45 Q52 45 52 50 L53 80 Q53 86 40 86 Q27 86 27 80 Z"
              fill="rgba(246,205,125,.5)" stroke="#1b1b1b" strokeWidth="2.2"
              strokeLinejoin="round" filter="url(#wobble)"/>
        <path d="M32 53 Q30 70 34 82" fill="none" stroke="rgba(255,255,255,.6)" strokeWidth="2" strokeLinecap="round"/>
        <rect x="32" y="38" width="16" height="8" rx="2"
              fill="#e0a96a" stroke="#1b1b1b" strokeWidth="2" filter="url(#wobble)"/>
        {[[34, 62], [46, 58], [40, 74]].map(([sx, sy], i) => (
          <text key={i} x={sx} y={sy} textAnchor="middle"
                fontSize={9} fontFamily="Caveat" fill="#b9802a"
                style={{ animation: `mw-jardrift ${0.9 + (i % 3) * 0.4}s ease-in-out ${i * 0.15}s infinite alternate` }}>✦</text>
        ))}
        <text x="40" y="28" textAnchor="middle" fontSize="10" fontFamily="Caveat" fill="#e8975c"
              style={{ animation: "mw-jardrift 1.4s ease-in-out infinite alternate" }}>✦</text>
      </svg>
    </div>
  );
}

// ============================================================
// Doodle wall panel — hand-drawn glyphs
// ============================================================
function DoodleGlyph({ kind, cx, cy }) {
  switch (kind) {
    case "note":
      return (
        <g stroke="#1b1b1b" strokeWidth="1.4" fill="#1b1b1b" strokeLinecap="round" strokeLinejoin="round">
          <line x1={cx + 4} y1={cy - 8} x2={cx + 4} y2={cy + 4} stroke="#1b1b1b"/>
          <ellipse cx={cx} cy={cy + 5} rx="4.5" ry="3" fill="#1b1b1b"/>
          <line x1={cx + 4} y1={cy - 8} x2={cx + 10} y2={cy - 5}/>
        </g>
      );
    case "star":
      return (
        <g fill="#1b1b1b" stroke="#1b1b1b" strokeWidth="1.2">
          <text x={cx} y={cy + 5} fontSize="16" textAnchor="middle"
                fontFamily="Caveat" fill="#1b1b1b">✦</text>
        </g>
      );
    case "flower":
      return (
        <g stroke="#1b1b1b" strokeWidth="1.4" strokeLinejoin="round">
          {[0,1,2,3,4].map(i => {
            const a = -Math.PI / 2 + (i * 2 * Math.PI) / 5;
            return <ellipse key={i}
              cx={cx + Math.cos(a) * 4} cy={cy + Math.sin(a) * 4}
              rx="3.4" ry="2.2" fill="#c97a83"
              transform={`rotate(${(a * 180) / Math.PI} ${cx + Math.cos(a) * 4} ${cy + Math.sin(a) * 4})`}/>;
          })}
          <circle cx={cx} cy={cy} r="2" fill="#fef3a3"/>
        </g>
      );
    case "gift":
      return (
        <g stroke="#1b1b1b" strokeWidth="1.4" strokeLinejoin="round">
          <rect x={cx - 6} y={cy - 4} width="12" height="10" fill="#d97757"/>
          <rect x={cx - 6} y={cy - 4} width="12" height="3" fill="#fef3a3"/>
          <line x1={cx} y1={cy - 4} x2={cx} y2={cy + 6}/>
          <path d={`M${cx - 3} ${cy - 7} Q${cx} ${cy - 4} ${cx + 3} ${cy - 7}
                    Q${cx + 6} ${cy - 4} ${cx + 3} ${cy - 4}
                    Q${cx} ${cy - 5} ${cx - 3} ${cy - 4}
                    Q${cx - 6} ${cy - 4} ${cx - 3} ${cy - 7} Z`}
                fill="#fef3a3"/>
        </g>
      );
    case "cup":
      return (
        <g stroke="#1b1b1b" strokeWidth="1.4" strokeLinejoin="round">
          <path d={`M${cx - 7} ${cy - 4} L${cx + 7} ${cy - 4} L${cx + 5} ${cy + 6} Q${cx} ${cy + 8} ${cx - 5} ${cy + 6} Z`}
                fill="#fffdf6"/>
          <rect x={cx - 7} y={cy - 4} width="14" height="2.4" fill="#c89058"/>
          <path d={`M${cx + 7} ${cy - 2} Q${cx + 11} ${cy + 1} ${cx + 7} ${cy + 4}`} fill="none"/>
          <path d={`M${cx - 2} ${cy - 8} Q${cx} ${cy - 10} ${cx - 2} ${cy - 12}`} fill="none" strokeWidth="1.2"/>
          <path d={`M${cx + 1} ${cy - 8} Q${cx + 3} ${cy - 10} ${cx + 1} ${cy - 12}`} fill="none" strokeWidth="1.2"/>
        </g>
      );
    case "pencil":
      return (
        <g stroke="#1b1b1b" strokeWidth="1.4" strokeLinejoin="round">
          <path d={`M${cx - 7} ${cy + 7} L${cx + 4} ${cy - 4} L${cx + 7} ${cy - 1} L${cx - 4} ${cy + 10} Z`}
                fill="#fef3a3"/>
          <path d={`M${cx + 4} ${cy - 4} L${cx + 7} ${cy - 1}`} stroke="#1b1b1b"/>
          <path d={`M${cx - 7} ${cy + 7} L${cx - 5} ${cy + 5} L${cx - 4} ${cy + 10} Z`} fill="#1b1b1b"/>
        </g>
      );
    default:
      return null;
  }
}
const DOODLE_TILES = [
  { x: 10,  y: 12, w: 38, h: 28, c: "#fef3a3", rot: -5, glyph: "note" },
  { x: 60,  y: 20, w: 36, h: 26, c: "#cfe0c6", rot:  3, glyph: "star" },
  { x: 104, y: 12, w: 38, h: 28, c: "#c97a83", rot: -2, glyph: "flower" },
  { x: 14,  y: 66, w: 38, h: 28, c: "#a8c8e0", rot:  2, glyph: "gift" },
  { x: 62,  y: 70, w: 36, h: 28, c: "#fef3a3", rot: -4, glyph: "cup" },
  { x: 106, y: 66, w: 38, h: 28, c: "#f7c5c0", rot:  4, glyph: "pencil" },
];
function DoodleWallPanel({ highlighted }) {
  return (
    <div style={{ position: "relative", width: 160, height: 110,
                  filter: highlighted ? "drop-shadow(0 0 14px rgba(217,119,87,.55))" : "none",
                  transition: "filter .25s" }}>
      <svg width="160" height="110" viewBox="0 0 160 110" style={{ display: "block" }}>
        <rect x="4" y="4" width="152" height="102" fill="#c8a374"
              stroke="#1b1b1b" strokeWidth="2.5" filter="url(#wobble)"/>
        {Array.from({ length: 22 }).map((_, i) => (
          <circle key={i}
                  cx={14 + ((i * 25) % 138) + Math.sin(i * 1.4) * 5}
                  cy={14 + Math.floor(i / 7) * 22 + Math.cos(i) * 4}
                  r="1.2" fill="rgba(120,80,40,.35)"/>
        ))}
        {DOODLE_TILES.map((p, i) => (
          <g key={i} transform={`rotate(${p.rot} ${p.x + p.w / 2} ${p.y + p.h / 2})`}
             filter="url(#wobble)">
            <rect x={p.x} y={p.y} width={p.w} height={p.h} fill={p.c}
                  stroke="#1b1b1b" strokeWidth="1.4"/>
            <DoodleGlyph kind={p.glyph} cx={p.x + p.w / 2} cy={p.y + p.h / 2 + 1}/>
            <circle cx={p.x + p.w / 2} cy={p.y + 3} r="2.6"
                    fill="#d97757" stroke="#1b1b1b" strokeWidth="1"/>
          </g>
        ))}
      </svg>
    </div>
  );
}

// ============================================================
// Window
// ============================================================
function RoomWindow({ worldLeft, bottomFromFloor }) {
  const W = WINDOW_W, H = WINDOW_H;
  return (
    <div style={{
      position: "absolute", left: worldLeft, bottom: FLOOR_H + bottomFromFloor,
      width: W, height: H,
      background: "linear-gradient(180deg, #a8c8de 0%, #cfe0c6 75%, #b8c89a 100%)",
      border: "4px solid #1b1b1b", filter: "url(#wobble)",
      transform: "translateZ(0)",
      boxShadow: "3px 4px 0 rgba(0,0,0,.18)", overflow: "hidden",
    }}>
      <div style={{
        position: "absolute", left: -10, bottom: -2, right: -10, height: 50,
        background: "#9bb18e",
        clipPath: "polygon(0 100%, 12% 60%, 28% 80%, 45% 45%, 62% 70%, 80% 40%, 100% 65%, 100% 100%)",
      }}/>
      <div style={{
        position: "absolute", left: 26, top: 22, width: 50, height: 18,
        background: "#fffdf6", borderRadius: "999px",
        border: "1.5px solid #1b1b1b", filter: "url(#wobble)",
      }}/>
      <div style={{
        position: "absolute", left: 130, top: 40, width: 60, height: 20,
        background: "#fffdf6", borderRadius: "999px",
        border: "1.5px solid #1b1b1b", filter: "url(#wobble)",
      }}/>
      <div style={{
        position: "absolute", right: 18, top: 16, width: 26, height: 26, borderRadius: "50%",
        background: "#fef3a3", border: "2px solid #1b1b1b", filter: "url(#wobble)",
      }}/>
      <div style={{ position: "absolute", left: 0, right: 0, top: "50%", height: 4,
        background: "#1b1b1b", transform: "translateY(-50%)" }}/>
      <div style={{ position: "absolute", top: 0, bottom: 0, left: "50%", width: 4,
        background: "#1b1b1b", transform: "translateX(-50%)" }}/>
      <div style={{
        position: "absolute", left: -10, right: -10, bottom: -10, height: 10,
        background: "#a77a4a", border: "2.5px solid #1b1b1b", filter: "url(#wobble)",
      }}/>
    </div>
  );
}

// ============================================================
// Record player
// ============================================================
function RecordPlayer({ highlighted }) {
  return (
    <div style={{ position: "relative", width: 140, height: 140,
                  filter: highlighted ? "drop-shadow(0 0 14px rgba(217,119,87,.55))" : "none",
                  transition: "filter .25s" }}>
      {/* SVG promoted to its own layer so the inner path's wobble filter
          result is cached past the camera's transform changes. */}
      <svg width="140" height="140" viewBox="0 0 140 140" style={{ display: "block", transform: "translateZ(0)" }}>
        <path d="M10 86 L130 86 L134 100 L6 100 Z"
              fill="#a77a4a" stroke="#1b1b1b" strokeWidth="2.5"
              strokeLinejoin="round" filter="url(#wobble)"/>
        <rect x="18" y="100" width="8" height="36" fill="#7a5a36" stroke="#1b1b1b" strokeWidth="2"/>
        <rect x="114" y="100" width="8" height="36" fill="#7a5a36" stroke="#1b1b1b" strokeWidth="2"/>

        <rect x="18" y="58" width="104" height="28" rx="3"
              fill="#fffdf6" stroke="#1b1b1b" strokeWidth="2.5" filter="url(#wobble)"/>
        <rect x="96" y="62" width="22" height="20" fill="#cfe0c6" stroke="#1b1b1b" strokeWidth="1.5"/>
        {Array.from({ length: 4 }).map((_, i) => (
          <line key={i} x1={100} y1={66 + i * 4} x2={114} y2={66 + i * 4}
                stroke="#1b1b1b" strokeWidth="0.8"/>
        ))}
        <circle cx="90" cy="72" r="2.8" fill="#d97757" stroke="#1b1b1b" strokeWidth="1.5"/>
      </svg>

      <div style={{
        position: "absolute", left: 22, bottom: 58, width: 64, height: 64,
      }}>
        <div style={{
          position: "absolute", inset: 0, borderRadius: "50%",
          background: "radial-gradient(circle at 35% 35%, #d97757 0%, #2a1a14 70%)",
          border: "2.5px solid #1b1b1b", filter: "url(#wobble)",
          animation: "mw-spin 6s linear infinite",
        }}/>
        <div style={{
          position: "absolute", inset: 10, borderRadius: "50%",
          border: "1.2px dashed rgba(255,255,255,.3)",
          animation: "mw-spin 6s linear infinite",
        }}/>
        <div style={{
          position: "absolute", inset: 22, borderRadius: "50%",
          background: "#fef3a3", border: "1.5px solid #1b1b1b",
        }}/>
        <div style={{
          position: "absolute", top: -6, right: -16, width: 30, height: 3.5,
          background: "#1b1b1b", transformOrigin: "right center",
          transform: "rotate(-22deg)",
        }}/>
        <div style={{
          position: "absolute", top: -10, right: -18, width: 7, height: 7,
          borderRadius: "50%", background: "#1b1b1b",
        }}/>
      </div>

      <div className="mw-twinkle sk-hand" style={{
        position: "absolute", left: 44, bottom: 108, fontSize: 16, color: "#d97757",
      }}>♪</div>
      <div className="mw-twinkle sk-hand" style={{
        position: "absolute", left: 70, bottom: 120, fontSize: 14, color: "#d97757",
        animationDelay: "0.6s",
      }}>♫</div>
    </div>
  );
}
