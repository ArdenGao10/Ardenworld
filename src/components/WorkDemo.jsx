/* My World — tiny playable demos of the two products
 *
 * Each is a small, faithful sketch of the real product's core loop,
 * shown right inside the WorkModal (no page jump):
 *   FocusDemo — 专注圈: a breathing aura-orb timer (focus / pause / done)
 *   MoodDemo  — Moodtune: pick moods → an AI DJ presses you a record
 */

import { useState, useEffect } from 'react';
import { playClick, playStar, playOpen, startMood, stopMood } from '../world/sound.js';
import { useLang } from '../i18n/lang.jsx';

// ============================================================
// 专注圈 — breathing aura-orb focus timer
// ============================================================
const FOCUS_STATES = {
  idle:   { core: "rgba(150,160,150,.40)", glow: "rgba(150,160,150,.22)", ink: "#7a7a7a", label: { zh: "准备好了吗", en: "ready?" } },
  focus:  { core: "rgba(111,169,137,.62)", glow: "rgba(111,169,137,.40)", ink: "#5C8A70", label: { zh: "focusing · 专注中", en: "focusing" } },
  paused: { core: "rgba(176,156,217,.58)", glow: "rgba(176,156,217,.34)", ink: "#8D83A6", label: { zh: "paused · 暂停", en: "paused" } },
  done:   { core: "rgba(220,178,138,.62)", glow: "rgba(220,178,138,.40)", ink: "#C99765", label: { zh: "complete · 完成 ✦", en: "complete ✦" } },
};

export function FocusDemo() {
  const { t, pick, lang } = useLang();
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
          <div className="sk-hand" style={{ fontSize: 14, color: p.ink, marginTop: 3 }}>{pick(p.label)}</div>
        </div>
      </div>

      {/* controls — match the real product's focus / pause / done loop */}
      <div style={{ display: "flex", gap: 8, justifyContent: "center", marginTop: 12, flexWrap: "wrap" }}>
        {state === "idle" && (
          <button className="mw-btn mw-btn-primary" onClick={start}>{t('wd.focusStart')}</button>
        )}
        {state === "focus" && (<>
          <button className="mw-btn" onClick={pause}>{t('wd.focusPause')}</button>
          <button className="mw-btn mw-btn-primary" onClick={finish}>{t('wd.focusDone')}</button>
        </>)}
        {state === "paused" && (<>
          <button className="mw-btn mw-btn-primary" onClick={resume}>{t('wd.focusResume')}</button>
          <button className="mw-btn" onClick={finish}>{t('wd.focusDone')}</button>
        </>)}
        {state === "done" && (
          <button className="mw-btn mw-btn-primary" onClick={again}>{t('wd.focusAgain')}</button>
        )}
      </div>

      {/* the trace it leaves behind */}
      <div className="mw-body" style={{ fontSize: 13, color: "#777", marginTop: 13, lineHeight: 1.6 }}>
        {traces.length === 0
          ? t('wd.focusHint')
          : (<>{t('wd.focusTraces')}{traces.map((tr, i) => (
              <span key={i} style={{
                display: "inline-block", width: 7, height: 17, borderRadius: 2,
                background: "#C99765", margin: "0 0 0 4px", verticalAlign: "middle",
              }}/>
            ))}{lang === 'zh' ? ` · 共 ${traces.length} 段专注` : ` · ${traces.length} sessions`}</>)}
      </div>
    </div>
  );
}

// ============================================================
// Moodtune — pick moods, an AI DJ presses you a record
// ============================================================
const MD_MOODS = [
  { key: "mellow", cn: "忧郁", en: "Melancholy" }, { key: "tender", cn: "温柔", en: "Tender" },
  { key: "nostalgic", cn: "怀旧", en: "Nostalgic" }, { key: "restless", cn: "躁动", en: "Restless" },
  { key: "calm", cn: "平静", en: "Calm" }, { key: "joyful", cn: "雀跃", en: "Joyful" },
  { key: "latenight", cn: "深夜", en: "Late night" }, { key: "healing", cn: "治愈", en: "Healing" },
];
const MD_LIB = {
  mellow: [
    { t: "Mizu Iro No Yoru", a: "Aimer", note: { zh: "给凌晨三点的窗台", en: "for the windowsill at 3am" } },
    { t: "The Night We Met", a: "Lord Huron", note: { zh: "想起某个人时放这首", en: "for when someone comes to mind" } },
    { t: "Liability", a: "Lorde", note: { zh: "一个人也没关系", en: "being alone is okay too" } },
  ],
  tender: [
    { t: "Plastic Love", a: "Mariya Takeuchi", note: { zh: "城市霓虹里的温柔", en: "tenderness in city neon" } },
    { t: "Harvest Moon", a: "Neil Young", note: { zh: "像一只手轻搭上肩", en: "like a hand resting on your shoulder" } },
    { t: "Lover, You Should've Come Over", a: "Jeff Buckley", note: { zh: "温柔到几乎心碎", en: "tender to the point of heartbreak" } },
  ],
  nostalgic: [
    { t: "Landslide", a: "Fleetwood Mac", note: { zh: "翻旧照片的下午", en: "an afternoon of old photos" } },
    { t: "Vienna", a: "Billy Joel", note: { zh: "慢一点,时间还够", en: "slow down, there's still time" } },
    { t: "Yesterday Once More", a: "Carpenters", note: { zh: "回不去的那些夏天", en: "the summers you can't return to" } },
  ],
  restless: [
    { t: "Mr. Brightside", a: "The Killers", note: { zh: "停不下来的那种夜", en: "the kind of night that won't stop" } },
    { t: "Heads Will Roll", a: "Yeah Yeah Yeahs", note: { zh: "把躁动跳出去", en: "dance the restlessness out" } },
    { t: "Such Great Heights", a: "The Postal Service", note: { zh: "心跳快了一拍", en: "a heartbeat quicker" } },
  ],
  calm: [
    { t: "Weightless", a: "Marconi Union", note: { zh: "让呼吸慢下来", en: "let your breathing slow" } },
    { t: "Saturn", a: "Sleeping at Last", note: { zh: "宇宙也在轻声说话", en: "the universe speaking softly too" } },
    { t: "An Ending (Ascent)", a: "Brian Eno", note: { zh: "一片安静的光", en: "a quiet field of light" } },
  ],
  joyful: [
    { t: "Lovely Day", a: "Bill Withers", note: { zh: "窗外刚好有阳光", en: "sunlight just outside the window" } },
    { t: "September", a: "Earth, Wind & Fire", note: { zh: "忍不住跟着点头", en: "can't help nodding along" } },
    { t: "Walking on Sunshine", a: "Katrina & The Waves", note: { zh: "把音量调大", en: "turn it up" } },
  ],
  latenight: [
    { t: "Nightcall", a: "Kavinsky", note: { zh: "霓虹、引擎、午夜", en: "neon, engines, midnight" } },
    { t: "Midnight City", a: "M83", note: { zh: "城市在凌晨发光", en: "the city glowing before dawn" } },
    { t: "Sunset Lover", a: "Petit Biscuit", note: { zh: "黄昏与深夜之间", en: "between dusk and deep night" } },
  ],
  healing: [
    { t: "Holocene", a: "Bon Iver", note: { zh: "你比想象中更完整", en: "you're more whole than you think" } },
    { t: "First Day of My Life", a: "Bright Eyes", note: { zh: "重新开始,从今晚", en: "start over, from tonight" } },
    { t: "Float On", a: "Modest Mouse", note: { zh: "一切都会过去的", en: "everything will pass" } },
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
  const { t, pick, lang } = useLang();
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
      // Tag each song with its source mood so the background track can
      // change when the user flips to a different record in the result view.
      const pool = picked.flatMap(k => MD_LIB[k].map(s => ({ ...s, mood: k })))
                         .sort(() => Math.random() - 0.5);
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

  // Drive the mood-music engine: start when a record is on screen, switch
  // when the user picks a different record, stop on close / leaving result.
  // Two effects on purpose — putting stopMood in the first effect's cleanup
  // would resume BGM between mood switches and overlap with the new mood.
  const currentMood = phase === "result" && songs[now] ? songs[now].mood : null;
  useEffect(() => {
    if (currentMood) startMood(currentMood);
    else stopMood();
  }, [currentMood]);
  useEffect(() => () => stopMood(), []);

  const moodNames = () => picked
    .map(k => { const m = MD_MOODS.find(m => m.key === k); return m ? (lang === 'zh' ? m.cn : m.en) : ''; })
    .join(" · ");

  // ----- result view -----
  if (phase === "result") {
    const song = songs[now];
    return (
      <div style={{ textAlign: "center", color: "#F4EFE6" }}>
        <div className="sk-mono" style={{ fontSize: 10, letterSpacing: ".1em", color: "#9C8E7A" }}>
          {lang === 'zh' ? `为「${moodNames()}」压好了一张唱片` : `Pressed a record for «${moodNames()}»`}
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
          DJ:「{pick(song.note)}」
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
          {t('wd.moodReshuffle')}
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
          {t('wd.moodLoading')}
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
        {t('wd.moodPrompt')}
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
            }}>{lang === 'zh' ? m.cn : m.en}</button>
          );
        })}
      </div>
      <button className="mw-btn mw-btn-primary" onClick={spin}
        disabled={picked.length === 0}
        style={{ marginTop: 18, opacity: picked.length === 0 ? 0.5 : 1 }}>
        {t('wd.moodPress')}
      </button>
      <div className="sk-mono" style={{ fontSize: 10, letterSpacing: ".12em", color: "#6B6052", marginTop: 10 }}>
        {t('wd.selected')} {picked.length} / 3
      </div>
    </div>
  );
}

// ============================================================
// 网吧考古学家 — 遗物的「2077 误读」与「真相」两层文本
// The game's core beat: every relic reads one way to the dig team,
// another way once you know what the café really was. Flip to reveal.
// ============================================================
const CAFE_RELICS = [
  { glyph: "🪙", name: { zh: "铜色代币", en: "Copper token" },
    misread: { zh: "一枚注意力货币 — 古人用它兑换专注。", en: "An attention currency — the ancients traded it for focus." },
    truth: { zh: "老周收银机里的代币。那一夜他还在前台，盯着每台机器的异常。", en: "A token from Lao Zhou's register. That night he was still at the counter, watching every machine for anomalies." } },
  { glyph: "🎫", name: { zh: "包夜小票", en: "All-nighter receipt" },
    misread: { zh: "时间与货币的契约凭证。", en: "A contract binding time and money." },
    truth: { zh: "反复打印 2012-12-21 23:59 —— 最早被当成打印机坏了的那个预警。", en: "Printed over and over: 2012-12-21 23:59 — the warning first dismissed as a broken printer." } },
  { glyph: "⌨️", name: { zh: "掉了 W 键的键盘", en: "Keyboard missing its W" },
    misread: { zh: "刻着字母禁忌的图腾。", en: "A totem inscribed with a forbidden letter." },
    truth: { zh: "阿丁 17 号机的键盘，W 键磨没了，底下刻着「别后退」。", en: "A Ding's machine-17 keyboard — the W worn away, “don't go back” carved beneath it." } },
  { glyph: "📼", name: { zh: "断裂的路由器", en: "Broken router" },
    misread: { zh: "一只小型祈愿器。", en: "A small wishing device." },
    truth: { zh: "老周临走前硬拔下来的。日志里有他看不懂的外部信号，先当成断网故障。", en: "Lao Zhou yanked it out before leaving. Its logs held an outside signal he couldn't read — first taken for an outage." } },
];

export function CafeDemo() {
  const { t, pick } = useLang();
  const [i, setI] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const r = CAFE_RELICS[i];

  const flip = () => { playOpen(); setFlipped(f => !f); };
  const next = () => { playClick(); setFlipped(false); setI(n => (n + 1) % CAFE_RELICS.length); };

  return (
    <div style={{ textAlign: "center", color: "#dbe2ea" }}>
      <div className="sk-mono" style={{ fontSize: 10, letterSpacing: ".18em", color: "#7d8a98" }}>
        EVIDENCE {String(i + 1).padStart(2, "0")} / {String(CAFE_RELICS.length).padStart(2, "0")}
      </div>

      {/* relic card — dark “inspect” view, click to flip 误读 ↔ 真相 */}
      <button onClick={flip} style={{
        display: "block", width: "100%", marginTop: 12, cursor: "pointer",
        background: "radial-gradient(ellipse at 50% 36%, #1d2530 0%, #0a0d12 84%)",
        border: "2.5px solid #3a4654", borderRadius: 4, padding: "22px 18px 18px",
        boxShadow: "inset 0 0 60px rgba(0,0,0,.7)", textAlign: "center",
      }}>
        <div style={{ fontSize: 46, lineHeight: 1, filter: "grayscale(.3)" }}>{r.glyph}</div>
        <div className="mw-title" style={{ fontSize: 22, color: "#e8eef2", marginTop: 8 }}>{pick(r.name)}</div>
        <div style={{
          marginTop: 12, minHeight: 60,
          borderTop: "1px dashed rgba(232,238,242,.18)", paddingTop: 10,
        }}>
          <div className="sk-mono" style={{
            fontSize: 9, letterSpacing: ".16em",
            color: flipped ? "#e0a96a" : "#6f7c8a",
          }}>
            {flipped ? t('wd.truth') : t('wd.misread')}
          </div>
          <div className="mw-body" style={{
            fontSize: 14, lineHeight: 1.6, marginTop: 6,
            color: flipped ? "#f0e3cf" : "#aeb9c4",
            fontStyle: flipped ? "normal" : "italic",
          }}>
            {flipped ? pick(r.truth) : pick(r.misread)}
          </div>
        </div>
        <div className="sk-hand" style={{ fontSize: 13, color: "#5f6b78", marginTop: 10 }}>
          {flipped ? t('wd.cafeFlipBack') : t('wd.cafeFlipFront')}
        </div>
      </button>

      <div style={{ display: "flex", gap: 8, justifyContent: "center", marginTop: 14 }}>
        <button className="mw-btn mw-btn-primary" onClick={next}>{t('wd.cafeNext')}</button>
      </div>
      <div className="mw-body" style={{ fontSize: 12, color: "#7d8a98", marginTop: 12, lineHeight: 1.6 }}>
        {t('wd.cafeFull1')}<br/>{t('wd.cafeFull2')}
      </div>
    </div>
  );
}

// ============================================================
// 灵感搜集器 — 摇一摇，把灵感碎片撞成一个新点子
// A canned echo of the real jar: pick a few fragments, shake, and a
// little synthesizer collides them into a product seed (no live LLM here).
// ============================================================
const SPARK_FRAGMENTS = [
  { zh: "地铁通勤", en: "Commute" }, { zh: "白噪音", en: "White noise" },
  { zh: "植物养成", en: "Growing plants" }, { zh: "手写笔记", en: "Handwritten notes" },
  { zh: "深夜电台", en: "Late-night radio" }, { zh: "潮汐", en: "Tides" },
  { zh: "便利店", en: "Convenience store" }, { zh: "旧照片", en: "Old photos" },
];
function synthIdea(picks, lang) {
  const [a, b, c] = picks.map(p => p[lang]);
  const join = picks.map(p => p[lang]).join(" × ");
  const seeds = lang === 'zh' ? [
    { name: `${a}罐`,   pitch: `把「${a}」变成可以每天往里丢一点的小仪式，${b ? `攒够了就和「${b}」撞一次。` : "攒够了摇一摇看看。"}` },
    { name: `${b || a}电台`, pitch: `一个只在「${a}」时播放的频道${c ? `，背景是「${c}」。` : "。"}` },
    { name: `${a}×${b || a}`, pitch: `${join} —— 一个把这些碎片缝在一起的小工具，主打“不高效，但有手感”。` },
  ] : [
    { name: `${a} Jar`, pitch: `Turn “${a}” into a small daily ritual you drop a bit into${b ? `, and once it's full, collide it with “${b}”.` : `, then shake when it's full.`}` },
    { name: `${b || a} Radio`, pitch: `A channel that only plays during “${a}”${c ? `, with “${c}” in the background.` : `.`}` },
    { name: `${a} × ${b || a}`, pitch: `${join} —— a little tool that stitches these fragments together: “not efficient, but tactile.”` },
  ];
  return seeds[Math.floor(Math.random() * seeds.length)];
}

export function SparkDemo() {
  const { t, lang } = useLang();
  const [picked, setPicked] = useState([]);
  const [phase, setPhase] = useState("idle"); // idle | shaking | result
  const [idea, setIdea] = useState(null);

  const toggle = (f) => {
    playClick();
    setPicked(p => p.includes(f) ? p.filter(x => x !== f)
                                 : (p.length >= 3 ? p : [...p, f]));
  };

  const shake = () => {
    if (picked.length < 2) return;
    playClick();
    setPhase("shaking");
    setTimeout(() => {
      setIdea(synthIdea(picked, lang));
      playStar();
      setPhase("result");
    }, 1400);
  };

  const again = () => { playClick(); setPhase("idle"); setPicked([]); setIdea(null); };

  // ----- result -----
  if (phase === "result" && idea) {
    return (
      <div style={{ textAlign: "center", color: "#6b4e1f" }}>
        <div className="sk-mono" style={{ fontSize: 10, letterSpacing: ".14em", color: "#b9933f" }}>
          {lang === 'zh'
            ? `为「${picked.map(p => p.zh).join(" · ")}」撞出了一个点子`
            : `An idea from «${picked.map(p => p.en).join(" · ")}»`}
        </div>
        <div style={{
          margin: "16px auto 0", maxWidth: 320,
          background: "radial-gradient(circle at 50% 0%, #fff6e0 0%, #fbe9c2 100%)",
          border: "2.5px solid #1b1b1b", borderRadius: 10, padding: "20px 18px",
          boxShadow: "3px 4px 0 rgba(0,0,0,.12)",
        }}>
          <div style={{ fontSize: 30 }}>✦</div>
          <div className="mw-title" style={{ fontSize: 26, color: "#1b1b1b", marginTop: 6 }}>{idea.name}</div>
          <div className="mw-body" style={{ fontSize: 15, lineHeight: 1.65, color: "#5a4a2a", marginTop: 8 }}>
            {idea.pitch}
          </div>
        </div>
        <div style={{ display: "flex", gap: 8, justifyContent: "center", marginTop: 16 }}>
          <button className="mw-btn" onClick={shake}>{t('wd.sparkAgain')}</button>
          <button className="mw-btn mw-btn-primary" onClick={again}>{t('wd.sparkNewBatch')}</button>
        </div>
        <div className="mw-body" style={{ fontSize: 12, color: "#b9933f", marginTop: 12 }}>
          {t('wd.sparkFull')}
        </div>
      </div>
    );
  }

  // ----- shaking -----
  if (phase === "shaking") {
    return (
      <div style={{ textAlign: "center", padding: "20px 0" }}>
        <div style={{
          width: 120, height: 140, margin: "0 auto", position: "relative",
          animation: "mw-jarshake .5s ease-in-out infinite",
        }}>
          {/* glass jar */}
          <div style={{
            position: "absolute", inset: "18px 14px 0", borderRadius: "12px 12px 16px 16px",
            border: "2.5px solid #1b1b1b",
            background: "linear-gradient(180deg, rgba(246,205,125,.25), rgba(246,205,125,.55))",
            overflow: "hidden",
          }}>
            {SPARK_FRAGMENTS.slice(0, 6).map((f, i) => (
              <div key={f.zh} className="sk-hand" style={{
                position: "absolute", left: `${12 + (i % 3) * 30}%`, top: `${24 + Math.floor(i / 3) * 34}%`,
                fontSize: 13, color: "#7a5a1a",
                animation: `mw-jardrift ${0.5 + (i % 3) * 0.15}s ease-in-out infinite alternate`,
              }}>✦</div>
            ))}
          </div>
          {/* lid */}
          <div style={{ position: "absolute", top: 6, left: 26, right: 26, height: 16, background: "#e0a96a", border: "2.5px solid #1b1b1b", borderRadius: 4 }}/>
        </div>
        <div className="mw-body" style={{ fontSize: 15, color: "#6b4e1f", marginTop: 16 }}>
          {t('wd.sparkShaking')}
        </div>
        <div className="sk-mono" style={{ fontSize: 10, letterSpacing: ".12em", color: "#b9933f", marginTop: 6 }}>
          GLM · colliding ideas
        </div>
      </div>
    );
  }

  // ----- idle / pick -----
  return (
    <div style={{ textAlign: "center", color: "#6b4e1f" }}>
      <div className="mw-body" style={{ fontSize: 14, color: "#9a7a3a" }}>
        {t('wd.sparkPrompt')}
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: 7, marginTop: 14 }}>
        {SPARK_FRAGMENTS.map(f => {
          const on = picked.includes(f);
          return (
            <button key={f.zh} onClick={() => toggle(f)} style={{
              fontFamily: "ZCOOL KuaiLe, sans-serif", fontSize: 13, cursor: "pointer",
              padding: "8px 15px", borderRadius: 999,
              border: `1.5px solid ${on ? "#1b1b1b" : "rgba(122,90,26,.3)"}`,
              background: on ? "#f3c069" : "rgba(246,205,125,.16)",
              color: on ? "#1b1b1b" : "#7a5a1a",
            }}>{f[lang]}</button>
          );
        })}
      </div>
      <button className="mw-btn mw-btn-primary" onClick={shake}
        disabled={picked.length < 2}
        style={{ marginTop: 18, opacity: picked.length < 2 ? 0.5 : 1 }}>
        {t('wd.sparkShake')}
      </button>
      <div className="sk-mono" style={{ fontSize: 10, letterSpacing: ".12em", color: "#b9933f", marginTop: 10 }}>
        {t('wd.selected')} {picked.length} / 3 {t('wd.atLeast2')}
      </div>
    </div>
  );
}
