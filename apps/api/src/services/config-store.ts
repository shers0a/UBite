/* Tech-admin configuration kept in app_config (docs/10: thresholds, camera zones, schedule). */
import type { CrowdingConfig } from '@ubite/shared';
import { BOOTSTRAP_THRESHOLDS } from '@ubite/shared';
import type { Queryable } from '../db/index';

export const DEFAULT_CROWDING_CONFIG: CrowdingConfig = {
  thresholds: { mode: 'auto', low: BOOTSTRAP_THRESHOLDS.low, high: BOOTSTRAP_THRESHOLDS.high, fittedAt: null, sampleSize: null },
  // Until someone draws the real queue on a photo from ceiling height, count the whole frame.
  zones: { queue: [[0, 0], [1, 0], [1, 1], [0, 1]], hall: null },
  // docs/09: a full menu costs about 10 RON — the value of one free meal until DCCAS says otherwise.
  freeMealValueBani: 1000,
};

let cached: { at: number; value: CrowdingConfig } | null = null;

export async function getCrowdingConfig(db: Queryable): Promise<CrowdingConfig> {
  if (cached && Date.now() - cached.at < 10_000) return cached.value;
  const r = await db.query<{ value: CrowdingConfig }>("SELECT value FROM app_config WHERE key = 'crowding'");
  const stored = r.rows[0]?.value;
  const value: CrowdingConfig = stored
    ? { ...DEFAULT_CROWDING_CONFIG, ...stored, thresholds: { ...DEFAULT_CROWDING_CONFIG.thresholds, ...stored.thresholds }, zones: { ...DEFAULT_CROWDING_CONFIG.zones, ...stored.zones } }
    : DEFAULT_CROWDING_CONFIG;
  cached = { at: Date.now(), value };
  return value;
}

export async function setCrowdingConfig(db: Queryable, value: CrowdingConfig) {
  await db.query(
    `INSERT INTO app_config (key, value, updated_at) VALUES ('crowding', $1, now())
     ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = now()`,
    [JSON.stringify(value)],
  );
  cached = null;
}

/** Remembers that something ran (a job, a one-off notification) — survives restarts. */
export async function claimRun(db: Queryable, name: string): Promise<boolean> {
  const r = await db.query('INSERT INTO job_runs (name) VALUES ($1) ON CONFLICT (name) DO NOTHING', [name]);
  return r.rowCount > 0;
}

export async function lastRun(db: Queryable, name: string): Promise<Date | null> {
  const r = await db.query<{ last_run_at: Date }>('SELECT last_run_at FROM job_runs WHERE name = $1', [name]);
  return r.rows[0]?.last_run_at ?? null;
}

/** Claims a recurring slot: true for exactly one caller per `seconds`, however many instances ask
 *  at once — the database decides, so serverless instances need no coordination of their own. */
export async function claimEvery(db: Queryable, name: string, now: Date, seconds: number): Promise<boolean> {
  const r = await db.query(
    `INSERT INTO job_runs (name, last_run_at) VALUES ($1, $2)
     ON CONFLICT (name) DO UPDATE SET last_run_at = EXCLUDED.last_run_at
     WHERE job_runs.last_run_at <= EXCLUDED.last_run_at - make_interval(secs => $3)`,
    [name, now, seconds],
  );
  return r.rowCount > 0;
}

export async function markRun(db: Queryable, name: string) {
  await db.query(
    'INSERT INTO job_runs (name, last_run_at) VALUES ($1, now()) ON CONFLICT (name) DO UPDATE SET last_run_at = now()',
    [name],
  );
}
