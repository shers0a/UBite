import pino from 'pino';
import { loadConfig, type Config } from './config';
import type { Ctx } from './context';
import { createDb } from './db/index';
import { migrate } from './db/migrate';
import { createMailer } from './services/mail';
import { createPusher } from './services/push';
import { createTesseractReader } from './services/receipt';

export async function createContext(cfg: Config = loadConfig()): Promise<Ctx> {
  // Structured logs, and never personal data in them (docs/04 Observability).
  const log = pino({ level: cfg.LOG_LEVEL, base: { service: 'ubite-api' }, redact: ['req.headers.cookie', 'email', 'to'] });
  const db = await createDb(cfg.DATABASE_URL);
  return {
    db, cfg, log,
    mail: createMailer(cfg, log),
    push: createPusher(cfg, log),
    receipts: createTesseractReader(cfg, log),
    now: () => new Date(),
    defer: (work) => { work.catch((e) => log.error({ err: e?.message }, 'deferred work failed')); },
  };
}

/** Accounts that must exist before anyone can sign in to the staff tools. */
export async function bootstrapAccounts(ctx: Ctx) {
  const add = async (emails: string[], role: string) => {
    for (const raw of emails) {
      const email = raw.trim().toLowerCase();
      await ctx.db.query(
        `INSERT INTO users (email, role) VALUES ($1, $2) ON CONFLICT (email) DO UPDATE SET role = EXCLUDED.role WHERE users.role = 'student' OR users.role = EXCLUDED.role`,
        [email, role],
      );
    }
  };
  await add(ctx.cfg.BOOTSTRAP_TECH_ADMINS, 'tech_admin');
  await add(ctx.cfg.BOOTSTRAP_CANTEEN_STAFF, 'canteen_staff');
  await add(ctx.cfg.BOOTSTRAP_DCCAS, 'dccas_admin');
}

export async function prepare(ctx: Ctx, opts: { migrate: boolean }) {
  if (opts.migrate) await migrate(ctx.db, (m) => ctx.log.info(m));
  await bootstrapAccounts(ctx);
}
