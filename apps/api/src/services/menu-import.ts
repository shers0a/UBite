/* The day's menu as the canteen emails it: an Excel sheet (MENIU dd.mm.yyyy.xlsx) with the date
   above a table — Nr.Crt, DENUMIRE PREPARATE, GRAMAJ, ALERGENI, PRET STUDENTI U.B., PRET ANGAJATI
   U.B. — and the allergen legend under it. The canteen account uploads the file as it arrives; the
   rows land in the menu editor, ticked, and are published from there. An .xlsx is a zip of XML
   files, read here with node:zlib: the file is small, comes from a signed-in staff account, and
   needs only its first sheet. */
import zlib from 'node:zlib';
import type { Allergen, Category } from '@ubite/shared';
import { localDate } from '@ubite/shared';
import type { Ctx } from '../context';
import { HttpError } from '../context';
import { assertPublishable, setAllergens, staffCatalogue, writeDish } from './menu';

const MAX_PART_BYTES = 8 * 1024 * 1024;
const unreadable = () => new HttpError(422, 'menu_unreadable', 'This file is not the canteen menu as an .xlsx.');

/** The entries of a zip, by name: only the ones asked for, each capped once inflated. */
function unzip(buf: Buffer, wanted: (name: string) => boolean): Map<string, string> {
  let end = -1;
  for (let i = buf.length - 22; i >= Math.max(0, buf.length - 22 - 65_535); i--) {
    if (buf.readUInt32LE(i) === 0x06054b50) { end = i; break; }
  }
  if (end < 0) throw unreadable();
  const out = new Map<string, string>();
  let p = buf.readUInt32LE(end + 16);
  for (let n = buf.readUInt16LE(end + 10); n > 0; n--) {
    if (p + 46 > buf.length || buf.readUInt32LE(p) !== 0x02014b50) throw unreadable();
    const method = buf.readUInt16LE(p + 10);
    const size = buf.readUInt32LE(p + 20);
    const nameLen = buf.readUInt16LE(p + 28);
    const name = buf.toString('utf8', p + 46, p + 46 + nameLen);
    const local = buf.readUInt32LE(p + 42);
    p += 46 + nameLen + buf.readUInt16LE(p + 30) + buf.readUInt16LE(p + 32);
    if (!wanted(name)) continue;
    if (local + 30 > buf.length || buf.readUInt32LE(local) !== 0x04034b50) throw unreadable();
    const start = local + 30 + buf.readUInt16LE(local + 26) + buf.readUInt16LE(local + 28);
    const raw = buf.subarray(start, start + size);
    try {
      if (method === 0 && raw.length <= MAX_PART_BYTES) out.set(name, raw.toString('utf8'));
      else if (method === 8) out.set(name, zlib.inflateRawSync(raw, { maxOutputLength: MAX_PART_BYTES }).toString('utf8'));
      else throw unreadable();
    } catch { throw unreadable(); }
  }
  return out;
}

const decode = (s: string) => s
  .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
  .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(Number(d)))
  .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&amp;/g, '&');

/** The text of a cell or a shared string: its <t> runs, without the phonetic guides. */
const textOf = (xml: string) => [...xml.replace(/<rPh\b[\s\S]*?<\/rPh>/g, '').matchAll(/<t\b[^>]*>([\s\S]*?)<\/t>/g)].map((m) => decode(m[1])).join('');
const attr = (tag: string, name: string) => tag.match(new RegExp(`\\b${name}="([^"]*)"`))?.[1];

/** The first sheet as rows of cells by column letter. */
export function readSheet(file: Buffer): Map<number, Map<string, string>> {
  const parts = unzip(file, (n) => n === 'xl/workbook.xml' || n === 'xl/_rels/workbook.xml.rels' || n === 'xl/sharedStrings.xml' || n.startsWith('xl/worksheets/sheet'));
  const rid = attr(parts.get('xl/workbook.xml')?.match(/<sheet\b[^>]*>/)?.[0] ?? '', 'r:id');
  const rel = [...(parts.get('xl/_rels/workbook.xml.rels') ?? '').matchAll(/<Relationship\b[^>]*>/g)].map((m) => m[0]).find((r) => attr(r, 'Id') === rid);
  const target = rel ? attr(rel, 'Target') ?? '' : '';
  const sheet = parts.get(target.startsWith('/') ? target.slice(1) : `xl/${target}`) ?? parts.get('xl/worksheets/sheet1.xml');
  if (!sheet) throw unreadable();
  const shared = [...(parts.get('xl/sharedStrings.xml') ?? '').matchAll(/<si\b[^>]*?(?:\/>|>([\s\S]*?)<\/si>)/g)].map((m) => textOf(m[1] ?? ''));
  const rows = new Map<number, Map<string, string>>();
  for (const m of sheet.matchAll(/<c\b([^>]*?)(?:\/>|>([\s\S]*?)<\/c>)/g)) {
    const ref = attr(m[1], 'r')?.match(/^([A-Z]+)(\d+)$/);
    if (!ref || !m[2]) continue;
    const type = attr(m[1], 't');
    const v = m[2].match(/<v>([\s\S]*?)<\/v>/)?.[1];
    const value = type === 's' ? shared[Number(v)] ?? '' : type === 'inlineStr' ? textOf(m[2]) : decode(v ?? '');
    if (!value.trim()) continue;
    const row = Number(ref[2]);
    if (!rows.has(row)) rows.set(row, new Map());
    rows.get(row)!.set(ref[1], value);
  }
  return rows;
}

/* ── From the sheet's words to the catalogue's ─────────────────────────────────────────── */

/** The canteen numbers allergens its own way (the legend under every menu), not in Annex II order.
 *  shortcut: the legend as of Nov 2026 is fixed here; read it from the sheet if it ever changes. */
const CANTEEN_ALLERGENS: Allergen[] = [
  'celery', 'gluten', 'soybeans', 'nuts', 'mustard', 'sesame', 'eggs',
  'fish', 'milk', 'crustaceans', 'peanuts', 'sulphites', 'molluscs', 'lupin',
];

/** How a dish is recognised from one day's sheet to the next: its name without diacritics, case or
 *  punctuation. Stored on the dish, so a dish renamed for students is still found. */
export const importKey = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();

/** "400", "100-140" (the lower bound), "60/100/100" (the parts of one plate), "buc/100-110". */
export function gramsOf(g: string): number | null {
  const s = g.trim();
  if (/\d\s*m?l\b/i.test(s)) return null; // a drink, in litres
  const parts = s.split('/').map((x) => x.trim());
  const n = parts.length > 1 && parts.every((x) => /^\d+$/.test(x))
    ? parts.reduce((a, x) => a + Number(x), 0)
    : Number(s.match(/\d+/)?.[0] ?? NaN);
  return n >= 1 && n <= 5000 ? n : null;
}

/** "6.9", "4.5999999999999996", or a drink's "1.8 +0.5 sgr  2.3 total" (the total, deposit included). */
export function baniOf(v: string): number | null {
  const s = v.replace(/,/g, '.');
  const m = s.match(/(\d+(?:\.\d+)?)\s*total/i) ?? s.match(/(\d+(?:\.\d+)?)/);
  const bani = m ? Math.round(parseFloat(m[1]) * 100) : NaN;
  return bani > 0 && bani <= 100_000 ? bani : null;
}

/** Only for a dish the catalogue does not have yet; the canteen corrects it in the Catalogue. */
export function guessCategory(name: string, gramaj: string): Category {
  const k = importKey(name);
  if (/\d\s*m?l\b/i.test(gramaj) || /^(apa|coca|pepsi|fanta|sprite|prigat|fuzetea|suc|ceai|cafea|limonada|bere)\b/.test(k)) return 'drink';
  if (/^(buc|plic)\.?$/i.test(gramaj.trim())) return 'extra';
  if (/^(ciorba|supa|bors|supa crema)\b/.test(k)) return 'soup';
  if (/^salata\b/.test(k)) return 'salad';
  if (/^(orez cu lapte|clatite|papanasi|prajitura|tort|budinca|gogosi|chec|ecler|cozonac|placinta|desert|inghetata|briosa)\b/.test(k)) return 'dessert';
  if (/^(cartofi|piure|orez|legume|garnitura|mamaliga|varza calita)\b/.test(k)) return 'side';
  return 'main';
}

export interface MenuRow {
  key: string;
  name: string;
  gramaj: string;
  weightGrams: number | null;
  /** null: the cell was empty, so what the catalogue holds stands. [] : "-", nothing declared. */
  allergens: Allergen[] | null;
  priceBani: number;
}

export interface ParsedMenu { date: string | null; rows: MenuRow[]; skipped: string[] }

const DATE = /\b(\d{1,2})[./-](\d{1,2})[./-](\d{4})\b/;
function isoOf(m: RegExpMatchArray | null | undefined): string | null {
  if (!m) return null;
  const iso = `${m[3]}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}`;
  const d = new Date(`${iso}T12:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === iso ? iso : null;
}

export function parseMenu(file: Buffer, fileName = ''): ParsedMenu {
  const rows = readSheet(file);
  const order = [...rows.keys()].sort((a, b) => a - b);
  const headerAt = order.find((r) => [...rows.get(r)!.values()].some((v) => /denumire/i.test(v)));
  if (headerAt === undefined) throw unreadable();
  const header = rows.get(headerAt)!;
  const col = (re: RegExp) => [...header.entries()].find(([, v]) => re.test(v))?.[0];
  const nameCol = col(/denumire/i)!;
  const priceCol = col(/student/i) ?? col(/pre[tț]/i);
  const gramCol = col(/gramaj/i);
  const allergenCol = col(/alergen/i);
  const nrCol = col(/^\s*nr/i);
  if (!priceCol) throw unreadable();

  // The date sits above the table ("25.11.2026"); the file's name carries it too.
  const above = order.filter((r) => r < headerAt).flatMap((r) => [...rows.get(r)!.values()]);
  const date = above.map((v) => isoOf(v.match(DATE))).find(Boolean) ?? isoOf(fileName.match(DATE));

  const seen = new Map<string, number>();
  const raw: Array<Omit<MenuRow, 'key'> & { base: string }> = [];
  const skipped: string[] = [];
  for (const r of order.filter((x) => x > headerAt)) {
    const cells = rows.get(r)!;
    const name = (cells.get(nameCol) ?? '').replace(/\s+/g, ' ').trim();
    // Rows without a number are the legend and the cook's signature, not dishes.
    if (!name || (nrCol && !/^\d+$/.test((cells.get(nrCol) ?? '').trim()))) continue;
    const priceBani = baniOf(cells.get(priceCol) ?? '');
    if (priceBani === null) { skipped.push(name); continue; }
    const gramaj = (gramCol && cells.get(gramCol)?.trim()) || '';
    const declared = (allergenCol && cells.get(allergenCol)?.trim()) || '';
    const allergens = declared
      ? [...new Set((declared.match(/\d+/g) ?? []).map(Number).filter((n) => n >= 1 && n <= 14).map((n) => CANTEEN_ALLERGENS[n - 1]))]
      : null;
    const base = importKey(name);
    seen.set(base, (seen.get(base) ?? 0) + 1);
    raw.push({ base, name, gramaj, weightGrams: gramsOf(gramaj), allergens, priceBani });
  }
  // One name on several rows (a chicken leg in three sizes): each size is its own dish.
  const rowsOut = raw.map(({ base, ...row }) => (seen.get(base)! > 1
    ? { ...row, key: `${base} ${row.weightGrams ?? importKey(row.gramaj)}`.trim(), name: row.gramaj ? `${row.name} (${row.gramaj})` : row.name }
    : { ...row, key: base }));
  if (!rowsOut.length) throw unreadable();
  return { date, rows: rowsOut, skipped };
}

/** Finds or adds each row's dish, refreshes its price, weight and declared allergens, and returns
 *  the day's selection for the editor. Nothing is published here. */
export async function importMenu(ctx: Ctx, file: Buffer, fileName: string) {
  const parsed = parseMenu(file, fileName);
  const date = parsed.date ?? localDate(ctx.now());
  assertPublishable(ctx, date);
  const created: string[] = [];
  const items = await ctx.db.tx(async (q) => {
    const all = await q.query<{ id: string; name_ro: string; import_key: string | null }>('SELECT id, name_ro, import_key FROM dishes');
    const byKey = new Map(all.rows.filter((d) => d.import_key).map((d) => [d.import_key!, d.id]));
    // A name the sheet spells as the catalogue does matches too (and takes the row's key).
    const byName = new Map(all.rows.map((d) => [importKey(d.name_ro), d.id]));
    const out: Array<{ dishId: string; priceBani: number }> = [];
    for (const row of parsed.rows) {
      let id = byKey.get(row.key) ?? byName.get(row.key);
      if (id) {
        await q.query(
          `UPDATE dishes SET import_key = $2, default_price_bani = $3, weight_grams = COALESCE($4, weight_grams), is_active = true WHERE id = $1`,
          [id, row.key, row.priceBani, row.weightGrams],
        );
        if (row.allergens) await setAllergens(q, id, row.allergens.map((allergen) => ({ allergen, source: 'canteen_declared' as const })));
      } else {
        id = await writeDish(q, {
          nameRo: row.name, category: guessCategory(row.name, row.gramaj), defaultPriceBani: row.priceBani, weightGrams: row.weightGrams,
          allergens: (row.allergens ?? []).map((allergen) => ({ allergen, source: 'canteen_declared' as const })),
        });
        await q.query('UPDATE dishes SET import_key = $2 WHERE id = $1', [id, row.key]);
        created.push(row.name);
      }
      byName.delete(row.key);
      byKey.set(row.key, id);
      out.push({ dishId: id, priceBani: row.priceBani });
    }
    return out;
  });
  return { date, items, created, skipped: parsed.skipped, catalogue: await staffCatalogue(ctx.db) };
}
