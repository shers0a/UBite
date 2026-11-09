/* Sign-in codes (docs/10) under attack: guesses in parallel, guesses spread over many codes, an
   address locked until midnight, and an alert to the people who act on it. */
import request from 'supertest';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { MAX_FAILED_PER_DAY } from '../src/services/auth';
import { appFor, lastCode, testContext, type TestCtx } from './helpers';

const H = { 'X-UBite': '1' };
/** A new address for each test: the in-memory per-address limiter outlives a test's database. */
let EMAIL = '';
let n = 0;
let ctx: TestCtx;
let app: ReturnType<typeof appFor>;
let t = 0;
/** Moves the clock on, past the code's back-off. */
const later = (seconds: number) => { t += seconds * 1000; ctx.setNow(new Date(t).toISOString()); };
const ask = (email?: string) => request(app).post('/api/auth/request-code').set(H).send({ email: email ?? EMAIL });
const guess = (code: string, email?: string) => request(app).post('/api/auth/verify').set(H).send({ email: email ?? EMAIL, code });
const wrong = () => (lastCode(ctx, EMAIL) === '000000' ? '111111' : '000000');

beforeEach(async () => {
  ctx = await testContext({ ALERT_EMAILS: 'ops@unibuc.ro' });
  app = appFor(ctx);
  t = new Date('2026-10-13T09:40:00Z').getTime();
  EMAIL = `ana.pop${++n}@s.unibuc.ro`;
});
afterEach(async () => { await ctx.db.close(); });

describe('guessing a sign-in code', () => {
  it('guesses sent all at once take one try between them, not one each', async () => {
    await ask().expect(200);
    const code = lastCode(ctx, EMAIL);
    const guesses = Array.from({ length: 19 }, (_, i) => String((Number(code) + 1 + i) % 1_000_000).padStart(6, '0'));
    const res = await Promise.all(guesses.map((g) => guess(g)));
    const tally = res.reduce<Record<string, number>>((m, r) => ({ ...m, [r.body.error]: (m[r.body.error] ?? 0) + 1 }), {});
    expect(tally.code_wrong).toBe(1);
    expect(tally.slow_down).toBe(18);
    const a = await ctx.db.query<{ attempts: number }>('SELECT attempts FROM auth_codes WHERE email = $1', [EMAIL]);
    expect(a.rows[0].attempts).toBe(1);
  });

  it(`locks the address until midnight after ${MAX_FAILED_PER_DAY} wrong codes in a day, and says so to ALERT_EMAILS`, async () => {
    const errors: string[] = [];
    for (let n = 0; n < MAX_FAILED_PER_DAY; n++) {
      if (n % 5 === 0) { later(60); await ask().expect(200); }
      later(20);
      errors.push((await guess(wrong())).body.error);
    }
    expect(errors.slice(0, -1).every((e) => e === 'code_wrong')).toBe(true);
    expect(errors.at(-1)).toBe('signin_locked');

    const alerts = ctx.sent.filter((m) => m.to === 'ops@unibuc.ro');
    expect(alerts).toHaveLength(1);
    expect(alerts[0].subject).toMatch(/Prea multe coduri greșite/);
    expect(alerts[0].text).toContain('a***@s.unibuc.ro');
    expect(alerts[0].text).not.toContain('ana.pop');
    expect(alerts[0].text).not.toContain(EMAIL);

    // Locked: no new code is emailed, and even the right one is refused.
    later(900);
    const sentBefore = ctx.sent.length;
    const again = await ask();
    expect(again.status).toBe(429);
    expect(again.body.error).toBe('signin_locked');
    expect(Number(again.headers['retry-after'])).toBeGreaterThan(0);
    expect(ctx.sent.length).toBe(sentBefore);
    const code = (await ctx.db.query<{ n: number }>('SELECT count(*)::int AS n FROM auth_codes WHERE email = $1 AND consumed_at IS NULL AND expires_at > $2', [EMAIL, ctx.now()])).rows[0].n;
    expect(code).toBe(0);

    // Another address is not affected; tomorrow this one works again.
    await ask('ion.ionescu@s.unibuc.ro').expect(200);
    ctx.setNow('2026-10-14T09:40:00Z');
    await ask().expect(200);
    await guess(lastCode(ctx, EMAIL)).expect(200);
  });

  it('a right code after a few wrong ones does not count against the day', async () => {
    await ask().expect(200);
    for (let n = 0; n < 3; n++) { later(20); await guess(wrong()); }
    later(20);
    await guess(lastCode(ctx, EMAIL)).expect(200);
    const c = await ctx.db.query<{ n: number }>("SELECT n FROM daily_counters WHERE key LIKE 'signin-failed:%'");
    expect(c.rows[0].n).toBe(3);
    // The counter keeps a hash of the address, never the address.
    const keys = await ctx.db.query<{ key: string }>('SELECT key FROM daily_counters');
    expect(keys.rows.every((k) => !k.key.includes('ana.pop'))).toBe(true);
  });

  it('a code works once, even when two phones send it at the same moment', async () => {
    await ask().expect(200);
    const code = lastCode(ctx, EMAIL);
    const [a, b] = await Promise.all([guess(code), guess(code)]);
    expect([a.status, b.status].filter((st) => st === 200)).toHaveLength(1);
    expect([a.body.error, b.body.error].filter(Boolean)[0]).toMatch(/code_expired|slow_down/);
  });
});
