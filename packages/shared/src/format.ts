/* Money is stored in bani (docs/05) and shown in lei: "9" for whole amounts, "9,50" otherwise. */

export function formatLei(bani: number, lang: 'ro' | 'en' = 'ro'): string {
  const whole = bani % 100 === 0;
  return new Intl.NumberFormat(lang === 'ro' ? 'ro-RO' : 'en-GB', {
    minimumFractionDigits: whole ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(bani / 100);
}

/** "12,50", "12.5", "12" → 1250 bani. Null when it is not a price. */
export function parseLei(input: string | number): number | null {
  if (typeof input === 'number') return Number.isFinite(input) && input >= 0 ? Math.round(input * 100) : null;
  const clean = input.trim().replace(/\s/g, '').replace(',', '.');
  if (!/^\d{1,4}(\.\d{1,2})?$/.test(clean)) return null;
  return Math.round(Number(clean) * 100);
}

/** Wait minutes are shown as whole minutes, never with decimals and never as a percentage. */
export function roundMinutes(m: number): number {
  return Math.max(0, Math.round(m));
}
