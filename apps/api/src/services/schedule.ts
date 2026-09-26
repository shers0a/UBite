/* Opening hours gate the crowding level, wait reports and the loyalty window (docs/20). They
   are read from canteen_schedule + schedule_exceptions, and cached for a few seconds. */
import type { ScheduleDay, ScheduleException } from '@ubite/shared';
import { DEFAULT_SCHEDULE, hoursOn, isOpenAt, localDate, nextOpening } from '@ubite/shared';
import type { Queryable } from '../db/index';

export interface Schedule {
  days: ScheduleDay[];
  exceptions: ScheduleException[];
}

let cache: { at: number; value: Schedule } | null = null;

export function invalidateSchedule() {
  cache = null;
}

const hhmm = (t: string | null) => (t ? t.slice(0, 5) : null);

export async function loadSchedule(db: Queryable, force = false): Promise<Schedule> {
  if (!force && cache && Date.now() - cache.at < 15_000) return cache.value;
  const days = await db.query<{ weekday: number; opens_at: string | null; closes_at: string | null; is_closed: boolean }>(
    'SELECT weekday, opens_at::text, closes_at::text, is_closed FROM canteen_schedule ORDER BY weekday',
  );
  const ex = await db.query<{ service_date: string; is_closed: boolean; opens_at: string | null; closes_at: string | null; note: string | null }>(
    `SELECT service_date, is_closed, opens_at::text, closes_at::text, note FROM schedule_exceptions
     WHERE service_date >= current_date - 1 ORDER BY service_date`,
  );
  const value: Schedule = {
    days: days.rows.length
      ? days.rows.map((r) => ({ weekday: r.weekday, opensAt: hhmm(r.opens_at), closesAt: hhmm(r.closes_at), isClosed: r.is_closed }))
      : DEFAULT_SCHEDULE,
    exceptions: ex.rows.map((r) => ({ date: r.service_date, isClosed: r.is_closed, opensAt: hhmm(r.opens_at), closesAt: hhmm(r.closes_at), note: r.note })),
  };
  cache = { at: Date.now(), value };
  return value;
}

export async function openNow(db: Queryable, now: Date) {
  const s = await loadSchedule(db);
  return isOpenAt(now, s.days, s.exceptions);
}

export function scheduleFacts(s: Schedule, now: Date) {
  const today = localDate(now);
  return {
    today,
    open: isOpenAt(now, s.days, s.exceptions),
    todayHours: hoursOn(today, s.days, s.exceptions),
    nextOpening: nextOpening(now, s.days, s.exceptions),
  };
}

/** True when `at` falls inside the hours of its own day. */
export function withinHours(s: Schedule, at: Date, graceMinutes = 0): boolean {
  if (isOpenAt(at, s.days, s.exceptions)) return true;
  if (!graceMinutes) return false;
  return isOpenAt(new Date(at.getTime() - graceMinutes * 60_000), s.days, s.exceptions);
}
