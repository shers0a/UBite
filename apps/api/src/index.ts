import './env';
import { createApp } from './app';
import { createContext, prepare } from './bootstrap';
import { startJobs } from './jobs';

const ctx = await createContext();
// Migrations are a separate, explicit step in production (docs/12); PGlite and local dev
// migrate on start so a clone runs with one command.
const autoMigrate = process.env.MIGRATE_ON_START === '1' || ctx.cfg.NODE_ENV !== 'production';
await prepare(ctx, { migrate: autoMigrate });

const app = createApp(ctx);
const server = app.listen(ctx.cfg.PORT, () => {
  ctx.log.info({ port: ctx.cfg.PORT, db: ctx.db.driver, push: ctx.push.enabled, mail: ctx.mail.enabled }, 'UBite API listening');
});
const stopJobs = startJobs(ctx);

async function shutdown(signal: string) {
  ctx.log.info({ signal }, 'shutting down');
  stopJobs();
  server.close();
  await ctx.db.close().catch(() => {});
  process.exit(0);
}
process.on('SIGTERM', () => void shutdown('SIGTERM'));
process.on('SIGINT', () => void shutdown('SIGINT'));
