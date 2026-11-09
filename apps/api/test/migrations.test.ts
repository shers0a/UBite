/* Schema changes after 001: each one does what its migration says, on PGlite too. */
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { testContext, type TestCtx } from './helpers';

let ctx: TestCtx;
beforeEach(async () => { ctx = await testContext(); });
afterEach(async () => { await ctx.db.close(); });

describe('003: ratings by dish', () => {
  it('indexes ratings on the dish, with the stars inside the index', async () => {
    const r = await ctx.db.query<{ indexdef: string }>("SELECT indexdef FROM pg_indexes WHERE tablename = 'ratings' AND indexname = 'ratings_dish'");
    expect(r.rows[0]?.indexdef).toMatch(/\(dish_id\) INCLUDE \(stars\)/);
  });

  it('is the index a dish’s average and count read', async () => {
    await ctx.db.query('SET enable_seqscan = off');
    const plan = await ctx.db.query<{ 'QUERY PLAN': string }>(
      "EXPLAIN SELECT avg(stars), count(*) FROM ratings WHERE dish_id = '00000000-0000-0000-0000-000000000000'",
    );
    expect(plan.rows.map((p) => p['QUERY PLAN']).join('\n')).toMatch(/ratings_dish/);
  });
});
