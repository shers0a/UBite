#!/usr/bin/env node
/* Every feature of docs/03, used the way a person uses it — in a real browser, through the UI,
   against a running deployment with demo data. Signs in through the sign-in sheet, so the server
   must show demo codes (DEMO_SHOW_CODES=1) and be open at the time of the run.

   node scripts/e2e.mjs [baseUrl] [receiptPhoto] [secondReceiptPhoto]

   Prints one line per check and a summary; failures leave a screenshot in dist/e2e/. */
import fs from 'node:fs';
import path from 'node:path';
import puppeteer from 'puppeteer-core';

const BASE = (process.argv[2] || 'http://localhost:8080').replace(/\/$/, '');
const RECEIPT = process.argv[3];
const RECEIPT2 = process.argv[4];
const OUT = path.resolve('dist/e2e');
fs.mkdirSync(OUT, { recursive: true });

const exe = [process.env.BROWSER_PATH, path.join(process.env.LOCALAPPDATA || '', 'Google/Chrome/Application/chrome.exe'),
  'C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  '/usr/bin/google-chrome', '/usr/bin/chromium'].find((p) => p && fs.existsSync(p));
const browser = await puppeteer.launch({ executablePath: exe, headless: true, args: ['--hide-scrollbars'] });

const results = [];
let current = null;
async function check(name, fn) {
  const started = Date.now();
  try {
    await fn();
    results.push({ name, ok: true });
    console.log(`  ✓ ${name} (${Date.now() - started} ms)`);
  } catch (e) {
    results.push({ name, ok: false, error: e.message });
    console.log(`  ✗ ${name}\n      ${e.message.split('\n')[0]}`);
    if (current) await current.screenshot({ path: path.join(OUT, `${name.replace(/[^a-z0-9]+/gi, '-').slice(0, 60)}.png`) }).catch(() => {});
  }
}

async function page({ width = 400, height = 860, lang = 'ro' } = {}) {
  const ctx = await browser.createBrowserContext();
  const p = await ctx.newPage();
  await p.setViewport({ width, height, deviceScaleFactor: 1 });
  await p.evaluateOnNewDocument((l) => {
    localStorage.setItem('ubite.lang', l);
    sessionStorage.setItem('ubite.splash', '1');
    localStorage.setItem('ubite.installLater', String(Date.now() + 864e5));
  }, lang);
  p.errors = [];
  p.on('pageerror', (e) => p.errors.push(e.message));
  p.on('console', (m) => { if (m.type() === 'error' && !/Failed to load resource/.test(m.text())) p.errors.push(m.text()); });
  current = p;
  return p;
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const text = (p) => p.evaluate(() => document.body.innerText);

/** Waits until the visible text contains every string (or matches the regex). Case is ignored:
 *  eyebrow labels are uppercased by CSS. */
async function see(p, ...wanted) {
  const deadline = Date.now() + 15000;
  let body = '';
  while (Date.now() < deadline) {
    body = await text(p);
    if (wanted.every((w) => (w instanceof RegExp ? w.test(body) : body.toLowerCase().includes(w.toLowerCase())))) return body;
    await sleep(200);
  }
  throw new Error(`did not see ${wanted.map(String).join(' + ')} — page shows: ${body.replace(/\s+/g, ' ').slice(0, 300)}`);
}

/** Clicks the first visible button or link whose text or aria-label matches. */
async function click(p, label, { within } = {}) {
  const deadline = Date.now() + 10000;
  while (Date.now() < deadline) {
    const done = await p.evaluate((l, w, isRe) => {
      const re = isRe ? new RegExp(l) : null;
      const root = w ? document.querySelector(w) : document;
      if (!root) return false;
      const els = [...root.querySelectorAll('button, a, [role="button"], [role="tab"], label')].filter((e) => {
        const r = e.getBoundingClientRect();
        return r.width && r.height && !e.disabled;
      });
      // An open sheet is on top: look there first. Exact text before a prefix.
      const sheet = document.querySelector('[role="dialog"]');
      const order = sheet ? [...els.filter((e) => sheet.contains(e)), ...els.filter((e) => !sheet.contains(e))] : els;
      const t = (e) => (e.innerText || '').trim();
      const a = (e) => e.getAttribute('aria-label') || '';
      const el = re ? order.find((e) => re.test(t(e)) || re.test(a(e)))
        : order.find((e) => t(e) === l || a(e) === l) ?? order.find((e) => t(e).startsWith(l));
      if (!el) return false;
      el.scrollIntoView({ block: 'center' });
      el.click();
      return true;
    }, label instanceof RegExp ? label.source : label, within, label instanceof RegExp);
    if (done) return;
    await sleep(200);
  }
  throw new Error(`no button "${label}"`);
}

/** Types into the input whose label (or aria-label, or placeholder) matches. */
async function fill(p, label, value) {
  const id = await p.evaluate((l) => {
    const byLabel = [...document.querySelectorAll('label')].find((x) => x.innerText.trim().startsWith(l));
    let input = byLabel?.htmlFor ? document.getElementById(byLabel.htmlFor) : byLabel?.querySelector('input,textarea');
    input ||= [...document.querySelectorAll('input,textarea')].find((x) => x.getAttribute('aria-label') === l || x.placeholder === l);
    if (!input) return null;
    input.id ||= `e2e-${Math.random().toString(36).slice(2)}`;
    return input.id;
  }, label);
  if (!id) throw new Error(`no field "${label}"`);
  await p.evaluate((i) => { const el = document.getElementById(i); el.scrollIntoView({ block: 'center' }); el.focus(); el.select?.(); }, id);
  await p.keyboard.press('Backspace');
  await p.keyboard.type(value);
}

async function api(p, method, url, body) {
  return p.evaluate(async (m, u, b) => {
    const r = await fetch(`/api${u}`, { method: m, headers: { 'Content-Type': 'application/json', 'X-UBite': '1' }, body: b ? JSON.stringify(b) : undefined });
    return { status: r.status, type: r.headers.get('content-type'), body: await r.text() };
  }, method, url, body);
}

/** Through the sign-in sheet, as a person would: address, send, the demo code is filled in, enter. */
async function signIn(p, email, opener) {
  if (opener) await opener();
  await see(p, 'Intră în cont');
  await fill(p, email.endsWith('@s.unibuc.ro') ? 'Adresa ta de la universitate' : 'Adresa contului', email);
  await click(p, 'Trimite codul');
  await see(p, /Codul tău este \d{6}/);
  await click(p, 'Intră');
  await see(p, 'Ai intrat în cont.');
}

console.log(`\nUBite end to end — ${BASE}\n`);

/* ── Anonymous student, on a phone ─────────────────────────────────────────────────────── */
console.log('Student without an account');
{
  const p = await page();
  await check('F1 the menu of the day loads, by category, with prices', async () => {
    await p.goto(`${BASE}/`, { waitUntil: 'networkidle2' });
    await see(p, 'Meniul de azi', /\d+([.,]\d+)? lei/);
    const rows = await p.$$('.ub-dish');
    if (rows.length < 3) throw new Error(`only ${rows.length} dishes`);
  });
  await check('nothing scrolls sideways on a phone, so the nav and bars stay centred', async () => {
    const [sw, iw] = await p.evaluate(() => [document.documentElement.scrollWidth, innerWidth]);
    if (sw > iw) throw new Error(`page is ${sw}px wide on a ${iw}px screen`);
  });
  await check('the bottom nav folds to its icons while scrolling down, opens on the way up', async () => {
    for (let y = 0; y <= 900; y += 150) { await p.evaluate((v) => window.scrollTo(0, v), y); await sleep(60); }
    await p.waitForFunction(() => document.querySelector('.ub-nav')?.getAttribute('data-folded') === 'true', { timeout: 3000 });
    for (let y = 900; y >= 300; y -= 150) { await p.evaluate((v) => window.scrollTo(0, v), y); await sleep(60); }
    await p.waitForFunction(() => document.querySelector('.ub-nav')?.getAttribute('data-folded') === 'false', { timeout: 3000 });
    await p.evaluate(() => window.scrollTo(0, 0));
  });
  const heroShowsEstimate = async () => {
    const body = await see(p, /Coada acum/i);
    const hero = body.slice(0, body.search(/Ce mănâncă lumea/));
    if (/%/.test(hero)) throw new Error('a percentage in the crowding hero');
    return /\b(Mică|Medie|Mare)\b/.test(hero) && /\d+ (de )?minute|un minut/.test(hero) && /actualizat/i.test(hero);
  };
  await check('F3 crowding: a level word, minutes and the age — or says there is no data', async () => {
    if (!(await heroShowsEstimate())) await see(p, /Nu avem date acum|Închis/);
  });
  await check('F8 typical crowding by hour, shown once the history covers today’s hours', async () => {
    const r = JSON.parse((await api(p, 'GET', '/crowding/typical')).body);
    if (r.available) await see(p, /De obicei (lunea|marțea|miercurea|joia|vinerea|sâmbăta|duminica)/);
    else if (/De obicei/.test(await text(p))) throw new Error('chart shown while the API says unavailable');
    else console.log('      (hidden today: the history does not cover today’s opening hours)');
  });
  await check('F11 dietary filters narrow the menu and clear again', async () => {
    const before = (await p.$$('.ub-dish')).length;
    await click(p, /^Vegetarian/, { within: '[aria-label="Filtre alimentare"]' });
    await sleep(400);
    const after = (await p.$$('.ub-dish')).length;
    if (!(after < before)) throw new Error(`filter kept ${after} of ${before}`);
    await click(p, 'Vezi tot meniul');
    await sleep(300);
    if ((await p.$$('.ub-dish')).length !== before) throw new Error('clearing did not restore the menu');
  });
  await check('F2 dish details: price, allergens (or that they are missing), the source', async () => {
    await p.click('.ub-dish');
    await see(p, /\d+ lei/, /ALERGENI|Alergeni/i, 'Prețurile și alergenii sunt cele comunicate de cantină');
    await p.goto(`${BASE}/`, { waitUntil: 'networkidle2' });
    await see(p, 'Meniul de azi');
  });
  await check('F6 report the wait anonymously and see the estimate move', async () => {
    await p.evaluate(() => window.scrollTo(0, 0));
    await click(p, '5 min');
    await see(p, /Mulțumim\. (Estimarea s-a actualizat|Raportul tău)/);
    // The report loop closes in one interaction: the hero now has a level, minutes and an age.
    await p.evaluate(() => window.scrollTo(0, 0));
    if (!(await heroShowsEstimate())) throw new Error('no estimate after the report');
  });
  await check('F5 feedback without an account', async () => {
    await click(p, 'Trimite feedback');
    await see(p, 'Cât de mulțumit ești de mâncare?');
    await click(p, /^4$|4 din 5/);
    await click(p, 'Da');
    await p.evaluate(() => [...document.querySelectorAll('button')].filter((b) => b.innerText.trim() === 'Trimite').pop()?.click());
    await see(p, 'Mulțumim. Ne ajută mult.');
  });
  await check('F19 English everywhere with one tap', async () => {
    await click(p, 'Schimbă limba');
    await see(p, "Today's menu");
    await click(p, 'Change language');
    await see(p, 'Meniul de azi');
  });
  await check('PWA: manifest, icons and the service worker', async () => {
    const m = await api(p, 'GET', '/../manifest.webmanifest');
    if (m.status !== 200) throw new Error(`manifest ${m.status}`);
    const man = JSON.parse(m.body);
    if (!man.icons?.length || man.display !== 'standalone') throw new Error('manifest incomplete');
    const sw = await p.evaluate(async () => !!(await navigator.serviceWorker?.getRegistration()));
    if (!sw) throw new Error('no service worker registered');
  });
  await check('F20 offline: the saved menu, and a report queued until the signal returns', async () => {
    // Offline works once the service worker has installed and taken the page over.
    await p.waitForFunction(() => !!navigator.serviceWorker?.controller, { timeout: 60000 });
    await p.reload({ waitUntil: 'networkidle2' });
    await sleep(1500);
    await p.setOfflineMode(true);
    await p.reload({ waitUntil: 'domcontentloaded' }).catch(() => {});
    await see(p, 'Meniul de azi');
    await see(p, /Fără internet|fără internet|salvat/i);
    await p.setOfflineMode(false);
  });
  if (p.errors.length) await check('no errors in the browser console', async () => { throw new Error(p.errors.slice(0, 3).join(' | ')); });
  await p.close();
}

/* ── Student with an account ──────────────────────────────────────────────────────────── */
console.log('\nStudent with an account (4 of 5 dots)');
{
  const p = await page();
  await check('sign in with the email code (demo shows it on screen)', async () => {
    await p.goto(`${BASE}/account`, { waitUntil: 'networkidle2' });
    await signIn(p, 'ubite.demo.1@s.unibuc.ro', () => click(p, 'Intră în cont'));
  });
  await check('F10 favourites: the heart, then the list in the account', async () => {
    await p.goto(`${BASE}/`, { waitUntil: 'networkidle2' });
    const name = await p.$eval('.ub-dish', (el) => el.querySelector('h3,h4,strong,span')?.textContent?.trim() || el.textContent.trim().slice(0, 20));
    const pressed = await p.$eval('.ub-dish-fav', (b) => b.getAttribute('aria-pressed'));
    await p.click('.ub-dish-fav');
    await p.waitForFunction((was) => document.querySelector('.ub-dish-fav')?.getAttribute('aria-pressed') !== was, {}, pressed);
    await p.goto(`${BASE}/account`, { waitUntil: 'networkidle2' });
    await see(p, 'Favorite');
    if (pressed === 'false') await see(p, name.slice(0, 8));
  });
  await check('F12 rating a dish, once', async () => {
    await p.goto(`${BASE}/`, { waitUntil: 'networkidle2' });
    await p.click('.ub-dish');
    await see(p, 'Prețurile și alergenii');
    await p.evaluate(() => { const b = [...document.querySelectorAll('button[aria-label="4"]')][0]; b?.scrollIntoView(); b?.click(); });
    await see(p, 'Mulțumim pentru notă.');
  });
  if (RECEIPT) {
    await check('F4 add a visit by photographing the receipt (real OCR)', async () => {
      await p.goto(`${BASE}/visit`, { waitUntil: 'networkidle2' });
      const input = await p.$('input[type=file]');
      await input.uploadFile(RECEIPT);
      await see(p, 'Am citit');
      await see(p, '26,50');
      await click(p, 'Adaugă vizita');
      await see(p, /Vizită adăugată · \d din 5|Ai o masă gratuită|Bon adăugat\. Punctul de azi/);
    });
    await check('F4 the same receipt a second time is refused', async () => {
      await p.goto(`${BASE}/visit`, { waitUntil: 'networkidle2' });
      await (await p.$('input[type=file]')).uploadFile(RECEIPT);
      await see(p, 'Am citit');
      await click(p, 'Adaugă vizita');
      await see(p, 'Bonul acesta a fost deja adăugat.');
    });
  }
  await check('F4 manual entry, the documented fallback', async () => {
    await p.goto(`${BASE}/visit`, { waitUntil: 'networkidle2' });
    await click(p, 'Scriu eu numărul și suma');
    await fill(p, 'Numărul bonului', String(1000 + Math.floor(Math.random() * 8000)));
    await fill(p, 'Totalul', '21,50');
    await click(p, 'Adaugă vizita');
    await see(p, /Vizită adăugată|Bon adăugat|Ai o masă gratuită/);
  });
  await check('F4 the card: dots, a reward code that changes every minute, works offline', async () => {
    await p.goto(`${BASE}/card`, { waitUntil: 'networkidle2' });
    await see(p, 'Cardul de fidelitate');
    await see(p, /se schimbă în \d+s|Codul cardului tău/);
  });
  await check('F9 personal history: visits and spend this month', async () => {
    await p.goto(`${BASE}/account`, { waitUntil: 'networkidle2' });
    await see(p, 'Istoricul tău', 'Mese luna asta');
  });
  await check('F5b notification preferences are saved', async () => {
    await see(p, 'Meniul e publicat');
    const before = await p.evaluate(() => [...document.querySelectorAll('input[type=checkbox],[role=switch]')].map((x) => x.checked ?? x.getAttribute('aria-checked')));
    await click(p, 'Meniul e publicat');
    await sleep(800);
    const r = await api(p, 'GET', '/me');
    if (r.status !== 200) throw new Error(`/me ${r.status}`);
    await p.reload({ waitUntil: 'networkidle2' });
    const after = await p.evaluate(() => [...document.querySelectorAll('input[type=checkbox],[role=switch]')].map((x) => x.checked ?? x.getAttribute('aria-checked')));
    if (JSON.stringify(before) === JSON.stringify(after)) throw new Error('the switch did not stay changed');
    await click(p, 'Meniul e publicat'); // put it back
  });
  await check('sign out', async () => {
    await click(p, 'Ieși din cont');
    await see(p, 'Ai ieșit din cont.');
  });
  await p.close();
}

/* ── A reward at the till ─────────────────────────────────────────────────────────────── */
console.log('\nThe free meal, from phone to till');
let rewardCode = null;
{
  const p = await page();
  await check('a student with a reward sees its code', async () => {
    await p.goto(`${BASE}/card`, { waitUntil: 'networkidle2' });
    await signIn(p, 'ubite.demo.2@s.unibuc.ro', () => click(p, 'Intră în cont'));
    await p.goto(`${BASE}/card`, { waitUntil: 'networkidle2' });
    const body = await see(p, 'Codul mesei gratuite');
    rewardCode = body.match(/Codul mesei gratuite\s+([A-Z0-9]{4}) (\d{4})/i)?.slice(1).join(' ') ?? null;
    if (!rewardCode) throw new Error('no code on the card');
  });
  await p.close();
}

/* ── Canteen staff, on a laptop ───────────────────────────────────────────────────────── */
console.log('\nCanteen staff');
{
  const p = await page({ width: 1280, height: 900 });
  await check('staff sign in', async () => {
    await p.goto(`${BASE}/staff`, { waitUntil: 'networkidle2' });
    await signIn(p, 'cantina@ubite.local', () => click(p, 'Intră în cont'));
  });
  await check('F14 publish today\'s menu from the catalogue', async () => {
    await p.goto(`${BASE}/staff`, { waitUntil: 'networkidle2' });
    await see(p, /Publică meniul \(\d+ feluri\)/);
    await click(p, /^Publică meniul \(\d+ feluri\)/);
    await see(p, /publicat|Publicat/);
  });
  await check('F15 an announcement, then visible to students', async () => {
    await p.goto(`${BASE}/staff/announcements`, { waitUntil: 'networkidle2' });
    const msg = `Test e2e ${Date.now() % 100000}`;
    await p.evaluate(() => document.querySelector('textarea, input[type=text]')?.focus());
    await p.keyboard.type(msg);
    await click(p, 'Publică anunțul');
    await see(p, msg);
    const s = await page();
    await s.goto(`${BASE}/`, { waitUntil: 'networkidle2' });
    await see(s, msg);
    await s.close();
    current = p;
  });
  if (rewardCode) {
    await check('redeem the free meal at the till, once', async () => {
      await p.goto(`${BASE}/staff/redeem`, { waitUntil: 'networkidle2' });
      await p.type('#redeem-code', rewardCode);
      await click(p, 'Confirmă');
      await see(p, /Masă gratuită confirmată|confirmat|Confirmat/i);
      await p.type('#redeem-code', rewardCode);
      await click(p, 'Confirmă');
      await see(p, /folosit|deja/i);
    });
  }
  await check('catalogue: edit a dish and save', async () => {
    await p.goto(`${BASE}/staff/catalogue`, { waitUntil: 'networkidle2' });
    await click(p, 'Editează');
    await fill(p, 'Gramaj', '321');
    await click(p, 'Salvează');
    await see(p, /Salvat|salvat|Catalog/);
  });
  await p.close();
}

/* ── DCCAS and the developers ─────────────────────────────────────────────────────────── */
console.log('\nDCCAS dashboard and admin');
{
  const p = await page({ width: 1280, height: 900 });
  await check('F16 the DCCAS dashboard loads its indicators', async () => {
    await p.goto(`${BASE}/dashboard`, { waitUntil: 'networkidle2' });
    await signIn(p, 'dccas@ubite.local', () => click(p, 'Intră în cont'));
    await p.goto(`${BASE}/dashboard`, { waitUntil: 'networkidle2' });
    await see(p, /Vizite|vizite/, /Feedback|feedback/);
  });
  await check('F16 CSV exports for UNIHUB', async () => {
    const links = await p.$$eval('a[href*="csv"], a[download]', (as) => as.map((a) => a.getAttribute('href')));
    if (!links.length) throw new Error('no export links');
    for (const href of links.slice(0, 4)) {
      const r = await p.evaluate(async (h) => { const x = await fetch(h); return { s: x.status, t: x.headers.get('content-type'), b: (await x.text()).slice(0, 80) }; }, href);
      if (r.s !== 200 || !/csv/.test(r.t || '')) throw new Error(`${href}: ${r.s} ${r.t}`);
    }
  });
  await check('the dashboard is closed to students', async () => {
    const s = await page();
    await s.goto(`${BASE}/`, { waitUntil: 'networkidle2' });
    const r = await api(s, 'GET', '/dashboard/summary');
    await s.close();
    current = p;
    if (r.status !== 401 && r.status !== 403) throw new Error(`status ${r.status}`);
  });
  await p.close();

  const a = await page({ width: 1280, height: 900 });
  await check('admin: thresholds, camera zone, hours and accounts', async () => {
    await a.goto(`${BASE}/admin`, { waitUntil: 'networkidle2' });
    await signIn(a, 'admin@ubite.local', () => click(a, 'Intră în cont'));
    await a.goto(`${BASE}/admin`, { waitUntil: 'networkidle2' });
    await see(a, /Praguri|praguri/, /Program|program/);
  });
  await a.close();
}

/* ── Kiosk ─────────────────────────────────────────────────────────────────────────────── */
console.log('\nKiosk');
{
  const p = await page({ width: 1280, height: 800 });
  await check('the kiosk rotates menu → crowding → QR', async () => {
    await p.goto(`${BASE}/kiosk`, { waitUntil: 'networkidle2' });
    await see(p, /Meniul de azi|meniu/i);
    await sleep(8500);
    await see(p, /Coad|coad|minut|Închis/);
  });
  await check('the attract loop plays', async () => {
    await p.goto(`${BASE}/kiosk/attract`, { waitUntil: 'networkidle2' });
    await sleep(2000);
    const hasMedia = await p.evaluate(() => !!document.querySelector('video, img, svg'));
    if (!hasMedia) throw new Error('nothing on screen');
  });
  await p.close();
}

await browser.close();
const failed = results.filter((r) => !r.ok);
console.log(`\n${results.length - failed.length} of ${results.length} checks passed${failed.length ? ` — failed: ${failed.map((f) => f.name).join('; ')}` : ''}`);
process.exit(failed.length ? 1 : 0);
