# My World

Arden's portfolio as a small playable world. Built from the Claude Design
handoff bundle `My World.html`, re-implemented as a Vite + React app.

A title screen offers two ways to play:

- **简单版 · the walk** — a ~60-second hand-drawn side-scroll. Stops along the
  path: a knock-knock door, an *about* signpost, a puddle to jump, two product
  signboards (专注圈 / 心情唱片), a notes mailbox, a lantern, a doodle wall, a
  contact mailbox, a "coming soon" hill, and the summit. Sky moves day → dusk →
  night; a second playthrough adds a cat that follows you.
- **困难版 · the climb** — a Klifur-style physics climbing wall. Drag each of the
  four limbs onto rock holds; gripped limbs are springs holding you up against
  gravity, overreach slips a grip, and losing all four drops you to the last
  ledge. The two works are wall plaques. Climb to the summit to clear it.

Either game's **← 标题** button returns to the title screen to switch modes.

## Controls

**简单版 (mouse-first)**

- **Click the ground** — walk there.
- **Click a sign / door / mailbox** — walk over and interact.
- **Floating ↑ button** (or `Space` / `↑`) — jump the puddle.
- **SKIP →** (top-right) — jump straight to the works gallery.

**困难版**

- **Drag a hand or foot** (the circles with a dashed ring) onto a rock hold.
- Keep your body within reach of your grips — overreaching pops holds.
- **← 标题** returns to the title; **SKIP →** opens the works gallery.

## Run

```bash
npm install
npm run dev      # dev server
npm run build    # production build to dist/
npm run preview  # preview the build
```

## Structure

```
index.html              entry — fonts + the #wobble SVG filter defs
src/
  main.jsx              React root
  index.css             all styles (type system, animations)
  App.jsx               mode router: title → simple / hard
  WalkGame.jsx          简单版 — the side-scrolling walk
  ClimbGame.jsx         困难版 — the physics climbing wall
  world/
    data.js             walk-world dimensions, terrain, STOPS, WORKS
    climbData.js        climbing wall — HOLDS, LEDGES, plaques
    Char.jsx            walk character + cat sprites
    Climber.jsx         climber sprite (torso + 4 draggable limbs)
    Background.jsx      sky, sun/moon, hills, ground, clouds, trees, birds
    StopMarker.jsx      per-stop scenery
  components/
    TitleScreen.jsx     pick 简单版 / 困难版
    Dialog.jsx          speech bubble
    WorkModal.jsx       work detail modal with mini product preview
    Overlay.jsx         generic content overlay (about/notes/doodle/contact)
    HUD.jsx             walk HUD — progress bar + interact prompt
    Gallery.jsx         skip-the-game works gallery (shared)
```

## How the climb works

`ClimbGame.jsx` runs a small physics simulation each frame:

- The torso is a point pulled down by gravity.
- Each **gripped limb** is a spring anchored to a hold — when stretched past its
  rest length it pulls the torso toward the hold, so your grips hold you up.
- A position-constraint pass stops a limb exceeding its max reach; if it still
  can't be satisfied (you overreached), that grip **slips off**.
- With zero grips you fall, and `LEDGES` act as checkpoints that catch you.

The numbers up top of `ClimbGame.jsx` (`GRAV`, `STIFF`, `REACH`, `DAMP`, …) are
the difficulty knobs. `climbData.js` defines the wall, route, and ledges.

## Notes on the handoff

- The prototype's two parallel `<script type="text/babel">` blocks were split
  into ES modules; the `window` global bridge between them became imports.
- The prototype source carried earlier-iteration dead code the final design no
  longer used — standalone `FocusGame` / `MoodGame` mini-games and a full-screen
  end screen (superseded by the in-world achievement card) — left out to keep
  the project to the design's actual output.
- The `STORY_THOUGHTS` data + thought-bubble renderer existed in the prototype
  but their firing logic had been lost in an editing mishap (see the chat
  transcript). It is wired up in `WalkGame.jsx` so the storyline thoughts appear.
- `心情唱片` calls an injected `window.claude.complete` if present, else falls
  back to a local title list — outside the design tool that global doesn't
  exist, so it always uses the fallback.
- The title screen and 困难版 climbing mode are an extension beyond the original
  `My World.html` design, built in the same hand-drawn style.
```
