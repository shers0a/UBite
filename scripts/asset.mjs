#!/usr/bin/env node
/* UBite asset tool — generate, review, cut out, vectorise and promote images.

   node scripts/asset.mjs gen <slug> "<subject>" [--style food] [--n 4] [--seed 1] [--size 1024x1024] [--steps 8] [--provider auto]
                                     [--pmodel gpt-image-2] [--hmodel Z-Image-Turbo]   pick the model on Pollinations / AI Horde
                                     [--provider comfy] [--quality high] [--ref none|a.png,b.png]   local FLUX.2 klein (unlimited)
   node scripts/asset.mjs batch [--only dish-,cut-] [--parallel 3]   every brief in scripts/briefs.mjs
   node scripts/asset.mjs video <slug> "<subject>" [--model nova-reel] [--duration 6]   text-to-video (Pollinations key)
   node scripts/asset.mjs i2v <slug> <image.jpg> "<motion>" [--duration 4]   image-to-video (free ZeroGPU Space)
   node scripts/asset.mjs sheet <slug|dir> [--cols 4]          contact sheet of every raw variant, for review
   node scripts/asset.mjs cutout <in> <out.png> [--key #1F4FD8] [--outline 14]
   node scripts/asset.mjs vectorize <in> <out.svg> [--threshold 150] [--turd 24]
   node scripts/asset.mjs promote <raw> <dest> [--status placeholder|final|exploration] [--width 1200] [--crop 0.78]
   node scripts/asset.mjs record <file> --source <s> --licence <l> [--author a] [--prompt p] [--status s]
   node scripts/asset.mjs pattern <out.svg> <doodle-sheet.jpg…> [--tile 640] [--preview]   seamless doodle wallpaper
   node scripts/asset.mjs flatten <flat.jpg> <out.svg>     flat scene → one traced layer per token colour
   node scripts/asset.mjs picto <sheet.jpg> <dir> --names a,b,…   pictogram sheet → single two-layer SVGs

   Raw generations land in assets/_raw/<slug>/ (gitignored) with an index.json of prompts and
   seeds. Only what is promoted enters assets/ and assets/manifest.json. Keys come from .env
   (see .env.example); providers are tried in ASSET_PROVIDERS order with automatic fallback. */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import { PRESETS, STYLE_NAMES } from './art-direction.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const RAW = path.join(ROOT, 'assets', '_raw');
const MANIFEST = path.join(ROOT, 'assets', 'manifest.json');
const rel = (p) => path.relative(ROOT, path.resolve(p)).split(path.sep).join('/');
const today = () => new Date().toISOString().slice(0, 10);

/* ---------- env and args ---------- */

function loadEnv() {
  const f = path.join(ROOT, '.env');
  if (!fs.existsSync(f)) return;
  for (const line of fs.readFileSync(f, 'utf8').split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
  }
}

function parseArgs(argv) {
  const pos = [];
  const opt = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith('--')) {
      const key = a.slice(2);
      const next = argv[i + 1];
      if (next === undefined || next.startsWith('--')) opt[key] = true;
      else { opt[key] = next; i++; }
    } else pos.push(a);
  }
  return { pos, opt };
}

const die = (msg) => { console.error(msg); process.exit(1); };

/* ---------- providers ---------- */

class ProviderError extends Error {}

const PROVIDERS = {
  async cloudflare(args) {
    const { prompt, seed, steps, width, height } = args;
    const { CF_ACCOUNT_ID: account, CF_API_TOKEN: token } = process.env;
    if (!account || !token) throw new ProviderError('CF_ACCOUNT_ID / CF_API_TOKEN missing in .env');
    const model = args.model || process.env.CF_MODEL || '@cf/black-forest-labs/flux-2-klein-9b';
    const url = `https://api.cloudflare.com/client/v4/accounts/${account}/ai/run/${model}`;
    const auth = { Authorization: `Bearer ${token}` };
    let res;
    if (model.includes('flux-2')) {
      // FLUX.2 models take multipart form data.
      const form = new FormData();
      form.append('prompt', prompt);
      form.append('width', String(width));
      form.append('height', String(height));
      form.append('seed', String(seed));
      res = await fetch(url, { method: 'POST', headers: auth, body: form });
    } else if (model.includes('leonardo')) {
      // Leonardo models honour size and seed; phoenix answers with raw JPEG bytes.
      const body = { prompt, width, height, seed, num_steps: steps };
      if (model.includes('lucid')) body.guidance = 4.5;
      res = await fetch(url, { method: 'POST', headers: { ...auth, 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    } else {
      // flux-1-schnell: square output, no seed parameter.
      res = await fetch(url, {
        method: 'POST', headers: { ...auth, 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, steps: Math.min(steps, 8) }),
      });
    }
    if (res.ok && (res.headers.get('content-type') || '').startsWith('image/')) {
      return { buffer: Buffer.from(await res.arrayBuffer()), model };
    }
    const text = await res.text();
    let json;
    try { json = JSON.parse(text); } catch { throw new ProviderError(`cloudflare HTTP ${res.status}: ${text.slice(0, 200)}`); }
    if (!res.ok || json.success === false) {
      const why = (json.errors || []).map((e) => `${e.code} ${e.message}`).join('; ') || `HTTP ${res.status}`;
      throw new ProviderError(`cloudflare: ${why}`);
    }
    const b64 = json.result?.image;
    if (!b64) throw new ProviderError('cloudflare: no image in response');
    return { buffer: Buffer.from(b64, 'base64'), model };
  },

  /* A public Hugging Face Space on ZeroGPU: free, slower (~10s), limited only by the account's
     daily GPU minutes. The fallback when Cloudflare's daily allocation is spent. */
  async space({ prompt, seed, width, height }) {
    const spaceId = process.env.HF_SPACE || 'black-forest-labs/FLUX.1-schnell';
    const { Client } = await import('@gradio/client');
    const run = async (token) => {
      const app = await Client.connect(spaceId, token ? { token } : {});
      const r = await app.predict('/infer', {
        prompt, seed, randomize_seed: false,
        width: Math.min(width, 1024), height: Math.min(height, 1024), num_inference_steps: 4,
      });
      const file = Array.isArray(r.data) ? r.data[0] : null;
      if (!file?.url) throw new Error('no image in response');
      const res = await fetch(file.url, token ? { headers: { Authorization: `Bearer ${token}` } } : {});
      if (!res.ok) throw new Error(`download HTTP ${res.status}`);
      return { buffer: Buffer.from(await res.arrayBuffer()), model: `space:${spaceId}` };
    };
    // The account's ZeroGPU minutes come first; anonymous visitors get a separate, smaller
    // allowance per IP, which is the second chance once the account's is spent.
    try { return await run(process.env.HF_TOKEN); } catch (first) {
      if (!process.env.HF_TOKEN || !/quota/i.test(String(first.message || first))) throw new ProviderError(`space: ${String(first.message || first).slice(0, 200)}`);
      try { return await run(null); } catch (e) { throw new ProviderError(`space (account and anonymous quota spent): ${String(e.message || e).slice(0, 160)}`); }
    }
  },

  /* Pollinations: one free key (enter.pollinations.ai, GitHub login) and a daily pollen
     allowance that covers FLUX.1-schnell, Z-Image, FLUX.2 klein and the GPT-Image models.
     GPT-Image draws clean line art and marks; FLUX keeps the food set consistent. */
  async pollinations({ prompt, seed, width, height, style, pmodel }) {
    const key = process.env.POLLINATIONS_KEY;
    if (!key) throw new ProviderError('pollinations: POLLINATIONS_KEY missing in .env (free at enter.pollinations.ai)');
    const drawn = ['mark', 'line', 'spot', 'doodles', 'picto', 'flat', 'sketch'];
    const model = pmodel || process.env.POLLINATIONS_MODEL || (drawn.includes(style) ? 'gptimage' : 'flux');
    const q = new URLSearchParams({ model, width: String(width), height: String(height), seed: String(seed), nologo: 'true', safe: 'true' });
    const res = await fetch(`https://gen.pollinations.ai/image/${encodeURIComponent(prompt)}?${q}`, { headers: { Authorization: `Bearer ${key}` } });
    const type = res.headers.get('content-type') || '';
    if (!res.ok || !type.startsWith('image/')) {
      const text = (await res.text()).slice(0, 200);
      throw new ProviderError(`pollinations HTTP ${res.status}${/pollen|balance|credit/i.test(text) ? ' (daily pollen used up)' : ''}: ${text}`);
    }
    return { buffer: Buffer.from(await res.arrayBuffer()), model: `pollinations:${model}` };
  },

  /* AI Horde: volunteer GPUs, free, no account needed (anonymous key = lowest priority; a free
     registered key in HORDE_KEY queues faster). Slow — a minute or more per image — but it has
     no daily cap. FLUX.1-schnell by default; HORDE_MODEL can name an SDXL model instead. */
  async horde({ prompt, seed, width, height, hmodel }) {
    const apikey = process.env.HORDE_KEY || '0000000000';
    const model = hmodel || process.env.HORDE_MODEL || 'Flux.1-Schnell fp8 (Compact)';
    // Distilled models (FLUX schnell, Z-Image-Turbo) want few steps, no CFG, no negative prompt.
    const flux = /flux|z-image/i.test(model);
    const headers = { apikey, 'Content-Type': 'application/json', 'Client-Agent': 'ubite-assets:1.0:github.com/shers0a/UBite' };
    const api = 'https://aihorde.net/api/v2';
    const side = (v) => Math.min(1024, Math.round(v / 64) * 64);
    const body = {
      prompt: flux ? prompt : `${prompt} ### text, watermark, logo, signature, blurry, deformed, extra fingers, cartoon, 3d render`,
      params: flux
        ? { sampler_name: 'k_euler', cfg_scale: 1, steps: /z-image/i.test(model) ? 8 : 4, width: side(width), height: side(height), seed: String(seed), karras: false, n: 1 }
        : { sampler_name: 'k_dpmpp_2m', cfg_scale: 6, steps: 28, width: side(width), height: side(height), seed: String(seed), karras: true, n: 1 },
      models: [model], nsfw: false, censor_nsfw: true, r2: true, shared: false, slow_workers: true, trusted_workers: false,
    };
    const post = await fetch(`${api}/generate/async`, { method: 'POST', headers, body: JSON.stringify(body) });
    const job = await post.json().catch(() => ({}));
    if (!post.ok || !job.id) throw new ProviderError(`horde: HTTP ${post.status} ${job.message || ''}`.trim());
    const deadline = Date.now() + Number(process.env.HORDE_TIMEOUT || 900) * 1000;
    while (Date.now() < deadline) {
      await new Promise((r) => setTimeout(r, 6000));
      const chk = await (await fetch(`${api}/generate/check/${job.id}`, { headers })).json().catch(() => ({}));
      if (chk.faulted) throw new ProviderError('horde: job faulted');
      if (chk.is_possible === false) throw new ProviderError(`horde: no worker can take this job (${model})`);
      if (!chk.done) continue;
      const st = await (await fetch(`${api}/generate/status/${job.id}`, { headers })).json();
      const gen = st.generations?.[0];
      if (!gen?.img || gen.censored) throw new ProviderError('horde: empty or censored result');
      const img = gen.img.startsWith('http') ? Buffer.from(await (await fetch(gen.img)).arrayBuffer()) : Buffer.from(gen.img, 'base64');
      return { buffer: img, model: `horde:${gen.model || model}` };
    }
    await fetch(`${api}/generate/status/${job.id}`, { method: 'DELETE', headers }).catch(() => {});
    throw new ProviderError('horde: timed out in the queue');
  },

  /* Local and unlimited: FLUX.2 [klein] 4B (Apache-2.0) in ComfyUI on this laptop's GPU
     (`npm run ai:start`, see scripts/local-ai.mjs). The locked brand styles get their reference
     sheet from assets/style/ attached as a reference image, so the drawing comes out in the
     approved hand; `--ref none` turns that off, `--ref a.png,b.png` picks others. */
  async comfy({ prompt, seed, width, height, style, refs, quality }) {
    const url = process.env.COMFY_URL || 'http://127.0.0.1:8188';
    const up = await fetch(`${url}/system_stats`).then((r) => r.ok).catch(() => false);
    if (!up) throw new ProviderError('comfy: ComfyUI is not running (npm run ai:start)');
    const base = quality === 'high';
    const unet = process.env.COMFY_MODEL || (base ? 'flux-2-klein-base-4b-fp8.safetensors' : 'flux-2-klein-4b-fp8.safetensors');
    const REF = { spot: 'characters.png', picto: 'pictograms.png', flat: 'scenes.png', doodles: 'wallpaper.png' };
    const refFiles = refs === 'none' ? [] : refs ? String(refs).split(',') : REF[style] ? [path.join(ROOT, 'assets', 'style', REF[style])] : [];
    const names = [];
    for (const f of refFiles) {
      const form = new FormData();
      form.append('image', new Blob([fs.readFileSync(f)]), `ubite-ref-${path.basename(f)}`);
      form.append('overwrite', 'true');
      const r = await fetch(`${url}/upload/image`, { method: 'POST', body: form });
      if (!r.ok) throw new ProviderError(`comfy: reference upload HTTP ${r.status}`);
      names.push((await r.json()).name);
    }
    const side = (v) => Math.round(v / 16) * 16;
    const W = side(width), H = side(height);
    const text = names.length ? `Use the reference image only for its drawing style — same line, same ink, same palette — never copy its figures or layout. ${prompt}` : prompt;
    // API-format graph, the same nodes as ComfyUI's own FLUX.2 klein templates.
    const g = {
      unet: { class_type: 'UNETLoader', inputs: { unet_name: unet, weight_dtype: 'default' } },
      clip: { class_type: 'CLIPLoader', inputs: { clip_name: 'qwen_3_4b.safetensors', type: 'flux2', device: 'default' } },
      vae: { class_type: 'VAELoader', inputs: { vae_name: 'flux2-vae.safetensors' } },
      pos: { class_type: 'CLIPTextEncode', inputs: { text, clip: ['clip', 0] } },
      neg: base ? { class_type: 'CLIPTextEncode', inputs: { text: '', clip: ['clip', 0] } } : { class_type: 'ConditioningZeroOut', inputs: { conditioning: ['pos', 0] } },
      latent: { class_type: 'EmptyFlux2LatentImage', inputs: { width: W, height: H, batch_size: 1 } },
      sched: { class_type: 'Flux2Scheduler', inputs: { steps: base ? 28 : 4, width: W, height: H } },
      sampler: { class_type: 'KSamplerSelect', inputs: { sampler_name: 'euler' } },
      noise: { class_type: 'RandomNoise', inputs: { noise_seed: seed } },
    };
    let pos = ['pos', 0], neg = ['neg', 0];
    names.forEach((n, i) => {
      g[`ref${i}`] = { class_type: 'LoadImage', inputs: { image: n } };
      g[`refs${i}`] = { class_type: 'ImageScaleToTotalPixels', inputs: { image: [`ref${i}`, 0], upscale_method: 'nearest-exact', megapixels: 1, resolution_steps: 1 } };
      g[`refl${i}`] = { class_type: 'VAEEncode', inputs: { pixels: [`refs${i}`, 0], vae: ['vae', 0] } };
      g[`rp${i}`] = { class_type: 'ReferenceLatent', inputs: { conditioning: pos, latent: [`refl${i}`, 0] } };
      g[`rn${i}`] = { class_type: 'ReferenceLatent', inputs: { conditioning: neg, latent: [`refl${i}`, 0] } };
      pos = [`rp${i}`, 0]; neg = [`rn${i}`, 0];
    });
    Object.assign(g, {
      guider: { class_type: 'CFGGuider', inputs: { model: ['unet', 0], positive: pos, negative: neg, cfg: base ? 4 : 1 } },
      sample: { class_type: 'SamplerCustomAdvanced', inputs: { noise: ['noise', 0], guider: ['guider', 0], sampler: ['sampler', 0], sigmas: ['sched', 0], latent_image: ['latent', 0] } },
      decode: { class_type: 'VAEDecode', inputs: { samples: ['sample', 0], vae: ['vae', 0] } },
      save: { class_type: 'SaveImage', inputs: { images: ['decode', 0], filename_prefix: 'ubite' } },
    });
    const post = await fetch(`${url}/prompt`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ prompt: g }) });
    const job = await post.json().catch(() => ({}));
    if (!post.ok || !job.prompt_id) {
      const why = Object.entries(job.node_errors || {}).map(([n, e]) => `${n}: ${(e.errors || []).map((x) => `${x.message} ${x.details || ''}`).join('; ')}`).join(' | ');
      throw new ProviderError(`comfy: ${why || JSON.stringify(job.error || job).slice(0, 300)}`);
    }
    const deadline = Date.now() + 15 * 60 * 1000;
    while (Date.now() < deadline) {
      await new Promise((r) => setTimeout(r, 1500));
      const h = (await (await fetch(`${url}/history/${job.prompt_id}`)).json())[job.prompt_id];
      if (!h) continue;
      if (h.status?.status_str === 'error') throw new ProviderError(`comfy: ${JSON.stringify(h.status.messages).slice(0, 300)}`);
      const img = h.outputs?.save?.images?.[0];
      if (!img) continue;
      const q = new URLSearchParams({ filename: img.filename, subfolder: img.subfolder, type: img.type });
      const buffer = Buffer.from(await (await fetch(`${url}/view?${q}`)).arrayBuffer());
      return { buffer, model: `comfy:${unet.replace(/\.safetensors$/, '')}${names.length ? '+style-ref' : ''}` };
    }
    throw new ProviderError('comfy: timed out');
  },

  async hf({ prompt, seed, steps, width, height }) {
    const token = process.env.HF_TOKEN;
    if (!token) throw new ProviderError('HF_TOKEN missing in .env');
    const model = process.env.HF_MODEL || 'black-forest-labs/FLUX.1-schnell';
    // The official client routes to whichever inference provider serves the model today.
    const { InferenceClient } = await import('@huggingface/inference');
    try {
      const blob = await new InferenceClient(token).textToImage({
        provider: process.env.HF_PROVIDER || 'auto', model, inputs: prompt,
        parameters: { width, height, seed, num_inference_steps: Math.min(steps, 4) },
      }, { outputType: 'blob' });
      return { buffer: Buffer.from(await blob.arrayBuffer()), model };
    } catch (e) {
      const hint = /402|credit|quota/i.test(e.message) ? ' (free monthly credit used up)' : '';
      throw new ProviderError(`hf${hint}: ${e.message.slice(0, 240)}`);
    }
  },
};

async function generate(args) {
  const order = (args.provider && args.provider !== 'auto' ? args.provider : process.env.ASSET_PROVIDERS || 'comfy,cloudflare,pollinations,space,horde,hf')
    .split(',').map((s) => s.trim()).filter(Boolean);
  const errors = [];
  for (const name of order) {
    const fn = PROVIDERS[name];
    if (!fn) { errors.push(`${name}: unknown provider`); continue; }
    try {
      const out = await fn(args);
      return { ...out, provider: name };
    } catch (e) {
      errors.push(e.message);
      if (!(e instanceof ProviderError)) throw e;
    }
  }
  throw new Error(`every provider failed:\n  ${errors.join('\n  ')}`);
}

/* ---------- raw index ---------- */

const indexPath = (slug) => path.join(RAW, slug, 'index.json');
function readIndex(slug) {
  const p = indexPath(slug);
  return fs.existsSync(p) ? JSON.parse(fs.readFileSync(p, 'utf8')) : [];
}
function findRawEntry(file) {
  const abs = path.resolve(file);
  const slug = path.basename(path.dirname(abs));
  const idx = readIndex(slug);
  // A derived file (x-cutout.png) inherits the prompt of the raw it came from (x.jpg).
  const base = abs.replace(/-(cutout|vector)\.(png|svg)$/i, '.jpg');
  return idx.find((e) => path.resolve(ROOT, e.file) === abs) || idx.find((e) => path.resolve(ROOT, e.file) === base);
}

/* ---------- manifest ---------- */

function readManifest() {
  return fs.existsSync(MANIFEST) ? JSON.parse(fs.readFileSync(MANIFEST, 'utf8')) : { assets: [] };
}
function recordAsset(row) {
  const m = readManifest();
  m.assets = (m.assets || []).filter((a) => a.file !== row.file);
  m.assets.push({ added: today(), ...row });
  m.assets.sort((a, b) => a.file.localeCompare(b.file));
  fs.writeFileSync(MANIFEST, JSON.stringify(m, null, 2) + '\n');
}

/* ---------- commands ---------- */

async function cmdGen(pos, opt) {
  const [slug, subject] = pos;
  if (!slug || !subject) die('usage: asset.mjs gen <slug> "<subject>" [--style ' + STYLE_NAMES.join('|') + '] [--n 4]');
  const style = opt.style || 'food';
  const preset = PRESETS[style];
  if (!preset) die(`unknown style "${style}" — one of ${STYLE_NAMES.join(', ')}`);
  const [w, h] = opt.size ? opt.size.split('x').map(Number) : preset.size;
  const n = Number(opt.n || 1);
  const seed0 = Number(opt.seed || 1 + Math.floor(Math.random() * 90000));
  const steps = Number(opt.steps || 8);
  const prompt = preset.build(subject);
  const dir = path.join(RAW, slug);
  fs.mkdirSync(dir, { recursive: true });
  const index = readIndex(slug);

  for (let i = 0; i < n; i++) {
    const seed = seed0 + i;
    const t0 = Date.now();
    const { buffer, provider, model } = await generate({ prompt, seed, steps, width: w, height: h, style, provider: opt.provider, model: opt.model, pmodel: opt.pmodel, hmodel: opt.hmodel, refs: opt.ref, quality: opt.quality });
    // Normalise to the requested frame: providers without width/height return a square.
    const img = sharp(buffer);
    const meta = await img.metadata();
    const out = path.join(dir, `${slug}-s${seed}.jpg`);
    // Photos are cropped to fill; drawings are letterboxed on white, because a crop cuts off
    // whatever the model drew near the edge (a pictogram sheet lost four of eight that way).
    const drawn = ['mark', 'line', 'spot', 'doodles', 'picto', 'flat', 'sketch'].includes(style);
    const pipeline = meta.width === w && meta.height === h ? img
      : drawn ? img.resize(w, h, { fit: 'contain', background: '#FFFFFF' }) : img.resize(w, h, { fit: 'cover', position: 'attention' });
    await pipeline.jpeg({ quality: 92 }).toFile(out);
    index.push({ file: rel(out), slug, style, subject, prompt, seed, steps, provider, model, width: w, height: h, date: today() });
    fs.writeFileSync(indexPath(slug), JSON.stringify(index, null, 2) + '\n');
    console.log(`→ ${rel(out)}  ${provider} ${((Date.now() - t0) / 1000).toFixed(1)}s`);
  }
}

/* Text-to-video through Pollinations (needs POLLINATIONS_KEY). Nova Reel runs on the free daily
   pollen: 6 seconds, 1280×720, no people in the ambient preset. Saved raw; promote like an image. */
async function cmdVideo(pos, opt) {
  const [slug, subject] = pos;
  if (!slug || !subject) die('usage: asset.mjs video <slug> "<subject>" [--style ambient] [--model nova-reel] [--duration 6] [--seed 1]');
  const key = process.env.POLLINATIONS_KEY;
  if (!key) die('POLLINATIONS_KEY missing in .env — free at https://enter.pollinations.ai/keys');
  const style = opt.style || 'ambient';
  const prompt = PRESETS[style].build(subject) + ' Slow, steady camera, gentle natural motion only.';
  const model = opt.model || 'nova-reel';
  const seed = Number(opt.seed || 1 + Math.floor(Math.random() * 90000));
  const q = new URLSearchParams({ model, duration: String(opt.duration || 6), width: '1280', height: '720', seed: String(seed), nologo: 'true', audio: 'false' });
  const t0 = Date.now();
  const res = await fetch(`https://gen.pollinations.ai/video/${encodeURIComponent(prompt)}?${q}`, { headers: { Authorization: `Bearer ${key}` } });
  const type = res.headers.get('content-type') || '';
  if (!res.ok || !type.startsWith('video/')) throw new Error(`pollinations video HTTP ${res.status}: ${(await res.text()).slice(0, 200)}`);
  const dir = path.join(RAW, slug);
  fs.mkdirSync(dir, { recursive: true });
  const out = path.join(dir, `${slug}-s${seed}.mp4`);
  fs.writeFileSync(out, Buffer.from(await res.arrayBuffer()));
  const index = readIndex(slug);
  index.push({ file: rel(out), slug, style, subject, prompt, seed, provider: 'pollinations', model: `pollinations:${model}`, date: today() });
  fs.writeFileSync(indexPath(slug), JSON.stringify(index, null, 2) + '\n');
  console.log(`→ ${rel(out)}  pollinations:${model} ${((Date.now() - t0) / 1000).toFixed(1)}s`);
}

/* Image-to-video on a free ZeroGPU Space (Wan 2.2): animates one of our own stills, so the
   clip keeps the art direction of the image it starts from. Costs ZeroGPU minutes (account,
   then anonymous), which refill over the day. */
async function cmdI2v(pos, opt) {
  const [slug, image, motion] = pos;
  if (!slug || !image || !motion) die('usage: asset.mjs i2v <slug> <image.jpg> "<motion>" [--duration 4] [--steps 6] [--seed 1]');
  const spaceId = opt.space || process.env.HF_VIDEO_SPACE || 'zerogpu-aoti/wan2-2-fp8da-aoti-faster';
  const { Client, handle_file } = await import('@gradio/client');
  const seed = Number(opt.seed || 1 + Math.floor(Math.random() * 90000));
  const prompt = `${motion}. Slow, calm, natural motion only; the camera stays still; no people, no text.`;
  const run = async (token) => {
    const app = await Client.connect(spaceId, token ? { token } : {});
    const r = await app.predict('/generate_video', {
      input_image: handle_file(path.resolve(image)), prompt, steps: Number(opt.steps || 6),
      negative_prompt: 'text, watermark, people, faces, hands, flicker, jump cut, camera shake, morphing',
      duration_seconds: Number(opt.duration || 4), guidance_scale: 1, guidance_scale_2: 1, seed, randomize_seed: false,
    });
    const v = Array.isArray(r.data) ? r.data[0] : r.data;
    const url = v?.video?.url || v?.url;
    if (!url) throw new Error(`no video in response: ${JSON.stringify(r.data).slice(0, 160)}`);
    const res = await fetch(url, token ? { headers: { Authorization: `Bearer ${token}` } } : {});
    if (!res.ok) throw new Error(`download HTTP ${res.status}`);
    return Buffer.from(await res.arrayBuffer());
  };
  const t0 = Date.now();
  let buf;
  try { buf = await run(process.env.HF_TOKEN); } catch (e) {
    if (!/quota/i.test(String(e.message || e))) throw e;
    console.log('  account GPU quota spent, trying anonymous…');
    buf = await run(null);
  }
  const dir = path.join(RAW, slug);
  fs.mkdirSync(dir, { recursive: true });
  const out = path.join(dir, `${slug}-s${seed}.mp4`);
  fs.writeFileSync(out, buf);
  const index = readIndex(slug);
  index.push({ file: rel(out), slug, style: 'i2v', subject: motion, prompt, seed, source: rel(image), provider: 'space', model: `space:${spaceId}`, date: today() });
  fs.writeFileSync(indexPath(slug), JSON.stringify(index, null, 2) + '\n');
  console.log(`→ ${rel(out)}  ${spaceId} ${((Date.now() - t0) / 1000).toFixed(1)}s`);
}

/* Runs scripts/briefs.mjs. Seeds derive from the slug, so a re-run skips what exists and
   reproduces the same candidates. Three briefs at a time. */
async function cmdBatch(pos, opt) {
  const { BRIEFS } = await import('./briefs.mjs');
  const only = opt.only && opt.only !== true ? String(opt.only).split(',') : null;
  const todo = BRIEFS.filter((b) => !only || only.some((p) => b.slug.startsWith(p)));
  const hash = (str) => [...str].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7) % 90000 + 100;
  const queue = todo.map((b) => async () => {
    const have = readIndex(b.slug).filter((e) => fs.existsSync(path.join(ROOT, e.file))).length;
    const n = (opt.n ? Number(opt.n) : b.n) - have;
    if (n <= 0 && !opt.force) return console.log(`· ${b.slug} — ${have} already, skipped`);
    const seed = (b.seed || hash(b.slug)) + have;
    try {
      await cmdGen([b.slug, b.subject], { style: b.style, n: Math.max(n, 1), seed, size: b.size, model: b.model, pmodel: b.pmodel, hmodel: b.hmodel, ref: b.ref, quality: opt.quality || b.quality, provider: opt.provider || b.provider });
    } catch (e) { console.error(`✗ ${b.slug}: ${e.message}`); }
  });
  const workers = Array.from({ length: Number(opt.parallel || 3) }, async () => { while (queue.length) await queue.shift()(); });
  await Promise.all(workers);
  console.log(`batch done — ${todo.length} brief(s)`);
}

async function cmdSheet(pos, opt) {
  const target = pos[0];
  if (!target) die('usage: asset.mjs sheet <slug|dir> [--cols 4] [--cell 320]');
  // A directory, a raw slug, or a slug prefix ("dish-") that gathers several slugs.
  const isImg = (f) => /\.(jpe?g|png|webp)$/i.test(f) && !f.startsWith('_sheet');
  let dir = fs.existsSync(target) ? path.resolve(target) : path.join(RAW, target);
  let files;
  if (fs.existsSync(dir)) files = fs.readdirSync(dir).filter(isImg).sort();
  else {
    const slugs = fs.readdirSync(RAW).filter((d) => d.startsWith(target) && fs.statSync(path.join(RAW, d)).isDirectory()).sort();
    files = slugs.flatMap((d) => fs.readdirSync(path.join(RAW, d)).filter(isImg).map((f) => path.join(d, f)));
    dir = RAW;
  }
  if (!files.length) die(`no images for ${target}`);
  const cols = Number(opt.cols || 4);
  const cell = Number(opt.cell || 320);
  const label = 28;
  const rows = Math.ceil(files.length / cols);
  const tiles = await Promise.all(files.map(async (f, i) => {
    const img = await sharp(path.join(dir, f)).resize(cell, cell, { fit: 'contain', background: '#E2E6EB' }).toBuffer();
    const text = Buffer.from(`<svg width="${cell}" height="${label}"><rect width="100%" height="100%" fill="#11161B"/><text x="8" y="19" font-family="Segoe UI, Arial" font-size="14" fill="#F2F5F8">${i + 1}. ${path.basename(f).replace(/\.(jpe?g|png|webp)$/i, '').replace(/^(dish|cut|ill|mark|amb)-/, '')}</text></svg>`);
    const x = (i % cols) * cell;
    const y = Math.floor(i / cols) * (cell + label);
    return [{ input: img, left: x, top: y }, { input: text, left: x, top: y + cell }];
  }));
  const out = dir === RAW ? path.join(RAW, `_sheet-${target.replace(/[^a-z0-9-]/gi, '')}.jpg`) : path.join(dir, '_sheet.jpg');
  await sharp({ create: { width: cols * cell, height: rows * (cell + label), channels: 3, background: '#ECEFF3' } })
    .composite(tiles.flat()).jpeg({ quality: 85 }).toFile(out);
  console.log(`✓ ${rel(out)}  (${files.length} images)`);
}

/* Keys a flat backdrop out by flood-filling from the border (so blue INSIDE the subject is
   kept), feathers the edge, then grows a white sticker outline under the subject. */
async function cmdCutout(pos, opt) {
  const [input, output] = pos;
  if (!input || !output) die('usage: asset.mjs cutout <in> <out.png> [--key #1F4FD8] [--tolerance 70] [--outline 14]');
  const { data, info } = await sharp(input).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width: W, height: H } = info;
  // Sample the key from the four corners unless one is given.
  let key;
  if (opt.key && opt.key !== true) {
    const hex = opt.key.replace('#', '');
    key = [0, 2, 4].map((o) => parseInt(hex.slice(o, o + 2), 16));
  } else {
    const pts = [[4, 4], [W - 5, 4], [4, H - 5], [W - 5, H - 5]];
    key = [0, 1, 2].map((c) => Math.round(pts.reduce((s, [x, y]) => s + data[(y * W + x) * 3 + c], 0) / 4));
  }
  // A blue backdrop is judged by blue dominance (b − max(r,g)) rather than by distance to one
  // colour, so gradients, vignettes and the dish's own shadow all key out. Any other backdrop
  // falls back to plain colour distance.
  const blueKey = key[2] - Math.max(key[0], key[1]) > 40;
  const tol = Number(opt.tolerance || (blueKey ? 38 : 70));
  // White ceramic that reflects the backdrop is blue-ish but unsaturated; the backdrop and its
  // shadow are saturated. Only saturated blue counts as background.
  const blueness = (i) => {
    const r = data[i * 3], g = data[i * 3 + 1], b = data[i * 3 + 2];
    const sat = b ? (b - Math.min(r, g)) / b : 0;
    return sat > 0.55 ? b - Math.max(r, g) : 0;
  };
  const dist = blueKey
    ? (i) => tol * 2 - blueness(i)
    : (i) => Math.hypot(data[i * 3] - key[0], data[i * 3 + 1] - key[1], data[i * 3 + 2] - key[2]);
  const bg = new Uint8Array(W * H);
  const stack = [];
  for (let x = 0; x < W; x++) stack.push(x, (H - 1) * W + x);
  for (let y = 0; y < H; y++) stack.push(y * W, y * W + W - 1);
  while (stack.length) {
    const i = stack.pop();
    if (bg[i] || dist(i) > tol) continue;
    bg[i] = 1;
    const x = i % W, y = (i / W) | 0;
    if (x > 0) stack.push(i - 1);
    if (x < W - 1) stack.push(i + 1);
    if (y > 0) stack.push(i - W);
    if (y < H - 1) stack.push(i + W);
  }
  // Soft alpha on the boundary: pixels near the key colour become partly transparent.
  const alpha = Buffer.alloc(W * H);
  for (let i = 0; i < W * H; i++) {
    if (bg[i]) { alpha[i] = 0; continue; }
    const d = dist(i);
    alpha[i] = d < tol * 1.6 ? Math.round(255 * Math.min(1, (d - tol) / (tol * 0.6))) : 255;
  }
  // Keep only the largest solid shape: stray shadow islands and speckles go.
  {
    const label = new Int32Array(W * H);
    let best = 0, bestSize = 0, next = 0;
    const sizes = [0];
    for (let s = 0; s < W * H; s++) {
      if (label[s] || alpha[s] < 128) continue;
      next++; let size = 0; const st = [s]; label[s] = next;
      while (st.length) {
        const i = st.pop(); size++;
        const x = i % W, y = (i / W) | 0;
        for (const j of [x > 0 ? i - 1 : -1, x < W - 1 ? i + 1 : -1, y > 0 ? i - W : -1, y < H - 1 ? i + W : -1]) {
          if (j >= 0 && !label[j] && alpha[j] >= 128) { label[j] = next; st.push(j); }
        }
      }
      sizes.push(size);
      if (size > bestSize) { bestSize = size; best = next; }
    }
    for (let i = 0; i < W * H; i++) if (label[i] !== best && (label[i] || alpha[i] < 128)) {
      // soft edge pixels next to the kept shape survive; everything else is cleared
      const x = i % W, y = (i / W) | 0;
      const nearBest = !label[i] && ((x > 0 && label[i - 1] === best) || (x < W - 1 && label[i + 1] === best) || (y > 0 && label[i - W] === best) || (y < H - 1 && label[i + W] === best));
      if (!nearBest) alpha[i] = 0;
    }
  }
  // Erode one pixel so no backdrop-coloured fringe survives along the edge.
  const eroded = Buffer.from(alpha);
  for (let y = 1; y < H - 1; y++) for (let x = 1; x < W - 1; x++) {
    const i = y * W + x;
    eroded[i] = Math.min(alpha[i], alpha[i - 1], alpha[i + 1], alpha[i - W], alpha[i + W]);
  }
  alpha.set(eroded);
  // Despill: pull the key colour out of semi-transparent edge pixels.
  const rgb = Buffer.from(data);
  for (let i = 0; i < W * H; i++) {
    if (alpha[i] > 0 && alpha[i] < 255) {
      if (blueKey) { rgb[i * 3 + 2] = Math.min(data[i * 3 + 2], Math.max(data[i * 3], data[i * 3 + 1]) + 6); continue; }
      const a = alpha[i] / 255;
      for (let c = 0; c < 3; c++) rgb[i * 3 + c] = Math.max(0, Math.min(255, Math.round((data[i * 3 + c] - key[c] * (1 - a)) / Math.max(a, 0.2))));
    }
  }
  const subject = await sharp(rgb, { raw: { width: W, height: H, channels: 3 } })
    .joinChannel(alpha, { raw: { width: W, height: H, channels: 1 } }).png().toBuffer();
  const outline = Number(opt.outline ?? 14);
  let result = subject;
  if (outline > 0) {
    // Grow the silhouette: blur the alpha, then keep everything the blur reached, with a
    // one-pixel anti-aliased edge so the sticker border stays crisp.
    const blurred = await sharp(alpha, { raw: { width: W, height: H, channels: 1 } })
      .blur(outline / 2).extractChannel(0).raw().toBuffer();
    const grown = Buffer.alloc(W * H);
    for (let i = 0; i < W * H; i++) grown[i] = Math.max(alpha[i], Math.round(255 * Math.min(1, Math.max(0, (blurred[i] - 6) / 10))));
    const white = await sharp({ create: { width: W, height: H, channels: 3, background: '#FFFFFF' } })
      .joinChannel(grown, { raw: { width: W, height: H, channels: 1 } }).png().toBuffer();
    result = await sharp(white).composite([{ input: subject }]).png().toBuffer();
  }
  await sharp(result).trim({ threshold: 1 }).extend({ top: 12, bottom: 12, left: 12, right: 12, background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png().toFile(output);
  console.log(`✓ ${rel(output)}  key rgb(${key.join(',')})`);
}

async function cmdVectorize(pos, opt) {
  const [input, output] = pos;
  if (!input || !output) die('usage: asset.mjs vectorize <in> <out.svg> [--threshold 150] [--turd 24]');
  const { default: potrace } = await import('potrace');
  const png = await sharp(input).greyscale().normalise().png().toBuffer();
  const svg = await new Promise((resolve, reject) => {
    potrace.trace(png, {
      threshold: Number(opt.threshold || 150), turdSize: Number(opt.turd || 24),
      optTolerance: 0.4, color: 'currentColor', background: 'transparent',
    }, (err, s) => (err ? reject(err) : resolve(s)));
  });
  // currentColor lets the theme colour the drawing; drop the fixed pixel size.
  const clean = svg.replace(/ width="\d+" height="\d+"/, '').replace('<svg ', '<svg fill="currentColor" ');
  fs.mkdirSync(path.dirname(output), { recursive: true });
  fs.writeFileSync(output, clean);
  console.log(`✓ ${rel(output)}  ${(clean.length / 1024).toFixed(1)} KB`);
}

async function cmdPromote(pos, opt) {
  const [input, dest] = pos;
  if (!input || !dest) die('usage: asset.mjs promote <raw> <dest.webp|png|svg> [--status placeholder] [--width 1200]');
  const entry = findRawEntry(input) || {};
  const status = opt.status || 'placeholder';
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  const ext = path.extname(dest).toLowerCase();
  if (ext === '.svg' || ext === '.mp4' || ext === '.webm') fs.copyFileSync(input, dest);
  else {
    const width = Number(opt.width || 1200);
    let img = sharp(input);
    if (opt.crop) {
      // --crop 0.78 keeps the centre 78% of the frame: the plate fills a 64px thumbnail.
      const k = Number(opt.crop);
      const meta = await sharp(input).metadata();
      const w = Math.round(meta.width * k), h = Math.round(meta.height * k);
      img = img.extract({ left: Math.round((meta.width - w) / 2), top: Math.round((meta.height - h) / 2), width: w, height: h });
    }
    img = img.resize({ width, withoutEnlargement: true });
    img = ext === '.png' ? img.png({ compressionLevel: 9 }) : ext === '.jpg' ? img.jpeg({ quality: 84, mozjpeg: true }) : img.webp({ quality: 82 });
    await img.toFile(dest);
  }
  recordAsset({
    file: rel(dest),
    source: 'generated',
    status,
    provider: entry.provider || opt.provider || '',
    model: entry.model || opt.model || '',
    seed: entry.seed ?? null,
    prompt: entry.prompt || opt.prompt || '',
    derivedFrom: rel(input),
    licence: licenceFor(entry.model || opt.model || ''),
  });
  console.log(`✓ ${rel(dest)}  [${status}]  → manifest`);
}

function licenceFor(model) {
  if (/comfy:flux-2-klein/i.test(model)) return 'FLUX.2 [klein] 4B, run locally in ComfyUI — Apache-2.0 model, outputs free for commercial use';
  if (/wan2|wan-2/i.test(model)) return 'Wan 2.2 output via a Hugging Face Space — Apache-2.0 model';
  if (/nova-reel/i.test(model)) return 'Amazon Nova Reel output via Pollinations — output owned by the requester';
  if (/gpt-?image/i.test(model)) return 'GPT-Image output via Pollinations — OpenAI terms: output owned by the requester';
  if (/zimage|z-image/i.test(model)) return 'Z-Image-Turbo output via Pollinations — Apache-2.0 model';
  if (/horde:/i.test(model) && !/flux/i.test(model)) return 'SDXL-family output via AI Horde — see model licence (CreativeML Open RAIL++-M)';
  if (/flux-1-schnell|FLUX\.1-schnell/i.test(model)) return 'FLUX.1 [schnell] output — Apache-2.0 model, outputs free for commercial use';
  if (/flux-2/i.test(model)) return 'FLUX.2 output via Cloudflare Workers AI — see model licence';
  return 'own work';
}

function cmdRecord(pos, opt) {
  const [file] = pos;
  if (!file || !opt.source || !opt.licence) die('usage: asset.mjs record <file> --source <s> --licence <l> [--author a] [--prompt p] [--status final]');
  recordAsset({ file: rel(file), source: opt.source, status: opt.status || 'final', author: opt.author || '', prompt: opt.prompt || '', licence: opt.licence, url: opt.url || '' });
  console.log(`✓ recorded ${rel(file)}`);
}

/* ---------- brand illustration layer ---------- */

/* Cuts a doodle sheet into single doodles, traces each, and scatters them over a tile that
   repeats without seams. The SVG is black on transparent: pages use it as a CSS mask over a
   token colour, so the wallpaper follows the theme. */
async function cmdPattern(pos, opt) {
  const [output, ...sheets] = pos;
  if (!output || !sheets.length) die('usage: asset.mjs pattern <out.svg> <sheet.jpg…> [--tile 640] [--scale 0.4] [--gap 92] [--seed 7] [--preview]');
  const vt = await import('./vector-tools.mjs');
  const items = [];
  for (const sheet of sheets) {
    const img = await vt.loadRgb(sheet);
    const ink = vt.darkMask(img, Number(opt.threshold || 150));
    // Parts of one doodle (a bowl and its steam) sit closer than two doodles do.
    const merged = vt.dilate(ink, img.W, img.H, Number(opt.merge || 14));
    const { list } = vt.components(merged, img.W, img.H, 1500);
    // A doodle with a hole (a doughnut, a plate) can split in two; the inner part is already
    // inside the outer one's crop.
    const inside = (a, b) => a !== b && a.x0 >= b.x0 && a.y0 >= b.y0 && a.x1 <= b.x1 && a.y1 <= b.y1;
    for (const c of list) {
      if (c.touchesEdge || list.some((o) => inside(c, o))) continue;
      const { mask, w, h } = vt.crop(ink, img.W, c, 2);
      const d = await vt.trace(mask, w, h, { turd: 8 });
      if (d) items.push({ d, w, h, from: rel(sheet) });
    }
    console.log(`  ${rel(sheet)}: ${list.length} doodles`);
  }
  if (!items.length) die('no doodles found');
  const T = Number(opt.tile || 640);
  const k = Number(opt.scale || 0.4);
  const rand = vt.mulberry(Number(opt.seed || 7));
  const pts = vt.poissonTorus(T, Number(opt.gap || 92), rand);
  // Deal the doodles like cards so each appears before any repeats.
  const deck = [];
  const draw = () => { if (!deck.length) deck.push(...items.map((_, i) => i).sort(() => rand() - 0.5)); return deck.pop(); };
  const uses = [];
  for (const [x, y] of pts) {
    const i = draw();
    const it = items[i];
    const rot = Math.round((rand() - 0.5) * 44);
    const R = (Math.hypot(it.w, it.h) / 2) * k;
    for (const dx of [-T, 0, T]) for (const dy of [-T, 0, T]) {
      const cx = x + dx, cy = y + dy;
      if (cx + R < 0 || cy + R < 0 || cx - R > T || cy - R > T) continue;
      uses.push(`<use href="#d${i}" transform="translate(${cx.toFixed(1)} ${cy.toFixed(1)}) rotate(${rot}) scale(${k}) translate(${-it.w / 2} ${-it.h / 2})"/>`);
    }
  }
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${T} ${T}" width="${T}" height="${T}">` +
    `<defs>${items.map((it, i) => `<path id="d${i}" d="${it.d}"/>`).join('')}</defs><g fill="#000" fill-rule="evenodd">${uses.join('')}</g></svg>`;
  fs.mkdirSync(path.dirname(output), { recursive: true });
  fs.writeFileSync(output, svg);
  console.log(`✓ ${rel(output)}  ${items.length} doodles, ${pts.length} per tile, ${(svg.length / 1024).toFixed(0)} KB`);
  if (opt.preview) {
    const tile = await sharp(Buffer.from(svg.replace('fill="#000"', 'fill="#1F4FD8"'))).png().toBuffer();
    const prev = path.join(RAW, `_preview-${path.basename(output, '.svg')}.png`);
    await sharp({ create: { width: T * 2, height: T * 2, channels: 3, background: '#E4EAFB' } })
      .composite([0, 1, 2, 3].map((q) => ({ input: tile, left: (q % 2) * T, top: (q >> 1) * T }))).png().toFile(prev);
    console.log(`  preview (2×2, seams visible if any) → ${rel(prev)}`);
  }
  const first = findRawEntry(sheets[0]) || {};
  recordAsset({ file: rel(output), source: 'generated', status: opt.status || 'final', provider: first.provider || '', model: first.model || '',
    seed: first.seed ?? null, prompt: first.prompt || '', derivedFrom: sheets.map(rel).join(', '), licence: licenceFor(first.model || '') });
}

/* Cuts a flat illustration down to the palette and traces one layer per colour, filled with
   the token itself — var(--accent) and friends — so the scene recolours with the theme when
   it is inlined. Lightest layer first; each is grown a pixel so no seam shows between them. */
const FLAT_PALETTE = [
  { name: 'surface-raised', hex: '#FFFFFF' },
  { name: 'accent-quiet', hex: '#DCE5FB' },
  { name: 'crowd-moderate-fill', hex: '#E0A03A' },
  { name: 'accent', hex: '#1F4FD8' },
  { name: 'text-primary', hex: '#11161B' },
];
async function cmdFlatten(pos, opt) {
  const [input, output] = pos;
  if (!input || !output) die('usage: asset.mjs flatten <in.jpg> <out.svg> [--turd 40] [--keep-white]');
  const vt = await import('./vector-tools.mjs');
  const { idx, W, H } = await vt.quantize(input, FLAT_PALETTE);
  const white = new Uint8Array(W * H);
  for (let i = 0; i < W * H; i++) white[i] = idx[i] === 0 ? 1 : 0;
  const bg = vt.borderFill(white, W, H);
  let x0 = W, y0 = H, x1 = 0, y1 = 0;
  for (let i = 0; i < W * H; i++) if (!bg[i]) { const x = i % W, y = (i / W) | 0; if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
  const paths = [];
  for (let k = 0; k < FLAT_PALETTE.length; k++) {
    let own = new Uint8Array(W * H);
    for (let i = 0; i < W * H; i++) own[i] = idx[i] === k && !bg[i] ? 1 : 0;
    own = vt.dilate(vt.open(own, W, H, 1), W, H, 1);
    const d = await vt.trace(own, W, H, { turd: Number(opt.turd || 40) });
    if (d) paths.push(`<path fill="var(--${FLAT_PALETTE[k].name}, ${FLAT_PALETTE[k].hex})" fill-rule="evenodd" d="${d}"/>`);
  }
  const m = 8;
  const vb = [x0 - m, y0 - m, x1 - x0 + 1 + m * 2, y1 - y0 + 1 + m * 2];
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vb.join(' ')}">${paths.join('')}</svg>`;
  fs.mkdirSync(path.dirname(output), { recursive: true });
  fs.writeFileSync(output, svg);
  console.log(`✓ ${rel(output)}  ${paths.length} colour layers, ${(svg.length / 1024).toFixed(0)} KB`);
  const e = findRawEntry(input) || {};
  recordAsset({ file: rel(output), source: 'generated', status: opt.status || 'final', provider: e.provider || '', model: e.model || '',
    seed: e.seed ?? null, prompt: e.prompt || '', derivedFrom: rel(input), licence: licenceFor(e.model || '') });
}

/* Splits a pictogram sheet into single pictograms (reading order), each traced as two layers:
   the fill in var(--accent) under the outline in currentColor. */
async function cmdPicto(pos, opt) {
  const [input, outDir] = pos;
  if (!input || !outDir) die('usage: asset.mjs picto <sheet.jpg> <out-dir> --names soup,main,… [--prefix picto-] [--only soup,main]');
  const vt = await import('./vector-tools.mjs');
  const pal = [{ hex: '#FFFFFF' }, { hex: '#1F4FD8' }, { hex: '#11161B' }];
  const { idx, W, H } = await vt.quantize(input, pal);
  const any = new Uint8Array(W * H);
  for (let i = 0; i < W * H; i++) any[i] = idx[i] ? 1 : 0;
  const { list } = vt.components(vt.dilate(any, W, H, 12), W, H, 3000);
  // Reading order: group into rows by vertical centre, then left to right.
  const boxes = list.map((c) => ({ ...c, cy: (c.y0 + c.y1) / 2, cx: (c.x0 + c.x1) / 2 })).sort((a, b) => a.cy - b.cy);
  const rows = [];
  for (const b of boxes) {
    const row = rows.find((r) => Math.abs(r[0].cy - b.cy) < (b.y1 - b.y0) / 2);
    if (row) row.push(b); else rows.push([b]);
  }
  const ordered = rows.flatMap((r) => r.sort((a, b) => a.cx - b.cx));
  const names = String(opt.names || '').split(',').filter(Boolean);
  const only = opt.only ? String(opt.only).split(',') : null;
  const e = findRawEntry(input) || {};
  fs.mkdirSync(outDir, { recursive: true });
  for (const [n, c] of ordered.entries()) {
    const name = names[n] || `${n + 1}`;
    if (only && !only.includes(name)) continue;
    if (c.touchesEdge) { console.log(`  · ${name}: touches the frame edge — skipped`); continue; }
    const pad = 6;
    const layer = (k) => { const m = new Uint8Array(W * H); for (let i = 0; i < W * H; i++) m[i] = idx[i] === k ? 1 : 0; return vt.crop(m, W, c, pad); };
    const ink = layer(2);
    const fill = layer(1);
    const fillD = await vt.trace(vt.dilate(vt.open(fill.mask, fill.w, fill.h, 1), fill.w, fill.h, 2), fill.w, fill.h, { turd: 30 });
    const inkD = await vt.trace(ink.mask, ink.w, ink.h, { turd: 12 });
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${ink.w} ${ink.h}" fill="currentColor">` +
      (fillD ? `<path fill="var(--accent, #1F4FD8)" fill-rule="evenodd" d="${fillD}"/>` : '') + `<path fill-rule="evenodd" d="${inkD}"/></svg>`;
    const out = path.join(outDir, `${opt.prefix || 'picto-'}${name}.svg`);
    fs.writeFileSync(out, svg);
    recordAsset({ file: rel(out), source: 'generated', status: opt.status || 'final', provider: e.provider || '', model: e.model || '',
      seed: e.seed ?? null, prompt: e.prompt || '', derivedFrom: rel(input), licence: licenceFor(e.model || '') });
    console.log(`✓ ${rel(out)}  ${(svg.length / 1024).toFixed(1)} KB`);
  }
}

/* ---------- main ---------- */

loadEnv();
const [cmd, ...rest] = process.argv.slice(2);
const { pos, opt } = parseArgs(rest);
const COMMANDS = { gen: cmdGen, batch: cmdBatch, video: cmdVideo, i2v: cmdI2v, sheet: cmdSheet, cutout: cmdCutout, vectorize: cmdVectorize, promote: cmdPromote, record: cmdRecord, pattern: cmdPattern, flatten: cmdFlatten, picto: cmdPicto };
if (!COMMANDS[cmd]) {
  console.log(fs.readFileSync(fileURLToPath(import.meta.url), 'utf8').match(/\/\*([\s\S]*?)\*\//)[1].trim());
  process.exit(cmd ? 1 : 0);
}
// exitCode rather than exit(): an abrupt exit while fetch sockets close trips a libuv
// assertion on Windows.
try { await COMMANDS[cmd](pos, opt); } catch (e) { console.error(`✗ ${e.message}`); process.exitCode = 1; }
