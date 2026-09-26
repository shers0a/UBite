/* CI guard: every image under assets/ must have a manifest row with a real licence.
   Run: node scripts/check-assets.cjs   (exit 1 = something is unrecorded) */
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const manifestPath = path.join(root, 'assets', 'manifest.json');
const manifest = fs.existsSync(manifestPath) ? JSON.parse(fs.readFileSync(manifestPath, 'utf8')) : { assets: [] };
const known = new Map(manifest.assets.map((a) => [a.file, a]));

// The Lucide icon set and the logo files are recorded once, as a set, not file by file.
const EXEMPT = [/^assets\/icons\//, /^assets\/image-slot\.js$/];
const IMAGE = /\.(png|jpe?g|webp|gif|avif|svg)$/i;

const walk = (dir, out = []) => {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) walk(full, out);
    else out.push(path.relative(root, full).split(path.sep).join('/'));
  }
  return out;
};

const files = walk(path.join(root, 'assets')).filter((f) => IMAGE.test(f) && !EXEMPT.some((r) => r.test(f)));
const problems = [];

for (const f of files) {
  const row = known.get(f);
  if (!row) { problems.push(`${f} — no manifest row (run scripts/manifest-add.cjs)`); continue; }
  if (!row.licence || row.licence === 'UNKNOWN') problems.push(`${f} — licence not recorded`);
  if (row.source === 'generated' && !row.prompt) problems.push(`${f} — generated, but the prompt was not saved`);
}
for (const [f] of known) {
  if (!fs.existsSync(path.join(root, f))) problems.push(`${f} — in the manifest but missing on disk`);
}

if (problems.length) {
  console.error('Asset check failed:\n' + problems.map((p) => '  ✗ ' + p).join('\n'));
  process.exit(1);
}
console.log(`Asset check passed — ${files.length} file(s), all recorded.`);
