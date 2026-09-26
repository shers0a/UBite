/* Getting a phone photo of a thermal receipt ready for Tesseract. A student photographs the
   receipt on a table, tilted, in uneven light; Tesseract wants upright dark text on white at a
   modest size. Measured on scripts/ocr-bench.ts: no single preparation reads every photo, but their
   mistakes differ — so the reader runs three and the parser takes each field by majority. */
import type sharpType from 'sharp';

type Sharp = typeof sharpType;

/** Otsu's threshold: the grey level that best separates paper from ink (or paper from table). */
export function otsu(px: Uint8Array): number {
  const hist = new Array<number>(256).fill(0);
  for (const v of px) hist[v]++;
  let sum = 0;
  for (let i = 0; i < 256; i++) sum += i * hist[i];
  let sumB = 0;
  let wB = 0;
  let best = -1;
  let t = 128;
  for (let i = 0; i < 256; i++) {
    wB += hist[i];
    if (!wB) continue;
    const wF = px.length - wB;
    if (!wF) break;
    sumB += i * hist[i];
    const between = wB * wF * (sumB / wB - (sum - sumB) / wF) ** 2;
    if (between > best) { best = between; t = i; }
  }
  return t;
}

function boxMean(px: Uint8Array, w: number, h: number) {
  const I = new Float64Array((w + 1) * (h + 1));
  for (let y = 0; y < h; y++) {
    let row = 0;
    for (let x = 0; x < w; x++) {
      row += px[y * w + x];
      I[(y + 1) * (w + 1) + x + 1] = I[y * (w + 1) + x + 1] + row;
    }
  }
  return (x0: number, y0: number, x1: number, y1: number) => {
    x0 = Math.max(0, x0); y0 = Math.max(0, y0); x1 = Math.min(w, x1); y1 = Math.min(h, y1);
    const s = I[y1 * (w + 1) + x1] - I[y0 * (w + 1) + x1] - I[y1 * (w + 1) + x0] + I[y0 * (w + 1) + x0];
    return s / Math.max(1, (x1 - x0) * (y1 - y0));
  };
}

/** The tilt of the printed lines, −12° to 12°: ink pixels on bright surroundings (text, not the
 *  table), projected at each angle; the lines are straightest where the profile is sharpest. */
export function skewAngle(px: Uint8Array, w: number, h: number, threshold: number): number {
  const mean = boxMean(px, w, h);
  const xs: number[] = [];
  const ys: number[] = [];
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (px[y * w + x] < threshold && mean(x - 8, y - 8, x + 9, y + 9) > threshold) { xs.push(x); ys.push(y); }
    }
  }
  if (xs.length < 200) return 0;
  let best = 0;
  let bestScore = -1;
  const bins = new Float64Array(2 * (w + h));
  for (let a = -12; a <= 12.001; a += 0.25) {
    const r = (a * Math.PI) / 180;
    const c = Math.cos(r);
    const s = Math.sin(r);
    bins.fill(0);
    for (let i = 0; i < xs.length; i++) bins[Math.round(ys[i] * c - xs[i] * s + w)]++;
    let score = 0;
    for (const b of bins) score += b * b;
    if (score > bestScore) { bestScore = score; best = a; }
  }
  return best;
}

/** The paper: the longest run of rows, and of columns, that are mostly brighter than the table. */
export function paperBox(px: Uint8Array, w: number, h: number, threshold: number) {
  const rows = new Array<number>(h).fill(0);
  const cols = new Array<number>(w).fill(0);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (px[y * w + x] > threshold) { rows[y]++; cols[x]++; }
  const run = (counts: number[], across: number): [number, number] => {
    let best: [number, number] | null = null;
    let start = -1;
    for (let i = 0; i <= counts.length; i++) {
      const on = i < counts.length && counts[i] / across > 0.2;
      if (on && start < 0) start = i;
      if (!on && start >= 0) {
        if (!best || i - start > best[1] - best[0]) best = [start, i];
        start = -1;
      }
    }
    return best ?? [0, counts.length];
  };
  const [y0, y1] = run(rows, w);
  const [x0, x1] = run(cols, h);
  return { x0, y0, x1, y1 };
}

/** The three preparations, as PNG buffers: the whole frame at a modest size; the paper cut out and
 *  straightened; the same, reduced to black and white. */
export async function prepareReceipt(sharp: Sharp, image: Buffer): Promise<Buffer[]> {
  const upright = await sharp(image, { failOn: 'truncated' }).rotate().toBuffer();
  const whole = await sharp(upright).resize({ width: 1200 }).grayscale().normalise().png().toBuffer();

  const look = async (buf: Buffer) => {
    const { data, info } = await sharp(buf).grayscale().resize({ width: 500 }).raw().toBuffer({ resolveWithObject: true });
    return { px: new Uint8Array(data.buffer, data.byteOffset, data.length), w: info.width, h: info.height };
  };
  let small = await look(upright);
  const threshold = otsu(small.px);
  const angle = skewAngle(small.px, small.w, small.h, threshold);
  const straight = angle ? await sharp(upright).rotate(-angle, { background: '#000' }).toBuffer() : upright;
  small = await look(straight);
  const box = paperBox(small.px, small.w, small.h, threshold);
  const meta = await sharp(straight).metadata();
  const k = (meta.width ?? small.w) / small.w;
  const margin = 0.02 * small.w;
  const left = Math.max(0, Math.round((box.x0 - margin) * k));
  const top = Math.max(0, Math.round((box.y0 - margin) * k));
  const width = Math.max(32, Math.min((meta.width ?? 0) - left, Math.round((box.x1 - box.x0 + 2 * margin) * k)));
  const height = Math.max(32, Math.min((meta.height ?? 0) - top, Math.round((box.y1 - box.y0 + 2 * margin) * k)));
  const paper = await sharp(straight).extract({ left, top, width, height }).grayscale().resize({ width: 1500 }).normalise().png().toBuffer();
  return [whole, paper, await sharp(paper).threshold(150).png().toBuffer()];
}
