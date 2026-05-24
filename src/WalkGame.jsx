/* My World — 散步 · A Stroll Through My World  (简单版 / simple mode)
 *
 * A ~60-second side-scrolling walk through Arden's portfolio.
 * Mouse-only: click the ground to walk, click a sign to interact,
 * tap the floating ↑ button (or Space) to jump the puddle.
 * The world moves day → dusk → night as you head right.
 *
 * `onExit` returns to the title screen.
 */

import { useState, useEffect, useRef, useMemo } from 'react';

import {
  WORLD_WIDTH, GROUND_Y, groundLift,
  STOPS, WORKS, NOTES, TREE_POSITIONS,
  WALK_SPEED, JUMP_VEL, GRAVITY, CHAR_BASE_W, INTERACT_RADIUS,
  STORY_THOUGHTS, timeFor, skyPhase,
} from './world/data.js';
import { Char, Cat } from './world/Char.jsx';
import {
  SkyGradient, Sun, Stars, FarHills, NearHills,
  Ground, Clouds, Trees, Birds, Bushes,
} from './world/Background.jsx';
import { StopMarker } from './world/StopMarker.jsx';
import Dialog from './components/Dialog.jsx';
import WorkModal from './components/WorkModal.jsx';
import Overlay from './components/Overlay.jsx';
import { HUD, InteractPrompt } from './components/HUD.jsx';
import Gallery from './components/Gallery.jsx';
import DoodleWall from './components/DoodleWall.jsx';
import ContactCard from './components/ContactCard.jsx';
import ShowcaseFrame from './components/ShowcaseFrame.jsx';
import { HouseIcon, SpeakerIcon, ChunkyArrow } from './components/Icons.jsx';
import {
  initAudio, startBgm, playStep, playJump, playSplash, playStar, playOpen, playWin,
  isMuted, setMuted,
} from './world/sound.js';

export default function WalkGame({ onRoom }) {
  const [charX, setCharX] = useState(420);
  const [charY, setCharY] = useState(0);
  const [vy, setVy] = useState(0);
  const [facing, setFacing] = useState(1);
  const [walking, setWalking] = useState(false);
  const [splashing, setSplashing] = useState(false);
  const [target, setTarget] = useState(null);  // { x, then }
  const [overlay, setOverlay] = useState(null);
  const [dialog, setDialog] = useState(null);
  const [stars, setStars] = useState(0);
  const [collectedStars, setCollectedStars] = useState({});
  const [playCount, setPlayCount] = useState(() => {
    return parseInt(localStorage.getItem("mw-play-count") || "0", 10) + 1;
  });
  const [reached, setReached] = useState({});
  const [showEnd, setShowEnd] = useState(false);
  const [showGallery, setShowGallery] = useState(false);
  const [showcase, setShowcase] = useState(null); // { url, workId }
  const [viewport, setViewport] = useState({ w: window.innerWidth, h: window.innerHeight });
  const [showStartHint, setShowStartHint] = useState(true);
  const [splash, setSplash] = useState(null); // {x, y} for splash drops
  const [flowered, setFlowered] = useState({});
  const [lanternLit, setLanternLit] = useState(false); // lit only when clicked
  const [thought, setThought] = useState(null); // {id, text}
  const [muted, setMutedState] = useState(isMuted());
  const [showIntro, setShowIntro] = useState(true); // opening choice card
  const [showTutorial, setShowTutorial] = useState(false); // first-time tap zones
  const tutorialTimer = useRef();
  const [jumpPos, setJumpPos] = useState(() => {  // user-draggable jump button
    try {
      const s = JSON.parse(localStorage.getItem("mw-jump-pos") || "null");
      if (s && typeof s.right === "number") return s;
    } catch { /* ignore */ }
    return { right: 24, bottom: 150 };
  });
  const firedThoughts = useRef({});
  const thoughtTimer = useRef();
  const startTime = useRef(Date.now());
  const stepAcc = useRef(0); // footstep cadence accumulator
  const jumpDrag = useRef(null); // drag-state for repositioning the jump button
  const atLeftWall = useRef(false); // re-fires the left-wall thought only on (re-)entry

  const time = timeFor(charX);
  // Continuous 0→1 day→night for the sky layers. Quantised to ~40 steps so the
  // memoised scene doesn't re-render every frame; CSS transitions smooth the
  // gaps, giving a gradual sunset rather than a snap between states.
  const phase = Math.round(skyPhase(charX) * 40) / 40;
  const isMobile = viewport.w < 720 || matchMedia("(pointer:coarse)").matches;

  useEffect(() => {
    const r = () => setViewport({ w: window.innerWidth, h: window.innerHeight });
    window.addEventListener("resize", r);
    return () => window.removeEventListener("resize", r);
  }, []);

  // If audio is already running (e.g. we just came back from the room),
  // switch to the walk track immediately — no waiting for the first click.
  useEffect(() => { startBgm("walk"); }, []);

  // Camera
  const camX = Math.max(0, Math.min(WORLD_WIDTH - viewport.w, charX - viewport.w * 0.35));

  // ----- visible window (virtualisation) -----
  // The world is WORLD_WIDTH (~6800px) wide; rendering every tree, bush and
  // marker at once gives WebKit a layer too large to repaint smoothly while
  // it scrolls — hence the stutter and the blank strips on Safari. Build only
  // the slice near the camera. The window is snapped to coarse chunks so the
  // rendered set changes a few times per walk (not every frame), and it keeps
  // a full viewport of margin on each side — derived from the live measured
  // viewport, so it adapts to any screen — so nothing pops in on screen.
  const VCHUNK = 700;
  const renderKey = Math.floor(camX / VCHUNK);
  const winStart = renderKey * VCHUNK - viewport.w;
  const winEnd = renderKey * VCHUNK + VCHUNK + viewport.w * 2;
  // The far/mid parallax layers scroll at 0.3× / 0.6× the camera, so their
  // visible slice sits at a different offset — same chunk key, scaled span.
  const farWinStart = renderKey * VCHUNK * 0.3 - viewport.w;
  const farWinEnd = renderKey * VCHUNK * 0.3 + VCHUNK * 0.3 + viewport.w * 2;
  const midWinStart = renderKey * VCHUNK * 0.6 - viewport.w;
  const midWinEnd = renderKey * VCHUNK * 0.6 + VCHUNK * 0.6 + viewport.w * 2;

  // ----- mouse/touch click to walk -----
  const stageRef = useRef(null);

  const onStageDown = (e) => {
    initAudio(); startBgm("walk"); // first tap unlocks audio + starts the music
    if (overlay || dialog || showEnd || showGallery || showIntro || showTutorial) return;
    // ignore clicks on the HUD (handled separately)
    if (e.target.closest('.mw-skip, .mw-jump-btn, .mw-tap-zone')) return;

    const rect = stageRef.current.getBoundingClientRect();
    const localX = (e.clientX ?? e.touches?.[0]?.clientX) - rect.left;
    const worldX = localX + camX;
    setShowStartHint(false);

    // Tree hit: bloom flowers + walk toward tree
    const tree = TREE_POSITIONS.find(t => Math.abs(t.x - worldX) < 50);
    if (tree && !flowered[tree.id]) {
      setFlowered(prev => ({ ...prev, [tree.id]: true }));
    }

    // Check stops within radius (skip puddle — it's terrain)
    let chosenStop = null;
    let bestDist = INTERACT_RADIUS;
    for (const s of STOPS) {
      if (s.type === "puddle" || s.type === "start") continue;
      const d = Math.abs(s.x - worldX);
      if (d < bestDist) { bestDist = d; chosenStop = s; }
    }
    if (chosenStop) {
      setTarget({ x: chosenStop.x - (chosenStop.type === "work" || chosenStop.type === "knock" ? 50 : 0), then: () => handleStop(chosenStop) });
    } else {
      // Clicking off the playable left edge: nudge the player rightward.
      // The bubble is shown discretely here (one per click) rather than relying
      // on the game-loop wall detection, which doesn't notice a click when the
      // character is already pinned at x=80.
      if (worldX < 80) showLeftWallThought();
      setTarget({ x: Math.max(80, Math.min(WORLD_WIDTH - 80, worldX)), then: null });
    }
  };

  function showLeftWallThought() {
    setThought({
      id: `leftwall-${Date.now()}`,
      text: "往右走哦 →\n左边开发中,可以留言告诉我还想玩啥 (=^▽^=)",
      wrap: true,
    });
    clearTimeout(thoughtTimer.current);
    thoughtTimer.current = setTimeout(() => setThought(null), 3800);
  }

  // ----- jump button -----
  const onJump = () => {
    if (charY !== 0 || overlay || dialog || showEnd || showGallery || showIntro || showTutorial) return;
    keys.current.jumpRequested = true;
    setShowStartHint(false);
    // On mobile there's no key to hold for forward motion, so the jump
    // button does both at once: a forward hop through the jump arc.
    if (isMobile) {
      const dir = facing || 1;
      setTarget({
        x: Math.max(80, Math.min(WORLD_WIDTH - 80, charX + dir * 200)),
        then: null,
      });
    }
  };

  // jump button — a quick tap jumps; a drag repositions and remembers it
  const onJumpDown = (e) => {
    e.stopPropagation();
    e.currentTarget.setPointerCapture(e.pointerId);
    jumpDrag.current = { x: e.clientX, y: e.clientY, moved: false, pos: null };
  };
  const onJumpMove = (e) => {
    const d = jumpDrag.current;
    if (!d) return;
    if (Math.abs(e.clientX - d.x) > 7 || Math.abs(e.clientY - d.y) > 7) d.moved = true;
    if (d.moved) {
      const sz = 62;
      d.pos = {
        right: Math.max(6, Math.min(window.innerWidth - sz - 6, window.innerWidth - e.clientX - sz / 2)),
        bottom: Math.max(6, Math.min(window.innerHeight - sz - 6, window.innerHeight - e.clientY - sz / 2)),
      };
      setJumpPos(d.pos);
    }
  };
  const onJumpUp = (e) => {
    e.stopPropagation();
    const d = jumpDrag.current;
    jumpDrag.current = null;
    if (!d) return;
    if (d.moved && d.pos) {
      localStorage.setItem("mw-jump-pos", JSON.stringify({
        right: Math.round(d.pos.right), bottom: Math.round(d.pos.bottom),
      }));
    } else if (!d.moved) {
      onJump();
    }
  };

  // ----- keyboard: ← → (or A/D) walk, Space / ↑ / W jump -----
  const keys = useRef({ jumpRequested: false, left: false, right: false });
  useEffect(() => {
    const active = () => !dialog && !overlay && !showEnd && !showGallery && !showIntro && !showTutorial;
    const down = (e) => {
      if (!active()) return;
      if (e.key === " " || e.key === "ArrowUp" || e.key === "w" || e.key === "W") {
        keys.current.jumpRequested = true;
        e.preventDefault();
      } else if (e.key === "ArrowLeft" || e.key === "a" || e.key === "A") {
        keys.current.left = true;
        e.preventDefault();
      } else if (e.key === "ArrowRight" || e.key === "d" || e.key === "D") {
        keys.current.right = true;
        e.preventDefault();
      }
    };
    const up = (e) => {
      if (e.key === "ArrowLeft" || e.key === "a" || e.key === "A") keys.current.left = false;
      if (e.key === "ArrowRight" || e.key === "d" || e.key === "D") keys.current.right = false;
    };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
    };
  }, [dialog, overlay, showEnd, showGallery, showIntro, showTutorial]);

  // ----- game loop -----
  const lastT = useRef(performance.now());
  const stateRef = useRef({ x: 420, y: 0, vy: 0 });
  stateRef.current.x = charX; stateRef.current.y = charY; stateRef.current.vy = vy;

  useEffect(() => {
    let raf;
    const loop = (t) => {
      const dt = Math.min(0.04, (t - lastT.current) / 1000);
      lastT.current = t;

      let { x, y, vy: v } = stateRef.current;
      let isWalking = false;
      let curFacing = facing;

      // NOTE: splashing is purely cosmetic now — it never blocks walking,
      // so the puddle can be strolled straight through without jumping.
      const blocked = overlay || dialog || showGallery;
      const walkBlocked = blocked || showEnd;

      // walk — held ← → keys take priority, else head to the click target
      const keyDir = (keys.current.right ? 1 : 0) - (keys.current.left ? 1 : 0);
      if (keyDir !== 0 && !walkBlocked) {
        curFacing = keyDir;
        x += WALK_SPEED * dt * keyDir;
        isWalking = true;
        if (target) setTarget(null); // a key press cancels a pending click-walk
      } else if (target && !walkBlocked) {
        const dx = target.x - x;
        if (Math.abs(dx) < 6) {
          if (target.then) target.then();
          setTarget(null);
        } else {
          const dir = Math.sign(dx);
          curFacing = dir;
          x += WALK_SPEED * dt * dir;
          isWalking = true;
        }
      }

      // jump
      if (keys.current.jumpRequested && y === 0 && !blocked) {
        v = JUMP_VEL;
        keys.current.jumpRequested = false;
        if (!showEnd) playJump();
      }

      x = Math.max(80, Math.min(WORLD_WIDTH - 80, x));

      // Left-wall nudge (keyboard branch): when the player holds left against
      // the leftmost edge, pop the same thought. Click-driven nudges are
      // fired directly from onStageDown — see showLeftWallThought.
      const onLeftWall = x <= 80.5 && keyDir < 0 && !blocked && !showEnd;
      if (onLeftWall && !atLeftWall.current) {
        atLeftWall.current = true;
        showLeftWallThought();
      } else if (!onLeftWall) {
        atLeftWall.current = false;
      }

      // gravity
      if (y > 0 || v !== 0) {
        y += v * dt;
        v -= GRAVITY * dt;
        if (y <= 0) { y = 0; v = 0; }
      }

      // puddle collision: if walking past it on ground and not jumping high enough
      const puddleStop = STOPS.find(s => s.type === "puddle");
      if (puddleStop && !splashing) {
        const inPuddle = Math.abs(x - puddleStop.x) < 28;
        if (inPuddle && y < 14) {
          // splash! (but no hard reset — wet feet, continue)
          triggerSplash(x, puddleStop.x);
        }
      }

      // footsteps — a soft tick paced while walking on the ground
      if (isWalking && y < 6) {
        stepAcc.current += dt;
        if (stepAcc.current >= 0.3) { stepAcc.current = 0; playStep(); }
      } else {
        stepAcc.current = 0.3; // so the next step sounds the instant we move
      }

      stateRef.current = { x, y, vy: v };
      setCharX(x); setCharY(y); setVy(v); setWalking(isWalking); setFacing(curFacing);

      // star collection
      [[1700, 60], [1980, 85], [3400, 90], [5300, 70]].forEach(([sx, sy], i) => {
        if (!collectedStars[i] && Math.abs(x - sx) < 50 && Math.abs(y - sy) < 70) {
          setCollectedStars(prev => ({...prev, [i]: true}));
          setStars(s => s + 1);
          playStar();
        }
      });

      // peak end
      if (x > 6480 && !showEnd) setShowEnd(true);

      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [target, overlay, dialog, showEnd, showGallery, splashing, collectedStars, facing]);

  function triggerSplash(charXNow, puddleX) {
    // Soft splash — just briefly wet, no reset
    playSplash();
    setSplashing(true);
    setSplash({ x: puddleX, t: Date.now() });
    setTimeout(() => {
      setSplashing(false);
      setSplash(null);
    }, 700);
  }

  // ----- story thoughts: fire once as char enters each range -----
  useEffect(() => {
    if (overlay || dialog || showEnd || showGallery) return;
    for (const st of STORY_THOUGHTS) {
      if (firedThoughts.current[st.id]) continue;
      if (charX >= st.range[0] && charX <= st.range[1]) {
        firedThoughts.current[st.id] = true;
        setThought({ id: st.id, text: st.text });
        clearTimeout(thoughtTimer.current);
        thoughtTimer.current = setTimeout(() => setThought(null), 3800);
        break;
      }
    }
  }, [charX, overlay, dialog, showEnd, showGallery]);

  useEffect(() => () => clearTimeout(thoughtTimer.current), []);
  useEffect(() => () => clearTimeout(tutorialTimer.current), []);

  function openTutorial() {
    setShowTutorial(true);
    clearTimeout(tutorialTimer.current);
    tutorialTimer.current = setTimeout(() => setShowTutorial(false), 5000);
  }
  function dismissTutorial() {
    clearTimeout(tutorialTimer.current);
    setShowTutorial(false);
  }

  // Bounce in place when showEnd reached (continuously hop)
  useEffect(() => {
    if (!showEnd) return;
    playWin();
    const id = setInterval(() => {
      if (stateRef.current.y < 5) keys.current.jumpRequested = true;
    }, 80);
    return () => clearInterval(id);
  }, [showEnd]);

  // ----- nearest interactable -----
  const nearest = (() => {
    if (overlay || dialog || showEnd || showGallery) return null;
    let best = null, bd = INTERACT_RADIUS;
    for (const s of STOPS) {
      const d = Math.abs(s.x - charX);
      if (d < bd) { bd = d; best = s; }
    }
    return best;
  })();

  // ----- memoised scene layers -----
  // The game loop runs ~60×/s. Without this, every frame would re-render
  // all 22 trees, 12 markers and the hills — even though only the character
  // moved. These layers only change with `phase` (the quantised day→night
  // value), blooms, or which sign is nearest — so React skips most renders.
  const skyLayer = useMemo(() => (
    <>
      <SkyGradient phase={phase}/>
      <Sun phase={phase} viewW={viewport.w}/>
      <Stars phase={phase}/>
      <Birds phase={phase}/>
    </>
  ), [phase, viewport.w]);

  const farLayer = useMemo(() => (
    <>
      <FarHills phase={phase} winStart={farWinStart} winEnd={farWinEnd}/>
      <Clouds phase={phase} winStart={farWinStart} winEnd={farWinEnd}/>
    </>
  ), [phase, farWinStart, farWinEnd]);

  const midLayer = useMemo(() => (
    <NearHills phase={phase} winStart={midWinStart} winEnd={midWinEnd}/>
  ), [phase, midWinStart, midWinEnd]);

  const groundLayer = useMemo(() => (
    <>
      <Ground phase={phase} winStart={winStart} winEnd={winEnd}/>
      <Bushes phase={phase} winStart={winStart} winEnd={winEnd}/>
      <Trees phase={phase} flowered={flowered} winStart={winStart} winEnd={winEnd}/>
    </>
  ), [phase, flowered, winStart, winEnd]);

  const stopMarkers = useMemo(() => (
    STOPS.filter(s => s.x >= winStart && s.x <= winEnd).map(s => (
      <StopMarker key={s.id} stop={s} charNearby={nearest?.id === s.id}
        lit={s.id === "lantern" && lanternLit}/>
    ))
  ), [lanternLit, nearest?.id, winStart, winEnd]);

  const starEls = useMemo(() => (
    [[1700, 60], [1980, 85], [3400, 90], [5300, 70]].map(([sx, sy], i) => (
      !collectedStars[i] && (
        <div key={i} className="sk-hand mw-twinkle" style={{
          position: "absolute", left: sx, bottom: GROUND_Y + groundLift(sx) + sy, fontSize: 22, color: "#fef3a3",
          textShadow: "0 0 8px rgba(254,243,163,.8)", zIndex: 5
        }}>✦</div>
      )
    ))
  ), [collectedStars]);

  function handleStop(s) {
    setReached(prev => ({ ...prev, [s.id]: true }));
    if (s.type !== "start" && s.type !== "peak") playOpen();
    switch (s.type) {
      case "start": break;
      case "knock":
        setDialog({
          lines: [
            "诶 — 你来啦 :)",
            "我是 Arden。\n这是我做的小世界 — my world。",
            "前面有两件我最近做的产品，\n几个停靠点，还有藏起来的小东西 ✦",
            "天会慢慢黑下来，但路上一直有灯 ✿\n随便逛 — 点招牌就能聊聊 :)",
          ]
        });
        break;
      case "about":   setOverlay({ type: "about" }); break;
      // puddle is terrain only; no dialog needed.
      case "work":    setOverlay({ type: "work", workId: s.workId }); break;
      case "notes":   setOverlay({ type: "notes" }); break;
      case "lantern":
        setLanternLit(true);
        setDialog({
          lines: [
            "天黑了。",
            "灯笼是路上最温柔的东西 ✦",
            "以前我觉得「效率」最重要 —\n后来发现，慢一点也没什么不好。",
          ]
        });
        break;
      case "doodle":  setOverlay({ type: "doodle" }); break;
      case "contact": setOverlay({ type: "contact" }); break;
      case "soon":
        setDialog({
          lines: [
            "你走过最热闹的一段了 :)",
            "这块地以后会再长出一座山\n下一件作品还在做 — 等等我 ✦",
          ]
        });
        break;
      case "peak":    setShowEnd(true); break;
      default: break;
    }
  }

  function replay() {
    localStorage.setItem("mw-play-count", String(playCount));
    setPlayCount(playCount + 1);
    stateRef.current = { x: 420, y: 0, vy: 0 };
    setCharX(420); setCharY(0); setVy(0); setFacing(1);
    setReached({}); setStars(0); setCollectedStars({});
    setShowEnd(false); setShowGallery(false); setOverlay(null); setDialog(null);
    setTarget(null); setSplashing(false);
    setFlowered({});
    setLanternLit(false);
    setThought(null); firedThoughts.current = {};
    clearTimeout(thoughtTimer.current);
    startTime.current = Date.now();
  }

  // .mw-world stays integer-snapped — the original white seam appeared
  // at the ground edge, which is on this layer. The parallax hill layers
  // (.mw-far at 0.3×, .mw-mid at 0.6×) take the float value so they
  // scroll smoothly; with snapping they advanced 1px every few frames
  // and made the distant hills look choppy. The subsequent fixes
  // (character on its own translate3d layer, StopMarker decor on its
  // own compositor layers via translateZ(0)) keep the seams away even
  // with float parallax translates.
  const farCamX = camX * 0.3;
  const midCamX = camX * 0.6;
  const camXRounded = Math.round(camX);

  // char position with terrain
  const groundOffset = groundLift(charX);
  const charBaseY = GROUND_Y + groundOffset;

  // Mood
  let charMood = "";
  if (showEnd) charMood = "✦";
  else if (charY > 40) charMood = "!";
  else if (nearest && nearest.type === "work") charMood = "?";

  // Jump button: always present on mobile (no keyboard to jump with);
  // on desktop it just appears near the puddle, since Space already works.
  const puddleStop = STOPS.find(s => s.type === "puddle");
  const nearPuddle = puddleStop && Math.abs(charX - puddleStop.x) < 350;
  const showJump = (isMobile || nearPuddle) && !overlay && !dialog && !showEnd && !showGallery && !showIntro && !showTutorial;

  const totalTime = (Date.now() - startTime.current) / 1000;

  // Stops actually visited — start / puddle / peak aren't real "stops"
  const countedStops = STOPS.filter(s => !["start", "puddle", "peak"].includes(s.type));
  const visitedStops = countedStops.filter(s => reached[s.id]).length;

  return (
    <div className="mw-stage" ref={stageRef}
         onMouseDown={onStageDown}
         onContextMenu={(e) => e.preventDefault()}
         onTouchStart={(e) => {
           // Skip preventDefault on buttons — otherwise the synthesised click is
           // swallowed and the bottom-row mobile controls stop working.
           if (e.target.closest('button')) return;
           e.preventDefault(); onStageDown(e);
         }}
    >
      {/* Background */}
      <div className="mw-bg">
        {skyLayer}
        <div className="mw-far"  style={{ transform: `translateX(${-farCamX}px)` }}>
          {farLayer}
        </div>
        <div className="mw-mid" style={{ transform: `translateX(${-midCamX}px)` }}>
          {midLayer}
        </div>
      </div>

      {/* World */}
      <div className="mw-world" style={{ transform: `translateX(${-camXRounded}px)` }}>
        {groundLayer}
        {stopMarkers}
        {starEls}
        {/* splash drops */}
        {splash && Array.from({length: 8}).map((_, i) => (
          <div key={i} className="mw-drop" style={{
            position: "absolute", left: splash.x + (i - 4) * 8, bottom: GROUND_Y + groundLift(splash.x),
            width: 6, height: 6, borderRadius: "50%", background: "#6a8ab0",
            border: "1.5px solid #1b1b1b", zIndex: 9,
            animation: `mwsplash ${0.6 + (i % 3) * 0.1}s ease-out forwards`,
            animationDelay: `${i * 0.02}s`,
            ['--dx']: `${(i - 4) * 12}px`,
            ['--dy']: `${30 + (i % 3) * 10}px`
          }}/>
        ))}
        {/* cat (after first playthrough)
            Position is driven by transform: translate3d, not left/bottom.
            WebKit leaks paint when a child's left/top changes every frame
            inside a composited parent (.mw-world has will-change: transform),
            leaving ghost trails of any radial-gradient or box-shadow it had.
            scaleX for facing lives on the inner div so the flip stays instant
            instead of riding the .2s transform transition. */}
        {playCount >= 2 && (() => {
          const catX = charX - 75 * facing;
          const catY = GROUND_Y + groundLift(catX) - 4;
          return (
            <div style={{
              position: "absolute", left: 0, bottom: 0, zIndex: 4,
              transform: `translate3d(${catX}px, ${-catY}px, 0)`,
              transition: "transform .2s linear",
              willChange: "transform",
            }}>
              <div style={{ transform: `scaleX(${facing < 0 ? -1 : 1})` }}>
                <Cat size={32}/>
              </div>
            </div>
          );
        })()}
        {/* character — same transform path as the cat for the same reason */}
        <div style={{
          position: "absolute", left: 0, bottom: 0, zIndex: 10,
          transform: `translate3d(${charX - CHAR_BASE_W/2}px, ${-(charBaseY - 4 + charY)}px, 0)`,
          willChange: "transform",
        }}>
          <Char size={isMobile ? 64 : 86} walking={walking} jumping={charY > 5} splashing={splashing} facing={facing} mood={charMood}/>
          {/* hand-drawn splash bubble above the head when feet hit the puddle */}
          {splashing && (
            <div className="mw-splash-pop" style={{
              position: "absolute", left: "82%", bottom: "92%",
              pointerEvents: "none",
            }}>
              <svg width="44" height="34" viewBox="0 0 44 34" style={{ display: "block" }}>
                {/* three water droplets, like 💦 — a teardrop = a tip + a round belly */}
                {[
                  { x: 9,  y: 20, s: 1.0 },
                  { x: 23, y: 13, s: 1.25 },
                  { x: 35, y: 22, s: 0.85 },
                ].map((d, i) => (
                  <path key={i}
                    d={`M${d.x} ${d.y - 11 * d.s}
                        Q${d.x + 7 * d.s} ${d.y - 1 * d.s} ${d.x + 6 * d.s} ${d.y + 3 * d.s}
                        Q${d.x + 4 * d.s} ${d.y + 9 * d.s} ${d.x} ${d.y + 9 * d.s}
                        Q${d.x - 4 * d.s} ${d.y + 9 * d.s} ${d.x - 6 * d.s} ${d.y + 3 * d.s}
                        Q${d.x - 7 * d.s} ${d.y - 1 * d.s} ${d.x} ${d.y - 11 * d.s} Z`}
                    fill="#a8c8e0" stroke="#1b1b1b" strokeWidth="2.2"
                    strokeLinejoin="round" filter="url(#wobble)"/>
                ))}
              </svg>
            </div>
          )}
          {/* thought bubble */}
          {thought && (
            <div className={`mw-thought${thought.wrap ? " mw-thought-wide" : ""}`} key={thought.id}>
              <div className="sk-hand" style={{
                fontSize: 17, lineHeight: 1.3, color: "#1b1b1b",
                whiteSpace: thought.wrap ? "pre-line" : undefined,
              }}>{thought.text}</div>
            </div>
          )}
        </div>
      </div>

      <HUD charX={charX} time={time} stars={stars}
           onSkip={() => setShowGallery(true)}/>

      {/* bottom-left controls — sound toggle, plus a how-to-play that
          re-opens the tap-zone tutorial */}
      <div style={{ position: "fixed", bottom: 24, left: 24, zIndex: 36, display: "flex", gap: 8 }}>
        <button className="mw-skip" onClick={(e) => {
            e.stopPropagation();
            initAudio();
            const m = !muted;
            setMuted(m);
            setMutedState(m);
          }}>
          <SpeakerIcon muted={muted}/>{muted ? "静音" : "声音"}
        </button>
        {!showIntro && !showEnd && !showGallery && (
          <button className="mw-skip"
            onClick={(e) => { e.stopPropagation(); openTutorial(); }}>
            ? 怎么玩
          </button>
        )}
      </div>

      {/* switch to the room version (indoor mode) — press R also works.
          The standalone climb mode is gone; climbing lives inside the room. */}
      {onRoom && (
        <button className="mw-skip" onClick={(e) => { e.stopPropagation(); onRoom(); }}
          style={{ position: "fixed", bottom: 24, right: 24, zIndex: 36 }}>
<HouseIcon/>房间版 →
        </button>
      )}

      {/* Achievement panel — fixed overlay so it stays fully on-screen
          (must live outside .mw-world: a transformed ancestor would
          re-anchor position:fixed). Up top on mobile, centred on desktop. */}
      {showEnd && (() => {
        const mins = Math.floor(totalTime / 60);
        const secs = Math.floor(totalTime % 60);
        const timeStr = mins > 0 ? `${mins}′${String(secs).padStart(2,"0")}″` : `${secs}″`;
        const k = isMobile ? 1 : 1.5; // desktop gets a bigger end card; mobile unchanged
        return (
          <div className="mw-end-card" style={{
            position: "fixed", width: 250 * k, zIndex: 45,
            ...(isMobile
              ? { left: "50%", top: 84, transform: "translateX(-50%) rotate(-1.5deg)" }
              : { left: "50%", top: "50%", transform: "translate(-50%, -50%) rotate(-1.5deg)" }),
            background: "#fffdf6", border: "3px solid #1b1b1b",
            filter: "url(#wobble)", padding: `${14 * k}px ${18 * k}px`,
            boxShadow: "3px 4px 0 rgba(0,0,0,.15)",
            pointerEvents: "auto"
          }}>
            <div className="sk-mono" style={{ fontSize: 9 * k, letterSpacing: ".22em", color: "#888" }}>END · 终点</div>
            <div className="mw-title" style={{ fontSize: 32 * k, lineHeight: 1, marginTop: 4 * k, color: "#d97757" }}>通关 ✦</div>
            <div className="sk-hand" style={{ fontSize: 14 * k, color: "#666", marginTop: 2 * k }}>你走完了 my world</div>
            <div style={{ marginTop: 12 * k, display: "flex", flexDirection: "column", gap: 4 * k }}>
              {[
                { label: "停靠点", value: `${visitedStops}/${countedStops.length}` },
                { label: "捡到的星", value: `${stars} 颗` },
                { label: "花的时间", value: timeStr },
                { label: "通关次数", value: `# ${playCount}` },
              ].map(s => (
                <div key={s.label} style={{
                  display: "flex", justifyContent: "space-between", alignItems: "baseline",
                  borderBottom: "1.5px dashed rgba(27,27,27,.15)", padding: `${5 * k}px 0`
                }}>
                  <span className="sk-hand" style={{ fontSize: 15 * k, color: "#555" }}>{s.label}</span>
                  <span className="mw-title" style={{ fontSize: 16 * k, color: "#1b1b1b" }}>{s.value}</span>
                </div>
              ))}
            </div>
            <div style={{ marginTop: 12 * k, display: "flex", gap: 6 * k }}>
              <button className="mw-btn" style={{ flex: 1, fontSize: 13 * k, padding: `${5 * k}px ${8 * k}px` }} onClick={(e) => { e.stopPropagation(); replay(); }}>
                ↺ 再走一遍
              </button>
              <button className="mw-btn" style={{ flex: 1, fontSize: 13 * k, padding: `${5 * k}px ${8 * k}px` }} onClick={(e) => { e.stopPropagation(); setShowGallery(true); }}>
                看作品
              </button>
            </div>
            {onRoom && (
              <button className="mw-btn mw-btn-primary"
                style={{ width: "100%", marginTop: 6 * k, fontSize: 13 * k, padding: `${6 * k}px ${8 * k}px` }}
                onClick={(e) => { e.stopPropagation(); onRoom(); }}>
<HouseIcon size={15}/>没玩够? 回 Arden 家再看看 →
              </button>
            )}
          </div>
        );
      })()}

      {nearest && !dialog && !overlay && !showEnd && !showGallery && !splashing && (
        <InteractPrompt stop={nearest}/>
      )}

      {/* Jump button — tap to jump, drag to reposition (position is remembered) */}
      {showJump && (
        <button className="mw-jump-btn"
          style={{ right: jumpPos.right, bottom: jumpPos.bottom, touchAction: "none" }}
          onPointerDown={onJumpDown}
          onPointerMove={onJumpMove}
          onPointerUp={onJumpUp}
        >
          <div className="sk-hand" style={{ fontSize: 22, lineHeight: 1 }}>↑</div>
          <div className="sk-mono" style={{ fontSize: 7, letterSpacing: ".14em" }}>拖我·跳</div>
        </button>
      )}

      {dialog && <Dialog lines={dialog.lines} onDone={() => setDialog(null)}/>}

      {overlay?.type === "work" && (
        <WorkModal
          work={WORKS[overlay.workId]}
          workId={overlay.workId}
          onClose={() => setOverlay(null)}
          onShowcase={(url, workId) =>
            setShowcase({ url, workId, fromX: stateRef.current.x })
          }
        />
      )}

      {showcase && (
        <ShowcaseFrame
          url={showcase.url}
          onClose={() => {
            // Back-to-walk: put the character exactly back where they were
            // standing when they opened the showcase — not at start, not at
            // the work's sign. Wherever they actually were.
            if (typeof showcase.fromX === "number") {
              stateRef.current.x = showcase.fromX;
              setCharX(showcase.fromX);
              setTarget(null);
            }
            setShowcase(null);
            setOverlay(null);
            // Note: if they came from the skip-gallery, leave it open so they
            // land back in the gallery they were browsing.
          }}
        />
      )}

      {overlay?.type === "about" && (
        <Overlay title="关于" sub="ABOUT" onClose={() => setOverlay(null)}>
          <div className="mw-body" style={{ fontSize: 18, lineHeight: 1.7, color: "#1b1b1b" }}>
            我是 <b>Arden</b> — 还在探索。<br/><br/>
            住在北京。<br/>
            白天学习➕做产品 — 喜欢简单、有手感、解决一个真问题的小东西；<br/>
            晚上偶尔写点想法。<br/><br/>
            <i style={{ color: "#666" }}>这个网站本身也是我的一件作品。</i>
          </div>
          <div style={{ marginTop: 18, display: "flex", gap: 6, flexWrap: "wrap" }}>
            {["在探索","product","ai","calm-tech","小工具","handmade"].map(t => (
              <span key={t} className="sk-tag">{t}</span>
            ))}
          </div>
        </Overlay>
      )}

      {overlay?.type === "notes" && (
        <Overlay title="一些想法" sub="NOTES" onClose={() => setOverlay(null)} accent="#fffdf6">
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {NOTES.map((n, i) => (
              <div key={i} style={{
                background: ["#fef3a3","#cfe0c6","#f7c5c0"][i % 3], border: "2.5px solid #1b1b1b",
                filter: "url(#wobble)", padding: "14px 16px",
                transform: `rotate(${(i % 2 ? 1 : -1) * 0.8}deg)`,
                boxShadow: "2px 3px 0 rgba(0,0,0,.1)"
              }}>
                <div className="sk-mono" style={{ fontSize: 10, letterSpacing: ".2em", color: "#7a6648" }}>{n.date}</div>
                <div style={{ fontFamily: '"Caveat", "ZCOOL XiaoWei", sans-serif', fontSize: 22, lineHeight: 1.5, whiteSpace: "pre-line", marginTop: 4 }}>
                  {n.text}
                </div>
              </div>
            ))}
          </div>
        </Overlay>
      )}

      {overlay?.type === "doodle" && (
        <DoodleWall onClose={() => setOverlay(null)}/>
      )}

      {overlay?.type === "contact" && (
        <ContactCard onClose={() => setOverlay(null)}/>
      )}


      {/* Start hint — controls differ between touch and desktop */}
      {showStartHint && charX < 460 && !dialog && !overlay && !showIntro && (
        <div className="mw-start-hint">
          <div className="sk-hand" style={{ fontSize: isMobile ? 22 : 28, color: "#1b1b1b" }}>
            {isMobile ? "点屏幕往那边走 ✦" : "点屏幕走,或按 ← → 键 ✦"}
          </div>
          <div className="mw-body" style={{ fontSize: 13, color: "#555", marginTop: 4 }}>
            {isMobile
              ? "点招牌互动 · 点 ↑ 按钮 = 前进跳"
              : "← → = 走路 · 空格 = 跳 · 点招牌互动"}
          </div>
        </div>
      )}

      {showGallery && (
        <Gallery
          onClose={() => setShowGallery(false)}
          onBackToWalk={() => setShowGallery(false)}
          onShowcase={(url, workId) =>
            setShowcase({ url, workId, fromX: stateRef.current.x })
          }
        />
      )}

      {/* First-time tutorial — highlight the left/right tap zones with a
          live finger-pulse + arrow demo. Auto-dismisses after 5s, or tap
          the bottom pill / anywhere on a zone to skip. Re-openable from
          the 「怎么玩」 button. */}
      {showTutorial && (
        <div className="mw-tut" onMouseDown={(e) => { e.stopPropagation(); dismissTutorial(); }}
             onTouchStart={(e) => { e.stopPropagation(); dismissTutorial(); }}>
          <div className="mw-tut-zone mw-tut-zone-left">
            <div className="mw-tut-finger"><ChunkyArrow size={48} dir="left"/></div>
            <div className="mw-tut-label">点这边 · 往左走</div>
          </div>
          <div className="mw-tut-zone mw-tut-zone-right">
            <div className="mw-tut-finger"><ChunkyArrow size={48} dir="right"/></div>
            <div className="mw-tut-label">点这边 · 往右走</div>
          </div>
          <button className="mw-tut-dismiss"
            onMouseDown={(e) => e.stopPropagation()}
            onTouchStart={(e) => e.stopPropagation()}
            onClick={(e) => { e.stopPropagation(); dismissTutorial(); }}>
            知道了 ✦
          </button>
        </div>
      )}

      {/* Opening choice — play the walk, or skip straight to the works */}
      {showIntro && (
        <div style={{
          position: "fixed", inset: 0, zIndex: 48, background: "rgba(27,27,27,.42)",
          display: "flex", alignItems: "center", justifyContent: "center", padding: 20,
        }}>
          <div style={{
            width: "min(360px, 100%)", background: "#fffdf6", border: "3px solid #1b1b1b",
            filter: "url(#wobble)", padding: "26px 26px 22px", textAlign: "center",
            boxShadow: "5px 7px 0 rgba(0,0,0,.18)", transform: "rotate(-1deg)",
          }}>
            <div className="sk-mono" style={{ fontSize: 10, letterSpacing: ".24em", color: "#888" }}>
              MY WORLD
            </div>
            <div className="mw-title" style={{ fontSize: 40, lineHeight: 1.05, marginTop: 6 }}>
              散步 60 秒 ✦
            </div>
            <div className="mw-body" style={{ fontSize: 16, color: "#555", marginTop: 10, lineHeight: 1.6 }}>
              往右走一段路 — 路上都是 Arden 做的东西。<br/>
              想换个玩法?也可以去 Arden 家的房间逛逛。
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 20 }}>
              <button className="mw-btn mw-btn-primary mw-btn-big"
                onClick={(e) => {
                  e.stopPropagation(); initAudio(); startBgm("walk"); setShowIntro(false);
                  if (!localStorage.getItem("mw-tut-seen")) {
                    localStorage.setItem("mw-tut-seen", "1");
                    openTutorial();
                  }
                }}>
                出门散个步 →
              </button>
              {onRoom && (
                <button className="mw-btn"
                  onClick={(e) => { e.stopPropagation(); initAudio(); setShowIntro(false); onRoom(); }}>
<HouseIcon/>去 Arden 家逛逛
                </button>
              )}
              <button className="mw-btn"
                onClick={(e) => {
                  e.stopPropagation(); initAudio(); startBgm("walk");
                  setShowIntro(false); setShowGallery(true);
                }}>
                直接看作品
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
