/* Raster → brand vector. Used by asset.mjs `pattern`, `flatten` and `picto`.

   Everything works on raw pixel arrays with plain loops: the images are 1024 px and the
   operations (threshold, dilate, label, trace) are simple enough that a dependency would be
   more code than it saves. Tracing is potrace, one binary mask at a time. */
import sharp from 'sharp';

/* ---------- pixels ---------- */

export async function loadRgb(file) {
  const { data, info } = await sharp(file).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  return { data, W: info.width, H: info.height };
}

export function darkMask({ data, W, H }, threshold = 140) {
  const m = new Uint8Array(W * H);
  for (let i = 0; i < W * H; i++) {
    const l = 0.299 * data[i * 3] + 0.587 * data[i * 3 + 1] + 0.114 * data[i * 3 + 2];
    m[i] = l < threshold ? 1 : 0;
  }
  return m;
}

/* Square dilation, separable: r pixels in every direction. */
export function dilate(mask, W, H, r) {
  if (r <= 0) return mask;
  const tmp = new Uint8Array(W * H);
  for (let y = 0; y < H; y++) {
    let run = -1;
    for (let x = 0; x < W; x++) { if (mask[y * W + x]) run = x; if (run >= 0 && x - run <= r) tmp[y * W + x] = 1; }
    run = -1;
    for (let x = W - 1; x >= 0; x--) { if (mask[y * W + x]) run = x; if (run >= 0 && run - x <= r) tmp[y * W + x] = 1; }
  }
  const out = new Uint8Array(W * H);
  for (let x = 0; x < W; x++) {
    let run = -1;
    for (let y = 0; y < H; y++) { if (tmp[y * W + x]) run = y; if (run >= 0 && y - run <= r) out[y * W + x] = 1; }
    run = -1;
    for (let y = H - 1; y >= 0; y--) { if (tmp[y * W + x]) run = y; if (run >= 0 && run - y <= r) out[y * W + x] = 1; }
  }
  return out;
}

export function erode(mask, W, H, r) {
  const inv = new Uint8Array(W * H);
  for (let i = 0; i < W * H; i++) inv[i] = mask[i] ? 0 : 1;
  const d = dilate(inv, W, H, r);
  const out = new Uint8Array(W * H);
  for (let i = 0; i < W * H; i++) out[i] = d[i] ? 0 : 1;
  return out;
}

/* Connected components (4-neighbour) with bounding boxes, largest first. */
export function components(mask, W, H, minArea = 40) {
  const label = new Int32Array(W * H);
  const out = [];
  let next = 0;
  for (let s = 0; s < W * H; s++) {
    if (!mask[s] || label[s]) continue;
    next++;
    const st = [s];
    label[s] = next;
    let x0 = W, y0 = H, x1 = 0, y1 = 0, area = 0;
    while (st.length) {
      const i = st.pop();
      const x = i % W, y = (i / W) | 0;
      area++;
      if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y;
      if (x > 0 && mask[i - 1] && !label[i - 1]) { label[i - 1] = next; st.push(i - 1); }
      if (x < W - 1 && mask[i + 1] && !label[i + 1]) { label[i + 1] = next; st.push(i + 1); }
      if (y > 0 && mask[i - W] && !label[i - W]) { label[i - W] = next; st.push(i - W); }
      if (y < H - 1 && mask[i + W] && !label[i + W]) { label[i + W] = next; st.push(i + W); }
    }
    if (area >= minArea) out.push({ id: next, x0, y0, x1, y1, area, touchesEdge: x0 === 0 || y0 === 0 || x1 === W - 1 || y1 === H - 1 });
  }
  return { label, list: out.sort((a, b) => b.area - a.area) };
}

/* Background = the white that reaches the border. Everything else, white included, is subject. */
export function borderFill(isBg, W, H) {
  const bg = new Uint8Array(W * H);
  const st = [];
  for (let x = 0; x < W; x++) st.push(x, (H - 1) * W + x);
  for (let y = 0; y < H; y++) st.push(y * W, y * W + W - 1);
  while (st.length) {
    const i = st.pop();
    if (bg[i] || !isBg[i]) continue;
    bg[i] = 1;
    const x = i % W, y = (i / W) | 0;
    if (x > 0) st.push(i - 1);
    if (x < W - 1) st.push(i + 1);
    if (y > 0) st.push(i - W);
    if (y < H - 1) st.push(i + W);
  }
  return bg;
}

export function crop(mask, W, box, pad = 0) {
  const x0 = box.x0 - pad, y0 = box.y0 - pad;
  const w = box.x1 - box.x0 + 1 + pad * 2, h = box.y1 - box.y0 + 1 + pad * 2;
  const H = mask.length / W;
  const out = new Uint8Array(w * h);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const sx = x0 + x, sy = y0 + y;
    if (sx >= 0 && sy >= 0 && sx < W && sy < H) out[y * w + x] = mask[sy * W + sx];
  }
  return { mask: out, w, h };
}

/* ---------- tracing ---------- */

let potraceMod;
export async function trace(mask, W, H, { turd = 12, tolerance = 0.4, alpha = 1 } = {}) {
  potraceMod ||= (await import('potrace')).default;
  // potrace traces dark on light: mask 1 → black.
  const grey = Buffer.alloc(W * H);
  for (let i = 0; i < W * H; i++) grey[i] = mask[i] ? 0 : 255;
  const png = await sharp(grey, { raw: { width: W, height: H, channels: 1 } }).png().toBuffer();
  const svg = await new Promise((resolve, reject) => potraceMod.trace(png, {
    threshold: 128, turdSize: turd, optTolerance: tolerance, alphaMax: alpha, color: '#000', background: 'transparent',
  }, (e, s) => (e ? reject(e) : resolve(s))));
  const d = (svg.match(/ d="([^"]*)"/) || [])[1] || '';
  return d.trim();
}

/* ---------- palette ---------- */

export const hexRgb = (hex) => [1, 3, 5].map((o) => parseInt(hex.slice(o, o + 2), 16));

/* Nearest palette entry per pixel, after a median filter so anti-aliased edges do not invent
   in-between colours. Returns an index per pixel into `palette`. */
export async function quantize(file, palette) {
  const { data, info } = await sharp(file).removeAlpha().median(3).raw().toBuffer({ resolveWithObject: true });
  const W = info.width, H = info.height;
  const rgb = palette.map((p) => hexRgb(p.hex));
  const idx = new Uint8Array(W * H);
  for (let i = 0; i < W * H; i++) {
    const r = data[i * 3], g = data[i * 3 + 1], b = data[i * 3 + 2];
    let best = 0, bd = Infinity;
    for (let k = 0; k < rgb.length; k++) {
      const dr = r - rgb[k][0], dg = g - rgb[k][1], db = b - rgb[k][2];
      // weighted RGB distance — close enough to perceptual for five well-separated colours
      const d = 2 * dr * dr + 4 * dg * dg + 3 * db * db;
      if (d < bd) { bd = d; best = k; }
    }
    idx[i] = best;
  }
  return { idx, W, H };
}

/* Opening (erode then dilate) removes one-pixel fringes a colour picks up along another
   colour's anti-aliased edge. */
export function open(mask, W, H, r = 1) { return dilate(erode(mask, W, H, r), W, H, r); }

/* ---------- pattern ---------- */

export function mulberry(seed) {
  let a = seed >>> 0;
  return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}

/* Dart throwing on a torus: points at least `minDist` apart, measured across the tile's
   wrapped edges, so the tile repeats without seams or clumps at the joins. */
export function poissonTorus(T, minDist, rand, tries = 6000) {
  const pts = [];
  for (let t = 0; t < tries; t++) {
    const p = [rand() * T, rand() * T];
    const ok = pts.every(([x, y]) => {
      let dx = Math.abs(x - p[0]), dy = Math.abs(y - p[1]);
      dx = Math.min(dx, T - dx); dy = Math.min(dy, T - dy);
      return dx * dx + dy * dy >= minDist * minDist;
    });
    if (ok) pts.push(p);
  }
  return pts;
}
