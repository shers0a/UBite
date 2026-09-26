/* Everything is stored in UTC and rendered in Europe/Bucharest (docs/05). These helpers are the
   only place that converts between the two, and they have no dependency: Intl does the work. */

export const TZ = 'Europe/Bucharest';

export interface ZonedParts {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
  /** ISO weekday: 1 = Monday … 7 = Sunday. */
  weekday: number;
}

const partsFormatter = new Intl.DateTimeFormat('en-GB', {
  timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit',
  hour: '2-digit', minute: '2-digit', second: '2-digit', weekday: 'short', hourCycle: 'h23',
});
const WEEKDAYS: Record<string, number> = { Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6, Sun: 7 };

export function zonedParts(d: Date): ZonedParts {
  const p: Record<string, string> = {};
  for (const part of partsFormatter.formatToParts(d)) p[part.type] = part.value;
  return {
    year: Number(p.year), month: Number(p.month), day: Number(p.day),
    hour: Number(p.hour) % 24, minute: Number(p.minute), second: Number(p.second),
    weekday: WEEKDAYS[p.weekday] ?? 1,
  };
}

const pad = (n: number) => String(n).padStart(2, '0');

/** The calendar date in Bucharest, as YYYY-MM-DD. */
export function localDate(d: Date = new Date()): string {
  const p = zonedParts(d);
  return `${p.year}-${pad(p.month)}-${pad(p.day)}`;
}

/** Minutes since local midnight in Bucharest. */
export function localMinutes(d: Date = new Date()): number {
  const p = zonedParts(d);
  return p.hour * 60 + p.minute;
}

export function parseHHMM(s: string): number {
  const [h, m] = s.split(':').map(Number);
  return h * 60 + (m || 0);
}

export function formatHHMM(minutes: number): string {
  const m = ((Math.round(minutes) % 1440) + 1440) % 1440;
  return `${pad(Math.floor(m / 60))}:${pad(m % 60)}`;
}

/** ISO weekday of a YYYY-MM-DD date (calendar arithmetic, no time zone involved). */
export function weekdayOf(date: string): number {
  const [y, m, d] = date.split('-').map(Number);
  const w = new Date(Date.UTC(y, m - 1, d)).getUTCDay();
  return w === 0 ? 7 : w;
}

export function addDays(date: string, days: number): string {
  const [y, m, d] = date.split('-').map(Number);
  const t = new Date(Date.UTC(y, m - 1, d + days));
  return `${t.getUTCFullYear()}-${pad(t.getUTCMonth() + 1)}-${pad(t.getUTCDate())}`;
}

/** The UTC instant of a Bucharest wall-clock time. Handles both DST transitions. */
export function zonedToUtc(date: string, hhmm: string): Date {
  const [y, mo, d] = date.split('-').map(Number);
  const mins = parseHHMM(hhmm);
  const guess = Date.UTC(y, mo - 1, d, Math.floor(mins / 60), mins % 60);
  let t = guess;
  for (let i = 0; i < 2; i++) {
    const p = zonedParts(new Date(t));
    const asUtc = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second);
    t = guess - (asUtc - t);
  }
  return new Date(t);
}

/* ── Opening hours (docs/05 canteen_schedule, confirmed Mon–Fri 11:30–17:00) ─────────────── */

export interface ScheduleDay {
  /** ISO weekday 1–7. */
  weekday: number;
  opensAt: string | null;
  closesAt: string | null;
  isClosed: boolean;
}

/** A one-day override — a closure or shorter hours — kept apart from the weekly pattern. */
export interface ScheduleException {
  date: string;
  isClosed: boolean;
  opensAt: string | null;
  closesAt: string | null;
  note: string | null;
}

export const DEFAULT_SCHEDULE: ScheduleDay[] = [1, 2, 3, 4, 5, 6, 7].map((weekday) => ({
  weekday,
  opensAt: weekday <= 5 ? '11:30' : null,
  closesAt: weekday <= 5 ? '17:00' : null,
  isClosed: weekday > 5,
}));

export interface DayHours {
  opensAt: string;
  closesAt: string;
}

export function hoursOn(date: string, schedule: ScheduleDay[], exceptions: ScheduleException[] = []): DayHours | null {
  const ex = exceptions.find((e) => e.date === date);
  if (ex) {
    if (ex.isClosed || !ex.opensAt || !ex.closesAt) return null;
    return { opensAt: ex.opensAt, closesAt: ex.closesAt };
  }
  const day = schedule.find((s) => s.weekday === weekdayOf(date));
  if (!day || day.isClosed || !day.opensAt || !day.closesAt) return null;
  return { opensAt: day.opensAt, closesAt: day.closesAt };
}

export function isOpenAt(now: Date, schedule: ScheduleDay[], exceptions: ScheduleException[] = []): boolean {
  const h = hoursOn(localDate(now), schedule, exceptions);
  if (!h) return false;
  const m = localMinutes(now);
  return m >= parseHHMM(h.opensAt) && m < parseHHMM(h.closesAt);
}

/** The next moment the canteen opens, strictly after `now`, looking two weeks ahead. */
export function nextOpening(now: Date, schedule: ScheduleDay[], exceptions: ScheduleException[] = []): Date | null {
  const today = localDate(now);
  for (let i = 0; i < 15; i++) {
    const date = addDays(today, i);
    const h = hoursOn(date, schedule, exceptions);
    if (!h) continue;
    const at = zonedToUtc(date, h.opensAt);
    if (at.getTime() > now.getTime()) return at;
  }
  return null;
}

/** "L–V 11:30–17:00" when every open day shares the same hours; otherwise one range per group. */
export function hoursSummary(schedule: ScheduleDay[], lang: 'ro' | 'en'): string {
  const names = lang === 'ro' ? ['L', 'Ma', 'Mi', 'J', 'V', 'S', 'D'] : ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const open = schedule.filter((d) => !d.isClosed && d.opensAt && d.closesAt).sort((a, b) => a.weekday - b.weekday);
  if (!open.length) return lang === 'ro' ? 'Închis' : 'Closed';
  const groups: Array<{ from: number; to: number; hours: string }> = [];
  for (const d of open) {
    const hours = `${d.opensAt}–${d.closesAt}`;
    const last = groups[groups.length - 1];
    if (last && last.hours === hours && last.to === d.weekday - 1) last.to = d.weekday;
    else groups.push({ from: d.weekday, to: d.weekday, hours });
  }
  if (lang === 'ro' && groups.length === 1 && groups[0].from === 1 && groups[0].to === 5) return `L–V ${groups[0].hours}`;
  return groups
    .map((g) => `${names[g.from - 1]}${g.to !== g.from ? `–${names[g.to - 1]}` : ''} ${g.hours}`)
    .join(', ');
}
