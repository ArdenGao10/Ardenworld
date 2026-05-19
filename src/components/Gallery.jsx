/* My World — skip-the-walk gallery view
 *
 * Each work card has two clear actions:
 *   ▶ 小演示  — opens a focused demo card on top of the gallery
 *   详细了解 → — opens the full showcase iframe
 * They're styled as pill buttons (warm + moss) so they read as card actions,
 * distinct from the small page-nav buttons at the bottom.
 */

import { useState } from 'react';
import { WORKS } from '../world/data.js';
import { FocusDemo, MoodDemo } from './WorkDemo.jsx';

export default function Gallery({ onClose, onBackToWalk, onShowcase }) {
  const [demoId, setDemoId] = useState(null);

  // Card-level call-to-action — pill, colored, more substantial than mw-skip.
  const cardBtn = (bg) => ({
    fontFamily: '"ZCOOL KuaiLe", sans-serif',
    fontSize: 17, padding: "10px 22px",
    background: bg, color: "#fffdf6",
    border: "2.5px solid #1b1b1b",
    borderRadius: 999,
    cursor: "pointer", filter: "url(#wobble)",
    boxShadow: "2px 3px 0 rgba(0,0,0,.15)",
    letterSpacing: ".02em",
  });

  return (
    <div className="mw-themed-scroll" style={{
      position: "fixed", inset: 0, background: "#f3f1ec", zIndex: 55,
      overflowY: "auto", padding: "60px 24px"
    }}>
      <div style={{ maxWidth: 720, margin: "0 auto" }}>
        <div className="sk-mono" style={{ fontSize: 11, letterSpacing: ".25em", color: "#666" }}>SKIPPED · 全部作品</div>
        <div className="mw-title" style={{ fontSize: 60, fontWeight: 600, lineHeight: 1, marginTop: 6 }}>My World</div>
        <div className="mw-body" style={{ fontSize: 19, color: "#555", marginTop: 4 }}>
          跳过散步直接看 :)
        </div>

        <div style={{
          marginTop: 32, display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 22,
        }}>
          {Object.entries(WORKS).map(([id, w]) => (
            <div key={id} style={{
              background: "#fffdf6", border: "3px solid #1b1b1b", filter: "url(#wobble)",
              padding: 22, boxShadow: "3px 4px 0 rgba(0,0,0,.14)",
            }}>
              <div style={{
                height: 150, background: w.bg,
                border: "2px solid #1b1b1b", filter: "url(#wobble)",
              }}/>
              <div className="mw-title" style={{ fontSize: 30, marginTop: 14 }}>{w.name}</div>
              <div className="mw-body" style={{ color: "#666", fontSize: 16 }}>{w.tag}</div>
              <div className="mw-body" style={{ fontSize: 16, marginTop: 8, color: "#444" }}>{w.intro}</div>

              <div style={{ marginTop: 18, display: "flex", gap: 12, flexWrap: "wrap" }}>
                <button style={cardBtn("#d97757")} onClick={() => setDemoId(id)}>▶ 小演示</button>
                <button style={cardBtn("#6f8f6a")} onClick={() => onShowcase?.(w.showcase, id)}>
                  详细了解 →
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Page-level nav — small, centered, on-theme but quieter than the card pills */}
        <div style={{
          marginTop: 32, display: "flex", gap: 14, justifyContent: "center", flexWrap: "wrap"
        }}>
          <button className="mw-skip" onClick={onBackToWalk}>← 还是想走一遍</button>
          <button className="mw-skip" onClick={onClose}>关闭</button>
        </div>
      </div>

      {/* Inline demo popup — its own little card, dark or light to match the work */}
      {demoId && (() => {
        const w = WORKS[demoId];
        const dark = demoId !== "focus";
        return (
          <div onClick={() => setDemoId(null)} className="mw-themed-scroll" style={{
            position: "fixed", inset: 0, background: "rgba(27,27,27,.6)", zIndex: 60,
            display: "flex", alignItems: "center", justifyContent: "center",
            padding: 20, overflowY: "auto",
          }}>
            <div onClick={(e) => e.stopPropagation()} className="mw-themed-scroll" style={{
              width: "min(520px, 100%)",
              background: dark ? "#1E1711" : "#FBFBFB",
              border: "3px solid #1b1b1b", filter: "url(#wobble)",
              padding: "26px 28px 24px", position: "relative",
              maxHeight: "90vh", overflowY: "auto",
              boxShadow: "6px 8px 0 rgba(0,0,0,.2)",
            }}>
              <div className="sk-mono" style={{
                fontSize: 10, letterSpacing: ".2em",
                color: dark ? "#9C8E7A" : "#888"
              }}>
                WORK · {w.en.toUpperCase()} · 演示
              </div>
              <div className="mw-title" style={{
                fontSize: 36, fontWeight: 600, marginTop: 6, lineHeight: 1.05,
                color: dark ? "#F4EFE6" : "#1b1b1b"
              }}>
                {w.name}
              </div>
              <div style={{ marginTop: 18 }}>
                {demoId === "focus" ? <FocusDemo/> : <MoodDemo/>}
              </div>
              <button onClick={() => setDemoId(null)} aria-label="close" style={{
                position: "absolute", top: 12, right: 12, width: 32, height: 32,
                border: "2px solid #1b1b1b",
                background: dark ? "#1E1711" : "#fffdf6",
                color: dark ? "#F4EFE6" : "#1b1b1b",
                borderRadius: "50%", fontFamily: "Caveat", fontSize: 18, cursor: "pointer",
                filter: "url(#wobble)",
              }}>✕</button>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
