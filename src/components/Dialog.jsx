/* My World — dialog speech bubble */

import { useState, useEffect, useCallback } from 'react';

export default function Dialog({ lines, onDone }) {
  const [i, setI] = useState(0);
  const advance = useCallback(() => {
    if (i < lines.length - 1) setI(i + 1);
    else onDone && onDone();
  }, [i, lines.length, onDone]);
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); advance(); }
      if (e.key === "Escape") onDone && onDone();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [advance, onDone]);

  // The wobble border lives on a child overlay, NOT on the bubble itself.
  // If the bubble had `filter: url(#wobble)`, advancing `lines[i]` would
  // rerender the text inside that filter surface — WebKit then leaves
  // ghost trails of the previous line on the yellow background. Isolating
  // the filter to a fixed-content overlay (only the border, never
  // changing) caches its filter result, so swapping lines is clean.
  return (
    <div onClick={advance} style={{
      position: "fixed", left: "50%", bottom: 40, transform: "translateX(-50%)",
      width: "min(560px, calc(100vw - 40px))",
      background: "#fef3a3",
      padding: "18px 22px", boxShadow: "4px 6px 0 rgba(0,0,0,.15)", zIndex: 40,
      cursor: "pointer",
    }}>
      <div className="mw-body" style={{ fontSize: 19, lineHeight: 1.55, color: "#1b1b1b", whiteSpace: "pre-line" }}>
        {lines[i]}
      </div>
      <div className="sk-mono" style={{ fontSize: 10, letterSpacing: ".15em", color: "#7a6648", marginTop: 10, textAlign: "right" }}>
        {i+1}/{lines.length} &nbsp; · &nbsp; CLICK ↵
      </div>
      {/* wobble border — filter is on this fixed-content layer only. */}
      <div aria-hidden="true" style={{
        position: "absolute", inset: 0,
        border: "3px solid #1b1b1b", filter: "url(#wobble)",
        pointerEvents: "none",
      }}/>
    </div>
  );
}
