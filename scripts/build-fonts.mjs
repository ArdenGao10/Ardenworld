/* Build self-hosted, subsetted webfonts.
 *
 * Google Fonts (fonts.googleapis.com / fonts.gstatic.com) is blocked in
 * mainland China, so end users there never get the hand-drawn fonts and
 * each OS falls back to its own system face. This script scans the source
 * for every character the app renders, asks Google Fonts for a subset
 * containing exactly those glyphs, and saves the woff2 files into
 * public/fonts/ so the site can serve them itself — reliably, everywhere.
 *
 * Run from the repo root:  node scripts/build-fonts.mjs
 */
import fs from 'fs';
import path from 'path';

const ROOT = path.resolve(import.meta.dirname, '..');
const OUT = path.join(ROOT, 'public', 'fonts');
fs.mkdirSync(OUT, { recursive: true });

// --- 1. collect every character the app can render -----------------------
const exts = ['.jsx', '.js'];
const files = [];
(function walk(d) {
  for (const f of fs.readdirSync(d)) {
    const p = path.join(d, f);
    fs.statSync(p).isDirectory() ? walk(p) : exts.includes(path.extname(p)) && files.push(p);
  }
})(path.join(ROOT, 'src'));

const want = new Set();
for (let c = 0x20; c <= 0x7e; c++) want.add(String.fromCodePoint(c)); // all ASCII
for (const f of files) {
  for (const ch of fs.readFileSync(f, 'utf8')) {
    const c = ch.codePointAt(0);
    if (c >= 0x1f000) continue;       // skip true emoji — never in these fonts
    if (c >= 0x2000 || (c >= 0x80 && c < 0x100)) want.add(ch); // CJK, punctuation, symbols
    else if (c >= 0x3000) want.add(ch);
  }
}
const text = [...want].join('');
console.log(`subset: ${want.size} unique characters`);

// --- 2. fonts to fetch ----------------------------------------------------
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 ' +
           '(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';

// CJK fonts are single-weight; Caveat / JetBrains Mono come back as one
// variable woff2 spanning their whole weight range — so it's one file each.
const FONTS = [
  { css: 'ZCOOL+KuaiLe',   slug: 'zcool-kuaile',  cjk: true  },
  { css: 'ZCOOL+XiaoWei',  slug: 'zcool-xiaowei', cjk: true  },
  { css: 'Ma+Shan+Zheng',  slug: 'ma-shan-zheng', cjk: true  },
  { css: 'Long+Cang',      slug: 'long-cang',     cjk: true  },
  { css: 'Caveat:wght@400..700', slug: 'caveat',  cjk: false },
  { css: 'JetBrains+Mono', slug: 'jetbrains-mono', cjk: false },
];

const faceLines = [];

for (const font of FONTS) {
  const base = `https://fonts.googleapis.com/css2?family=${font.css}&display=swap`;
  const url = font.cjk ? `${base}&text=${encodeURIComponent(text)}` : base;
  const res = await fetch(url, { headers: { 'User-Agent': UA } });
  if (!res.ok) throw new Error(`${font.slug}: ${res.status} ${res.statusText}`);
  const css = await res.text();

  // text= subsets come back with no `/* subset */` comment; Latin fonts get
  // one block per subset — keep `latin`.
  const blocks = [...css.matchAll(/(?:\/\*\s*([^*]+?)\s*\*\/\s*)?@font-face\s*{([^}]*)}/g)];
  const chosen = font.cjk
    ? blocks[0]
    : (blocks.find(b => (b[1] || '').trim() === 'latin') || blocks[0]);
  if (!chosen) throw new Error(`${font.slug}: no @font-face in response`);
  const body = chosen[2];
  const weight = (body.match(/font-weight:\s*([\d ]+)/) || [, '400'])[1].trim();
  const family = body.match(/font-family:\s*'([^']+)'/)[1];
  const src = body.match(/src:\s*url\(([^)]+)\)/)[1];

  const woff2 = Buffer.from(await (await fetch(src)).arrayBuffer());
  fs.writeFileSync(path.join(OUT, `${font.slug}.woff2`), woff2);
  faceLines.push(
    `@font-face {\n` +
    `  font-family: "${family}";\n` +
    `  font-style: normal;\n` +
    `  font-weight: ${weight};\n` +
    `  font-display: swap;\n` +
    `  src: url("/fonts/${font.slug}.woff2") format("woff2");\n` +
    `}`);
  console.log(`  ${font.slug}.woff2  ${(woff2.length / 1024).toFixed(1)} KB  (weight ${weight})`);
}

fs.writeFileSync(path.join(OUT, 'fonts.css'), faceLines.join('\n\n') + '\n');
console.log(`\nwrote public/fonts/fonts.css (${faceLines.length} faces)`);
