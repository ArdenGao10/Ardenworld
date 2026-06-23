/* My World — top HUD (progress + skip) and interact prompt */

import { STOPS } from '../world/data.js';
import { useLang } from '../i18n/lang.jsx';
import LangToggle from './LangToggle.jsx';

// The meaningful stops the progress reflects — start / puddle / peak aren't
// places you "visit", so they don't count here or on the end card.
const COUNTED_STOPS = STOPS.filter(s => !["start", "puddle", "peak"].includes(s.type));

export function HUD({ time, onSkip, stars, reached }) {
  const visited = COUNTED_STOPS.filter(s => reached[s.id]).length;
  return (
    <>
      <div style={{
        position: "fixed", top: 16, left: 16, right: 16, display: "flex", justifyContent: "space-between",
        alignItems: "center", zIndex: 30, pointerEvents: "none"
      }}>
        <div className="sk-mono" style={{
          fontSize: 11, letterSpacing: ".15em", background: "#fffdf6",
          border: "2px solid #1b1b1b", padding: "6px 14px", filter: "url(#wobble)",
          boxShadow: "1px 2px 0 rgba(0,0,0,.1)", pointerEvents: "auto"
        }}>
          MY WORLD &nbsp;·&nbsp; {time.toUpperCase()} &nbsp;·&nbsp; {visited}/{COUNTED_STOPS.length}
        </div>
        <div style={{ display: "flex", gap: 8, pointerEvents: "auto" }}>
          <LangToggle/>
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
        {COUNTED_STOPS.map(s => (
          <div key={s.id} style={{
            flex: 1, height: 3, background: reached[s.id] ? "#1b1b1b" : "rgba(27,27,27,.2)"
          }}/>
        ))}
      </div>
    </>
  );
}

export function InteractPrompt({ stop }) {
  const { t } = useLang();
  const PROMPT_KEYS = {
    knock: 'prompt.knock',
    about: 'prompt.about',
    work: 'prompt.work',
    notes: 'prompt.notes',
    lantern: 'prompt.lantern',
    doodle: 'prompt.doodle',
    contact: 'prompt.contact',
    peak: 'prompt.peak',
  };
  const key = PROMPT_KEYS[stop.type];
  if (!key) return null;
  return (
    <div className="mw-prompt">
      ▾ &nbsp; {t('prompt.tap')} &nbsp; {t(key)} &nbsp; ▾
    </div>
  );
}
