/* My World — 困难版 · 攀岩 (hard mode climbing wall)
 *
 * A tall vertical wall. Holds are scattered up it; the climber drags
 * each limb onto a hold, Klifur-style. Ledges are checkpoints; a fall
 * drops you back to the last one. The two works are wall plaques.
 */

export const WALL_TOP = 2700;   // total climb height (px)
export const SUMMIT_Y = WALL_TOP;

// Checkpoint ledges — a fall resets you to the highest ledge below you.
export const LEDGES = [
  { y: 70,   label: "起点 · base camp" },
  { y: 980,  label: "歇脚处 ①" },
  { y: 1880, label: "歇脚处 ②" },
];

// The two works, mounted on the wall as plaques you can climb up to and tap.
export const CLIMB_WORKS = [
  { workId: "focus", y: 1300, side: 0.84 },
  { workId: "mood",  y: 2230, side: 0.16 },
];

function clampX(v) { return Math.max(0.08, Math.min(0.92, v)); }

// Holds — `x` is a 0..1 fraction across the wall width, `y` is px from base.
// A dense, snaking route so there is always something within reach.
export const HOLDS = (() => {
  const arr = [];
  let id = 0;
  const ledgeYs = LEDGES.map(l => l.y);
  for (let y = 150; y < WALL_TOP - 70; y += 70) {
    if (ledgeYs.some(ly => Math.abs(ly - y) < 70)) continue; // ledge rows fill these
    arr.push({ id: id++, x: clampX(0.5 + Math.sin(y / 240) * 0.30), y });
    arr.push({ id: id++, x: clampX(0.5 + Math.sin(y / 240 + 2.3) * 0.30), y: y + 34 });
  }
  // ledge holds — four across each ledge, so all four limbs can park
  for (const lg of LEDGES) {
    for (let k = 0; k < 4; k++) {
      arr.push({ id: id++, x: 0.30 + k * 0.135, y: lg.y, ledge: true, ledgeY: lg.y });
    }
  }
  // summit holds
  for (let k = 0; k < 3; k++) {
    arr.push({ id: id++, x: 0.34 + k * 0.16, y: WALL_TOP - 80, summit: true });
  }
  return arr;
})();
