/* Appends one row to assets/manifest.json. Called by asset.sh and photo.sh — you can also
   call it by hand for a file you added yourself:
     node scripts/manifest-add.cjs assets/photos/hall.jpg "site visit" "Andra" "canteen hall" "own work" */
const fs = require('fs');
const path = require('path');

const [file, source, author, prompt, licence, url] = process.argv.slice(2);
if (!file) { console.error('usage: manifest-add.cjs <file> <source> <author|model> <prompt|query> <licence> [url]'); process.exit(1); }

const p = path.join(__dirname, '..', 'assets', 'manifest.json');
const manifest = fs.existsSync(p) ? JSON.parse(fs.readFileSync(p, 'utf8')) : { assets: [] };
manifest.assets = manifest.assets.filter((a) => a.file !== file);
manifest.assets.push({
  file,
  source: source || 'unknown',
  author: author || '',
  prompt: prompt || '',
  licence: licence || 'UNKNOWN',
  url: url || '',
  added: new Date().toISOString().slice(0, 10),
});
manifest.assets.sort((a, b) => a.file.localeCompare(b.file));
fs.writeFileSync(p, JSON.stringify(manifest, null, 2) + '\n');
