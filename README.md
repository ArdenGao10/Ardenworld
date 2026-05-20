# My World · Ardenworld

Arden's portfolio reimagined as a small playable world — a hand-drawn,
side-scrolling walk and a physics-driven climbing wall, all in the browser.

**Live site:** <https://ardencosmic.com/>

Built from the original Claude Design handoff bundle (`My World.html`) and
re-implemented as a Vite + React app so it can be hosted, iterated, and
extended beyond the single-file prototype.

---

## What it is

Instead of a static "about / projects / contact" page, the portfolio is a
~60-second world you walk through. Every stop along the path is an
interaction: doors knock, signposts speak, mailboxes open, products preview
themselves inline. A title screen lets the visitor pick how they'd like to
experience it:

- **简单版 · the walk** — a calm, mouse-first side-scroll. Stops along the
  path: a knock-knock door, an *about* signpost, a puddle to jump, two product
  signboards (专注圈 · the focus orb / 心情唱片 · the mood record), a notes
  mailbox, a lantern, a doodle wall, a contact mailbox, a "coming soon" hill,
  and the summit. The sky cycles day → dusk → night as you walk. A second
  playthrough adds a cat that follows you.
- **困难版 · the climb** — a Klifur-style physics climbing wall. Drag each of
  the four limbs onto rock holds. Gripped limbs behave as springs holding you
  up against gravity; overreach pops a grip; losing all four drops you to the
  last ledge. The two featured works are wall plaques you can read mid-climb.
  Reach the summit to clear it.

Either game's **← 标题** button returns to the title screen so the visitor
can swap modes at any time.

---

## Controls

### 简单版 (mouse-first, no keyboard required)

- **Click the ground** — walk to that point.
- **Click a sign / door / mailbox / lantern** — walk over and interact.
- **Floating ↑ button** (or `Space` / `↑` on keyboard) — jump the puddle.
- **SKIP →** (top-right) — skip the walk and open the works gallery directly.

### 困难版

- **Drag a hand or foot** (the four circles with a dashed ring) onto a rock
  hold to grip it. Release to let go.
- Keep your torso within reach of your grips — overreaching pops the
  furthest hold off the wall.
- Lose all four grips and you fall to the most recent ledge checkpoint.
- **← 标题** returns to the title screen; **SKIP →** opens the works gallery.

---

## Run locally

Requires Node 18+.

```bash
npm install
npm run dev      # dev server (Vite, hot reload)
npm run build    # production build to dist/
npm run preview  # preview the production build locally
```

The dev server prints a local URL (typically <http://localhost:5173>). Open
it in any modern browser — no other setup needed.

---

## Project structure

```
index.html                  entry — fonts + the #wobble SVG filter defs
vite.config.js              Vite config
public/                     static assets served at /
src/
  main.jsx                  React root
  index.css                 all styles (type system, animations, layout)
  App.jsx                   mode router: title → 简单版 / 困难版
  WalkGame.jsx              简单版 — the side-scrolling walk
  ClimbGame.jsx             困难版 — the physics climbing wall
  world/
    data.js                 walk-world dimensions, terrain, STOPS, WORKS
    climbData.js            climbing wall — HOLDS, LEDGES, plaques
    Char.jsx                walk character + cat sprites
    Climber.jsx             climber sprite (torso + 4 draggable limbs)
    Background.jsx          sky, sun/moon, hills, ground, clouds, trees, birds
    StopMarker.jsx          per-stop scenery (signs, mailboxes, doors…)
  components/
    TitleScreen.jsx         pick 简单版 / 困难版
    Dialog.jsx              speech bubble
    WorkModal.jsx           work detail modal with mini product preview
    Overlay.jsx             generic content overlay (about / notes / doodle / contact)
    HUD.jsx                 walk HUD — progress bar + interact prompt
    Gallery.jsx             skip-the-game works gallery (shared by both modes)
```

---

## How the climb works

`ClimbGame.jsx` runs a small physics simulation each frame:

- The **torso** is a point mass pulled down by gravity.
- Each **gripped limb** is a spring anchored to its hold — when stretched
  past its rest length it pulls the torso toward the hold, so the active
  grips hold the climber up.
- A **position-constraint pass** prevents a limb from exceeding its max
  reach. If the constraint still can't be satisfied (you overreached),
  that grip **slips off** the wall.
- With **zero grips** the climber falls; `LEDGES` act as checkpoints that
  catch the climber and reset the active limbs.

The constants at the top of `ClimbGame.jsx` (`GRAV`, `STIFF`, `REACH`,
`DAMP`, …) are the difficulty knobs. `src/world/climbData.js` defines the
wall geometry, the route of holds, and the catch ledges.

---

## How the walk works

`WalkGame.jsx` is a deliberately small state machine:

- The world has a fixed length (`WORLD_W` in `src/world/data.js`) and the
  camera follows the character horizontally.
- Clicking the ground sets a walk target; the character animates toward it
  and triggers the nearest stop when within range.
- Each entry in `STOPS` describes a position, a kind (sign / door / mailbox
  / puddle / lantern / doodle), and the payload to show (dialog text, an
  overlay component, or a product modal).
- The sky cycles through three phases tied to walk progress, and a second
  playthrough sets a flag that spawns the trailing cat.

---

## Notes on the handoff

A few things worth knowing if you compare this to the original prototype:

- The prototype's two parallel `<script type="text/babel">` blocks were
  split into ES modules; the `window` global that bridged them became
  normal imports.
- The prototype source carried earlier-iteration dead code the final design
  no longer used — standalone `FocusGame` / `MoodGame` mini-games and a
  full-screen end screen (superseded by the in-world achievement card) —
  which has been left out to keep the project to the design's actual output.
- The `STORY_THOUGHTS` data and the thought-bubble renderer existed in the
  prototype, but the firing logic had been lost in an editing mishap (see
  the chat transcript). It is wired up in `WalkGame.jsx` so the storyline
  thoughts appear at the intended beats.
- `心情唱片` calls an injected `window.claude.complete` if present, else
  falls back to a local title list. Outside the original design tool that
  global doesn't exist, so the deployed site always uses the fallback.
- The title screen and 困难版 climbing mode are an extension beyond the
  original `My World.html` design, built in the same hand-drawn style so
  they sit naturally alongside the walk.

---

## Credits

- Design & illustration: Arden (<https://ardencosmic.com/>)
- Prototype handoff: Claude Design (`My World.html`)
- Re-implementation: Vite + React 18
