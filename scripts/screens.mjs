#!/usr/bin/env node
/* Screenshots of the running app — for review, for the R1/R2 evidence ("screenshot every feature
   the day it works", docs/13) and for a quick visual check against the UI kits.

   node scripts/screens.mjs [baseUrl] [outDir]
   Defaults: http://localhost:8080 and dist/screens/. Signs in with the demo accounts through the
   dev log (DEV_LOG_CODES=1), so run it against a local API seeded with `npm run db:seed -- --demo`. */
import fs from 'node:fs';
import path from 'node:path';
import puppeteer from 'puppeteer-core';

const BASE = process.argv[2] || 'http://localhost:8080';
const OUT = path.resolve(process.argv[3] || 'dist/screens');
const LOG = process.env.API_LOG;
fs.mkdirSync(OUT, { recursive: true });

const exe = [process.env.BROWSER_PATH, path.join(process.env.LOCALAPPDATA || '', 'Google/Chrome/Application/chrome.exe'),
  'C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  '/usr/bin/google-chrome', '/usr/bin/chromium'].find((p) => p && fs.existsSync(p));
if (!exe) { console.error('No Chrome/Edge found — set BROWSER_PATH.'); process.exit(1); }

const browser = await puppeteer.launch({ executablePath: exe, headless: true, args: ['--hide-scrollbars'] });

async function page({ width = 400, height = 860, theme = 'dark', lang = 'ro' } = {}) {
  const p = await browser.newPage();
  await p.setViewport({ width, height, deviceScaleFactor: 2 });
  await p.emulateMediaFeatures([{ name: 'prefers-color-scheme', value: theme }]);
  await p.evaluateOnNewDocument((l) => {
    localStorage.setItem('ubite.lang', l);
    sessionStorage.setItem('ubite.splash', '1');
    localStorage.setItem('ubite.installLater', String(Date.now() + 864e5));
  }, lang);
  p.on('pageerror', (e) => console.error('pageerror', e.message));
  p.on('console', (m) => { if (m.type() === 'error') console.error('console', m.text()); });
  return p;
}

async function shot(p, name, { full = false } = {}) {
  await new Promise((r) => setTimeout(r, 700));
  await p.screenshot({ path: path.join(OUT, `${name}.png`), fullPage: full });
  console.log('✓', name);
}

async function signIn(p, email) {
  await p.evaluate(async (e) => {
    await fetch('/api/auth/request-code', { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-UBite': '1' }, body: JSON.stringify({ email: e }) });
  }, email);
  if (!LOG) throw new Error('set API_LOG to the API log file to read the dev code');
  await new Promise((r) => setTimeout(r, 400));
  const lines = fs.readFileSync(LOG, 'utf8').trim().split('\n').reverse();
  const code = lines.map((l) => { try { return JSON.parse(l); } catch { return null; } })
    .find((l) => l && l.msg && l.msg.startsWith('[dev mail]'))?.msg.match(/(\d{6})/)?.[1];
  const ok = await p.evaluate(async (e, c) => {
    const r = await fetch('/api/auth/verify', { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-UBite': '1' }, body: JSON.stringify({ email: e, code: c }) });
    const me = await r.json();
    localStorage.setItem('ubite.cache.me', JSON.stringify({ data: me, fetchedAt: Date.now() }));
    return r.ok;
  }, email, code);
  if (!ok) throw new Error(`sign-in failed for ${email}`);
}

for (const theme of ['dark', 'light']) {
  const p = await page({ theme });
  await p.goto(`${BASE}/`, { waitUntil: 'networkidle0' });
  await shot(p, `home-${theme}`);
  await shot(p, `home-${theme}-full`, { full: true });
  await p.close();
}

{
  const p = await page();
  await p.goto(`${BASE}/`, { waitUntil: 'networkidle0' });
  const dish = await p.$eval('.ub-dish', (el) => el.textContent);
  await p.click('.ub-dish');
  await p.waitForNetworkIdle();
  await shot(p, 'dish');
  console.log('opened', dish);
  await p.goto(`${BASE}/account`, { waitUntil: 'networkidle0' });
  await shot(p, 'account-signed-out');
  await p.goto(`${BASE}/`, { waitUntil: 'networkidle0' });
  await p.evaluate(() => window.scrollTo(0, 700));
  await shot(p, 'home-scrolled');
  await p.close();
}

{
  const p = await page();
  await p.goto(`${BASE}/`, { waitUntil: 'networkidle0' });
  await signIn(p, 'ubite.demo.1@s.unibuc.ro');
  await p.goto(`${BASE}/`, { waitUntil: 'networkidle0' });
  await p.evaluate(() => window.scrollTo(0, 1100));
  await shot(p, 'home-signed-in-loyalty');
  await p.goto(`${BASE}/account`, { waitUntil: 'networkidle0' });
  await shot(p, 'account', { full: true });
  await p.goto(`${BASE}/card`, { waitUntil: 'networkidle0' });
  await shot(p, 'card');
  await p.goto(`${BASE}/visit`, { waitUntil: 'networkidle0' });
  await shot(p, 'visit');
  await p.close();
}

{
  const p = await page();
  await p.goto(`${BASE}/`, { waitUntil: 'networkidle0' });
  await signIn(p, 'ubite.demo.2@s.unibuc.ro');
  await p.goto(`${BASE}/card`, { waitUntil: 'networkidle0' });
  await shot(p, 'card-reward', { full: true });
  await p.close();
}

{
  const p = await page({ width: 1200, height: 860, theme: 'light' });
  await p.goto(`${BASE}/`, { waitUntil: 'networkidle0' });
  await signIn(p, 'cantina@ubite.local');
  await p.goto(`${BASE}/staff`, { waitUntil: 'networkidle0' });
  await shot(p, 'staff-editor', { full: true });
  await p.goto(`${BASE}/staff/redeem`, { waitUntil: 'networkidle0' });
  await shot(p, 'staff-redeem');
  await p.goto(`${BASE}/staff/catalogue`, { waitUntil: 'networkidle0' });
  await shot(p, 'staff-catalogue');
  await p.close();
}

{
  const p = await page({ width: 1200, height: 860, theme: 'light' });
  await p.goto(`${BASE}/`, { waitUntil: 'networkidle0' });
  await signIn(p, 'dccas@ubite.local');
  await p.goto(`${BASE}/dashboard`, { waitUntil: 'networkidle0' });
  await shot(p, 'dashboard', { full: true });
  await p.close();
}

{
  const p = await page({ width: 1280, height: 800 });
  await p.goto(`${BASE}/kiosk`, { waitUntil: 'networkidle0' });
  await shot(p, 'kiosk-menu');
  await new Promise((r) => setTimeout(r, 8200));
  await shot(p, 'kiosk-crowding');
  await new Promise((r) => setTimeout(r, 5200));
  await shot(p, 'kiosk-qr');
  await p.mouse.click(600, 400);
  await shot(p, 'kiosk-tapped');
  await p.goto(`${BASE}/kiosk/attract`, { waitUntil: 'networkidle0' });
  await new Promise((r) => setTimeout(r, 5400));
  await shot(p, 'kiosk-attract-dishes');
  await p.close();
}

await browser.close();
