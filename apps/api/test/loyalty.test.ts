/* docs/04 "Testing": the loyalty ledger — one point per day, global receipt uniqueness, reward
   issuance and single-use redemption. An error here gives away free meals or denies earned ones. */
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { addDays, rewardCodeAt, rewardDigits, rewardStep } from '@ubite/shared';
import { checkReceiptWindow, loyaltyState, recordVisit, redeemAtTill } from '../src/services/loyalty';
import { eraseAccount } from '../src/services/auth';
import { hashReceipt, parseReceipt, receiptIdentity, receiptRef, typedReceiptIdentity } from '../src/services/receipt';
import { testContext, type TestCtx } from './helpers';

let ctx: TestCtx;
let student: string;
let other: string;
let staff: string;

async function user(email: string, role = 'student') {
  return (await ctx.db.query<{ id: string }>('INSERT INTO users (email, role) VALUES ($1, $2) RETURNING id', [email, role])).rows[0].id;
}

const visit = (userId: string, day: string, receipt: string | null = `${day}-${Math.random()}`) =>
  recordVisit(ctx, { userId, occurredOn: day, receiptIdentity: receipt, totalBani: 2600, items: null, source: 'receipt_ocr' });

beforeEach(async () => {
  ctx = await testContext();
  student = await user('ana.pop@s.unibuc.ro');
  other = await user('ion.ionescu@s.unibuc.ro');
  staff = await user('cantina@unibuc.ro', 'canteen_staff');
});
afterEach(async () => { await ctx.db.close(); });

describe('one point per calendar day', () => {
  it('counts the first receipt of the day and records the second without a point', async () => {
    const a = await visit(student, '2026-10-13');
    const b = await visit(student, '2026-10-13');
    expect(a.counted).toBe(true);
    expect(b.counted).toBe(false);
    const s = await loyaltyState(ctx.db, student, '2026-10-13');
    expect(s.countedVisits).toBe(1);
    expect(s.countedToday).toBe(true);
  });

  it('is enforced by the database, not only by the service', async () => {
    await visit(student, '2026-10-13');
    await expect(ctx.db.query(
      "INSERT INTO visits (user_id, occurred_on, source, counted_for_loyalty) VALUES ($1, '2026-10-13', 'manual_admin', true)", [student],
    )).rejects.toThrow();
  });
});

describe('a receipt counts once, globally', () => {
  it('rejects the same receipt for the same student', async () => {
    await visit(student, '2026-10-13', 'RECEIPT-1');
    await expect(visit(student, '2026-10-14', 'RECEIPT-1')).rejects.toMatchObject({ code: 'duplicate_receipt' });
  });

  it('rejects a receipt shared with a friend', async () => {
    await visit(student, '2026-10-13', 'RECEIPT-2');
    await expect(visit(other, '2026-10-13', 'RECEIPT-2')).rejects.toMatchObject({ code: 'duplicate_receipt' });
  });

  it('keeps rejecting it after the first owner deletes their account', async () => {
    await visit(student, '2026-10-13', 'RECEIPT-3');
    await eraseAccount(ctx, student);
    await expect(visit(other, '2026-10-14', 'RECEIPT-3')).rejects.toMatchObject({ code: 'duplicate_receipt' });
    const left = await ctx.db.query('SELECT 1 FROM visits WHERE user_id = $1', [student]);
    expect(left.rowCount).toBe(0);
  });
});

describe('reward issuance', () => {
  it('issues one reward on the fifth counted day, never twice', async () => {
    const days = ['2026-10-05', '2026-10-06', '2026-10-07', '2026-10-08'];
    for (const d of days) expect((await visit(student, d)).rewardIssued).toBe(false);
    const fifth = await visit(student, '2026-10-09');
    expect(fifth.rewardIssued).toBe(true);
    expect(fifth.loyalty.rewards).toHaveLength(1);
    expect(fifth.loyalty.filled).toBe(5); // a full card while the free meal waits
    const extraSameDay = await visit(student, '2026-10-09');
    expect(extraSameDay.rewardIssued).toBe(false);
    const rewards = await ctx.db.query('SELECT 1 FROM loyalty_rewards WHERE user_id = $1', [student]);
    expect(rewards.rowCount).toBe(1);
  });

  it('derives progress from the ledger: 4 of 5, then a new cycle', async () => {
    for (const d of ['2026-10-05', '2026-10-06', '2026-10-07', '2026-10-08']) await visit(student, d);
    expect((await loyaltyState(ctx.db, student, '2026-10-08')).filled).toBe(4);
    await visit(student, '2026-10-09');
    await visit(student, '2026-10-12');
    const s = await loyaltyState(ctx.db, student, '2026-10-12');
    expect(s.filled).toBe(1);
    expect(s.rewards).toHaveLength(1);
  });
});

describe('single-use redemption with a rolling code', () => {
  async function earn() {
    for (const d of ['2026-10-05', '2026-10-06', '2026-10-07', '2026-10-08', '2026-10-09']) await visit(student, d);
    return (await loyaltyState(ctx.db, student)).rewards[0];
  }

  it('redeems the current code once, then refuses it', async () => {
    const reward = await earn();
    const code = await rewardCodeAt(reward.code, reward.secret, ctx.now().getTime());
    expect(await redeemAtTill(ctx, code, staff)).toMatchObject({ kind: 'reward', status: 'ok' });
    expect(await redeemAtTill(ctx, code, staff)).toMatchObject({ kind: 'reward', status: 'used' });
    expect((await loyaltyState(ctx.db, student)).redeemedCount).toBe(1);
  });

  it('refuses a screenshot that is ten minutes old', async () => {
    const reward = await earn();
    const old = await rewardCodeAt(reward.code, reward.secret, ctx.now().getTime() - 10 * 60_000);
    expect(await redeemAtTill(ctx, old, staff)).toMatchObject({ status: 'expired' });
  });

  it('accepts a code from a minute ago (clock drift, slow queue)', async () => {
    const reward = await earn();
    const code = await rewardCodeAt(reward.code, reward.secret, ctx.now().getTime() - 60_000);
    expect(await redeemAtTill(ctx, code.toLowerCase().replace(' ', '-'), staff)).toMatchObject({ status: 'ok' });
  });

  it('refuses a made-up code', async () => {
    const reward = await earn();
    const step = rewardStep(ctx.now().getTime());
    const used = new Set<string>();
    for (let d = -30; d <= 3; d++) used.add(await rewardDigits(reward.secret, step + d));
    let guess = 0;
    while (used.has(String(guess).padStart(4, '0'))) guess++;
    expect(await redeemAtTill(ctx, `${reward.code} ${String(guess).padStart(4, '0')}`, staff)).toMatchObject({ status: 'invalid' });
    expect(await redeemAtTill(ctx, 'NOPE', staff)).toMatchObject({ status: 'invalid' });
  });
});

describe('staff-confirmed visit from the card QR', () => {
  it('adds today\'s point once', async () => {
    expect(await redeemAtTill(ctx, `UBITE:C:${student}`, staff)).toMatchObject({ kind: 'card', status: 'ok' });
    expect(await redeemAtTill(ctx, `UBITE:C:${student}`, staff)).toMatchObject({ kind: 'card', status: 'already_today' });
  });
  it('refuses outside opening hours', async () => {
    ctx.setNow('2026-10-13T18:00:00Z'); // 21:00 local
    expect(await redeemAtTill(ctx, `UBITE:C:${student}`, staff)).toMatchObject({ kind: 'card', status: 'closed' });
  });
});

describe('receipt window', () => {
  it('rejects a receipt from another day and one outside opening hours', async () => {
    await expect(checkReceiptWindow(ctx, addDays('2026-10-13', -1), '12:30')).rejects.toMatchObject({ code: 'receipt_not_today' });
    await expect(checkReceiptWindow(ctx, '2026-10-13', '09:15')).rejects.toMatchObject({ code: 'receipt_outside_hours' });
    await expect(checkReceiptWindow(ctx, '2026-10-13', '12:31')).resolves.toBeUndefined();
  });
});

describe('receipt parsing', () => {
  const text = `UNIVERSITATEA DIN BUCURESTI
CANTINA KOGALNICEANU
C.I.F.: RO4505502
CIORBA PERISOARE
1.000 BUC x 9.00        9.00 B
PUI CUPTOR CARTOFI
1.000 BUC x 17.00      17.00 B
SUBTOTAL               26.00
TOTAL LEI              26,00
CARD                   26.00
TOTAL TVA B             2.15
BON FISCAL NR: 0421
Z: 0123
DATA: 13/10/2026 ORA: 12:48:03
ID UNIC: 8000123456`;

  it('reads number, total, date, time, till and items', () => {
    const p = parseReceipt(text)!;
    expect(p.receiptNumber).toBe('421');
    expect(p.totalBani).toBe(2600);
    expect(p.date).toBe('2026-10-13');
    expect(p.time).toBe('12:48');
    expect(p.fiscalCode).toBe('4505502');
    expect(p.deviceId).toBe('8000123456');
    expect(p.zNumber).toBe('123');
    expect(p.items.map((i) => i.name)).toEqual(['Ciorba perisoare', 'Pui cuptor cartofi']);
  });

  it('gives up without a receipt number — never a silent acceptance', () => {
    expect(parseReceipt('TOTAL LEI 26,00\nDATA: 13/10/2026')).toBeNull();
    expect(parseReceipt('')).toBeNull();
  });

  it('hashes the same receipt identically however the number is written', () => {
    const a = hashReceipt(receiptIdentity({ receiptNumber: '0421', date: '2026-10-13' }));
    const b = hashReceipt(receiptIdentity({ receiptNumber: '421', date: '2026-10-13' }));
    expect(a).toBe(b);
    expect(a).not.toBe(hashReceipt(receiptIdentity({ receiptNumber: '421', date: '2026-10-14' })));
  });
});

/* ── Typed receipts (docs/09 DEGRADATION): one a week, never the free meal, one receipt once ── */

/** A receipt photographed and read: the till's series is in its hash. */
const scanned = (userId: string, day: string, number: string, totalBani: number | null, deviceId = 'DA4400012345') =>
  recordVisit(ctx, {
    userId, occurredOn: day, receiptIdentity: receiptIdentity({ receiptNumber: number, date: day, deviceId }),
    receiptRef: receiptRef({ receiptNumber: number, date: day }), totalBani, items: null, source: 'receipt_ocr',
  });

/** A receipt typed by hand: day, number and total, no series. */
const typed = (userId: string, day: string, number: string, totalBani: number) =>
  recordVisit(ctx, {
    userId, occurredOn: day, receiptIdentity: typedReceiptIdentity({ receiptNumber: number, date: day, totalBani }),
    receiptRef: receiptRef({ receiptNumber: number, date: day }), totalBani, items: null, source: 'receipt_manual',
  });

describe('a typed receipt, at most one in any seven days', () => {
  it('refuses a second inside the week and takes one again seven days later', async () => {
    expect((await typed(student, '2026-10-13', '57', 1700)).counted).toBe(true);
    await expect(typed(student, '2026-10-14', '58', 1700)).rejects.toMatchObject({ status: 429, code: 'manual_weekly_limit', extra: { nextOn: '2026-10-20' } });
    await expect(typed(student, '2026-10-19', '59', 1700)).rejects.toMatchObject({ code: 'manual_weekly_limit' });
    expect((await typed(student, '2026-10-20', '60', 1700)).counted).toBe(true);
    // Scanned receipts are not limited, and the limit is each student's own.
    expect((await scanned(student, '2026-10-21', '61', 1700)).counted).toBe(true);
    expect((await typed(other, '2026-10-21', '62', 1700)).counted).toBe(true);
  });

  it('does not use up the week on a typed receipt that was refused as a duplicate', async () => {
    await scanned(other, '2026-10-13', '57', 1700);
    await expect(typed(student, '2026-10-13', '57', 1700)).rejects.toMatchObject({ code: 'duplicate_receipt' });
    expect((await typed(student, '2026-10-14', '12', 900)).counted).toBe(true);
  });
});

describe('a typed receipt never issues a free meal', () => {
  const four = ['2026-10-05', '2026-10-06', '2026-10-07', '2026-10-08'];

  it('counts as the fifth visit, and the next scanned receipt issues the reward', async () => {
    for (const [i, d] of four.entries()) await scanned(student, d, String(10 + i), 1700);
    const fifth = await typed(student, '2026-10-09', '99', 1700);
    expect(fifth).toMatchObject({ counted: true, rewardIssued: false });
    expect(fifth.loyalty).toMatchObject({ countedVisits: 5, filled: 5, rewardPending: true, rewards: [] });

    const next = await scanned(student, '2026-10-12', '20', 1700);
    expect(next).toMatchObject({ counted: true, rewardIssued: true });
    expect(next.loyalty.rewards).toHaveLength(1);
    expect(next.loyalty.rewardPending).toBe(false);
    expect(next.loyalty.countedVisits).toBe(6);
    // One reward per five points, never two for the same five.
    const after = await scanned(student, '2026-10-13', '21', 1700);
    expect(after.rewardIssued).toBe(false);
    expect((await ctx.db.query('SELECT 1 FROM loyalty_rewards WHERE user_id = $1', [student])).rowCount).toBe(1);
  });

  it('a scanned receipt later the same day issues it too, though it earns no point', async () => {
    for (const [i, d] of four.entries()) await scanned(student, d, String(10 + i), 1700);
    await typed(student, '2026-10-09', '99', 1700);
    const sameDay = await scanned(student, '2026-10-09', '100', 900);
    expect(sameDay).toMatchObject({ counted: false, rewardIssued: true });
    expect(sameDay.loyalty).toMatchObject({ countedVisits: 5, filled: 5, rewardPending: false });
  });

  it('the cashier confirming the card issues it as well', async () => {
    for (const [i, d] of four.entries()) await scanned(student, d, String(10 + i), 1700);
    await typed(student, '2026-10-09', '99', 1700);
    ctx.setNow('2026-10-12T09:40:00Z');
    expect(await redeemAtTill(ctx, `UBITE:C:${student}`, staff)).toMatchObject({ kind: 'card', status: 'ok' });
    const s = await loyaltyState(ctx.db, student, '2026-10-12');
    expect(s.rewards).toHaveLength(1);
    expect(s.rewardPending).toBe(false);
  });

  it('a typed receipt that earns a point past the fifth still issues nothing', async () => {
    for (const [i, d] of four.entries()) await scanned(student, d, String(10 + i), 1700);
    await typed(student, '2026-10-09', '99', 1700);
    const later = await typed(student, '2026-10-16', '98', 1700);
    expect(later).toMatchObject({ counted: true, rewardIssued: false });
    expect(later.loyalty).toMatchObject({ countedVisits: 6, rewardPending: true });
    expect((await scanned(student, '2026-10-19', '30', 1700)).rewardIssued).toBe(true);
  });
});

describe('one receipt counts once, scanned or typed, whichever comes first', () => {
  it('a typed copy of a scanned receipt is refused, for anyone', async () => {
    await scanned(student, '2026-10-13', '57', 1700);
    await expect(typed(other, '2026-10-13', '0057', 1700)).rejects.toMatchObject({ code: 'duplicate_receipt' });
  });

  it('a scan of a receipt someone already typed is refused', async () => {
    await typed(student, '2026-10-13', '57', 1700);
    await expect(scanned(other, '2026-10-13', '57', 1700)).rejects.toMatchObject({ code: 'duplicate_receipt' });
  });

  it('a scan whose total could not be read clashes with a typed receipt of that number, both ways', async () => {
    await typed(student, '2026-10-13', '57', 1700);
    await expect(scanned(other, '2026-10-13', '57', null)).rejects.toMatchObject({ code: 'duplicate_receipt' });
    await scanned(other, '2026-10-13', '58', null);
    const third = await user('maria.pop@s.unibuc.ro');
    await expect(typed(third, '2026-10-13', '58', 2400)).rejects.toMatchObject({ code: 'duplicate_receipt' });
  });

  it('two tills, one number: different totals or different series are different receipts', async () => {
    await scanned(student, '2026-10-13', '57', 1700, 'DA4400012345');
    expect((await scanned(other, '2026-10-13', '57', 1700, 'ED4747386469')).counted).toBe(true);
    const third = await user('maria.pop@s.unibuc.ro');
    expect((await typed(third, '2026-10-13', '57', 2650)).counted).toBe(true);
    // The same number on another day is another receipt.
    const fourth = await user('dan.pop@s.unibuc.ro');
    expect((await typed(fourth, '2026-10-14', '57', 1700)).counted).toBe(true);
  });

  it('keeps refusing it, either way, after the first owner erases the account', async () => {
    await scanned(student, '2026-10-13', '57', 1700);
    await typed(other, '2026-10-13', '58', 900);
    await eraseAccount(ctx, student);
    await eraseAccount(ctx, other);
    const a = await user('maria.pop@s.unibuc.ro');
    const b = await user('dan.pop@s.unibuc.ro');
    await expect(typed(a, '2026-10-13', '57', 1700)).rejects.toMatchObject({ code: 'duplicate_receipt' });
    await expect(scanned(b, '2026-10-13', '58', 900)).rejects.toMatchObject({ code: 'duplicate_receipt' });
    await expect(scanned(b, '2026-10-13', '58', null)).rejects.toMatchObject({ code: 'duplicate_receipt' });
    expect((await scanned(b, '2026-10-13', '58', 1100)).counted).toBe(true);
  });

  it('cannot be raced by two students at once', async () => {
    const results = await Promise.allSettled([scanned(student, '2026-10-13', '57', 1700), typed(other, '2026-10-13', '57', 1700)]);
    expect(results.filter((r) => r.status === 'fulfilled')).toHaveLength(1);
    expect(results.find((r) => r.status === 'rejected')).toMatchObject({ reason: { code: 'duplicate_receipt' } });
  });
});
