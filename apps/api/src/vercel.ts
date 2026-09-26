/* The serverless entry (Vercel, docs/12 "free hosting"): the same Express app the container runs,
   created once per instance. There are no timers between requests, so scheduled work runs on
   requests (JOBS=requests) and on the platform's daily cron; work that may finish after the
   response is handed to waitUntil. Built by scripts/vercel-build.ts. */
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { waitUntil } from '@vercel/functions';
import { createApp } from './app';
import { createContext, prepare } from './bootstrap';

const here = path.dirname(fileURLToPath(import.meta.url));
process.env.NODE_ENV ||= 'production';
process.env.JOBS ||= 'requests';
process.env.MIGRATIONS_DIR ||= path.join(here, 'migrations');
process.env.OCR_LANG_PATH ||= path.join(here, 'tessdata');
process.env.OCR_CACHE_PATH ||= '/tmp/tesseract';

type Handler = (req: IncomingMessage, res: ServerResponse) => void;
let app: Promise<Handler> | null = null;

function instance(): Promise<Handler> {
  app ??= (async () => {
    const ctx = await createContext();
    ctx.defer = (work) => waitUntil(work.catch((e) => ctx.log.error({ err: e?.message }, 'deferred work failed')));
    await prepare(ctx, { migrate: process.env.MIGRATE_ON_START === '1' });
    return createApp(ctx) as unknown as Handler;
  })();
  // A failed start (the database asleep) is retried by the next request, not cached.
  app.catch(() => { app = null; });
  return app;
}

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  (await instance())(req, res);
}
