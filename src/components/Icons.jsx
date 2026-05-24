/* My World — tiny hand-drawn inline icons
 *
 * Used in place of emoji so the whole UI stays in one drawn style.
 */

export function HouseIcon({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24"
         style={{ display: "inline-block", verticalAlign: "-3px", marginRight: 4 }}>
      <path d="M3 12 L12 4 L21 12 L21 21 L3 21 Z"
            fill="#fef3a3" stroke="#1b1b1b" strokeWidth="2" strokeLinejoin="round"/>
      <path d="M2 13 L12 3.5 L22 13"
            fill="none" stroke="#1b1b1b" strokeWidth="2"
            strokeLinecap="round" strokeLinejoin="round"/>
      <rect x="10" y="14" width="5.5" height="7"
            fill="#d97757" stroke="#1b1b1b" strokeWidth="1.5"/>
      <circle cx="14.4" cy="17.6" r="0.7" fill="#1b1b1b"/>
    </svg>
  );
}

export function SpeakerIcon({ size = 16, muted = false }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24"
         style={{ display: "inline-block", verticalAlign: "-3px", marginRight: 4 }}>
      <path d="M3 9 L8 9 L13 5 L13 19 L8 15 L3 15 Z"
            fill="#1b1b1b" stroke="#1b1b1b" strokeWidth="1.6" strokeLinejoin="round"/>
      {muted ? (
        <g stroke="#1b1b1b" strokeWidth="2.2" strokeLinecap="round">
          <line x1="16" y1="9" x2="22" y2="15"/>
          <line x1="22" y1="9" x2="16" y2="15"/>
        </g>
      ) : (
        <g fill="none" stroke="#1b1b1b" strokeWidth="2" strokeLinecap="round">
          <path d="M16 9.5 Q18.5 12 16 14.5"/>
          <path d="M18.5 6.5 Q23 12 18.5 17.5"/>
        </g>
      )}
    </svg>
  );
}

export function ChunkyArrow({ size = 42, dir = "right" }) {
  // Fat hand-drawn arrow. `dir` flips the shape so the same path data
  // works for both directions without needing a second path.
  return (
    <svg width={size} height={size * 0.72} viewBox="0 0 40 30"
         style={{ display: "block", filter: "url(#wobble)",
                  transform: dir === "left" ? "scaleX(-1)" : undefined }}>
      <path d="M3 11 L23 11 L23 3 L38 15 L23 27 L23 19 L3 19 Z"
            fill="#fffdf6" stroke="#1b1b1b" strokeWidth="2.6"
            strokeLinejoin="round" strokeLinecap="round"/>
    </svg>
  );
}

export function MountainIcon({ size = 15 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24"
         style={{ display: "inline-block", verticalAlign: "-2px", marginLeft: 4 }}>
      <path d="M2 20 L9 7 L13 13 L17 5 L22 20 Z"
            fill="#cfe0c6" stroke="#1b1b1b" strokeWidth="2" strokeLinejoin="round"/>
      <path d="M15.5 8.4 L17 5 L18.8 9 L17.6 9.6 L17 8.4 L16.2 9.4 Z"
            fill="#fffdf6" stroke="#1b1b1b" strokeWidth="1.2"/>
    </svg>
  );
}
