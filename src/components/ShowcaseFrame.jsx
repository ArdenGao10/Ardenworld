/* My World — full-page showcase overlay
 *
 * When the user hits "详细了解 →" inside a WorkModal (or in the Gallery),
 * the showcase loads in an iframe and a tiny version of the same little
 * character stands at the edge of the screen. They can:
 *   · drag the character up/down along the wall
 *   · drag past the screen midpoint to flip to the other side
 *   · tap the character to close the showcase and continue walking
 *
 * The "点我回去继续走" speech bubble shows on a 5s loop — visible ~3s,
 * gone ~2s — so it teaches the gesture without nagging.
 */

import { useEffect, useRef, useState } from 'react';
import { Char } from '../world/Char.jsx';
import { useLang } from '../i18n/lang.jsx';

export default function ShowcaseFrame({ url, onClose }) {
  const { t, lang } = useLang();
  const isMobile = window.innerWidth < 720;

  // Pass the game's current language to our own showcase pages (those served
  // from this origin, i.e. relative "/...html" urls) so they open matching
  // the game. External live deploys are left untouched.
  const framedUrl = url && url.startsWith('/')
    ? url + (url.includes('?') ? '&' : '?') + 'lang=' + lang
    : url;
  const size = isMobile ? 54 : 70;  // smaller — just a little fellow at the edge

  // `side` = which wall the character clings to; `y` = distance from the bottom.
  const [pos, setPos] = useState(() => {
    try {
      const s = JSON.parse(localStorage.getItem("mw-peek-pos") || "null");
      if (s && (s.side === "left" || s.side === "right") && typeof s.y === "number") return s;
    } catch { /* ignore */ }
    return { side: "left", y: isMobile ? 110 : 160 };
  });
  const drag = useRef(null);

  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const onPointerDown = (e) => {
    e.stopPropagation();
    e.currentTarget.setPointerCapture(e.pointerId);
    drag.current = { x: e.clientX, y: e.clientY, moved: false, pos: null };
  };
  const onPointerMove = (e) => {
    const d = drag.current;
    if (!d) return;
    if (Math.abs(e.clientX - d.x) > 6 || Math.abs(e.clientY - d.y) > 6) d.moved = true;
    if (d.moved) {
      // Past the screen midline → snap to that side (the wall the user is heading toward)
      const side = e.clientX < window.innerWidth / 2 ? "left" : "right";
      const y = Math.max(20, Math.min(window.innerHeight - size - 20,
                                      window.innerHeight - e.clientY - size / 2));
      d.pos = { side, y };
      setPos(d.pos);
    }
  };
  const onPointerUp = (e) => {
    e.stopPropagation();
    const d = drag.current;
    drag.current = null;
    if (!d) return;
    if (d.moved && d.pos) {
      localStorage.setItem("mw-peek-pos", JSON.stringify(d.pos));
    } else if (!d.moved) {
      onClose();
    }
  };

  const onRight = pos.side === "right";
  // Face inward toward the centre of the screen — same Char as in the walk,
  // just smaller and standing still.
  const facing = onRight ? -1 : 1;

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 70, background: "#fffdf6" }}>
      <iframe
        src={framedUrl}
        title="showcase"
        style={{ width: "100%", height: "100%", border: "none", display: "block", background: "#fffdf6" }}
      />

      {/* The little character — draggable along the wall, tap to return */}
      <div
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        aria-label="back to walk"
        role="button"
        style={{
          position: "fixed",
          [onRight ? "right" : "left"]: 8,
          bottom: pos.y,
          zIndex: 71,
          cursor: "grab",
          touchAction: "none",
          display: "flex", alignItems: "flex-end",
          flexDirection: onRight ? "row-reverse" : "row",
          gap: 6,
          filter: "drop-shadow(2px 3px 0 rgba(0,0,0,.18))",
          userSelect: "none",
          WebkitUserSelect: "none",
        }}
      >
        <Char size={size} facing={facing}/>

        <div className="mw-peek-bubble" style={{
          marginBottom: Math.round(size * 0.55),
          background: "#fffdf6", border: "2.5px solid #1b1b1b",
          padding: "5px 11px", filter: "url(#wobble)",
          boxShadow: "2px 3px 0 rgba(0,0,0,.12)",
          whiteSpace: "nowrap", position: "relative",
          pointerEvents: "none",
        }}>
          <span className="sk-hand" style={{ fontSize: isMobile ? 14 : 16, color: "#1b1b1b" }}>
            {onRight ? t('showcase.backRight') : t('showcase.backLeft')}
          </span>
          {/* tail pointing back toward the character */}
          <div style={{
            position: "absolute",
            [onRight ? "right" : "left"]: -7,
            top: "50%", transform: "translateY(-50%)",
            width: 0, height: 0,
            borderTop: "6px solid transparent", borderBottom: "6px solid transparent",
            [onRight ? "borderLeft" : "borderRight"]: "8px solid #1b1b1b",
          }}/>
        </div>
      </div>
    </div>
  );
}
