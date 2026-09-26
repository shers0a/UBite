/* Local development reads the repo's .env (production gets its environment from the platform or
   docker compose). Values already in the environment always win; nothing is ever overwritten. */
import fs from 'node:fs';
import path from 'node:path';

function findEnvFile(): string | null {
  let dir = process.cwd();
  for (let i = 0; i < 4; i++) {
    const file = path.join(dir, '.env');
    if (fs.existsSync(file)) return file;
    dir = path.dirname(dir);
  }
  return null;
}

if (process.env.NODE_ENV !== 'production' && process.env.NODE_ENV !== 'test') {
  const file = findEnvFile();
  if (file) {
    for (const line of fs.readFileSync(file, 'utf8').split(/\r?\n/)) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);
      if (!m || process.env[m[1]] !== undefined) continue;
      process.env[m[1]] = m[2].replace(/^(['"])(.*)\1$/, '$2');
    }
  }
}
