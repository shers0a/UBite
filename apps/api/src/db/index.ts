/* One small interface over two drivers: node-postgres for every real environment, PGlite (the
   same PostgreSQL, compiled to WebAssembly) for tests and for a laptop without Docker. The SQL is
   identical, so a test that passes here passes against the server. */
import fs from 'node:fs';
import path from 'node:path';

export interface QueryResult<T> {
  rows: T[];
  rowCount: number;
}

export interface Queryable {
  query<T = Record<string, any>>(sql: string, params?: unknown[]): Promise<QueryResult<T>>;
}

export interface Db extends Queryable {
  /** Runs several statements with no parameters (migrations). */
  exec(sql: string): Promise<void>;
  tx<T>(fn: (q: Queryable) => Promise<T>): Promise<T>;
  close(): Promise<void>;
  readonly driver: 'pg' | 'pglite';
}

// DATE as the plain string it is — a JS Date would shift it by the server's offset.
const PARSERS = {
  1082: (v: string) => v,
  20: (v: string) => Number(v),
  1700: (v: string) => Number(v),
};

export async function createDb(url: string): Promise<Db> {
  if (url.startsWith('pglite:')) return createPglite(url.slice('pglite:'.length));
  return createPg(url);
}

async function createPg(url: string): Promise<Db> {
  const pg = (await import('pg')).default;
  for (const [oid, fn] of Object.entries(PARSERS)) pg.types.setTypeParser(Number(oid), fn);
  const pool = new pg.Pool({ connectionString: url, max: 10, idleTimeoutMillis: 30_000 });
  const wrap = (c: { query: (s: string, p?: unknown[]) => Promise<any> }): Queryable => ({
    async query(sql, params) {
      const r = await c.query(sql, params as any[]);
      return { rows: r.rows, rowCount: r.rowCount ?? r.rows.length };
    },
  });
  const base = wrap(pool);
  return {
    driver: 'pg',
    query: base.query,
    async exec(sql) { await pool.query(sql); },
    async tx(fn) {
      const client = await pool.connect();
      try {
        await client.query('BEGIN');
        const out = await fn(wrap(client));
        await client.query('COMMIT');
        return out;
      } catch (e) {
        await client.query('ROLLBACK').catch(() => {});
        throw e;
      } finally {
        client.release();
      }
    },
    async close() { await pool.end(); },
  };
}

async function createPglite(dir: string): Promise<Db> {
  const { PGlite } = await import('@electric-sql/pglite');
  const { citext } = await import('@electric-sql/pglite/contrib/citext');
  const memory = dir === 'memory' || dir === '';
  if (!memory) fs.mkdirSync(path.resolve(dir), { recursive: true });
  const db = await PGlite.create({ dataDir: memory ? undefined : path.resolve(dir), extensions: { citext }, parsers: PARSERS as any });
  // PGlite is one connection: queue transactions so two requests never interleave inside one.
  let chain: Promise<unknown> = Promise.resolve();
  const serial = <T>(fn: () => Promise<T>): Promise<T> => {
    const next = chain.then(fn, fn);
    chain = next.catch(() => {});
    return next;
  };
  const q = (c: { query: (s: string, p?: unknown[]) => Promise<any> }): Queryable => ({
    async query(sql, params) {
      const r = await c.query(sql, params as any[]);
      return { rows: r.rows, rowCount: Math.max(r.affectedRows ?? 0, r.rows.length) };
    },
  });
  return {
    driver: 'pglite',
    query: (sql, params) => serial(() => q(db).query(sql, params)) as any,
    exec: (sql) => serial(async () => { await db.exec(sql); }),
    tx: (fn) => serial(() => db.transaction((t) => fn(q(t)))),
    async close() { await db.close(); },
  };
}

/** Postgres error code for a unique violation, from either driver. */
export function isUniqueViolation(e: unknown, constraint?: string): boolean {
  const err = e as { code?: string; constraint?: string; message?: string };
  if (err?.code !== '23505') return false;
  if (!constraint) return true;
  return err.constraint === constraint || String(err.message || '').includes(constraint);
}
