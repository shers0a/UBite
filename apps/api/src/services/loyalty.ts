/* The loyalty ledger (docs/09). Progress is derived from visits, never stored as a counter:
   counters drift, ledgers do not. The database enforces the two rules that stop fraud —
   one point per calendar day, and a receipt counts once across all users.

   A receipt typed by hand proves nothing (the student copies a number and a total), so it is
   held to three more rules: one every seven days, never the visit that completes a free meal,
   and it clashes with a scan of the same receipt whichever comes first (receiptRef). */
import crypto from 'node:crypto';
import type { LoyaltyResponse, RedeemResponse } from '@ubite/shared';
import {
  LOYALTY_CYCLE, REWARD_ID_ALPHABET, REWARD_ID_LENGTH, REWARD_WINDOW, addDays, localDate, parseCardInput,
  parseRewardInput, rewardDigits, rewardStep, zonedToUtc,
} from '@ubite/shared';
import type { Ctx } from '../context';
import { HttpError } from '../context';
import { isUniqueViolation, type Queryable } from '../db/index';
import { hashReceipt, readsAsDate } from './receipt';
import { loadSchedule, withinHours } from './schedule';
import { notifyOneFromFree } from './notifications';

export type VisitSource = 'receipt_ocr' | 'receipt_manual' | 'staff_confirmed' | 'manual_admin';

export interface VisitInput {
  userId: string;
  occurredOn: string;
  /** Normalised receipt identity; null for staff- or admin-recorded visits. */
  receiptIdentity: string | null;
  /** The receipt's day and number (receiptRef), shared by a scan and a typed entry of it. */
  receiptRef?: string | null;
  totalBani: number | null;
  items: Array<{ name: string; priceBani: number | null }> | null;
  source: VisitSource;
}

export async function loyaltyState(db: Queryable, userId: string, today: string = localDate()): Promise<LoyaltyResponse> {
  const v = await db.query<{ counted: number; today: boolean }>(
    `SELECT count(*) FILTER (WHERE counted_for_loyalty)::int AS counted,
            bool_or(counted_for_loyalty AND occurred_on = $2::date) AS today
     FROM visits WHERE user_id = $1`, [userId, today],
  );
  const r = await db.query<{ id: string; code: string; secret: string; earned_at: Date; redeemed_at: Date | null }>(
    'SELECT id, code, secret, earned_at, redeemed_at FROM loyalty_rewards WHERE user_id = $1 ORDER BY earned_at', [userId],
  );
  const counted = v.rows[0]?.counted ?? 0;
  const open = r.rows.filter((x) => !x.redeemed_at);
  const cycle = counted % LOYALTY_CYCLE;
  // Earned on points, not issued yet: a typed receipt completed the card (see recordVisit).
  const rewardPending = Math.floor(counted / LOYALTY_CYCLE) > r.rows.length;
  return {
    // A full card stays full while its free meal waits at the till, or waits to be issued.
    filled: (open.length || rewardPending) && cycle === 0 ? LOYALTY_CYCLE : cycle,
    countedVisits: counted,
    countedToday: !!v.rows[0]?.today,
    rewards: open.map((x) => ({ id: x.id, code: x.code, secret: x.secret, earnedAt: x.earned_at.toISOString() })),
    rewardPending,
    redeemedCount: r.rows.length - open.length,
    cardId: userId,
  };
}

function newRewardCode(): string {
  let s = '';
  for (let i = 0; i < REWARD_ID_LENGTH; i++) s += REWARD_ID_ALPHABET[crypto.randomInt(REWARD_ID_ALPHABET.length)];
  return s;
}

/** A typed receipt every seven days at most (a rolling week of calendar days). */
export const TYPED_RECEIPT_DAYS = 7;

const duplicate = () => new HttpError(409, 'duplicate_receipt', 'This receipt was already recorded.');

/* What an erased account leaves behind for a receipt's day and number, so that neither path can
   reuse it: "a visit with this total (or an unknown one)" and "a typed visit, with this total or
   with any". Only hashes; they say nothing about who. */
const claim = (kind: 'any' | 'typed', ref: string, totalBani: number | null) =>
  crypto.createHash('sha256').update(`ubite-receipt-${kind}|${ref}|${totalBani ?? ''}`).digest('hex');

function claimsLeft(ref: string, totalBani: number | null, source: VisitSource): string[] {
  const out = [claim('any', ref, totalBani)];
  if (source === 'receipt_manual') out.push(claim('typed', ref, totalBani), claim('typed', ref, null));
  return out;
}

function claimsThatClash(ref: string, totalBani: number | null, typed: boolean): string[] {
  if (typed) return [claim('any', ref, totalBani), claim('any', ref, null)];
  return [claim('typed', ref, totalBani)];
}

/** Account erasure (docs/10): the receipt hashes stay, anonymously, against duplicates. */
export async function retireReceipts(q: Queryable, userId: string) {
  const v = await q.query<{ receipt_hash: string | null; receipt_ref: string | null; receipt_total_bani: number | null; source: VisitSource }>(
    'SELECT receipt_hash, receipt_ref, receipt_total_bani, source::text AS source FROM visits WHERE user_id = $1', [userId],
  );
  const hashes = new Set<string>();
  for (const row of v.rows) {
    if (row.receipt_hash) hashes.add(row.receipt_hash);
    if (row.receipt_ref) for (const h of claimsLeft(row.receipt_ref, row.receipt_total_bani, row.source)) hashes.add(h);
  }
  if (hashes.size) {
    await q.query('INSERT INTO retired_receipt_hashes (receipt_hash) SELECT unnest($1::text[]) ON CONFLICT DO NOTHING', [[...hashes]]);
  }
}

/** Records one visit. Returns what happened; throws for a duplicate receipt and for a second
 *  typed receipt inside a week. */
export async function recordVisit(ctx: Ctx, input: VisitInput): Promise<{ counted: boolean; rewardIssued: boolean; loyalty: LoyaltyResponse }> {
  const hash = input.receiptIdentity ? hashReceipt(input.receiptIdentity) : null;
  const ref = input.receiptRef ?? null;
  const typed = input.source === 'receipt_manual';
  let fourth = false;
  const outcome = await ctx.db.tx(async (q) => {
    // Serialise one student's visits, so two phones cannot race the reward.
    await q.query('SELECT pg_advisory_xact_lock(hashtext($1))', [input.userId]);
    if (typed) {
      const last = await q.query<{ on: string }>(
        `SELECT occurred_on::text AS on FROM visits WHERE user_id = $1 AND source = 'receipt_manual' AND occurred_on > $2::date
         ORDER BY occurred_on DESC LIMIT 1`, [input.userId, addDays(input.occurredOn, -TYPED_RECEIPT_DAYS)],
      );
      if (last.rows[0]) {
        throw new HttpError(429, 'manual_weekly_limit', 'One typed receipt every seven days. Photograph this one.', {
          nextOn: addDays(last.rows[0].on, TYPED_RECEIPT_DAYS),
        });
      }
    }
    if (hash) {
      const retired = await q.query('SELECT 1 FROM retired_receipt_hashes WHERE receipt_hash = $1', [hash]);
      if (retired.rowCount) throw duplicate();
    }
    if (ref) {
      // One receipt, two paths: a scan knows the till's series, a typed entry does not, so their
      // hashes differ. Both know the day, the number and (nearly always) the total. A second
      // lock, on the receipt, after the student's, so two students cannot race it either.
      await q.query('SELECT pg_advisory_xact_lock(7, hashtext($1))', [ref]);
      // A typed receipt clashes with any visit of that day and number whose total is the same or
      // unknown; a scanned one only with a typed one (two scans are told apart by the till).
      const clash = await q.query(
        `SELECT 1 FROM visits WHERE receipt_ref = $1 AND ($2::boolean OR source = 'receipt_manual')
           AND ($3::int IS NULL OR receipt_total_bani IS NULL OR receipt_total_bani = $3::int) LIMIT 1`,
        [ref, typed, input.totalBani],
      );
      if (clash.rowCount) throw duplicate();
      const retired = await q.query('SELECT 1 FROM retired_receipt_hashes WHERE receipt_hash = ANY($1::text[])', [claimsThatClash(ref, input.totalBani, typed)]);
      if (retired.rowCount) throw duplicate();
    }
    const already = await q.query(
      'SELECT 1 FROM visits WHERE user_id = $1 AND occurred_on = $2 AND counted_for_loyalty', [input.userId, input.occurredOn],
    );
    // A second receipt the same day still counts for spend history, but not for a point.
    const counted = already.rowCount === 0;
    try {
      await q.query(
        `INSERT INTO visits (user_id, occurred_on, receipt_hash, receipt_ref, receipt_total_bani, items_json, source, counted_for_loyalty)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [input.userId, input.occurredOn, hash, ref, input.totalBani, input.items ? JSON.stringify(input.items) : null, input.source, counted],
      );
    } catch (e) {
      if (isUniqueViolation(e, 'visits_receipt_hash_key')) throw duplicate();
      if (isUniqueViolation(e, 'visits_one_point_per_day')) throw new HttpError(409, 'already_today');
      throw e;
    }
    let rewardIssued = false;
    // A typed receipt can earn the fifth point but never issues the free meal: the next visit
    // that is not typed does (a scanned receipt, or the cashier confirming the card), even one
    // that earns no point of its own.
    if (counted || !typed) {
      const c = await q.query<{ visits: number; rewards: number }>(
        `SELECT (SELECT count(*)::int FROM visits WHERE user_id = $1 AND counted_for_loyalty) AS visits,
                (SELECT count(*)::int FROM loyalty_rewards WHERE user_id = $1) AS rewards`, [input.userId],
      );
      const { visits, rewards } = c.rows[0];
      fourth = counted && visits % LOYALTY_CYCLE === LOYALTY_CYCLE - 1;
      if (!typed && Math.floor(visits / LOYALTY_CYCLE) > rewards) {
        for (let attempt = 0; attempt < 8 && !rewardIssued; attempt++) {
          const inserted = await q.query(
            `INSERT INTO loyalty_rewards (user_id, earned_at, code, secret) VALUES ($1, $2, $3, $4)
             ON CONFLICT (code) DO NOTHING`,
            [input.userId, ctx.now(), newRewardCode(), crypto.randomBytes(20).toString('hex')],
          );
          rewardIssued = inserted.rowCount > 0;
        }
        if (!rewardIssued) throw new Error('could not allocate a reward code');
      }
    }
    return { counted, rewardIssued };
  });
  if (fourth) await notifyOneFromFree(ctx, input.userId).catch(() => {});
  return { ...outcome, loyalty: await loyaltyState(ctx.db, input.userId, localDate(ctx.now())) };
}

/** A receipt must be from today and inside opening hours (docs/09 "OCR"). Without a readable
 *  time — manual entry — the visit is accepted on the day, up to ninety minutes after closing. */
export async function checkReceiptWindow(ctx: Ctx, date: string | null, time: string | null) {
  const now = ctx.now();
  const today = localDate(now);
  if (date && !readsAsDate(date, today)) throw new HttpError(422, 'receipt_not_today', 'The receipt is not from today.');
  const schedule = await loadSchedule(ctx.db);
  if (time) {
    if (!withinHours(schedule, zonedToUtc(today, time), 5)) {
      throw new HttpError(422, 'receipt_outside_hours', 'The receipt time is outside opening hours.');
    }
  } else if (!withinHours(schedule, now, 90)) {
    throw new HttpError(422, 'closed', 'Visits are recorded on the day, around opening hours.');
  }
}

/* ── Redemption at the till (docs/09 "Redemption") ─────────────────────────────────────── */

async function redeemReward(ctx: Ctx, rewardId: string, digits: string, staffId: string): Promise<RedeemResponse> {
  const r = await ctx.db.query<{ id: string; secret: string; redeemed_at: Date | null; earned_at: Date }>(
    'SELECT id, secret, redeemed_at, earned_at FROM loyalty_rewards WHERE code = $1', [rewardId],
  );
  const reward = r.rows[0];
  if (!reward) return { kind: 'reward', status: 'invalid' };
  if (reward.redeemed_at) return { kind: 'reward', status: 'used' };
  const step = rewardStep(ctx.now().getTime());
  let fresh = false;
  let stale = false;
  for (let d = -30; d <= REWARD_WINDOW; d++) {
    if ((await rewardDigits(reward.secret, step + d)) === digits) {
      if (d >= -REWARD_WINDOW) fresh = true; else stale = true;
      break;
    }
  }
  if (!fresh) return { kind: 'reward', status: stale ? 'expired' : 'invalid' };
  const u = await ctx.db.query(
    'UPDATE loyalty_rewards SET redeemed_at = $2, redeemed_by = $3 WHERE id = $1 AND redeemed_at IS NULL',
    [reward.id, ctx.now(), staffId],
  );
  if (!u.rowCount) return { kind: 'reward', status: 'used' };
  return { kind: 'reward', status: 'ok', earnedAt: reward.earned_at.toISOString() };
}

/** One field, one button: a reward code redeems; a scanned card confirms today's visit. */
export async function redeemAtTill(ctx: Ctx, input: string, staffId: string): Promise<RedeemResponse> {
  const reward = parseRewardInput(input);
  if (reward) return redeemReward(ctx, reward.rewardId, reward.digits, staffId);
  const card = parseCardInput(input);
  if (card) {
    const user = await ctx.db.query("SELECT 1 FROM users WHERE id = $1 AND deleted_at IS NULL AND role = 'student'", [card]);
    if (!user.rowCount) return { kind: 'card', status: 'unknown' };
    const schedule = await loadSchedule(ctx.db);
    if (!withinHours(schedule, ctx.now(), 30)) return { kind: 'card', status: 'closed' };
    try {
      const res = await recordVisit(ctx, {
        userId: card, occurredOn: localDate(ctx.now()), receiptIdentity: null, totalBani: null, items: null, source: 'staff_confirmed',
      });
      return { kind: 'card', status: res.counted ? 'ok' : 'already_today' };
    } catch (e) {
      if (e instanceof HttpError && e.code === 'already_today') return { kind: 'card', status: 'already_today' };
      throw e;
    }
  }
  return { kind: 'reward', status: 'invalid' };
}
