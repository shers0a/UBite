/* Rate limits (docs/04 Security) on a university where a lecture hall shares one public IP:
   a signed-in student is counted on their own account, never on the IP of everyone around them. */
import request from 'supertest';
import { afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { accountOrIp, addressOnIp } from '../src/http';
import { appFor, lastCode, testContext, tinyJpeg, type TestCtx } from './helpers';

const H = { 'X-UBite': '1' };
let ctx: TestCtx;
let app: ReturnType<typeof appFor>;
let photo: Buffer;

beforeAll(async () => { photo = await tinyJpeg(); });
beforeEach(async () => { ctx = await testContext(); app = appFor(ctx); });
afterEach(async () => { await ctx.db.close(); });

async function signIn(email: string) {
  const agent = request.agent(app);
  await agent.post('/api/auth/request-code').set(H).send({ email }).expect(200);
  await agent.post('/api/auth/verify').set(H).send({ email, code: lastCode(ctx, email) }).expect(200);
  return agent;
}

describe('who a limit counts', () => {
  it('an account where there is a session, the IP only without one', () => {
    const req = (user: unknown, body?: unknown) => ({ ip: '193.231.20.5', user, body }) as never;
    expect(accountOrIp(req({ id: 'u1' }))).toBe('user:u1');
    expect(accountOrIp(req(null))).toBe('ip:193.231.20.5');
    expect(addressOnIp(req(null, { email: ' Ana.Pop@s.unibuc.ro ' }))).toBe('ip:193.231.20.5|ana.pop@s.unibuc.ro');
  });
});

describe('students behind one IP', () => {
  it('twenty-five of them can sign in from the same lecture hall', async () => {
    for (let i = 1; i <= 25; i++) await signIn(`student.${i}@s.unibuc.ro`);
  });

  it('one student scanning receipt after receipt does not use up the others’ scans', async () => {
    const ana = await signIn('ana.pop@s.unibuc.ro');
    const ion = await signIn('ion.ionescu@s.unibuc.ro');
    const scan = (agent: request.Agent) => agent.post('/api/me/visits/scan').set(H).attach('receipt', photo, 'receipt.jpg');
    for (let i = 0; i < 20; i++) expect((await scan(ana)).status).toBe(422); // the fake OCR reads nothing
    const limited = await scan(ana);
    expect(limited.status).toBe(429);
    expect(limited.body.error).toBe('rate_limited');
    expect((await scan(ion)).status).toBe(422);
    // Confirming has a budget of its own: the scans did not touch it.
    const confirm = await ana.post('/api/me/visits').set(H).send({ draftToken: 'x.y' });
    expect(confirm.body.error).toBe('invalid_draft');
  });

  it('a signed-in student’s wait reports are their own; anonymous ones share the IP', async () => {
    for (let i = 0; i < 6; i++) await request(app).post('/api/crowding/report').set(H).send({ waitedMinutes: 4 });
    expect((await request(app).post('/api/crowding/report').set(H).send({ waitedMinutes: 4 })).status).toBe(429);
    const ana = await signIn('ana.pop@s.unibuc.ro');
    expect((await ana.post('/api/crowding/report').set(H).send({ waitedMinutes: 4 })).status).toBe(200);
  });
});
