/* My World — 涂鸦墙 · the doodle wall
 *
 * Six tiny experiments, each a real toy you can actually play with.
 * Click a card on the wall → open its toy → "← 涂鸦墙" to go back.
 */

import { useState, useRef, useEffect } from 'react';
import Overlay from './Overlay.jsx';
import { DOODLES_WALK } from '../world/data.js';
import { Cat } from '../world/Char.jsx';
import { playClick, playPianoNote, playPop, initAudio } from '../world/sound.js';

// Shared palette — same family of colours as the rest of the world.
const PALETTE = ["#d97757", "#cfe0c6", "#6f8f6a", "#fef3a3", "#c97a83", "#6a8ab0", "#e7d4c4"];
const CARD_BG = ["#cfe0c6", "#fef3a3", "#f7c5c0", "#a8c8e0", "#e7d4c4", "#cfe0c6"];
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

// Touch device? Used to phrase hints with "手指/屏幕" instead of "鼠标".
const isTouch = typeof matchMedia !== "undefined" && matchMedia("(pointer:coarse)").matches;

const boxStyle = {
  border: "2.5px solid #1b1b1b", filter: "url(#wobble)",
  position: "relative", overflow: "hidden",
};

// --- small shared bits ---
function Hint({ children }) {
  return (
    <div className="sk-hand" style={{
      position: "absolute", left: "50%", top: "50%", transform: "translate(-50%,-50%)",
      fontSize: 19, color: "#fff", background: "rgba(27,27,27,.62)", padding: "6px 16px",
      borderRadius: 999, pointerEvents: "none", whiteSpace: "nowrap",
    }}>{children}</div>
  );
}
function Caption({ children }) {
  return <div className="mw-body" style={{ fontSize: 14, color: "#777", marginTop: 10, lineHeight: 1.55 }}>{children}</div>;
}

// ============================================================
// Toy 1 — 小猫追光机 · a cat that chases a dot of light
// ============================================================
function CatLight() {
  const boxRef = useRef(null);
  const target = useRef({ x: 280, y: 110 });
  const pos = useRef({ x: 80, y: 175 });
  const [cat, setCat] = useState({ x: 80, y: 175 });
  const [light, setLight] = useState({ x: 280, y: 110 });
  const [face, setFace] = useState(1);
  const [moved, setMoved] = useState(false);

  useEffect(() => {
    let raf;
    const loop = () => {
      const p = pos.current, t = target.current;
      const dx = t.x - p.x;
      p.x += dx * 0.07;
      p.y += (t.y - p.y) * 0.07;
      setCat({ x: p.x, y: p.y });
      if (Math.abs(dx) > 4) setFace(dx > 0 ? 1 : -1);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);

  const aim = (e) => {
    const r = boxRef.current.getBoundingClientRect();
    const cx = (e.clientX ?? e.touches?.[0]?.clientX) - r.left;
    const cy = (e.clientY ?? e.touches?.[0]?.clientY) - r.top;
    target.current = { x: cx, y: cy };
    setLight({ x: cx, y: cy });
    setMoved(true);
  };

  return (
    <div>
      <div ref={boxRef} onMouseMove={aim} onTouchStart={aim}
        onTouchMove={(e) => { e.preventDefault(); aim(e); }}
        style={{ ...boxStyle, height: 240, cursor: "none",
          background: "radial-gradient(circle at 50% 28%, #2c3550 0%, #161b2e 92%)" }}>
        {/* the dot of light */}
        <div style={{ position: "absolute", left: light.x, top: light.y }}>
          <div style={{ position: "absolute", left: -42, top: -42, width: 84, height: 84,
            borderRadius: "50%", background: "radial-gradient(circle, rgba(254,243,163,.85) 0%, rgba(254,243,163,0) 70%)" }}/>
          <div style={{ position: "absolute", left: -5, top: -5, width: 10, height: 10,
            borderRadius: "50%", background: "#fff6c4", boxShadow: "0 0 12px 5px rgba(254,243,163,.9)" }}/>
        </div>
        {/* the cat */}
        <div style={{ position: "absolute", left: cat.x, top: cat.y,
          transform: `translate(-50%,-62%) scaleX(${face})` }}>
          <Cat size={58}/>
        </div>
        {!moved && <Hint>{isTouch ? "在屏幕上划一下" : "动动鼠标"} — 小猫会追那点光 ✦</Hint>}
      </div>
      <Caption>一只 svg 小猫,和一点跑来跑去的光 — 它永远追不上,但永远在追。</Caption>
    </div>
  );
}

// ============================================================
// Toy 2 — 心情天气 · click a mood, the little sky changes
// ============================================================
function Cloud({ x, y, scale = 1, dark = false }) {
  return (
    <svg style={{ position: "absolute", left: `${x}%`, top: `${y}%`, transform: `scale(${scale})` }}
      width="92" height="50" viewBox="0 0 92 50">
      <path d="M20 42 Q4 42 9 28 Q6 14 23 18 Q29 4 47 12 Q65 2 69 21 Q87 19 81 37 Q85 46 69 42 Z"
        fill={dark ? "#9aa3ad" : "#fdfdf8"} stroke="#1b1b1b" strokeWidth="2.5"
        strokeLinejoin="round" filter="url(#wobble)"/>
    </svg>
  );
}
function Particles({ kind }) {
  const n = kind === "rain" ? 38 : 24;
  return Array.from({ length: n }).map((_, i) => {
    const left = Math.random() * 100;
    if (kind === "rain") {
      return <div key={i} style={{ position: "absolute", left: `${left}%`, top: -16,
        width: 2, height: 14, background: "rgba(255,255,255,.7)",
        animation: `dw-rain ${0.55 + Math.random() * 0.35}s linear infinite`,
        animationDelay: `${-Math.random() * 0.9}s` }}/>;
    }
    return <div key={i} style={{ position: "absolute", left: `${left}%`, top: -12,
      width: 6, height: 6, borderRadius: "50%", background: "#fff",
      animation: `dw-snow ${3 + Math.random() * 2.4}s linear infinite`,
      animationDelay: `${-Math.random() * 4}s` }}/>;
  });
}
// little hand-drawn weather glyphs for the Weather toy's buttons
function WeatherGlyph({ kind, active }) {
  const ink = "#1b1b1b";
  const tint = active ? "#fffdf6" : ink;
  const wrap = (c) => (
    <svg width="16" height="16" viewBox="0 0 24 24"
         style={{ display: "inline-block", verticalAlign: "-3px", marginRight: 4 }}>{c}</svg>
  );
  if (kind === "sun") return wrap(<>
    <circle cx="12" cy="12" r="5" fill="none" stroke={tint} strokeWidth="2"/>
    {[0,1,2,3,4,5,6,7].map(i => {
      const a = i * Math.PI / 4;
      return <line key={i} x1={12 + Math.cos(a) * 8} y1={12 + Math.sin(a) * 8}
        x2={12 + Math.cos(a) * 11} y2={12 + Math.sin(a) * 11}
        stroke={tint} strokeWidth="2" strokeLinecap="round"/>;
    })}
  </>);
  if (kind === "cloud") return wrap(
    <path d="M7 17 Q3 17 4 13 Q3 8 9 9 Q11 4 16 7 Q21 6 20 12 Q23 13 20 17 Z"
      fill="none" stroke={tint} strokeWidth="2" strokeLinejoin="round"/>
  );
  if (kind === "rain") return wrap(<>
    <path d="M7 13 Q3 13 4 9 Q3 5 9 6 Q11 2 16 4 Q21 4 20 9 Q22 10 20 13 Z"
      fill="none" stroke={tint} strokeWidth="2" strokeLinejoin="round"/>
    <line x1="9" y1="16" x2="8" y2="20" stroke={tint} strokeWidth="2" strokeLinecap="round"/>
    <line x1="14" y1="16" x2="13" y2="21" stroke={tint} strokeWidth="2" strokeLinecap="round"/>
    <line x1="18" y1="16" x2="17" y2="20" stroke={tint} strokeWidth="2" strokeLinecap="round"/>
  </>);
  // snow
  return wrap(<>
    <path d="M7 13 Q3 13 4 9 Q3 5 9 6 Q11 2 16 4 Q21 4 20 9 Q22 10 20 13 Z"
      fill="none" stroke={tint} strokeWidth="2" strokeLinejoin="round"/>
    <circle cx="9" cy="18" r="1.4" fill={tint}/>
    <circle cx="14" cy="20" r="1.4" fill={tint}/>
    <circle cx="18" cy="18" r="1.4" fill={tint}/>
  </>);
}
function Weather() {
  const [w, setW] = useState("sun");
  const opts = [
    { id: "sun", name: "晴" }, { id: "cloud", name: "阴" },
    { id: "rain", name: "雨" }, { id: "snow", name: "雪" },
  ];
  const sky = {
    sun:   "linear-gradient(180deg,#bfe0f5 0%,#fef3a3 100%)",
    cloud: "linear-gradient(180deg,#c9cdd4 0%,#e8e6e0 100%)",
    rain:  "linear-gradient(180deg,#5b6b80 0%,#8a97a8 100%)",
    snow:  "linear-gradient(180deg,#aeb9c9 0%,#e6ecf2 100%)",
  };
  return (
    <div>
      <div style={{ ...boxStyle, height: 224, background: sky[w], transition: "background .6s" }}>
        {w === "sun" && (
          <>
            <div style={{ position: "absolute", left: "50%", top: 64,
              transform: "translate(-50%,-50%)", width: 132, height: 132,
              animation: "mw-spin 16s linear infinite" }}>
              <svg width="132" height="132" viewBox="0 0 132 132">
                {Array.from({ length: 12 }).map((_, i) => {
                  const a = i * 30 * Math.PI / 180;
                  return <line key={i} x1={66 + Math.cos(a) * 40} y1={66 + Math.sin(a) * 40}
                    x2={66 + Math.cos(a) * 60} y2={66 + Math.sin(a) * 60}
                    stroke="#efb24a" strokeWidth="4" strokeLinecap="round"/>;
                })}
              </svg>
            </div>
            <div style={{ position: "absolute", left: "50%", top: 64, transform: "translate(-50%,-50%)",
              width: 56, height: 56, borderRadius: "50%", background: "#fef3a3",
              border: "3px solid #1b1b1b", filter: "url(#wobble)" }}/>
          </>
        )}
        {w === "cloud" && <><Cloud x={14} y={20} scale={1.1}/><Cloud x={52} y={36}/><Cloud x={30} y={54} scale={0.85}/></>}
        {w === "rain" && <><Cloud x={16} y={14} dark scale={1.15}/><Cloud x={50} y={26} dark/><Particles kind="rain"/></>}
        {w === "snow" && <><Cloud x={18} y={16} scale={1.1}/><Cloud x={52} y={28}/><Particles kind="snow"/></>}
        {/* ground */}
        <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: 44,
          background: "#cfe0c6", borderTop: "2.5px solid #1b1b1b" }}/>
      </div>
      <div style={{ display: "flex", gap: 8, marginTop: 12, flexWrap: "wrap" }}>
        {opts.map(o => (
          <button key={o.id} className="mw-btn" onClick={() => setW(o.id)}
            style={{ fontSize: 15, padding: "6px 14px",
              background: w === o.id ? "#d97757" : "#fffdf6",
              color: w === o.id ? "#fffdf6" : "#1b1b1b" }}>
            <WeatherGlyph kind={o.id} active={w === o.id}/>{o.name}
          </button>
        ))}
      </div>
      <Caption>点一种天气 — 整片小天空,连同雨雪都跟着变。</Caption>
    </div>
  );
}

// ============================================================
// Toy 3 — 字母重力场 · type, and letters fall with gravity
// ============================================================
function Letters() {
  const boxRef = useRef(null);
  const size = useRef({ w: 500, h: 240 });
  const items = useRef([]);
  const idRef = useRef(0);
  const [, render] = useState(0);

  useEffect(() => {
    const measure = () => {
      if (boxRef.current) {
        const r = boxRef.current.getBoundingClientRect();
        size.current = { w: r.width, h: r.height };
      }
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);

  useEffect(() => {
    let raf, last = performance.now();
    const loop = (t) => {
      const dt = Math.min(0.032, (t - last) / 1000); last = t;
      const { w, h } = size.current;
      for (const it of items.current) {
        it.vy += 1400 * dt;
        it.x += it.vx * dt;
        it.y += it.vy * dt;
        it.rot += it.vr * dt;
        const floor = h - 24;
        if (it.y > floor) {
          it.y = floor; it.vy *= -0.45; it.vx *= 0.7; it.vr *= 0.6;
          if (Math.abs(it.vy) < 38) it.vy = 0;
        }
        if (it.x < 16) { it.x = 16; it.vx *= -0.6; }
        if (it.x > w - 16) { it.x = w - 16; it.vx *= -0.6; }
      }
      render(n => n + 1);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);

  const drop = (ch, atX) => {
    const { w } = size.current;
    items.current = [...items.current, {
      id: idRef.current++, ch,
      x: atX ?? (30 + Math.random() * (w - 60)), y: -20,
      vx: (Math.random() - 0.5) * 130, vy: 0,
      rot: (Math.random() - 0.5) * 40, vr: (Math.random() - 0.5) * 300,
      color: pick(PALETTE),
    }].slice(-44);
  };

  useEffect(() => {
    const onKey = (e) => {
      if (e.key.length === 1 && /\S/.test(e.key)) drop(e.key.toUpperCase());
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const handful = [..."ARDEN好玩✦"];
  return (
    <div>
      <div ref={boxRef}
        onMouseDown={(e) => { const r = boxRef.current.getBoundingClientRect(); drop("✦", e.clientX - r.left); }}
        style={{ ...boxStyle, height: 240, background: "#fffdf6" }}>
        {items.current.map(it => (
          <div key={it.id} className="mw-title" style={{
            position: "absolute", left: it.x, top: it.y,
            transform: `translate(-50%,-50%) rotate(${it.rot}deg)`,
            fontSize: 34, color: it.color, lineHeight: 1,
          }}>{it.ch}</div>
        ))}
        {items.current.length === 0 && <Hint>打字试试 — 字母会掉下来 ✦</Hint>}
      </div>
      <div style={{ display: "flex", gap: 8, marginTop: 12, flexWrap: "wrap", alignItems: "center" }}>
        <button className="mw-btn" style={{ fontSize: 15, padding: "6px 14px" }}
          onClick={() => handful.forEach((c, i) => setTimeout(() => drop(c), i * 90))}>撒一把 →</button>
        <button className="mw-btn" style={{ fontSize: 15, padding: "6px 14px" }}
          onClick={() => { items.current = []; }}>清空</button>
        <span className="sk-hand" style={{ fontSize: 16, color: "#888" }}>或直接打字 / 点框里</span>
      </div>
      <Caption>每个字母都有重量 — 打出来,看它们落下、回弹、堆起来。</Caption>
    </div>
  );
}

// ============================================================
// Toy 4 — 夜里的钟 · a clock that turns blue at night
// ============================================================
function NightClock() {
  const now = () => { const d = new Date(); return d.getHours() + d.getMinutes() / 60; };
  const [hour, setHour] = useState(now);
  const [live, setLive] = useState(true);
  const [, tick] = useState(0);

  useEffect(() => {
    if (!live) return;
    const id = setInterval(() => { setHour(now()); tick(t => t + 1); }, 1000);
    return () => clearInterval(id);
  }, [live]);

  const h = ((hour % 24) + 24) % 24;
  const night = h >= 23 || h < 6;
  const hourAngle = (h % 12) * 30;
  const minAngle = (h % 1) * 360;
  const secAngle = live ? new Date().getSeconds() * 6 : 0;
  const face = night ? "#26344f" : "#fffdf6";
  const ink = night ? "#bcd0e8" : "#1b1b1b";
  const hh = String(Math.floor(h)).padStart(2, "0");
  const mm = String(Math.floor((h % 1) * 60)).padStart(2, "0");

  return (
    <div>
      <div style={{ ...boxStyle, height: 234, transition: "background .5s",
        display: "flex", alignItems: "center", justifyContent: "center",
        background: night
          ? "linear-gradient(180deg,#1c2740 0%,#34405c 100%)"
          : "linear-gradient(180deg,#cfe6f5 0%,#fef3a3 100%)" }}>
        <svg width="172" height="172" viewBox="0 0 172 172">
          <circle cx="86" cy="86" r="72" fill={face} stroke={ink} strokeWidth="3" filter="url(#wobble)"/>
          {Array.from({ length: 12 }).map((_, i) => {
            const a = i * 30 * Math.PI / 180;
            return <line key={i}
              x1={86 + Math.sin(a) * 64} y1={86 - Math.cos(a) * 64}
              x2={86 + Math.sin(a) * 57} y2={86 - Math.cos(a) * 57}
              stroke={ink} strokeWidth="2.5" strokeLinecap="round"/>;
          })}
          <line x1="86" y1="86" x2="86" y2="50" stroke={ink} strokeWidth="5.5" strokeLinecap="round"
            transform={`rotate(${hourAngle} 86 86)`}/>
          <line x1="86" y1="86" x2="86" y2="32" stroke={ink} strokeWidth="3.5" strokeLinecap="round"
            transform={`rotate(${minAngle} 86 86)`}/>
          <line x1="86" y1="94" x2="86" y2="28" stroke="#d97757" strokeWidth="2" strokeLinecap="round"
            transform={`rotate(${secAngle} 86 86)`}/>
          <circle cx="86" cy="86" r="4.5" fill="#d97757" stroke={ink} strokeWidth="2"/>
          {night && (
            <path d="M132 32 A12 12 0 1 0 132 56 A9 9 0 1 1 132 32 Z"
                  fill="#fef3a3" stroke="#1b1b1b" strokeWidth="2"/>
          )}
        </svg>
      </div>
      <div style={{ marginTop: 12 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
          <span className="mw-title" style={{ fontSize: 26 }}>{hh}:{mm}</span>
          <span className="sk-hand" style={{ fontSize: 17, color: night ? "#6a8ab0" : "#888" }}>
            {night ? "夜里了 — 钟变蓝了" : "白天"}
          </span>
        </div>
        <input type="range" min="0" max="23.99" step="0.25" value={h}
          onChange={(e) => { setLive(false); setHour(parseFloat(e.target.value)); }}
          style={{ width: "100%", marginTop: 8, accentColor: "#d97757" }}/>
        <button className="mw-btn" style={{ fontSize: 14, padding: "5px 12px", marginTop: 4 }}
          onClick={() => { setHour(now()); setLive(true); }}>回到现在</button>
      </div>
      <Caption>滑到晚上 11 点 — 看这只钟自己睡过去,变成一片夜的蓝色。</Caption>
    </div>
  );
}

// ============================================================
// Toy 5 — 纸鹤生成器 · fold a random paper crane each click
// ============================================================
function Crane({ color }) {
  return (
    <svg width="76" height="70" viewBox="0 0 120 110">
      <path d="M60 54 L8 16 L44 60 Z" fill={color} stroke="#1b1b1b" strokeWidth="2.5" strokeLinejoin="round" filter="url(#wobble)"/>
      <path d="M60 54 L112 16 L76 60 Z" fill={color} stroke="#1b1b1b" strokeWidth="2.5" strokeLinejoin="round" filter="url(#wobble)"/>
      <path d="M62 50 L106 80 L74 58 Z" fill={color} stroke="#1b1b1b" strokeWidth="2.5" strokeLinejoin="round"/>
      <path d="M52 56 L68 56 L60 92 Z" fill={color} stroke="#1b1b1b" strokeWidth="2.5" strokeLinejoin="round"/>
      <path d="M58 52 L14 68 L42 58 Z" fill={color} stroke="#1b1b1b" strokeWidth="2.5" strokeLinejoin="round"/>
      <path d="M14 68 L3 62 L17 74 Z" fill="#1b1b1b"/>
    </svg>
  );
}
function CraneToy() {
  const [flock, setFlock] = useState([]);
  const idRef = useRef(0);
  const add = () => { playClick(); setFlock(prev => [...prev, {
    id: idRef.current++,
    x: 8 + Math.random() * 74, y: 6 + Math.random() * 62,
    color: pick(PALETTE), rot: (Math.random() - 0.5) * 64,
    scale: 0.66 + Math.random() * 0.7,
  }].slice(-14)); };

  return (
    <div>
      <div style={{ ...boxStyle, height: 240, background: "linear-gradient(180deg,#eaf2f6 0%,#fffdf6 100%)" }}>
        {flock.map(f => (
          <div key={f.id} className="dw-fade" style={{
            position: "absolute", left: `${f.x}%`, top: `${f.y}%`,
            transform: `rotate(${f.rot}deg) scale(${f.scale})`,
          }}>
            <Crane color={f.color}/>
          </div>
        ))}
        {flock.length === 0 && <Hint>按下面的按钮 — 折一只纸鹤 ✦</Hint>}
      </div>
      <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
        <button className="mw-btn mw-btn-primary" style={{ fontSize: 15, padding: "6px 16px" }} onClick={add}>折一只 →</button>
        <button className="mw-btn" style={{ fontSize: 15, padding: "6px 14px" }} onClick={() => setFlock([])}>收起来</button>
      </div>
      <Caption>颜色、角度、大小全是随机的 — 折一百只,也不会有两只一样。</Caption>
    </div>
  );
}

// ============================================================
// Toy 6 — 拼贴画生成器 · the program draws, so you don't have to
// ============================================================
function makeCollage() {
  const cells = [];
  const split = (x, y, w, h, depth) => {
    const stop = depth <= 0 || w < 30 || h < 30 || (depth < 4 && Math.random() < 0.34);
    if (stop) {
      cells.push({ x, y, w, h, color: pick(PALETTE), circle: Math.random() < 0.24 });
      return;
    }
    const vertical = w > h ? Math.random() < 0.78 : Math.random() < 0.22;
    const r = 0.32 + Math.random() * 0.36;
    if (vertical) {
      split(x, y, w * r, h, depth - 1);
      split(x + w * r, y, w * (1 - r), h, depth - 1);
    } else {
      split(x, y, w, h * r, depth - 1);
      split(x, y + h * r, w, h * (1 - r), depth - 1);
    }
  };
  split(0, 0, 100, 100, 5);
  return cells;
}
function Collage() {
  const [art, setArt] = useState(makeCollage);
  const [n, setN] = useState(1);
  return (
    <div>
      <div style={{ ...boxStyle, height: 264, background: "#fffdf6", padding: 14,
        display: "flex", alignItems: "center", justifyContent: "center" }}>
        <svg key={n} viewBox="0 0 100 100" className="dw-fade"
          style={{ height: "100%", aspectRatio: "1 / 1", border: "2.5px solid #1b1b1b", filter: "url(#wobble)" }}>
          {art.map((c, i) => c.circle ? (
            <circle key={i} cx={c.x + c.w / 2} cy={c.y + c.h / 2}
              r={Math.min(c.w, c.h) / 2 * 0.82} fill={c.color} stroke="#1b1b1b" strokeWidth="1.4"/>
          ) : (
            <rect key={i} x={c.x} y={c.y} width={c.w} height={c.h}
              fill={c.color} stroke="#1b1b1b" strokeWidth="1.4"/>
          ))}
        </svg>
      </div>
      <div style={{ display: "flex", gap: 8, marginTop: 12, alignItems: "center" }}>
        <button className="mw-btn mw-btn-primary" style={{ fontSize: 15, padding: "6px 16px" }}
          onClick={() => { playClick(); setArt(makeCollage()); setN(v => v + 1); }}>换一张 →</button>
        <span className="sk-hand" style={{ fontSize: 16, color: "#888" }}>第 {n} 张</span>
      </div>
      <Caption>我不会画画 — 所以写了这个,让它替我画。每一张都不重样。</Caption>
    </div>
  );
}

// ============================================================
// Toy 7 — 小钢琴 · 8 keys, a real little piano
// ============================================================
const PIANO_KEYS = [
  { label: "C", freq: 261.63 },
  { label: "D", freq: 293.66 },
  { label: "E", freq: 329.63 },
  { label: "F", freq: 349.23 },
  { label: "G", freq: 392.00 },
  { label: "A", freq: 440.00 },
  { label: "B", freq: 493.88 },
  { label: "C↑", freq: 523.25 },
];
// 小星星 — twinkle twinkle little star (indexes into PIANO_KEYS)
const PIANO_TUNE = [0,0,4,4,5,5,4, 3,3,2,2,1,1,0];
function Piano() {
  const [pressed, setPressed] = useState({});
  const press = (i) => {
    initAudio();
    playPianoNote(PIANO_KEYS[i].freq);
    setPressed(p => ({ ...p, [i]: true }));
    setTimeout(() => setPressed(p => ({ ...p, [i]: false })), 200);
  };
  const playTune = () => {
    PIANO_TUNE.forEach((idx, i) => setTimeout(() => press(idx), i * 280));
  };
  return (
    <div>
      <div style={{ ...boxStyle, height: 240, padding: 18,
        background: "linear-gradient(180deg,#fef3a3 0%,#fffdf6 100%)",
        display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
        <div style={{ display: "flex", gap: 4, width: "100%", maxWidth: 360 }}>
          {PIANO_KEYS.map((k, i) => (
            <div key={i}
              onMouseDown={() => press(i)}
              onTouchStart={(e) => { e.preventDefault(); press(i); }}
              style={{
                flex: "1 1 0", minWidth: 0, height: 168, background: pressed[i] ? "#fef3a3" : "#fffdf6",
                border: "2.5px solid #1b1b1b", filter: "url(#wobble)", cursor: "pointer",
                display: "flex", alignItems: "flex-end", justifyContent: "center",
                paddingBottom: 10, userSelect: "none",
                transform: pressed[i] ? "translateY(2px)" : "none",
                transition: "transform .1s, background .1s",
                boxShadow: pressed[i] ? "1px 1px 0 rgba(0,0,0,.15)" : "2px 4px 0 rgba(0,0,0,.18)",
              }}>
              <span className="sk-mono" style={{ fontSize: 11, letterSpacing: ".1em", color: "#1b1b1b" }}>{k.label}</span>
            </div>
          ))}
        </div>
      </div>
      <div style={{ display: "flex", gap: 8, marginTop: 12, alignItems: "center" }}>
        <button className="mw-btn mw-btn-primary" style={{ fontSize: 15, padding: "6px 14px" }}
          onClick={playTune}>来一段 ♪</button>
        <span className="sk-hand" style={{ fontSize: 16, color: "#888" }}>或自己点琴键</span>
      </div>
      <Caption>八个键、八个音 — 弹什么都行。最普通的小事最好玩。</Caption>
    </div>
  );
}

// ============================================================
// Toy 8 — 肥皂泡 · bubbles drift up, click to pop
// ============================================================
function Bubbles() {
  const boxRef = useRef(null);
  const items = useRef([]);
  const idRef = useRef(0);
  const size = useRef({ w: 500, h: 240 });
  const [, render] = useState(0);
  const [popped, setPopped] = useState(0);

  useEffect(() => {
    const measure = () => {
      if (boxRef.current) {
        const r = boxRef.current.getBoundingClientRect();
        size.current = { w: r.width, h: r.height };
      }
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);

  useEffect(() => {
    let raf, last = performance.now();
    const spawn = () => {
      const { w, h } = size.current;
      items.current.push({
        id: idRef.current++,
        x: 30 + Math.random() * (w - 60),
        y: h + 20,
        vx: (Math.random() - 0.5) * 22,
        vy: -34 - Math.random() * 28,
        r: 18 + Math.random() * 22,
        hue: 180 + Math.random() * 180,
        wobble: Math.random() * Math.PI * 2,
        pop: 0,
      });
      if (items.current.length > 40) items.current.shift();
    };
    const sid = setInterval(spawn, 520);
    const loop = (t) => {
      const dt = Math.min(0.035, (t - last) / 1000); last = t;
      for (const it of items.current) {
        if (it.pop > 0) { it.pop += dt * 4; continue; }
        it.wobble += dt * 2;
        it.x += (it.vx + Math.sin(it.wobble) * 18) * dt;
        it.y += it.vy * dt;
        it.vy *= 0.998;
      }
      items.current = items.current.filter(it => it.y > -60 && it.pop < 1);
      render(n => n + 1);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => { cancelAnimationFrame(raf); clearInterval(sid); };
  }, []);

  const popAt = (e) => {
    const r = boxRef.current.getBoundingClientRect();
    const cx = (e.clientX ?? e.touches?.[0]?.clientX) - r.left;
    const cy = (e.clientY ?? e.touches?.[0]?.clientY) - r.top;
    for (const it of items.current) {
      if (it.pop > 0) continue;
      if (Math.hypot(it.x - cx, it.y - cy) < it.r + 6) {
        it.pop = 0.01;
        setPopped(p => p + 1);
        initAudio(); playPop();
        return;
      }
    }
  };

  return (
    <div>
      <div ref={boxRef}
        onMouseDown={popAt}
        onTouchStart={(e) => { e.preventDefault(); popAt(e); }}
        style={{ ...boxStyle, height: 240, cursor: "crosshair",
          background: "linear-gradient(180deg,#a8c8e0 0%,#e0f0ee 100%)" }}>
        {items.current.map(it => (
          <div key={it.id} style={{
            position: "absolute", left: it.x - it.r, top: it.y - it.r,
            width: it.r * 2, height: it.r * 2, borderRadius: "50%",
            background: `radial-gradient(circle at 30% 30%, rgba(255,255,255,.85), hsla(${it.hue},70%,75%,.35) 70%)`,
            border: "1.8px solid rgba(27,27,27,.7)",
            transform: it.pop > 0 ? `scale(${1 + it.pop * 0.7})` : "none",
            opacity: it.pop > 0 ? Math.max(0, 1 - it.pop) : 1,
            pointerEvents: "none",
            transition: it.pop > 0 ? "opacity .25s, transform .25s" : "none",
          }}>
            <div style={{ position: "absolute", top: "16%", left: "22%",
              width: "26%", height: "18%", borderRadius: "50%",
              background: "rgba(255,255,255,.8)" }}/>
          </div>
        ))}
        {popped === 0 && <Hint>点泡泡 — 戳破它 ✦</Hint>}
      </div>
      <Caption>戳破了 {popped} 个 — 都是空的,可是听见啵的一声还是很好玩。</Caption>
    </div>
  );
}

// ============================================================
// Toy 9 — 小盲盒 · pull a random small thing (everything hand-drawn)
// ============================================================
function GiftIcon({ kind }) {
  const SZ = 84, stroke = "#1b1b1b", sw = 3;
  const wrap = (children) => (
    <svg width={SZ} height={SZ} viewBox="0 0 100 100" style={{ display: "block" }}>{children}</svg>
  );
  switch (kind) {
    case "star":
      return wrap(<>
        {[0,1,2,3,4].map(i => {
          const a = -Math.PI / 2 + i * 2 * Math.PI / 5;
          const a2 = a + Math.PI / 5;
          return <path key={i} d={`M${50 + Math.cos(a)*36} ${50 + Math.sin(a)*36}
            L${50 + Math.cos(a2)*14} ${50 + Math.sin(a2)*14}`}
            stroke={stroke} strokeWidth={sw} fill="#fef3a3" strokeLinejoin="round"/>;
        })}
        <path d={`M50 14 L${50+11}${" "}${50-(Math.sin(Math.PI/5)*14)+0} `} fill="#fef3a3"/>
        {/* clean star polygon as fill */}
        <polygon points={
          [0,1,2,3,4,5,6,7,8,9].map(i => {
            const a = -Math.PI/2 + i * Math.PI/5;
            const r = i % 2 === 0 ? 36 : 14;
            return `${50 + Math.cos(a)*r},${50 + Math.sin(a)*r}`;
          }).join(" ")}
          fill="#fef3a3" stroke={stroke} strokeWidth={sw} strokeLinejoin="round"/>
      </>);
    case "sprout":
      return wrap(<>
        <line x1="50" y1="86" x2="50" y2="46" stroke="#5e7a4f" strokeWidth={sw} strokeLinecap="round"/>
        <path d="M50 56 Q26 50 26 28 Q44 32 50 56 Z"
          fill="#9bb18e" stroke={stroke} strokeWidth={sw} strokeLinejoin="round"/>
        <path d="M50 46 Q74 40 74 18 Q56 22 50 46 Z"
          fill="#7f9a76" stroke={stroke} strokeWidth={sw} strokeLinejoin="round"/>
        <ellipse cx="50" cy="90" rx="22" ry="4" fill="#8b6539" stroke={stroke} strokeWidth="2"/>
      </>);
    case "cup":
      return wrap(<>
        <path d="M26 36 L74 36 L70 80 Q50 86 30 80 Z"
          fill="#fffdf6" stroke={stroke} strokeWidth={sw} strokeLinejoin="round"/>
        <path d="M30 42 L70 42 L68 50 Q50 54 32 50 Z" fill="#c89058"/>
        <path d="M74 46 Q88 52 80 70" fill="none" stroke={stroke} strokeWidth={sw}/>
        <path d="M40 28 Q44 18 40 8" stroke={stroke} strokeWidth="2.4" fill="none" strokeLinecap="round"/>
        <path d="M52 26 Q56 16 52 6" stroke={stroke} strokeWidth="2.4" fill="none" strokeLinecap="round"/>
      </>);
    case "postcard":
      return wrap(<>
        <rect x="14" y="26" width="72" height="50"
          fill="#fffdf6" stroke={stroke} strokeWidth={sw}/>
        <path d="M14 26 L50 54 L86 26" fill="none" stroke={stroke} strokeWidth="2"/>
        <rect x="64" y="34" width="16" height="12" fill="#c97a83" stroke={stroke} strokeWidth="1.6"/>
        <line x1="22" y1="62" x2="56" y2="62" stroke="#7a6648" strokeWidth="2"/>
        <line x1="22" y1="68" x2="46" y2="68" stroke="#7a6648" strokeWidth="2"/>
      </>);
    case "note":
      return wrap(<>
        <line x1="62" y1="76" x2="62" y2="22" stroke={stroke} strokeWidth={sw} strokeLinecap="round"/>
        <ellipse cx="50" cy="76" rx="14" ry="10" fill={stroke} stroke={stroke} strokeWidth={sw}/>
        <path d="M62 22 L86 30 L86 44 L62 36 Z" fill="#d97757" stroke={stroke} strokeWidth={sw} strokeLinejoin="round"/>
      </>);
    case "mirror":
      return wrap(<>
        <ellipse cx="50" cy="40" rx="26" ry="32" fill="#a8c8e0" stroke={stroke} strokeWidth={sw}/>
        <ellipse cx="42" cy="32" rx="8" ry="14" fill="rgba(255,255,255,.6)"/>
        <rect x="46" y="68" width="8" height="20" fill="#a77a4a" stroke={stroke} strokeWidth={sw}/>
        <rect x="36" y="86" width="28" height="6" fill="#7a5a36" stroke={stroke} strokeWidth={sw}/>
      </>);
    case "key":
      return wrap(<>
        <circle cx="32" cy="50" r="16" fill="#efb24a" stroke={stroke} strokeWidth={sw}/>
        <circle cx="32" cy="50" r="6" fill="#fffdf6" stroke={stroke} strokeWidth={sw}/>
        <line x1="48" y1="50" x2="84" y2="50" stroke={stroke} strokeWidth="6" strokeLinecap="round"/>
        <line x1="70" y1="50" x2="70" y2="62" stroke={stroke} strokeWidth="4" strokeLinecap="round"/>
        <line x1="80" y1="50" x2="80" y2="58" stroke={stroke} strokeWidth="4" strokeLinecap="round"/>
      </>);
    case "leaf":
      return wrap(<>
        <path d="M16 76 Q40 14 84 24 Q72 70 16 76 Z"
          fill="#9bb18e" stroke={stroke} strokeWidth={sw} strokeLinejoin="round"/>
        <path d="M16 76 Q44 56 80 30" stroke={stroke} strokeWidth="2" fill="none"/>
        <path d="M32 64 Q46 56 60 50" stroke={stroke} strokeWidth="1.6" fill="none"/>
        <path d="M28 56 Q42 50 56 44" stroke={stroke} strokeWidth="1.6" fill="none"/>
      </>);
    case "camera":
      return wrap(<>
        <rect x="14" y="32" width="72" height="48" fill="#1b1b1b" stroke={stroke} strokeWidth={sw} rx="3"/>
        <rect x="36" y="24" width="22" height="10" fill="#1b1b1b" stroke={stroke} strokeWidth={sw}/>
        <circle cx="50" cy="56" r="16" fill="#a8c8e0" stroke={stroke} strokeWidth={sw}/>
        <circle cx="50" cy="56" r="9" fill="#1b1b1b"/>
        <circle cx="44" cy="50" r="3" fill="rgba(255,255,255,.6)"/>
        <circle cx="74" cy="40" r="3" fill="#d97757" stroke={stroke} strokeWidth="1.6"/>
      </>);
    case "letter":
      return wrap(<>
        <rect x="14" y="26" width="72" height="48"
          fill="#fffdf6" stroke={stroke} strokeWidth={sw}/>
        <path d="M14 26 L50 56 L86 26" fill="none" stroke={stroke} strokeWidth={sw}/>
        <path d="M40 60 Q50 56 60 60 Q56 70 50 68 Q44 70 40 60 Z"
          fill="#c97a83" stroke={stroke} strokeWidth="1.6"/>
      </>);
    case "yarn":
      return wrap(<>
        <circle cx="50" cy="52" r="30" fill="#c97a83" stroke={stroke} strokeWidth={sw}/>
        {[0,1,2,3].map(i => (
          <ellipse key={i} cx="50" cy="52" rx="30" ry={10 - i*2}
            fill="none" stroke="rgba(27,27,27,.35)" strokeWidth="1.4"
            transform={`rotate(${i * 30 - 30} 50 52)`}/>
        ))}
        <path d="M80 52 Q90 60 92 84" fill="none" stroke={stroke} strokeWidth={sw} strokeLinecap="round"/>
      </>);
    case "candle":
      return wrap(<>
        <rect x="36" y="40" width="28" height="44" fill="#fef3a3" stroke={stroke} strokeWidth={sw}/>
        <ellipse cx="50" cy="40" rx="14" ry="4" fill="#fef3a3" stroke={stroke} strokeWidth={sw}/>
        <line x1="50" y1="40" x2="50" y2="28" stroke={stroke} strokeWidth="2"/>
        <path d="M50 28 Q44 22 50 8 Q58 22 50 28 Z" fill="#d97757" stroke={stroke} strokeWidth="2.2"/>
        <ellipse cx="50" cy="14" rx="2.5" ry="6" fill="#fef3a3"/>
        <ellipse cx="50" cy="86" rx="14" ry="3" fill="#a77a4a" stroke={stroke} strokeWidth="2"/>
      </>);
    case "shell":
      return wrap(<>
        <path d="M50 18 Q86 60 50 84 Q14 60 50 18 Z"
          fill="#f7c5c0" stroke={stroke} strokeWidth={sw} strokeLinejoin="round"/>
        {[20, 32, 44, 56, 68].map((deg, i) => (
          <path key={i} d="M50 18 Q50 60 50 84"
            stroke={stroke} strokeWidth="1.6" fill="none"
            transform={`rotate(${deg - 44} 50 50)`}/>
        ))}
      </>);
    case "cookie":
      return wrap(<>
        <circle cx="50" cy="52" r="32" fill="#c89058" stroke={stroke} strokeWidth={sw}/>
        <circle cx="38" cy="42" r="3.5" fill={stroke}/>
        <circle cx="58" cy="38" r="3" fill={stroke}/>
        <circle cx="64" cy="58" r="3.5" fill={stroke}/>
        <circle cx="42" cy="62" r="3" fill={stroke}/>
        <circle cx="50" cy="50" r="3" fill={stroke}/>
        <path d="M28 38 Q22 42 26 48" stroke={stroke} strokeWidth="1.6" fill="none"/>
      </>);
    default:
      return null;
  }
}
const GIFTS = [
  { kind: "star",     note: "一颗小星星 — 你看,它亮的" },
  { kind: "sprout",   note: "一棵小芽 — 等等它" },
  { kind: "cup",      note: "一杯热的 — 喝慢点" },
  { kind: "postcard", note: "一张明信片 — 路上写的" },
  { kind: "note",     note: "一段调子 — 自己哼" },
  { kind: "mirror",   note: "一面小镜子 — 看自己" },
  { kind: "key",      note: "一把小钥匙 — 不知开什么" },
  { kind: "leaf",     note: "一片叶子 — 春天的" },
  { kind: "camera",   note: "一张老照片 — 记得" },
  { kind: "letter",   note: "一封没寄的信 — 收着" },
  { kind: "yarn",     note: "一团毛线 — 慢慢绕" },
  { kind: "candle",   note: "一支蜡烛 — 慢慢的" },
  { kind: "shell",    note: "一只小贝壳 — 海带回来的" },
  { kind: "cookie",   note: "一块小饼干 — 自己吃" },
];
function MysteryBox() {
  const [gift, setGift] = useState(null);
  const [count, setCount] = useState(0);
  const draw = () => {
    initAudio(); playClick();
    setGift(GIFTS[Math.floor(Math.random() * GIFTS.length)]);
    setCount(c => c + 1);
  };
  return (
    <div>
      <div style={{ ...boxStyle, height: 240,
        background: "linear-gradient(180deg,#f7e2c4 0%,#e7d4c4 100%)",
        display: "flex", alignItems: "center", justifyContent: "center" }}>
        {!gift ? (
          <button onClick={draw} className="mw-btn mw-btn-primary"
            style={{ fontSize: 19, padding: "14px 30px" }}>
            拆一个 →
          </button>
        ) : (
          <div key={count} className="dw-fade" style={{ textAlign: "center" }}>
            <div style={{ display: "flex", justifyContent: "center", marginBottom: 6 }}>
              <GiftIcon kind={gift.kind}/>
            </div>
            <div className="sk-hand" style={{ fontSize: 22, color: "#1b1b1b" }}>{gift.note}</div>
            <button onClick={draw} className="mw-btn" style={{ fontSize: 14, padding: "5px 14px", marginTop: 14 }}>
              ↺ 再来一个
            </button>
          </div>
        )}
      </div>
      <Caption>抽到的不重样 — 一共十多种, 全是手绘的小礼物{count > 0 && <> · 你拆了 {count} 次</>}。</Caption>
    </div>
  );
}

// ============================================================
// Toy 10 — 泡杯茶 · click to dip the bag, water deepens over time
// ============================================================
function TeaBrew() {
  const STEEP_MAX = 6;
  const [n, setN] = useState(0);
  const dip = () => {
    if (n >= STEEP_MAX) return;
    initAudio(); playClick();
    setN(v => v + 1);
  };
  // tea color: from very pale to deep brown
  const t = n / STEEP_MAX;
  const teaR = Math.round(245 - t * (245 - 152));
  const teaG = Math.round(228 - t * (228 - 90));
  const teaB = Math.round(176 - t * (176 - 38));
  const teaColor = `rgb(${teaR}, ${teaG}, ${teaB})`;
  // tea level rises a touch as it steeps
  const teaTop = 58 - t * 4;

  return (
    <div>
      <div onMouseDown={dip}
           onTouchStart={(e) => { e.preventDefault(); dip(); }}
           style={{ ...boxStyle, height: 240, cursor: n >= STEEP_MAX ? "default" : "pointer",
             background: "linear-gradient(180deg,#eef0e6 0%,#fdf6e6 100%)",
             display: "flex", alignItems: "flex-end", justifyContent: "center", padding: 20 }}>
        {n === 0 && <Hint>点茶杯泡一下 ✦</Hint>}
        <svg width="220" height="200" viewBox="0 0 220 200" style={{ pointerEvents: "none" }}>
          {/* steam — only after a steep or two */}
          {n > 1 && (
            <g stroke="rgba(150,120,90,.55)" strokeWidth="2.6" fill="none" strokeLinecap="round">
              <path d="M96 40 Q102 26 96 12" className="tea-steam tea-steam-1"/>
              <path d="M112 36 Q118 22 112 6"  className="tea-steam tea-steam-2"/>
              <path d="M128 42 Q134 28 128 14" className="tea-steam tea-steam-3"/>
            </g>
          )}
          {/* tea bag — hanging by a string */}
          <line x1="112" y1="60" x2="112" y2="20" stroke="#7a6648" strokeWidth="1.6"/>
          <rect x="104" y="14" width="16" height="12" fill="#fef3a3" stroke="#1b1b1b" strokeWidth="1.6" filter="url(#wobble)"/>
          <text x="112" y="23" fontSize="7" textAnchor="middle" fontFamily="Caveat" fill="#1b1b1b">tea</text>
          {/* bag in the water */}
          <rect x="106" y={56 + t * 12} width="12" height="18"
                fill={teaColor} stroke="#1b1b1b" strokeWidth="1.6" filter="url(#wobble)"
                opacity={n > 0 ? 1 : 0}/>
          {/* saucer */}
          <ellipse cx="110" cy="170" rx="78" ry="10"
                   fill="#fffdf6" stroke="#1b1b1b" strokeWidth="2.5" filter="url(#wobble)"/>
          {/* cup */}
          <path d="M48 64 L172 64 L162 158 Q110 168 58 158 Z"
                fill="#fffdf6" stroke="#1b1b1b" strokeWidth="2.6"
                strokeLinejoin="round" filter="url(#wobble)"/>
          {/* tea liquid */}
          <path d={`M${56 + 2*(58-teaTop)/4} ${teaTop} L${164 - 2*(58-teaTop)/4} ${teaTop} L160 156 Q110 164 60 156 Z`}
                fill={teaColor} opacity={n > 0 ? 0.95 : 0}/>
          {/* handle */}
          <path d="M172 86 Q198 106 172 144" fill="none" stroke="#1b1b1b" strokeWidth="2.6"/>
        </svg>
      </div>
      <div style={{ display: "flex", gap: 8, marginTop: 12, alignItems: "center" }}>
        <button className="mw-btn mw-btn-primary" onClick={dip}
          disabled={n >= STEEP_MAX}
          style={{ fontSize: 15, padding: "6px 14px",
                   opacity: n >= STEEP_MAX ? 0.5 : 1 }}>
          {n >= STEEP_MAX ? "泡得正好" : "再泡一下 ↓"}
        </button>
        {n > 0 && (
          <button className="mw-btn" onClick={() => setN(0)} style={{ fontSize: 14, padding: "5px 12px" }}>
            倒了重来
          </button>
        )}
        <span className="sk-hand" style={{ fontSize: 16, color: "#888" }}>
          {n === 0 ? "点茶杯" : n >= STEEP_MAX ? "慢慢喝 ✦" : `泡了 ${n} 次`}
        </span>
      </div>
      <Caption>淡到浓 — 一杯茶要泡几次, 看你自己。</Caption>
    </div>
  );
}

// ============================================================
// Toy 11 — 种花 · click the dirt, watch a flower bloom
// ============================================================
const FLOWER_COLORS = ["#d97757", "#c97a83", "#fef3a3", "#a8c8e0", "#cfe0c6", "#9a6fb0"];
function Flowers() {
  const boxRef = useRef(null);
  const [items, setItems] = useState([]);
  const idRef = useRef(0);
  const plant = (e) => {
    const r = boxRef.current.getBoundingClientRect();
    const cx = (e.clientX ?? e.touches?.[0]?.clientX) - r.left;
    const cy = (e.clientY ?? e.touches?.[0]?.clientY) - r.top;
    if (cy < 90) return; // only plant in the dirt area
    initAudio(); playClick();
    setItems(prev => [...prev, {
      id: idRef.current++,
      x: cx, y: cy,
      petals: 5 + Math.floor(Math.random() * 4),
      petal: FLOWER_COLORS[Math.floor(Math.random() * FLOWER_COLORS.length)],
      center: Math.random() < 0.6 ? "#fef3a3" : "#fffdf6",
      stem: 22 + Math.random() * 20,
    }].slice(-26));
  };
  return (
    <div>
      <div ref={boxRef} onMouseDown={plant}
        onTouchStart={(e) => { e.preventDefault(); plant(e); }}
        style={{ ...boxStyle, height: 240, cursor: "crosshair",
          background: "linear-gradient(180deg, #cfe6f5 0%, #fef3a3 38%, #cfe0c6 56%, #8b6539 100%)" }}>
        {/* dirt line */}
        <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: 90,
          background: "linear-gradient(180deg,#a77a4a 0%,#7a5a36 100%)",
          borderTop: "2.5px solid #1b1b1b" }}/>
        {items.map(f => (
          <svg key={f.id} className="dw-bloom" style={{
            position: "absolute", left: f.x - 22, top: f.y - 38 - f.stem,
            pointerEvents: "none",
          }} width="44" height={48 + f.stem}>
            <line x1="22" y1={42 + f.stem} x2="22" y2={20}
              stroke="#5e7a4f" strokeWidth="2.4" strokeLinecap="round"/>
            <path d={`M22 ${28 + f.stem * 0.4} Q 10 ${22 + f.stem * 0.5} 8 ${30 + f.stem * 0.5}`}
              stroke="#5e7a4f" strokeWidth="2" fill="none" strokeLinecap="round"/>
            {Array.from({ length: f.petals }).map((_, i) => {
              const a = (i * 2 * Math.PI) / f.petals;
              return <ellipse key={i}
                cx={22 + Math.cos(a) * 9} cy={20 + Math.sin(a) * 9}
                rx="8" ry="5" fill={f.petal} stroke="#1b1b1b" strokeWidth="1.6"
                transform={`rotate(${(a * 180) / Math.PI} ${22 + Math.cos(a) * 9} ${20 + Math.sin(a) * 9})`}/>;
            })}
            <circle cx="22" cy="20" r="4.5" fill={f.center} stroke="#1b1b1b" strokeWidth="1.6"/>
          </svg>
        ))}
        {items.length === 0 && <Hint>点土里 — 给我种一朵 ✦</Hint>}
      </div>
      <div style={{ display: "flex", gap: 8, marginTop: 12, alignItems: "center" }}>
        <button className="mw-btn" style={{ fontSize: 15, padding: "6px 14px" }}
          onClick={() => setItems([])}>清空</button>
        <span className="sk-hand" style={{ fontSize: 16, color: "#888" }}>种了 {items.length} 朵</span>
      </div>
      <Caption>颜色、瓣数都随机 — 一整片小野花,谁也不一样。</Caption>
    </div>
  );
}

// ============================================================
// Toy 12 — 画画板 · draw on the page, change colors, clear
// ============================================================
const SKETCH_COLORS = ["#1b1b1b", "#d97757", "#9bb18e", "#a8c8e0", "#c97a83", "#efb24a"];
function SketchPad() {
  const boxRef = useRef(null);
  const drawing = useRef(false);
  const cur = useRef(null);
  const [paths, setPaths] = useState([]);
  const [color, setColor] = useState("#d97757");

  // One unified Pointer Events model — no separate mouse/touch handlers.
  // This avoids the synthetic "ghost" mouse events a phone fires after a
  // touch, which used to start a stray path and corrupt the real stroke.
  const pos = (e) => {
    const r = boxRef.current.getBoundingClientRect();
    return [e.clientX - r.left, e.clientY - r.top];
  };

  const down = (e) => {
    initAudio();
    e.currentTarget.setPointerCapture?.(e.pointerId);
    const [x, y] = pos(e);
    cur.current = `M${x.toFixed(1)} ${y.toFixed(1)}`;
    drawing.current = true;
    setPaths(p => [...p, { d: cur.current, c: color }]);
  };
  const move = (e) => {
    if (!drawing.current || !cur.current) return;
    const [x, y] = pos(e);
    cur.current += ` L${x.toFixed(1)} ${y.toFixed(1)}`;
    const d = cur.current;
    setPaths(p => p.map((path, i) =>
      i === p.length - 1 ? { ...path, d } : path));
  };
  const up = () => { drawing.current = false; cur.current = null; };

  return (
    <div>
      <div ref={boxRef}
        onPointerDown={down} onPointerMove={move}
        onPointerUp={up} onPointerCancel={up}
        style={{ ...boxStyle, height: 240, cursor: "crosshair",
          background: "#fffdf6", touchAction: "none" }}>
        <svg width="100%" height="100%"
             style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
          {paths.map((p, i) => (
            <path key={i} d={p.d} stroke={p.c} strokeWidth="3"
                  fill="none" strokeLinecap="round" strokeLinejoin="round"/>
          ))}
        </svg>
        {paths.length === 0 && <Hint>{isTouch ? "用手指画" : "用鼠标画"} — 想画啥画啥</Hint>}
      </div>
      <div style={{ display: "flex", gap: 6, marginTop: 12, alignItems: "center", flexWrap: "wrap" }}>
        {SKETCH_COLORS.map(c => (
          <div key={c} onClick={() => setColor(c)}
            style={{
              width: 24, height: 24, borderRadius: "50%", background: c,
              border: color === c ? "3px solid #1b1b1b" : "2px solid rgba(0,0,0,.3)",
              cursor: "pointer", filter: "url(#wobble)",
            }}/>
        ))}
        <button className="mw-btn" onClick={() => setPaths([])}
          style={{ fontSize: 14, padding: "5px 12px", marginLeft: 6 }}>清空</button>
        <span className="sk-hand" style={{ fontSize: 16, color: "#888" }}>
          {paths.length === 0 ? "一张白纸" : `${paths.length} 笔`}
        </span>
      </div>
      <Caption>一张白纸 — 想画的、写的、随便画。糟一点也没关系。</Caption>
    </div>
  );
}

// ============================================================
// The wall — pick a card, play its toy
// ============================================================
const TOYS = {
  cat: CatLight, weather: Weather, letters: Letters,
  clock: NightClock, crane: CraneToy, collage: Collage,
  piano: Piano, bubble: Bubbles, gift: MysteryBox,
  tea: TeaBrew, flower: Flowers, sketch: SketchPad,
};

export default function DoodleWall({ onClose, doodles = DOODLES_WALK }) {
  const [active, setActive] = useState(null);
  const doodle = active ? doodles.find(d => d.id === active) : null;
  const Toy = doodle ? TOYS[doodle.id] : null;

  return (
    <Overlay
      title={doodle ? doodle.name : "涂鸦墙"}
      sub={doodle ? "DOODLE · 玩玩看" : "DOODLE · 小实验"}
      onClose={onClose}
    >
      {doodle ? (
        <div>
          <button className="mw-btn" style={{ fontSize: 15, padding: "6px 14px", marginBottom: 16 }}
            onClick={() => setActive(null)}>← 涂鸦墙</button>
          <Toy/>
        </div>
      ) : (
        <>
          <div className="mw-body" style={{ fontSize: 16, color: "#555", marginBottom: 14 }}>
            一些 30 分钟以内能做完的小东西。点一个 — 它们都能真的玩。
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 10 }}>
            {doodles.map((d, i) => (
              <button key={d.id} className="dw-card" onClick={() => { playClick(); setActive(d.id); }} style={{
                background: CARD_BG[i % CARD_BG.length], border: "2px solid #1b1b1b",
                filter: "url(#wobble)", padding: 14, minHeight: 112, cursor: "pointer",
                textAlign: "left", display: "flex", flexDirection: "column",
                justifyContent: "space-between", boxShadow: "2px 3px 0 rgba(0,0,0,.12)",
              }}>
                <div className="mw-title" style={{ fontSize: 21, lineHeight: 1.2 }}>{d.name}</div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginTop: 8 }}>
                  <span className="sk-mono" style={{ fontSize: 9, letterSpacing: ".1em", color: "#555" }}>{d.note}</span>
                  <span className="sk-hand" style={{ fontSize: 16, color: "#1b1b1b" }}>玩 →</span>
                </div>
              </button>
            ))}
          </div>
        </>
      )}
    </Overlay>
  );
}
