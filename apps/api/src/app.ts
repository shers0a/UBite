/* The Express application. One process serves the API and, in production, the built PWA — one
   container is the whole product, which keeps the move from free hosting to the UB VM a
   connection-string change (docs/12). */
import fs from 'node:fs';
import path from 'node:path';
import express, { type NextFunction, type Request, type Response } from 'express';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import helmet, { type HelmetOptions } from 'helmet';
import type { Config } from './config';
import type { Ctx } from './context';
import { HttpError } from './context';
import { SESSION_COOKIE } from './http';
import { sessionUser } from './services/auth';
import { publicRoutes } from './routes/public';
import { accountRoutes } from './routes/account';
import { staffRoutes } from './routes/staff';
import { adminRoutes, dashboardRoutes, visionRoutes } from './routes/admin';
import { runDue, tick } from './jobs';

/** The security headers, one definition for every host: Express sets them in the container, and
 *  the serverless build copies them onto the static files the platform serves itself. */
export function helmetOptions(cfg: Pick<Config, 'PUBLIC_URL'>): HelmetOptions {
  return {
    contentSecurityPolicy: {
      useDefaults: true,
      directives: {
        'default-src': ["'self'"],
        'script-src': ["'self'"],
        // The design system's components carry their own <style> blocks and inline styles.
        'style-src': ["'self'", "'unsafe-inline'"],
        'img-src': ["'self'", 'data:', 'blob:'],
        'media-src': ["'self'", 'blob:'],
        'connect-src': ["'self'"],
        'font-src': ["'self'"],
        'worker-src': ["'self'"],
        'manifest-src': ["'self'"],
        'frame-ancestors': ["'none'"],
        'upgrade-insecure-requests': cfg.PUBLIC_URL.startsWith('https://') ? [] : null,
      },
    },
    crossOriginEmbedderPolicy: false,
  };
}

export function createApp(ctx: Ctx) {
  const app = express();
  app.disable('x-powered-by');
  app.set('trust proxy', /^\d+$/.test(ctx.cfg.TRUST_PROXY) ? Number(ctx.cfg.TRUST_PROXY) : ctx.cfg.TRUST_PROXY);

  app.use(helmet(helmetOptions(ctx.cfg)));
  app.use(compression());
  app.use(cookieParser());
  app.use('/api', express.json({ limit: '200kb', type: ['application/json'] }));
  app.use('/api/analytics', express.text({ limit: '2kb', type: ['text/plain'] }));

  // Session: a long-lived httpOnly cookie, looked up on every API request (docs/10).
  app.use('/api', async (req, _res, next) => {
    const token = req.cookies?.[SESSION_COOKIE];
    req.sessionToken = token || null;
    req.user = token ? await sessionUser(ctx.db, token, ctx.now()).catch(() => null) : null;
    next();
  });

  // Cross-site requests cannot set a custom header, so every state change must carry one.
  // The vision service authenticates with its bearer token instead; analytics may use a beacon.
  app.use('/api', (req, _res, next) => {
    if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) return next();
    if (req.path.startsWith('/vision/') || req.path.startsWith('/analytics/')) return next();
    if (req.get('x-ubite') !== '1') return next(new HttpError(403, 'missing_header'));
    next();
  });

  if (ctx.cfg.DEMO_SHOW_CODES) {
    // A demo with made-up data stays out of search engines.
    app.use((_req, res, next) => { res.set('X-Robots-Tag', 'noindex, nofollow'); next(); });
  }

  if (ctx.cfg.JOBS === 'requests') {
    // No timers on serverless hosting: requests run what is due. The crowding answer waits for a
    // due cycle, so it is never staler than with timers; everything else lets it finish after.
    app.use('/api', (req, _res, next) => {
      const work = runDue(ctx).catch((e) => ctx.log.error({ err: e?.message }, 'scheduled work failed'));
      if (req.method === 'GET' && /^\/(crowding|status|kiosk)/.test(req.path)) return void work.then(() => next());
      ctx.defer(work);
      next();
    });
    // The platform's daily cron: the nightly jobs run even when nobody opens the app at night.
    app.get('/api/cron', async (req, res, next) => {
      if (!ctx.cfg.CRON_SECRET || req.get('authorization') !== `Bearer ${ctx.cfg.CRON_SECRET}`) return next(new HttpError(401, 'unauthorized'));
      await tick(ctx);
      res.json({ ok: true });
    });
  }

  app.use('/api', publicRoutes(ctx));
  app.use('/api', accountRoutes(ctx));
  app.use('/api', staffRoutes(ctx));
  app.use('/api', dashboardRoutes(ctx));
  app.use('/api', adminRoutes(ctx));
  app.use('/api', visionRoutes(ctx));
  app.use('/api', (_req, _res, next) => next(new HttpError(404, 'not_found')));

  if (ctx.cfg.WEB_DIST && fs.existsSync(path.join(ctx.cfg.WEB_DIST, 'index.html'))) {
    const dist = path.resolve(ctx.cfg.WEB_DIST);
    // Re-read when the build changes, so a rebuilt web app never serves a shell pointing at
    // asset files that no longer exist.
    let shell = { mtime: 0, html: Buffer.alloc(0) };
    const index = () => {
      const file = path.join(dist, 'index.html');
      const mtime = fs.statSync(file).mtimeMs;
      if (mtime !== shell.mtime) shell = { mtime, html: fs.readFileSync(file) };
      return shell.html;
    };
    app.use(express.static(dist, {
      index: false,
      setHeaders(res, file) {
        const name = path.basename(file);
        if (file.includes(`${path.sep}assets${path.sep}`)) res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
        else if (name === 'sw.js' || name.endsWith('.webmanifest')) res.setHeader('Cache-Control', 'no-cache');
        else res.setHeader('Cache-Control', 'public, max-age=3600');
      },
    }));
    // Every route of the single-page app gets the shell — the kiosk must never see a browser error.
    app.get(/^(?!\/api\/).*/, (_req, res) => {
      res.set('Cache-Control', 'no-cache').type('html').send(index());
    });
  }

  // Plain language out, never a stack trace (docs/18 "Error").
  app.use((err: unknown, req: Request, res: Response, _next: NextFunction) => {
    if (err instanceof HttpError) {
      if (err.extra?.retryAfterSeconds) res.set('Retry-After', String(err.extra.retryAfterSeconds));
      return res.status(err.status).json({ error: err.code, message: err.message, ...err.extra });
    }
    const e = err as { type?: string; status?: number; code?: string; message?: string };
    if (e?.type === 'entity.parse.failed') return res.status(400).json({ error: 'invalid_json' });
    if (e?.type === 'entity.too.large' || e?.code === 'LIMIT_FILE_SIZE') return res.status(413).json({ error: 'too_large' });
    ctx.log.error({ err: e?.message, path: req.path, method: req.method }, 'request failed');
    res.status(500).json({ error: 'server_error', message: 'Something went wrong on our side.' });
  });

  return app;
}
