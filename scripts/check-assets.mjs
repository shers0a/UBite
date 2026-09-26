/* CI guard: every image under assets/ needs a manifest row with a real licence, and every
   generated one needs its prompt. Placeholders pass, but are listed so nobody forgets that
   they must be replaced before launch.
   Run: npm run assets:check   (exit 1 = something is unrecorded) */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const manifestPath = path.join(root, 'assets', 'manifest.json');
const manifest = fs.existsSync(manifestPath) ? JSON.parse(fs.readFileSync(manifestPath, 'utf8')) : { assets: [] };
const known = new Map((manifest.assets || []).map((a) => [a.file, a]));
const sets = (manifest.sets || []).map((s) => s.path);

const IMAGE = /\.(png|jpe?g|webp|gif|avif|svg|mp4|webm)$/i;
const SKIP = [/^assets\/_raw\//];

const walk = (dir, out = []) => {
  if (!fs.existsSync(dir)) return out;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) walk(full, out);
    else out.push(path.relative(root, full).split(path.sep).join('/'));
  }
  return out;
};

const files = walk(path.join(root, 'assets')).filter((f) => IMAGE.test(f) && !SKIP.some((r) => r.test(f)));
const problems = [];
const placeholders = [];

for (const f of files) {
  if (sets.some((s) => f.startsWith(s))) continue;
  const row = known.get(f);
  if (!row) { problems.push(`${f} — no manifest row (node scripts/asset.mjs record|promote)`); continue; }
  if (!row.licence || row.licence === 'UNKNOWN') problems.push(`${f} — licence not recorded`);
  if (row.source === 'generated' && !row.prompt) problems.push(`${f} — generated, but the prompt was not saved`);
  if (row.status === 'placeholder') placeholders.push(f);
}
for (const [f] of known) {
  if (!fs.existsSync(path.join(root, f))) problems.push(`${f} — in the manifest but missing on disk`);
}

// The approved look (assets/style/lock.json): approved files and brand-preset wording must not drift.
const lockPath = path.join(root, 'assets', 'style', 'lock.json');
if (fs.existsSync(lockPath)) {
  const { createHash } = await import('node:crypto');
  const { presetFingerprint } = await import('./lock-style.mjs');
  const lock = JSON.parse(fs.readFileSync(lockPath, 'utf8'));
  const sha = (f) => createHash('sha256').update(fs.readFileSync(path.join(root, f))).digest('hex');
  for (const [f, hash] of Object.entries(lock.files || {})) {
    if (!fs.existsSync(path.join(root, f))) problems.push(`${f} — locked style asset is missing`);
    else if (sha(f) !== hash) problems.push(`${f} — locked style asset changed (approved ${lock.approved}; re-lock only after the team approves: node scripts/lock-style.mjs)`);
  }
  for (const [name, hash] of Object.entries(lock.presets || {})) {
    if (presetFingerprint(name) !== hash) problems.push(`scripts/art-direction.mjs "${name}" — locked preset wording changed (approved ${lock.approved}); add subjects in briefs.mjs instead`);
  }
}

if (placeholders.length) {
  console.log(`${placeholders.length} placeholder(s) to replace with real photography before launch:`);
  for (const p of placeholders) console.log(`  · ${p}`);
}
if (problems.length) {
  console.error('Asset check failed:\n' + problems.map((p) => '  ✗ ' + p).join('\n'));
  process.exit(1);
}
console.log(`Asset check passed — ${files.length} file(s), all recorded.`);
