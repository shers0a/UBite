#!/usr/bin/env node
/* Builds the UBite mockup site — every surface of the product on one page, plus the live
   prototypes — into dist/ubite-mockup/, ready for `vercel deploy`.

   npm run mockup                     build (screenshots included, ~1 minute)
   MOCKUP_URL=https://x.vercel.app npm run mockup    absolute og:image for link previews

   What it does:
   1. copies the design system's kits and the repo's assets/ into one tree without dot folders
      (ds/ and assets/ side by side) and rewrites the relative asset paths to match;
   2. precompiles the kits' JSX with Babel, so visitors do not download Babel or wait for it;
   3. serves the tree locally and screenshots each screen at 2× with the machine's Chrome/Edge;
   4. fills mockup/index.html (the board) with those screenshots and writes og.png. */
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import { fileURLToPath } from 'node:url';
import * as babel from '@babel/core';
import puppeteer from 'puppeteer-core';
import sharp from 'sharp';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DS = path.join(ROOT, '.claude', 'skills', 'ubite-design');
const OUT = path.join(ROOT, 'dist', 'ubite-mockup');
const rel = (p) => path.relative(ROOT, p).split(path.sep).join('/');

/* ---------- 1. copy ---------- */

// Keep .vercel/ — it links the folder to the Vercel project, so redeploys reuse the same URL.
if (fs.existsSync(OUT)) for (const f of fs.readdirSync(OUT)) if (f !== '.vercel') fs.rmSync(path.join(OUT, f), { recursive: true, force: true });
const copy = (from, to, skip = () => false) => {
  if (skip(from)) return;
  if (fs.statSync(from).isDirectory()) {
    fs.mkdirSync(to, { recursive: true });
    for (const f of fs.readdirSync(from)) copy(path.join(from, f), path.join(to, f), skip);
  } else fs.copyFileSync(from, to);
};
for (const f of ['styles.css', 'tokens', '_ds_bundle.js', 'assets/image-slot.js', 'ui_kits',
  'explorations/illustrations.html', 'explorations/logo-motion.html']) {
  const to = path.join(OUT, 'ds', f);
  fs.mkdirSync(path.dirname(to), { recursive: true });
  copy(path.join(DS, f), to);
}
copy(path.join(ROOT, 'assets'), path.join(OUT, 'assets'),
  (p) => /[\\/]_raw($|[\\/])/.test(p) || p.endsWith('.md') || p.endsWith('lock.json'));

// In the repo the kits sit five folders below assets/ (.claude/skills/ubite-design/ui_kits/x);
// here they sit three below (ds/ui_kits/x). Longest pattern first.
const walk = (d) => fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(path.join(d, e.name)) : [path.join(d, e.name)]));
for (const f of walk(path.join(OUT, 'ds')).filter((f) => /\.(html|jsx?|css)$/.test(f))) {
  const s = fs.readFileSync(f, 'utf8');
  const t = s.split('../../../../../assets/').join('../../../assets/').split('../../../../assets/').join('../../assets/');
  if (t !== s) fs.writeFileSync(f, t);
}

/* ---------- 2. precompile ---------- */

const compile = (code, filename) => babel.transformSync(code, {
  filename, babelrc: false, configFile: false, sourceType: 'script', comments: false,
  presets: [['@babel/preset-react', { runtime: 'classic' }]],
  // Top-level const/let become var: the kits' scripts share one global scope, as they did
  // under Babel standalone.
  plugins: ['@babel/plugin-transform-block-scoping'],
}).code;
for (const html of walk(path.join(OUT, 'ds')).filter((f) => f.endsWith('.html'))) {
  let s = fs.readFileSync(html, 'utf8');
  if (!s.includes('text/babel')) continue;
  s = s.replace(/<script type="text\/babel" src="([^"]+)"><\/script>/g, (_, src) => {
    const file = path.join(path.dirname(html), src);
    const out = file.replace(/\.jsx$/, '.js');
    fs.writeFileSync(out, compile(fs.readFileSync(file, 'utf8'), file));
    fs.rmSync(file);
    return `<script src="${src.replace(/\.jsx$/, '.js')}"></script>`;
  });
  s = s.replace(/<script type="text\/babel">([\s\S]*?)<\/script>/g, (_, code) => `<script>\n${compile(code, html)}\n</script>`);
  s = s.replace(/<script src="https:\/\/unpkg\.com\/@babel\/standalone[^>]*><\/script>\n?/g, '');
  fs.writeFileSync(html, s);
}
console.log(`✓ copied and precompiled → ${rel(OUT)}`);

/* ---------- 3. screenshots ---------- */

const TYPES = { html: 'text/html; charset=utf-8', js: 'text/javascript', css: 'text/css', svg: 'image/svg+xml', png: 'image/png', webp: 'image/webp', jpg: 'image/jpeg', mp4: 'video/mp4', webm: 'video/webm', json: 'application/json' };
const server = http.createServer((req, res) => {
  const p = path.join(OUT, decodeURIComponent(new URL(req.url, 'http://x').pathname));
  if (!p.startsWith(OUT) || !fs.existsSync(p) || fs.statSync(p).isDirectory()) { res.writeHead(404); res.end(); return; }
  res.writeHead(200, { 'Content-Type': TYPES[path.extname(p).slice(1)] || 'application/octet-stream' });
  fs.createReadStream(p).pipe(res);
});
await new Promise((r) => server.listen(0, '127.0.0.1', r));
const BASE = `http://127.0.0.1:${server.address().port}`;

// [file, query, title, caption] — each also links to the live prototype in the same state.
const PHONES = [
  ['onb-1', 'onboarding=1&theme=light', 'Bun venit', 'Trei pași, cu scene desenate pe paleta UBite.'],
  ['home', 'theme=light', 'Acasă', 'Întâi răspunsul: coada în cuvinte și în minute, cu vârsta estimării.'],
  ['banners', 'theme=light&scroll=560', 'Bannere și categorii', 'Personaje desenate și sfaturi scoase din datele cantinei.'],
  ['menu', 'theme=light&scroll=1000', 'Meniul de azi', 'Feluri, prețuri, gramaj, etichete și alergeni.'],
  ['dish', 'theme=light&screen=dish&dish=papanasi', 'Un fel de mâncare', 'Poză, preț, note și alergenii declarați de cantină.'],
  ['account', 'theme=light&screen=account', 'Contul și fidelitatea', 'A cincea masă e gratuită; istoricul și notificările.'],
  ['visit', 'theme=light&screen=visit', 'Adaugă bonul', 'Fotografiezi bonul; păstrăm doar data, suma și numărul.'],
  ['install', 'theme=light&install', 'Pune UBite pe ecran', 'Invitația de instalare a aplicației.'],
  ['empty', 'theme=light&menu=empty&scroll=820', 'Meniu nepublicat', 'Stările goale spun de ce și ce urmează.'],
  ['closed', 'theme=light&level=closed&scroll=560', 'Cantina e închisă', 'Bannerul se schimbă după starea cantinei.'],
  ['offline', 'theme=dark&offline', 'Fără internet', 'Meniul din cache; raportul așteaptă conexiunea.'],
  ['high', 'theme=dark&level=high', 'Noaptea, coadă mare', 'Tema întunecată: cuvântul întâi, apoi culoarea.'],
  ['onb-3', 'onboarding=3&theme=dark', 'Știi cât aștepți', 'Onboarding, pasul 3, în tema de noapte.'],
];
const WIDE = [
  ['kiosk', 'ds/ui_kits/kiosk/index.html', 1280, 800],
  ['kiosk-attract', 'ds/ui_kits/kiosk/attract.html?scene=brand&hold', 1280, 800],
  ['staff-editor', 'ds/ui_kits/staff-editor/index.html', 1280, 820],
  ['dccas-dashboard', 'ds/ui_kits/dccas-dashboard/index.html', 1280, 860],
];

const exe = [process.env.BROWSER_PATH, 'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', '/usr/bin/google-chrome', '/usr/bin/chromium'].find((p) => p && fs.existsSync(p));
const browser = await puppeteer.launch({ executablePath: exe, headless: true, args: ['--hide-scrollbars'] });
fs.mkdirSync(path.join(OUT, 'shots'), { recursive: true });
const problems = [];
const open = async (url, width, height, scale) => {
  const page = await browser.newPage();
  page.on('pageerror', (e) => problems.push(`${url}: ${e.message}`));
  await page.setViewport({ width, height, deviceScaleFactor: scale });
  await page.goto(`${BASE}/${url}`, { waitUntil: 'networkidle0', timeout: 60000 });
  await new Promise((r) => setTimeout(r, 2600));
  return page;
};
for (const [name, query] of PHONES) {
  const page = await open(`ds/ui_kits/student-app/index.html?embed&${query}`, 440, 800, 2);
  const buf = await (await page.$('.ub-phone')).screenshot({ omitBackground: true });
  await sharp(buf).webp({ quality: 82, alphaQuality: 90 }).toFile(path.join(OUT, 'shots', `${name}.webp`));
  await page.close();
}
for (const [name, url, w, h] of WIDE) {
  const page = await open(url, w, h, 1.5);
  await sharp(await page.screenshot()).webp({ quality: 80 }).toFile(path.join(OUT, 'shots', `${name}.webp`));
  await page.close();
}
await browser.close();
server.close();
console.log(`✓ ${PHONES.length + WIDE.length} screenshots`);

/* ---------- 4. the board ---------- */

const ARROW = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>';
const esc = (s) => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
const phones = PHONES.map(([name, query, title, caption]) =>
  `      <figure><a class="shot" href="ds/ui_kits/student-app/index.html?nosplash&amp;${esc(query)}" aria-label="${esc(title)} — deschide în prototip">` +
  `<div class="frame"><img src="shots/${name}.webp" width="800" height="1520" alt="" loading="lazy"></div></a>` +
  `<figcaption><b>${esc(title)}</b><span>${esc(caption)}</span></figcaption></figure>`).join('\n');
const date = new Date().toLocaleDateString('ro-RO', { day: 'numeric', month: 'long', year: 'numeric' });
const og = process.env.MOCKUP_URL ? `${process.env.MOCKUP_URL.replace(/\/$/, '')}/og.png` : 'og.png';
fs.writeFileSync(path.join(OUT, 'index.html'), fs.readFileSync(path.join(ROOT, 'mockup', 'index.html'), 'utf8')
  .replace('%%PHONES%%', phones).replaceAll('%%ARROW%%', ARROW).replaceAll('%%DATE%%', date).replace('%%OG_IMAGE%%', og));

// Link preview: the lockup in white on the accent, the wallpaper faint behind, the runner.
{
  const tile = fs.readFileSync(path.join(ROOT, 'assets/patterns/canteen.svg'), 'utf8')
    .replace('<g fill="#000"', '<g fill="#FFFFFF" fill-opacity="0.1"');
  const tilePng = await sharp(Buffer.from(tile)).resize(300, 300).png().toBuffer();
  const logo = await sharp(path.join(ROOT, 'assets/brand/logo-white.svg')).resize({ width: 560 }).png().toBuffer();
  const run = fs.readFileSync(path.join(ROOT, 'assets/illustrations/spots/run.svg'), 'utf8').replace(/currentColor/g, '#FFFFFF');
  const runPng = await sharp(Buffer.from(run)).resize(430, 430).png().toBuffer();
  await sharp({ create: { width: 1200, height: 630, channels: 3, background: '#1F4FD8' } })
    .composite([{ input: tilePng, tile: true, left: 0, top: 0 }, { input: logo, left: 80, top: 214 }, { input: runPng, left: 720, top: 180 }])
    .png().toFile(path.join(OUT, 'og.png'));
}
fs.writeFileSync(path.join(OUT, 'vercel.json'), JSON.stringify({
  headers: [{ source: '/(.*)\\.(webp|png|svg|mp4|webm|js|css)', headers: [{ key: 'Cache-Control', value: 'public, max-age=3600' }] }],
}, null, 2) + '\n');

const site = walk(OUT).filter((f) => !f.includes(`${path.sep}.vercel${path.sep}`));
const size = site.reduce((s, f) => s + fs.statSync(f).size, 0);
console.log(`✓ ${rel(OUT)}  ${site.length} files, ${(size / 1024 / 1024).toFixed(1)} MB  →  cd dist/ubite-mockup && npx vercel deploy --prod`);
if (problems.length) { console.log('page errors:\n  ' + [...new Set(problems)].join('\n  ')); process.exitCode = 1; }
