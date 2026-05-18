/* My World — world data, terrain, and shared constants */

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
export const STOPS = [
  { id: "start",   x: 180,  type: "start",   label: "起点 · the start" },
  { id: "knock",   x: 820,  type: "knock",   label: "敲门 · knock knock" },
  { id: "about",   x: 1380, type: "about",   label: "about · 关于" },
  { id: "puddle",  x: 1980, type: "puddle",  label: "水坑 · 小心点" },
  { id: "focus",   x: 2560, type: "work",    workId: "focus",  label: "专注圈" },
  { id: "notes",   x: 3200, type: "notes",   label: "邮筒 · 一些想法" },
  { id: "lantern", x: 3760, type: "lantern", label: "灯 · 点亮一盏" },
  { id: "mood",    x: 4280, type: "work",    workId: "mood",   label: "心情唱片" },
  { id: "doodle",  x: 4900, type: "doodle",  label: "涂鸦墙 · 小实验" },
  { id: "contact", x: 5460, type: "contact", label: "信箱 · 给我写信" },
  { id: "soon",    x: 6000, type: "soon",    label: "空山丘 · 下一件" },
  { id: "peak",    x: 6520, type: "peak",    label: "终点 · 通关" },
];

export const WORKS = {
  focus: {
    name: "专注圈",
    en: "Focus.",
    tag: "AI 番茄钟",
    color: "#cfe0c6",
    bg: "radial-gradient(circle at 50% 50%, #cfe0c6 0%, #fffdf6 70%)",
    intro: "一个让你不分心的小工具 — 静而后能定。",
    body: [
      "我做的第一个产品。",
      "用 AI 帮你判断要专注的事，",
      "把番茄钟做成一片柔软的光晕，",
      "结束后留下一行你能看见的轨迹。",
    ],
    cta: "试一试 →",
  },
  mood: {
    name: "心情唱片",
    en: "Moodtune",
    tag: "AI 音乐网页",
    color: "#d97757",
    bg: "radial-gradient(circle at 50% 40%, #d97757 0%, #2a1a14 80%)",
    intro: "调研你今天的心情 → 生成一张专属唱片。",
    body: [
      "AI 网页。",
      "问你 3 个关于今天的问题，",
      "再根据天气、时间和心情，",
      "为你生成 1 张唱片、1 句 DJ 的话。",
    ],
    cta: "听一首 →",
  },
};

// Notes content (a couple short thoughts)
export const NOTES = [
  { date: "5/12", text: "今天北京下了一场雨。\n下雨天最适合写代码。" },
  { date: "5/05", text: "做完一件作品的时刻，\n比开始时安静得多。" },
  { date: "4/28", text: "我喜欢「专注」\n胜过「高效」。" },
];

// Tiny experiments wall
export const DOODLES = [
  { name: "小猫追光机", note: "css-only" },
  { name: "心情天气", note: "3 行代码" },
  { name: "字母重力场", note: "type plays" },
  { name: "夜里的钟", note: "晚 11 点变成蓝色" },
  { name: "纸鹤生成器", note: "svg + random" },
  { name: "?", note: "在画" },
];

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
  { id: "morn",  range: [380, 600],   text: "天气不错，出门走走 ☀" },
  { id: "after", range: [1100, 1300], text: "做东西就像盖房子 …" },
  { id: "abt",   range: [1550, 1750], text: "继续往前。" },
  { id: "wet",   range: [2200, 2400], text: "鞋好像有点湿 :) " },
  { id: "1stwk", range: [2800, 3000], text: "第一个作品做完那天，安静得很。" },
  { id: "lant",  range: [3400, 3600], text: "天慢慢黑了。" },
  { id: "night", range: [4500, 4700], text: "晚上的世界更小、更近。" },
  { id: "next",  range: [5700, 5900], text: "终点在前面了。" },
  { id: "peak",  range: [6200, 6400], text: "走到终点啦 ✦" },
];

// Time of day from world x
export function timeFor(x) {
  if (x < 3000) return "day";
  if (x < 3800) return "dusk";
  return "night";
}
