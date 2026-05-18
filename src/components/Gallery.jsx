/* My World — skip-the-walk gallery view */

import { WORKS } from '../world/data.js';

export default function Gallery({ onClose, onBackToWalk }) {
  return (
    <div style={{
      position: "fixed", inset: 0, background: "#f3f1ec", zIndex: 55, overflowY: "auto", padding: "60px 24px"
    }}>
      <div style={{ maxWidth: 720, margin: "0 auto" }}>
        <div className="sk-mono" style={{ fontSize: 11, letterSpacing: ".25em", color: "#666" }}>SKIPPED · 全部作品</div>
        <div className="mw-title" style={{ fontSize: 60, fontWeight: 600, lineHeight: 1, marginTop: 6 }}>My World</div>
        <div className="mw-body" style={{ fontSize: 19, color: "#555", marginTop: 4 }}>
          跳过散步直接看 :)
        </div>
        <div style={{ marginTop: 32, display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 18 }}>
          {Object.entries(WORKS).map(([id, w]) => (
            <div key={id} style={{
              background: "#fffdf6", border: "3px solid #1b1b1b", filter: "url(#wobble)", padding: 20
            }}>
              <div style={{ height: 140, background: w.bg, border: "2px solid #1b1b1b", filter: "url(#wobble)" }}/>
              <div className="mw-title" style={{ fontSize: 28, marginTop: 14 }}>{w.name}</div>
              <div className="mw-body" style={{ color: "#666", fontSize: 16 }}>{w.tag}</div>
              <div className="mw-body" style={{ fontSize: 16, marginTop: 8, color: "#444" }}>{w.intro}</div>
            </div>
          ))}
        </div>
        <div style={{ marginTop: 28, display: "flex", gap: 10 }}>
          <button className="mw-btn mw-btn-primary" onClick={onBackToWalk}>← 还是想走一遍</button>
          <button className="mw-btn" onClick={onClose}>关闭</button>
        </div>
      </div>
    </div>
  );
}
