#!/usr/bin/env node
/* Locks the approved UBite look (approved by Marius on 22 Sep 2026: "stilul e perfect, să rămână
   așa"). Two things are frozen:

   1. the approved files — logo, characters, scenes, pictograms, wallpaper, city sketch and the
      rendered clips: their sha256 goes into assets/style/lock.json;
   2. the wording of the brand presets in scripts/art-direction.mjs (spot, doodles, picto, flat,
      sketch), so new drawings come out in the same hand.

   `npm run assets:check` fails if either drifts. Changing a locked piece is a team decision:
   make the change, get it approved, then re-lock on purpose:

   node scripts/lock-style.mjs            (re)writes the lock from the current files
   node scripts/lock-style.mjs --sheets   also redraws the reference sheets in assets/style/ */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import { PRESETS } from './art-direction.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const STYLE = path.join(ROOT, 'assets', 'style');
const LOCK = path.join(STYLE, 'lock.json');
const rel = (p) => path.relative(ROOT, p).split(path.sep).join('/');
const sha = (buf) => crypto.createHash('sha256').update(buf).digest('hex');

export const LOCKED_PRESETS = ['spot', 'doodles', 'picto', 'flat', 'sketch'];
export const LOCKED_GLOBS = [
  'assets/brand/', 'assets/illustrations/spots/', 'assets/illustrations/scenes/', 'assets/illustrations/picto/',
  'assets/patterns/', 'assets/illustrations/sketch-city.png',
  'assets/motion/logo-intro.mp4', 'assets/motion/logo-intro-light.mp4', 'assets/motion/logo-intro.webm',
  'assets/motion/kiosk-attract.mp4', 'assets/motion/kiosk-attract.webm',
  'assets/motion/spot-run.mp4', 'assets/motion/spot-run.webm',
];

export function presetFingerprint(name) {
  // The sentence the model receives, with a stand-in subject: wording changes change the hash.
  return sha(PRESETS[name].build('{subject}') + JSON.stringify(PRESETS[name].size));
}

export function lockedFiles() {
  const out = [];
  for (const g of LOCKED_GLOBS) {
    const abs = path.join(ROOT, g);
    if (!fs.existsSync(abs)) continue;
    if (fs.statSync(abs).isDirectory()) {
      for (const f of fs.readdirSync(abs).sort()) if (fs.statSync(path.join(abs, f)).isFile()) out.push(path.join(abs, f));
    } else out.push(abs);
  }
  return out;
}

/* Reference sheets: what "the UBite hand" looks like, for anyone generating more — and the
   images to upload to Gemini as a style reference. */
async function drawSheets() {
  fs.mkdirSync(STYLE, { recursive: true });
  const ink = (svg, colour) => svg.replace(/currentColor/g, colour).replace(/var\(--[a-z-]+, (#[0-9A-Fa-f]+)\)/g, '$1');
  const tile = async (file, size, colour = '#11161B', bg = '#FFFFFF') => sharp(Buffer.from(ink(fs.readFileSync(file, 'utf8'), colour)))
    .resize(size, size, { fit: 'contain', background: bg }).flatten({ background: bg }).png().toBuffer();
  const sheet = async (name, files, { cell = 360, cols = 3, colour, bg = '#FFFFFF' } = {}) => {
    const tiles = await Promise.all(files.map((f) => tile(f, cell - 40, colour, bg)));
    const rows = Math.ceil(tiles.length / cols);
    await sharp({ create: { width: cols * cell, height: rows * cell, channels: 3, background: bg } })
      .composite(tiles.map((t, i) => ({ input: t, left: (i % cols) * cell + 20, top: Math.floor(i / cols) * cell + 20 })))
      .png({ compressionLevel: 9 }).toFile(path.join(STYLE, name));
    console.log(`✓ assets/style/${name}`);
  };
  const dir = (d) => fs.readdirSync(path.join(ROOT, d)).filter((f) => f.endsWith('.svg')).sort().map((f) => path.join(ROOT, d, f));
  await sheet('characters.png', dir('assets/illustrations/spots'), { colour: '#11161B' });
  await sheet('characters-on-accent.png', dir('assets/illustrations/spots'), { colour: '#FFFFFF', bg: '#1F4FD8' });
  await sheet('pictograms.png', dir('assets/illustrations/picto'), { cell: 300 });
  await sheet('scenes.png', dir('assets/illustrations/scenes'), { cell: 520, cols: 2 });
  const pattern = ink(fs.readFileSync(path.join(ROOT, 'assets/patterns/canteen.svg'), 'utf8'), '#1F4FD8').replace('fill="#000"', 'fill="#1F4FD8"');
  await sharp(Buffer.from(pattern)).resize(900, 900).flatten({ background: '#FFFFFF' }).png({ compressionLevel: 9 }).toFile(path.join(STYLE, 'wallpaper.png'));
  console.log('✓ assets/style/wallpaper.png');
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  if (process.argv.includes('--sheets')) await drawSheets();
  const lock = {
    approved: '2026-09-22',
    approvedBy: 'Marius (technical lead) — "stilul e perfect, să rămână așa"; extended the same day with the team’s Gemini set (4 characters, 4 pictograms, 16 doodles, 2 scenes, the running loop) and a faster kiosk loop',
    howToChange: 'Change it, get it approved by the team, then run `node scripts/lock-style.mjs` on purpose.',
    presets: Object.fromEntries(LOCKED_PRESETS.map((p) => [p, presetFingerprint(p)])),
    files: Object.fromEntries(lockedFiles().map((f) => [rel(f), sha(fs.readFileSync(f))])),
  };
  fs.mkdirSync(STYLE, { recursive: true });
  fs.writeFileSync(LOCK, JSON.stringify(lock, null, 2) + '\n');
  console.log(`✓ ${rel(LOCK)} — ${Object.keys(lock.files).length} files, ${LOCKED_PRESETS.length} presets locked`);
}
