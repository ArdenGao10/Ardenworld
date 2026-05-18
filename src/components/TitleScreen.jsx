/* My World — title screen: pick 简单版 (walk) or 困难版 (climb) */

export default function TitleScreen({ onPick }) {
  return (
    <div className="mw-stage" style={{
      background: "linear-gradient(180deg, #f7eee3 0%, #ebe1cd 60%, #cfe0c6 100%)",
      cursor: "default",
      display: "flex", alignItems: "center", justifyContent: "center", padding: 24
    }}>
      <div style={{ width: "min(720px, 100%)", textAlign: "center" }}>
        <div className="sk-mono" style={{ fontSize: 11, letterSpacing: ".3em", color: "#888" }}>
          BY ARDEN
        </div>
        <div className="mw-title" style={{
          fontSize: "clamp(64px, 16vw, 132px)", lineHeight: 1, marginTop: 6,
          textShadow: "4px 4px 0 #d97757"
        }}>
          My&nbsp;World
        </div>
        <div className="mw-body" style={{ fontSize: 18, color: "#555", marginTop: 12 }}>
          一个可以走进去玩的小宇宙 — 选一种玩法 ✦
        </div>

        <div style={{
          marginTop: 34, display: "grid", gap: 18,
          gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))"
        }}>
          <button onClick={() => onPick("simple")} style={cardStyle("#fef3a3")}>
            <div style={{ fontSize: 46 }}>🚶</div>
            <div className="mw-title" style={{ fontSize: 34 }}>简单版</div>
            <div className="sk-mono" style={{ fontSize: 10, letterSpacing: ".2em", color: "#7a6648" }}>
              A STROLL
            </div>
            <div className="mw-body" style={{ fontSize: 15, color: "#5a5040", marginTop: 6, lineHeight: 1.5 }}>
              横向散步。点屏幕往前走，
              路过招牌就停下来聊聊，
              60 秒走完一个小世界。
            </div>
          </button>

          <button onClick={() => onPick("hard")} style={cardStyle("#d97757", true)}>
            <div style={{ fontSize: 46 }}>🧗</div>
            <div className="mw-title" style={{ fontSize: 34, color: "#fffdf6" }}>困难版</div>
            <div className="sk-mono" style={{ fontSize: 10, letterSpacing: ".2em", color: "#fde6da" }}>
              THE CLIMB
            </div>
            <div className="mw-body" style={{ fontSize: 15, color: "#fff1e9", marginTop: 6, lineHeight: 1.5 }}>
              纵向攀岩。拖动双手双脚
              抓住岩点，一点点爬上山顶。
              手滑了就会掉下去。
            </div>
          </button>
        </div>

        <div className="sk-hand" style={{ fontSize: 16, color: "#888", marginTop: 24 }}>
          两种玩法随时能在游戏里点「← 标题」切换 ✿
        </div>
      </div>
    </div>
  );
}

function cardStyle(bg, dark) {
  return {
    background: bg, border: "3px solid #1b1b1b", filter: "url(#wobble)",
    boxShadow: "4px 6px 0 rgba(0,0,0,.18)", cursor: "pointer",
    padding: "26px 22px", display: "flex", flexDirection: "column",
    alignItems: "center", gap: 4, fontFamily: "inherit",
    color: dark ? "#fffdf6" : "#1b1b1b",
  };
}
