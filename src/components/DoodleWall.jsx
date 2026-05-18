/* My World — 涂鸦墙 · the doodle wall
 *
 * Six tiny experiments, each a real toy you can actually play with.
 * Click a card on the wall → open its toy → "← 涂鸦墙" to go back.
 */

import { useState, useRef, useEffect } from 'react';
import Overlay from './Overlay.jsx';
import { DOODLES } from '../world/data.js';
import { Cat } from '../world/Char.jsx';
import { playClick } from '../world/sound.js';

// Shared palette — same family of colours as the rest of the world.
const PALETTE = ["#d97757", "#cfe0c6", "#6f8f6a", "#fef3a3", "#c97a83", "#6a8ab0", "#e7d4c4"];
const CARD_BG = ["#cfe0c6", "#fef3a3", "#f7c5c0", "#a8c8e0", "#e7d4c4", "#cfe0c6"];
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

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
        {!moved && <Hint>动动鼠标 — 小猫会追那点光 ✦</Hint>}
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
function Weather() {
  const [w, setW] = useState("sun");
  const opts = [
    { id: "sun", label: "☀ 晴" }, { id: "cloud", label: "☁ 阴" },
    { id: "rain", label: "🌧 雨" }, { id: "snow", label: "❄ 雪" },
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
            {o.label}
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
          {night && <text x="126" y="48" fontSize="22">🌙</text>}
        </svg>
      </div>
      <div style={{ marginTop: 12 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
          <span className="mw-title" style={{ fontSize: 26 }}>{hh}:{mm}</span>
          <span className="sk-hand" style={{ fontSize: 17, color: night ? "#6a8ab0" : "#888" }}>
            {night ? "夜里了 — 钟变蓝了 🌙" : "白天 ☀"}
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
// The wall — pick a card, play its toy
// ============================================================
const TOYS = {
  cat: CatLight, weather: Weather, letters: Letters,
  clock: NightClock, crane: CraneToy, collage: Collage,
};

export default function DoodleWall({ onClose }) {
  const [active, setActive] = useState(null);
  const doodle = active ? DOODLES.find(d => d.id === active) : null;
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
            {DOODLES.map((d, i) => (
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
