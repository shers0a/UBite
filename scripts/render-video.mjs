#!/usr/bin/env node
/* Records a page (a UI kit, the kiosk attract loop, a splash) to video, straight from the
   real components — on-brand by construction, no generator involved.

   node scripts/render-video.mjs <url> <out.mp4> [--seconds 17] [--size 1280x800] [--lead 1.5]

   Uses the Chromium already on the machine (Chrome or Edge; override with BROWSER_PATH) and
   the ffmpeg bundled by ffmpeg-static. The page is recorded in real time, then trimmed and
   encoded to H.264 (mp4) or VP9 (webm) by extension. */

import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { execFileSync } from 'node:child_process';
import puppeteer from 'puppeteer-core';
import ffmpeg from 'ffmpeg-static';

const [url, out, ...rest] = process.argv.slice(2);
const opt = {};
for (let i = 0; i < rest.length; i += 2) opt[rest[i].replace(/^--/, '')] = rest[i + 1];
if (!url || !out) { console.error('usage: render-video.mjs <url> <out.mp4|webm> [--seconds 17] [--size 1280x800] [--lead 1.5]'); process.exit(1); }

const [W, H] = (opt.size || '1280x800').split('x').map(Number);
const seconds = Number(opt.seconds || 17);
const lead = Number(opt.lead || 1.5);

const candidates = [
  process.env.BROWSER_PATH,
  path.join(process.env.LOCALAPPDATA || '', 'Google/Chrome/Application/chrome.exe'),
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/usr/bin/google-chrome', '/usr/bin/chromium',
].filter(Boolean);
const executablePath = candidates.find((p) => fs.existsSync(p));
if (!executablePath) { console.error('No Chrome/Edge found — set BROWSER_PATH.'); process.exit(1); }

const browser = await puppeteer.launch({ executablePath, headless: true, defaultViewport: { width: W, height: H, deviceScaleFactor: 1 }, args: ['--hide-scrollbars'] });
try {
  const page = await browser.newPage();
  await page.goto(url, { waitUntil: 'networkidle0', timeout: 60000 });
  // Frame the stage exactly: no page chrome around a fixed-size kit.
  await page.addStyleTag({ content: 'html,body{margin:0!important;padding:0!important;background:#000!important;overflow:hidden!important} body{display:block!important;min-height:0!important}' });
  const tmp = path.join(os.tmpdir(), `ubite-rec-${Date.now()}.webm`);
  const rec = await page.screencast({ path: tmp, ffmpegPath: ffmpeg });
  // The screencast needs a moment to deliver frames; that lead is trimmed off afterwards, so the
  // start event goes out only once it has passed. Pages opened with ?armed hold their first
  // frame until then.
  await new Promise((r) => setTimeout(r, lead * 1000));
  await page.evaluate(() => window.dispatchEvent(new Event('ubite:start')));
  await new Promise((r) => setTimeout(r, seconds * 1000 + 300));
  await rec.stop();
  fs.mkdirSync(path.dirname(path.resolve(out)), { recursive: true });
  const codec = out.endsWith('.webm')
    ? ['-c:v', 'libvpx-vp9', '-b:v', '0', '-crf', '34', '-row-mt', '1']
    : ['-c:v', 'libx264', '-preset', 'slow', '-crf', '22', '-pix_fmt', 'yuv420p', '-movflags', '+faststart'];
  execFileSync(ffmpeg, ['-y', '-loglevel', 'error', '-ss', String(lead), '-i', tmp, '-t', String(seconds),
    '-vf', `crop=${W}:${H}:0:0,fps=30`, '-an', ...codec, out]);
  fs.rmSync(tmp, { force: true });
  console.log(`✓ ${out}  ${(fs.statSync(out).size / 1024 / 1024).toFixed(2)} MB`);
} finally {
  await browser.close();
}
