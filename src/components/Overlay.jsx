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
      <div onClick={(e) => e.stopPropagation()} style={{
        width: "min(620px, 100%)", maxHeight: "85vh", overflowY: "auto",
        background: accent, border: "3px solid #1b1b1b", filter: "url(#wobble)",
        padding: "28px 32px", boxShadow: "6px 8px 0 rgba(0,0,0,.2)", position: "relative"
      }}>
        <div className="sk-mono" style={{ fontSize: 10, letterSpacing: ".2em", color: "#666" }}>{sub}</div>
        <div className="mw-title" style={{ fontSize: 42, fontWeight: 600, marginTop: 4, lineHeight: 1, marginBottom: 16 }}>
          {title}
        </div>
        {children}
        <button onClick={onClose} aria-label="close" style={{
          position: "absolute", top: 12, right: 12, width: 32, height: 32, border: "2px solid #1b1b1b",
          background: "transparent", borderRadius: "50%", fontFamily: "Caveat", fontSize: 18, cursor: "pointer",
          filter: "url(#wobble)"
        }}>✕</button>
      </div>
    </div>
  );
}
