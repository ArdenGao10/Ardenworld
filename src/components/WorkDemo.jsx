/* My World — tiny playable demos of the two products
 *
 * Each is a small, faithful sketch of the real product's core loop,
 * shown right inside the WorkModal (no page jump):
 *   FocusDemo — 专注圈: a breathing aura-orb timer (focus / pause / done)
 *   MoodDemo  — Moodtune: pick moods → an AI DJ presses you a record
 */

import { useState, useEffect } from 'react';
import { playClick, playStar } from '../world/sound.js';

// ============================================================
// 专注圈 — breathing aura-orb focus timer
// ============================================================
const FOCUS_STATES = {
  idle:   { core: "rgba(150,160,150,.40)", glow: "rgba(150,160,150,.22)", ink: "#7a7a7a", label: "准备好了吗" },
  focus:  { core: "rgba(111,169,137,.62)", glow: "rgba(111,169,137,.40)", ink: "#5C8A70", label: "focusing · 专注中" },
  paused: { core: "rgba(176,156,217,.58)", glow: "rgba(176,156,217,.34)", ink: "#8D83A6", label: "paused · 暂停" },
  done:   { core: "rgba(220,178,138,.62)", glow: "rgba(220,178,138,.40)", ink: "#C99765", label: "complete · 完成 ✦" },
};

export function FocusDemo() {
  const [state, setState] = useState("idle");
  const [secs, setSecs] = useState(0);
  const [traces, setTraces] = useState([]); // durations of finished sessions

  useEffect(() => {
    if (state !== "focus") return;
    const id = setInterval(() => setSecs(s => s + 1), 1000);
    return () => clearInterval(id);
  }, [state]);

  const p = FOCUS_STATES[state];
  const mm = String(Math.floor(secs / 60)).padStart(2, "0");
  const ss = String(secs % 60).padStart(2, "0");

  const start  = () => { playClick(); setSecs(0); setState("focus"); };
  const pause  = () => { playClick(); setState("paused"); };
  const resume = () => { playClick(); setState("focus"); };
  const finish = () => { playStar(); setTraces(t => [...t, secs]); setState("done"); };
  const again  = () => { playClick(); setSecs(0); setState("idle"); };

  return (
    <div style={{ textAlign: "center" }}>
      {/* the breathing aura orb */}
      <div style={{ position: "relative", width: 196, height: 196, margin: "0 auto",
        display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ position: "absolute", width: "150%", height: "150%", borderRadius: "50%",
          background: `radial-gradient(circle, ${p.glow} 0%, transparent 68%)`, filter: "blur(22px)",
          transition: "background .6s ease" }}/>
        <div style={{ position: "absolute", width: 162, height: 162, borderRadius: "50%",
          background: `radial-gradient(circle, ${p.core} 0%, transparent 72%)`,
          transition: "background .6s ease",
          animation: state === "paused" ? "none" : "mw-breathe 6s ease-in-out infinite" }}/>
        <div style={{ position: "relative", zIndex: 2 }}>
          <div className="mw-title" style={{ fontSize: 40, color: "#1b1b1b", lineHeight: 1 }}>
            {mm}:{ss}
          </div>
          <div className="sk-hand" style={{ fontSize: 14, color: p.ink, marginTop: 3 }}>{p.label}</div>
        </div>
      </div>

      {/* controls — match the real product's focus / pause / done loop */}
      <div style={{ display: "flex", gap: 8, justifyContent: "center", marginTop: 12, flexWrap: "wrap" }}>
        {state === "idle" && (
          <button className="mw-btn mw-btn-primary" onClick={start}>开始专注 ✦</button>
        )}
        {state === "focus" && (<>
          <button className="mw-btn" onClick={pause}>暂停</button>
          <button className="mw-btn mw-btn-primary" onClick={finish}>完成 ✦</button>
        </>)}
        {state === "paused" && (<>
          <button className="mw-btn mw-btn-primary" onClick={resume}>继续</button>
          <button className="mw-btn" onClick={finish}>完成 ✦</button>
        </>)}
        {state === "done" && (
          <button className="mw-btn mw-btn-primary" onClick={again}>再专注一次</button>
        )}
      </div>

      {/* the trace it leaves behind */}
      <div className="mw-body" style={{ fontSize: 13, color: "#777", marginTop: 13, lineHeight: 1.6 }}>
        {traces.length === 0
          ? "番茄钟是一片会呼吸的光晕 — 专注绿 · 暂停紫 · 完成橙。"
          : (<>今天的轨迹{traces.map((t, i) => (
              <span key={i} style={{
                display: "inline-block", width: 7, height: 17, borderRadius: 2,
                background: "#C99765", margin: "0 0 0 4px", verticalAlign: "middle",
              }}/>
            ))} · 共 {traces.length} 段专注</>)}
      </div>
    </div>
  );
}

// ============================================================
// Moodtune — pick moods, an AI DJ presses you a record
// ============================================================
const MD_MOODS = [
  { key: "mellow", cn: "忧郁" }, { key: "tender", cn: "温柔" },
  { key: "nostalgic", cn: "怀旧" }, { key: "restless", cn: "躁动" },
  { key: "calm", cn: "平静" }, { key: "joyful", cn: "雀跃" },
  { key: "latenight", cn: "深夜" }, { key: "healing", cn: "治愈" },
];
const MD_LIB = {
  mellow: [
    { t: "Mizu Iro No Yoru", a: "Aimer", note: "给凌晨三点的窗台" },
    { t: "The Night We Met", a: "Lord Huron", note: "想起某个人时放这首" },
    { t: "Liability", a: "Lorde", note: "一个人也没关系" },
  ],
  tender: [
    { t: "Plastic Love", a: "Mariya Takeuchi", note: "城市霓虹里的温柔" },
    { t: "Harvest Moon", a: "Neil Young", note: "像一只手轻搭上肩" },
    { t: "Lover, You Should've Come Over", a: "Jeff Buckley", note: "温柔到几乎心碎" },
  ],
  nostalgic: [
    { t: "Landslide", a: "Fleetwood Mac", note: "翻旧照片的下午" },
    { t: "Vienna", a: "Billy Joel", note: "慢一点,时间还够" },
    { t: "Yesterday Once More", a: "Carpenters", note: "回不去的那些夏天" },
  ],
  restless: [
    { t: "Mr. Brightside", a: "The Killers", note: "停不下来的那种夜" },
    { t: "Heads Will Roll", a: "Yeah Yeah Yeahs", note: "把躁动跳出去" },
    { t: "Such Great Heights", a: "The Postal Service", note: "心跳快了一拍" },
  ],
  calm: [
    { t: "Weightless", a: "Marconi Union", note: "让呼吸慢下来" },
    { t: "Saturn", a: "Sleeping at Last", note: "宇宙也在轻声说话" },
    { t: "An Ending (Ascent)", a: "Brian Eno", note: "一片安静的光" },
  ],
  joyful: [
    { t: "Lovely Day", a: "Bill Withers", note: "窗外刚好有阳光" },
    { t: "September", a: "Earth, Wind & Fire", note: "忍不住跟着点头" },
    { t: "Walking on Sunshine", a: "Katrina & The Waves", note: "把音量调大" },
  ],
  latenight: [
    { t: "Nightcall", a: "Kavinsky", note: "霓虹、引擎、午夜" },
    { t: "Midnight City", a: "M83", note: "城市在凌晨发光" },
    { t: "Sunset Lover", a: "Petit Biscuit", note: "黄昏与深夜之间" },
  ],
  healing: [
    { t: "Holocene", a: "Bon Iver", note: "你比想象中更完整" },
    { t: "First Day of My Life", a: "Bright Eyes", note: "重新开始,从今晚" },
    { t: "Float On", a: "Modest Mouse", note: "一切都会过去的" },
  ],
};
const MD_COVERS = [
  "radial-gradient(circle at 35% 30%, #F3AE74, #C95F2C 60%, #5e2a16)",
  "radial-gradient(circle at 35% 30%, #E8A0C0, #9B3F6B 60%, #3e1830)",
  "radial-gradient(circle at 35% 30%, #9FB8D8, #3F5E8C 60%, #1a2840)",
  "radial-gradient(circle at 35% 30%, #C9D89F, #5E7E3F 60%, #28381a)",
  "radial-gradient(circle at 35% 30%, #F0C97A, #B8862C 60%, #4e3812)",
  "radial-gradient(circle at 35% 30%, #B0A0D8, #5F3F8C 60%, #281840)",
];
function coverFor(title) {
  let h = 0;
  for (let i = 0; i < title.length; i++) h = (h * 31 + title.charCodeAt(i)) >>> 0;
  return MD_COVERS[h % MD_COVERS.length];
}

export function MoodDemo() {
  const [picked, setPicked] = useState([]);
  const [phase, setPhase] = useState("idle"); // idle | loading | result
  const [songs, setSongs] = useState([]);
  const [now, setNow] = useState(0);

  const toggle = (k) => {
    playClick();
    setPicked(p => p.includes(k) ? p.filter(x => x !== k)
                                 : (p.length >= 3 ? p : [...p, k]));
  };

  const spin = () => {
    if (picked.length === 0) return;
    playClick();
    setPhase("loading");
    setTimeout(() => {
      const pool = picked.flatMap(k => MD_LIB[k]).sort(() => Math.random() - 0.5);
      const chosen = [];
      for (const s of pool) {
        if (chosen.length >= 3) break;
        if (!chosen.some(c => c.t === s.t)) chosen.push(s);
      }
      setSongs(chosen);
      setNow(0);
      playStar();
      setPhase("result");
    }, 1600);
  };

  const moodNames = () => picked
    .map(k => MD_MOODS.find(m => m.key === k)?.cn).join(" · ");

  // ----- result view -----
  if (phase === "result") {
    const song = songs[now];
    return (
      <div style={{ textAlign: "center", color: "#F4EFE6" }}>
        <div className="sk-mono" style={{ fontSize: 10, letterSpacing: ".1em", color: "#9C8E7A" }}>
          为「{moodNames()}」压好了一张唱片
        </div>
        {/* spinning vinyl */}
        <div style={{ width: 130, height: 130, margin: "14px auto 0", position: "relative",
          borderRadius: "50%", animation: "mw-spin 6s linear infinite",
          background: "repeating-radial-gradient(circle, #0c0907 0 2px, #181009 2px 6px)",
          boxShadow: "0 0 30px rgba(232,151,92,.32)" }}>
          <div style={{ position: "absolute", inset: "32%", borderRadius: "50%",
            background: coverFor(song.t), display: "flex", alignItems: "center", justifyContent: "center" }}>
            <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#14100B" }}/>
          </div>
        </div>
        <div className="mw-title" style={{ fontSize: 21, marginTop: 14, color: "#F4EFE6" }}>{song.t}</div>
        <div className="mw-body" style={{ fontSize: 13, color: "#9C8E7A", marginTop: 2 }}>{song.a}</div>
        <div className="sk-hand" style={{ fontSize: 16, color: "#E8975C", marginTop: 8 }}>
          DJ:「{song.note}」
        </div>
        {/* the three songs — tap to switch */}
        <div style={{ display: "flex", gap: 6, justifyContent: "center", marginTop: 14, flexWrap: "wrap" }}>
          {songs.map((s, i) => (
            <button key={s.t} onClick={() => { playClick(); setNow(i); }} style={{
              fontFamily: "JetBrains Mono, monospace", fontSize: 10, cursor: "pointer",
              padding: "6px 10px", borderRadius: 999,
              border: `1px solid ${i === now ? "#E8975C" : "rgba(244,239,230,.18)"}`,
              background: i === now ? "rgba(232,151,92,.16)" : "transparent",
              color: i === now ? "#E8975C" : "#9C8E7A",
            }}>{String(i + 1).padStart(2, "0")}</button>
          ))}
        </div>
        <button className="mw-btn" onClick={spin} style={{ marginTop: 14, fontSize: 14, padding: "6px 16px" }}>
          ↻ 换一批
        </button>
      </div>
    );
  }

  // ----- loading view -----
  if (phase === "loading") {
    return (
      <div style={{ textAlign: "center", padding: "26px 0" }}>
        <div style={{ width: 76, height: 76, margin: "0 auto", borderRadius: "50%",
          animation: "mw-spin 1.1s linear infinite",
          background: "repeating-radial-gradient(circle, #0c0907 0 2px, #181009 2px 5px)",
          boxShadow: "0 0 22px rgba(232,151,92,.3)" }}>
          <div style={{ position: "relative", top: "44%", left: "44%", width: 9, height: 9,
            borderRadius: "50%", background: "#E8975C" }}/>
        </div>
        <div className="mw-body" style={{ fontSize: 15, color: "#F4EFE6", marginTop: 18 }}>
          AI DJ 正在听你的夜晚…
        </div>
        <div className="sk-mono" style={{ fontSize: 10, letterSpacing: ".12em", color: "#6B6052", marginTop: 6 }}>
          GLM · reading the mood
        </div>
      </div>
    );
  }

  // ----- idle / pick view -----
  return (
    <div style={{ textAlign: "center", color: "#F4EFE6" }}>
      <div className="mw-body" style={{ fontSize: 14, color: "#9C8E7A" }}>
        今晚的你,听起来是什么样子?挑 1–3 个心情。
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: 7, marginTop: 14 }}>
        {MD_MOODS.map(m => {
          const on = picked.includes(m.key);
          return (
            <button key={m.key} onClick={() => toggle(m.key)} style={{
              fontFamily: "ZCOOL KuaiLe, sans-serif", fontSize: 13, cursor: "pointer",
              padding: "8px 15px", borderRadius: 999,
              border: `1px solid ${on ? "#E8975C" : "rgba(244,239,230,.18)"}`,
              background: on ? "#E8975C" : "rgba(244,239,230,.05)",
              color: on ? "#1F1308" : "#F4EFE6",
            }}>{m.cn}</button>
          );
        })}
      </div>
      <button className="mw-btn mw-btn-primary" onClick={spin}
        disabled={picked.length === 0}
        style={{ marginTop: 18, opacity: picked.length === 0 ? 0.5 : 1 }}>
        为我压一张唱片 →
      </button>
      <div className="sk-mono" style={{ fontSize: 10, letterSpacing: ".12em", color: "#6B6052", marginTop: 10 }}>
        已选 {picked.length} / 3
      </div>
    </div>
  );
}
