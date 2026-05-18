/* My World — 困难版 · 攀岩 (hard mode / the climb)
 *
 * A Klifur-style physics climber. Drag each of the four limbs onto a
 * rock hold; gripped limbs act as springs holding the torso up against
 * gravity. Overreach and a grip slips — lose them all and you fall to
 * the last ledge. Climb to the summit to clear it.
 *
 * `onExit` returns to the title screen.
 */

import { useState, useEffect, useRef, useMemo } from 'react';

import { HOLDS, LEDGES, CLIMB_WORKS, WALL_TOP, SUMMIT_Y } from './world/climbData.js';
import { WORKS } from './world/data.js';
import Climber from './world/Climber.jsx';
import WorkModal from './components/WorkModal.jsx';
import Gallery from './components/Gallery.jsx';

// ---- physics constants ----
const GRAV  = 1700;   // gravity (px/s^2)
const STIFF = 46;     // gripped-limb spring stiffness
const REST  = 50;     // spring rest length — slack below this
const REACH = 100;    // max limb length
const DAMP  = 0.86;   // velocity damping while gripping
const ITER  = 6;      // position-constraint iterations
const GRAB  = 62;     // cursor radius to pick up a limb
const SNAP  = 46;     // distance a released limb snaps to a hold

// limb anchor offsets from the torso centre (x right, y up)
const LIMB_DEF = [
  { name: "LF", ax: -15, ay: -30 },
  { name: "LH", ax: -22, ay:  28 },
  { name: "RH", ax:  22, ay:  28 },
  { name: "RF", ax:  15, ay: -30 },
];

const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

function makeModel(holdsW) {
  const base = LEDGES[0];
  const lh = holdsW.filter(h => h.ledge && h.ledgeY === base.y).sort((a, b) => a.wx - b.wx);
  const torso = { x: (lh[1].wx + lh[2].wx) / 2, y: base.y + 80, vx: 0, vy: 0 };
  const limbs = LIMB_DEF.map((d, i) => {
    const h = lh[i] || lh[lh.length - 1];
    return { ...d, ex: h.wx, ey: h.wy, grip: h.id, dragging: false };
  });
  return { torso, limbs };
}

export default function ClimbGame({ onExit }) {
  const [viewport, setViewport] = useState({ w: window.innerWidth, h: window.innerHeight });
  const [, setFrame] = useState(0);
  const [won, setWon] = useState(false);
  const [falls, setFalls] = useState(0);
  const [workModal, setWorkModal] = useState(null);
  const [showGallery, setShowGallery] = useState(false);

  const wallW = Math.min(viewport.w - 44, 480);
  const wallLeft = (viewport.w - wallW) / 2;
  const holdsW = useMemo(
    () => HOLDS.map(h => ({ ...h, wx: wallLeft + h.x * wallW, wy: h.y })),
    [wallLeft, wallW]
  );
  const holdsRef = useRef(holdsW);
  holdsRef.current = holdsW;

  const model = useRef(null);
  if (model.current === null) model.current = makeModel(holdsW);

  const stageRef = useRef(null);
  const dragRef = useRef(null);     // { name, wx, wy }
  const camYRef = useRef(0);
  const wonRef = useRef(false);
  const movesRef = useRef(0);
  const startRef = useRef(Date.now());
  const lastT = useRef(performance.now());

  useEffect(() => {
    const r = () => setViewport({ w: window.innerWidth, h: window.innerHeight });
    window.addEventListener("resize", r);
    return () => window.removeEventListener("resize", r);
  }, []);

  // ---- camera ----
  const t = model.current.torso;
  const camY = clamp(t.y - viewport.h * 0.55, -140, Math.max(0, SUMMIT_Y - viewport.h * 0.4));
  camYRef.current = camY;

  // ---- event -> world coords ----
  const worldFromEvent = (e) => {
    const rect = stageRef.current.getBoundingClientRect();
    const cx = e.clientX ?? e.touches?.[0]?.clientX ?? e.changedTouches?.[0]?.clientX;
    const cy = e.clientY ?? e.touches?.[0]?.clientY ?? e.changedTouches?.[0]?.clientY;
    return { x: cx - rect.left, y: viewport.h - (cy - rect.top) + camYRef.current };
  };

  const onDown = (e) => {
    if (won || workModal || showGallery) return;
    if (e.target.closest('button, .climb-plaque')) return;
    const p = worldFromEvent(e);
    const m = model.current;
    let pick = null, best = GRAB;
    for (const L of m.limbs) {
      const d = Math.hypot(L.ex - p.x, L.ey - p.y);
      if (d < best) { best = d; pick = L; }
    }
    if (pick) {
      pick.grip = null;
      pick.dragging = true;
      dragRef.current = { name: pick.name, wx: p.x, wy: p.y };
    }
  };
  const onMove = (e) => {
    if (!dragRef.current) return;
    const p = worldFromEvent(e);
    dragRef.current.wx = p.x;
    dragRef.current.wy = p.y;
  };
  const onUp = () => {
    const d = dragRef.current;
    if (!d) return;
    const m = model.current;
    const L = m.limbs.find(x => x.name === d.name);
    L.dragging = false;
    // snap to a hold near the limb tip that is also within reach of the anchor
    const ax = m.torso.x + L.ax, ay = m.torso.y + L.ay;
    let hit = null, best = SNAP;
    for (const h of holdsRef.current) {
      const dt = Math.hypot(h.wx - L.ex, h.wy - L.ey);
      if (dt < best && Math.hypot(h.wx - ax, h.wy - ay) <= REACH) { best = dt; hit = h; }
    }
    if (hit) {
      L.grip = hit.id;
      L.ex = hit.wx;
      L.ey = hit.wy;
      movesRef.current++;
    } else {
      L.grip = null;
    }
    dragRef.current = null;
  };

  // ---- physics loop ----
  useEffect(() => {
    let raf;
    const loop = (now) => {
      const dt = Math.min(0.035, (now - lastT.current) / 1000);
      lastT.current = now;
      if (!(won || workModal || showGallery)) {
        step(dt);
        setFrame(f => (f + 1) % 1e6);
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [won, workModal, showGallery]);

  function step(dt) {
    const m = model.current;
    const t = m.torso;
    const gripped = m.limbs.filter(L => L.grip != null);

    // forces: gravity + gripped-limb springs
    let fx = 0, fy = -GRAV;
    for (const L of gripped) {
      const ax = t.x + L.ax, ay = t.y + L.ay;
      const dx = L.ex - ax, dy = L.ey - ay;
      const d = Math.hypot(dx, dy) || 0.001;
      if (d > REST) {
        const f = STIFF * (d - REST);
        fx += f * dx / d;
        fy += f * dy / d;
      }
    }
    t.vx += fx * dt;
    t.vy += fy * dt;
    const damp = gripped.length ? DAMP : 0.995;
    t.vx *= damp;
    t.vy *= damp;
    t.x += t.vx * dt;
    t.y += t.vy * dt;

    // position constraints: a gripped limb cannot exceed REACH
    for (let it = 0; it < ITER; it++) {
      for (const L of gripped) {
        const ax = t.x + L.ax, ay = t.y + L.ay;
        const dx = L.ex - ax, dy = L.ey - ay;
        const d = Math.hypot(dx, dy) || 0.001;
        if (d > REACH) {
          const ex = d - REACH;
          t.x += dx / d * ex;
          t.y += dy / d * ex;
        }
      }
    }
    // overreach: a limb stretched past tolerance slips off
    for (const L of gripped) {
      const ax = t.x + L.ax, ay = t.y + L.ay;
      if (Math.hypot(L.ex - ax, L.ey - ay) > REACH * 1.07) L.grip = null;
    }

    // free / dragged limb endpoints
    for (const L of m.limbs) {
      if (L.grip != null) continue;
      const ax = t.x + L.ax, ay = t.y + L.ay;
      if (dragRef.current && dragRef.current.name === L.name) {
        let dx = dragRef.current.wx - ax, dy = dragRef.current.wy - ay;
        const d = Math.hypot(dx, dy) || 0.001;
        if (d > REACH) { dx = dx / d * REACH; dy = dy / d * REACH; }
        L.ex = ax + dx;
        L.ey = ay + dy;
      } else {
        L.ex += (ax - L.ex) * 0.18;
        L.ey += (ay - REACH * 0.5 - L.ey) * 0.18;
      }
    }

    t.x = clamp(t.x, wallLeft - 30, wallLeft + wallW + 30);

    // fall — no grips left: drop to the highest ledge below
    if (m.limbs.every(L => L.grip == null)) {
      let target = LEDGES[0];
      for (const lg of LEDGES) if (lg.y < t.y && lg.y > target.y) target = lg;
      if (t.y <= target.y + 56) {
        landOnLedge(target);
        setFalls(f => f + 1);
      }
    }

    // summit
    if (t.y >= SUMMIT_Y - 120 && !wonRef.current) {
      wonRef.current = true;
      setWon(true);
    }
  }

  function landOnLedge(ledge) {
    const m = model.current;
    const lh = holdsRef.current
      .filter(h => h.ledge && h.ledgeY === ledge.y)
      .sort((a, b) => a.wx - b.wx);
    m.torso.x = (lh[1].wx + lh[2].wx) / 2;
    m.torso.y = ledge.y + 80;
    m.torso.vx = 0;
    m.torso.vy = 0;
    LIMB_DEF.forEach((d, i) => {
      const L = m.limbs.find(x => x.name === d.name);
      const h = lh[i];
      L.grip = h.id;
      L.ex = h.wx;
      L.ey = h.wy;
      L.dragging = false;
    });
    dragRef.current = null;
  }

  function replay() {
    model.current = makeModel(holdsRef.current);
    wonRef.current = false;
    movesRef.current = 0;
    startRef.current = Date.now();
    setWon(false);
    setFalls(0);
    setWorkModal(null);
    setShowGallery(false);
  }

  // ---- derived render values ----
  const heightPct = clamp(Math.round((t.y / SUMMIT_Y) * 100), 0, 100);
  const showHint = movesRef.current < 3 && !won;
  const totalTime = (Date.now() - startRef.current) / 1000;
  const mins = Math.floor(totalTime / 60);
  const secs = Math.floor(totalTime % 60);
  const timeStr = mins > 0 ? `${mins}′${String(secs).padStart(2, "0")}″` : `${secs}″`;

  return (
    <div className="mw-stage" ref={stageRef}
      style={{ background: "linear-gradient(180deg, #acc4d6 0%, #d3d8d0 45%, #e7ddc6 100%)" }}
      onMouseDown={onDown} onMouseMove={onMove} onMouseUp={onUp} onMouseLeave={onUp}
      onTouchStart={(e) => { e.preventDefault(); onDown(e); }}
      onTouchMove={(e) => { e.preventDefault(); onMove(e); }}
      onTouchEnd={(e) => { e.preventDefault(); onUp(e); }}
    >
      {/* world layer — scrolls vertically with the camera */}
      <div style={{
        position: "absolute", left: 0, bottom: 0, width: "100%",
        height: WALL_TOP + 600, transform: `translateY(${camY}px)`, willChange: "transform"
      }}>
        {/* rock face */}
        <div style={{
          position: "absolute", left: wallLeft, bottom: -240, width: wallW,
          height: WALL_TOP + 320,
          background: "linear-gradient(180deg, #c9c3b0 0%, #bdb6a1 55%, #cdc6b1 100%)",
          border: "3px solid #1b1b1b", filter: "url(#wobble)"
        }}>
          {/* a few cracks for texture */}
          {[420, 1180, 2000].map((cy, i) => (
            <div key={i} style={{
              position: "absolute", left: `${20 + i * 24}%`, bottom: cy, width: 2, height: 260,
              background: "rgba(27,27,27,.16)", transform: `rotate(${i % 2 ? 8 : -6}deg)`
            }}/>
          ))}
        </div>

        {/* ledges */}
        {LEDGES.map((lg, i) => (
          <div key={i} style={{ position: "absolute", left: wallLeft, bottom: lg.y, width: wallW }}>
            <div style={{
              height: 16, background: "#7a4a32", border: "2.5px solid #1b1b1b",
              filter: "url(#wobble)", boxShadow: "0 4px 0 rgba(27,27,27,.18)"
            }}/>
            <div className="sk-mono" style={{
              position: "absolute", left: 6, bottom: 20, fontSize: 9,
              letterSpacing: ".16em", color: "#5a4632"
            }}>{lg.label}</div>
          </div>
        ))}

        {/* holds */}
        {holdsW.map(h => (
          <div key={h.id} style={{
            position: "absolute", left: h.wx - 11, bottom: h.wy - 11,
            width: 22, height: 22, borderRadius: "50%",
            background: h.summit ? "#fef3a3" : h.ledge ? "#9a8f72" : "#8a8270",
            border: "2.5px solid #1b1b1b", filter: "url(#wobble)",
            boxShadow: "1px 2px 0 rgba(27,27,27,.25)"
          }}>
            <div style={{
              position: "absolute", top: 4, left: 5, width: 6, height: 4,
              borderRadius: "50%", background: "rgba(255,255,255,.5)"
            }}/>
          </div>
        ))}

        {/* work plaques */}
        {CLIMB_WORKS.map(cw => {
          const w = WORKS[cw.workId];
          const isMood = cw.workId === "mood";
          const px = clamp(wallLeft + cw.side * wallW, wallLeft + 8, wallLeft + wallW - 128);
          return (
            <div key={cw.workId} className="climb-plaque"
              onClick={(e) => { e.stopPropagation(); setWorkModal({ workId: cw.workId }); }}
              style={{
                position: "absolute", left: px, bottom: cw.y - 30, width: 120,
                background: isMood ? "#d97757" : "#fef3a3", color: isMood ? "#fffdf6" : "#1b1b1b",
                border: "3px solid #1b1b1b", filter: "url(#wobble)", padding: "8px 10px",
                boxShadow: "3px 4px 0 rgba(27,27,27,.2)", cursor: "pointer", zIndex: 6
              }}>
              <div className="sk-mono" style={{ fontSize: 8, letterSpacing: ".16em", opacity: .8 }}>
                {w.en} · {w.tag}
              </div>
              <div className="mw-title" style={{ fontSize: 22, lineHeight: 1, marginTop: 2 }}>{w.name}</div>
              <div className="sk-hand" style={{ fontSize: 12, marginTop: 2, opacity: .85 }}>↑ 点开看看</div>
            </div>
          );
        })}

        {/* summit */}
        <div style={{
          position: "absolute", left: wallLeft - 20, bottom: SUMMIT_Y - 6,
          width: wallW + 40, height: 18, background: "#6f8f6a",
          border: "2.5px solid #1b1b1b", filter: "url(#wobble)"
        }}/>
        <div style={{ position: "absolute", left: wallLeft + wallW / 2, bottom: SUMMIT_Y + 10 }}>
          <div style={{ width: 4, height: 56, background: "#1b1b1b" }}/>
          <div style={{
            position: "absolute", top: 0, left: 4, width: 34, height: 22,
            background: "#d97757", border: "2px solid #1b1b1b", filter: "url(#wobble)"
          }}/>
        </div>
        <div className="mw-title" style={{
          position: "absolute", left: wallLeft, bottom: SUMMIT_Y + 44, width: wallW,
          textAlign: "center", fontSize: 30, color: "#1b1b1b"
        }}>山顶 ✦</div>

        {/* the climber */}
        <Climber torso={model.current.torso} limbs={model.current.limbs}/>
      </div>

      {/* HUD */}
      <div style={{
        position: "fixed", top: 16, left: 16, right: 16, display: "flex",
        justifyContent: "space-between", alignItems: "center", zIndex: 30
      }}>
        <div className="sk-mono" style={{
          fontSize: 11, letterSpacing: ".14em", background: "#fffdf6",
          border: "2px solid #1b1b1b", padding: "6px 12px", filter: "url(#wobble)"
        }}>
          困难版 · 攀岩 &nbsp;·&nbsp; 高度 {heightPct}%
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <div className="sk-mono" style={{
            fontSize: 11, letterSpacing: ".14em", background: "#fef3a3",
            border: "2px solid #1b1b1b", padding: "6px 12px", filter: "url(#wobble)"
          }}>
            滑落 × {falls}
          </div>
          <button className="mw-skip" onClick={(e) => { e.stopPropagation(); setShowGallery(true); }}>
            SKIP →
          </button>
        </div>
      </div>

      {/* return to title */}
      <button className="mw-skip" onClick={(e) => { e.stopPropagation(); onExit(); }}
        style={{ position: "fixed", bottom: 24, left: 24, zIndex: 36 }}>
        ← 标题
      </button>

      {/* tutorial hint */}
      {showHint && (
        <div className="mw-start-hint" style={{ top: "auto", bottom: 90 }}>
          <div className="sk-hand" style={{ fontSize: 24, color: "#1b1b1b" }}>
            拖动双手双脚，抓住岩点往上爬 🧗
          </div>
          <div className="mw-body" style={{ fontSize: 13, color: "#555", marginTop: 4 }}>
            橘色虚线圈 = 可以抓的手脚 · 别让身体离岩点太远
          </div>
        </div>
      )}

      {/* summit / win card */}
      {won && (
        <div className="mw-end-card" style={{
          position: "fixed", width: 260, zIndex: 45,
          left: "50%", top: "16%", transform: "translateX(-50%) rotate(-1.5deg)",
          background: "#fffdf6", border: "3px solid #1b1b1b", filter: "url(#wobble)",
          padding: "16px 20px", boxShadow: "3px 4px 0 rgba(0,0,0,.15)"
        }}>
          <div className="sk-mono" style={{ fontSize: 9, letterSpacing: ".22em", color: "#888" }}>
            HARD · 攀岩
          </div>
          <div className="mw-title" style={{ fontSize: 38, lineHeight: 1, marginTop: 4, color: "#d97757" }}>
            登顶通关 ✦
          </div>
          <div className="sk-hand" style={{ fontSize: 15, color: "#666", marginTop: 2 }}>
            你爬完了 my world
          </div>
          <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 4 }}>
            {[
              { label: "爬升高度", value: `${SUMMIT_Y} px` },
              { label: "滑落次数", value: `${falls} 次` },
              { label: "花的时间", value: timeStr },
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
            <button className="mw-btn" style={{ flex: 1, fontSize: 13, padding: "5px 8px" }}
              onClick={(e) => { e.stopPropagation(); replay(); }}>
              ↺ 再爬一次
            </button>
            <button className="mw-btn" style={{ flex: 1, fontSize: 13, padding: "5px 8px" }}
              onClick={(e) => { e.stopPropagation(); onExit(); }}>
              ← 标题
            </button>
          </div>
        </div>
      )}

      {workModal && (
        <WorkModal work={WORKS[workModal.workId]} workId={workModal.workId}
          onClose={() => setWorkModal(null)}/>
      )}

      {showGallery && (
        <Gallery onClose={() => setShowGallery(false)} onBackToWalk={() => setShowGallery(false)}/>
      )}
    </div>
  );
}
