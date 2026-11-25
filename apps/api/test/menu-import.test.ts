import zlib from 'node:zlib';
import request from 'supertest';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { appFor, lastCode, testContext, type TestCtx } from './helpers';
import { baniOf, gramsOf, guessCategory, parseMenu } from '../src/services/menu-import';

let ctx: TestCtx;
let app: ReturnType<typeof appFor>;
const H = { 'X-UBite': '1' };

beforeEach(async () => {
  ctx = await testContext();
  app = appFor(ctx);
});
afterEach(async () => { await ctx.db.close(); });

/** A zip of deflated entries, as Excel writes them. */
function zip(files: Record<string, string>): Buffer {
  const locals: Buffer[] = [];
  const central: Buffer[] = [];
  let offset = 0;
  for (const [name, text] of Object.entries(files)) {
    const data = Buffer.from(text, 'utf8');
    const packed = zlib.deflateRawSync(data);
    const n = Buffer.from(name, 'utf8');
    const crc = zlib.crc32(data);
    const local = Buffer.alloc(30);
    local.writeUInt32LE(0x04034b50, 0); local.writeUInt16LE(20, 4); local.writeUInt16LE(8, 8);
    local.writeUInt32LE(crc, 14); local.writeUInt32LE(packed.length, 18); local.writeUInt32LE(data.length, 22); local.writeUInt16LE(n.length, 26);
    const cd = Buffer.alloc(46);
    cd.writeUInt32LE(0x02014b50, 0); cd.writeUInt16LE(20, 4); cd.writeUInt16LE(20, 6); cd.writeUInt16LE(8, 10);
    cd.writeUInt32LE(crc, 16); cd.writeUInt32LE(packed.length, 20); cd.writeUInt32LE(data.length, 24); cd.writeUInt16LE(n.length, 28); cd.writeUInt32LE(offset, 42);
    locals.push(local, n, packed);
    central.push(cd, n);
    offset += 30 + n.length + packed.length;
  }
  const cdBuf = Buffer.concat(central);
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0); end.writeUInt16LE(central.length / 2, 8); end.writeUInt16LE(central.length / 2, 10);
  end.writeUInt32LE(cdBuf.length, 12); end.writeUInt32LE(offset, 16);
  return Buffer.concat([...locals, cdBuf, end]);
}

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/** The canteen's sheet: title and date above the table, the legend and the cook's name under it.
 *  Text goes to shared strings, numbers stay numbers (with Excel's float noise). */
function menuXlsx(date: string, dishes: Array<[string | number, string, string | number, string | number, string | number]>) {
  const strings: string[] = [];
  const cell = (ref: string, v: string | number | undefined) => {
    if (v === undefined || v === '') return '';
    if (typeof v === 'number') return `<c r="${ref}"><v>${v}</v></c>`;
    strings.push(v);
    return `<c r="${ref}" t="s"><v>${strings.length - 1}</v></c>`;
  };
  const row = (r: number, values: Array<string | number | undefined>) =>
    `<row r="${r}">${values.map((v, i) => cell(`${'ABCDEF'[i]}${r}`, v)).join('')}</row>`;
  const rows = [
    row(11, ['MENIU']), row(12, [date]),
    row(15, ['Nr.Crt', 'DENUMIRE PREPARATE', 'GRAMAJ', 'ALERGENI', 'PRET STUDENTI U.B.', 'PRET ANGAJATI U.B.']),
    ...dishes.map((d, i) => row(16 + i, [d[0], d[1], d[2], d[3], d[4], 9.99])),
    row(16 + dishes.length, ['* - preparatul provine din produs congelat; 1 - Țelină; 2 - Gluten; 3 - Soia']),
    row(19 + dishes.length, [undefined, 'Bucătar']), row(20 + dishes.length, [undefined, 'Nume Prenume']),
  ];
  return zip({
    '[Content_Types].xml': '<?xml version="1.0"?><Types/>',
    'xl/workbook.xml': '<workbook><sheets><sheet name="Sheet1" sheetId="1" r:id="rId1"/></sheets></workbook>',
    'xl/_rels/workbook.xml.rels': '<Relationships><Relationship Id="rId1" Type="worksheet" Target="worksheets/sheet1.xml"/></Relationships>',
    'xl/worksheets/sheet1.xml': `<worksheet><sheetData>${rows.join('')}</sheetData></worksheet>`,
    'xl/sharedStrings.xml': `<sst>${strings.map((s) => `<si><t xml:space="preserve">${esc(s)}</t></si>`).join('')}</sst>`,
  });
}

const DAY = menuXlsx('13.10.2026', [
  [1, 'Ciorbă de fasole boabe', 400, '1; 2; 3; 4;\n 5; 6; 7; 9', 3.4],
  [2, 'Pulpe de pui la cuptor', '140-160 /1buc', '*; 1; 2; 3; 5; 7; 9', 5.7],
  [3, 'Pulpe de pui la cuptor', '180-200/ 1 buc', '*; 1; 2; 3; 5; 7; 9', 6.8],
  [4, 'Ciulama de pui cu mămăliguță', '60/100/100', '*; 1; 2; 5; 7; 9', 5.5],
  [5, 'Ceafă de porc la grătar', 80, '*', 6.8],
  [6, 'Cartofi prăjiți pai', 150, '*', 4.0999999999999996],
  [7, 'Salată de varză murată', 100, '', 2.1],
  [8, 'Apă plată/ 0.5l', '0.5L', '', '1.8 +0.5 sgr  2.3 total'],
  [9, 'Tacâm. Unică fol.', 'Buc', '', 0.9],
  [10, 'Ciolan afumat la tigaie', 110, '-', ''],
]);

describe('reading the canteen sheet', () => {
  it('turns its words into prices, grams and allergens', () => {
    expect(baniOf('4.5999999999999996')).toBe(460);
    expect(baniOf('7.3+0.5sgr  7.80 total')).toBe(780);
    expect(baniOf('Buc')).toBeNull();
    expect(gramsOf('100-140')).toBe(100);
    expect(gramsOf('60/100/100')).toBe(260);
    expect(gramsOf('buc/100-110')).toBe(100);
    expect(gramsOf('0.5L')).toBeNull();
    expect(gramsOf('Plic')).toBeNull();
    expect(guessCategory('Ciorbă de porc', '400')).toBe('soup');
    expect(guessCategory('Orez cu lapte', '250')).toBe('dessert');
    expect(guessCategory('Orez cu legume', '200')).toBe('side');
    expect(guessCategory('Caserolă salată 550 ml', 'Buc')).toBe('extra');
    expect(guessCategory('Prigat 0.5l', '0.5L')).toBe('drink');
    expect(guessCategory('Cordon Bleu', '125')).toBe('main');
  });

  it('reads the date, the dishes and the canteen allergen numbers, and nothing under the table', () => {
    const m = parseMenu(DAY, 'MENIU 13.10.2026.xlsx');
    expect(m.date).toBe('2026-10-13');
    expect(m.skipped).toEqual(['Ciolan afumat la tigaie']); // no price on its row
    expect(m.rows.map((r) => r.name)).toEqual([
      'Ciorbă de fasole boabe', 'Pulpe de pui la cuptor (140-160 /1buc)', 'Pulpe de pui la cuptor (180-200/ 1 buc)',
      'Ciulama de pui cu mămăliguță', 'Ceafă de porc la grătar', 'Cartofi prăjiți pai', 'Salată de varză murată', 'Apă plată/ 0.5l', 'Tacâm. Unică fol.',
    ]);
    const soup = m.rows[0];
    // The canteen's legend: 1 celery, 2 gluten, 3 soy, 4 hazelnuts, 5 mustard, 6 sesame, 7 eggs, 9 milk.
    expect(soup.allergens).toEqual(['celery', 'gluten', 'soybeans', 'nuts', 'mustard', 'sesame', 'eggs', 'milk']);
    expect(soup).toMatchObject({ weightGrams: 400, priceBani: 340 });
    expect(m.rows[1].key).toBe('pulpe de pui la cuptor 140');
    expect(m.rows[4].allergens).toEqual([]); // "*": frozen, no allergen
    expect(m.rows[6].allergens).toBeNull(); // empty: not declared on the sheet
    expect(m.rows[7]).toMatchObject({ priceBani: 230, weightGrams: null });
  });

  it('refuses a file that is not the menu sheet', () => {
    expect(() => parseMenu(Buffer.from('not a zip'))).toThrow(/menu/i);
    const other = zip({ 'xl/workbook.xml': '<workbook/>', 'xl/worksheets/sheet1.xml': '<worksheet><sheetData/></worksheet>' });
    expect(() => parseMenu(other)).toThrow(/menu/i);
  });
});

describe('uploading the menu (canteen account)', () => {
  async function staff() {
    await ctx.db.query("INSERT INTO users (email, role) VALUES ('cantina@unibuc.ro', 'canteen_staff')");
    const agent = request.agent(app);
    await agent.post('/api/auth/request-code').set(H).send({ email: 'cantina@unibuc.ro' }).expect(200);
    await agent.post('/api/auth/verify').set(H).send({ email: 'cantina@unibuc.ro', code: lastCode(ctx, 'cantina@unibuc.ro') }).expect(200);
    return agent;
  }
  const upload = (agent: ReturnType<typeof request.agent>, file: Buffer, name = 'MENIU 13.10.2026.xlsx') =>
    agent.post('/api/staff/menu/import').set(H).attach('menu', file, name);

  it('fills the editor without publishing; the next day finds the same dishes, even renamed', async () => {
    const existing = (await ctx.db.query<{ id: string }>(
      "INSERT INTO dishes (name_ro, name_en, category, default_price_bani) VALUES ('Cartofi prajiti pai', 'Fries', 'side', 300) RETURNING id",
    )).rows[0].id;
    const agent = await staff();
    const r = await upload(agent, DAY).expect(200);
    expect(r.body.date).toBe('2026-10-13');
    expect(r.body.items).toHaveLength(9);
    expect(r.body.created).toHaveLength(8); // the fries were already in the catalogue
    expect(r.body.items).toContainEqual({ dishId: existing, priceBani: 410 });
    const byName = new Map<string, any>(r.body.catalogue.map((d: any) => [d.nameRo, d]));
    expect(byName.get('Cartofi prajiti pai')).toMatchObject({ defaultPriceBani: 410, weightGrams: 150, category: 'side' });
    expect(byName.get('Ciorbă de fasole boabe')).toMatchObject({ category: 'soup', weightGrams: 400 });
    expect(byName.get('Ciorbă de fasole boabe').allergens.map((a: any) => a.allergen)).toContain('celery');
    expect(byName.get('Apă plată/ 0.5l')).toMatchObject({ category: 'drink', defaultPriceBani: 230 });
    expect(byName.get('Tacâm. Unică fol.').category).toBe('extra');
    // Nothing is published until the canteen presses Publish.
    expect((await request(app).get('/api/menu/today').expect(200)).body.menu).toBeNull();

    await agent.post('/api/staff/menu').set(H).send({ date: r.body.date, items: r.body.items }).expect(200);
    const today = await request(app).get('/api/menu/today').expect(200);
    expect(today.body.menu.items).toHaveLength(9);

    // Renamed for students in the Catalogue: the next sheet still finds it, and adds nothing.
    const water = byName.get('Apă plată/ 0.5l').id;
    await agent.patch(`/api/staff/dishes/${water}`).set(H).send({ nameRo: 'Apă plată 0,5 l', category: 'drink', defaultPriceBani: 230 }).expect(200);
    const again = await upload(agent, DAY).expect(200);
    expect(again.body.created).toEqual([]);
    expect(again.body.items).toContainEqual({ dishId: water, priceBani: 230 });
  });

  it('keeps what the sheet leaves empty, and says when the file or the day is wrong', async () => {
    const agent = await staff();
    await upload(agent, DAY).expect(200);
    const salad = (await ctx.db.query<{ id: string }>("SELECT id FROM dishes WHERE name_ro = 'Salată de varză murată'")).rows[0].id;
    await ctx.db.query("INSERT INTO dish_allergens (dish_id, allergen) VALUES ($1, 'mustard')", [salad]);
    await upload(agent, DAY).expect(200);
    expect((await ctx.db.query('SELECT allergen FROM dish_allergens WHERE dish_id = $1', [salad])).rows).toEqual([{ allergen: 'mustard' }]);

    expect((await upload(agent, Buffer.from('%PDF-1.4'), 'meniu.pdf')).body.error).toBe('menu_unreadable');
    const old = await upload(agent, menuXlsx('01.09.2026', [[1, 'Ciorbă de porc', 400, '1', 6.1]]));
    expect(old.status).toBe(422);
    expect(old.body.error).toBe('date_out_of_range');
  });

  it('is for the canteen account only', async () => {
    const agent = request.agent(app);
    await agent.post('/api/auth/request-code').set(H).send({ email: 'ana.pop@s.unibuc.ro' }).expect(200);
    await agent.post('/api/auth/verify').set(H).send({ email: 'ana.pop@s.unibuc.ro', code: lastCode(ctx, 'ana.pop@s.unibuc.ro') }).expect(200);
    expect((await upload(agent, DAY)).status).toBe(403);
  });
});
