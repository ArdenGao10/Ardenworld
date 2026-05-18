/* My World — the climber sprite (torso + 4 draggable limbs)
 *
 * Drawn in world coordinates: `torso` and each limb endpoint are world
 * positions; the component renders an SVG box centred on the torso.
 */

export default function Climber({ torso, limbs }) {
  const S = 360, C = S / 2;
  // world point -> SVG-internal coords (internal y points down)
  const to = (x, y) => ({ ix: C + (x - torso.x), iy: C - (y - torso.y) });

  return (
    <div style={{
      position: "absolute", left: torso.x - C, bottom: torso.y - C,
      width: S, height: S, pointerEvents: "none", zIndex: 8
    }}>
      <svg width={S} height={S} viewBox={`0 0 ${S} ${S}`}>
        {/* limbs */}
        {limbs.map((L) => {
          const a = to(torso.x + L.ax, torso.y + L.ay);
          const e = to(L.ex, L.ey);
          const isHand = L.name[1] === "H";
          const col = L.dragging ? "#d97757" : L.grip != null ? "#1b1b1b" : "#9b9a8e";
          // slight elbow/knee bend
          const mx = (a.ix + e.ix) / 2 + (isHand ? 6 : -6);
          const my = (a.iy + e.iy) / 2;
          return (
            <g key={L.name} opacity={L.grip != null || L.dragging ? 1 : 0.78}>
              <path d={`M ${a.ix} ${a.iy} Q ${mx} ${my} ${e.ix} ${e.iy}`}
                stroke={col} strokeWidth={isHand ? 7 : 8} fill="none"
                strokeLinecap="round" filter="url(#wobble)"/>
              <circle cx={e.ix} cy={e.iy} r={isHand ? 9.5 : 8.5}
                fill={L.grip != null ? "#1b1b1b" : L.dragging ? "#d97757" : "#fffdf6"}
                stroke="#1b1b1b" strokeWidth="2.5" filter="url(#wobble)"/>
              {/* a little ring on a free, grabbable limb */}
              {L.grip == null && !L.dragging && (
                <circle cx={e.ix} cy={e.iy} r="15" fill="none"
                  stroke="#d97757" strokeWidth="1.6" strokeDasharray="3 4"/>
              )}
            </g>
          );
        })}
        {/* torso */}
        <rect x={C - 17} y={C - 26} width="34" height="58" rx="10"
          fill="#d97757" stroke="#1b1b1b" strokeWidth="2.5" filter="url(#wobble)"/>
        {/* head */}
        <circle cx={C} cy={C - 45} r="17" fill="#fffdf6"
          stroke="#1b1b1b" strokeWidth="2.5" filter="url(#wobble)"/>
        <path d={`M ${C - 9} ${C - 56} Q ${C} ${C - 64} ${C + 6} ${C - 57}`}
          stroke="#1b1b1b" strokeWidth="2.5" fill="none"/>
        <circle cx={C - 5} cy={C - 47} r="2" fill="#1b1b1b"/>
        <circle cx={C + 5} cy={C - 47} r="2" fill="#1b1b1b"/>
        <path d={`M ${C - 5} ${C - 39} Q ${C} ${C - 36} ${C + 5} ${C - 39}`}
          stroke="#1b1b1b" strokeWidth="1.5" fill="none"/>
      </svg>
    </div>
  );
}
