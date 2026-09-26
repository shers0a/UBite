/* docs/09 "OCR": what the reader must get out of a Romanian fiscal receipt, on the layouts real
   fiscal printers use, with the mistakes Tesseract really makes on thermal print (measured with
   scripts/ocr-bench.ts) — and the whole path through the API: photo, draft, confirm, counted. */
import request from 'supertest';
import { afterEach, describe, expect, it } from 'vitest';
import { hashReceipt, matchFiscalCode, parseReceipt, readsAsDate, receiptIdentity } from '../src/services/receipt';
import { appFor, lastCode, testContext, type TestCtx } from './helpers';

const DATECS = `UNIVERSITATEA DIN BUCURESTI
CANTINA M. KOGALNICEANU
C.I.F.: RO4505375
1.000 BUC x 9,50
CIORBA DE PERISOARE 9,50 B
1.000 BUC x 17,00
PUI LA CUPTOR CU CARTOFI 17,00 B
SUBTOTAL 26,50
TOTAL 26,50
CARD 26,50
TVA B 11,00% 2,63
TOTAL TVA 2,63
Z: 0342 BF: 0057
13-10-2026 12:43:18
ID UNIC: DA4400012345
BON FISCAL`;

const STORNO = `CANTINA STUDENTEASCA SRL
CUI: RO4505375
Str. Mihail Kogalniceanu nr. 36
Ciorba De Burta
1 x 12,00 12,00 B
TVA 11% 1,19
TOTAL .................... 12,00 RON
Plata CARD
BON FISCAL Nr. 000482
Seria AMEF: AB123456789
Z: 0101
Data: 13.10.2026 Ora: 12:05`;

const KAUFLAND = `CANTINA KOGALNICEANU
COD FISCAL: RO4505375
PILAF CU LEGUME 11.00 B
2 BUC x 4.00
APA PLATA 0.5L 8.00 B
TOTAL LEI 19.00
NUMERAR 20.00
REST 1.00
BF 00215 13.10.2026 14:37
Z 0620 S/N: ED4747386469
BON FISCAL`;

const TREMOL = `S.C. CANTINA UB S.R.L.
Cod fiscal: RO4505375
SNITEL DE PUI 15.50 B
TOTAL: 15.50 LEI
Nr. bon fiscal: 953
Nr. Z: 1215
Data: 2026-10-13 13:11
Serie fiscala: DA2506106370`;

describe('reading the layouts fiscal printers use', () => {
  it('Datecs: "BF: 0057", "Z: 0342", "ID UNIC", date with dashes', () => {
    expect(parseReceipt(DATECS)).toMatchObject({
      receiptNumber: '57', zNumber: '342', date: '2026-10-13', time: '12:43', totalBani: 2650,
      fiscalCode: '4505375', deviceId: 'DA4400012345',
      items: [{ name: 'Ciorba de perisoare', priceBani: 950 }, { name: 'Pui la cuptor cu cartofi', priceBani: 1700 }],
    });
  });
  it('"BON FISCAL Nr.", "CUI", "Seria AMEF", a TOTAL with dot leaders', () => {
    expect(parseReceipt(STORNO)).toMatchObject({
      receiptNumber: '482', zNumber: '101', date: '2026-10-13', time: '12:05', totalBani: 1200, fiscalCode: '4505375', deviceId: 'AB123456789',
    });
  });
  it('"BF 00215" with date and time on one line, "COD FISCAL", "S/N"', () => {
    expect(parseReceipt(KAUFLAND)).toMatchObject({
      receiptNumber: '215', zNumber: '620', date: '2026-10-13', time: '14:37', totalBani: 1900, fiscalCode: '4505375', deviceId: 'ED4747386469',
    });
  });
  it('"Nr. bon fiscal", "Nr. Z", ISO date, "Serie fiscala"', () => {
    expect(parseReceipt(TREMOL)).toMatchObject({
      receiptNumber: '953', zNumber: '1215', date: '2026-10-13', time: '13:11', totalBani: 1550, fiscalCode: '4505375', deviceId: 'DA2506106370',
    });
  });
  it('gives up without a receipt number — never a silent acceptance', () => {
    expect(parseReceipt('TOTAL LEI 26,00\nDATA: 13/10/2026')).toBeNull();
    expect(parseReceipt('')).toBeNull();
  });
});

describe('the mistakes OCR makes on thermal print', () => {
  it('takes the subtotal, or what was paid, when the TOTAL line is unreadable', () => {
    expect(parseReceipt(DATECS.replace('TOTAL 26,50', 'T0TAI. 2g,5'))!.totalBani).toBe(2650);
    expect(parseReceipt(KAUFLAND.replace('TOTAL LEI 19.00', 'TOTAI LEL'))!.totalBani).toBe(1900); // 20.00 − 1.00 rest
  });
  it('reads a slashed zero as zero: "47,ee" is 47,00, "BON FISCAL Nr. eee205" is 205', () => {
    const p = parseReceipt(STORNO.replace('12,00 RON', '12,ee RON').replace('Nr. 000482', 'Nr. eee482'))!;
    expect(p.totalBani).toBe(1200);
    expect(p.receiptNumber).toBe('482');
  });
  it('drops zero padding misread as 8s past what a till prints in a day', () => {
    expect(parseReceipt(STORNO.replace('Nr. 000482', 'Nr. 880482'))!.receiptNumber).toBe('482');
  });
  it('takes each field by majority across readings, and 0 over its look-alikes digit by digit', () => {
    const a = KAUFLAND.replace('BF 00215', 'BF 88215').replace('COD FISCAL: RO4505375', 'COD FISCAL: RO4585375');
    const b = KAUFLAND.replace('BF 00215', 'BF 00215');
    const c = KAUFLAND.replace('BF 00215', 'BF 08215').replace('S/N: ED4747386469', 'S/N: ED4747386489');
    const p = parseReceipt([a, b, c].join('\f'))!;
    expect(p.receiptNumber).toBe('215');
    expect(p.fiscalCode).toBe('4505375');
    expect(p.deviceId).toBe('ED4747386469');
  });
  it('reads a zero-padded number past what a till prints in a day as padding: "8077" is 77', () => {
    expect(parseReceipt(DATECS.replace('BF: 0057', 'BF: 8057'))!.receiptNumber).toBe('57');
    expect(parseReceipt(DATECS.replace('BF: 0057', 'BF: 1234'))!.receiptNumber).toBe('1234');
  });
  it('votes the total digit by digit across readings, 0 over its look-alikes', () => {
    const a = DATECS.replace('TOTAL 26,50', 'TOTAL 26,56');
    const b = DATECS.replace('TOTAL 26,50', 'TOTAL 26,56');
    const c = DATECS;
    expect(parseReceipt([a, b, c].join(''))!.totalBani).toBe(2650);
  });
  it('finds the fields in a reading that missed the receipt number', () => {
    const noNumber = TREMOL.replace('Nr. bon fiscal: 953', '');
    const noCode = TREMOL.replace('Cod fiscal: RO4505375', '');
    expect(parseReceipt([noCode, noNumber].join('\f'))).toMatchObject({ receiptNumber: '953', fiscalCode: '4505375' });
  });
  it('accepts a date one look-alike digit away from today, and nothing else', () => {
    expect(readsAsDate('2026-10-13', '2026-10-13')).toBe(true);
    expect(readsAsDate('2026-18-13', '2026-10-13')).toBe(true); // 0 read as 8
    expect(readsAsDate('2026-10-12', '2026-10-13')).toBe(false); // yesterday
    expect(readsAsDate('2026-18-18', '2026-10-13')).toBe(false);
  });
  it('knows the canteen by its fiscal code, forgiving one misread digit', () => {
    expect(matchFiscalCode('4505375', ['4505375'])).toBe('4505375');
    expect(matchFiscalCode('4585375', ['4505375'])).toBe('4505375');
    expect(matchFiscalCode('14543901', ['4505375'])).toBe('other');
    expect(matchFiscalCode(null, ['4505375'])).toBe('missing');
    expect(matchFiscalCode('14543901', [])).toBe('14543901'); // not configured: any shop
  });
  it('hashes one receipt the same however its number and series were read', () => {
    const a = hashReceipt(receiptIdentity({ receiptNumber: '0421', date: '2026-10-13', deviceId: 'DA44OOO12345' }));
    const b = hashReceipt(receiptIdentity({ receiptNumber: '421', date: '2026-10-13', deviceId: 'DA4400012345' }));
    expect(a).toBe(b);
    expect(a).not.toBe(hashReceipt(receiptIdentity({ receiptNumber: '421', date: '2026-10-14', deviceId: 'DA4400012345' })));
    expect(a).not.toBe(hashReceipt(receiptIdentity({ receiptNumber: '421', date: '2026-10-13', deviceId: 'DA4400012399' })));
  });
});

describe('adding a visit from a photo (docs/09, docs/18 "Add visit")', () => {
  let ctx: TestCtx;
  afterEach(async () => { await ctx.db.close(); });
  const H = { 'X-UBite': '1' };
  const photo = Buffer.from('a photo, read by the fake OCR');

  async function student(email: string, env: Record<string, string> = {}) {
    ctx ??= await testContext(env);
    const agent = request.agent(appFor(ctx));
    await agent.post('/api/auth/request-code').set(H).send({ email }).expect(200);
    await agent.post('/api/auth/verify').set(H).send({ email, code: lastCode(ctx, email) }).expect(200);
    return agent;
  }
  const scan = (agent: request.Agent, text: string) => { ctx.ocrText = text; return agent.post('/api/me/visits/scan').set(H).attach('receipt', photo, 'receipt.jpg'); };

  it('reads, shows the draft, and counts the visit on confirm — once per receipt, across students', async () => {
    ctx = await testContext({ RECEIPT_FISCAL_CODES: '4505375' });
    const ana = await student('ana.pop@s.unibuc.ro');
    const draft = await scan(ana, DATECS).expect(200);
    expect(draft.body).toMatchObject({ receiptNumber: '57', totalBani: 2650, date: '2026-10-13', time: '12:43' });
    const done = await ana.post('/api/me/visits').set(H).send({ draftToken: draft.body.token }).expect(201);
    expect(done.body).toMatchObject({ counted: true, loyalty: { filled: 1 } });

    // A friend photographs the same receipt: the till series read with an O, a date digit misread.
    const ion = await student('ion.ionescu@s.unibuc.ro');
    const again = await scan(ion, DATECS.replace('DA4400012345', 'DA44OOO12345').replace('13-10-2026', '18-10-2026')).expect(200);
    const dup = await ion.post('/api/me/visits').set(H).send({ draftToken: again.body.token });
    expect(dup.status).toBe(409);
    expect(dup.body.error).toBe('duplicate_receipt');
  });

  it('refuses another shop’s receipt once the canteen’s fiscal code is set', async () => {
    ctx = await testContext({ RECEIPT_FISCAL_CODES: '4505375' });
    const ana = await student('ana.pop@s.unibuc.ro');
    const r = await scan(ana, DATECS.replace('RO4505375', 'RO14543901'));
    expect(r.status).toBe(422);
    expect(r.body.error).toBe('receipt_other_shop');
  });

  it('asks for a clearer photo when the number, the date or the fiscal code cannot be read', async () => {
    ctx = await testContext({ RECEIPT_FISCAL_CODES: '4505375' });
    const ana = await student('ana.pop@s.unibuc.ro');
    for (const text of ['', DATECS.replace('BF: 0057', ''), DATECS.replace('13-10-2026 12:43:18', ''), DATECS.replace('C.I.F.: RO4505375', '')]) {
      const r = await scan(ana, text);
      expect(r.status).toBe(422);
      expect(r.body.error).toBe('unreadable');
    }
  });

  it('says so at once when the receipt is not from today', async () => {
    ctx = await testContext();
    const ana = await student('ana.pop@s.unibuc.ro');
    const r = await scan(ana, DATECS.replace('13-10-2026', '12-10-2026'));
    expect(r.status).toBe(422);
    expect(r.body.error).toBe('receipt_not_today');
  });
});
