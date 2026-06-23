/* My World — world data, terrain, and shared constants */

// ============================================================
// Live deployments of the two newest works
// ============================================================
// These two are full apps, not static showcase pages — they live at their own
// Vercel deployments and load inside the showcase iframe / intro page.
//   · The 网吧考古学家 game is iframed directly (it's playable as-is).
//   · The 灵感搜集器 link is used by the "去玩完整版 →" button inside
//     public/inspiration-showcase.html (kept in sync there).
export const CAFE_GAME_URL = "https://game-alpha-eight-47.vercel.app";
export const SPARK_LIVE_URL = "https://inspriation.vercel.app";

// ============================================================
// World dimensions & terrain
// ============================================================
export const WORLD_WIDTH = 6800;
export const GROUND_Y = 130;       // baseline height of ground band
export const GROUND_LIFT_MAX = 80; // max additional undulation

// Smooth pseudo-random terrain. Bigger ridges then smaller bumps.
export function groundLift(x) {
  return (
    Math.sin(x / 540) * 46 +
    Math.sin(x / 240 + 1.3) * 18 +
    Math.cos(x / 110 + 0.7) * 8 +
    50 // raise base so curve sits above ground band
  );
}

// ============================================================
// Stops along the path
// ============================================================
// Works are spread across the day→night arc by theme, not by recency:
// 专注圈(浅绿) & 灵感搜集器(暖黄) sit in daylight, 心情唱片(夜曲) at dusk,
// 网吧考古学家(暗色废墟) in full night. Keeps any one stretch from crowding.
export const STOPS = [
  { id: "start",   x: 180,  type: "start",   label: "起点 · the start" },
  { id: "knock",   x: 760,  type: "knock",   label: "敲门 · knock knock" },
  { id: "about",   x: 1280, type: "about",   label: "about · 关于" },
  { id: "focus",   x: 1820, type: "work",    workId: "focus",  label: "专注圈" },
  { id: "puddle",  x: 2360, type: "puddle",  label: "水坑 · 小心点" },
  { id: "spark",   x: 2880, type: "work",    workId: "spark",  label: "灵感搜集器" },
  { id: "notes",   x: 3380, type: "notes",   label: "邮筒 · 一些想法" },
  { id: "mood",    x: 3920, type: "work",    workId: "mood",   label: "心情唱片" },
  { id: "doodle",  x: 4440, type: "doodle",  label: "涂鸦墙 · 小实验" },
  { id: "lantern", x: 4980, type: "lantern", label: "灯 · 点亮一盏" },
  { id: "cafe",    x: 5520, type: "work",    workId: "cafe",   label: "网吧考古学家" },
  { id: "contact", x: 6040, type: "contact", label: "信箱 · 给我写信" },
  { id: "peak",    x: 6520, type: "peak",    label: "终点 · 通关" },
];

export const WORKS = {
  focus: {
    name: "专注圈",
    en: "Focus.",
    tag: { zh: "AI 番茄钟", en: "AI Pomodoro timer" },
    color: "#cfe0c6",
    bg: "radial-gradient(circle at 50% 50%, #cfe0c6 0%, #fffdf6 70%)",
    sign: "#fef3a3", signInk: "#1b1b1b",
    showcase: "/focus-circle-showcase.html",
    intro: {
      zh: "一个让你不分心的小工具 — 静而后能定。",
      en: "A little tool that keeps you undistracted — stillness, then focus.",
    },
    body: {
      zh: [
        "我做的第一个产品。",
        "用 AI 帮你判断要专注的事，",
        "把番茄钟做成一片柔软的光晕，",
        "结束后留下一行你能看见的轨迹。",
      ],
      en: [
        "The first product I built.",
        "AI helps you decide what to focus on,",
        "the timer becomes a soft halo of light,",
        "and leaves a trace you can see when you're done.",
      ],
    },
    cta: { zh: "试一试 →", en: "Try it →" },
  },
  mood: {
    name: "心情唱片",
    en: "Moodtune",
    tag: { zh: "AI 音乐网页", en: "AI music webpage" },
    color: "#d97757",
    bg: "radial-gradient(circle at 50% 40%, #d97757 0%, #2a1a14 80%)",
    sign: "#d97757", signInk: "#fffdf6",
    showcase: "/moodtune-showcase.html",
    intro: {
      zh: "调研你今天的心情 → 生成一张专属唱片。",
      en: "Survey your mood today → generate a record made just for you.",
    },
    body: {
      zh: [
        "AI 网页。",
        "问你 3 个关于今天的问题，",
        "再根据天气、时间和心情，",
        "为你生成 1 张唱片、1 句 DJ 的话。",
      ],
      en: [
        "An AI webpage.",
        "Asks you 3 questions about your day,",
        "then from the weather, time and mood",
        "makes you 1 record and 1 line from the DJ.",
      ],
    },
    cta: { zh: "听一首 →", en: "Play one →" },
  },
  cafe: {
    name: "网吧考古学家",
    en: "The Net Café",
    tag: { zh: "点击解谜 · 考古叙事", en: "Click puzzles · archaeology" },
    color: "#5b7a8c",
    bg: "radial-gradient(circle at 50% 38%, #2b3742 0%, #0a0d12 82%)",
    sign: "#2b3742", signInk: "#e8eef2",
    showcase: CAFE_GAME_URL, // live deploy — iframed directly, it's playable as-is
    intro: {
      zh: "末世多年后，考古队走进一座 21 世纪的网吧遗迹。",
      en: "Years after the end, a dig team enters the ruins of a 21st-century net café.",
    },
    body: {
      zh: [
        "固定镜头点击解谜。",
        "捡代币、刷会员卡、唤醒 17 号机，",
        "把旧网吧重新解释成一张互助网络，",
        "最后读出那份被当成故障的预警。",
      ],
      en: [
        "Fixed-camera click puzzles.",
        "Grab tokens, swipe a member card, wake machine 17,",
        "reread the old café as a network of mutual aid,",
        "and finally read the warning everyone took for a glitch.",
      ],
    },
    cta: { zh: "进去考古 →", en: "Start digging →" },
  },
  spark: {
    name: "灵感搜集器",
    en: "Spark Jar",
    tag: { zh: "AI 灵感碰撞 · 与 Vesper 合作", en: "AI idea collisions · with Vesper" },
    color: "#f0b860",
    bg: "radial-gradient(circle at 50% 40%, #f6cd7d 0%, #fff7e6 76%)",
    sign: "#f3c069", signInk: "#1b1b1b",
    showcase: "/inspiration-showcase.html", // intro page → links out to the live app
    intro: {
      zh: "把零散的灵感摇一摇，让 AI 碰撞出新点子。",
      en: "Shake your scattered sparks and let AI collide them into new ideas.",
    },
    body: {
      zh: [
        "和搭档 Vesper 一起做的。",
        "平时攒下的灵感碎片丢进玻璃罐，",
        "摇一摇，AI 抽两三条撞成一个新产品，",
        "再接着聊，把一句话聊成能落地的方案。",
      ],
      en: [
        "Made together with my partner Vesper.",
        "Toss the spark fragments you've saved into a glass jar,",
        "shake it, AI pulls a few and collides them into a new product,",
        "then keep talking — turn a sentence into a workable plan.",
      ],
    },
    cta: { zh: "摇一摇 →", en: "Shake it →" },
  },
};

// Notes content (a couple short thoughts)
export const NOTES = [
  { date: "5/12", text: { zh: "今天北京下了一场雨。\n下雨天适合吃火锅。", en: "It rained in Beijing today.\nRainy days are made for hotpot." } },
  { date: "5/05", text: { zh: "去攀岩攻克零条难度，\nemo中(T＿T)", en: "Went bouldering, tried a beginner route,\nfeeling down (T＿T)" } },
  { date: "4/28", text: { zh: "我喜欢「专注」\n胜过「高效」。", en: "I like “focus”\nmore than “efficiency”." } },
];

// Tiny experiments wall — every one is a real, playable toy (see DoodleWall.jsx)
// Two sets so the walk's wall and the room's wall don't overlap.
export const DOODLES_WALK = [
  { id: "cat",     name: { zh: "小猫追光机",   en: "Light-chasing cat" }, note: { zh: "动动鼠标",     en: "move your mouse" } },
  { id: "weather", name: { zh: "心情天气",     en: "Mood weather" },      note: { zh: "点一种天气",   en: "pick a weather" } },
  { id: "letters", name: { zh: "字母重力场",   en: "Letter gravity" },    note: { zh: "打字玩",       en: "type to play" } },
  { id: "clock",   name: { zh: "夜里的钟",     en: "Night clock" },       note: { zh: "拖到晚 11 点", en: "drag to 11pm" } },
  { id: "crane",   name: { zh: "纸鹤生成器",   en: "Paper crane maker" }, note: { zh: "折一只",       en: "fold one" } },
  { id: "collage", name: { zh: "拼贴画生成器", en: "Collage maker" },     note: { zh: "我不会画 · 它会", en: "I can't draw · it can" } },
];
export const DOODLES_ROOM = [
  { id: "piano",   name: { zh: "小钢琴",     en: "Tiny piano" },   note: { zh: "弹一段调",     en: "play a tune" } },
  { id: "bubble",  name: { zh: "肥皂泡",     en: "Soap bubbles" }, note: { zh: "戳破它",       en: "pop them" } },
  { id: "gift",    name: { zh: "小盲盒",     en: "Blind box" },    note: { zh: "拆一个 ✦",     en: "open one ✦" } },
  { id: "tea",     name: { zh: "泡杯茶",     en: "Brew tea" },     note: { zh: "点茶杯泡一下", en: "tap the cup" } },
  { id: "flower",  name: { zh: "种花",       en: "Grow flowers" }, note: { zh: "点地上长",     en: "tap the ground" } },
  { id: "sketch",  name: { zh: "画画板",     en: "Sketch pad" },   note: { zh: "随便画",       en: "draw freely" } },
];
// Legacy export — kept so older imports keep working.
export const DOODLES = DOODLES_WALK;

// Tree positions are static — defined once so the click-handler can match them
export const TREE_POSITIONS = (() => {
  const arr = [];
  for (let i = 0; i < 22; i++) {
    const x = (i * 327 + 180) % WORLD_WIDTH;
    if (x < 720 || x > WORLD_WIDTH - 100) continue;
    if (STOPS.some(s => Math.abs(s.x - x) < 200)) continue;
    arr.push({ id: i, x, h: 90 + (i % 3) * 40 });
  }
  return arr;
})();

// ============================================================
// Gameplay constants
// ============================================================
export const WALK_SPEED = 240;
export const JUMP_VEL = 580;
export const GRAVITY = 1700;
export const CHAR_BASE_W = 50;
export const INTERACT_RADIUS = 90;

// Story thoughts: char "thinks" something while passing certain x ranges.
// Each fires once per playthrough; appears briefly above char.
export const STORY_THOUGHTS = [
  { id: "morn",  range: [360, 560],   text: { zh: "天气不错，出门走走 ☀︎", en: "Nice weather — out for a walk ☀︎" } },
  { id: "after", range: [1000, 1200], text: { zh: "做东西就像盖房子 …", en: "Making things is like building a house …" } },
  { id: "abt",   range: [1480, 1680], text: { zh: "继续往前。", en: "Keep going." } },
  { id: "wet",   range: [2180, 2360], text: { zh: "鞋好像有点湿 :) ", en: "My shoes feel a little wet :) " } },
  { id: "warm",  range: [2620, 2820], text: { zh: "白天的东西，暖暖的 ✦", en: "Daytime things, warm ones ✦" } },
  { id: "dusk",  range: [3160, 3360], text: { zh: "天开始慢慢沉下来了。", en: "The sky is slowly sinking." } },
  { id: "lant",  range: [4620, 4820], text: { zh: "天黑了，该点灯了。", en: "It's dark — time to light the lantern." } },
  { id: "night", range: [5160, 5360], text: { zh: "晚上的世界更小、更近。", en: "At night the world feels smaller, closer." } },
  { id: "peak",  range: [6200, 6400], text: { zh: "走到终点啦 ✦", en: "Made it to the end ✦" } },
];

// Time of day, continuous. `skyPhase` returns 0 (full day) → 1 (full night),
// eased so the world drifts through a long, gradual sunset instead of snapping
// between states. Daytime holds for most of the walk; dusk fades in slowly,
// and night (with the moon) only settles near the end.
const DUSK_START = 3200; // the notes stop — the sun begins to descend here
const NIGHT_FULL = 4900; // fully night just before the lantern is lit

export function skyPhase(x) {
  const t = Math.max(0, Math.min(1, (x - DUSK_START) / (NIGHT_FULL - DUSK_START)));
  return t * t * (3 - 2 * t); // smoothstep — gentle at both ends
}

// Discrete label, kept for the HUD readout and the lantern glow.
export function timeFor(x) {
  const p = skyPhase(x);
  if (p < 0.15) return "day";
  if (p < 0.9)  return "dusk";
  return "night";
}
