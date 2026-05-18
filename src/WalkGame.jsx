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
  STORY_THOUGHTS, timeFor,
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
import {
  initAudio, startBgm, playStep, playJump, playSplash, playStar, playOpen, playWin,
  isMuted, setMuted,
} from './world/sound.js';

export default function WalkGame({ onSwitch }) {
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
  const [viewport, setViewport] = useState({ w: window.innerWidth, h: window.innerHeight });
  const [showStartHint, setShowStartHint] = useState(true);
  const [splash, setSplash] = useState(null); // {x, y} for splash drops
  const [flowered, setFlowered] = useState({});
  const [thought, setThought] = useState(null); // {id, text}
  const [muted, setMutedState] = useState(isMuted());
  const firedThoughts = useRef({});
  const thoughtTimer = useRef();
  const startTime = useRef(Date.now());
  const stepAcc = useRef(0); // footstep cadence accumulator

  const time = timeFor(charX);
  const isMobile = viewport.w < 720 || matchMedia("(pointer:coarse)").matches;

  useEffect(() => {
    const r = () => setViewport({ w: window.innerWidth, h: window.innerHeight });
    window.addEventListener("resize", r);
    return () => window.removeEventListener("resize", r);
  }, []);

  // Camera
  const camX = Math.max(0, Math.min(WORLD_WIDTH - viewport.w, charX - viewport.w * 0.35));

  // ----- mouse/touch click to walk -----
  const stageRef = useRef(null);

  const onStageDown = (e) => {
    initAudio(); startBgm(); // first tap unlocks audio + starts the music
    if (overlay || dialog || showEnd || showGallery) return;
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
      setTarget({ x: Math.max(80, Math.min(WORLD_WIDTH - 80, worldX)), then: null });
    }
  };

  // ----- jump button -----
  const onJump = () => {
    if (charY === 0 && !overlay && !dialog && !showEnd && !showGallery) {
      keys.current.jumpRequested = true;
      setShowStartHint(false);
    }
  };

  // ----- keyboard fallback -----
  const keys = useRef({ jumpRequested: false });
  useEffect(() => {
    const down = (e) => {
      if (e.key === " " || e.key === "ArrowUp") {
        if (!dialog && !overlay && !showEnd && !showGallery) {
          keys.current.jumpRequested = true;
          e.preventDefault();
        }
      }
    };
    window.addEventListener("keydown", down);
    return () => window.removeEventListener("keydown", down);
  });

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

      // walk toward target
      if (target && !walkBlocked) {
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
  // moved. These layers only change with `time` (day→dusk→night), blooms,
  // or which sign is nearest, so React can skip re-rendering them per frame.
  const skyLayer = useMemo(() => (
    <>
      <SkyGradient time={time}/>
      <Sun time={time} viewW={viewport.w}/>
      <Stars time={time}/>
      <Birds time={time}/>
    </>
  ), [time, viewport.w]);

  const farLayer = useMemo(() => (
    <>
      <FarHills time={time}/>
      <Clouds time={time} viewW={viewport.w}/>
    </>
  ), [time, viewport.w]);

  const midLayer = useMemo(() => <NearHills time={time}/>, [time]);

  const groundLayer = useMemo(() => (
    <>
      <Ground time={time}/>
      <Bushes time={time}/>
      <Trees time={time} flowered={flowered}/>
    </>
  ), [time, flowered]);

  const stopMarkers = useMemo(() => (
    STOPS.map(s => (
      <StopMarker key={s.id} stop={s} charNearby={nearest?.id === s.id} time={time}/>
    ))
  ), [time, nearest?.id]);

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
        setDialog({
          lines: [
            "天慢慢黑了。",
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
            "这块地以后会再长出一座山 ⛰\n下一件作品还在做 — 等等我 ✿",
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
    setThought(null); firedThoughts.current = {};
    clearTimeout(thoughtTimer.current);
    startTime.current = Date.now();
  }

  const farCamX = camX * 0.3;
  const midCamX = camX * 0.6;

  // char position with terrain
  const groundOffset = groundLift(charX);
  const charBaseY = GROUND_Y + groundOffset;

  // Mood
  let charMood = "";
  if (showEnd) charMood = "✦";
  else if (splashing) charMood = "💦";
  else if (charY > 40) charMood = "!";
  else if (nearest && nearest.type === "work") charMood = "?";

  // Jump button: show whenever near the puddle.
  const puddleStop = STOPS.find(s => s.type === "puddle");
  const showJump = puddleStop && Math.abs(charX - puddleStop.x) < 350 && !overlay && !dialog && !showEnd && !showGallery;

  const totalTime = (Date.now() - startTime.current) / 1000;

  return (
    <div className="mw-stage" ref={stageRef}
         onMouseDown={onStageDown}
         onTouchStart={(e) => { e.preventDefault(); onStageDown(e); }}
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
      <div className="mw-world" style={{ transform: `translateX(${-camX}px)` }}>
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
        {/* cat (after first playthrough) */}
        {playCount >= 2 && (
          <div style={{
            position: "absolute", left: charX - 75 * facing, bottom: GROUND_Y + groundLift(charX - 75 * facing) - 4,
            transform: facing < 0 ? "scaleX(-1)" : "", transition: "left .2s linear", zIndex: 4
          }}>
            <Cat size={32}/>
          </div>
        )}
        {/* character */}
        <div style={{
          position: "absolute", left: charX - CHAR_BASE_W/2, bottom: charBaseY - 4 + charY,
          zIndex: 10
        }}>
          <Char size={isMobile ? 64 : 86} walking={walking} jumping={charY > 5} splashing={splashing} facing={facing} mood={charMood}/>
          {/* thought bubble */}
          {thought && (
            <div className="mw-thought" key={thought.id}>
              <div className="sk-hand" style={{ fontSize: 17, lineHeight: 1.3, color: "#1b1b1b" }}>{thought.text}</div>
            </div>
          )}
        </div>
      </div>

      <HUD charX={charX} time={time} stars={stars}
           onSkip={() => setShowGallery(true)}/>

      {/* sound toggle */}
      <button className="mw-skip" onClick={(e) => {
          e.stopPropagation();
          initAudio();
          const m = !muted;
          setMuted(m);
          setMutedState(m);
        }}
        style={{ position: "fixed", bottom: 24, left: 24, zIndex: 36 }}>
        {muted ? "🔇 静音" : "🔊 声音"}
      </button>

      {/* switch to the climb (hard mode) */}
      <button className="mw-skip" onClick={(e) => { e.stopPropagation(); onSwitch(); }}
        style={{ position: "fixed", bottom: 24, right: 24, zIndex: 36 }}>
        ⛰ 攀岩版 →
      </button>

      {/* Achievement panel — fixed overlay so it stays fully on-screen
          (must live outside .mw-world: a transformed ancestor would
          re-anchor position:fixed). Up top on mobile, centred on desktop. */}
      {showEnd && (() => {
        const mins = Math.floor(totalTime / 60);
        const secs = Math.floor(totalTime % 60);
        const timeStr = mins > 0 ? `${mins}′${String(secs).padStart(2,"0")}″` : `${secs}″`;
        return (
          <div className="mw-end-card" style={{
            position: "fixed", width: 250, zIndex: 45,
            ...(isMobile
              ? { left: "50%", top: 84, transform: "translateX(-50%) rotate(-1.5deg)" }
              : { left: "50%", top: "50%", transform: "translate(-50%, -50%) rotate(-1.5deg)" }),
            background: "#fffdf6", border: "3px solid #1b1b1b",
            filter: "url(#wobble)", padding: "14px 18px",
            boxShadow: "3px 4px 0 rgba(0,0,0,.15)",
            pointerEvents: "auto"
          }}>
            <div className="sk-mono" style={{ fontSize: 9, letterSpacing: ".22em", color: "#888" }}>END · 终点</div>
            <div className="mw-title" style={{ fontSize: 32, lineHeight: 1, marginTop: 4, color: "#d97757" }}>通关 ✦</div>
            <div className="sk-hand" style={{ fontSize: 14, color: "#666", marginTop: 2 }}>你走完了 my world</div>
            <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 4 }}>
              {[
                { label: "停靠点", value: `${STOPS.length}/${STOPS.length}` },
                { label: "捡到的星", value: `${stars} 颗` },
                { label: "花的时间", value: timeStr },
                { label: "通关次数", value: `# ${playCount}` },
              ].map(s => (
                <div key={s.label} style={{
                  display: "flex", justifyContent: "space-between", alignItems: "baseline",
                  borderBottom: "1.5px dashed rgba(27,27,27,.15)", padding: "5px 0"
                }}>
                  <span className="sk-hand" style={{ fontSize: 15, color: "#555" }}>{s.label}</span>
                  <span className="mw-title" style={{ fontSize: 16, color: "#1b1b1b" }}>{s.value}</span>
                </div>
              ))}
            </div>
            <div style={{ marginTop: 12, display: "flex", gap: 6 }}>
              <button className="mw-btn" style={{ flex: 1, fontSize: 13, padding: "5px 8px" }} onClick={(e) => { e.stopPropagation(); replay(); }}>
                ↺ 再走一遍
              </button>
              <button className="mw-btn" style={{ flex: 1, fontSize: 13, padding: "5px 8px" }} onClick={(e) => { e.stopPropagation(); setShowGallery(true); }}>
                看作品
              </button>
            </div>
          </div>
        );
      })()}

      {nearest && !dialog && !overlay && !showEnd && !showGallery && !splashing && (
        <InteractPrompt stop={nearest}/>
      )}

      {/* Jump button — visible near puddle */}
      {showJump && (
        <button className="mw-jump-btn" onClick={(e) => { e.stopPropagation(); onJump(); }}>
          <div className="sk-hand" style={{ fontSize: 30, lineHeight: 1 }}>↑</div>
          <div className="sk-mono" style={{ fontSize: 9, letterSpacing: ".2em" }}>JUMP</div>
        </button>
      )}

      {dialog && <Dialog lines={dialog.lines} onDone={() => setDialog(null)}/>}

      {overlay?.type === "work" && (
        <WorkModal work={WORKS[overlay.workId]} workId={overlay.workId} onClose={() => setOverlay(null)}/>
      )}

      {overlay?.type === "about" && (
        <Overlay title="关于" sub="ABOUT" onClose={() => setOverlay(null)}>
          <div className="mw-body" style={{ fontSize: 18, lineHeight: 1.7, color: "#1b1b1b" }}>
            我是 <b>Arden</b> — 还在探索。<br/><br/>
            住在北京。<br/>
            白天做产品 — 喜欢简单、有手感、解决一个真问题的小东西；<br/>
            晚上偶尔画画、写点想法。<br/><br/>
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
                <div className="sk-hand" style={{ fontSize: 22, lineHeight: 1.45, whiteSpace: "pre-line", marginTop: 4 }}>
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
        <Overlay title="写信给我" sub="CONTACT" onClose={() => setOverlay(null)} accent="#fffdf6">
          <div className="mw-body" style={{ fontSize: 17, lineHeight: 1.55, color: "#444", marginBottom: 16 }}>
            随便说点什么都好 — 想合作、想吐槽、想聊天 :)
          </div>
          <textarea rows={5} placeholder="写两句…" style={{
            width: "100%", border: "2.5px solid #1b1b1b", filter: "url(#wobble)", padding: 12,
            fontFamily: "Caveat", fontSize: 20, lineHeight: 1.4, background: "#fffdf6", resize: "vertical"
          }}/>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 12, gap: 10, flexWrap: "wrap" }}>
            <div className="sk-mono" style={{ fontSize: 10, letterSpacing: ".15em", color: "#888" }}>
              寄到 — hello@myworld.cn
            </div>
            <button className="mw-btn mw-btn-primary">寄出 →</button>
          </div>
        </Overlay>
      )}

      {/* Start hint */}
      {showStartHint && charX < 460 && !dialog && !overlay && (
        <div className="mw-start-hint">
          <div className="sk-hand" style={{ fontSize: isMobile ? 22 : 28, color: "#1b1b1b" }}>
            点屏幕往那边走 ✦
          </div>
          <div className="mw-body" style={{ fontSize: 13, color: "#555", marginTop: 4 }}>
            点招牌 = 互动 · 点 ↑ = 跳
          </div>
        </div>
      )}

      {showGallery && (
        <Gallery
          onClose={() => setShowGallery(false)}
          onBackToWalk={() => setShowGallery(false)}
        />
      )}
    </div>
  );
}
