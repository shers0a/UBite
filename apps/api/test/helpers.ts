import pino from 'pino';
import { loadConfig } from '../src/config';
import type { Ctx } from '../src/context';
import { createDb } from '../src/db/index';
import { migrate } from '../src/db/migrate';
import { invalidateSchedule } from '../src/services/schedule';
import { createApp } from '../src/app';

export interface TestCtx extends Ctx {
  setNow(iso: string): void;
  sent: Array<{ to: string; subject: string; text: string }>;
  ocrText: string;
}

/** A fresh in-memory PostgreSQL (PGlite) with the real migrations, a fixed clock and fakes for
 *  mail, push and OCR. */
export async function testContext(env: Record<string, string> = {}): Promise<TestCtx> {
  const cfg = loadConfig({ NODE_ENV: 'test', DATABASE_URL: 'pglite:memory', SESSION_SECRET: 'test-secret-test-secret', VISION_TOKENS: 'vision-test-token', ...env });
  const db = await createDb(cfg.DATABASE_URL);
  await migrate(db);
  invalidateSchedule();
  let now = new Date('2026-10-13T09:40:00Z'); // Tuesday 12:40 in Bucharest
  const sent: TestCtx['sent'] = [];
  const ctx: TestCtx = {
    db, cfg,
    log: pino({ level: 'silent' }),
    mail: { enabled: true, async send(to, subject, text) { sent.push({ to, subject, text }); } },
    push: { enabled: false, publicKey: null, async sendToUsers() { return 0; } },
    receipts: { async read() { return ctx.ocrText; } },
    now: () => now,
    defer: (work) => { work.catch(() => {}); },
    setNow(iso) { now = new Date(iso); },
    sent,
    ocrText: '',
  };
  return ctx;
}

export function appFor(ctx: Ctx) {
  return createApp(ctx);
}

/** The six-digit code from the last email sent to this address. */
export function lastCode(ctx: TestCtx, email: string): string {
  const mail = [...ctx.sent].reverse().find((m) => m.to === email);
  if (!mail) throw new Error(`no mail to ${email}`);
  return mail.text.slice(0, 6);
}
