/* A push subscription is a URL the server will connect to (web-push POSTs to it), so only the
   browsers' push services are stored or sent to: https on 443, by name, never an IP. */
import crypto from 'node:crypto';
import request from 'supertest';
import webpush from 'web-push';
import pino from 'pino';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createPusher, isPushEndpoint } from '../src/services/push';
import { appFor, lastCode, testContext, type TestCtx } from './helpers';

const H = { 'X-UBite': '1' };
let ctx: TestCtx | undefined;
afterEach(async () => { await ctx?.db.close(); ctx = undefined; vi.restoreAllMocks(); });

const keys = () => {
  const ecdh = crypto.createECDH('prime256v1');
  ecdh.generateKeys();
  return { p256dh: ecdh.getPublicKey().toString('base64url'), auth: crypto.randomBytes(16).toString('base64url') };
};

describe('push endpoints', () => {
  it('accepts the browsers\' push services', () => {
    for (const url of [
      'https://fcm.googleapis.com/fcm/send/abc:APA91b',
      'https://fcm.googleapis.com/wp/abc',
      'https://android.googleapis.com/gcm/send/abc',
      'https://updates.push.services.mozilla.com/wpush/v2/gAAAA',
      'https://web.push.apple.com/QGv9',
      'https://wns2-par02p.notify.windows.com/w/?token=BQYAAA',
      'https://FCM.googleapis.com:443/fcm/send/abc',
    ]) expect(isPushEndpoint(url), url).toBe(true);
  });

  it('refuses everything else: other hosts, http, other ports, IPs, credentials', () => {
    for (const url of [
      'http://fcm.googleapis.com/fcm/send/abc',
      'https://fcm.googleapis.com:8443/fcm/send/abc',
      'https://storage.googleapis.com/bucket/x',
      'https://fcm.googleapis.com.evil.example/x',
      'https://evilfcm.googleapis.com/x',
      'https://push.apple.com/x',
      'https://.push.apple.com/x',
      'https://evil-push.apple.com.example/x',
      'https://notify.windows.com.evil.example/x',
      'https://user:pw@fcm.googleapis.com/fcm/send/abc',
      'https://127.0.0.1/x',
      'https://10.0.0.5/x',
      'https://169.254.169.254/latest/meta-data',
      'https://192.168.1.1/x',
      'https://2130706433/x',
      'https://0x7f.1/x',
      'https://[::1]/x',
      'https://[fd00::1]/x',
      'https://localhost/x',
      'file:///etc/passwd',
      'not a url',
    ]) expect(isPushEndpoint(url), url).toBe(false);
  });

  it('POST /me/push stores a push service endpoint and refuses any other URL', async () => {
    ctx = await testContext();
    const app = appFor(ctx);
    const agent = request.agent(app);
    const email = 'ana.pop@s.unibuc.ro';
    await agent.post('/api/auth/request-code').set(H).send({ email }).expect(200);
    await agent.post('/api/auth/verify').set(H).send({ email, code: lastCode(ctx, email) }).expect(200);

    for (const endpoint of ['http://127.0.0.1:5432/', 'https://169.254.169.254/latest/meta-data', 'https://internal.example.com/push']) {
      const r = await agent.post('/api/me/push').set(H).send({ endpoint, keys: keys() });
      expect(r.status, endpoint).toBe(422);
      expect(r.body.error).toBe('push_endpoint');
    }
    expect((await ctx.db.query('SELECT 1 FROM push_subscriptions')).rowCount).toBe(0);
    await agent.post('/api/me/push').set(H).send({ endpoint: 'https://fcm.googleapis.com/fcm/send/real', keys: keys() }).expect(201);
    expect((await ctx.db.query('SELECT 1 FROM push_subscriptions')).rowCount).toBe(1);
  });

  it('never connects to a subscription stored before the check, and drops it', async () => {
    ctx = await testContext();
    const vapid = webpush.generateVAPIDKeys();
    const pusher = createPusher({ ...ctx.cfg, VAPID_PUBLIC_KEY: vapid.publicKey, VAPID_PRIVATE_KEY: vapid.privateKey }, pino({ level: 'silent' }));
    const send = vi.spyOn(webpush, 'sendNotification').mockResolvedValue({ statusCode: 201, body: '', headers: {} });
    const user = (await ctx.db.query<{ id: string }>("INSERT INTO users (email, role) VALUES ('ion.ion@s.unibuc.ro', 'student') RETURNING id")).rows[0].id;
    const k = keys();
    await ctx.db.query('INSERT INTO push_subscriptions (user_id, endpoint, p256dh, auth) VALUES ($1, $2, $3, $4), ($1, $5, $3, $4)',
      [user, 'http://10.0.0.5:6379/', k.p256dh, k.auth, 'https://fcm.googleapis.com/fcm/send/ok']);

    expect(await pusher.sendToUsers(ctx.db, [user], () => ({ title: 'UBite', body: 'x' }))).toBe(1);
    expect(send).toHaveBeenCalledTimes(1);
    expect(send.mock.calls[0][0].endpoint).toBe('https://fcm.googleapis.com/fcm/send/ok');
    const left = await ctx.db.query<{ endpoint: string }>('SELECT endpoint FROM push_subscriptions');
    expect(left.rows.map((r) => r.endpoint)).toEqual(['https://fcm.googleapis.com/fcm/send/ok']);
  });
});
