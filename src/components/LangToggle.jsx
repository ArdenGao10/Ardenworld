/* My World — shared 中 / EN language toggle pill.
 *
 * A small hand-drawn switch used in both games' HUDs and the intro card.
 * Reads/writes the language through the lang context.
 */
import { useLang } from '../i18n/lang.jsx';

export default function LangToggle({ style }) {
  const { lang, setLang } = useLang();
  return (
    <div className="sk-mono" style={{
      display: "inline-flex", fontSize: 11, letterSpacing: ".1em", background: "#fffdf6",
      border: "2px solid #1b1b1b", filter: "url(#wobble)", overflow: "hidden",
      boxShadow: "1px 2px 0 rgba(0,0,0,.1)", ...style,
    }}>
      {["zh", "en"].map(l => (
        <button key={l} onClick={(e) => { e.stopPropagation(); setLang(l); }} style={{
          border: "none", cursor: "pointer", padding: "6px 10px", fontFamily: "inherit",
          fontSize: 11, letterSpacing: ".1em",
          background: lang === l ? "#1b1b1b" : "transparent",
          color: lang === l ? "#fffdf6" : "#1b1b1b",
        }}>
          {l === "zh" ? "中" : "EN"}
        </button>
      ))}
    </div>
  );
}
