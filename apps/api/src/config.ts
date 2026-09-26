/* Everything environment-specific comes from environment variables (docs/12). Nothing secret is
   committed; .env.example documents every variable without values. */
import { z } from 'zod';

const bool = (fallback: boolean) =>
  z.preprocess((v) => (v === undefined || v === '' ? fallback : ['1', 'true', 'yes', 'on'].includes(String(v).toLowerCase())), z.boolean());
const list = z.preprocess((v) => (typeof v === 'string' ? v.split(',').map((s) => s.trim()).filter(Boolean) : []), z.array(z.string()));
const optional = z.preprocess((v) => (v === '' ? undefined : v), z.string().optional());

const schema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().default(8080),
  /** postgres://… in every real environment; pglite:<dir> or pglite:memory for tests and quick local runs. */
  DATABASE_URL: z.string().default('pglite:.data/pglite'),
  PUBLIC_URL: z.string().default('http://localhost:5173'),
  /** Signs receipt drafts and salts analytics. Long and random in production. */
  SESSION_SECRET: z.string().min(16).default('development-only-secret-change-me'),
  TRUST_PROXY: z.string().default('loopback'),
  LOG_LEVEL: z.string().default('info'),
  /** Static build of apps/web to serve, so one container is the whole app. */
  WEB_DIST: optional,

  SMTP_URL: optional,
  MAIL_FROM: z.string().default('UBite <no-reply@ubite.local>'),
  /** Who receives "no menu by 10:00" and "camera silent" (docs/12 — a named person who acts). */
  ALERT_EMAILS: list,

  VAPID_PUBLIC_KEY: optional,
  VAPID_PRIVATE_KEY: optional,
  VAPID_SUBJECT: z.string().default('mailto:ubite@unibuc.ro'),

  /** Comma-separated, so a rotation can overlap: add the new token, redeploy vision, drop the old. */
  VISION_TOKENS: list,

  FEATURE_CAMERA: bool(false),
  FEATURE_LOYALTY: bool(true),
  FEATURE_WASTE: bool(false),
  FEATURE_PREDICTION: bool(true),

  /** Accounts created on first start so somebody can sign in to the staff tools. */
  BOOTSTRAP_TECH_ADMINS: list,
  BOOTSTRAP_CANTEEN_STAFF: list,
  BOOTSTRAP_DCCAS: list,

  /** The canteen's fiscal code(s), digits only (docs/09: the receipt must be the canteen's). Empty
   *  accepts any shop's receipt — set it as soon as a real receipt has been photographed (D6). */
  RECEIPT_FISCAL_CODES: list,

  /** Tesseract language data directory; empty downloads it once to the cache. */
  OCR_LANG_PATH: optional,
  OCR_CACHE_PATH: z.string().default('.data/tesseract'),

  PRIVACY_CONTROLLER: optional,
  PRIVACY_CONTACT_EMAIL: optional,
  PRIVACY_DPO_EMAIL: optional,
  PRIVACY_APPROVED: bool(false),

  /** Development only: print sign-in codes to the log when no SMTP server is configured. */
  DEV_LOG_CODES: bool(false),
  /** A public demo with made-up data and no email: the sign-in code is shown on screen. Never on
   *  the real service — anyone could sign in as anyone. */
  DEMO_SHOW_CODES: bool(false),

  /** Where scheduled work runs: timers in the process (a server, the UB VM), or on incoming
   *  requests, each job at most once per slot (serverless hosting, which has no timers). */
  JOBS: z.enum(['timers', 'requests']).default('timers'),
  /** Serverless only: the bearer token the platform's daily cron calls /api/cron with. */
  CRON_SECRET: optional,
});

export type Config = z.infer<typeof schema>;

export function loadConfig(env: Record<string, string | undefined> = process.env): Config {
  const parsed = schema.safeParse(env);
  if (!parsed.success) {
    throw new Error(`Invalid configuration: ${parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ')}`);
  }
  const cfg = parsed.data;
  // A clone runs with one command: in development, sign-in codes go to the log unless SMTP is set.
  if (cfg.NODE_ENV === 'development' && env.DEV_LOG_CODES === undefined && !cfg.SMTP_URL) cfg.DEV_LOG_CODES = true;
  if (cfg.NODE_ENV === 'production') {
    if (cfg.SESSION_SECRET === 'development-only-secret-change-me') throw new Error('SESSION_SECRET must be set in production');
    if (cfg.DATABASE_URL.startsWith('pglite:')) throw new Error('Production needs a PostgreSQL DATABASE_URL');
    if (cfg.DEV_LOG_CODES) throw new Error('DEV_LOG_CODES must be off in production');
  }
  return cfg;
}

export function features(cfg: Config) {
  return {
    camera: cfg.FEATURE_CAMERA,
    loyalty: cfg.FEATURE_LOYALTY,
    waste: cfg.FEATURE_WASTE,
    prediction: cfg.FEATURE_PREDICTION,
  };
}
