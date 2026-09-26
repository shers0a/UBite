/* Reading a Romanian fiscal receipt (docs/09 "OCR"). The image is processed in memory and
   dropped as soon as the text is out; only the hash of the receipt's identity and the parsed
   fields survive. If parsing fails the student is asked for a clearer photo — never a silent
   acceptance, never a silent rejection — and manual entry of number and total is the fallback. */
import crypto from 'node:crypto';
import type { Logger } from 'pino';
import type { Config } from '../config';
import { prepareReceipt } from './receipt-image';

export interface ReceiptReader {
  /** OCR text of the photo — one text per preparation, separated by a form feed (\f). The buffer
   *  is zeroed afterwards. */
  read(image: Buffer): Promise<string>;
}

export interface ParsedReceipt {
  receiptNumber: string;
  totalBani: number | null;
  date: string | null;
  time: string | null;
  fiscalCode: string | null;
  deviceId: string | null;
  zNumber: string | null;
  items: Array<{ name: string; priceBani: number | null }>;
}

const KEYWORDS = /\b(SUB\s*TOTAL|TOTAL|TVA|NUMERAR|CARD|REST|PLATA|BON|FISCAL|C\.?I\.?F|C\.?U\.?I|COD|DATA|ORA|CASIER|NR|ID|UNIC|SERIE|SERIA|AMEF|VA MULTUMIM|MULTUMIM|Z\b)/;

function normalise(text: string): string[] {
  return text
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .toUpperCase()
    .split(/\r?\n/)
    .map((l) => l.replace(/[|]/g, ' ').replace(/\s+/g, ' ').trim())
    .filter(Boolean);
}

/** Letters Tesseract reads in place of digits on thermal print. */
const DIGITISH: Record<string, string> = { O: '0', Q: '0', D: '0', I: '1', L: '1', Z: '2', S: '5', B: '8', G: '6' };
const digits = (s: string) => s.replace(/[OQDILZSBG]/g, (c) => DIGITISH[c]);

/** A counter read off the receipt. Printers pad it with zeros, and a slashed or dotted zero comes
 *  back as "O", "E", "6" or "8": "0077" read as "8077". A canteen till prints a couple of thousand
 *  receipts on its busiest day, so leading look-alikes that push the receipt number past that are
 *  padding. (The Z counter grows for years: it gets no such cap.) */
const MAX_DAILY_NUMBER = 4999;
function counter(raw: string, max = MAX_DAILY_NUMBER): string {
  let d = raw.replace(/[OE]/g, '0');
  while (d.length > 1 && Number(d) > max && /^[0689]/.test(d)) d = d.slice(1);
  return String(Number(d));
}

/** Several readings of the same digits, column by column from the right. Where one reading saw a 0
 *  and another a 6, 8 or 9, the 0 wins: a slashed zero is misread as its look-alikes, a real 8 is
 *  not read as 0. Otherwise the majority, ties to the earlier reading. */
function voteDigits(readings: string[]): string {
  const width = Math.max(...readings.map((r) => r.length));
  const padded = readings.map((r) => r.padStart(width, '0'));
  let out = '';
  for (let i = 0; i < width; i++) {
    const col = padded.map((r) => r[i]);
    if (col.includes('0') && col.every((c) => '0689'.includes(c))) { out += '0'; continue; }
    const counts = new Map<string, number>();
    for (const c of col) counts.set(c, (counts.get(c) ?? 0) + 1);
    out += [...counts.entries()].reduce((a, b) => (b[1] > a[1] ? b : a))[0];
  }
  return out;
}

/** A counter from several readings: each cleaned of its padding first, then voted digit by digit. */
function voteCounter(raws: string[], max = MAX_DAILY_NUMBER): string | null {
  if (!raws.length) return null;
  return String(Number(voteDigits(raws.map((r) => counter(r, max)))));
}

/** "26,00" / "26.00" / "26.0O" / "26,ee" / "26, 00" → 2600 (a slashed zero reads as O or e). */
function money(s: string): number | null {
  const clean = s.replace(/[OE]/g, '0').replace(/\s/g, '').replace(',', '.');
  const m = clean.match(/^(\d{1,5})\.(\d{2})$/);
  return m ? Number(m[1]) * 100 + Number(m[2]) : null;
}
const MONEY = String.raw`(\d{1,5} ?[.,] ?[\dOE]{2})(?![\d.,])`;

/* Label variants seen on Romanian fiscal receipts, per AMEF make: "BF: 0045", "BF 00215",
   "BON FISCAL NR. 000482", "NR. BON FISCAL: 953", "BON NR. 12", "NR. DOCUMENT 7"; the till's fiscal
   series as "ID UNIC", "SERIA AMEF", "SERIE FISCALA", "S/N"; the operator as "C.I.F.", "CUI",
   "COD FISCAL"; "Z: 0342", "NR. Z: 1215". Every pattern stays on one line. */
const NUMBER_RE = /(?:^|[^A-Z])(?:NR\.? ?(?:BON(?: FISCAL)?|B\.?F\.?|DOC(?:UMENT)?)|NUMAR BON(?: FISCAL)?|BON(?: FISCAL)?(?: NR\.?| NUMAR| NO\.?)?|[BP8]\.?F\.?(?: NR\.?)?) ?[:#.]? ?([\dOE]{1,8})\b/;
const Z_RE = /(?:^|[^A-Z0-9])(?:NR\.? ?Z|RAPORT ?Z(?: NR\.?)?|Z(?: NR\.?)?) ?[:.]? ?([\dOE]{1,6})\b/;
const CIF_RE = /(?:^|[^A-Z])(?:C\.? ?I\.? ?F\.?|C\.? ?U\.? ?I\.?|CO[DP0] (?:DE )?(?:IDENTIFICARE )?FISCALA?|COD TVA) ?[:.;,]{0,3} ?(?:R[O0] ?)?(\d{2,10})\b/;
const DEVICE_RE = /(?:^|[^A-Z])(?:ID ?UNIC|SERI[AE] ?(?:AMEF|FISCALA)|S ?\/ ?N|NR\.? ?AMEF|COD ?AMEF|NR\.? ?INREG(?:ISTRARE)?) ?[:.;,]{0,3} ?([A-Z0-9£€$]{6,})/;

function firstMatch(lines: string[], re: RegExp): RegExpMatchArray | null {
  for (const l of lines) {
    const m = l.match(re);
    if (m) return m;
  }
  return null;
}

function validDate(y: number, m: number, d: number): string | null {
  if (m < 1 || m > 12 || d < 1 || d > 31 || y < 2020 || y > 2099) return null;
  const iso = `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
  return new Date(`${iso}T00:00:00Z`).getUTCDate() === d ? iso : null;
}

/** dd.mm.yyyy, dd/mm/yyyy, dd-mm-yyyy, dd.mm.yy or yyyy-mm-dd; the one on the date/time line wins. */
function findDate(lines: string[]): string | null {
  const candidates: Array<{ iso: string; labelled: boolean }> = [];
  for (const l of lines) {
    const fixed = l.replace(/\b[\dO]{1,4}[/.,-][\dO]{1,2}[/. -]{1,2}[\dO]{2,4}\b/g, (t) => t.replace(/O/g, '0'));
    for (const m of fixed.matchAll(/\b(\d{4})-(\d{2})-(\d{2})\b/g)) {
      const iso = validDate(Number(m[1]), Number(m[2]), Number(m[3]));
      if (iso) candidates.push({ iso, labelled: true });
    }
    for (const m of fixed.matchAll(/\b(\d{1,2})[/.,-](\d{1,2})(?:[/.-] ?| )(\d{4}|\d{2})\b/g)) {
      const y = Number(m[3].length === 2 ? `20${m[3]}` : m[3]);
      const iso = validDate(y, Number(m[2]), Number(m[1]));
      if (iso) candidates.push({ iso, labelled: /DATA/.test(l) || /\d{2} ?: ?\d{2}/.test(l) });
    }
  }
  return (candidates.find((c) => c.labelled) ?? candidates[0])?.iso ?? null;
}

const amountOn = (l: string) => {
  const all = [...l.matchAll(new RegExp(MONEY, 'g'))];
  return all.length ? money(all[all.length - 1][1]) : null;
};

/** The amount on the TOTAL line — never SUBTOTAL, never the VAT total — with or without currency
 *  and dot leaders. */
function totalLine(lines: string[]): number | null {
  for (const l of lines) {
    if (/SUB ?T[O0]TAL|TVA|T[O0]TAL (?:TAXE|ART)/.test(l)) continue;
    if (/^T[O0]TAL(?: LEI| RON| DE PLATA| GENERAL)?\b/.test(l)) {
      const v = amountOn(l);
      if (v !== null) return v;
    }
  }
  return null;
}

/** The TOTAL line; when it is unreadable, the subtotal, or what was paid. */
function findTotal(lines: string[]): number | null {
  const total = totalLine(lines);
  if (total !== null) return total;
  const labelled = (re: RegExp) => {
    for (const l of lines) {
      if (!re.test(l)) continue;
      const v = amountOn(l);
      if (v !== null) return v;
    }
    return null;
  };
  const sub = labelled(/^SUB ?T[O0]TAL\b/);
  if (sub !== null) return sub;
  const card = labelled(/^(?:PLATA )?CARD\b/);
  if (card !== null) return card;
  const cash = labelled(/^NUMERAR\b/);
  return cash !== null ? cash - (labelled(/^REST\b/) ?? 0) : null;
}

function findTime(lines: string[]): string | null {
  let first: string | null = null;
  for (const l of lines) {
    const m = l.match(/\b([01]\d|2[0-3]) ?: ?([0-5]\d)(?: ?: ?[0-5]\d)?\b/);
    if (!m) continue;
    const t = `${m[1]}:${m[2]}`;
    // The line with the date, or labelled ORA, is the issue time; anything else is a fallback.
    if (/ORA|DATA|\d[/.-]\d{1,2}[/.-]\d/.test(l)) return t;
    first ??= t;
  }
  return first;
}

const ITEM_LINE = /^([A-Z][A-Z0-9 .,'/-]{2,}?)\s+(\d+[.,]\d{2})\s*[A-E8]?$/;

function findItems(lines: string[]): ParsedReceipt['items'] {
  const items: ParsedReceipt['items'] = [];
  for (let i = 0; i < lines.length; i++) {
    const l = lines[i];
    if (/^(?:SUB ?)?T[O0]TAL/.test(l)) break;
    // "1.000 BUC x 9,50" or "2 x 9,50   19,00 B": the dish name is on the line before or after.
    const qty = l.match(/^\d+(?:[.,]\d{3})?\s*(?:BUC\.?|KG|PORT\.?)?\s*[X*]\s*(\d+[.,]\d{2})(?:\s+(\d+[.,]\d{2}))?\s*[A-E8]?$/);
    if (qty) {
      const after = lines[i + 1]?.match(ITEM_LINE);
      if (after && !KEYWORDS.test(after[1])) {
        items.push({ name: titleCase(after[1]), priceBani: money(after[2]) });
        i++;
        continue;
      }
      const prev = lines[i - 1];
      if (prev && !KEYWORDS.test(prev) && /[A-Z]{3}/.test(prev) && !ITEM_LINE.test(prev)) {
        items.push({ name: titleCase(prev), priceBani: money(qty[2] ?? qty[1]) });
      }
      continue;
    }
    const inline = l.match(ITEM_LINE);
    if (inline && !KEYWORDS.test(inline[1])) items.push({ name: titleCase(inline[1]), priceBani: money(inline[2]) });
  }
  return items;
}

/** Every field one reading has; the receipt number may be missing here and found by another. */
function parseOne(text: string): Omit<ParsedReceipt, 'receiptNumber'> & { receiptNumber: string | null; raw: { number: string | null; z: string | null; total: number | null } } {
  const lines = normalise(text);
  const number = firstMatch(lines, NUMBER_RE);
  const cif = firstMatch(lines, CIF_RE);
  const device = firstMatch(lines, DEVICE_RE);
  const z = firstMatch(lines, Z_RE);
  return {
    receiptNumber: number ? counter(number[1]) : null,
    totalBani: findTotal(lines),
    date: findDate(lines),
    time: findTime(lines),
    fiscalCode: cif ? cif[1] : null,
    deviceId: device ? device[1].replace(/[£€]/g, 'E').replace(/\$/g, 'S') : null,
    zNumber: z ? counter(z[1], Infinity) : null,
    items: findItems(lines),
    raw: { number: number ? number[1] : null, z: z ? z[1] : null, total: totalLine(lines) },
  };
}

const VOTED = ['receiptNumber', 'totalBani', 'date', 'time', 'fiscalCode', 'deviceId', 'zNumber'] as const;

/** One or several OCR readings of the same photo, separated by \f. Each field is taken by
 *  majority across the readings that have it — ties go to the earlier reading — so one reading's
 *  misread digit is outvoted by the others. The items come from the reading that found most. */
export function parseReceipt(text: string): ParsedReceipt | null {
  const readings = text.split('').map(parseOne);
  const out = { ...readings[0] };
  for (const f of VOTED) {
    const counts = new Map<string, { value: (typeof out)[typeof f]; n: number }>();
    for (const r of readings) {
      if (r[f] === null) continue;
      const c = counts.get(String(r[f])) ?? { value: r[f], n: 0 };
      c.n++;
      counts.set(String(r[f]), c);
    }
    let best: { value: (typeof out)[typeof f]; n: number } | null = null;
    for (const c of counts.values()) if (!best || c.n > best.n) best = c;
    Object.assign(out, { [f]: best ? best.value : null });
  }
  if (readings.length > 1) {
    out.receiptNumber = voteCounter(readings.map((r) => r.raw.number).filter((x): x is string => !!x));
    out.zNumber = voteCounter(readings.map((r) => r.raw.z).filter((x): x is string => !!x), Infinity);
    // The total digit by digit across the readings of the TOTAL line, 0 over its look-alikes.
    const totals = readings.map((r) => r.raw.total).filter((x): x is number => x !== null);
    if (totals.length >= 2) out.totalBani = Number(voteDigits(totals.map(String)));
  }
  out.items = readings.reduce((a, r) => (r.items.length > a.length ? r.items : a), readings[0].items);
  const { raw: _raw, receiptNumber, ...fields } = out;
  // No receipt number in any reading: not a receipt we can count — ask for a clearer photo.
  return receiptNumber === null ? null : { ...fields, receiptNumber };
}

function titleCase(s: string) {
  const t = s.toLowerCase().replace(/\s+/g, ' ').trim();
  return t.charAt(0).toUpperCase() + t.slice(1);
}

/** Same length, at most one character different: one misread digit. */
const oneSlip = (a: string, b: string) => a.length === b.length && [...a].filter((c, i) => c !== b[i]).length <= 1;

/** docs/09: the receipt must come from the canteen. With the canteen's fiscal code(s) configured,
 *  the code read must be one of them — a single misread digit is forgiven and corrected. Returns
 *  the code to record, 'missing' when none was read, or 'other' for another shop's receipt. */
export function matchFiscalCode(read: string | null, allowed: string[]): string | 'missing' | 'other' {
  if (!read) return 'missing';
  if (!allowed.length) return read;
  if (allowed.includes(read)) return read;
  const near = allowed.filter((c) => oneSlip(c, read));
  return near.length === 1 ? near[0] : 'other';
}

/** Digits a thermal font and Tesseract confuse with each other. */
const LOOKALIKE = new Set(['08', '80', '06', '60', '09', '90', '17', '71', '38', '83', '56', '65']);

/** The receipt's date is `date`, allowing one digit misread as its look-alike ("10" as "18"):
 *  telling a student their receipt is not from today when it is, is the worse mistake. */
export function readsAsDate(read: string, date: string): boolean {
  if (read === date) return true;
  if (read.length !== date.length) return false;
  const diff = [...read].map((c, i) => c + date[i]).filter((pair) => pair[0] !== pair[1]);
  return diff.length === 1 && LOOKALIKE.has(diff[0]);
}

/** What makes a receipt unique: the day, the till and the receipt number — the number alone
 *  restarts every day on every till. The till's series is folded to digits, so the same receipt
 *  read twice, once "O" and once "0", is still the same receipt. The fiscal code and the Z number
 *  add nothing the day and the till do not already say, and every extra field is one more chance
 *  for two scans of one receipt to disagree. */
export function receiptIdentity(p: { receiptNumber: string; date: string | null; deviceId?: string | null }): string {
  const n = String(Number(p.receiptNumber.replace(/\D/g, '')) || p.receiptNumber.trim());
  const device = p.deviceId ? digits(p.deviceId.toUpperCase()).replace(/[^0-9A-Z]/g, '') : '';
  return ['v2', p.date || '', device, n].join('|');
}

/** docs/05: SHA-256 of the normalised receipt identity. Global uniqueness sits on this. */
export function hashReceipt(identity: string): string {
  return crypto.createHash('sha256').update(`ubite-receipt|${identity}`).digest('hex');
}

/* ── Tesseract ────────────────────────────────────────────────────────────────────────── */

export function createTesseractReader(cfg: Config, log: Logger): ReceiptReader {
  let worker: Promise<any> | null = null;
  const getWorker = () => {
    if (!worker) {
      worker = (async () => {
        const { createWorker } = await import('tesseract.js');
        return createWorker('ron', 1, {
          ...(cfg.OCR_LANG_PATH ? { langPath: cfg.OCR_LANG_PATH, gzip: false } : {}),
          cachePath: cfg.OCR_CACHE_PATH,
        });
      })().catch((e) => { worker = null; throw e; });
    }
    return worker;
  };
  return {
    async read(image) {
      const sharp = (await import('sharp')).default;
      let prepared: Buffer[] = [];
      try {
        prepared = await prepareReceipt(sharp, image);
        const w = await getWorker();
        const texts: string[] = [];
        for (const p of prepared) texts.push(String((await w.recognize(p)).data.text || ''));
        return texts.join('\f');
      } catch (e: any) {
        log.warn({ err: e?.message }, 'receipt OCR failed');
        return '';
      } finally {
        image.fill(0);
        for (const p of prepared) p.fill(0);
      }
    },
  };
}
