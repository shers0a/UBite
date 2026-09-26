#!/usr/bin/env node
/* The local image model: ComfyUI portable + FLUX.2 [klein] 4B (Apache-2.0), on this laptop's GPU
   (tested on an RTX 2000 Ada, 8 GB, with 64 GB RAM). No quota, no key, no network after setup.

   npm run ai:start     starts ComfyUI in the background and waits until it answers
   npm run ai:status    is it up, which models does it see, how much VRAM is free
   npm run ai:stop      stops the ComfyUI started by ai:start

   Once it runs, `node scripts/asset.mjs gen …` uses it first (ASSET_PROVIDERS starts with comfy);
   add --quality high for the 28-step base model instead of the 4-step distilled one.
   Setup (once): ComfyUI_windows_portable_nvidia.7z from github.com/Comfy-Org/ComfyUI/releases,
   extracted to COMFY_DIR, and these files in its ComfyUI/models/:
     diffusion_models/flux-2-klein-4b-fp8.safetensors       huggingface.co/black-forest-labs/FLUX.2-klein-4b-fp8
     diffusion_models/flux-2-klein-base-4b-fp8.safetensors  huggingface.co/black-forest-labs/FLUX.2-klein-base-4b-fp8
     text_encoders/qwen_3_4b.safetensors                    huggingface.co/Comfy-Org/vae-text-encorder-for-flux-klein-4b
     vae/flux2-vae.safetensors                              (same repo, split_files/vae) */
import fs from 'node:fs';
import path from 'node:path';
import { spawn, execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
for (const line of fs.existsSync(path.join(ROOT, '.env')) ? fs.readFileSync(path.join(ROOT, '.env'), 'utf8').split(/\r?\n/) : []) {
  const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
}
const DIR = process.env.COMFY_DIR || 'C:/AI/ComfyUI_windows_portable';
const URL_ = process.env.COMFY_URL || 'http://127.0.0.1:8188';
const PID = path.join(DIR, 'ubite-comfy.pid');
const LOG = path.join(DIR, 'ubite-comfy.log');

const up = () => fetch(`${URL_}/system_stats`).then((r) => (r.ok ? r.json() : null)).catch(() => null);

async function start() {
  if (await up()) { console.log(`✓ ComfyUI already running at ${URL_}`); return; }
  const py = path.join(DIR, 'python_embeded', 'python.exe');
  if (!fs.existsSync(py)) { console.error(`ComfyUI not found in ${DIR} — see the setup notes at the top of scripts/local-ai.mjs`); process.exitCode = 1; return; }
  const port = new URL(URL_).port || '8188';
  const out = fs.openSync(LOG, 'a');
  const child = spawn(py, ['-s', path.join('ComfyUI', 'main.py'), '--windows-standalone-build', '--listen', '127.0.0.1', '--port', port, '--disable-auto-launch'],
    { cwd: DIR, detached: true, stdio: ['ignore', out, out], windowsHide: true });
  fs.writeFileSync(PID, String(child.pid));
  child.unref();
  process.stdout.write('starting ComfyUI');
  for (let i = 0; i < 90; i++) {
    await new Promise((r) => setTimeout(r, 2000));
    if (await up()) { console.log(`\n✓ ComfyUI running at ${URL_} (log: ${LOG})`); return; }
    process.stdout.write('.');
  }
  console.error(`\nComfyUI did not answer within 3 minutes — see ${LOG}`);
  process.exitCode = 1;
}

async function status() {
  const s = await up();
  if (!s) { console.log('ComfyUI is not running — npm run ai:start'); return; }
  const dev = s.devices?.[0] || {};
  console.log(`✓ ComfyUI ${s.system?.comfyui_version || ''} at ${URL_}`);
  console.log(`  GPU ${dev.name || '?'} — ${((dev.vram_free || 0) / 1e9).toFixed(1)} of ${((dev.vram_total || 0) / 1e9).toFixed(1)} GB VRAM free`);
  const info = await (await fetch(`${URL_}/object_info/UNETLoader`)).json();
  console.log(`  models: ${info.UNETLoader.input.required.unet_name[0].join(', ')}`);
}

function stop() {
  if (!fs.existsSync(PID)) { console.log('no ComfyUI started by ai:start'); return; }
  const pid = fs.readFileSync(PID, 'utf8').trim();
  try { execFileSync('taskkill', ['/PID', pid, '/T', '/F'], { stdio: 'ignore' }); console.log(`✓ stopped ComfyUI (pid ${pid})`); } catch { console.log(`pid ${pid} was not running`); }
  fs.rmSync(PID, { force: true });
}

const cmd = process.argv[2] || 'status';
await ({ start, status, stop }[cmd] || (() => console.log('usage: local-ai.mjs start|status|stop')))();
