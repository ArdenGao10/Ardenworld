/* My World — parallax background layers, ground, foliage */

import { WORLD_WIDTH, GROUND_Y, GROUND_LIFT_MAX, groundLift, STOPS, TREE_POSITIONS } from './data.js';

// --- colour interpolation -------------------------------------------------
// Every layer takes `phase` (0 = full day → 1 = full night). `tri` walks a
// day → dusk → night keyframe, so colours warm first, then darken — gradually.
const hex = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
const toHex = c => "#" + c.map(v => Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, "0")).join("");
const mix = (c1, c2, t) => { const a = hex(c1), b = hex(c2); return toHex(a.map((v, i) => v + (b[i] - v) * t)); };
const tri = (phase, day, dusk, night) =>
  phase < 0.5 ? mix(day, dusk, phase * 2) : mix(dusk, night, (phase - 0.5) * 2);
const clamp01 = v => Math.max(0, Math.min(1, v));

export const SkyGradient = ({ phase }) => {
  const top = tri(phase, "#f7eee3", "#d4885a", "#1c2a44");
  const mid = tri(phase, "#f0e6d2", "#f7a878", "#3a3a5a");
  const bot = tri(phase, "#ebe1cd", "#fae0c4", "#5a4a6a");
  return <div style={{
    position: "absolute", inset: 0,
    background: `linear-gradient(180deg, ${top} 0%, ${mid} 50%, ${bot} 100%)`,
    transition: "background .5s linear",
  }}/>;
};

export const Sun = ({ phase, viewW }) => {
  // Sun arcs left→right, sinks toward the horizon, and fades out as night falls.
  const sunLeft = viewW * (0.15 + 0.78 * clamp01(phase / 0.92));
  const sunTop = 12 + 70 * phase;
  const sunColor = tri(phase, "#f5c542", "#e8703a", "#7a2e12");
  const sunOpacity = clamp01(1 - (phase - 0.6) / 0.3);
  // Moon rises from the horizon and fades in over the last of dusk.
  const m = clamp01((phase - 0.62) / 0.38);
  const moonTop = 30 - 20 * m;
  return (
    <>
      {sunOpacity > 0.01 && (
        <div style={{
          position: "absolute", left: sunLeft, top: `${sunTop}%`,
          width: 70, height: 70, borderRadius: "50%",
          background: sunColor, border: "2.5px solid #1b1b1b", filter: "url(#wobble)",
          opacity: sunOpacity,
          transition: "left .5s linear, top .5s linear, background .5s linear, opacity .5s linear",
          boxShadow: `0 0 ${40 + 20 * phase}px rgba(232,150,66,${0.5 + 0.2 * phase})`,
        }}/>
      )}
      {m > 0.01 && (
        <div style={{
          position: "absolute", left: viewW * 0.18, top: `${moonTop}%`,
          width: 64, height: 64, borderRadius: "50%",
          background: "#f3e8c0", border: "2.5px solid #1b1b1b", filter: "url(#wobble)",
          opacity: m, transition: "top .5s linear, opacity .5s linear",
          boxShadow: "0 0 50px rgba(243,232,192,.5)",
        }}>
          {/* crater */}
          <div style={{ position: "absolute", top: 14, left: 14, width: 10, height: 10, borderRadius: "50%", background: "rgba(27,27,27,.15)" }}/>
          <div style={{ position: "absolute", bottom: 18, right: 12, width: 6, height: 6, borderRadius: "50%", background: "rgba(27,27,27,.15)" }}/>
        </div>
      )}
    </>
  );
};

export const Stars = ({ phase }) => {
  const opacity = clamp01((phase - 0.7) / 0.3);
  if (opacity <= 0.01) return null;
  const stars = [];
  for (let i = 0; i < 30; i++) {
    const x = (i * 137) % 100;
    const y = (i * 53) % 40;
    stars.push(
      <div key={i} className="sk-hand" style={{
        position: "absolute", left: `${x}%`, top: `${y}%`, fontSize: 12 + (i % 3) * 4,
        color: "#fef3a3", opacity: 0.6 + (i % 3) * 0.15
      }}>✦</div>
    );
  }
  return <div style={{ position: "absolute", inset: 0, opacity, transition: "opacity .5s linear" }}>{stars}</div>;
};

export const FarHills = ({ phase }) => {
  const color = tri(phase, "#9eb295", "#8d6655", "#1c2540");
  const SVG_H = 260;
  const BURY = 60;
  return (
    <svg width={WORLD_WIDTH * 0.6} height={SVG_H} viewBox={`0 0 ${WORLD_WIDTH * 0.6} ${SVG_H}`} preserveAspectRatio="none" style={{
      position: "absolute", bottom: `calc(26% - ${BURY}px)`, left: 0, opacity: .85
    }}>
      {Array.from({length: 12}).map((_, i) => {
        const x = i * 360;
        const w = 280 + (i % 3) * 60;
        return (
          <path key={i}
            d={`M ${x} ${SVG_H} Q ${x + w/2} ${20 + (i%3)*30} ${x + w} ${SVG_H} Z`}
            fill={color} stroke="#1b1b1b" strokeWidth="2"/>
        );
      })}
    </svg>
  );
};

export const NearHills = ({ phase }) => {
  const color = tri(phase, "#779a6e", "#5e3f30", "#0e1830");
  // SVG extends below GROUND_Y so the closing horizontal stroke is hidden under the ground band
  const SVG_H = 320;
  const BURY = 80;
  return (
    <svg width={WORLD_WIDTH} height={SVG_H} viewBox={`0 0 ${WORLD_WIDTH} ${SVG_H}`} preserveAspectRatio="none" style={{
      position: "absolute", bottom: GROUND_Y - BURY, left: 0
    }}>
      {Array.from({length: 24}).map((_, i) => {
        const x = i * 320 - 100;
        const w = 380 + (i % 4) * 40;
        const h = 90 + (i % 3) * 40;
        return (
          <path key={i}
            d={`M ${x} ${SVG_H} Q ${x + w/2} ${SVG_H - BURY - h} ${x + w} ${SVG_H} Z`}
            fill={color} stroke="#1b1b1b" strokeWidth="2.5" opacity={.98}/>
        );
      })}
    </svg>
  );
};

// Small bushes/foreground tufts close to the ground — render BEFORE ground
export const Bushes = ({ phase }) => {
  const c = tri(phase, "#5a7a52", "#48311e", "#0a1020");
  return Array.from({length: 36}).map((_, i) => {
    const x = (i * 197 + 60) % WORLD_WIDTH;
    if (STOPS.some(s => Math.abs(s.x - x) < 110)) return null;
    const y = GROUND_Y + groundLift(x) - 6;
    const sz = 14 + (i % 4) * 6;
    return (
      <div key={"bs" + i} style={{
        position: "absolute", bottom: y, left: x - sz/2, width: sz, height: sz * 0.55,
        background: c, border: "1.5px solid #1b1b1b", borderRadius: "50% 50% 30% 30%",
        filter: "url(#wobble)", zIndex: 2
      }}/>
    );
  });
};

// The actual ground with undulating top — character walks on this
export const Ground = ({ phase }) => {
  const earth = tri(phase, "#d8c89a", "#806548", "#2a2436");
  const grass = mix("#5a6a4a", "#3a4a5a", clamp01(phase));
  // Build a path going across the entire world at the character's ground line
  const segments = 200;
  let pathD = `M 0 ${GROUND_LIFT_MAX + 100}`;
  for (let i = 0; i <= segments; i++) {
    const x = (i / segments) * WORLD_WIDTH;
    const y = Math.min(GROUND_LIFT_MAX, GROUND_LIFT_MAX - groundLift(x));
    pathD += ` L ${x.toFixed(1)} ${y.toFixed(1)}`;
  }
  pathD += ` L ${WORLD_WIDTH} ${GROUND_LIFT_MAX + 100} Z`;

  return (
    <svg
      width={WORLD_WIDTH} height={GROUND_LIFT_MAX + 100 + GROUND_Y}
      viewBox={`0 -${GROUND_LIFT_MAX} ${WORLD_WIDTH} ${GROUND_LIFT_MAX + 100 + GROUND_Y}`}
      preserveAspectRatio="none"
      style={{ position: "absolute", bottom: 0, left: 0, width: WORLD_WIDTH }}
    >
      <defs>
        <pattern id="earth-hatch" patternUnits="userSpaceOnUse" width="14" height="14" patternTransform="rotate(-30)">
          <rect width="14" height="14" fill={earth}/>
          <line x1="0" y1="0" x2="0" y2="14" stroke="rgba(27,27,27,.13)" strokeWidth="1"/>
        </pattern>
      </defs>
      {/* No wobble filter here, or on the hill layers above. This path spans
          the full 6800px world, and the day/night cycle recolours it every
          frame — re-running an SVG filter over an image that wide on every
          frame stalls iOS Safari and makes the pattern-filled ground flicker
          out completely. At this scale the wobble was never even visible. */}
      <path d={pathD} fill="url(#earth-hatch)" stroke="#1b1b1b" strokeWidth="2.5"/>
      {/* grass tufts along curve */}
      {Array.from({length: 100}).map((_, i) => {
        const x = (i * 70 + 30) % WORLD_WIDTH;
        const y = GROUND_LIFT_MAX - groundLift(x) - 2;
        return (
          <text key={i} x={x} y={y - 4} fontSize="14" fill={grass} fontFamily="Caveat">w</text>
        );
      })}
    </svg>
  );
};

// Long, cottony clouds — multi-bump silhouette, drift slowly
const CloudShape = ({ color }) => (
  <svg width="180" height="64" viewBox="0 0 180 64">
    <path
      d="M 8 50
         C 0 38, 4 26, 18 24
         C 18 12, 32 6, 46 14
         C 52 4, 72 2, 84 10
         C 92 0, 116 0, 124 12
         C 138 6, 158 12, 158 26
         C 174 28, 178 44, 168 52
         L 168 56
         C 152 62, 22 62, 8 56 Z"
      fill={color} stroke="#1b1b1b" strokeWidth="2" filter="url(#wobble)" strokeLinejoin="round"/>
  </svg>
);

export const Clouds = ({ phase }) => {
  // Clouds warm at dusk, then fade away as the sky darkens.
  const fade = clamp01(1 - (phase - 0.3) / 0.5);
  if (fade <= 0.01) return null;
  const cloudColor = tri(phase, "#fffdf6", "#fef0dd", "#fef0dd");
  // Seven sparse clouds. Static positions, slow drift handled by CSS.
  const layout = [
    { x: 280,  y: 40,  s: 1.0 },
    { x: 1240, y: 70,  s: 0.7 },
    { x: 2100, y: 30,  s: 1.2 },
    { x: 3100, y: 90,  s: 0.8 },
    { x: 4400, y: 50,  s: 1.0 },
    { x: 5400, y: 100, s: 0.9 },
    { x: 6300, y: 40,  s: 0.75 },
  ];
  return layout.map((c, i) => (
    <div key={i} className="mw-cloud" style={{
      position: "absolute", left: c.x, top: c.y,
      width: 180 * c.s, height: 64 * c.s,
      opacity: 0.95 * fade,
      animationDuration: `${80 + (i % 3) * 20}s`,
      animationDelay: `${-i * 6}s`,
    }}>
      <CloudShape color={cloudColor}/>
    </div>
  ));
};

export const Trees = ({ phase, flowered }) => {
  const trunkC = "#5a3a20";
  const foliage = tri(phase, "#7fa872", "#6a5440", "#1a3a2a");
  return TREE_POSITIONS.map(({ id, x, h }) => {
    const baseY = GROUND_Y + groundLift(x);
    const isBloom = flowered && flowered[id];
    return (
      <div key={id} style={{ position: "absolute", bottom: baseY - 4, left: x }}>
        <div style={{ position: "absolute", bottom: 0, left: -5, width: 10, height: h * 0.35, background: trunkC, border: "1.5px solid #1b1b1b", filter: "url(#wobble)" }}/>
        <div style={{
          position: "absolute", bottom: h * 0.3, left: -h * 0.3, width: h * 0.6, height: h * 0.6,
          borderRadius: "50%", background: foliage, border: "2px solid #1b1b1b", filter: "url(#wobble)",
          transition: "transform .25s",
          transform: isBloom ? "scale(1.08)" : "scale(1)"
        }}/>
        {isBloom && Array.from({length: 6}).map((_, k) => {
          const angle = (k / 6) * Math.PI * 2;
          const r = h * 0.32;
          const fx = Math.cos(angle) * r;
          const fy = Math.sin(angle) * r;
          const color = ["#f7c5c0","#fef3a3","#fffdf6","#c97a83","#f7c5c0","#fef3a3"][k];
          return (
            <div key={k} className="mw-bloom" style={{
              position: "absolute", bottom: h * 0.3 + h * 0.3 + fy - 6, left: fx - 6,
              width: 12, height: 12, borderRadius: "50%",
              background: color, border: "1.5px solid #1b1b1b",
              animationDelay: `${k * 0.06}s`
            }}/>
          );
        })}
        {isBloom && Array.from({length: 4}).map((_, k) => (
          <div key={"p"+k} style={{
            position: "absolute", bottom: -2, left: -20 + k * 12,
            width: 6, height: 4, borderRadius: "50%",
            background: ["#f7c5c0","#fef3a3","#fffdf6","#c97a83"][k],
            border: "1px solid #1b1b1b",
            transform: `rotate(${k * 30}deg)`
          }}/>
        ))}
      </div>
    );
  });
};

// Birds — fly across the sky during the day, fading out as dusk deepens
export const Birds = ({ phase }) => {
  const fade = clamp01(1 - (phase - 0.2) / 0.4);
  if (fade <= 0.01) return null;
  return (
    <>
      {Array.from({length: 2}).map((_, i) => (
        <div key={i} className="mw-bird" style={{
          top: `${10 + (i * 13) % 35}%`,
          fontSize: 14 + (i % 2) * 6,
          animationDuration: `${30 + i * 8}s`,
          animationDelay: `${-i * 7}s`,
          color: "#1b1b1b",
          opacity: 0.7 * fade
        }}>
          <svg width="32" height="14" viewBox="0 0 32 14">
            <path d="M 2 10 Q 8 2 14 8 Q 20 2 26 10" stroke="currentColor" strokeWidth="2" fill="none" filter="url(#wobble)" strokeLinecap="round"/>
          </svg>
        </div>
      ))}
    </>
  );
};
