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
import os from 'os';
import { spawnSync } from 'child_process';

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

const faceCss = (family, weight, srcSlug) =>
  `@font-face {\n` +
  `  font-family: "${family}";\n` +
  `  font-style: normal;\n` +
  `  font-weight: ${weight};\n` +
  `  font-display: swap;\n` +
  `  src: url("/fonts/${srcSlug}.woff2") format("woff2");\n` +
  `}`;

// Legacy UA → Google serves ONE combined font file (no unicode-range
// sharding). A modern UA + `&text=` returns the subset split across ~90
// shard files instead, and grabbing only the first shard silently drops
// almost every glyph once the requested text outgrows one shard — that's
// what broke the new titles. So for CJK we pull the whole font once here
// and subset it ourselves locally (pyftsubset), producing one small woff2.
const LEGACY_UA = 'Mozilla/5.0 (Linux; U; Android 2.3; en-us) AppleWebKit/533.1';
const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'mw-fonts-'));
const unicodesArg = [...want].map(c => `U+${c.codePointAt(0).toString(16).toUpperCase()}`).join(',');

for (const font of FONTS) {
  if (font.cjk) {
    // 1. fetch the full font (single file) via the legacy UA
    const metaRes = await fetch(`https://fonts.googleapis.com/css2?family=${font.css}&display=swap`,
                                { headers: { 'User-Agent': LEGACY_UA } });
    if (!metaRes.ok) throw new Error(`${font.slug}: css ${metaRes.status}`);
    const metaCss = await metaRes.text();
    const family = metaCss.match(/font-family:\s*'([^']+)'/)[1];
    const weight = (metaCss.match(/font-weight:\s*([\d ]+)/) || [, '400'])[1].trim();
    const srcUrl = metaCss.match(/src:\s*url\(([^)]+)\)/)[1];
    const ext = srcUrl.match(/\.(ttf|otf|woff2?|woff)/i)?.[1] || 'ttf';

    const full = Buffer.from(await (await fetch(srcUrl)).arrayBuffer());
    const fullPath = path.join(tmpDir, `${font.slug}.${ext}`);
    fs.writeFileSync(fullPath, full);

    // 2. subset locally to exactly the glyphs the app uses → one woff2
    const outPath = path.join(OUT, `${font.slug}.woff2`);
    const r = spawnSync('python3', [
      '-m', 'fontTools.subset', fullPath,
      `--unicodes=${unicodesArg}`,
      '--flavor=woff2',
      `--output-file=${outPath}`,
      '--no-hinting', '--desubroutinize',
    ], { encoding: 'utf8' });
    if (r.status !== 0) {
      throw new Error(`${font.slug}: pyftsubset failed — is fontTools+brotli installed? ` +
                      `(pip3 install fonttools brotli)\n${r.stderr || r.stdout || r.error}`);
    }
    const bytes = fs.statSync(outPath).size;
    faceLines.push(faceCss(family, weight, font.slug));
    console.log(`  ${font.slug}.woff2  ${(bytes / 1024).toFixed(1)} KB  (from ${(full.length / 1024 / 1024).toFixed(1)} MB full, weight ${weight})`);
  } else {
    // Latin fonts are small and unsharded — take the `latin` subset as one file.
    const res = await fetch(`https://fonts.googleapis.com/css2?family=${font.css}&display=swap`,
                            { headers: { 'User-Agent': UA } });
    if (!res.ok) throw new Error(`${font.slug}: ${res.status} ${res.statusText}`);
    const css = await res.text();
    const blocks = [...css.matchAll(/(?:\/\*\s*([^*]+?)\s*\*\/\s*)?@font-face\s*{([^}]*)}/g)];
    const chosen = blocks.find(b => (b[1] || '').trim() === 'latin') || blocks[0];
    if (!chosen) throw new Error(`${font.slug}: no @font-face in response`);
    const body = chosen[2];
    const weight = (body.match(/font-weight:\s*([\d ]+)/) || [, '400'])[1].trim();
    const family = body.match(/font-family:\s*'([^']+)'/)[1];
    const src = body.match(/src:\s*url\(([^)]+)\)/)[1];

    const woff2 = Buffer.from(await (await fetch(src)).arrayBuffer());
    fs.writeFileSync(path.join(OUT, `${font.slug}.woff2`), woff2);
    faceLines.push(faceCss(family, weight, font.slug));
    console.log(`  ${font.slug}.woff2  ${(woff2.length / 1024).toFixed(1)} KB  (weight ${weight})`);
  }
}

fs.rmSync(tmpDir, { recursive: true, force: true });

fs.writeFileSync(path.join(OUT, 'fonts.css'), faceLines.join('\n\n') + '\n');
console.log(`\nwrote public/fonts/fonts.css (${faceLines.length} faces)`);
