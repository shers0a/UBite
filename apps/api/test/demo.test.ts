/* The public demo (DEMO_SHOW_CODES, docs/24): anyone can sign in there as a demo student, so it
   shows codes only to students, has no staff, DCCAS or admin account with a public address, and
   never sends a push message. */
import crypto from 'node:crypto';
import request from 'supertest';
import webpush from 'web-push';
import pino from 'pino';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createPusher } from '../src/services/push';
import { seedDemo } from '../src/seed';
import { appFor, testContext, type TestCtx } from './helpers';

const H = { 'X-UBite': '1' };
let ctx: TestCtx;
afterEach(async () => { await ctx.db.close(); vi.restoreAllMocks(); });

describe('demo sign-in', () => {
  it('shows the code to a student, and never for a staff, DCCAS or admin account', async () => {
    ctx = await testContext({ DEMO_SHOW_CODES: '1' });
    const app = appFor(ctx);
    await ctx.db.query("INSERT INTO users (email, role) VALUES ('cantina@unibuc.ro', 'canteen_staff'), ('dccas@ubite.local', 'dccas_admin'), ('admin@unibuc.ro', 'tech_admin')");
    const ask = (email: string) => request(app).post('/api/auth/request-code').set(H).send({ email });

    const student = await ask('ubite.demo.1@s.unibuc.ro').expect(200);
    expect(student.body.demoCode).toMatch(/^\d{6}$/);
    await request(app).post('/api/auth/verify').set(H).send({ email: 'ubite.demo.1@s.unibuc.ro', code: student.body.demoCode }).expect(200);

    for (const email of ['cantina@unibuc.ro', 'dccas@ubite.local', 'admin@unibuc.ro']) {
      const r = await ask(email).expect(200);
      expect(r.body).toEqual({ sent: true, expiresIn: 600 });
    }
    // An outside address with no account looks the same as the DCCAS one.
    expect((await ask('nobody@ubite.local').expect(200)).body).toEqual({ sent: true, expiresIn: 600 });
  });
});

describe('demo data', () => {
  it('seeds students only: no staff, DCCAS or admin account', async () => {
    ctx = await testContext();
    await seedDemo(ctx, () => {});
    const roles = await ctx.db.query<{ role: string; n: number }>('SELECT role::text AS role, count(*)::int AS n FROM users GROUP BY role');
    expect(roles.rows).toEqual([{ role: 'student', n: 40 }]);
    const menus = await ctx.db.query<{ n: number }>('SELECT count(*)::int AS n FROM daily_menus WHERE published_at IS NOT NULL');
    expect(menus.rows[0].n).toBeGreaterThan(10);
  });
});

describe('demo push', () => {
  it('stores subscriptions and sends nothing', async () => {
    const vapid = webpush.generateVAPIDKeys();
    ctx = await testContext({ DEMO_SHOW_CODES: '1', VAPID_PUBLIC_KEY: vapid.publicKey, VAPID_PRIVATE_KEY: vapid.privateKey });
    ctx.push = createPusher(ctx.cfg, pino({ level: 'silent' }));
    const send = vi.spyOn(webpush, 'sendNotification');
    expect(ctx.push.enabled).toBe(false);
    expect(ctx.push.publicKey).toBe(vapid.publicKey);

    const app = appFor(ctx);
    const agent = request.agent(app);
    const r = await agent.post('/api/auth/request-code').set(H).send({ email: 'ana.pop@s.unibuc.ro' }).expect(200);
    const me = await agent.post('/api/auth/verify').set(H).send({ email: 'ana.pop@s.unibuc.ro', code: r.body.demoCode }).expect(200);
    const ecdh = crypto.createECDH('prime256v1');
    ecdh.generateKeys();
    await agent.post('/api/me/push').set(H).send({
      endpoint: 'https://fcm.googleapis.com/fcm/send/demo-subscription',
      keys: { p256dh: ecdh.getPublicKey().toString('base64url'), auth: crypto.randomBytes(16).toString('base64url') },
    }).expect(201);
    expect((await ctx.db.query('SELECT 1 FROM push_subscriptions')).rowCount).toBe(1);

    const test = await agent.post('/api/me/push/test').set(H);
    expect(test.status).toBe(503);
    expect(test.body.error).toBe('push_off');
    expect(await ctx.push.sendToUsers(ctx.db, [me.body.id], () => ({ title: 'UBite', body: 'x' }))).toBe(0);
    expect(send).not.toHaveBeenCalled();
  });

  it('a real deployment with the same keys does send', () => {
    const vapid = webpush.generateVAPIDKeys();
    const cfg = { VAPID_PUBLIC_KEY: vapid.publicKey, VAPID_PRIVATE_KEY: vapid.privateKey, VAPID_SUBJECT: 'mailto:ubite@unibuc.ro', DEMO_SHOW_CODES: false };
    ctx = { db: { close: async () => {} } } as unknown as TestCtx;
    expect(createPusher(cfg as never, pino({ level: 'silent' })).enabled).toBe(true);
  });
});
