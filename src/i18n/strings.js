/* My World — i18n string table.
 *
 * Each key maps to { zh, en }. Add new keys here as more of the UI gets
 * translated; consumers read them through the `t()` helper in lang.jsx.
 * Chinese stays the source of truth — `en` is the added layer.
 */
export const STRINGS = {
  // Language toggle (shown in the HUD)
  'lang.zh': { zh: '中', en: '中' },
  'lang.en': { zh: 'EN', en: 'EN' },

  // Top HUD + interact prompt
  'prompt.tap':     { zh: '点', en: 'tap' },
  'prompt.knock':   { zh: '敲门', en: 'knock' },
  'prompt.about':   { zh: '看看', en: 'look' },
  'prompt.work':    { zh: '进入', en: 'enter' },
  'prompt.notes':   { zh: '翻翻', en: 'read' },
  'prompt.lantern': { zh: '点灯', en: 'light it' },
  'prompt.doodle':  { zh: '看看', en: 'look' },
  'prompt.contact': { zh: '写信', en: 'write' },
  'prompt.peak':    { zh: '到终点', en: 'finish' },

  // Scenery markers along the path (StopMarker.jsx)
  'marker.goRight':    { zh: '↘ 往右走', en: '↘ this way' },
  'marker.about':      { zh: '关于', en: 'About' },
  'marker.aboutSub':   { zh: '点一下了解我', en: 'tap to know me' },
  'marker.jump':       { zh: '跳一下 ✦', en: 'hop over ✦' },
  'marker.tapMe':      { zh: '↑ 点一下', en: '↑ tap' },
  'marker.notesFlip':  { zh: '↓ 翻翻', en: '↓ read' },
  'marker.lightIt':    { zh: '↓ 点亮它', en: '↓ light it' },
  'marker.writeMe':    { zh: '给我写信 ✉︎', en: 'write to me ✉︎' },

  // Work detail modal (WorkModal.jsx) + work gallery (Gallery.jsx)
  'wm.focusPreview': { zh: '专注中 · 写代码', en: 'focusing · coding' },
  'wm.moodRecord':   { zh: '夜里的湖', en: 'Lake at Night' },
  'wm.collapseDemo': { zh: '✕ 收起演示', en: '✕ Hide demo' },
  'wm.openDemo':     { zh: '▶︎ 小演示', en: '▶︎ Mini demo' },
  'wm.learnMore':    { zh: '详细了解 →', en: 'Learn more →' },
  'wm.keepWalking':  { zh: '继续走', en: 'Keep walking' },
  'gallery.demo':       { zh: '演示', en: 'demo' },
  'gallery.allWorks':   { zh: '全部作品', en: 'all works' },
  'gallery.skipIntro':  { zh: '跳过散步直接看 :)', en: 'Skip the walk, just browse :)' },
  'gallery.close':      { zh: '关闭', en: 'Close' },
  'gallery.backToWalk': { zh: '← 还是想走一遍', en: '← walk it after all' },

  // Shared bits
  'common.sound': { zh: '声音', en: 'Sound' },
  'common.mute':  { zh: '静音', en: 'Muted' },

  // Walk game chrome (WalkGame.jsx)
  'cat.meow':  { zh: '喵', en: 'meow' },
  'cat.zz':    { zh: 'z z', en: 'z z' },
  'walk.leftEdge': {
    zh: '往右走哦 →\n左边开发中,可以留言告诉我还想玩啥 (=^▽^=)',
    en: "Go right →\nThe left side's still in progress — leave a note on what you'd like (=^▽^=)",
  },
  'walk.howto':    { zh: '? 怎么玩', en: '? How to play' },
  'walk.roomBtn':  { zh: '房间版 →', en: 'Room version →' },
  // end card
  'walk.end':         { zh: '终点', en: 'the end' },
  'walk.complete':    { zh: '通关 ✦', en: 'Complete ✦' },
  'walk.endSub':      { zh: '你走完了 my world', en: 'You walked through my world' },
  'walk.allStars':    { zh: '今晚的星星都亮了 ✦', en: "All of tonight's stars are lit ✦" },
  'walk.statStops':   { zh: '停靠点', en: 'Stops' },
  'walk.statStars':   { zh: '捡到的星', en: 'Stars' },
  'walk.statTime':    { zh: '花的时间', en: 'Time' },
  'walk.statPlays':   { zh: '通关次数', en: 'Plays' },
  'walk.replay':      { zh: '↺ 再走一遍', en: '↺ Walk again' },
  'walk.seeWorks':    { zh: '看作品', en: 'See works' },
  'walk.endRoom':     { zh: '没玩够? 回 Arden 家再看看 →', en: "Want more? Visit Arden's room →" },
  'walk.dragJump':    { zh: '拖我·跳', en: 'drag·jump' },
  // start hint
  'walk.hintMobile':     { zh: '点屏幕往那边走 ✦', en: 'Tap the screen to walk ✦' },
  'walk.hintDesktop':    { zh: '点屏幕走,或按 ← → 键 ✦', en: 'Tap to walk, or use ← → keys ✦' },
  'walk.hintMobileSub':  { zh: '点招牌互动 · 点 ↑ 按钮 = 前进跳', en: 'Tap signs to interact · ↑ = jump forward' },
  'walk.hintDesktopSub': { zh: '← → = 走路 · 空格 = 跳 · 点招牌互动', en: '← → = walk · Space = jump · tap signs' },
  // tutorial
  'walk.tutLeft':  { zh: '点这边 · 往左走', en: 'Tap here · go left' },
  'walk.tutRight': { zh: '点这边 · 往右走', en: 'Tap here · go right' },
  'walk.tutGotIt': { zh: '知道了 ✦', en: 'Got it ✦' },
  // intro card
  'walk.introTitle':  { zh: '散步 60 秒 ✦', en: 'A 60-second stroll ✦' },
  'walk.introBody1':  { zh: '往右走一段路 — 路上都是 Arden 做的东西。', en: 'Walk to the right — the road is full of things Arden made.' },
  'walk.introBody2':  { zh: '想换个玩法?也可以去 Arden 家的房间逛逛。', en: "Want a different mode? Visit Arden's room too." },
  'walk.introStroll': { zh: '出门散个步 →', en: 'Go for a stroll →' },
  'walk.introRoom':   { zh: '去 Arden 家逛逛', en: "Visit Arden's room" },
  'walk.introWorks':  { zh: '直接看作品', en: 'Skip to the works' },
  // lantern dialog
  'lantern.0': { zh: '天黑了。', en: "It's dark now." },
  'lantern.1': { zh: '灯笼是路上最温柔的东西 ✦', en: 'A lantern is the gentlest thing on the road ✦' },
  'lantern.2': {
    zh: '以前我觉得「效率」最重要 —\n后来发现，慢一点也没什么不好。',
    en: 'I used to think “efficiency” mattered most —\nthen I found slowing down isn’t so bad.',
  },
  // about overlay
  'walk.aboutTitle': { zh: '关于', en: 'About' },
  'walk.notesTitle': { zh: '一些想法', en: 'Some thoughts' },
  'walk.tagExploring': { zh: '在探索', en: 'exploring' },
  'walk.tagTools':     { zh: '小工具', en: 'small tools' },

  // Showcase iframe peek (ShowcaseFrame.jsx)
  'showcase.backRight': { zh: '点我回去继续走 →', en: 'tap to go back →' },
  'showcase.backLeft':  { zh: '← 点我回去继续走 :)', en: '← tap to go back :)' },

  // Contact card (ContactCard.jsx)
  'contact.title':     { zh: '写信给我', en: 'Write to me' },
  'contact.sentTitle': { zh: '寄出啦', en: 'Sent!' },
  'contact.sentBody1': { zh: '纸飞机已经飞到 Arden 那儿了 —', en: 'Your paper plane reached Arden —' },
  'contact.sentBody2': { zh: '谢谢你写的这两句 :)', en: 'thanks for these few lines :)' },
  'contact.continue':  { zh: '← 继续走', en: '← Keep walking' },
  'contact.prompt':    { zh: '随便说点什么都好 — 想合作、想吐槽、想聊天 :)', en: 'Say anything — collab, feedback, or just chatting :)' },
  'contact.phName':    { zh: '你是谁?(可不填)', en: 'Who are you? (optional)' },
  'contact.phEmail':   { zh: '你的邮箱?(想收到回信就填)', en: 'Your email? (if you want a reply)' },
  'contact.phMsg':     { zh: '写两句…', en: 'Write a line or two…' },
  'contact.errHint':   { zh: '没寄出去 — 再试一次?', en: "Didn't send — try again?" },
  'contact.okHint':    { zh: '会直接寄到 Arden 的邮箱', en: "Goes straight to Arden's inbox" },
  'contact.flying':    { zh: '寄出中…', en: 'Sending…' },
  'contact.send':      { zh: '寄出 →', en: 'Send →' },

  // Room game (RoomGame.jsx)
  'room.label':     { zh: '房间版 · ROOM', en: 'ROOM' },
  'room.climbing':  { zh: '· 攀岩中', en: '· climbing' },
  'room.sleeping':  { zh: '· 睡了 zZ', en: '· asleep zZ' },
  'room.jump':      { zh: '↑ 跳', en: '↑ jump' },
  'room.getDown':   { zh: '↓ 下来', en: '↓ get down' },
  'room.walkVersion': { zh: '← 散步版', en: '← Walk mode' },
  'room.summitWord': { zh: '登顶', en: 'summit' },
  'room.summit':    { zh: '登顶 ✦', en: 'Summit ✦' },
  'room.wakeMobile':  { zh: '点一下屏幕起床', en: 'Tap the screen to get up' },
  'room.wakeDesktop': { zh: '点一下 / 按空格起床', en: 'Tap / press Space to get up' },
  'room.hintMain':  { zh: '走到东西旁边 — 都能玩 ✦', en: 'Walk up to anything — it all plays ✦' },
  'room.hintList':  {
    zh: '窗边灵感罐·攀岩·床上掌机·鱼缸·书桌闹钟·书架·涂鸦墙·唱片机·关于我·信鸽',
    en: 'spark jar·climbing wall·handheld·fish tank·desk clock·bookshelf·doodle wall·record player·about me·pigeon',
  },
  'room.ctrlMobile':  { zh: '点屏幕走 · 点黑气泡互动 · 点 ↑跳 · 右上 SKIP 看作品', en: 'Tap to walk · tap black bubbles · ↑ jump · SKIP (top-right) for works' },
  'room.ctrlDesktop': { zh: '← → / A D 走 · W/↑ 跳 · E 互动 · 右上 SKIP 看作品', en: '← → / A D walk · W/↑ jump · E interact · SKIP (top-right) for works' },
  'room.backToRoom': { zh: '← 回房间走走', en: '← back to the room' },
  'room.backInside': { zh: '← 回屋里', en: '← back inside' },
  // bookshelf overlay
  'room.bookTitle':   { zh: '翻一页', en: 'Turn a page' },
  'room.shelfWord':   { zh: '书架', en: 'bookshelf' },
  'room.anotherBook': { zh: '↺ 再翻一本', en: '↺ Another one' },
  // about overlay
  'room.aboutTitle': { zh: '关于我', en: 'About me' },
  'room.aboutSub':   { zh: '自我介绍', en: 'intro' },
  // outdoor overlay
  'room.outdoorTitle': { zh: '去野外攀岩', en: 'Outdoor climbing' },
  'room.outdoorSub':   { zh: '施工中', en: 'under construction' },
  'room.outdoorBody1': { zh: '锁扣还在拧 — 改天再来 ✿', en: "Still bolting the carabiners — come back another day ✿" },
  'room.outdoorBody2': { zh: '想去爬墙? 屋里就有一面手绘的 ↓', en: 'Want to climb? There’s a hand-drawn wall right inside ↓' },
  'room.outdoorClimb': { zh: '野外攀岩 →', en: 'Outdoor climb →' },

  // Doodle wall toys (DoodleWall.jsx)
  'dw.clear': { zh: '清空', en: 'Clear' },
  'dw.wallTitle': { zh: '涂鸦墙', en: 'Doodle wall' },
  'dw.subPlay': { zh: '玩玩看', en: 'have a play' },
  'dw.subExp':  { zh: '小实验', en: 'little experiments' },
  'dw.backWall': { zh: '← 涂鸦墙', en: '← Doodle wall' },
  'dw.wallIntro': { zh: '一些 30 分钟以内能做完的小东西。点一个 — 它们都能真的玩。', en: 'Little things each made in under 30 minutes. Tap one — they all really play.' },
  'dw.play': { zh: '玩 →', en: 'Play →' },
  // cat
  'dw.catHintTouch': { zh: '在屏幕上划一下 — 小猫会追那点光 ✦', en: 'Swipe the screen — the cat chases that light ✦' },
  'dw.catHintMouse': { zh: '动动鼠标 — 小猫会追那点光 ✦', en: 'Move your mouse — the cat chases that light ✦' },
  'dw.catCaption':   { zh: '一只 svg 小猫,和一点跑来跑去的光 — 它永远追不上,但永远在追。', en: 'An SVG cat and a darting dot of light — it never catches up, but never stops chasing.' },
  // weather
  'dw.wSun':   { zh: '晴', en: 'Sun' },
  'dw.wCloud': { zh: '阴', en: 'Cloud' },
  'dw.wRain':  { zh: '雨', en: 'Rain' },
  'dw.wSnow':  { zh: '雪', en: 'Snow' },
  'dw.weatherCaption': { zh: '点一种天气 — 整片小天空,连同雨雪都跟着变。', en: 'Pick a weather — the whole little sky, rain and snow included, shifts with it.' },
  // letters
  'dw.lettersHandful': { zh: 'ARDEN好玩✦', en: 'ARDENFUN✦' },
  'dw.lettersAria':    { zh: '打字', en: 'type' },
  'dw.lettersHint':    { zh: '打字试试 — 字母会掉下来 ✦', en: 'Try typing — the letters fall ✦' },
  'dw.lettersToss':    { zh: '撒一把 →', en: 'Toss a handful →' },
  'dw.lettersOr':      { zh: '或直接打字 / 点框里', en: 'or just type / click the box' },
  'dw.lettersCaption': { zh: '每个字母都有重量 — 打出来,看它们落下、回弹、堆起来。', en: 'Every letter has weight — type them, watch them fall, bounce and pile up.' },
  // night clock
  'dw.clockNight': { zh: '夜里了 — 钟变蓝了', en: 'Night — the clock turned blue' },
  'dw.clockDay':   { zh: '白天', en: 'Daytime' },
  'dw.clockNow':   { zh: '回到现在', en: 'Back to now' },
  'dw.clockCaption': { zh: '滑到晚上 11 点 — 看这只钟自己睡过去,变成一片夜的蓝色。', en: 'Slide to 11pm — watch the clock drift to sleep and turn the blue of night.' },
  // crane
  'dw.craneHint':  { zh: '按下面的按钮 — 折一只纸鹤 ✦', en: 'Press the button below — fold a paper crane ✦' },
  'dw.craneFold':  { zh: '折一只 →', en: 'Fold one →' },
  'dw.craneAway':  { zh: '收起来', en: 'Put away' },
  'dw.craneCaption': { zh: '颜色、角度、大小全是随机的 — 折一百只,也不会有两只一样。', en: 'Color, angle and size all random — fold a hundred and no two will match.' },
  // collage
  'dw.collageNext':    { zh: '换一张 →', en: 'Another →' },
  'dw.collageCaption': { zh: '我不会画画 — 所以写了这个,让它替我画。每一张都不重样。', en: "I can't draw — so I wrote this to draw for me. Every one is different." },
  // piano
  'dw.pianoPlay':    { zh: '来一段 ♪', en: 'Play a bit ♪' },
  'dw.pianoOr':      { zh: '或自己点琴键', en: 'or tap the keys yourself' },
  'dw.pianoCaption': { zh: '八个键、八个音 — 弹什么都行。最普通的小事最好玩。', en: 'Eight keys, eight notes — play anything. The plainest little things are the most fun.' },
  // bubbles
  'dw.bubbleHint':    { zh: '点泡泡 — 戳破它 ✦', en: 'Tap the bubbles — pop them ✦' },
  'dw.bubbleCapA':    { zh: '戳破了 ', en: 'Popped ' },
  'dw.bubbleCapB':    { zh: ' 个 — 都是空的,可是听见啵的一声还是很好玩。', en: ' — all empty, but that little pop is still fun.' },
  // mystery box
  'dw.boxOpen':    { zh: '拆一个 →', en: 'Open one →' },
  'dw.boxAnother': { zh: '↺ 再来一个', en: '↺ Another' },
  'dw.boxCaption': { zh: '抽到的不重样 — 一共十多种, 全是手绘的小礼物', en: 'Each draw is different — a dozen-plus hand-drawn little gifts' },
  'dw.boxCount':   { zh: ' · 你拆了 ', en: ' · opened ' },
  'dw.boxTimes':   { zh: ' 次', en: ' times' },
  // tea
  'dw.teaHint':    { zh: '点茶杯泡一下 ✦', en: 'Tap the cup to steep ✦' },
  'dw.teaReady':   { zh: '泡得正好', en: 'Steeped just right' },
  'dw.teaMore':    { zh: '再泡一下 ↓', en: 'Steep more ↓' },
  'dw.teaRestart': { zh: '倒了重来', en: 'Pour & restart' },
  'dw.teaTap':     { zh: '点茶杯', en: 'Tap the cup' },
  'dw.teaSip':     { zh: '慢慢喝 ✦', en: 'Sip slowly ✦' },
  'dw.teaCaption': { zh: '淡到浓 — 一杯茶要泡几次, 看你自己。', en: 'Light to strong — how many steeps a cup takes is up to you.' },
  // flowers
  'dw.flowerHint':    { zh: '点土里 — 给我种一朵 ✦', en: 'Tap the soil — grow me a flower ✦' },
  'dw.flowerCaption': { zh: '颜色、瓣数都随机 — 一整片小野花,谁也不一样。', en: 'Color and petal count random — a whole patch of wildflowers, no two alike.' },
  // sketch
  'dw.sketchHintTouch': { zh: '用手指画 — 想画啥画啥', en: 'Draw with your finger — whatever you like' },
  'dw.sketchHintMouse': { zh: '用鼠标画 — 想画啥画啥', en: 'Draw with your mouse — whatever you like' },
  'dw.sketchBlank':     { zh: '一张白纸', en: 'A blank page' },
  'dw.sketchCaption':   { zh: '一张白纸 — 想画的、写的、随便画。糟一点也没关系。', en: "A blank page — draw, write, whatever. It's fine if it's messy." },

  // Work demos (WorkDemo.jsx)
  'wd.selected':  { zh: '已选', en: 'Selected' },
  'wd.atLeast2':  { zh: '· 至少 2 个', en: '· at least 2' },
  // focus demo
  'wd.focusStart':  { zh: '开始专注 ✦', en: 'Start focus ✦' },
  'wd.focusPause':  { zh: '暂停', en: 'Pause' },
  'wd.focusDone':   { zh: '完成 ✦', en: 'Done ✦' },
  'wd.focusResume': { zh: '继续', en: 'Resume' },
  'wd.focusAgain':  { zh: '再专注一次', en: 'Focus again' },
  'wd.focusHint':   { zh: '番茄钟是一片会呼吸的光晕 — 专注绿 · 暂停紫 · 完成橙。', en: 'The timer is a breathing halo — green focus · purple pause · orange done.' },
  'wd.focusTraces': { zh: '今天的轨迹', en: "Today's traces" },
  // mood demo
  'wd.moodReshuffle': { zh: '↻ 换一批', en: '↻ Reshuffle' },
  'wd.moodLoading':   { zh: 'AI DJ 正在听你的夜晚…', en: 'The AI DJ is listening to your night…' },
  'wd.moodPrompt':    { zh: '今晚的你,听起来是什么样子?挑 1–3 个心情。', en: 'What do you sound like tonight? Pick 1–3 moods.' },
  'wd.moodPress':     { zh: '为我压一张唱片 →', en: 'Press me a record →' },
  // cafe demo
  'wd.truth':      { zh: '真相 · TRUTH', en: 'TRUTH' },
  'wd.misread':    { zh: '2077 误读 · MISREAD', en: '2077 MISREAD' },
  'wd.cafeFlipBack':  { zh: '↺ 点一下，看考古队当初怎么读的', en: '↺ tap to see how the dig team first read it' },
  'wd.cafeFlipFront': { zh: '👆 点一下翻面 · 看真相', en: '👆 tap to flip · see the truth' },
  'wd.cafeNext':   { zh: '下一件遗物 →', en: 'Next relic →' },
  'wd.cafeFull1':  { zh: '完整版里，这些遗物串成一条解谜链 ——', en: 'In the full version these relics form a puzzle chain ——' },
  'wd.cafeFull2':  { zh: '最后读出 2012 那份被当成故障的预警。', en: 'and you finally read the 2012 warning taken for a glitch.' },
  // spark demo
  'wd.sparkAgain':    { zh: '↻ 再撞一次', en: '↻ Collide again' },
  'wd.sparkNewBatch': { zh: '换一批碎片', en: 'New fragments' },
  'wd.sparkFull':     { zh: '完整版里这一步交给 AI，还能接着把它聊成可落地的方案。', en: 'In the full version AI handles this step, then talks it into a workable plan.' },
  'wd.sparkShaking':  { zh: '摇一摇，让碎片互相撞一撞…', en: 'Shaking — letting the fragments collide…' },
  'wd.sparkPrompt':   { zh: '往灵感罐里挑 2–3 个碎片，再摇一摇。', en: 'Pick 2–3 fragments for the jar, then shake.' },
  'wd.sparkShake':    { zh: '摇一摇 →', en: 'Shake it →' },

  // Opening dialog (the "knock knock" intro — Arden greets you)
  'knock.0': {
    zh: '诶 — 你来啦 :)',
    en: 'Oh — you made it :)',
  },
  'knock.1': {
    zh: '我是 Arden。\n这是我做的小世界 — my world。',
    en: "I'm Arden.\nThis is the little world I made — my world.",
  },
  'knock.2': {
    zh: '前面有几件我做的东西，\n几个停靠点，还有藏起来的小玩意儿 ✦',
    en: 'Ahead are a few things I made,\na few stops, and little hidden toys ✦',
  },
  'knock.3': {
    zh: '天会慢慢黑下来，但路上一直有灯 ✿\n随便逛 — 点招牌就能聊聊 :)',
    en: "The sky slowly darkens, but there's always a light ✿\nWander freely — tap a sign to chat :)",
  },
};
