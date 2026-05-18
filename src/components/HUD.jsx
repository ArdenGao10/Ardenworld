/* My World — top HUD (progress + skip) and interact prompt */

import { STOPS } from '../world/data.js';

export function HUD({ charX, time, onSkip, stars }) {
  const reached = STOPS.filter(s => s.x <= charX).length;
  return (
    <>
      <div style={{
        position: "fixed", top: 16, left: 16, right: 16, display: "flex", justifyContent: "space-between",
        alignItems: "center", zIndex: 30, pointerEvents: "none"
      }}>
        <div className="sk-mono" style={{
          fontSize: 11, letterSpacing: ".15em", background: "#fffdf6",
          border: "2px solid #1b1b1b", padding: "6px 12px", filter: "url(#wobble)",
          pointerEvents: "auto"
        }}>
          MY WORLD &nbsp;·&nbsp; {time.toUpperCase()} &nbsp;·&nbsp; {reached}/{STOPS.length}
        </div>
        <div style={{ display: "flex", gap: 8, pointerEvents: "auto" }}>
          {stars > 0 && (
            <div className="sk-mono" style={{
              fontSize: 11, letterSpacing: ".15em", background: "#fef3a3",
              border: "2px solid #1b1b1b", padding: "6px 12px", filter: "url(#wobble)"
            }}>
              ✦ × {stars}
            </div>
          )}
          <button onClick={onSkip} className="mw-skip">SKIP →</button>
        </div>
      </div>
      <div style={{
        position: "fixed", top: 56, left: 16, right: 16, display: "flex", gap: 4, zIndex: 30, pointerEvents: "none"
      }}>
        {STOPS.map(s => (
          <div key={s.id} style={{
            flex: 1, height: 3, background: s.x <= charX ? "#1b1b1b" : "rgba(27,27,27,.2)"
          }}/>
        ))}
      </div>
    </>
  );
}

export function InteractPrompt({ stop }) {
  const labels = {
    knock: "敲门",
    about: "看看",
    work: "进入",
    notes: "翻翻",
    lantern: "点灯",
    doodle: "看看",
    contact: "写信",
    soon: "看一眼",
    peak: "到终点",
  };
  const label = labels[stop.type];
  if (!label) return null;
  return (
    <div className="mw-prompt">
      ▾ &nbsp; 点 &nbsp; {label} &nbsp; ▾
    </div>
  );
}
