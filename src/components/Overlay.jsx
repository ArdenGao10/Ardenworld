/* My World — generic content overlay (about / notes / doodle / contact) */

import { useEffect } from 'react';

export default function Overlay({ title, sub, children, onClose, accent = "#fffdf6" }) {
  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);
  return (
    <div onClick={onClose} style={{
      position: "fixed", inset: 0, background: "rgba(27,27,27,.55)", zIndex: 50,
      display: "flex", alignItems: "center", justifyContent: "center", padding: 20
    }}>
      {/* Frame wraps panel + wobble-border so they share bounds. The
          wobble border is its own element (fixed content: just the line
          rectangle) so WebKit caches its filter result; the scrolling
          panel is filter-free so its repaints (scrolling, SketchPad
          strokes, growing notes) don't trigger any filter re-execution.
          maxHeight on the frame lets the wobble layer match the panel's
          actual height — content shorter than 85vh, frame is shorter. */}
      <div onClick={(e) => e.stopPropagation()} style={{
        width: "min(620px, 100%)", maxHeight: "85vh",
        position: "relative", boxShadow: "6px 8px 0 rgba(0,0,0,.2)"
      }}>
        <div style={{
          // Solid ink border under the wobble overlay. Without this, the
          // overlay's wavy border moves outward (≤2 px) and exposes a sliver
          // of modal backdrop where the panel's fill stops — visible as a
          // thin white seam on Chrome (worst case) and Safari. The straight
          // line underneath fills that gap; the wobble pass paints over it.
          background: accent, border: "3px solid #1b1b1b",
          maxHeight: "85vh", overflowY: "auto",
          padding: "28px 32px", position: "relative"
        }}>
          <div className="sk-mono" style={{ fontSize: 10, letterSpacing: ".2em", color: "#666" }}>{sub}</div>
          <div className="mw-title" style={{ fontSize: 42, fontWeight: 600, marginTop: 4, lineHeight: 1, marginBottom: 16 }}>
            {title}
          </div>
          {children}
          {/* No wobble — the frame's overlay handles the hand-drawn line. */}
          <button onClick={onClose} aria-label="close" style={{
            position: "absolute", top: 12, right: 12, width: 32, height: 32, border: "2px solid #1b1b1b",
            background: "transparent", borderRadius: "50%", fontFamily: "Caveat", fontSize: 18, cursor: "pointer",
          }}>✕</button>
        </div>
        {/* wobble border — filter only on this fixed-content layer. */}
        <div aria-hidden="true" style={{
          position: "absolute", inset: 0,
          border: "3px solid #1b1b1b", filter: "url(#wobble)",
          pointerEvents: "none",
        }}/>
      </div>
    </div>
  );
}
