/* My World — work detail modal
 *
 * Three actions: 小演示 (a tiny playable demo, right here — no page jump),
 * 详细了解 (opens the full showcase page), 继续走 (close).
 */

import { useState, useEffect } from 'react';
import { FocusDemo, MoodDemo, CafeDemo, SparkDemo } from './WorkDemo.jsx';

const DEMOS = { focus: FocusDemo, mood: MoodDemo, cafe: CafeDemo, spark: SparkDemo };
// Each demo gets its own backdrop — light & airy or night-dark to match the work.
const DEMO_BG = { focus: "#FBFBFB", mood: "#1E1711", cafe: "#0a0d12", spark: "#FFF7E6" };

export default function WorkModal({ work, workId, onClose, onShowcase }) {
  const [demoOn, setDemoOn] = useState(false);

  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const Demo = DEMOS[workId] || FocusDemo;
  const demoBg = DEMO_BG[workId] || "#1E1711";

  return (
    <div onClick={onClose} className="mw-themed-scroll" style={{
      position: "fixed", inset: 0, background: "rgba(27,27,27,.6)", zIndex: 50,
      display: "flex", alignItems: "center", justifyContent: "center", padding: 20, overflowY: "auto"
    }}>
      <div onClick={(e) => e.stopPropagation()} className="mw-themed-scroll" style={{
        width: "min(640px, 100%)", background: "#fffdf6", border: "3px solid #1b1b1b", filter: "url(#wobble)",
        padding: "28px 32px", boxShadow: "6px 8px 0 rgba(0,0,0,.2)", position: "relative",
        maxHeight: "90vh", overflowY: "auto"
      }}>
        <div className="sk-mono" style={{ fontSize: 10, letterSpacing: ".2em", color: "#888" }}>
          WORK · {work.en.toUpperCase()}
        </div>
        <div className="mw-title" style={{ fontSize: 56, fontWeight: 600, marginTop: 6, lineHeight: 1 }}>
          {work.name}
        </div>
        <div className="mw-body" style={{ fontSize: 18, marginTop: 4, color: "#666" }}>{work.tag}</div>

        {/* === preview / live demo === */}
        <div style={{
          marginTop: 20, border: "2.5px solid #1b1b1b", filter: "url(#wobble)",
          background: demoOn ? demoBg : work.bg, position: "relative", overflow: "hidden",
          minHeight: 220, transition: "background .4s ease",
          ...(demoOn
            ? { padding: "22px 18px" }
            : { height: 220, display: "flex", alignItems: "center", justifyContent: "center" }),
        }}>
          {demoOn ? (
            <Demo/>
          ) : (<>
            {workId === "focus" && (
              <div style={{ position: "relative", width: 160, height: 160 }}>
                <svg width="160" height="160" viewBox="0 0 160 160">
                  <circle cx="80" cy="80" r="70" fill="rgba(255,253,246,.5)" stroke="#1b1b1b" strokeWidth="2.5" filter="url(#wobble)"/>
                  <circle cx="80" cy="80" r="70" fill="none" stroke="#d97757" strokeWidth="6" strokeDasharray="440" strokeDashoffset="110" strokeLinecap="round" transform="rotate(-90 80 80)" filter="url(#wobble)"/>
                </svg>
                <div style={{
                  position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center",
                  flexDirection: "column", pointerEvents: "none"
                }}>
                  <div className="mw-title" style={{ fontSize: 38, fontWeight: 600, color: "#1b1b1b", lineHeight: 1 }}>18:42</div>
                  <div className="sk-hand" style={{ fontSize: 14, color: "#666", marginTop: 4 }}>专注中 · 写代码</div>
                </div>
                <div style={{ position: "absolute", top: -10, right: -10, transform: "rotate(8deg)" }}>
                  <div className="sk-tag" style={{ background: "#fef3a3", fontSize: 9 }}>preview</div>
                </div>
              </div>
            )}
            {workId === "mood" && (
              <div style={{ position: "relative", width: 180, height: 180 }}>
                <div style={{
                  position: "absolute", inset: 0, borderRadius: "50%",
                  background: "radial-gradient(circle at 35% 35%, #d97757 0%, #2a1a14 70%)",
                  border: "3px solid #1b1b1b", filter: "url(#wobble)",
                  animation: "mw-spin 8s linear infinite"
                }}/>
                <div style={{
                  position: "absolute", inset: 24, borderRadius: "50%",
                  border: "1.5px dashed rgba(255,255,255,.3)",
                  animation: "mw-spin 8s linear infinite"
                }}/>
                <div style={{
                  position: "absolute", inset: 60, borderRadius: "50%",
                  background: "#fef3a3", border: "2px solid #1b1b1b",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  animation: "mw-spin 8s linear infinite"
                }}>
                  <div className="mw-title" style={{ fontSize: 14, textAlign: "center", padding: "0 4px", lineHeight: 1.1, color: "#1b1b1b" }}>夜里的湖</div>
                </div>
                <div style={{ position: "absolute", top: -10, right: -10, transform: "rotate(8deg)", zIndex: 5 }}>
                  <div className="sk-tag" style={{ background: "#fef3a3", fontSize: 9 }}>now playing</div>
                </div>
                <div style={{ position: "absolute", top: -4, right: 30, width: 8, height: 60, background: "#1b1b1b", transform: "rotate(20deg)", transformOrigin: "top right" }}/>
              </div>
            )}
            {workId === "cafe" && (
              <div style={{ position: "relative", width: 200, height: 150 }}>
                {/* a dead CRT monitor flickering back to life: 17# · HOME */}
                <div style={{
                  position: "absolute", inset: 0, borderRadius: 10,
                  background: "#11151b", border: "3px solid #1b1b1b", filter: "url(#wobble)",
                  boxShadow: "inset 0 0 50px rgba(0,0,0,.85)",
                  display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                }}>
                  <div className="sk-mono" style={{ fontSize: 11, letterSpacing: ".3em", color: "#5f7d6a" }}>17#</div>
                  <div className="mw-title" style={{
                    fontSize: 40, color: "#aee3c0", marginTop: 4,
                    textShadow: "0 0 14px rgba(120,230,170,.7)",
                  }}>HOME</div>
                  <div className="sk-mono" style={{ fontSize: 8, letterSpacing: ".2em", color: "#4a6356", marginTop: 6 }}>
                    LAST_STATE ▮
                  </div>
                </div>
                <div style={{ position: "absolute", top: -10, right: -10, transform: "rotate(8deg)" }}>
                  <div className="sk-tag" style={{ background: "#fef3a3", fontSize: 9 }}>preview</div>
                </div>
              </div>
            )}
            {workId === "spark" && (
              <div style={{ position: "relative", width: 150, height: 160 }}>
                {/* a glass jar full of glowing fragments */}
                <div style={{ position: "absolute", top: 18, left: 18, right: 18, height: 16, background: "#e0a96a", border: "2.5px solid #1b1b1b", filter: "url(#wobble)", borderRadius: 4, zIndex: 2 }}/>
                <div style={{
                  position: "absolute", top: 28, left: 10, right: 10, bottom: 0, borderRadius: "10px 10px 18px 18px",
                  background: "radial-gradient(circle at 50% 30%, rgba(255,247,224,.95), rgba(243,200,122,.5))",
                  border: "3px solid #1b1b1b", filter: "url(#wobble)", overflow: "hidden",
                }}>
                  {["✦","✶","✦","✷","✦","✶"].map((g, i) => (
                    <div key={i} className="sk-hand" style={{
                      position: "absolute", left: `${14 + (i % 3) * 30}%`, top: `${24 + Math.floor(i / 3) * 32}%`,
                      fontSize: 16, color: "#b9802a",
                      animation: `mw-jardrift ${0.9 + (i % 3) * 0.3}s ease-in-out infinite alternate`,
                    }}>{g}</div>
                  ))}
                </div>
                <div style={{ position: "absolute", top: -10, right: -14, transform: "rotate(8deg)", zIndex: 3 }}>
                  <div className="sk-tag" style={{ background: "#fef3a3", fontSize: 9 }}>now mixing</div>
                </div>
              </div>
            )}
          </>)}
        </div>

        <div className="mw-body" style={{ fontSize: 19, marginTop: 20, lineHeight: 1.5, color: "#1b1b1b" }}>
          {work.intro}
        </div>
        <div className="mw-body" style={{ fontSize: 17, marginTop: 10, lineHeight: 1.65, color: "#444" }}>
          {work.body.map((line, i) => <div key={i}>{line}</div>)}
        </div>

        {/* === three actions === */}
        <div style={{ marginTop: 22, display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          <button className="mw-btn mw-btn-primary" onClick={() => setDemoOn(d => !d)}>
            {demoOn ? "✕ 收起演示" : "▶︎ 小演示"}
          </button>
          <button className="mw-btn" onClick={() => onShowcase?.(work.showcase, workId)}>
            详细了解 →
          </button>
          <button className="mw-btn" onClick={onClose}>继续走</button>
        </div>

        {/* No wobble — parent modal already has it; stacking another on a
            small circle visibly ovals it on iOS. */}
        <button onClick={onClose} aria-label="close" style={{
          position: "absolute", top: 12, right: 12, width: 32, height: 32, border: "2px solid #1b1b1b",
          background: "#fffdf6", borderRadius: "50%", fontFamily: "Caveat", fontSize: 18, cursor: "pointer",
        }}>✕</button>
      </div>
    </div>
  );
}
