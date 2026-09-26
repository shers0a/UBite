/* The receipt reader measured field by field (docs/09 "OCR"; R15 needs to know how often it
   fails). Runs the production reader — the same preprocessing, Tesseract model and parser — over
   a folder of photos with a truth.json, and prints what it got right per field and per difficulty.

   npx tsx scripts/ocr-bench.ts <dir> [--lang-path <dir with ron.traineddata>] [--verbose]

   Synthetic photos: python scripts/receipt-samples.py <dir>. Real photos: the same folder shape,
   { "<file>": { receiptNumber, totalBani, date, time, fiscalCode, deviceId, zNumber } }. */
import fs from 'node:fs';
import path from 'node:path';
import pino from 'pino';
import { loadConfig } from '../apps/api/src/config';
import { createTesseractReader, matchFiscalCode, parseReceipt, readsAsDate, receiptIdentity } from '../apps/api/src/services/receipt';

const args = process.argv.slice(2);
const dir = args[0];
if (!dir) { console.error('usage: npx tsx scripts/ocr-bench.ts <dir> [--lang-path <dir>] [--verbose]'); process.exit(1); }
const langPath = args.includes('--lang-path') ? args[args.indexOf('--lang-path') + 1] : undefined;
const verbose = args.includes('--verbose');
const only = args.includes('--only') ? args[args.indexOf('--only') + 1] : null;

const truth: Record<string, Record<string, any>> = JSON.parse(fs.readFileSync(path.join(dir, 'truth.json'), 'utf8'));
const cfg = loadConfig({ NODE_ENV: 'test', DATABASE_URL: 'pglite:memory', SESSION_SECRET: 'bench-secret-bench-secret', ...(langPath ? { OCR_LANG_PATH: path.resolve(langPath) } : {}), OCR_CACHE_PATH: path.resolve('.data/tesseract') });
const reader = createTesseractReader(cfg, pino({ level: 'silent' }));

const FIELDS = ['receiptNumber', 'date', 'time', 'totalBani', 'fiscalCode', 'deviceId', 'zNumber'] as const;
type Tally = Record<string, { ok: number; n: number }>;
const byLevel: Record<string, Tally> = {};
const byLayout: Record<string, Tally> = {};
let ms = 0;
let files = 0;

for (const [file, t] of Object.entries(truth)) {
  if (only && !file.includes(only)) continue;
  const image = fs.readFileSync(path.join(dir, file));
  const started = Date.now();
  const text = await reader.read(image);
  ms += Date.now() - started;
  files++;
  const p = parseReceipt(text);
  const got: Record<string, unknown> = p ? { ...p } : {};
  // "accepted": what the app needs to count the visit — a receipt number, today's date and, with
  // the canteen's fiscal code configured, that code. "identity": the duplicate check holds — two
  // scans of this receipt would hash the same.
  const expectedId = receiptIdentity({ ...(t as any), receiptNumber: String(t.receiptNumber) });
  got.identity = p ? receiptIdentity(p) : null;
  got.accepted = !!p && !!p.date && readsAsDate(p.date, t.date) && matchFiscalCode(p.fiscalCode, [String(t.fiscalCode)]) === String(t.fiscalCode);
  const row: Record<string, boolean> = {};
  for (const f of [...FIELDS, 'identity', 'accepted'] as const) {
    const ok = f === 'accepted' ? got.accepted === true
      : f === 'identity' ? got.identity === expectedId
        : String(got[f] ?? '') === String(t[f] ?? '');
    row[f] = ok;
    for (const tally of [byLevel[t.level ?? 'all'] ??= {}, byLayout[t.layout ?? 'all'] ??= {}]) {
      tally[f] ??= { ok: 0, n: 0 };
      tally[f].n++;
      if (ok) tally[f].ok++;
    }
  }
  if (verbose) {
    const wrong = Object.entries(row).filter(([, ok]) => !ok).map(([f]) => `${f}: ${JSON.stringify(got[f] ?? null)} ≠ ${JSON.stringify(f === 'identity' ? expectedId : t[f])}`);
    console.log(`${file}  ${wrong.length ? wrong.join(' · ') : 'all fields right'}`);
    if (wrong.length && args.includes('--text')) console.log(text.split('\n').map((l) => `    | ${l}`).join('\n'));
  }
}

const pct = (x: { ok: number; n: number } | undefined) => (x ? `${Math.round((100 * x.ok) / x.n)}%`.padStart(5) : '    –');
const table = (title: string, groups: Record<string, Tally>) => {
  const cols = [...FIELDS, 'identity', 'accepted'];
  console.log(`\n${title.padEnd(10)}${cols.map((c) => c.slice(0, 9).padStart(10)).join('')}`);
  for (const [g, tally] of Object.entries(groups)) console.log(`${g.padEnd(10)}${cols.map((c) => pct(tally[c]).padStart(10)).join('')}`);
};
table('level', byLevel);
table('layout', byLayout);
console.log(`\n${files} photos, ${(ms / files / 1000).toFixed(1)} s each on average`);
process.exit(0);
