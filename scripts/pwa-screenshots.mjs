#!/usr/bin/env node
/* The screenshots in the web app manifest — Android's richer install sheet shows them. Taken from
   the running app with demo data, in the dark theme, at a phone's size (390×844 at 2×).

   node scripts/pwa-screenshots.mjs [baseUrl]    (the server must show demo codes: DEMO_SHOW_CODES=1) */
import fs from 'node:fs';
import path from 'node:path';
import puppeteer from 'puppeteer-core';

const BASE = (process.argv[2] || 'http://localhost:8080').replace(/\/$/, '');
const OUT = path.resolve('apps/web/public/screenshots');
fs.mkdirSync(OUT, { recursive: true });
const exe = [process.env.BROWSER_PATH, path.join(process.env.LOCALAPPDATA || '', 'Google/Chrome/Application/chrome.exe'),
  'C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  '/usr/bin/google-chrome', '/usr/bin/chromium'].find((p) => p && fs.existsSync(p));
const browser = await puppeteer.launch({ executablePath: exe, headless: true });
const p = await browser.newPage();
await p.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
await p.emulateMediaFeatures([{ name: 'prefers-color-scheme', value: 'dark' }, { name: 'prefers-reduced-motion', value: 'reduce' }]);
await p.evaluateOnNewDocument(() => {
  localStorage.setItem('ubite.lang', 'ro');
  sessionStorage.setItem('ubite.splash', '1');
  localStorage.setItem('ubite.installLater', String(Date.now() + 864e5));
});
const settle = () => new Promise((r) => setTimeout(r, 1500));

await p.goto(`${BASE}/`, { waitUntil: 'networkidle2' });
await settle();
await p.screenshot({ path: path.join(OUT, 'home.png') });

await p.evaluate(() => document.getElementById('menu-title')?.scrollIntoView({ block: 'start' }));
await p.evaluate(() => window.scrollBy(0, -90));
await settle();
await p.screenshot({ path: path.join(OUT, 'menu.png') });

await p.evaluate(async () => {
  const e = 'ubite.demo.2@s.unibuc.ro';
  const r = await (await fetch('/api/auth/request-code', { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-UBite': '1' }, body: JSON.stringify({ email: e }) })).json();
  await fetch('/api/auth/verify', { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-UBite': '1' }, body: JSON.stringify({ email: e, code: r.demoCode }) });
});
await p.goto(`${BASE}/card`, { waitUntil: 'networkidle2' });
await settle();
await p.screenshot({ path: path.join(OUT, 'card.png') });
await browser.close();
console.log(`screenshots in ${path.relative(process.cwd(), OUT)}`);
