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

  return (
    <div onClick={advance} style={{
      position: "fixed", left: "50%", bottom: 40, transform: "translateX(-50%)",
      width: "min(560px, calc(100vw - 40px))",
      background: "#fef3a3", border: "3px solid #1b1b1b", filter: "url(#wobble)",
      padding: "18px 22px", boxShadow: "4px 6px 0 rgba(0,0,0,.15)", zIndex: 40,
      cursor: "pointer"
    }}>
      <div className="mw-body" style={{ fontSize: 19, lineHeight: 1.55, color: "#1b1b1b", whiteSpace: "pre-line" }}>
        {lines[i]}
      </div>
      <div className="sk-mono" style={{ fontSize: 10, letterSpacing: ".15em", color: "#7a6648", marginTop: 10, textAlign: "right" }}>
        {i+1}/{lines.length} &nbsp; · &nbsp; CLICK ↵
      </div>
    </div>
  );
}
