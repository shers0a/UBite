/* Builds the app for Vercel in its Build Output format (.vercel/output), for a prebuilt deploy:

     npx tsx scripts/vercel-build.ts && npx vercel deploy --prebuilt --prod

   - static/            the PWA (apps/web/dist), served from the CDN with the same security headers
                        the container sends (helmetOptions in apps/api/src/app.ts)
   - functions/api.func the Express API as one function: our code bundled with esbuild; sharp
                        (Linux build) and tesseract.js installed beside it; the migrations and the
                        Romanian OCR model copied in
   - config.json        routes (API → function, everything else → the SPA shell) and the daily cron

   The container (Dockerfile) stays the deployment for the UB VM; this is the same app on free
   hosting, with scheduled work run by requests (JOBS=requests, see apps/api/src/jobs.ts). */
import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import { build } from 'esbuild';
import helmet from 'helmet';
import { helmetOptions } from '../apps/api/src/app';

const root = path.resolve(import.meta.dirname, '..');
const out = path.join(root, '.vercel/output');
const fn = path.join(out, 'functions/api.func');
const apiPkg = JSON.parse(fs.readFileSync(path.join(root, 'apps/api/package.json'), 'utf8'));
const run = (cmd: string, cwd = root) => execSync(cmd, { cwd, stdio: 'inherit' });

fs.rmSync(out, { recursive: true, force: true });
fs.mkdirSync(fn, { recursive: true });

// 1 · The PWA.
if (!process.argv.includes('--skip-web')) run('npm run build -w @ubite/web');
fs.cpSync(path.join(root, 'apps/web/dist'), path.join(out, 'static'), { recursive: true });

// 2 · The API function.
const NATIVE = ['sharp', 'tesseract.js'];
await build({
  entryPoints: [path.join(root, 'apps/api/src/vercel.ts')],
  outfile: path.join(fn, 'index.mjs'),
  bundle: true,
  platform: 'node',
  format: 'esm',
  target: 'node22',
  external: [...NATIVE, '@electric-sql/pglite', '@electric-sql/pglite/*', 'pg-native'],
  // CommonJS dependencies inside an ES module bundle still call require().
  banner: { js: "import { createRequire as __cr } from 'node:module'; const require = __cr(import.meta.url);" },
  logLevel: 'warning',
});
fs.writeFileSync(path.join(fn, 'package.json'), JSON.stringify({
  type: 'module',
  private: true,
  dependencies: Object.fromEntries(NATIVE.map((n) => [n, apiPkg.dependencies[n]])),
}, null, 1));
// Vercel runs Linux x64: install sharp's Linux binary whatever machine builds this.
run('npm install --omit=dev --no-audit --no-fund --no-package-lock --os=linux --cpu=x64 --libc=glibc', fn);
fs.cpSync(path.join(root, 'apps/api/migrations'), path.join(fn, 'migrations'), { recursive: true });

// The Romanian model tesseract.js uses by default (integer "best"): measured the better reader
// of thermal receipts (scripts/ocr-bench.ts). Downloaded once, cached in .data/.
const model = path.join(root, '.data/tessdata/ron.traineddata');
if (!fs.existsSync(model)) {
  fs.mkdirSync(path.dirname(model), { recursive: true });
  const r = await fetch('https://cdn.jsdelivr.net/npm/@tesseract.js-data/ron@1.0.0/4.0.0_best_int/ron.traineddata.gz');
  if (!r.ok) throw new Error(`OCR model download failed: ${r.status}`);
  fs.writeFileSync(model, zlib.gunzipSync(Buffer.from(await r.arrayBuffer())));
}
fs.mkdirSync(path.join(fn, 'tessdata'));
fs.copyFileSync(model, path.join(fn, 'tessdata/ron.traineddata'));

fs.writeFileSync(path.join(fn, '.vc-config.json'), JSON.stringify({
  runtime: 'nodejs22.x',
  handler: 'index.mjs',
  launcherType: 'Nodejs',
  shouldAddHelpers: false,
  supportsResponseStreaming: true,
  // Reading a receipt runs Tesseract three times.
  maxDuration: 60,
  memory: 2048,
  // Frankfurt: next to the students, and to a database in eu-central-1.
  regions: ['fra1'],
}, null, 1));

// 3 · Routes and headers.
const security: Record<string, string> = {};
const res = { setHeader: (k: string, v: string) => { security[k.toLowerCase()] = String(v); }, removeHeader: (k: string) => { delete security[k.toLowerCase()]; } };
helmet(helmetOptions({ PUBLIC_URL: 'https://' }))({} as never, res as never, () => {});
const demo = process.env.DEMO_SHOW_CODES === '1' || process.env.DEMO_SHOW_CODES === 'true';
if (demo) security['x-robots-tag'] = 'noindex, nofollow';

fs.writeFileSync(path.join(out, 'config.json'), JSON.stringify({
  version: 3,
  routes: [
    { src: '^/api(?:/.*)?$', dest: '/api' },
    { src: '^/assets/(.*)$', headers: { 'cache-control': 'public, max-age=31536000, immutable' }, continue: true },
    { src: '^/(?:sw\\.js|manifest\\.webmanifest|theme\\.js)$', headers: { 'cache-control': 'no-cache' }, continue: true },
    { src: '^/(.*)$', headers: security, continue: true },
    { handle: 'filesystem' },
    // Every route of the single-page app gets the shell — the kiosk must never see a browser error.
    { src: '^/.*$', dest: '/index.html', headers: { 'cache-control': 'no-cache' } },
  ],
  // 01:00 UTC: after 03:00 in Bucharest in either season — the nightly calibration and baseline.
  crons: [{ path: '/api/cron', schedule: '0 1 * * *' }],
}, null, 1));

const size = (dir: string): number => fs.readdirSync(dir, { withFileTypes: true })
  .reduce((s, e) => s + (e.isDirectory() ? size(path.join(dir, e.name)) : fs.statSync(path.join(dir, e.name)).size), 0);
console.log(`\n.vercel/output ready — function ${(size(fn) / 1e6).toFixed(1)} MB, static ${(size(path.join(out, 'static')) / 1e6).toFixed(1)} MB`);
