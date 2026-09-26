#!/usr/bin/env node
/* Brings a drawing made elsewhere (Gemini, a sketch) into the locked UBite hand before it is
   vectorised: crops to the drawing, centres it on a square 1024 canvas at the same scale as the
   approved characters, and thickens or thins the ink until its average stroke width matches
   theirs (measured on the approved originals, assets/_raw/spot-NAME/spot-NAME-s101.jpg).

   node scripts/match-ink.mjs <in.jpg> <out.png> [--fill 0.86] [--target 13.5]
   node scripts/match-ink.mjs --measure <img…>      prints stroke widths only */
import fs from 'node:fs';
import sharp from 'sharp';
import { darkMask, dilate, erode, components } from './vector-tools.mjs';

const args = process.argv.slice(2);
const opt = (k, d) => { const i = args.indexOf(`--${k}`); return i >= 0 ? args[i + 1] : d; };

async function load(file) {
  const { data, info } = await sharp(file).flatten({ background: '#FFFFFF' }).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  return { data, W: info.width, H: info.height };
}

/* Mean stroke width ≈ 2·area / perimeter of the ink (exact for long thin strokes). */
export function strokeWidth(mask, W, H) {
  let area = 0, edge = 0;
  for (let y = 1; y < H - 1; y++) for (let x = 1; x < W - 1; x++) {
    const i = y * W + x;
    if (!mask[i]) continue;
    area++;
    edge += (!mask[i - 1]) + (!mask[i + 1]) + (!mask[i - W]) + (!mask[i + W]);
  }
  return edge ? (2 * area) / edge : 0;
}

async function normalise(file, fill) {
  const img = await load(file);
  const ink = darkMask(img, 150);
  // The drawing's box, ignoring specks (and any corner watermark) under 300 px.
  const { list } = components(dilate(ink, img.W, img.H, 6), img.W, img.H, 300);
  const x0 = Math.min(...list.map((c) => c.x0)), y0 = Math.min(...list.map((c) => c.y0));
  const x1 = Math.max(...list.map((c) => c.x1)), y1 = Math.max(...list.map((c) => c.y1));
  const w = x1 - x0 + 1, h = y1 - y0 + 1;
  const S = 1024, k = (S * fill) / Math.max(w, h);
  const part = await sharp(file).flatten({ background: '#FFFFFF' }).extract({ left: x0, top: y0, width: w, height: h })
    .resize(Math.round(w * k), Math.round(h * k)).png().toBuffer();
  const meta = await sharp(part).metadata();
  return sharp({ create: { width: S, height: S, channels: 3, background: '#FFFFFF' } })
    .composite([{ input: part, left: Math.round((S - meta.width) / 2), top: Math.round((S - meta.height) / 2) }])
    .removeAlpha().raw().toBuffer({ resolveWithObject: true });
}

if (args[0] === '--measure') {
  for (const f of args.slice(1)) {
    const { data, info } = await normalise(f, Number(opt('fill', 0.86)));
    console.log(f, strokeWidth(darkMask({ data, W: info.width, H: info.height }, 150), info.width, info.height).toFixed(2));
  }
} else {
  const [input, output] = args;
  const { data, info } = await normalise(input, Number(opt('fill', 0.86)));
  const W = info.width, H = info.height;
  let mask = darkMask({ data, W, H }, 150);
  const target = Number(opt('target', 13.5));
  const now = strokeWidth(mask, W, H);
  // Grow or shrink by whole pixels on each side: a 2 px change in width per step.
  const steps = Math.round((target - now) / 2);
  if (steps > 0) mask = dilate(mask, W, H, steps);
  if (steps < 0) mask = erode(mask, W, H, -steps);
  const out = Buffer.alloc(W * H);
  for (let i = 0; i < W * H; i++) out[i] = mask[i] ? 0 : 255;
  await sharp(out, { raw: { width: W, height: H, channels: 1 } }).png().toFile(output);
  console.log(`✓ ${output}  stroke ${now.toFixed(1)} → ${strokeWidth(mask, W, H).toFixed(1)} px (target ${target})`);
}
