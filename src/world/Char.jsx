/* My World — character & cat sprites */

export const Char = ({ size = 90, walking = false, jumping = false, splashing = false, facing = 1, mood = "" }) => {
  const w = size * 0.6, h = size;
  const flip = facing < 0 ? "scaleX(-1)" : "";
  const armSwing = walking ? Math.sin(Date.now() / 100) * 4 : 0;
  return (
    <div style={{ position: "relative", width: w, height: h, transform: flip }}>
      <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
        {/* head */}
        <circle cx={w/2} cy={h*0.18} r={h*0.14} fill="#fffdf6" stroke="#1b1b1b" strokeWidth="2.5" filter="url(#wobble)"/>
        {/* hair tuft */}
        <path d={`M ${w/2 - h*0.1} ${h*0.08} Q ${w/2} ${h*0.02} ${w/2 + h*0.06} ${h*0.07}`} stroke="#1b1b1b" strokeWidth="2.5" fill="none"/>
        {/* eyes — squint when splashing */}
        {splashing ? (
          <>
            <path d={`M ${w/2 - 7} ${h*0.17} L ${w/2 - 3} ${h*0.17}`} stroke="#1b1b1b" strokeWidth="2"/>
            <path d={`M ${w/2 + 3} ${h*0.17} L ${w/2 + 7} ${h*0.17}`} stroke="#1b1b1b" strokeWidth="2"/>
          </>
        ) : (
          <>
            <circle cx={w/2 - 5} cy={h*0.17} r="1.8" fill="#1b1b1b"/>
            <circle cx={w/2 + 5} cy={h*0.17} r="1.8" fill="#1b1b1b"/>
          </>
        )}
        {/* mouth */}
        <path d={splashing
          ? `M ${w/2 - 4} ${h*0.24} Q ${w/2} ${h*0.27} ${w/2 + 4} ${h*0.24}`
          : `M ${w/2 - 5} ${h*0.23} Q ${w/2} ${h*0.26} ${w/2 + 5} ${h*0.23}`}
          stroke="#1b1b1b" strokeWidth="1.5" fill="none"/>
        {/* body */}
        <path d={`M ${w/2 - h*0.13} ${h*0.34} L ${w/2 + h*0.13} ${h*0.34} L ${w/2 + h*0.16} ${h*0.62} L ${w/2 - h*0.16} ${h*0.62} Z`}
              fill="#d97757" stroke="#1b1b1b" strokeWidth="2" filter="url(#wobble)"/>
        {/* arms */}
        {jumping ? (
          <>
            <path d={`M ${w/2 - h*0.13} ${h*0.4} L ${w/2 - h*0.25} ${h*0.30}`} stroke="#1b1b1b" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
            <path d={`M ${w/2 + h*0.13} ${h*0.4} L ${w/2 + h*0.25} ${h*0.30}`} stroke="#1b1b1b" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
          </>
        ) : (
          <>
            <path d={`M ${w/2 - h*0.13} ${h*0.4} L ${w/2 - h*0.22} ${h*0.55 + armSwing}`} stroke="#1b1b1b" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
            <path d={`M ${w/2 + h*0.13} ${h*0.4} L ${w/2 + h*0.22} ${h*0.55 - armSwing}`} stroke="#1b1b1b" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
          </>
        )}
        {/* legs */}
        {jumping ? (
          <>
            <path d={`M ${w/2 - h*0.08} ${h*0.62} L ${w/2 - h*0.16} ${h*0.84}`} stroke="#1b1b1b" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
            <path d={`M ${w/2 + h*0.08} ${h*0.62} L ${w/2 + h*0.16} ${h*0.84}`} stroke="#1b1b1b" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
          </>
        ) : walking ? (
          <>
            <path d={`M ${w/2 - h*0.08} ${h*0.62} L ${w/2 - h*0.14 + armSwing*2} ${h*0.96}`} stroke="#1b1b1b" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
            <path d={`M ${w/2 + h*0.08} ${h*0.62} L ${w/2 + h*0.14 - armSwing*2} ${h*0.96}`} stroke="#1b1b1b" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
          </>
        ) : (
          <>
            <path d={`M ${w/2 - h*0.08} ${h*0.62} L ${w/2 - h*0.08} ${h*0.96}`} stroke="#1b1b1b" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
            <path d={`M ${w/2 + h*0.08} ${h*0.62} L ${w/2 + h*0.08} ${h*0.96}`} stroke="#1b1b1b" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
          </>
        )}
      </svg>
      {mood && (
        <div className="sk-hand" style={{
          position: "absolute", top: -size * 0.1, right: -size * 0.15, fontSize: size * 0.3,
          color: "#1b1b1b", transform: flip
        }}>{mood}</div>
      )}
    </div>
  );
};

export const Cat = ({ size = 36 }) => (
  <svg width={size} height={size * 0.7} viewBox="0 0 50 35">
    <ellipse cx="25" cy="22" rx="14" ry="8" fill="#1b1b1b" filter="url(#wobble)"/>
    <circle cx="38" cy="15" r="6" fill="#1b1b1b"/>
    <path d="M 34 11 L 33 6 L 37 10 Z" fill="#1b1b1b"/>
    <path d="M 42 10 L 43 6 L 39 10 Z" fill="#1b1b1b"/>
    <path d="M 12 20 Q 4 14 8 6" stroke="#1b1b1b" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
    <circle cx="40" cy="14" r="0.8" fill="#fef3a3"/>
    <circle cx="36" cy="14" r="0.8" fill="#fef3a3"/>
    <path d="M 18 28 L 18 33 M 24 28 L 24 33 M 30 28 L 30 33 M 34 27 L 34 33" stroke="#1b1b1b" strokeWidth="2" strokeLinecap="round"/>
  </svg>
);
