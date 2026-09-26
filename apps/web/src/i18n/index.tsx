import React from 'react';
import type { Lang } from '@ubite/shared';
import { en, ro, type StringKey } from './strings';

const DICTS: Record<Lang, Record<StringKey, string>> = { ro, en };

export function translate(lang: Lang, key: StringKey, vars?: Record<string, string | number>): string {
  const s = DICTS[lang][key] ?? ro[key] ?? key;
  return vars ? s.replace(/\{(\w+)\}/g, (_, k) => (vars[k] === undefined ? `{${k}}` : String(vars[k]))) : s;
}

/** True when the dictionary has this key — for API error codes mapped to copy. */
export function hasString(key: string): key is StringKey {
  return key in ro;
}

export function initialLang(): Lang {
  try {
    const saved = localStorage.getItem('ubite.lang');
    if (saved === 'ro' || saved === 'en') return saved;
  } catch { /* storage unavailable */ }
  // Default from the browser language (docs/03 F19).
  return (navigator.language || 'ro').toLowerCase().startsWith('en') ? 'en' : 'ro';
}

interface I18n {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: StringKey, vars?: Record<string, string | number>) => string;
}

const Ctx = React.createContext<I18n>({ lang: 'ro', setLang: () => {}, t: (k) => ro[k] });

export function I18nProvider({ children, onChange }: { children: React.ReactNode; onChange?: (l: Lang) => void }) {
  const [lang, setLangState] = React.useState<Lang>(initialLang);
  const setLang = React.useCallback((l: Lang) => {
    setLangState(l);
    try { localStorage.setItem('ubite.lang', l); } catch { /* ignore */ }
    onChange?.(l);
  }, [onChange]);
  React.useEffect(() => {
    // The language attribute switches with the interface (docs/11).
    document.documentElement.lang = lang;
  }, [lang]);
  const value = React.useMemo<I18n>(() => ({ lang, setLang, t: (key, vars) => translate(lang, key, vars) }), [lang, setLang]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useI18n() {
  return React.useContext(Ctx);
}

/** "un minut", "6 minute", "20 de minute" · "a minute", "6 minutes". */
export function minutesText(n: number, lang: Lang) {
  const m = Math.max(0, Math.round(n));
  if (lang === 'en') return m <= 1 ? 'a minute' : `${m} minutes`;
  return m <= 1 ? 'un minut' : m >= 20 ? `${m} de minute` : `${m} minute`;
}

/* ── Formatting in Europe/Bucharest ─────────────────────────────────────────────────────── */

const TZ = 'Europe/Bucharest';
const loc = (lang: Lang) => (lang === 'ro' ? 'ro-RO' : 'en-GB');

export function formatTime(iso: string | Date, lang: Lang) {
  return new Intl.DateTimeFormat(loc(lang), { timeZone: TZ, hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).format(new Date(iso));
}

/** "marți, 13 oct" */
export function formatDayShort(date: string, lang: Lang) {
  return new Intl.DateTimeFormat(loc(lang), { timeZone: 'UTC', weekday: 'long', day: 'numeric', month: 'short' })
    .format(new Date(`${date}T12:00:00Z`)).replace('.', '');
}

/** "marți, 13 octombrie" */
export function formatDayLong(date: string, lang: Lang) {
  return new Intl.DateTimeFormat(loc(lang), { timeZone: 'UTC', weekday: 'long', day: 'numeric', month: 'long' }).format(new Date(`${date}T12:00:00Z`));
}

export function formatDate(date: string, lang: Lang) {
  return new Intl.DateTimeFormat(loc(lang), { timeZone: 'UTC', day: 'numeric', month: 'long' }).format(new Date(`${date}T12:00:00Z`));
}

export function weekdayName(weekday: number, lang: Lang, form: 'plain' | 'plural' = 'plain') {
  const ro = ['luni', 'marți', 'miercuri', 'joi', 'vineri', 'sâmbătă', 'duminică'];
  const roPlural = ['lunea', 'marțea', 'miercurea', 'joia', 'vinerea', 'sâmbăta', 'duminica'];
  const en = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const enPlural = ['Mondays', 'Tuesdays', 'Wednesdays', 'Thursdays', 'Fridays', 'Saturdays', 'Sundays'];
  const list = lang === 'ro' ? (form === 'plural' ? roPlural : ro) : form === 'plural' ? enPlural : en;
  return list[(weekday - 1 + 7) % 7];
}
