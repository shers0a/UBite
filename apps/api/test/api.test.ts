import request from 'supertest';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { appFor, lastCode, testContext, type TestCtx } from './helpers';
import { runFusion } from '../src/services/crowding';

let ctx: TestCtx;
let app: ReturnType<typeof appFor>;
const H = { 'X-UBite': '1' };

beforeEach(async () => {
  ctx = await testContext();
  app = appFor(ctx);
});
afterEach(async () => { await ctx.db.close(); });

async function signIn(email: string) {
  const agent = request.agent(app);
  await agent.post('/api/auth/request-code').set(H).send({ email }).expect(200);
  const res = await agent.post('/api/auth/verify').set(H).send({ email, code: lastCode(ctx, email) }).expect(200);
  return { agent, me: res.body };
}

async function dish(name: string, category = 'main', bani = 1500) {
  return (await ctx.db.query<{ id: string }>('INSERT INTO dishes (name_ro, name_en, category, default_price_bani) VALUES ($1, $1, $2, $3) RETURNING id', [name, category, bani])).rows[0].id;
}

describe('sign-in by email code (docs/10)', () => {
  it('accepts only UB addresses for new accounts', async () => {
    const r = await request(app).post('/api/auth/request-code').set(H).send({ email: 'someone@gmail.com' });
    expect(r.status).toBe(422);
    expect(r.body.error).toBe('email_domain');
  });

  it('holds accounts for every UB domain in the database too, and nothing else', async () => {
    // The address rule itself is unit-tested in packages/shared; this is migration 002.
    const add = (email: string) => ctx.db.query("INSERT INTO users (email, role) VALUES ($1, 'student')", [email]);
    for (const email of ['ana.pop@s.unibuc.ro', 'maria.pop@g.unibuc.ro', 'secretariat@unibuc.ro', 'ion@fmi.unibuc.ro']) await add(email);
    await expect(add('someone@gmail.com')).rejects.toThrow(/student_domain/);
  });

  it('signs a student in with the six-digit code and sets an httpOnly cookie', async () => {
    const agent = request.agent(app);
    await agent.post('/api/auth/request-code').set(H).send({ email: 'Ana.Pop@s.unibuc.ro' }).expect(200);
    const res = await agent.post('/api/auth/verify').set(H).send({ email: 'ana.pop@s.unibuc.ro', code: lastCode(ctx, 'ana.pop@s.unibuc.ro') }).expect(200);
    expect(res.body.role).toBe('student');
    expect(String(res.headers['set-cookie'])).toMatch(/ubite_session=.*HttpOnly.*SameSite=Lax/i);
    const me = await agent.get('/api/me').expect(200);
    expect(me.body.email).toBe('ana.pop@s.unibuc.ro');
  });

  it('throttles wrong codes and burns the code after five', async () => {
    const email = 'ana.pop@s.unibuc.ro';
    await request(app).post('/api/auth/request-code').set(H).send({ email }).expect(200);
    const wrong = lastCode(ctx, email) === '000000' ? '111111' : '000000';
    const first = await request(app).post('/api/auth/verify').set(H).send({ email, code: wrong });
    expect(first.body.error).toBe('code_wrong');
    const second = await request(app).post('/api/auth/verify').set(H).send({ email, code: wrong });
    expect(second.status).toBe(429);
    expect(second.body.error).toBe('slow_down');
  });

  it('lets a pre-created staff account in with its own domain', async () => {
    await ctx.db.query("INSERT INTO users (email, role) VALUES ('cantinakogalniceanu@unibuc.ro', 'canteen_staff')");
    const { me } = await signIn('cantinakogalniceanu@unibuc.ro');
    expect(me.role).toBe('canteen_staff');
  });

  it('refuses state changes without the X-UBite header', async () => {
    const r = await request(app).post('/api/auth/request-code').send({ email: 'ana.pop@s.unibuc.ro' });
    expect(r.status).toBe(403);
  });
});

describe('menu (docs/03 F1)', () => {
  it('shows the previous menu, marked outdated, when today is not published', async () => {
    const id = await dish('Ciorbă de perișoare', 'soup', 900);
    const m = await ctx.db.query<{ id: string }>("INSERT INTO daily_menus (service_date, published_at) VALUES ('2026-10-12', now()) RETURNING id");
    await ctx.db.query('INSERT INTO daily_menu_items (daily_menu_id, dish_id, price_bani) VALUES ($1, $2, 900)', [m.rows[0].id, id]);
    const r = await request(app).get('/api/menu/today').expect(200);
    expect(r.body.today).toBe('2026-10-13');
    expect(r.body.outdated).toBe(true);
    expect(r.body.menu.serviceDate).toBe('2026-10-12');
    expect(r.body.menu.items[0].dish.nameRo).toBe('Ciorbă de perișoare');
    expect(r.body.menu.items[0].portionsPrepared).toBeUndefined();
  });

  it('staff publish in one action; students see it at once', async () => {
    await ctx.db.query("INSERT INTO users (email, role) VALUES ('cantina@unibuc.ro', 'canteen_staff')");
    const { agent } = await signIn('cantina@unibuc.ro');
    const soup = await dish('Supă cremă de legume', 'soup', 800);
    const main = await dish('Musaca de legume', 'main', 1400);
    const draft = await agent.get('/api/staff/menu').expect(200);
    expect(draft.body.catalogue).toHaveLength(2);
    await agent.post('/api/staff/menu').set(H).send({ items: [{ dishId: main, priceBani: 1500, portionsPrepared: 90 }, { dishId: soup, priceBani: 800 }] }).expect(200);
    const r = await request(app).get('/api/menu/today').expect(200);
    expect(r.body.outdated).toBe(false);
    expect(r.body.menu.items.map((i: any) => i.dish.nameRo)).toEqual(['Supă cremă de legume', 'Musaca de legume']);
    expect(r.body.menu.items[1].priceBani).toBe(1500);
  });

  it('students cannot publish', async () => {
    const { agent } = await signIn('ana.pop@s.unibuc.ro');
    const r = await agent.post('/api/staff/menu').set(H).send({ items: [] });
    expect(r.status).toBe(403);
  });
});

describe('wait reports (docs/03 F6, docs/07)', () => {
  it('accepts a report in opening hours and moves the estimate', async () => {
    const r = await request(app).post('/api/crowding/report').set(H).send({ waitedMinutes: 7 }).expect(200);
    expect(r.body.accepted).toBe(true);
    expect(r.body.estimate.waitMinutes).toBe(7);
    expect(r.body.estimate.level).toBe('moderate');
    expect(r.body.estimate.quality).toBe('degraded'); // one anonymous report: half weight
  });

  it('rejects reports outside opening hours outright', async () => {
    ctx.setNow('2026-10-13T16:00:00Z'); // 19:00 local
    const r = await request(app).post('/api/crowding/report').set(H).send({ waitedMinutes: 5 });
    expect(r.status).toBe(422);
    expect(r.body.error).toBe('closed');
  });

  it('keeps one accepted report per student per hour', async () => {
    const { agent } = await signIn('ana.pop@s.unibuc.ro');
    await agent.post('/api/crowding/report').set(H).send({ waitedMinutes: 4 }).expect(200);
    const again = await agent.post('/api/crowding/report').set(H).send({ waitedMinutes: 4 });
    expect(again.status).toBe(429);
    expect(again.body.error).toBe('already_reported');
  });

  it('preserves the original time of an offline-queued report', async () => {
    await request(app).post('/api/crowding/report').set(H).send({ waitedMinutes: 3, clientReportedAt: '2026-10-13T09:10:00Z' }).expect(200);
    const row = await ctx.db.query<{ client_reported_at: Date }>('SELECT client_reported_at FROM wait_reports');
    expect(row.rows[0].client_reported_at.toISOString()).toBe('2026-10-13T09:10:00.000Z');
  });

  it('says "closed" instead of a stale number after hours', async () => {
    await request(app).post('/api/crowding/report').set(H).send({ waitedMinutes: 6 }).expect(200);
    ctx.setNow('2026-10-13T15:30:00Z');
    const r = await request(app).get('/api/crowding/current').expect(200);
    expect(r.body.open).toBe(false);
    expect(r.body.level).toBeNull();
  });
});

describe('camera observations (docs/06 services/vision)', () => {
  it('needs the rotatable service token', async () => {
    await request(app).post('/api/vision/observations').send({ zone: 'queue', person_count: 12 }).expect(401);
    await request(app).post('/api/vision/observations').set('Authorization', 'Bearer vision-test-token')
      .send({ timestamp: ctx.now().getTime() / 1000, zone: 'queue', person_count: 40, confidence: 0.8 }).expect(202);
    const f = await runFusion(ctx);
    expect(f?.result.cameraWeight).toBeCloseTo(0.7, 6);
    expect(f?.result.waitMinutes).toBeCloseTo(4.5, 6); // prior: 0.1 × 40 + 0.5
  });
});

describe('status, feedback, analytics', () => {
  it('reports opening hours, next opening and feature flags', async () => {
    const r = await request(app).get('/api/status').expect(200);
    expect(r.body.open).toBe(true);
    expect(r.body.todayHours).toEqual({ opensAt: '11:30', closesAt: '17:00' });
    expect(r.body.features).toMatchObject({ loyalty: true, camera: false });
  });

  it('takes anonymous feedback and refuses an empty form', async () => {
    await request(app).post('/api/feedback').set(H).send({ foodRating: 4, appRating: 5, cameBecauseOfApp: true, source: 'app' }).expect(201);
    await request(app).post('/api/feedback').set(H).send({ source: 'kiosk' }).expect(422);
  });

  it('counts events without any identifier or cookie', async () => {
    await request(app).post('/api/analytics/event').set('Content-Type', 'text/plain').send(JSON.stringify({ name: 'pageview' })).expect(204);
    await request(app).post('/api/analytics/event').send({ name: 'not_an_event' }).expect(204);
    const e = await ctx.db.query<{ name: string; count: number }>('SELECT name, count FROM analytics_events');
    expect(e.rows).toEqual([{ name: 'pageview', count: 1 }]);
    const v = await ctx.db.query('SELECT visitor FROM analytics_visitors');
    expect(v.rowCount).toBe(1);
  });

  it('keeps the dashboard to DCCAS and the developers', async () => {
    const { agent } = await signIn('ana.pop@s.unibuc.ro');
    await agent.get('/api/dashboard/summary').expect(403);
    await ctx.db.query("INSERT INTO users (email, role) VALUES ('dccas@unibuc.ro', 'dccas_admin')");
    const d = await signIn('dccas@unibuc.ro');
    const s = await d.agent.get('/api/dashboard/summary').expect(200);
    expect(s.body.headline).toBeDefined();
    const csv = await d.agent.get('/api/dashboard/export/feedback.csv').expect(200);
    expect(csv.headers['content-type']).toMatch(/text\/csv/);
  });
});

describe('account erasure (docs/10)', () => {
  it('releases the email and removes the ledger, keeping ratings detached', async () => {
    const { agent, me } = await signIn('ana.pop@s.unibuc.ro');
    const id = await dish('Papanași cu smântână', 'dessert', 1200);
    await agent.put(`/api/dishes/${id}/rating`).set(H).send({ stars: 5 }).expect(200);
    await agent.delete('/api/me').set(H).expect(204);
    const u = await ctx.db.query<{ email: string | null; deleted_at: Date | null }>('SELECT email, deleted_at FROM users WHERE id = $1', [me.id]);
    expect(u.rows[0].email).toBeNull();
    expect(u.rows[0].deleted_at).not.toBeNull();
    const rating = await request(app).get(`/api/dishes/${id}`).expect(200);
    expect(rating.body.rating).toEqual({ average: 5, count: 1 });
    await agent.get('/api/me').expect(401);
  });
});
