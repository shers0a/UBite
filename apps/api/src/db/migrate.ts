/* Versioned, committed migrations (docs/04, docs/12): every file in migrations/ runs once, in
   name order, inside a transaction. Run as its own step before a deploy — never implicitly in
   production unless MIGRATE_ON_START is set. */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { Db } from './index';

export function migrationsDir(): string {
  if (process.env.MIGRATIONS_DIR) return path.resolve(process.env.MIGRATIONS_DIR);
  let dir = path.dirname(fileURLToPath(import.meta.url));
  for (let i = 0; i < 4; i++) {
    const candidate = path.join(dir, 'migrations');
    if (fs.existsSync(candidate)) return candidate;
    dir = path.dirname(dir);
  }
  throw new Error('migrations/ directory not found');
}

export async function migrate(db: Db, log: (msg: string) => void = () => {}): Promise<string[]> {
  await db.exec(`CREATE TABLE IF NOT EXISTS schema_migrations (
    version text PRIMARY KEY, applied_at timestamptz NOT NULL DEFAULT now())`);
  const done = new Set((await db.query<{ version: string }>('SELECT version FROM schema_migrations')).rows.map((r) => r.version));
  const dir = migrationsDir();
  const files = fs.readdirSync(dir).filter((f) => f.endsWith('.sql')).sort();
  const applied: string[] = [];
  for (const file of files) {
    if (done.has(file)) continue;
    const sql = fs.readFileSync(path.join(dir, file), 'utf8');
    await db.exec(`BEGIN;\n${sql}\nINSERT INTO schema_migrations (version) VALUES ('${file.replace(/'/g, "''")}');\nCOMMIT;`)
      .catch(async (e) => { await db.exec('ROLLBACK').catch(() => {}); throw new Error(`${file}: ${e.message}`); });
    applied.push(file);
    log(`migrated ${file}`);
  }
  return applied;
}
