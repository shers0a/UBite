/* npm run cli -- <command>
     migrate                     apply migrations/ (the explicit production step, docs/12)
     seed [--demo] [--force]     base catalogue; --demo adds three weeks of data (never production)
     user:add <email> <role>     canteen_staff | dccas_admin | tech_admin
     vapid                       print a new VAPID key pair for web push
     nightly                     run the nightly jobs now (calibration, baseline, analytics roll-up) */
import './env';
import webpush from 'web-push';
import { createContext, bootstrapAccounts } from './bootstrap';
import { migrate } from './db/migrate';
import { seedBase, seedDemo } from './seed';
import { nightly } from './jobs';

const [cmd, ...args] = process.argv.slice(2);

if (cmd === 'vapid') {
  const keys = webpush.generateVAPIDKeys();
  console.log(`VAPID_PUBLIC_KEY=${keys.publicKey}\nVAPID_PRIVATE_KEY=${keys.privateKey}`);
  process.exit(0);
}

const ctx = await createContext();
const log = (m: string) => console.log(m);
try {
  switch (cmd) {
    case 'migrate': {
      const done = await migrate(ctx.db, log);
      log(done.length ? `applied ${done.length} migration(s)` : 'database is up to date');
      await bootstrapAccounts(ctx);
      break;
    }
    case 'seed': {
      await migrate(ctx.db, log);
      if (args.includes('--demo')) {
        if (ctx.cfg.NODE_ENV === 'production' && !args.includes('--force')) throw new Error('refusing demo data in production (use --force on staging only)');
        await seedDemo(ctx, log);
      } else {
        await seedBase(ctx, log);
      }
      break;
    }
    case 'user:add': {
      const [email, role] = args;
      if (!email || !['canteen_staff', 'dccas_admin', 'tech_admin'].includes(role)) throw new Error('usage: user:add <email> <canteen_staff|dccas_admin|tech_admin>');
      await ctx.db.query('INSERT INTO users (email, role) VALUES ($1, $2) ON CONFLICT (email) DO UPDATE SET role = EXCLUDED.role, deleted_at = NULL', [email.toLowerCase(), role]);
      log(`${email} is ${role}`);
      break;
    }
    case 'nightly':
      await nightly(ctx);
      break;
    default:
      console.log('commands: migrate | seed [--demo] | user:add <email> <role> | vapid | nightly');
      process.exitCode = 1;
  }
} catch (e: any) {
  console.error(e.message);
  process.exitCode = 1;
} finally {
  await ctx.db.close();
}
