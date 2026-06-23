/* My World — 写信给我 · a contact card that really sends
 *
 * The message is POSTed to Web3Forms, which emails it straight to you.
 * On send, a little paper plane folds up and flies off the card.
 *
 * ┌─ SETUP (2 minutes, free, no account) ─────────────────────────┐
 * │ 1. Go to https://web3forms.com                                │
 * │ 2. Type the email you want messages delivered to → get a key  │
 * │ 3. Paste that key into ACCESS_KEY just below                  │
 * └───────────────────────────────────────────────────────────────┘
 */

import { useState } from 'react';
import Overlay from './Overlay.jsx';
import { playClick, playStar } from '../world/sound.js';
import { useLang } from '../i18n/lang.jsx';

// ⬇⬇⬇  PASTE YOUR WEB3FORMS ACCESS KEY HERE  ⬇⬇⬇
const ACCESS_KEY = "45dfc353-bd06-4248-9d1a-0a823280eeb0";

function Plane() {
  return (
    <svg width="44" height="44" viewBox="0 0 44 44">
      <path d="M4 25 L40 6 L23 27 Z" fill="#fffdf6" stroke="#1b1b1b" strokeWidth="2.2" strokeLinejoin="round"/>
      <path d="M23 27 L40 6 L27 40 Z" fill="#e7d4c4" stroke="#1b1b1b" strokeWidth="2.2" strokeLinejoin="round"/>
      <path d="M4 25 L23 27 L27 40" fill="none" stroke="#1b1b1b" strokeWidth="2.2" strokeLinejoin="round"/>
    </svg>
  );
}

export default function ContactCard({ onClose, onSent }) {
  const { t, lang } = useLang();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState("idle"); // idle | flying | sent | error

  // The input itself has no `filter: url(#wobble)` — every keystroke would
  // rerender text inside the filter surface and leave ghost trails. The
  // wavy border lives on a sibling overlay (fixed content: just the line
  // rectangle), so WebKit caches its filter result; typing in the input
  // never triggers a re-pass. The straight solid border on the input
  // underneath fills any outward wobble shift, so there's no seam.
  const baseField = {
    width: "100%", border: "2.5px solid #1b1b1b",
    padding: "9px 12px", fontFamily: "Caveat", fontSize: 19, lineHeight: 1.35,
    background: "#fffdf6", display: "block",
  };
  const wobbleOverlay = {
    position: "absolute", inset: 0,
    border: "2.5px solid #1b1b1b", filter: "url(#wobble)",
    pointerEvents: "none",
  };
  const fieldWrap = { position: "relative", marginBottom: 10 };

  const send = async () => {
    if (!message.trim() || status === "flying" || status === "sent") return;
    playClick();
    setStatus("flying");
    // run the plane animation and the network request in parallel —
    // whichever the slower, the card resolves once both are done
    const minWait = new Promise(r => setTimeout(r, 900));
    try {
      const res = await fetch("https://api.web3forms.com/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({
          access_key: ACCESS_KEY,
          subject: "my world — 有人给你写信了 ✦",
          from_name: name.trim() || (lang === 'zh' ? "一位散步的访客" : "A passing visitor"),
          email: email.trim() || undefined,
          message:
            message.trim() +
            `\n\n— ${name.trim() || (lang === 'zh' ? "匿名" : "Anonymous")}` +
            (email.trim() ? ` · ${email.trim()}` : ""),
        }),
      });
      const data = await res.json().catch(() => ({}));
      await minWait;
      if (data.success) { playStar(); setStatus("sent"); onSent && onSent(); }
      else setStatus("error");
    } catch {
      await minWait;
      setStatus("error");
    }
  };

  return (
    <Overlay title={t('contact.title')} sub="CONTACT" onClose={onClose} accent="#fffdf6">
      {status === "sent" ? (
        <div style={{ textAlign: "center", padding: "12px 0 6px" }}>
          <div className="mw-twinkle" style={{ fontSize: 46, color: "#d97757" }}>✦</div>
          <div className="mw-title" style={{ fontSize: 30, marginTop: 6 }}>{t('contact.sentTitle')}</div>
          <div className="mw-body" style={{ fontSize: 16, color: "#666", marginTop: 8, lineHeight: 1.65 }}>
            {t('contact.sentBody1')}<br/>{t('contact.sentBody2')}
          </div>
          <button className="mw-btn" style={{ marginTop: 18 }} onClick={onClose}>{t('contact.continue')}</button>
        </div>
      ) : (
        <>
          <div className="mw-body" style={{ fontSize: 17, lineHeight: 1.55, color: "#444", marginBottom: 14 }}>
            {t('contact.prompt')}
          </div>
          <div style={fieldWrap}>
            <input style={baseField} placeholder={t('contact.phName')} value={name}
              onChange={(e) => setName(e.target.value)} disabled={status === "flying"}/>
            <div aria-hidden="true" style={wobbleOverlay}/>
          </div>
          <div style={fieldWrap}>
            <input style={baseField} type="email" placeholder={t('contact.phEmail')} value={email}
              onChange={(e) => setEmail(e.target.value)} disabled={status === "flying"}/>
            <div aria-hidden="true" style={wobbleOverlay}/>
          </div>
          <div style={fieldWrap}>
            <textarea rows={5} placeholder={t('contact.phMsg')} value={message}
              onChange={(e) => setMessage(e.target.value)} disabled={status === "flying"}
              style={{ ...baseField, fontSize: 20, lineHeight: 1.4, resize: "vertical" }}/>
            <div aria-hidden="true" style={wobbleOverlay}/>
          </div>

          <div style={{
            position: "relative", display: "flex", justifyContent: "space-between",
            alignItems: "center", marginTop: 6, gap: 10, flexWrap: "wrap",
          }}>
            <div className="sk-mono" style={{ fontSize: 10, letterSpacing: ".12em",
              color: status === "error" ? "#c0563f" : "#888" }}>
              {status === "error" ? t('contact.errHint') : t('contact.okHint')}
            </div>
            <button className="mw-btn mw-btn-primary" onClick={send}
              disabled={status === "flying" || !message.trim()}
              style={{ opacity: (status === "flying" || !message.trim()) ? 0.55 : 1 }}>
              {status === "flying" ? t('contact.flying') : t('contact.send')}
            </button>

            {/* the paper plane folds up and flies away */}
            {status === "flying" && (
              <div className="mw-plane-fly" style={{
                position: "absolute", right: 14, bottom: 2, pointerEvents: "none",
              }}>
                <Plane/>
              </div>
            )}
          </div>
        </>
      )}
    </Overlay>
  );
}
