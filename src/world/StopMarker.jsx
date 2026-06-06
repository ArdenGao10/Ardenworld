/* My World — per-stop scenery markers */

import { GROUND_Y, groundLift, WORKS } from './data.js';

// All wobble-filtered decor in this file gets `transform: translateZ(0)`.
// That promotes each one to its own compositor layer, which lets WebKit
// cache the wobble filter result instead of re-running it every frame as
// the .mw-world's camera transform changes. Without it the wobble border
// flickers/trails visibly when the camera scrolls.
const Signpost = ({ x, y, label, sub, tint = "#fef3a3" }) => (
  <div style={{ position: "absolute", bottom: y, left: x - 40 }}>
    <div style={{ width: 4, height: 80, background: "#1b1b1b", margin: "0 auto" }}/>
    <div style={{
      position: "absolute", top: -6, left: -25, width: 130, padding: "6px 10px",
      background: tint, border: "2.5px solid #1b1b1b", filter: "url(#wobble)",
      transform: "translateZ(0)",
    }}>
      <div className="mw-title" style={{ fontSize: 18, lineHeight: 1.1 }}>{label}</div>
      <div className="note-sm" style={{ fontSize: 11, marginTop: 2 }}>{sub}</div>
    </div>
  </div>
);

const SoftHint = ({ bottom, left = 0 }) => (
  <div className="mw-soft-hint sk-hand" style={{ position: "absolute", bottom, left, fontSize: 18 }}>
    ✦
  </div>
);

export const StopMarker = ({ stop, charNearby, lit, softHint }) => {
  const baseY = GROUND_Y + groundLift(stop.x);
  switch (stop.type) {
    case "start":
      return (
        <div style={{ position: "absolute", bottom: baseY, left: stop.x - 110 }}>
          {/* big title sign */}
          <div style={{
            background: "#fffdf6", border: "3px solid #1b1b1b", filter: "url(#wobble)",
            padding: "10px 24px 12px", boxShadow: "3px 4px 0 rgba(0,0,0,.15)",
            transform: "translateZ(0) rotate(-1.5deg)",
            whiteSpace: "nowrap"
          }}>
            <div className="mw-title" style={{ fontSize: 36, lineHeight: 1, letterSpacing: ".02em" }}>My&nbsp;World</div>
            <div className="sk-hand" style={{ fontSize: 14, color: "#888", marginTop: 4, letterSpacing: ".08em" }}>by Arden &nbsp;·&nbsp; ↘ 往右走</div>
          </div>
        </div>
      );
    case "knock":
      return (
        <div style={{ position: "absolute", bottom: baseY, left: stop.x - 60 }}>
          <div style={{ position: "relative", width: 120, height: 160 }}>
            <div style={{ position: "absolute", bottom: 0, left: 0, width: 120, height: 110, background: "#e8d3b8", border: "2.5px solid #1b1b1b", filter: "url(#wobble)", transform: "translateZ(0)" }}/>
            <svg width="140" height="70" viewBox="0 0 140 70" style={{ position: "absolute", bottom: 105, left: -10, transform: "translateZ(0)" }}>
              <path d="M 0 70 L 70 5 L 140 70 Z" fill="#7a4a32" stroke="#1b1b1b" strokeWidth="2.5" filter="url(#wobble)"/>
            </svg>
            <div style={{ position: "absolute", bottom: 0, left: 40, width: 40, height: 70, background: "#5a3a20", border: "2px solid #1b1b1b", filter: "url(#wobble)", transform: "translateZ(0)" }}>
              <div style={{ position: "absolute", top: 35, right: 4, width: 5, height: 5, background: "#fef3a3", border: "1px solid #1b1b1b", borderRadius: "50%" }}/>
            </div>
            <div style={{ position: "absolute", bottom: 70, left: 10, width: 22, height: 22, background: "#fef3a3", border: "2px solid #1b1b1b", filter: "url(#wobble)", transform: "translateZ(0)" }}/>
            <div style={{ position: "absolute", bottom: 70, right: 10, width: 22, height: 22, background: "#fef3a3", border: "2px solid #1b1b1b", filter: "url(#wobble)", transform: "translateZ(0)" }}/>
          </div>
          <div className="sk-hand" style={{ position: "absolute", bottom: 175, left: -20, fontSize: 16 }}>knock knock ↓</div>
        </div>
      );
    case "about":
      return <Signpost x={stop.x} y={baseY} label="关于" sub="点一下了解我" tint="#fef3a3"/>;
    case "puddle":
      // You can walk straight through the puddle — but a star arc traces the
      // jump path overhead to nudge you into hopping over it instead.
      return (
        <>
          {/* jump-guide star arc */}
          <svg width="180" height="130" viewBox="0 0 180 130" style={{
            position: "absolute", bottom: baseY, left: stop.x - 90, pointerEvents: "none", zIndex: 2
          }}>
            <path d="M 15 130 Q 90 -40 165 130" fill="none"
              stroke="rgba(27,27,27,.4)" strokeWidth="2" strokeDasharray="3 8"
              strokeLinecap="round" filter="url(#wobble)"/>
            {[[45, 75.6, 11], [67.5, 52.6, 14], [112.5, 52.6, 14], [135, 75.6, 11]].map(([sx, sy, fs], i) => (
              <text key={i} x={sx} y={sy} fontSize={fs} textAnchor="middle"
                fill="#fef3a3" stroke="#1b1b1b" strokeWidth="0.5"
                style={{ fontFamily: "Caveat" }}>✦</text>
            ))}
          </svg>
          {/* puddle */}
          <div style={{
            position: "absolute", bottom: baseY - 3, left: stop.x - 32, width: 64, height: 14,
            background: "linear-gradient(180deg, #8badd6 0%, #5577a3 100%)",
            border: "2.5px solid #1b1b1b", borderRadius: "50%", filter: "url(#wobble)",
            transform: "translateZ(0)",
            zIndex: 3
          }}>
            <div style={{ position: "absolute", top: 3, left: 14, width: 14, height: 1.5, background: "rgba(255,255,255,.7)", borderRadius: 2 }}/>
          </div>
          {/* hint */}
          <div className="sk-hand" style={{
            position: "absolute", bottom: baseY + 112, left: stop.x - 34, fontSize: 15, color: "#1b1b1b"
          }}>跳一下 ✦</div>
        </>
      );
    case "work": {
      const w = WORKS[stop.workId];
      const signBg = w.sign || "#fef3a3";
      const signInk = w.signInk || "#1b1b1b";
      return (
        <div style={{ position: "absolute", bottom: baseY, left: stop.x - 110 }}>
          {/* halo — translateZ(0) gives this its own compositor layer so
              WebKit caches the wobble filter result instead of re-running
              the displacement every frame as .mw-world's camera transform
              changes (which is the source of the visible border trails). */}
          <div style={{
            position: "absolute", bottom: 40, left: 0, width: 220, height: 220,
            borderRadius: "50%", background: w.bg, opacity: .65, filter: "url(#wobble)",
            transform: "translateZ(0)",
          }}/>
          {/* signpost stick */}
          <div style={{ position: "absolute", bottom: 0, left: 102, width: 8, height: 130, background: "#1b1b1b" }}/>
          {/* BIG signboard — same isolation trick on the existing transform */}
          <div style={{
            position: "absolute", bottom: 120, left: 0, width: 220,
            background: signBg,
            border: "3px solid #1b1b1b", filter: "url(#wobble)",
            color: signInk,
            padding: "12px 14px 14px",
            boxShadow: "3px 4px 0 rgba(0,0,0,.18)",
            transform: charNearby ? "translateZ(0) rotate(-1.5deg) translateY(-2px)" : "translateZ(0) rotate(0deg)",
            transition: "transform .3s"
          }}>
            <div className="sk-mono" style={{ fontSize: 9, letterSpacing: ".2em", textTransform: "uppercase", opacity: .75 }}>
              {w.en} · {w.tag}
            </div>
            <div className="mw-title" style={{ fontSize: 30, fontWeight: 600, lineHeight: 1, marginTop: 4 }}>{w.name}</div>
            {/* mini preview screen — same trick */}
            <div style={{
              marginTop: 10, height: 56,
              background: w.bg, border: "2px solid #1b1b1b", filter: "url(#wobble)",
              transform: "translateZ(0)",
              display: "flex", alignItems: "center", justifyContent: "center"
            }}>
              <div className="sk-mono" style={{
                fontSize: 9, letterSpacing: ".15em", textTransform: "uppercase",
                color: signInk, opacity: .7
              }}>
                {w.en} · click sign
              </div>
            </div>
          </div>
          {/* "tap me" hint when nearby */}
          {charNearby && (
            <div className="sk-hand" style={{
              position: "absolute", bottom: 100, left: 80, fontSize: 16,
              color: "#1b1b1b", animation: "mw-bob 1.2s ease-in-out infinite"
            }}>↑ 点一下</div>
          )}
        </div>
      );
    }
    case "notes":
      return (
        <div style={{ position: "absolute", bottom: baseY, left: stop.x - 30 }}>
          {softHint && <SoftHint bottom={105} left={20}/>}
          <div style={{ width: 60, height: 90, background: "#7a4a32", border: "2.5px solid #1b1b1b", filter: "url(#wobble)", transform: "translateZ(0)", position: "relative" }}>
            <div style={{ position: "absolute", top: 14, left: 8, right: 8, height: 14, background: "#1b1b1b" }}/>
            <div className="sk-mono" style={{ position: "absolute", bottom: 8, left: 0, right: 0, textAlign: "center", color: "#fffdf6", fontSize: 9, letterSpacing: ".1em" }}>NOTES</div>
          </div>
          <div className="sk-hand" style={{ position: "absolute", bottom: 100, left: -20, fontSize: 16 }}>↓ 翻翻</div>
        </div>
      );
    case "lantern":
      // Stays dark until the player walks up and clicks it — lighting it is
      // the point of the stop, so it must not glow on its own.
      return (
        <div style={{ position: "absolute", bottom: baseY, left: stop.x - 15 }}>
          {softHint && <SoftHint bottom={120} left={-5}/>}
          <div style={{ width: 5, height: 100, background: "#1b1b1b", margin: "0 auto" }}/>
          {/* Lantern body — translateZ(0) caches the wobble filter on its
              own compositor layer so the camera's per-frame transform
              doesn't re-run displacement and trail the border. */}
          <div style={{
            position: "absolute", top: -10, left: -12, width: 30, height: 30,
            background: lit ? "#fef3a3" : "#fffdf6",
            border: "2.5px solid #1b1b1b", filter: "url(#wobble)", borderRadius: "8px 8px 4px 4px",
            transform: "translateZ(0)",
            transition: "background .4s ease, box-shadow .4s ease",
            boxShadow: lit ? "0 0 30px rgba(254,243,163,.8), 0 0 60px rgba(254,243,163,.4)" : "none"
          }}/>
          {charNearby && !lit && (
            <div className="sk-hand" style={{
              position: "absolute", bottom: 120, left: -32, fontSize: 16, whiteSpace: "nowrap",
              color: "#1b1b1b", animation: "mw-bob 1.2s ease-in-out infinite"
            }}>↓ 点亮它</div>
          )}
        </div>
      );
    case "doodle":
      return (
        <div style={{ position: "absolute", bottom: baseY, left: stop.x - 80 }}>
          <div style={{ width: 160, height: 100, background: "#fffdf6", border: "2.5px solid #1b1b1b", filter: "url(#wobble)", padding: 8, display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 4 }}>
            {Array.from({length: 6}).map((_, i) => (
              <div key={i} style={{
                background: ["#cfe0c6","#fef3a3","#f7c5c0","#a8c8e0","#e7d4c4","#1b1b1b"][i],
                border: "1px solid #1b1b1b"
              }}/>
            ))}
          </div>
          <div className="sk-hand" style={{ position: "absolute", bottom: 110, left: -10, fontSize: 16 }}>doodle wall ↓</div>
        </div>
      );
    case "contact":
      return (
        <div style={{ position: "absolute", bottom: baseY, left: stop.x - 30 }}>
          {softHint && <SoftHint bottom={92} left={20}/>}
          <div style={{ width: 5, height: 70, background: "#1b1b1b", margin: "0 auto" }}/>
          <div style={{
            position: "absolute", top: -10, left: -25, width: 60, height: 40,
            background: "#c97a83", border: "2.5px solid #1b1b1b", filter: "url(#wobble)", borderRadius: "4px",
            transform: "translateZ(0)"
          }}>
            <div style={{ position: "absolute", top: 8, left: 8, right: 8, height: 0, borderTop: "1.5px solid #fffdf6" }}/>
            <div className="sk-hand" style={{ position: "absolute", bottom: 4, left: 0, right: 0, textAlign: "center", fontSize: 12, color: "#fffdf6" }}>mail</div>
          </div>
          <div className="sk-hand" style={{ position: "absolute", bottom: 80, left: -10, fontSize: 14 }}>给我写信 ✉︎</div>
        </div>
      );
    case "peak":
      return (
        <>
          <svg width="320" height="260" viewBox="0 0 320 260" style={{ position: "absolute", bottom: baseY, left: stop.x - 160, transform: "translateZ(0)" }}>
            <path d="M 40 260 L 160 30 L 280 260 Z" fill="#1b1b1b" filter="url(#wobble)"/>
            <path d="M 124 92 L 160 30 L 196 92 L 178 102 L 160 70 L 142 102 Z" fill="#fffdf6" filter="url(#wobble)"/>
          </svg>
          <div style={{ position: "absolute", bottom: baseY + 220, left: stop.x + 5 }}>
            <div style={{ width: 3, height: 50, background: "#fffdf6" }}/>
            <div style={{ position: "absolute", top: 0, left: 3, width: 24, height: 16, background: "#d97757", border: "1.5px solid #1b1b1b" }}/>
          </div>
        </>
      );
    default:
      return null;
  }
};
